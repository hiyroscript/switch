import { Game, WORLD } from "./Game";
import type { GameEvent } from "./Game";
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}
interface Label {
  text: string;
  y: number;
  life: number;
  color: string;
}
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private trail: { x: number; y: number }[] = [];
  private labels: Label[] = [];
  private pulse = 0;
  motion = true;
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
  }
  clear() {
    this.particles = [];
    this.trail = [];
    this.labels = [];
    this.pulse = 0;
  }
  effect(event: GameEvent) {
    const color =
      event.kind === "collision"
        ? "#FF5578"
        : event.kind === "shard"
          ? "#FFD76A"
          : event.kind === "combo"
            ? "#9867FF"
            : "#38E8FF";
    if (this.motion) {
      const count = event.kind === "collision" ? 28 : 10;
      for (let i = 0; i < count && this.particles.length < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 120;
        this.particles.push({
          x: event.x,
          y: event.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.5,
          max: 0.5,
          color,
        });
      }
    }
    if (event.kind === "perfect") {
      this.labels.push({ text: "PERFECT SHIFT +40", y: 230, life: 1.1, color });
      this.pulse = 0.3;
    }
    if (event.kind === "combo")
      this.labels.push({
        text: `MULTIPLIER ×${event.value}`,
        y: 204,
        life: 1.1,
        color,
      });
    if (event.kind === "shard")
      this.labels.push({
        text: `+${event.value}`,
        y: event.y - 30,
        life: 0.65,
        color,
      });
  }
  draw(game: Game, time: number, delta: number) {
    const c = this.ctx;
    const preview = game.state === "MENU";
    const moving = game.active || preview;
    const dt = moving || game.state === "GAME_OVER" ? delta : 0;
    const scroll = this.motion ? (preview ? time * 35 : game.seconds * 55) : 0;
    c.setTransform(
      this.canvas.width / 360,
      0,
      0,
      this.canvas.height / 640,
      0,
      0,
    );
    c.clearRect(0, 0, 360, 640);
    c.fillStyle = "#080B19";
    c.fillRect(0, 0, 360, 640);
    const aura = c.createRadialGradient(290, 350, 0, 240, 350, 290);
    aura.addColorStop(0, game.score >= 1000 ? "#173040" : "#21173d");
    aura.addColorStop(1, "#080B19");
    c.fillStyle = aura;
    c.fillRect(0, 0, 360, 640);
    // Deterministic, quiet starfield. Visual animation never changes simulation.
    for (let i = 0; i < 42; i++) {
      const x =
        (((i * 97.3 - scroll * (0.12 + (i % 3) * 0.08)) % 380) + 380) % 380;
      const y = (i * 137.9) % 620;
      c.fillStyle = i % 4 === 0 ? "#6b638e" : "#272b46";
      c.fillRect(x, y, i % 4 === 0 ? 1.7 : 1, 1);
    }
    c.lineWidth = 0.5;
    c.strokeStyle = "#25213e";
    for (let i = -5; i < 12; i++) {
      c.beginPath();
      c.moveTo(180 + i * 28, 475);
      c.lineTo(180 + i * 95, 640);
      c.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const y = 475 + ((i * 30 + scroll * 0.25) % 165);
      c.globalAlpha = (y - 475) / 250;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(360, y);
      c.stroke();
    }
    c.globalAlpha = 1;
    for (const [index, y] of WORLD.lanes.entries()) {
      const laneGradient = c.createLinearGradient(0, y - 30, 0, y + 30);
      laneGradient.addColorStop(0, "#38e8ff00");
      laneGradient.addColorStop(0.5, index === 0 ? "#38e8ff0c" : "#9867ff0e");
      laneGradient.addColorStop(1, "#38e8ff00");
      c.fillStyle = laneGradient;
      c.fillRect(0, y - 30, 360, 60);
      const line = c.createLinearGradient(0, 0, 360, 0);
      line.addColorStop(0, "#38e8ff11");
      line.addColorStop(0.3, index === 0 ? "#38e8ff66" : "#9867ff77");
      line.addColorStop(1, "#9867ff22");
      c.strokeStyle = line;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(360, y);
      c.stroke();
      c.strokeStyle = "#73749824";
      c.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const x = (((i * 90 - scroll) % 450) + 450) % 450;
        c.beginPath();
        c.moveTo(x + 4, y - 4);
        c.lineTo(x, y);
        c.lineTo(x + 4, y + 4);
        c.stroke();
      }
      c.font = "8px monospace";
      c.fillStyle = "#676881";
      c.fillText(`0${index + 1}`, 17, y - 18);
    }
    const hazards = preview
      ? [
          { x: 245, lane: 0 as const },
          { x: 365, lane: 1 as const },
        ]
      : game.hazards;
    for (const h of hazards) {
      const y = WORLD.lanes[h.lane];
      c.shadowColor = "#ff5578";
      c.shadowBlur = this.motion ? 16 : 0;
      c.fillStyle = "#4b1d37";
      c.strokeStyle = "#ff6687";
      c.lineWidth = 1.6;
      c.beginPath();
      c.roundRect(h.x - 13, y - 28, 26, 56, 4);
      c.fill();
      c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = "#ff557829";
      c.fillRect(h.x - 9, y - 23, 18, 46);
      c.strokeStyle = "#ff97ab";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(h.x - 4, y - 5);
      c.lineTo(h.x + 4, y + 5);
      c.moveTo(h.x + 4, y - 5);
      c.lineTo(h.x - 4, y + 5);
      c.stroke();
      c.fillStyle = "#ffc1cf";
      c.fillRect(h.x - 8, y - 25, 16, 2);
    }
    const shards = preview
      ? [
          { x: 191, lane: 1 as const },
          { x: 282, lane: 1 as const },
        ]
      : game.shards;
    for (const s of shards) {
      const y = WORLD.lanes[s.lane];
      c.save();
      c.translate(s.x, y);
      c.rotate(Math.PI / 4);
      c.shadowColor = "#FFD76A";
      c.shadowBlur = this.motion ? 15 : 0;
      c.fillStyle = "#ffd76a";
      c.fillRect(-5, -5, 10, 10);
      c.shadowBlur = 0;
      c.fillStyle = "#fff2b7";
      c.fillRect(-3, -3, 3, 3);
      c.strokeStyle = "#ffd76a30";
      c.strokeRect(-9, -9, 18, 18);
      c.restore();
    }
    const playerY = preview ? 414 : game.y;
    if (moving && this.motion) {
      this.trail.unshift({ x: 80, y: playerY });
      this.trail = this.trail.slice(0, 18);
    }
    if (this.motion)
      this.trail.forEach((p, i) => {
        c.globalAlpha = (1 - i / 18) * 0.3;
        c.fillStyle = "#38e8ff";
        c.beginPath();
        c.arc(p.x - i * 3.5, p.y, Math.max(1, 9 - i * 0.45), 0, Math.PI * 2);
        c.fill();
      });
    c.globalAlpha = 1;
    c.shadowColor = "#38e8ff";
    c.shadowBlur = this.motion ? 25 : 0;
    c.fillStyle = "#38e8ff";
    c.beginPath();
    c.arc(80, playerY, 10, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = "#e6fdff";
    c.beginPath();
    c.arc(80, playerY, 5.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#38e8ff44";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(80, playerY, 16, 0, Math.PI * 2);
    c.stroke();
    if (preview) {
      c.strokeStyle = "#38e8ff55";
      c.setLineDash([3, 5]);
      c.beginPath();
      c.moveTo(80, 390);
      c.lineTo(80, 326);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#38e8ff77";
      c.beginPath();
      c.moveTo(76, 332);
      c.lineTo(80, 326);
      c.lineTo(84, 332);
      c.fill();
      c.font = "9px monospace";
      c.fillStyle = "#9299b4";
      c.fillText("ONE TAP. SWITCH LANES.", 105, 362);
    }
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      c.globalAlpha = Math.max(0, p.life / p.max);
      c.fillStyle = p.color;
      c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    c.textAlign = "center";
    for (const label of this.labels) {
      label.life -= dt;
      if (this.motion) label.y -= dt * 12;
      c.globalAlpha = Math.min(1, Math.max(0, label.life * 3));
      c.fillStyle = label.color;
      c.font = "bold 12px monospace";
      c.fillText(label.text, label.text.startsWith("+") ? 80 : 180, label.y);
    }
    this.labels = this.labels.filter((l) => l.life > 0);
    c.globalAlpha = 1;
    c.textAlign = "left";
    if (this.pulse > 0 && this.motion) {
      c.strokeStyle = `rgba(56,232,255,${this.pulse})`;
      c.lineWidth = 4;
      c.strokeRect(2, 2, 356, 636);
      this.pulse -= dt;
    }
  }
}
