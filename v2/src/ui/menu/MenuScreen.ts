import type { Preferences } from '../../storage/Preferences';
import { isButton, isElement, isInput, mountTemplate, queryElement } from '../mountTemplate';
import { muteLabel } from '../muteLabel';
import { setText } from '../setText';
import template from './MenuScreen.html?raw';
import './MenuScreen.css';
import { SkinPicker } from './SkinPicker';

export class MenuScreen {
  readonly element: HTMLElement;
  private readonly nameInput: HTMLInputElement;
  private readonly bestEl: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly picker: SkinPicker;

  constructor(
    prefs: Preferences,
    private readonly onPlay: () => void,
    private readonly onMute: () => void,
  ) {
    this.element = mountTemplate(template);
    this.nameInput = queryElement(this.element, '[data-name]', isInput);
    this.bestEl = queryElement(this.element, '[data-best]', isElement);
    this.muteButton = queryElement(this.element, '[data-mute]', isButton);
    this.nameInput.value = prefs.nickname;
    this.nameInput.addEventListener('input', () => {
      prefs.nickname = this.nameInput.value;
    });
    this.picker = new SkinPicker(prefs.skinId, (skinId) => {
      prefs.skinId = skinId;
    });
    queryElement(this.element, '[data-picker]', isElement).append(this.picker.element);
    queryElement(this.element, '[data-play]', isButton).addEventListener('click', () => this.onPlay());
    this.muteButton.addEventListener('click', () => this.onMute());
    this.setBest(prefs.bestScore);
    this.setMuted(prefs.muted);
  }

  get nickname(): string {
    return this.nameInput.value;
  }

  get skinId(): string {
    return this.picker.skin.id;
  }

  setBest(score: number): void {
    const shown = Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
    setText(this.bestEl, `Best: ${shown}`);
  }

  setMuted(muted: boolean): void {
    setText(this.muteButton, muteLabel(muted));
    this.muteButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }

  open(): void {
    this.element.classList.add('is-open');
    this.picker.start();
  }

  close(): void {
    this.element.classList.remove('is-open');
    this.picker.stop();
  }
}
