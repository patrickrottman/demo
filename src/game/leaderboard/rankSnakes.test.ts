import { describe, expect, it } from 'vitest';
import { rankSnakes } from './rankSnakes';
import type { RankableSnake } from './RankableSnake';

function snake(id: number, mass: number, isPlayer = false, name = `S${id}`): RankableSnake {
  return { id, name, mass, isPlayer };
}

describe('rankSnakes', () => {
  it('returns the top N by mass with 1-based ranks', () => {
    const board = rankSnakes([snake(1, 10), snake(2, 50), snake(3, 30), snake(4, 40), snake(5, 20)], 3);
    expect(board.total).toBe(5);
    expect(board.entries.map((entry) => entry.id)).toEqual([2, 4, 3]);
    expect(board.entries.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(board.player).toBeNull();
  });

  it('breaks mass ties by lower id', () => {
    const board = rankSnakes([snake(2, 40, false, 'Bee'), snake(1, 40, false, 'Ace'), snake(3, 10)], 3);
    expect(board.entries.map((entry) => [entry.id, entry.rank, entry.name])).toEqual([
      [1, 1, 'Ace'],
      [2, 2, 'Bee'],
      [3, 3, 'S3'],
    ]);
  });

  it('keeps the player rank when they are outside the top N', () => {
    const snakes: RankableSnake[] = [];
    for (let id = 1; id <= 10; id++) snakes.push(snake(id, 100 - id));
    snakes.push(snake(99, 1, true, 'Hero'));
    const board = rankSnakes(snakes, 10);
    expect(board.entries).toHaveLength(10);
    expect(board.entries.some((entry) => entry.isPlayer)).toBe(false);
    expect(board.player).toEqual({ id: 99, name: 'Hero', mass: 1, isPlayer: true, rank: 11 });
    expect(board.total).toBe(11);
  });

  it('returns a null player when nobody is the player', () => {
    const board = rankSnakes([snake(4, 8), snake(2, 3)], 10);
    expect(board.player).toBeNull();
    expect(board.entries).toHaveLength(2);
    expect(board.total).toBe(2);
  });

  it('does not mutate the input and treats an empty list as empty', () => {
    const snakes = [snake(3, 5, true), snake(1, 9)];
    const ids = snakes.map((entry) => entry.id);
    const board = rankSnakes(snakes, 0);
    expect(snakes.map((entry) => entry.id)).toEqual(ids);
    expect(board.entries).toEqual([]);
    expect(board.player?.rank).toBe(2);
    expect(rankSnakes([], 10)).toEqual({ entries: [], player: null, total: 0 });
  });
});
