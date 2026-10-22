import { findSkin } from '../content/skins/skinCatalog';
import type { PreferenceData } from './PreferenceData';
import type { PreferenceStore } from './PreferenceStore';

export const preferenceStorageKey = 'snake.prefs.v1';

function emptyPreferences(): PreferenceData {
  return {
    nickname: '',
    skinId: findSkin(undefined).id,
    bestScore: 0,
    muted: false,
  };
}

function readScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function readPreferences(store: PreferenceStore): PreferenceData {
  try {
    const raw = store.getItem(preferenceStorageKey);
    if (!raw) return emptyPreferences();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyPreferences();
    const record = parsed as Record<string, unknown>;
    const fallback = emptyPreferences();
    return {
      nickname: typeof record.nickname === 'string' ? record.nickname.slice(0, 16) : fallback.nickname,
      skinId: findSkin(typeof record.skinId === 'string' ? record.skinId : undefined).id,
      bestScore: readScore(record.bestScore),
      muted: typeof record.muted === 'boolean' ? record.muted : fallback.muted,
    };
  } catch {
    return emptyPreferences();
  }
}

export class Preferences {
  private readonly store: PreferenceStore;
  private data: PreferenceData;

  constructor(store?: PreferenceStore) {
    this.store = store ?? localStorage;
    this.data = readPreferences(this.store);
  }

  get nickname(): string {
    return this.data.nickname;
  }

  set nickname(value: string) {
    this.data.nickname = value.slice(0, 16);
    this.persist();
  }

  get skinId(): string {
    return this.data.skinId;
  }

  set skinId(value: string) {
    this.data.skinId = findSkin(value).id;
    this.persist();
  }

  get bestScore(): number {
    return this.data.bestScore;
  }

  set bestScore(value: number) {
    this.data.bestScore = readScore(value);
    this.persist();
  }

  get muted(): boolean {
    return this.data.muted;
  }

  set muted(value: boolean) {
    this.data.muted = value;
    this.persist();
  }

  private persist(): void {
    try {
      this.store.setItem(preferenceStorageKey, JSON.stringify(this.data));
    } catch {
      return;
    }
  }
}
