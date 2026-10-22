import { describe, expect, it } from 'vitest';
import { setText } from './setText';

describe('setText', () => {
  it('writes textContent only when the value changes', () => {
    let writes = 0;
    const node = {
      current: 'Ready',
      get textContent() {
        return this.current;
      },
      set textContent(value: string | null) {
        writes += 1;
        this.current = value ?? '';
      },
    };
    setText(node, 'Ready');
    setText(node, 'Go');
    setText(node, 'Go');
    expect(writes).toBe(1);
    expect(node.current).toBe('Go');
  });
});
