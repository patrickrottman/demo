import { GameConfig } from '../config/GameConfig';
import type { FoodView } from '../core/contracts/FoodView';
import type { SegmentHit } from '../core/contracts/SegmentHit';
import type { SnakeController } from '../core/contracts/SnakeController';
import type { SnakeIntent } from '../core/contracts/SnakeIntent';
import type { SnakeView } from '../core/contracts/SnakeView';
import type { WorldView } from '../core/contracts/WorldView';
import { angleDelta, angleTo, normalizeAngle, rotateTowards } from '../core/math/angles';
import { clamp, distanceSquared } from '../core/math/scalars';
import type { Random } from '../core/random/Random';
import type { BotPersonality } from './BotPersonality';

const CANDIDATES = 20;
const SEG_LIMIT = 160;
const FOOD_LIMIT = 128;
const HEAD_LIMIT = 40;
const EDGE_BAND = 600;
const BOOST_FLOOR = GameConfig.snake.minBoostMass * 1.5;
const BOOST_COMFORT = BOOST_FLOOR * 1.35;
const KIND_REMAINS = 2;
const KIND_BOOST = 1;

export class BotController implements SnakeController {
  private readonly rng: Random;
  private readonly personality: BotPersonality;
  private readonly intent: SnakeIntent = { targetAngle: 0, boost: false };
  private readonly segmentScratch: SegmentHit[] = [];
  private readonly foodScratch: FoodView[] = [];
  private readonly segDist = new Float64Array(SEG_LIMIT);
  private readonly segAngle = new Float64Array(SEG_LIMIT);
  private readonly segRadius = new Float64Array(SEG_LIMIT);
  private readonly segWeight = new Float64Array(SEG_LIMIT);
  private readonly foodDist = new Float64Array(FOOD_LIMIT);
  private readonly foodAngle = new Float64Array(FOOD_LIMIT);
  private readonly foodValue = new Float64Array(FOOD_LIMIT);
  private readonly foodKind = new Uint8Array(FOOD_LIMIT);
  private readonly headDist = new Float64Array(HEAD_LIMIT);
  private readonly headMass = new Float64Array(HEAD_LIMIT);
  private readonly headAim = new Float64Array(HEAD_LIMIT);
  private timer: number;
  private wanderAngle: number;
  private boostTimeLeft = 0;
  private hasPlan = false;
  private cachedAngle = 0;
  private cachedBoost = false;
  private segCount = 0;
  private foodCount = 0;
  private headCount = 0;
  private remainsHeat = 0;
  private originX = 0;
  private originY = 0;
  private look = 240;
  private sense = 700;
  private arena: number = GameConfig.world.arenaRadius;
  private centerDist = 0;
  private edgeGap: number = GameConfig.world.arenaRadius;

  constructor(rng: Random, personality: BotPersonality) {
    this.rng = rng;
    this.personality = personality;
    this.timer = rng.range(0, Math.max(personality.reactionTime, 0.001));
    this.wanderAngle = rng.angle();
  }

  decide(self: SnakeView, world: WorldView, dt: number): SnakeIntent {
    this.timer -= dt;
    if (this.boostTimeLeft > 0) {
      this.boostTimeLeft = Math.max(0, this.boostTimeLeft - dt);
    }
    if (this.timer <= 0) {
      this.plan(self, world);
      this.timer = this.personality.reactionTime;
    } else if (!this.hasPlan) {
      this.cachedAngle = self.heading;
      this.cachedBoost = false;
    }
    this.applyEmergency(self, world);
    if (self.mass < BOOST_FLOOR) {
      this.cachedBoost = false;
      this.boostTimeLeft = 0;
    } else if (this.boostTimeLeft > 0) {
      this.cachedBoost = true;
    }
    this.intent.targetAngle = this.cachedAngle;
    this.intent.boost = this.cachedBoost;
    return this.intent;
  }

