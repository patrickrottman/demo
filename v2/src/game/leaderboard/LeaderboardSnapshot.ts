import type { RankedEntry } from './RankedEntry';

export interface LeaderboardSnapshot {
  readonly entries: readonly RankedEntry[];
  readonly player: RankedEntry | null;
  readonly total: number;
}
