import { GameConfig } from '../../config/GameConfig';
import { isButton, isElement, mountTemplate, queryElement } from '../mountTemplate';
import { muteLabel } from '../muteLabel';
import { setText } from '../setText';
import type { HudModel } from './HudModel';
import { RefreshGate } from './RefreshGate';
import template from './Hud.html?raw';
import './Hud.css';

export class Hud {
  readonly element: HTMLElement;
  private readonly gate = new RefreshGate(0.25);
  private readonly board: HTMLElement;
  private readonly you: HTMLElement;
  private readonly feed: HTMLElement;
  private readonly lengthEl: HTMLElement;
  private readonly rankEl: HTMLElement;
  private readonly killsEl: HTMLElement;
  private readonly toast: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly boostButton: HTMLButtonElement;
  private readonly rows: HTMLElement[] = [];
  private readonly ranks: HTMLElement[] = [];
  private readonly names: HTMLElement[] = [];
  private readonly masses: HTMLElement[] = [];
  private readonly feedItems: HTMLElement[] = [];
  private readonly feedLines: string[] = [];

  constructor(
    private readonly onBoost: (held: boolean) => void,
    private readonly onMute: () => void,
  ) {
    this.element = mountTemplate(template);
    this.board = queryElement(this.element, '[data-board]', isElement);
    this.you = queryElement(this.element, '[data-you]', isElement);
    this.feed = queryElement(this.element, '[data-feed]', isElement);
    this.lengthEl = queryElement(this.element, '[data-length]', isElement);
    this.rankEl = queryElement(this.element, '[data-rank]', isElement);
    this.killsEl = queryElement(this.element, '[data-kills]', isElement);
    this.toast = queryElement(this.element, '[data-toast]', isElement);
    this.muteButton = queryElement(this.element, '[data-mute]', isButton);
    this.boostButton = queryElement(this.element, '[data-boost]', isButton);
    this.buildRows();
    this.buildFeed();
    this.muteButton.addEventListener('click', () => this.onMute());
    this.boostButton.addEventListener('pointerdown', this.onBoostDown);
    this.boostButton.addEventListener('pointerup', this.onBoostUp);
    this.boostButton.addEventListener('pointercancel', this.onBoostUp);
  }

  open(): void {
    this.gate.reset();
    this.element.classList.add('is-on');
  }

  close(): void {
    this.element.classList.remove('is-on');
    this.onBoost(false);
  }

  setMuted(muted: boolean): void {
    setText(this.muteButton, muteLabel(muted));
    this.muteButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  enableTouch(): void {
    this.element.classList.add('touch-mode');
  }

  resetSession(): void {
    this.feedLines.length = 0;
    this.paintFeed();
    this.toast.classList.remove('is-on');
    setText(this.toast, '');
    this.gate.reset();
  }

  update(dt: number, model: HudModel): void {
    if (!this.element.classList.contains('is-on')) return;
    if (!this.gate.ready(dt)) return;
    this.paint(model);
  }

  showToast(text: string): void {
    this.toast.classList.remove('is-on');
    setText(this.toast, text);
    void this.toast.offsetWidth;
    this.toast.classList.add('is-on');
  }

  pushFeed(text: string): void {
    this.feedLines.unshift(text);
    if (this.feedLines.length > this.feedItems.length) this.feedLines.length = this.feedItems.length;
    this.paintFeed();
  }

  private paint(model: HudModel): void {
    const entries = model.board.entries;
    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      const rank = this.ranks[i];
      const name = this.names[i];
      const mass = this.masses[i];
      const entry = entries[i];
      if (!row || !rank || !name || !mass) continue;
      if (!entry) {
        row.hidden = true;
        continue;
      }
      row.hidden = false;
      row.classList.toggle('is-player', entry.isPlayer);
      setText(rank, String(entry.rank));
      setText(name, entry.name);
      setText(mass, String(Math.round(entry.mass)));
    }
    const player = model.board.player;
    const inTop = player !== null && entries.some((entry) => entry.id === player.id);
    if (!player || inTop) {
      this.you.hidden = true;
    } else {
      this.you.hidden = false;
      setText(this.you, `#${player.rank} You  ${Math.round(player.mass)}`);
    }
    setText(this.lengthEl, `Your length: ${model.length}`);
    setText(this.rankEl, player ? `Rank ${player.rank} of ${model.board.total}` : 'Rank – of –');
    setText(this.killsEl, `Kills: ${model.kills}`);
  }

  private paintFeed(): void {
    for (let i = 0; i < this.feedItems.length; i++) {
      const item = this.feedItems[i];
      if (!item) continue;
      const line = this.feedLines[i];
      if (!line) {
        item.hidden = true;
        continue;
      }
      item.hidden = false;
      setText(item, line);
    }
  }

  private buildRows(): void {
    for (let i = 0; i < GameConfig.leaderboard.size; i++) {
      const row = document.createElement('li');
      const rank = document.createElement('span');
      const name = document.createElement('span');
      const mass = document.createElement('span');
      rank.className = 'b-rank';
      name.className = 'b-name';
      mass.className = 'b-mass';
      row.append(rank, name, mass);
      row.hidden = true;
      this.board.append(row);
      this.rows.push(row);
      this.ranks.push(rank);
      this.names.push(name);
      this.masses.push(mass);
    }
  }

  private buildFeed(): void {
    for (let i = 0; i < 4; i++) {
      const item = document.createElement('li');
      item.hidden = true;
      this.feed.append(item);
      this.feedItems.push(item);
    }
  }

  private readonly onBoostDown = (event: PointerEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.boostButton.setPointerCapture(event.pointerId);
    this.onBoost(true);
  };

  private readonly onBoostUp = (event: PointerEvent): void => {
    if (this.boostButton.hasPointerCapture(event.pointerId)) this.boostButton.releasePointerCapture(event.pointerId);
    this.onBoost(false);
  };
}
