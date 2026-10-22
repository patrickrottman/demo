import { eatMinInterval, eatPitch } from './eatPitch';

export class SoundEngine {
  private context: AudioContext | null = null;
  private muted = false;
  private streak = 0;
  private streakTime = 0;
  private eatLock = 0;
  private boosting = false;
  private boostGain: GainNode | null = null;
  private boostSource: AudioBufferSourceNode | null = null;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.boosting = false;
    this.applyBoostGain();
  }

  unlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state !== 'running') void ctx.resume();
    this.ensureBoost(ctx);
    this.applyBoostGain();
  }

  update(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.eatLock = Math.max(0, this.eatLock - dt);
    if (this.streak <= 0) return;
    this.streakTime += dt;
    if (this.streakTime < 0.55) return;
    this.streak = 0;
    this.streakTime = 0;
  }

  playEat(): void {
    if (this.muted || this.eatLock > 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.eatLock = eatMinInterval;
    this.streak += 1;
    this.streakTime = 0;
    this.tone(ctx, eatPitch(this.streak), 0.09, 'sine', 0.12, 0);
  }

  setBoosting(active: boolean): void {
    this.boosting = active && !this.muted;
    if (this.boosting && this.context) this.ensureBoost(this.context);
    this.applyBoostGain();
  }

  playKill(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 660, 0.08, 'square', 0.07, 0);
    this.tone(ctx, 990, 0.16, 'square', 0.06, 0.08);
  }

  playDeath(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const start = ctx.currentTime;
    osc.frequency.setValueAtTime(420, start);
    osc.frequency.exponentialRampToValueAtTime(55, start + 0.55);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.62);
  }

  playClick(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.tone(ctx, 740, 0.045, 'triangle', 0.05, 0);
  }

  private tone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType,
    peak: number,
    delay: number,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.02, duration));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    try {
      this.context = new AudioContext();
    } catch {
      return null;
    }
    return this.context;
  }

  private ensureBoost(ctx: AudioContext): void {
    if (this.boostGain && this.boostSource) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    this.boostSource = source;
    this.boostGain = gain;
  }

  private applyBoostGain(): void {
    if (!this.boostGain || !this.boostSource || !this.context) return;
    const target = this.boosting && !this.muted ? 0.055 : 0.0001;
    const now = this.context.currentTime;
    this.boostGain.gain.cancelScheduledValues(now);
    this.boostGain.gain.setTargetAtTime(target, now, 0.08);
  }
}
