import { describe, expect, it } from 'vitest';
import { RefreshGate } from './RefreshGate';

describe('RefreshGate', () => {
  it('paints immediately and then about four times a second', () => {
    const gate = new RefreshGate(0.25);
    expect(gate.ready(0)).toBe(true);
    expect(gate.ready(0.1)).toBe(false);
    expect(gate.ready(0.1)).toBe(false);
    expect(gate.ready(0.1)).toBe(true);
    expect(gate.ready(0.2)).toBe(false);
    expect(gate.ready(0.2)).toBe(true);
    gate.reset();
    expect(gate.ready(1)).toBe(true);
  });
});
