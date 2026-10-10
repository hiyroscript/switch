export const WORLD = {
  width: 360,
  height: 640,
  playerX: 80,
  lanes: [302, 414],
  radius: 10,
  obstacleWidth: 26,
  obstacleHeight: 56,
} as const;
export const STEP = 1 / 120;
export const SWITCH_TICKS = 17;
export type Lane = 0 | 1;
export type State = "MENU" | "TUTORIAL" | "PLAYING" | "PAUSED" | "GAME_OVER";
export type EventKind = "switch" | "shard" | "combo" | "perfect" | "collision";
export interface GameEvent {
  kind: EventKind;
  x: number;
  y: number;
  value?: number;
}
export interface Hazard {
  id: number;
  x: number;
  lane: Lane;
  rewarded: boolean;
}
export interface Shard {
  id: number;
  x: number;
  lane: Lane;
}
export interface Spawn {
  lane: Lane;
  gap: number;
}

/** Small, proven single-barrier patterns. The seed controls only pattern selection. */
export class Spawner {
  private seed: number;
  private pattern: readonly Lane[] = [0, 0, 1];
  private index = 0;
  constructor(seed: number) {
    this.seed = seed >>> 0 || 1;
  }
  private random() {
    let s = this.seed;
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    this.seed = s >>> 0;
    return this.seed / 4294967296;
  }
  next(seconds: number): Spawn {
    if (this.index >= this.pattern.length) {
      const patterns: readonly (readonly Lane[])[] =
        seconds < 10
          ? [
              [0, 0, 1],
              [1, 1, 0],
            ]
          : [
              [0, 1, 0, 1],
              [1, 1, 0, 0],
              [0, 1, 1, 0],
              [1, 0, 1, 0],
            ];
      this.pattern = patterns[Math.floor(this.random() * patterns.length)];
      this.index = 0;
    }
    // Minimum .92 s between spawns, > .70 s between hazard centers even
    // across acceleration. Clearing a barrier + switching needs < .43 s.
    return {
      lane: this.pattern[this.index++],
      gap: Math.max(0.92, 1.85 - seconds * 0.0124),
    };
  }
}

export function circleHitsBox(
  x: number,
  y: number,
  radius: number,
  boxX: number,
  boxY: number,
  width: number,
  height: number,
) {
  const dx = x - Math.max(boxX - width / 2, Math.min(x, boxX + width / 2));
  const dy = y - Math.max(boxY - height / 2, Math.min(y, boxY + height / 2));
  return dx * dx + dy * dy <= radius * radius;
}

