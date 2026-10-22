import { describe, expect, it } from 'vitest';
import { defaultSkin } from '../content/skins/skinCatalog';
import { preferenceStorageKey, Preferences } from './Preferences';
import type { PreferenceStore } from './PreferenceStore';

function memoryStore(initial?: string): PreferenceStore {
  const items = new Map<string, string>();
  if (initial !== undefined) items.set(preferenceStorageKey, initial);
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

describe('Preferences', () => {
  it('starts from defaults when storage is empty', () => {
    const prefs = new Preferences(memoryStore());
    expect(prefs.nickname).toBe('');
    expect(prefs.skinId).toBe(defaultSkin.id);
    expect(prefs.bestScore).toBe(0);
    expect(prefs.muted).toBe(false);
  });

  it('round-trips nickname, skin, score, and mute', () => {
    const store = memoryStore();
    const prefs = new Preferences(store);
    prefs.nickname = 'Slinky';
    prefs.skinId = 'tiger';
    prefs.bestScore = 1200.4;
    prefs.muted = true;
    const again = new Preferences(store);
    expect(again.nickname).toBe('Slinky');
    expect(again.skinId).toBe('tiger');
    expect(again.bestScore).toBe(1200);
    expect(again.muted).toBe(true);
    expect(store.getItem(preferenceStorageKey)).toContain('"muted":true');
  });

  it('falls back when JSON is corrupt', () => {
    const prefs = new Preferences(memoryStore('{'));
    expect(prefs.nickname).toBe('');
    expect(prefs.skinId).toBe(defaultSkin.id);
    expect(prefs.bestScore).toBe(0);
    expect(prefs.muted).toBe(false);
  });

  it('replaces invalid fields and unknown skins', () => {
    const store = memoryStore(
      JSON.stringify({ nickname: 4, skinId: 'nope', bestScore: 'x', muted: 'yes', extra: true }),
    );
    const prefs = new Preferences(store);
    expect(prefs.nickname).toBe('');
    expect(prefs.skinId).toBe(defaultSkin.id);
    expect(prefs.bestScore).toBe(0);
    expect(prefs.muted).toBe(false);
  });

  it('keeps valid fields when others are missing', () => {
    const prefs = new Preferences(memoryStore(JSON.stringify({ muted: true, bestScore: -8 })));
    expect(prefs.muted).toBe(true);
    expect(prefs.bestScore).toBe(0);
    expect(prefs.nickname).toBe('');
  });

  it('truncates nicknames to 16 characters', () => {
    const prefs = new Preferences(memoryStore());
    prefs.nickname = '12345678901234567890';
    expect(prefs.nickname).toBe('1234567890123456');
  });

  it('survives storage exceptions', () => {
    const store: PreferenceStore = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const prefs = new Preferences(store);
    expect(prefs.skinId).toBe(defaultSkin.id);
    prefs.nickname = 'Ace';
    expect(prefs.nickname).toBe('Ace');
    prefs.muted = true;
    expect(prefs.muted).toBe(true);
  });
});
