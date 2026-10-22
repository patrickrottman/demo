export function playerName(nickname: string): string {
  const trimmed = nickname.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : 'Player';
}
