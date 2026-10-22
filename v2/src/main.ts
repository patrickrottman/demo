import './styles/global.css';
import { Game } from './game/Game';

const canvas = document.querySelector('#game');
const uiRoot = document.querySelector('#ui-root');
if (!(canvas instanceof HTMLCanvasElement) || !(uiRoot instanceof HTMLElement)) {
  throw new Error('Snake.io mount points missing');
}
new Game(canvas, uiRoot).start();
