import type { LifeSummary } from './LifeSummary';

export class LifeStats {
  private kills = 0;
  private bestRank: number | null = null;
  private peakMass = 0;
  private elapsed = 0;
  private running = false;

  start(): void {
    this.kills = 0;
    this.bestRank = null;
    this.peakMass = 0;
    this.elapsed = 0;
    this.running = true;
  }

  addTime(dt: number): void {
    if (!this.running || !Number.isFinite(dt) || dt <= 0) return;
    this.elapsed += dt;
  }

  recordKill(): void {
    if (!this.running) return;
    this.kills += 1;
  }

  recordRank(rank: number): void {
    if (!this.running || !Number.isFinite(rank) || rank < 1) return;
    if (this.bestRank === null || rank < this.bestRank) this.bestRank = rank;
  }

  recordMass(mass: number): void {
    if (!this.running || !Number.isFinite(mass) || mass < 0) return;
    if (mass > this.peakMass) this.peakMass = mass;
  }

  stop(): LifeSummary {
    this.running = false;
    return this.summary();
  }

  summary(): LifeSummary {
    return {
      kills: this.kills,
      bestRank: this.bestRank,
      peakMass: this.peakMass,
      survivedSeconds: this.elapsed,
    };
  }
}
