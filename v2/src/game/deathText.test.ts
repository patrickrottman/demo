import { describe, expect, it } from 'vitest';
import { formatDeathCause, formatKillFeed } from './deathText';

describe('deathText', () => {
  it('describes border deaths and kills with a killer name', () => {
    expect(formatDeathCause('border', 'Slinky')).toBe('You hit the wall');
    expect(formatDeathCause('collision', 'Slinky')).toBe('Eaten by Slinky');
    expect(formatDeathCause('headOn', null)).toBe('Eaten by someone');
    expect(formatKillFeed('Nova', 'collision', 'You')).toBe('Nova was eaten by You');
    expect(formatKillFeed('Nova', 'border', null)).toBe('Nova hit the wall');
  });
});
