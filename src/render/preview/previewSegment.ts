import type { PreviewPoint } from './PreviewPoint';

export function previewSegment(
  out: PreviewPoint,
  index: number,
  count: number,
  width: number,
  height: number,
  time: number,
): PreviewPoint {
  const safeCount = count < 2 ? 2 : count;
  const safeIndex = index < 0 ? 0 : index > safeCount - 1 ? safeCount - 1 : index;
  const radius = Math.max(2, Math.min(height * 0.22, width * 0.07));
  const span = width * 0.78;
  const amp = Math.min(height * 0.12, radius * 0.65);
  const u = safeIndex / (safeCount - 1);
  out.radius = radius;
  out.x = width * 0.5 + (0.5 - u) * span;
  out.y = height * 0.5 + Math.sin(u * Math.PI * 2.5 - time * 2.7) * amp * (0.35 + 0.65 * u);
  return out;
}
