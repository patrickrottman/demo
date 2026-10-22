import { describe, expect, it } from 'vitest';
import { GameConfig } from '../../config/GameConfig';
import { SeededRandom } from '../random/SeededRandom';
import { FoodField } from './FoodField';

describe('FoodField', () => {
  it('replenishes ambient food at the configured rate up to the target', () => {
    const field = new FoodField(new SeededRandom(4));
    field.fillInitial();
    const target = GameConfig.food.ambientTarget;
    expect(field.foods.length).toBe(target);
    const removed = 200;
    for (let i = 0; i < removed; i += 1) field.removeIndex(0);
    expect(field.foods.length).toBe(target - removed);
    field.replenish(1, 1);
    expect(field.foods.length).toBe(target - removed + GameConfig.food.ambientRespawnPerSecond);
    field.replenish(10, 2);
    expect(field.foods.length).toBe(target);
  });

  it('merges drops into existing pellets once food is at the cap', () => {
    const field = new FoodField(new SeededRandom(5));
    const cap = GameConfig.food.maxFood;
    for (let i = 0; i < cap; i += 1) field.addDrop(i % 50, Math.floor(i / 50), 1, 4, '#FFFFFF', 'boost', 0);
    expect(field.foods.length).toBe(cap);
    let before = 0;
    for (let i = 0; i < field.foods.length; i += 1) before += field.foods[i]?.value ?? 0;
    field.addDrop(10, 0, 7, 6, '#FF00AA', 'boost', 1);
    expect(field.foods.length).toBe(cap);
    let after = 0;
    for (let i = 0; i < field.foods.length; i += 1) after += field.foods[i]?.value ?? 0;
    expect(after).toBeCloseTo(before + 7, 6);
  });
});
