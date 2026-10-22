export const eatMinInterval = 0.05;

export function eatPitch(streak: number): number {
  const step = Math.min(16, Math.max(1, Math.floor(streak)));
  return 480 + (step - 1) * 36;
}
