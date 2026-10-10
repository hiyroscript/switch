import { describe, it, expect } from "vitest";
import {
  Game,
  Spawner,
  STEP,
  SWITCH_TICKS,
  WORLD,
  circleHitsBox,
} from "../src/game/Game";
import { Storage } from "../src/systems/Storage";

function ticks(game: Game, count: number) {
  for (let i = 0; i < count; i++) game.update();
}

describe("run lifecycle and input", () => {
  it("starts, finishes tutorial, pauses and resumes without advancing time", () => {
    const g = new Game();
    expect(g.state).toBe("MENU");
    g.start(1, true);
    expect(g.state).toBe("TUTORIAL");
    g.pause();
    ticks(g, 100);
    expect(g.ticks).toBe(0);
    expect(g.shift()).toBe(false);
    g.resume();
    expect(g.state).toBe("TUTORIAL");
    for (let i = 0; i < 600; i++) {
      g.hazards = [];
      g.update();
    }
    expect(g.state).toBe("PLAYING");
    g.menu();
    expect(g.state).toBe("MENU");
  });
  it("changes lanes in 17 fixed steps and ignores input until completion", () => {
    const g = new Game();
    g.start();
    expect(g.shift(0)).toBe(false);
    expect(g.shift(1)).toBe(true);
    expect(g.shift(0)).toBe(false);
    ticks(g, 8);
    expect(g.y).toBeGreaterThan(302);
    expect(g.y).toBeLessThan(414);
    ticks(g, SWITCH_TICKS - 8);
    expect(g.y).toBe(414);
    expect(g.shift(0)).toBe(true);
    ticks(g, SWITCH_TICKS);
    expect(g.y).toBe(302);
  });
  it("collides, then completely resets on repeated restart", () => {
    const g = new Game();
    for (let i = 0; i < 20; i++) {
      g.start(i);
      g.collect();
      g.hazards.push({ id: 10, x: 80, lane: 0, rewarded: false });
      g.update();
      expect(g.state).toBe("GAME_OVER");
      expect(g.events.at(-1)?.kind).toBe("collision");
      g.start(i);
      expect(g.score).toBe(0);
      expect(g.streak).toBe(0);
      expect(g.shardsCollected).toBe(0);
      expect(g.perfects).toBe(0);
      expect(g.hazards).toEqual([]);
      expect(g.shards).toEqual([]);
      expect(g.events).toEqual([]);
      expect(g.y).toBe(302);
    }
  });
});
describe("score and collectibles", () => {
  it("awards exactly 10 survival points per second", () => {
    const g = new Game();
    g.start();
    ticks(g, 120);
    expect(g.score).toBe(10);
    for (let i = 0; i < 12000; i++) {
      g.hazards = [];
      g.shards = [];
      g.update();
    }
    expect(g.score).toBe(1010);
  });
  it("uses the active multiplier, increases each five shards and caps at four", () => {
    const g = new Game();
    g.start();
    for (let i = 0; i < 5; i++) g.collect();
    expect(g.bonus).toBe(125);
    expect(g.multiplier).toBe(2);
    for (let i = 0; i < 5; i++) g.collect();
    expect(g.bonus).toBe(375);
    expect(g.multiplier).toBe(3);
    for (let i = 0; i < 5; i++) g.collect();
    expect(g.bonus).toBe(750);
    expect(g.multiplier).toBe(4);
    g.collect();
    expect(g.bonus).toBe(850);
    expect(g.multiplier).toBe(4);
    g.shards.push({ id: 10, x: 55, lane: 1 });
    g.update();
    expect(g.streak).toBe(0);
    expect(g.multiplier).toBe(1);
  });
  it("collects shards by position only once", () => {
    const g = new Game();
    g.start();
    g.shards.push({ id: 1, x: 81, lane: 0 });
    ticks(g, 2);
    expect(g.shardsCollected).toBe(1);
    expect(g.bonus).toBe(25);
    expect(g.shards).toHaveLength(0);
  });
});
describe("perfect shifts and collision geometry", () => {
  it("awards 40 once for a precise completed escape", () => {
    const g = new Game();
    g.start();
    g.hazards.push({ id: 1, x: 80 + 170 * 0.32, lane: 0, rewarded: false });
    g.shift();
    ticks(g, 17);
    expect(g.state).toBe("PLAYING");
    expect(g.bonus).toBe(40);
    expect(g.perfects).toBe(1);
    expect(g.hazards[0].rewarded).toBe(true);
    ticks(g, 50);
    expect(g.bonus).toBe(40);
    expect(g.perfects).toBe(1);
  });
  it("does not reward early switches or empty-lane spam", () => {
    const g = new Game();
    g.start();
    g.hazards.push({ id: 1, x: 260, lane: 0, rewarded: false });
    g.shift();
    ticks(g, 17);
    expect(g.bonus).toBe(0);
    g.hazards = [];
    for (let i = 0; i < 10; i++) {
      g.shift();
      ticks(g, 17);
    }
    expect(g.perfects).toBe(0);
  });
  it("handles box edges, rounded circle corners, and the empty lane", () => {
    expect(circleHitsBox(80, 302, 10, 103, 302, 26, 56)).toBe(true);
    expect(circleHitsBox(80, 302, 10, 104, 302, 26, 56)).toBe(false);
    expect(circleHitsBox(80, 414, 10, 80, 302, 26, 56)).toBe(false);
    expect(circleHitsBox(0, 0, 10, 22, 37, 26, 56)).toBe(false);
  });
});
describe("seeded generation and fairness", () => {
  it("produces identical sequences for the same seed and varies between seeds", () => {
    const sequence = (seed: number) => {
      const s = new Spawner(seed);
      return Array.from({ length: 100 }, (_, i) => s.next(i));
    };
    expect(sequence(123)).toEqual(sequence(123));
    expect(sequence(123)).not.toEqual(sequence(321));
  });
  it("keeps conservative reaction and switch margins for thousands of patterns", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const s = new Spawner(seed);
      for (let t = 0; t < 600; t += 2) {
        const spawn = s.next(t);
        if (spawn.gap < 0.92) throw new Error("Insufficient spawn gap");
        // Visible lead at maximum speed, including the entire barrier width.
        if ((360 - WORLD.playerX - 13) / 255 <= 1)
          throw new Error("Insufficient reaction time");
        const minimumSpatialGap = 170 * spawn.gap;
        const crossingClearance = (minimumSpatialGap - 26 - 20) / 255;
        if (crossingClearance <= SWITCH_TICKS * STEP + 0.2)
          throw new Error("Insufficient switch clearance");
      }
    }
  });
  it("has a survivable path over the full difficulty curve for 30 seeds", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const g = new Game();
      g.start(seed);
      for (let i = 0; i < 120 * 110; i++) {
        const incoming = g.hazards
          .filter((h) => h.x > 80 - 24)
          .sort((a, b) => a.x - b.x)[0];
        if (
          incoming &&
          incoming.lane === g.lane &&
          incoming.x < 80 + g.speed * 0.6
        )
          g.shift();
        g.update();
        g.events = [];
        if (g.state !== "PLAYING")
          throw new Error(`No safe route at seed ${seed}, t=${g.seconds}`);
        for (let j = 1; j < g.hazards.length; j++) {
          if (g.hazards[j].x - g.hazards[j - 1].x <= 150)
            throw new Error("Unsafe hazard spacing");
        }
      }
    }
  });
});
describe("persistence", () => {
  it("round trips the best score and preferences", () => {
    const data = new Map<string, string>();
    const storage = new Storage({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
    });
    const prefs = { best: 1234, sound: false, motion: false, played: true };
    storage.save(prefs);
    expect(storage.load()).toEqual(prefs);
  });
  it("handles unavailable, malformed, and invalid storage", () => {
    const denied = new Storage({
      getItem() {
        throw Error("denied");
      },
      setItem() {
        throw Error("full");
      },
    });
    expect(denied.load(true).motion).toBe(false);
    expect(() => denied.save(denied.load())).not.toThrow();
    for (const raw of [
      "broken",
      "null",
      "[]",
      '{"best":-2}',
      '{"best":"999","sound":"yes"}',
      '{"best":1e99}',
    ]) {
      const s = new Storage({ getItem: () => raw, setItem() {} });
      expect(s.load().best).toBe(0);
      expect(s.load().sound).toBe(true);
    }
  });
});
