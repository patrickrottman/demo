import type { LeaderboardSnapshot } from '../../game/leaderboard/LeaderboardSnapshot';

export interface HudModel {
  readonly board: LeaderboardSnapshot;
  readonly length: number;
  readonly kills: number;
}
