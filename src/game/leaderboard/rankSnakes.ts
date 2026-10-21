import type { LeaderboardSnapshot } from './LeaderboardSnapshot';
import type { RankableSnake } from './RankableSnake';
import type { RankedEntry } from './RankedEntry';

export function rankSnakes(snakes: readonly RankableSnake[], topN: number): LeaderboardSnapshot {
  const sorted = snakes.slice().sort((a, b) => {
    if (b.mass !== a.mass) return b.mass - a.mass;
    return a.id - b.id;
  });
  const limit = Math.max(0, Math.floor(topN));
  const entries: RankedEntry[] = [];
  let player: RankedEntry | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const snake = sorted[i];
    if (!snake) continue;
    const entry: RankedEntry = {
      id: snake.id,
      name: snake.name,
      mass: snake.mass,
      isPlayer: snake.isPlayer,
      rank: i + 1,
    };
    if (entries.length < limit) entries.push(entry);
    if (snake.isPlayer && !player) player = entry;
  }
  return { entries, player, total: sorted.length };
}
