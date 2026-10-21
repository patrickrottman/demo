import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import { skinColorAt } from '../../content/skins/skinColors';
import { EyeSample } from '../eye/EyeSample';
import { placeEyes } from '../eye/placeEyes';
import { sharedSpriteCache } from '../sprites/SpriteCache';
import { PreviewPoint } from './PreviewPoint';
import { previewSegment } from './previewSegment';

const COUNT = 18;
const TAU = Math.PI * 2;
const point = new PreviewPoint();
const eyes = new EyeSample();

export function drawSkinPreview(
  ctx: CanvasRenderingContext2D,
  skin: SnakeSkin,
  width: number,
  height: number,
  time: number,
): void {
  ctx.clearRect(0, 0, width, height);
  if (width <= 0 || height <= 0) {
    return;
  }
  const sprites = sharedSpriteCache();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.42;
  const glow = sprites.glow(skin.glow);
  for (let i = COUNT - 1; i >= 0; i--) {
    previewSegment(point, i, COUNT, width, height, time);
    const draw = point.radius * 3.4;
    ctx.drawImage(glow, point.x - draw * 0.5, point.y - draw * 0.5, draw, draw);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  let last = '';
  let ball = sprites.ball(skin.colors[0] ?? '#FFFFFF');
  for (let i = COUNT - 1; i >= 0; i--) {
    previewSegment(point, i, COUNT, width, height, time);
    const color = skinColorAt(skin, i, COUNT);
    if (color !== last) {
      last = color;
      ball = sprites.ball(color);
    }
    const draw = point.radius * 2 * sprites.ballScale;
    ctx.drawImage(ball, point.x - draw * 0.5, point.y - draw * 0.5, draw, draw);
  }
  previewSegment(point, 0, COUNT, width, height, time);
  placeEyes(eyes, 0, Math.sin(time * 1.35) * 0.75, point.radius);
  ctx.fillStyle = '#F4F7FF';
  ctx.beginPath();
  ctx.arc(point.x + eyes.leftX, point.y + eyes.leftY, eyes.eyeRadius, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x + eyes.rightX, point.y + eyes.rightY, eyes.eyeRadius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#141824';
  ctx.beginPath();
  ctx.arc(point.x + eyes.pupilLeftX, point.y + eyes.pupilLeftY, eyes.pupilRadius, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x + eyes.pupilRightX, point.y + eyes.pupilRightY, eyes.pupilRadius, 0, TAU);
  ctx.fill();
  const glint = Math.max(0.8, eyes.pupilRadius * 0.34);
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(
    point.x + eyes.pupilLeftX - eyes.pupilRadius * 0.3,
    point.y + eyes.pupilLeftY - eyes.pupilRadius * 0.34,
    glint,
    0,
    TAU,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    point.x + eyes.pupilRightX - eyes.pupilRadius * 0.3,
    point.y + eyes.pupilRightY - eyes.pupilRadius * 0.34,
    glint,
    0,
    TAU,
  );
  ctx.fill();
  ctx.restore();
}
