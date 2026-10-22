export class RefreshGate {
  private elapsed = 0;
  private primed = true;

  constructor(private readonly interval: number) {}

  reset(): void {
    this.elapsed = 0;
    this.primed = true;
  }

  ready(dt: number): boolean {
    if (this.primed) {
      this.primed = false;
      this.elapsed = 0;
      return true;
    }
    this.elapsed += dt;
    if (this.elapsed < this.interval) return false;
    this.elapsed = 0;
    return true;
  }
}
