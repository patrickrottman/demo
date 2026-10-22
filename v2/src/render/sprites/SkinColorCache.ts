import type { SnakeSkin } from '../../content/skins/SnakeSkin';
import { skinColorAt } from '../../content/skins/skinColors';
import { SkinColorEntry } from './SkinColorEntry';

export class SkinColorCache {
  private frame = 0;
  private readonly entries = new Map<number, SkinColorEntry>();

  prepare(): void {
    this.frame += 1;
    if (this.frame % 90 !== 0) {
      return;
    }
    for (const [id, entry] of this.entries) {
      if (this.frame - entry.seen > 90) {
        this.entries.delete(id);
      }
    }
  }

  row(snakeId: number, skin: SnakeSkin, count: number): readonly string[] {
    let entry = this.entries.get(snakeId);
    if (!entry) {
      entry = new SkinColorEntry();
      this.entries.set(snakeId, entry);
    }
    entry.seen = this.frame;
    if (entry.skinId !== skin.id || entry.count !== count) {
      const colors = new Array<string>(count);
      for (let i = 0; i < count; i++) {
        colors[i] = skinColorAt(skin, i, count);
      }
      entry.skinId = skin.id;
      entry.count = count;
      entry.colors = colors;
    }
    return entry.colors;
  }
}