  private plan(self: SnakeView, world: WorldView): void {
    const head = self.segments[0];
    this.originX = head ? head.x : 0;
    this.originY = head ? head.y : 0;
    const speed = self.boosting ? GameConfig.snake.boostSpeed : GameConfig.snake.baseSpeed;
    const caution = this.personality.caution;
    const greed = this.personality.greed;
    this.look = clamp(speed * (0.48 + caution * 0.62) + self.radius * 5.5, 200, 980);
    this.sense = clamp(500 + greed * 460, 500, 1000);
    this.arena = world.arenaRadius;
    this.centerDist = Math.sqrt(distanceSquared(0, 0, this.originX, this.originY));
    this.edgeGap = this.arena - this.centerDist;
    this.collectThreats(self, world);
    this.collectFoods(world);
    this.evolveWander();

    const heading = self.heading;
    const wanderWeight = this.foodCount > 0 || this.segCount > 0 ? 2.5 : 13;
    const smoothScale = 18 + (1 - this.personality.aggression) * 8;
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestAngle = heading;
    let bestDanger = 0;
    let bestInterest = 0;
    let bestHunt = 0;
    for (let i = 0; i < CANDIDATES; i++) {
      const angle = normalizeAngle(heading + (i / CANDIDATES) * Math.PI * 2 - Math.PI);
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const danger = this.dangerScore(angle, dirX, dirY, self.radius, caution);
      const interest = this.interestScore(angle, greed);
      const hunt = this.huntScore(angle, self.mass);
      const turn = Math.abs(angleDelta(heading, angle));
      const smooth = (1 - turn / Math.PI) * smoothScale;
      const wander = Math.max(0, Math.cos(angleDelta(angle, this.wanderAngle))) * wanderWeight;
      const center = this.centerScore(angle, caution);
      const mask = 1 / (1 + danger * 0.045);
      const score = Math.min(interest + hunt, 190) * mask + smooth + wander + center - danger;
      if (score > bestScore) {
        bestScore = score;
        bestAngle = angle;
        bestDanger = danger;
        bestInterest = interest;
        bestHunt = hunt;
      }
    }
    this.cachedAngle = this.maybeSloppy(bestAngle, bestDanger);
    this.cachedBoost = this.chooseBoost(self, heading, bestHunt, bestInterest);
    this.hasPlan = true;
  }

  private collectThreats(self: SnakeView, world: WorldView): void {
    this.segCount = 0;
    this.headCount = 0;
    const ox = this.originX;
    const oy = this.originY;
    const look = this.look;
    const lookSq = look * look;
    const aggression = this.personality.aggression;
    const huntRange = 230 + aggression * 540;
    const snakes = world.snakes;
    for (let i = 0; i < snakes.length; i++) {
      const snake = snakes[i];
      if (!snake || !snake.alive || snake.id === self.id) continue;
      const head = snake.segments[0];
      if (!head) continue;
      const distSq = distanceSquared(ox, oy, head.x, head.y);
      const dist = Math.sqrt(distSq);
      const enemySpeed = snake.boosting ? GameConfig.snake.boostSpeed : GameConfig.snake.baseSpeed;
      const cosH = Math.cos(snake.heading);
      const sinH = Math.sin(snake.heading);
      if (dist < look * 1.25) {
        const bigger = snake.mass > self.mass * 1.1 ? 1.7 : self.mass > snake.mass * 1.35 ? 0.72 : 1.2;
        const weight = 1.65 * bigger;
        for (let step = 1; step <= 2; step++) {
          const lead = enemySpeed * 0.26 * step;
          const px = head.x + cosH * lead;
          const py = head.y + sinH * lead;
          const projectedSq = distanceSquared(ox, oy, px, py);
          if (projectedSq > lookSq || projectedSq < 1) continue;
          if (!this.pushSeg(Math.sqrt(projectedSq), angleTo(ox, oy, px, py), snake.radius, weight)) break;
        }
      }
      if (aggression < 0.22 || dist > huntRange || dist <= 12 || this.headCount >= HEAD_LIMIT) continue;
      const lead = enemySpeed * (0.2 + dist / 1200);
      const n = this.headCount;
      this.headDist[n] = dist;
      this.headMass[n] = snake.mass;
      this.headAim[n] = angleTo(ox, oy, head.x + cosH * lead, head.y + sinH * lead);
      this.headCount = n + 1;
    }

    this.segmentScratch.length = 0;
    const hits = world.querySegments(ox, oy, look, this.segmentScratch);
    for (let i = 0; i < hits.length; i++) {
      const seg = hits[i];
      if (!seg || seg.snakeId === self.id) continue;
      const distSq = distanceSquared(ox, oy, seg.x, seg.y);
      if (distSq > lookSq || distSq < 0.25) continue;
      if (!this.pushSeg(Math.sqrt(distSq), angleTo(ox, oy, seg.x, seg.y), seg.radius, seg.index === 0 ? 1.35 : 1)) {
        break;
      }
    }
  }

  private pushSeg(dist: number, angle: number, radius: number, weight: number): boolean {
    if (this.segCount >= SEG_LIMIT) return false;
    const n = this.segCount;
    this.segDist[n] = dist;
    this.segAngle[n] = angle;
    this.segRadius[n] = radius;
    this.segWeight[n] = weight;
    this.segCount = n + 1;
    return true;
  }

