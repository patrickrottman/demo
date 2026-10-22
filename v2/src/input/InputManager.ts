import type { Vec2 } from '../core/contracts/Vec2';
import { isTypingTarget } from './isTypingTarget';
import type { PlayerInput } from './PlayerInput';
import type { SteeringMode } from './SteeringMode';

const steerLeft = new Set(['KeyA', 'ArrowLeft']);
const steerRight = new Set(['KeyD', 'ArrowRight']);

export class InputManager implements PlayerInput {
  pointerX = 0;
  pointerY = 0;
  steeringMode: SteeringMode = 'pointer';
  private primaryDown = false;
  private spaceDown = false;
  private extraTouch = false;
  private boostHeld = false;
  private aimPointer: number | null = null;
  private readonly touches = new Set<number>();
  private readonly keys = new Set<string>();
  private aim: (x: number, y: number) => Vec2 = () => ({ x: 0, y: 0 });
  private gesture: (() => void) | null = null;
  private touchSeen: (() => void) | null = null;
  private listening = false;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  get boost(): boolean {
    return this.primaryDown || this.spaceDown || this.extraTouch || this.boostHeld;
  }

  get keyboardDirection(): number {
    let direction = 0;
    for (const code of this.keys) {
      if (steerLeft.has(code)) direction -= 1;
      if (steerRight.has(code)) direction += 1;
    }
    if (direction > 1) return 1;
    if (direction < -1) return -1;
    return direction;
  }

  setAimResolver(aim: (x: number, y: number) => Vec2): void {
    this.aim = aim;
  }

  aimWorld(): Vec2 {
    return this.aim(this.pointerX, this.pointerY);
  }

  setGestureListener(listener: () => void): void {
    this.gesture = listener;
  }

  setTouchListener(listener: () => void): void {
    this.touchSeen = listener;
  }

  setBoostButton(held: boolean): void {
    this.boostHeld = held;
  }

  releaseAll(): void {
    this.keys.clear();
    this.spaceDown = false;
    this.primaryDown = false;
    this.boostHeld = false;
    this.touches.clear();
    this.extraTouch = false;
    this.aimPointer = null;
  }

  attach(): void {
    if (this.listening) return;
    this.listening = true;
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.centerPointer();
  }

  private centerPointer(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerX = rect.width * 0.5;
    this.pointerY = rect.height * 0.5;
  }

  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.gesture?.();
    if (event.pointerType === 'touch') {
      event.preventDefault();
      this.touchSeen?.();
      this.touches.add(event.pointerId);
      if (this.aimPointer === null) {
        this.aimPointer = event.pointerId;
        this.place(event, false);
      }
      this.extraTouch = this.touches.size >= 2;
      return;
    }
    if (event.button === 0) this.primaryDown = true;
    this.place(event, false);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      if (event.pointerId !== this.aimPointer) return;
      this.place(event, true);
      return;
    }
    this.place(event, true);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.touches.delete(event.pointerId);
      if (this.aimPointer === event.pointerId) {
        const next = this.touches.values().next().value;
        this.aimPointer = typeof next === 'number' ? next : null;
      }
      this.extraTouch = this.touches.size >= 2;
      return;
    }
    if (event.button === 0) this.primaryDown = false;
  };

  private place(event: PointerEvent, fromMove: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (fromMove) {
      const dx = x - this.pointerX;
      const dy = y - this.pointerY;
      if (dx * dx + dy * dy > 4) this.steeringMode = 'pointer';
    }
    this.pointerX = x;
    this.pointerY = y;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) return;
    this.gesture?.();
    if (event.code === 'Space') {
      this.spaceDown = true;
      event.preventDefault();
    }
    if (steerLeft.has(event.code) || steerRight.has(event.code)) {
      this.steeringMode = 'keyboard';
      this.keys.add(event.code);
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
    if (event.code === 'Space') this.spaceDown = false;
  };

  private onBlur = (): void => {
    this.releaseAll();
  };
}
