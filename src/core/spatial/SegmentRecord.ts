import type { SegmentHit } from '../contracts/SegmentHit';

export class SegmentRecord implements SegmentHit {
  snakeId = 0;
  index = 0;
  x = 0;
  y = 0;
  radius = 0;

  set(snakeId: number, index: number, x: number, y: number, radius: number): void {
    this.snakeId = snakeId;
    this.index = index;
    this.x = x;
    this.y = y;
    this.radius = radius;
  }
}