  private collectFoods(world: WorldView): void {
    this.foodCount = 0;
    this.remainsHeat = 0;
    this.foodScratch.length = 0;
    const foods = world.queryFood(this.originX, this.originY, this.sense, this.foodScratch);
    const ox = this.originX;
    const oy = this.originY;
    const senseSq = this.sense * this.sense;
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      if (!food) continue;
      const distSq = distanceSquared(ox, oy, food.x, food.y);
      if (distSq > senseSq) continue;
      const dist = Math.sqrt(distSq);
      const kind = food.kind === 'remains' ? KIND_REMAINS : food.kind === 'boost' ? KIND_BOOST : 0;
      if (kind === KIND_REMAINS) {
        this.remainsHeat += Math.min(food.value, 90) / (dist / 150 + 1);
      }
      if (this.foodCount >= FOOD_LIMIT) break;
      const n = this.foodCount;
      this.foodDist[n] = dist;
      this.foodAngle[n] = angleTo(ox, oy, food.x, food.y);
      this.foodValue[n] = food.value;
      this.foodKind[n] = kind;
      this.foodCount = n + 1;
    }
  }

  private dangerScore(angle: number, dirX: number, dirY: number, radius: number, caution: number): number {
    let danger = 0;
    const look = this.look;
    const scale = 64 + caution * 70;
    const count = this.segCount;
    for (let i = 0; i < count; i++) {
      const align = Math.cos(angleDelta(angle, this.segAngle[i] ?? 0));
      if (align <= 0) continue;
      const dist = this.segDist[i] ?? 0;
      const hit = radius + (this.segRadius[i] ?? 0);
      const proximity = 1 - clamp((dist - hit) / look, 0, 1);
      if (proximity <= 0) continue;
      const weight = this.segWeight[i] ?? 1;
      danger += align * align * proximity * proximity * weight * scale;
      const close = hit + 64;
      if (dist < close && align > 0.4) {
        danger += ((close - dist) / 64) * align * weight * (150 + caution * 30);
      }
    }
    const travel = Math.min(look * 0.8, 720);
    const futureR = Math.sqrt(distanceSquared(0, 0, this.originX + dirX * travel, this.originY + dirY * travel));
    const limit = this.arena - radius - 24;
    if (futureR > limit) {
      danger += 2800 + (futureR - limit) * 4;
    } else if (this.edgeGap < EDGE_BAND) {
      const outward = Math.atan2(this.originY, this.originX);
      const outAlign = Math.cos(angleDelta(angle, outward));
      if (outAlign > 0) {
        danger += outAlign * (1 - this.edgeGap / EDGE_BAND) * (80 + caution * 40);
      }
    }
    return danger;
  }

  private interestScore(angle: number, greed: number): number {
    let score = 0;
    const sense = this.sense;
    const count = this.foodCount;
    for (let i = 0; i < count; i++) {
      const align = Math.cos(angleDelta(angle, this.foodAngle[i] ?? 0));
      if (align <= 0.08) continue;
      const kind = this.foodKind[i] ?? 0;
      const kindMul = kind === KIND_REMAINS ? 3.4 + greed * 2.4 : kind === KIND_BOOST ? 0.9 : 0.5 + greed * 0.45;
      const attraction = Math.min(this.foodValue[i] ?? 0, 36) * kindMul;
      const distFactor = 1 - clamp((this.foodDist[i] ?? 0) / sense, 0, 1);
      score += attraction * distFactor * align * 18;
    }
    return score;
  }

  private huntScore(angle: number, mass: number): number {
    const count = this.headCount;
    if (count === 0) return 0;
    const aggression = this.personality.aggression;
    const span = 230 + aggression * 540;
    let score = 0;
    for (let i = 0; i < count; i++) {
      const otherMass = this.headMass[i] ?? 0;
      if (mass < otherMass * (0.82 - aggression * 0.28)) continue;
      const align = Math.cos(angleDelta(angle, this.headAim[i] ?? 0));
      if (align <= 0.12) continue;
      const closeness = 1 - (this.headDist[i] ?? 0) / span;
      if (closeness <= 0) continue;
      score += align * closeness * aggression * 70;
    }
    return score;
  }

  private centerScore(angle: number, caution: number): number {
    if (this.edgeGap >= EDGE_BAND) return 0;
    const toCenter = Math.atan2(-this.originY, -this.originX);
    const align = Math.cos(angleDelta(angle, toCenter));
    const pressure = 1 - this.edgeGap / EDGE_BAND;
    return align * pressure * (100 + caution * 60);
  }

  private evolveWander(): void {
    this.wanderAngle = normalizeAngle(this.wanderAngle + this.rng.range(-0.45, 0.45));
    if (this.centerDist > this.arena * 0.38) {
      const toCenter = Math.atan2(-this.originY, -this.originX);
      this.wanderAngle = rotateTowards(this.wanderAngle, toCenter, 0.9);
    }
  }

  private maybeSloppy(angle: number, danger: number): number {
    const caution = this.personality.caution;
    if (caution >= 0.55 || danger > 40) return angle;
    if (!this.rng.chance((0.55 - caution) * 0.24)) return angle;
    return normalizeAngle(angle + this.rng.range(-0.65, 0.65));
  }

  private chooseBoost(self: SnakeView, heading: number, hunt: number, interest: number): boolean {
    if (self.mass < BOOST_FLOOR) return false;
    const gap = this.forwardGap(heading, self.radius);
    const boostiness = this.personality.boostiness;
    if (gap < 130 && this.rng.chance(Math.min(1, 0.35 + boostiness * 0.65))) return true;
    if (self.mass < BOOST_COMFORT) return false;
    const chasing = (this.remainsHeat > 12 && interest > 28) || hunt > 30;
    if (chasing && this.rng.chance(boostiness * 0.8)) return true;
    const reckless = boostiness * (1 - this.personality.caution);
    if (this.boostTimeLeft <= 0 && this.rng.chance(reckless * reckless * 0.2)) {
      this.boostTimeLeft = this.rng.range(0.12, 0.38);
    }
    return this.boostTimeLeft > 0;
  }

  private forwardGap(angle: number, radius: number): number {
    let gap = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.segCount; i++) {
      const align = Math.cos(angleDelta(angle, this.segAngle[i] ?? 0));
      if (align < 0.62) continue;
      const dist = (this.segDist[i] ?? 0) - radius - (this.segRadius[i] ?? 0);
      if (dist < gap) gap = dist;
    }
    return gap;
  }

  private applyEmergency(self: SnakeView, world: WorldView): void {
    const head = self.segments[0];
    if (!head) return;
    const hx = head.x;
    const hy = head.y;
    const speed = self.boosting || this.cachedBoost ? GameConfig.snake.boostSpeed : GameConfig.snake.baseSpeed;
    const edgeGap = world.arenaRadius - Math.sqrt(distanceSquared(0, 0, hx, hy));
    if (edgeGap < self.radius * 2 + 70) {
      this.cachedAngle = Math.atan2(-hy, -hx);
      if (self.mass >= BOOST_FLOOR && edgeGap < self.radius + 40) this.cachedBoost = true;
      return;
    }
    const range = self.radius + 36 + speed * 0.05;
    this.segmentScratch.length = 0;
    const hits = world.querySegments(hx, hy, range, this.segmentScratch);
    const headingX = Math.cos(self.heading);
    const headingY = Math.sin(self.heading);
    const aimX = Math.cos(this.cachedAngle);
    const aimY = Math.sin(this.cachedAngle);
    let tx = 0;
    let ty = 0;
    let weight = 0;
    for (let i = 0; i < hits.length; i++) {
      const seg = hits[i];
      if (!seg || seg.snakeId === self.id) continue;
      const dx = seg.x - hx;
      const dy = seg.y - hy;
      const distSq = dx * dx + dy * dy;
      if (distSq < 0.01) continue;
      const dist = Math.sqrt(distSq);
      const inv = 1 / dist;
      const alignHeading = (dx * headingX + dy * headingY) * inv;
      const alignAim = (dx * aimX + dy * aimY) * inv;
      const hit = self.radius + seg.radius + 8;
      if (dist > hit + 30 || (alignHeading < 0.2 && alignAim < 0.35)) continue;
      const w = (hit + 30 - dist) / (hit + 30);
      tx += dx * inv * w;
      ty += dy * inv * w;
      weight += w;
    }
    if (weight < 0.15) return;
    const away = Math.atan2(-ty, -tx);
    const left = normalizeAngle(away + 0.55);
    const right = normalizeAngle(away - 0.55);
    this.cachedAngle =
      Math.abs(angleDelta(self.heading, left)) < Math.abs(angleDelta(self.heading, right)) ? left : right;
    if (self.mass >= BOOST_FLOOR && (this.personality.boostiness >= 0.45 || weight > 0.85)) {
      this.cachedBoost = true;
    }
  }
}
