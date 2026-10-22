const bias = 2_000_000;
const stride = 4_000_003;

export function cellKey(cx: number, cy: number): number {
  return (cx + bias) * stride + (cy + bias);
}

export function cellOf(position: number, cellSize: number): number {
  return Math.floor(position / cellSize);
}
