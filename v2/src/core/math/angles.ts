const TAU = Math.PI * 2;

export function normalizeAngle(angle: number): number {
  let result = angle % TAU;
  if (result <= -Math.PI) {
    result += TAU;
  } else if (result > Math.PI) {
    result -= TAU;
  }
  return result;
}

export function angleDelta(from: number, to: number): number {
  return normalizeAngle(to - from);
}

export function rotateTowards(current: number, target: number, maxStep: number): number {
  const delta = angleDelta(current, target);
  if (Math.abs(delta) <= maxStep) {
    return normalizeAngle(target);
  }
  return normalizeAngle(current + Math.sign(delta) * maxStep);
}

export function angleTo(fromX: number, fromY: number, toX: number, toY: number): number {
  return Math.atan2(toY - fromY, toX - fromX);
}
