export interface Preferences {
  best: number;
  sound: boolean;
  motion: boolean;
  played: boolean;
}
const KEY = "switch-rush:v1";
export class Storage {
  private storage?: Pick<globalThis.Storage, "getItem" | "setItem">;
  constructor(storage?: Pick<globalThis.Storage, "getItem" | "setItem">) {
    try {
      this.storage = storage ?? globalThis.localStorage;
    } catch {
      /* Private browsing can deny access. */
    }
  }
  load(reducedMotion = false): Preferences {
    const defaults: Preferences = {
      best: 0,
      sound: true,
      motion: !reducedMotion,
      played: false,
    };
    try {
      const data: unknown = JSON.parse(this.storage?.getItem(KEY) ?? "null");
      if (!data || typeof data !== "object") return defaults;
      const p = data as Partial<Preferences>;
      return {
        best:
          typeof p.best === "number" &&
          Number.isSafeInteger(p.best) &&
          p.best >= 0
            ? p.best
            : 0,
        sound: typeof p.sound === "boolean" ? p.sound : true,
        motion: typeof p.motion === "boolean" ? p.motion : !reducedMotion,
        played: p.played === true,
      };
    } catch {
      return defaults;
    }
  }
  save(prefs: Preferences) {
    try {
      this.storage?.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* Runs still work without persistence. */
    }
  }
}
