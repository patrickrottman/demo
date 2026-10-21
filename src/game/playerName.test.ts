import { describe, expect, it } from 'vitest';
import { playerName } from './playerName';

describe('playerName', () => {
  it('uses Player when the nickname is blank and trims otherwise', () => {
    expect(playerName('')).toBe('Player');
    expect(playerName('   ')).toBe('Player');
    expect(playerName('  Ace  ')).toBe('Ace');
  });
});
