export type Sound =
  | "switch"
  | "shard"
  | "combo"
  | "perfect"
  | "collision"
  | "best"
  | "menu";
export class Audio {
  enabled = true;
  private context?: AudioContext;
  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  play(kind: Sound) {
    if (!this.enabled || !this.context || this.context.state !== "running")
      return;
    const notes: Record<Sound, number[]> = {
      switch: [320, 520],
      shard: [740, 988],
      combo: [660, 880, 1320],
      perfect: [880, 1175, 1568],
      collision: [140, 65],
      best: [523, 659, 784, 1047],
      menu: [440, 660],
    };
    const ctx = this.context;
    notes[kind].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + index * 0.055;
      oscillator.type = kind === "collision" ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * (kind === "collision" ? 0.4 : 1.08),
        start + 0.11,
      );
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.007);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    });
  }
}
