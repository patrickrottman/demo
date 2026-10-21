import { describe, expect, it } from 'vitest';
import { muteLabel } from './muteLabel';

describe('muteLabel', () => {
  it('names the mute control after the current state', () => {
    expect(muteLabel(false)).toBe('Mute');
    expect(muteLabel(true)).toBe('Muted');
  });
});