export class Game {
  state: State = "MENU";
  ticks = 0;
  bonus = 0;
  streak = 0;
  shardsCollected = 0;
  perfects = 0;
  lane: Lane = 0;
  y: number = WORLD.lanes[0];
  hazards: Hazard[] = [];
  shards: Shard[] = [];
  events: GameEvent[] = [];
  switchStart = -SWITCH_TICKS;
  private from: Lane = 0;
  private nextSpawn = 96;
  private serial = 0;
  private spawner = new Spawner(1);
  private resumeState: State = "PLAYING";
  private candidates: number[] = [];
  get active() {
    return this.state === "PLAYING" || this.state === "TUTORIAL";
  }
  get seconds() {
    return this.ticks * STEP;
  }
  get score() {
    return Math.floor(this.ticks / 12) + this.bonus;
  }
  get multiplier() {
    return Math.min(4, 1 + Math.floor(this.streak / 5));
  }
  get speed() {
    return Math.min(255, 170 + this.seconds * 1.13);
  }
  get switching() {
    return this.ticks - this.switchStart < SWITCH_TICKS;
  }
  start(seed = 1, tutorial = false) {
    this.state = tutorial ? "TUTORIAL" : "PLAYING";
    this.ticks =
      this.bonus =
      this.streak =
      this.shardsCollected =
      this.perfects =
      this.serial =
        0;
    this.lane = this.from = 0;
    this.y = WORLD.lanes[0];
    this.hazards = [];
    this.shards = [];
    this.events = [];
    this.candidates = [];
    this.switchStart = -SWITCH_TICKS;
    this.nextSpawn = 96;
    this.spawner = new Spawner(seed);
  }
  menu() {
    this.state = "MENU";
    this.events = [];
  }
  pause() {
    if (this.active) {
      this.resumeState = this.state;
      this.state = "PAUSED";
    }
  }
  resume() {
    if (this.state === "PAUSED") this.state = this.resumeState;
  }
  shift(target: Lane = this.lane === 0 ? 1 : 0) {
    if (!this.active || this.switching || target === this.lane) return false;
    this.from = this.lane;
    this.lane = target;
    this.switchStart = this.ticks;
    this.candidates = this.hazards
      .filter(
        (h) =>
          h.lane === this.from &&
          !h.rewarded &&
          h.x > WORLD.playerX &&
          (h.x - WORLD.playerX) / this.speed <= 0.22 + SWITCH_TICKS * STEP,
      )
      .map((h) => h.id);
    this.events.push({ kind: "switch", x: WORLD.playerX, y: this.y });
    return true;
  }
  collect() {
    const value = 25 * this.multiplier;
    const before = this.multiplier;
    this.bonus += value;
    this.shardsCollected++;
    this.streak++;
    this.events.push({ kind: "shard", x: WORLD.playerX, y: this.y, value });
    if (before !== this.multiplier)
      this.events.push({
        kind: "combo",
        x: WORLD.playerX,
        y: this.y,
        value: this.multiplier,
      });
  }
  update() {
    if (!this.active) return;
    this.ticks++;
    if (this.state === "TUTORIAL" && this.ticks >= 600) this.state = "PLAYING";
    const progress = Math.min(
      1,
      (this.ticks - this.switchStart) / SWITCH_TICKS,
    );
    const ease = progress * progress * (3 - 2 * progress);
    this.y =
      WORLD.lanes[this.from] +
      (WORLD.lanes[this.lane] - WORLD.lanes[this.from]) * ease;
    if (this.ticks >= this.nextSpawn) {
      const spawn = this.spawner.next(this.seconds);
      this.hazards.push({
        id: this.serial++,
        x: 400,
        lane: spawn.lane,
        rewarded: false,
      });
      // Every shard is on the open route, aligned with a single barrier.
      this.shards.push({
        id: this.serial++,
        x: 400,
        lane: spawn.lane === 0 ? 1 : 0,
      });
      // Optional extra reward in the clear space between barriers.
      if (this.seconds > 12 && this.serial % 6 === 0)
        this.shards.push({
          id: this.serial++,
          x: 400 + this.speed * spawn.gap * 0.45,
          lane: spawn.lane,
        });
      this.nextSpawn += Math.ceil(spawn.gap / STEP);
    }
    const movement = this.speed * STEP;
    for (const h of this.hazards) {
      h.x -= movement;
      if (
        circleHitsBox(
          WORLD.playerX,
          this.y,
          WORLD.radius,
          h.x,
          WORLD.lanes[h.lane],
          WORLD.obstacleWidth,
          WORLD.obstacleHeight,
        )
      ) {
        this.state = "GAME_OVER";
        this.events.push({ kind: "collision", x: WORLD.playerX, y: this.y });
        return;
      }
    }
    if (this.ticks - this.switchStart === SWITCH_TICKS) {
      for (const h of this.hazards) {
        const arrival = (h.x - WORLD.playerX) / this.speed;
        if (
          this.candidates.includes(h.id) &&
          !h.rewarded &&
          arrival > 0 &&
          arrival <= 0.22
        ) {
          h.rewarded = true;
          this.bonus += 40;
          this.perfects++;
          this.events.push({
            kind: "perfect",
            x: WORLD.playerX,
            y: this.y,
            value: 40,
          });
        }
      }
      this.candidates = [];
    }
    this.shards = this.shards.filter((s) => {
      s.x -= movement;
      if (Math.hypot(s.x - WORLD.playerX, WORLD.lanes[s.lane] - this.y) <= 20) {
        this.collect();
        return false;
      }
      if (s.x < WORLD.playerX - 22) {
        this.streak = 0;
        return false;
      }
      return true;
    });
    this.hazards = this.hazards.filter((h) => h.x > -40);
  }
}
