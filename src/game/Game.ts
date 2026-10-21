import { BotPopulation } from '../ai/BotPopulation';
import { SoundEngine } from '../audio/SoundEngine';
import { GameConfig } from '../config/GameConfig';
import { findSkin } from '../content/skins/skinCatalog';
import type { GameEvent } from '../core/contracts/GameEvent';
import type { SnakeDiedEvent } from '../core/contracts/SnakeDiedEvent';
import { clamp } from '../core/math/scalars';
import { SeededRandom } from '../core/random/SeededRandom';
import { InputManager } from '../input/InputManager';
import { isTypingTarget } from '../input/isTypingTarget';
import { PlayerController } from '../input/PlayerController';
import { Renderer } from '../render/Renderer';
import { Preferences } from '../storage/Preferences';
import { GameOverScreen } from '../ui/gameover/GameOverScreen';
import type { GameOverStats } from '../ui/gameover/GameOverStats';
import { Hud } from '../ui/hud/Hud';
import { MenuScreen } from '../ui/menu/MenuScreen';
import { PauseOverlay } from '../ui/pause/PauseOverlay';
import { World } from '../core/world/World';
import { formatDeathCause, formatKillFeed } from './deathText';
import type { GamePhase } from './GamePhase';
import { rankSnakes } from './leaderboard/rankSnakes';
import type { LeaderboardSnapshot } from './leaderboard/LeaderboardSnapshot';
import { playerName } from './playerName';
import { formatDuration } from './stats/formatDuration';
import { LifeStats } from './stats/LifeStats';
import { topSnakeId } from './topSnakeId';

const maxFrameSeconds = 0.1;
const deathRevealSeconds = 1.2;

