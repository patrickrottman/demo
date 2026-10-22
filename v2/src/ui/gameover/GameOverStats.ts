export interface GameOverStats {
  readonly length: number;
  readonly kills: number;
  readonly bestRank: number | null;
  readonly timeAlive: string;
  readonly cause: string;
  readonly bestScore: number;
  readonly isNewBest: boolean;
}
