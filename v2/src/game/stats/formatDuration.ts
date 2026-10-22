export function formatDuration(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const total = Math.floor(safe);
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${minutes}:${remain.toString().padStart(2, '0')}`;
}