export class Game {
  private readonly preferences = new Preferences();
  private readonly sound = new SoundEngine();
  private readonly life = new LifeStats();
  private readonly world: World;
  private readonly bots: BotPopulation;
  private readonly renderer: Renderer;
  private readonly input: InputManager;
  private readonly player: PlayerController;
  private readonly menu: MenuScreen;
  private readonly hud: Hud;
  private readonly gameOver: GameOverScreen;
  private readonly pause: PauseOverlay;
  private readonly notable = new Set<number>();
  private phase: GamePhase = 'menu';
  private playerId: number | null = null;
  private paused = false;
  private started = false;
  private lastTime = 0;
  private deathTimer = 0;
  private revealOver = false;
  private pending: GameOverStats | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly uiRoot: HTMLElement,
  ) {
    const rng = new SeededRandom();
    this.world = new World(rng);
    this.bots = new BotPopulation(this.world, rng);
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);
    this.input.setAimResolver((x, y) => this.renderer.screenToWorld(x, y));
    this.input.setGestureListener(() => this.sound.unlock());
    this.player = new PlayerController(this.input);
    this.sound.setMuted(this.preferences.muted);
    this.menu = new MenuScreen(
      this.preferences,
      () => this.beginLife(),
      () => this.toggleMute(),
    );
    this.hud = new Hud(
      (held) => this.input.setBoostButton(held),
      () => this.toggleMute(),
    );
    this.gameOver = new GameOverScreen(
      () => this.beginLife(),
      () => this.returnToMenu(),
    );
    this.pause = new PauseOverlay();
    this.input.setTouchListener(() => {
      this.uiRoot.classList.add('touch-mode');
      this.hud.enableTouch();
    });
    this.hud.setMuted(this.preferences.muted);
    this.uiRoot.append(this.menu.element, this.hud.element, this.pause.element, this.gameOver.element);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.bots.populate();
    this.rememberNotable();
    this.input.attach();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.renderer.resize();
    this.menu.open();
    requestAnimationFrame(this.onFrame);
  }

  private onFrame = (now: number): void => {
    requestAnimationFrame(this.onFrame);
    if (document.hidden) {
      this.lastTime = 0;
      return;
    }
    if (this.lastTime === 0) {
      this.lastTime = now;
      return;
    }
    const dt = clamp((now - this.lastTime) / 1000, 0, maxFrameSeconds);
    this.lastTime = now;
    this.tick(dt);
  };

  private tick(dt: number): void {
    this.sound.update(dt);
    if (this.phase === 'playing' && this.paused) {
      this.sound.setBoosting(false);
      this.renderer.render(this.world, this.currentFocus(), 0);
      return;
    }
    this.advance(dt);
    this.renderer.render(this.world, this.currentFocus(), dt);
  }

  private advance(dt: number): void {
    if (this.phase === 'playing') this.sampleLife(dt);
    const events = this.world.update(dt);
    this.bots.update(dt, events);
    this.renderer.ingest(events);
    this.route(events);
    const board = rankSnakes(this.world.snakes, GameConfig.leaderboard.size);
    this.remember(board);
    this.advanceDeath(dt);
    if (this.phase !== 'playing') {
      this.sound.setBoosting(false);
      return;
    }
    this.hud.update(dt, {
      board,
      length: this.playerLength(),
      kills: this.playerKills(),
    });
    const snake = this.playerId === null ? undefined : this.world.getSnake(this.playerId);
    this.sound.setBoosting(Boolean(snake?.alive && snake.boosting));
  }

  private sampleLife(dt: number): void {
    if (this.playerId === null) return;
    const snake = this.world.getSnake(this.playerId);
    if (!snake?.alive) return;
    this.life.addTime(dt);
    this.life.recordMass(snake.mass);
    const board = rankSnakes(this.world.snakes, GameConfig.leaderboard.size);
    if (board.player) this.life.recordRank(board.player.rank);
  }

  private route(events: readonly GameEvent[]): void {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event || this.phase !== 'playing') continue;
      if (event.type === 'foodEaten') {
        if (event.snakeId === this.playerId) this.sound.playEat();
        continue;
      }
      if (event.type !== 'snakeDied') continue;
      if (event.killerId === this.playerId && event.snakeId !== this.playerId) {
        this.life.recordKill();
        this.sound.playKill();
        this.hud.showToast(`You ate ${event.name}!`);
      }
      if (this.notable.has(event.snakeId)) {
        this.hud.pushFeed(formatKillFeed(event.name, event.cause, event.killerName));
      }
      if (event.isPlayer && event.snakeId === this.playerId) this.endLife(event);
    }
  }

  private advanceDeath(dt: number): void {
    if (this.phase !== 'dead' || !this.revealOver || !this.pending) return;
    this.deathTimer += dt;
    if (this.deathTimer < deathRevealSeconds) return;
    this.revealOver = false;
    this.gameOver.open(this.pending);
  }

  private beginLife(): void {
    if (this.phase === 'playing') return;
    this.sound.unlock();
    this.preferences.nickname = this.menu.nickname;
    this.preferences.skinId = this.menu.skinId;
    this.sound.playClick();
    const snake = this.world.spawnSnake({
      name: playerName(this.preferences.nickname),
      skin: findSkin(this.preferences.skinId),
      controller: this.player,
      isPlayer: true,
    });
    this.playerId = snake.id;
    this.life.start();
    this.paused = false;
    this.revealOver = false;
    this.pending = null;
    this.deathTimer = 0;
    this.phase = 'playing';
    this.menu.close();
    this.gameOver.close();
    this.pause.close();
    this.hud.resetSession();
    this.hud.setMuted(this.preferences.muted);
    this.hud.open();
  }

  private endLife(event: SnakeDiedEvent): void {
    this.life.recordMass(event.finalMass);
    const summary = this.life.stop();
    const length = Number.isFinite(event.finalMass) ? Math.max(0, Math.round(event.finalMass)) : 0;
    const isNewBest = length > this.preferences.bestScore;
    if (isNewBest) this.preferences.bestScore = length;
    const kills = Math.max(summary.kills, Number.isFinite(event.kills) ? event.kills : 0);
    const seconds = Number.isFinite(event.survivedSeconds) ? event.survivedSeconds : summary.survivedSeconds;
    this.pending = {
      length,
      kills,
      bestRank: summary.bestRank,
      timeAlive: formatDuration(seconds),
      cause: formatDeathCause(event.cause, event.killerName),
      bestScore: this.preferences.bestScore,
      isNewBest,
    };
    this.phase = 'dead';
    this.paused = false;
    this.revealOver = true;
    this.deathTimer = 0;
    this.sound.setBoosting(false);
    this.sound.playDeath();
    this.pause.close();
    this.hud.close();
    this.menu.setBest(this.preferences.bestScore);
  }

  private returnToMenu(): void {
    this.sound.unlock();
    this.sound.playClick();
    this.phase = 'menu';
    this.paused = false;
    this.playerId = null;
    this.revealOver = false;
    this.pending = null;
    this.pause.close();
    this.gameOver.close();
    this.hud.close();
    this.menu.setBest(this.preferences.bestScore);
    this.menu.setMuted(this.preferences.muted);
    this.menu.open();
  }

  private togglePause(): void {
    if (this.phase !== 'playing') return;
    this.paused = !this.paused;
    this.sound.setBoosting(false);
    if (this.paused) this.pause.open();
    else this.pause.close();
  }

  private toggleMute(): void {
    this.sound.unlock();
    const next = !this.preferences.muted;
    if (next) this.sound.playClick();
    this.preferences.muted = next;
    this.sound.setMuted(next);
    if (!next) this.sound.playClick();
    this.hud.setMuted(next);
    this.menu.setMuted(next);
  }

  private currentFocus(): number | null {
    if (this.phase === 'menu') return topSnakeId(this.world.snakes);
    return this.playerId;
  }

  private playerLength(): number {
    if (this.playerId === null) return 0;
    const snake = this.world.getSnake(this.playerId);
    if (!snake) return 0;
    return Math.max(0, Math.round(snake.mass));
  }

  private playerKills(): number {
    if (this.playerId === null) return 0;
    return this.world.getSnake(this.playerId)?.kills ?? 0;
  }

  private rememberNotable(): void {
    this.remember(rankSnakes(this.world.snakes, GameConfig.leaderboard.size));
  }

  private remember(board: LeaderboardSnapshot): void {
    this.notable.clear();
    for (let i = 0; i < board.entries.length; i++) {
      const entry = board.entries[i];
      if (entry) this.notable.add(entry.id);
    }
  }

  private onResize = (): void => {
    this.renderer.resize();
  };

  private onVisibility = (): void => {
    this.lastTime = 0;
    if (!document.hidden) return;
    this.input.releaseAll();
    this.sound.setBoosting(false);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (event.key === 'Enter') {
      if (event.target instanceof HTMLButtonElement) return;
      if (this.phase === 'menu' || (this.phase === 'dead' && this.gameOver.isOpen)) {
        event.preventDefault();
        this.beginLife();
      }
      return;
    }
    if (isTypingTarget(event.target)) return;
    if (event.key === 'm' || event.key === 'M') {
      event.preventDefault();
      this.toggleMute();
      return;
    }
    if (this.phase === 'playing' && (event.key === 'Escape' || event.key === 'p' || event.key === 'P')) {
      event.preventDefault();
      this.togglePause();
    }
  };
}
