import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';
import { LifeStats } from './LifeStats';

describe('LifeStats', () => {
  it('tracks kills, best rank, peak mass, and time while running', () => {
    const life = new LifeStats();
    life.recordKill();
    expect(life.summary().kills).toBe(0);
    life.start();
    life.recordKill();
    life.recordKill();
    life.recordRank(4);
    life.recordRank(2);
    life.recordRank(6);
    life.recordRank(0);
    life.recordMass(10);
    life.recordMass(50);
    life.recordMass(20);
    life.addTime(1.2);
    life.addTime(0.8);
    life.addTime(-1);
    const live = life.summary();
    expect(live.kills).toBe(2);
    expect(live.bestRank).toBe(2);
    expect(live.peakMass).toBe(50);
    expect(live.survivedSeconds).toBeCloseTo(2);
    life.stop();
    life.recordKill();
    life.addTime(5);
    life.recordMass(80);
    const frozen = life.summary();
    expect(frozen.kills).toBe(2);
    expect(frozen.peakMass).toBe(50);
    expect(frozen.survivedSeconds).toBeCloseTo(2);
    life.start();
    expect(life.summary()).toEqual({ kills: 0, bestRank: null, peakMass: 0, survivedSeconds: 0 });
  });
});

describe('formatDuration', () => {
  it('formats elapsed time as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(9.9)).toBe('0:09');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(125.2)).toBe('2:05');
    expect(formatDuration(-4)).toBe('0:00');
    expect(formatDuration(Number.NaN)).toBe('0:00');
  });
});
