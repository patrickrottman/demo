import { mountTemplate } from '../mountTemplate';
import template from './PauseOverlay.html?raw';
import './PauseOverlay.css';

export class PauseOverlay {
  readonly element: HTMLElement;

  constructor() {
    this.element = mountTemplate(template);
  }

  open(): void {
    this.element.classList.add('is-open');
  }

  close(): void {
    this.element.classList.remove('is-open');
  }
}
