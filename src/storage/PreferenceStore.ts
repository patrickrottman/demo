export interface PreferenceStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
