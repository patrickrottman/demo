import { describe, expect, it } from 'vitest';
import { skinCatalog } from '../../content/skins/skinCatalog';
import { skinColorAt } from '../../content/skins/skinColors';
import { SkinColorCache } from './SkinColorCache';

describe('SkinColorCache', () => {
  it('reuses a row until the segment count changes', () => {
    const cache = new SkinColorCache();
    const skin = skinCatalog.find((entry) => entry.pattern === 'gradient') ?? skinCatalog[0];
    if (!skin) {
      throw new Error('missing skin');
    }
    cache.prepare();
    const first = cache.row(3, skin, 40);
    const again = cache.row(3, skin, 40);
    expect(again).toBe(first);
    expect(first[0]).toBe(skinColorAt(skin, 0, 40));
    expect(first[39]).toBe(skinColorAt(skin, 39, 40));
    const grown = cache.row(3, skin, 41);
    expect(grown).not.toBe(first);
    expect(grown[10]).toBe(skinColorAt(skin, 10, 41));
  });
});
