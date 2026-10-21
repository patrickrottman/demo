export const EFFECT_SPARK = 0;
export const EFFECT_RING = 1;
export const EFFECT_SPARKLE = 2;

export class EffectParticle {
  active = false;
  kind = EFFECT_SPARK;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  age = 0;
  life = 0.7;
  size = 4;
  color = '#FFFFFF';
}
