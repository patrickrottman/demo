import { defaultSkin, skinCatalog } from '../../content/skins/skinCatalog';
import { skinPrimaryColor } from '../../content/skins/skinColors';
import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import { drawSkinPreview } from '../../render/preview/drawSkinPreview';
import { isButton, isCanvas, isElement, mountTemplate, queryElement } from '../mountTemplate';
import { setText } from '../setText';
import template from './SkinPicker.html?raw';
import './SkinPicker.css';

export class SkinPicker {
  readonly element: HTMLElement;
  private index = 0;
  private raf = 0;
  private readonly canvas: HTMLCanvasElement;
  private readonly nameEl: HTMLElement;
  private readonly swatchButtons: HTMLButtonElement[] = [];

  constructor(
    initialId: string,
    private readonly onChange: (skinId: string) => void,
  ) {
    this.element = mountTemplate(template);
    const found = skinCatalog.findIndex((skin) => skin.id === initialId);
    this.index = found >= 0 ? found : 0;
    this.canvas = queryElement(this.element, '[data-preview]', isCanvas);
    this.nameEl = queryElement(this.element, '[data-skin-name]', isElement);
    this.buildSwatches();
    queryElement(this.element, '[data-prev]', isButton).addEventListener('click', () => this.step(-1));
    queryElement(this.element, '[data-next]', isButton).addEventListener('click', () => this.step(1));
    this.paint();
  }

  get skin(): SnakeSkin {
    return skinCatalog[this.index] ?? defaultSkin;
  }

  start(): void {
    if (this.raf !== 0) return;
    this.raf = requestAnimationFrame(this.draw);
  }

  stop(): void {
    if (this.raf === 0) return;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private step(delta: number): void {
    const count = skinCatalog.length;
    if (count === 0) return;
    this.index = (this.index + delta + count) % count;
    this.commit();
  }

  private commit(): void {
    this.paint();
    this.onChange(this.skin.id);
  }

  private paint(): void {
    setText(this.nameEl, this.skin.name);
    for (let i = 0; i < this.swatchButtons.length; i++) {
      const button = this.swatchButtons[i];
      if (!button) continue;
      const selected = i === this.index;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
  }

  private buildSwatches(): void {
    const host = queryElement(this.element, '[data-swatches]', isElement);
    for (let i = 0; i < skinCatalog.length; i++) {
      const skin = skinCatalog[i];
      if (!skin) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.style.background = skinPrimaryColor(skin);
      button.setAttribute('aria-label', skin.name);
      button.addEventListener('click', () => {
        this.index = i;
        this.commit();
      });
      host.append(button);
      this.swatchButtons.push(button);
    }
  }

  private readonly draw = (time: number): void => {
    this.raf = requestAnimationFrame(this.draw);
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    drawSkinPreview(ctx, this.skin, this.canvas.width, this.canvas.height, time / 1000);
  };
}
