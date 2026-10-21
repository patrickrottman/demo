import { angleDelta } from '../../core/math/angles';
import type { EyeSample } from './EyeSample';

export function placeEyes(out: EyeSample, heading: number, targetAngle: number, radius: number): EyeSample {
  const eyeRadius = radius * 0.27;
  const pupilRadius = eyeRadius * 0.46;
  const forward = radius * 0.34;
  const side = radius * 0.38;
  const shift = eyeRadius * 0.42;
  const delta = angleDelta(heading, targetAngle);
  const lookForward = Math.cos(delta) * shift;
  const lookSide = Math.sin(delta) * shift;
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  const fx = cos * forward;
  const fy = sin * forward;
  const sx = -sin * side;
  const sy = cos * side;
  out.leftX = fx + sx;
  out.leftY = fy + sy;
  out.rightX = fx - sx;
  out.rightY = fy - sy;
  const px = cos * lookForward - sin * lookSide;
  const py = sin * lookForward + cos * lookSide;
  out.pupilLeftX = out.leftX + px;
  out.pupilLeftY = out.leftY + py;
  out.pupilRightX = out.rightX + px;
  out.pupilRightY = out.rightY + py;
  out.eyeRadius = eyeRadius;
  out.pupilRadius = pupilRadius;
  return out;
}
