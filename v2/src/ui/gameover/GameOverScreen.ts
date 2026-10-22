import { isButton, isElement, mountTemplate, queryElement } from '../mountTemplate';
import { setText } from '../setText';
import type { GameOverStats } from './GameOverStats';
import template from './GameOverScreen.html?raw';
import './GameOverScreen.css';

export class GameOverScreen {
  readonly element: HTMLElement;
  private readonly causeEl: HTMLElement;
  private readonly lengthEl: HTMLElement;
  private readonly killsEl: HTMLElement;
  private readonly rankEl: HTMLElement;
  private readonly timeEl: HTMLElement;
  private readonly bestEl: HTMLElement;
  private readonly badgeEl: HTMLElement;

  constructor(
    private readonly onAgain: () => void,
    private readonly onMenu: () => void,
  ) {
    this.element = mountTemplate(template);
    this.causeEl = queryElement(this.element, '[data-cause]', isElement);
    this.lengthEl = queryElement(this.element, '[data-length]', isElement);
    this.killsEl = queryElement(this.element, '[data-kills]', isElement);
    this.rankEl = queryElement(this.element, '[data-rank]', isElement);
    this.timeEl = queryElement(this.element, '[data-time]', isElement);
    this.bestEl = queryElement(this.element, '[data-best]', isElement);
    this.badgeEl = queryElement(this.element, '[data-badge]', isElement);
    queryElement(this.element, '[data-again]', isButton).addEventListener('click', () => this.onAgain());
    queryElement(this.element, '[data-menu]', isButton).addEventListener('click', () => this.onMenu());
  }

  get isOpen(): boolean {
    return this.element.classList.contains('is-open');
  }

  open(stats: GameOverStats): void {
    setText(this.causeEl, stats.cause);
    setText(this.lengthEl, String(stats.length));
    setText(this.killsEl, String(stats.kills));
    setText(this.rankEl, stats.bestRank === null ? '—' : `#${stats.bestRank}`);
    setText(this.timeEl, stats.timeAlive);
    setText(this.bestEl, `Best: ${stats.bestScore}`);
    this.badgeEl.hidden = !stats.isNewBest;
    this.element.classList.add('is-open');
  }

  close(): void {
    this.element.classList.remove('is-open');
  }
}
