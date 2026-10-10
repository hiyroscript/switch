import "./style.css";
import { Game, STEP } from "./game/Game";
import { Renderer } from "./game/Renderer";
import { Audio } from "./systems/Audio";
import { Storage } from "./systems/Storage";

const icons = {
  sound:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5v14M16 5v14"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
};
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
 <header class="site-header"><a class="wordmark" href="./" aria-label="Switch Rush home"><span class="brand-icon">ϟ</span> SWITCH<span>RUSH</span></a><div class="edition"><i></i> THE ONE-TAP ARCADE <span>/ VOL. 01</span></div></header>
 <main class="layout">
  <aside class="intro"><span class="eyebrow">SMALL GAME. BIG RUSH.</span><h1>Find your<br>flow.<br><em>Beat your<br>best.</em></h1><p>No levels. No limits.<br>Just you and the next switch.</p><div class="mini-lanes"><span></span><span></span><b></b></div><span class="side-note">BUILT FOR “ONE MORE TRY.”</span></aside>
  <section class="game-shell" aria-label="Switch Rush arcade game">
   <div class="frame-top"><span><i></i> SWITCH RUSH</span><span>∞ ENDLESS</span></div>
   <div class="stage" id="stage">
    <canvas id="game" tabindex="0" aria-label="Game arena. Press Space to switch lanes. Press Escape to pause."></canvas>
    <div class="utility"><button id="sound" class="icon-button" aria-label="Mute sound" title="Mute sound"></button><button id="pause" class="icon-button" aria-label="Pause game" title="Pause (Esc)" hidden>${icons.pause}</button></div>
    <div id="hud" class="hud" hidden><span class="eyebrow">SCORE</span><strong id="score">0</strong><div class="hud-detail"><span>BEST <b id="hud-best">0</b></span><span class="combo" id="combo">×1</span></div><div class="streak-track" aria-label="Shard streak"><i id="streak"></i></div></div>
    <div id="menu" class="screen menu">
     <div class="menu-title"><div class="eyebrow"><span class="tiny-line"></span> AN INSTANT ARCADE HIT</div><h2>SWITCH<br><span>RUSH<span class="logo-dot">.</span></span></h2><p>Two lanes. One tap.<br><span>How long can you survive?</span></p></div>
     <div class="menu-bottom"><div class="best-pill"><span>♛</span> PERSONAL BEST <b id="menu-best">0</b></div><button class="primary" id="start">TAP TO PLAY ${icons.arrow}</button><p class="control-hint">Tap the arena or press <kbd>SPACE</kbd> to switch</p></div>
    </div>
    <div id="play-hint" class="play-hint" hidden><span id="tutorial-text">TAP TO SWITCH</span><small>Stay in the clear. Follow the diamonds.</small><div class="tap-demo" aria-hidden="true">● <span>↕</span> ○</div></div>
    <div id="run-footer" class="run-footer" hidden><span><i></i> STAY IN THE FLOW</span><span id="time">00:00</span></div>
    <div id="paused" class="screen veil" hidden><div class="dialog"><span class="eyebrow">TAKE A BREATH</span><h2>Rush on<br>your terms.</h2><p>Your run is right where you left it.</p><button id="resume" class="primary">RESUME ${icons.arrow}</button><button class="text-button" id="pause-menu">MAIN MENU</button></div></div>
    <div id="over" class="screen veil" hidden><div class="dialog"><span id="result-label" class="eyebrow">A GOOD RUN. GO AGAIN.</span><h2 id="result-title">So close.<br>One more?</h2><span class="result-caption">FINAL SCORE</span><strong id="final-score" class="final-score">0</strong><div class="result-best">PERSONAL BEST <b id="result-best">0</b></div><div class="stats"><div><strong id="final-shards">0</strong><span>SHARDS</span></div><div><strong id="final-time">0s</strong><span>SURVIVED</span></div><div><strong id="final-perfects">0</strong><span>PERFECT</span></div></div><button id="retry" class="primary">PLAY AGAIN ${icons.arrow}</button><button id="over-menu" class="text-button">MAIN MENU</button></div></div>
   </div>
   <div class="frame-bottom"><span class="frame-dots">● ● ●</span><span>TWO LANES. INFINITE POSSIBILITIES.</span><span>01</span></div>
  </section>
  <aside class="guide"><div class="guide-heading"><span class="eyebrow">THE PLAYBOOK</span><span>01—03</span></div><article><span class="guide-number">01</span><div><h3>Switch. Survive.</h3><p>One tap takes you to the other lane. Dodge the coral barriers.</p><div class="legend"><span class="barrier-icon">×</span><span>KEEP CLEAR</span></div></div></article><article><span class="guide-number">02</span><div><h3>Collect your momentum.</h3><p>Grab energy shards. Every five in a row boosts your multiplier.</p><div class="legend"><span class="shard-icon"></span><span>25 PTS × MULTIPLIER</span></div></div></article><article><span class="guide-number">03</span><div><h3>Leave it late.</h3><p>Switch just before a barrier arrives to land a Perfect Shift.</p><div class="legend perfect-legend"><span>↯</span><span>PERFECT SHIFT +40</span></div></div></article><div class="keyboard-note"><kbd>SPACE</kbd> SWITCH <span>·</span> <kbd>ESC</kbd> PAUSE</div></aside>
 </main>
 <footer class="site-footer"><span>PURE PLAY. NO DISTRACTIONS.</span><button id="motion" aria-pressed="false">REDUCED MOTION <span>OFF</span></button><span class="footer-end">CHASE THE FEELING <span>↗</span></span></footer>
 <div id="announcement" class="sr-only" role="status" aria-live="polite"></div>`;

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const store = new Storage();
const prefs = store.load(
  matchMedia("(prefers-reduced-motion: reduce)").matches,
);
const audio = new Audio();
const game = new Game();
const canvas = $<HTMLCanvasElement>("game");
const renderer = new Renderer(canvas);
let accumulator = 0;
let previousTime = 0;
let previousState = game.state;
let resultAt = 0;
let needsDraw = true;
let impactTime = 0;
let displayScore = -1;
let displaySeconds = -1;
const number = (n: number) => n.toLocaleString("en-US");
function preferences() {
  needsDraw = true;
  audio.enabled = prefs.sound;
  renderer.motion = prefs.motion;
  $("sound").innerHTML = prefs.sound ? icons.sound : icons.mute;
  $("sound").setAttribute(
    "aria-label",
    prefs.sound ? "Mute sound" : "Unmute sound",
  );
  $("sound").title = prefs.sound ? "Mute sound" : "Unmute sound";
  $("sound").setAttribute("aria-pressed", String(!prefs.sound));
  $("motion").innerHTML =
    `REDUCED MOTION <span>${prefs.motion ? "OFF" : "ON"}</span>`;
  $("motion").setAttribute("aria-pressed", String(!prefs.motion));
  document.body.classList.toggle("reduced-motion", !prefs.motion);
  store.save(prefs);
}
function start() {
  audio.unlock();
  audio.play("menu");
  game.start(crypto.getRandomValues(new Uint32Array(1))[0], !prefs.played);
  prefs.played = true;
  store.save(prefs);
  renderer.clear();
  accumulator = 0;
  displayScore = displaySeconds = -1;
  sync();
  canvas.focus({ preventScroll: true });
}
function sync() {
  needsDraw = true;
  const active = game.active;
  $("menu").hidden = game.state !== "MENU";
  $("hud").hidden = game.state === "MENU";
  $("pause").hidden = !active;
  $("paused").hidden = game.state !== "PAUSED";
  $("over").hidden = game.state !== "GAME_OVER";
  $("play-hint").hidden = !active || game.seconds >= 7;
  $("run-footer").hidden = !active;
  $("menu-best").textContent = $("hud-best").textContent = number(prefs.best);
  if (game.state === "GAME_OVER" && previousState !== "GAME_OVER") {
    const newBest = game.score > prefs.best;
    if (newBest) {
      prefs.best = game.score;
      store.save(prefs);
      audio.play("best");
    }
    $("final-score").textContent = number(game.score);
    $("result-best").textContent = number(prefs.best);
    $("final-shards").textContent = String(game.shardsCollected);
    $("final-time").textContent = `${game.seconds.toFixed(1)}s`;
    $("final-perfects").textContent = String(game.perfects);
    $("result-label").textContent = newBest
      ? "✦ NEW BEST! ✦"
      : "A GOOD RUN. GO AGAIN.";
    $("result-title").innerHTML = newBest
      ? "That’s your<br>new best."
      : "So close.<br>One more?";
    $("over").classList.toggle("new-best", newBest);
    $("announcement").textContent =
      `${newBest ? "New best! " : ""}Run ended. ${game.score} points. ${game.shardsCollected} shards.`;
    impactTime = 0.6;
    resultAt = performance.now();
    $("retry").focus({ preventScroll: true });
  }
  if (game.state === "PAUSED" && previousState !== "PAUSED")
    $("resume").focus({ preventScroll: true });
  if (game.state === "MENU" && previousState !== "MENU")
    $("start").focus({ preventScroll: true });
  previousState = game.state;
}
function pause() {
  game.pause();
  accumulator = 0;
  sync();
}
function resume() {
  game.resume();
  accumulator = 0;
  previousTime = performance.now();
  sync();
  canvas.focus({ preventScroll: true });
}
function menu() {
  game.menu();
  renderer.clear();
  sync();
}
$("start").addEventListener("click", start);
$("retry").addEventListener("click", start);
$("pause").addEventListener("click", pause);
$("resume").addEventListener("click", resume);
$("over-menu").addEventListener("click", menu);
$("pause-menu").addEventListener("click", menu);
$("sound").addEventListener("click", () => {
  prefs.sound = !prefs.sound;
  preferences();
  audio.unlock();
  audio.play("menu");
});
$("motion").addEventListener("click", () => {
  prefs.motion = !prefs.motion;
  preferences();
  renderer.clear();
});
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  audio.unlock();
  canvas.focus({ preventScroll: true });
  if (game.active) game.shift();
});
document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const buttonFocused = document.activeElement?.tagName === "BUTTON";
  if (event.code === "Escape" || event.code === "KeyP") {
    event.preventDefault();
    if (game.state === "PAUSED") resume();
    else pause();
    return;
  }
  if (
    !["Space", "ArrowUp", "ArrowDown"].includes(event.code) ||
    (buttonFocused && event.code === "Space")
  )
    return;
  event.preventDefault();
  audio.unlock();
  if (game.active)
    game.shift(
      event.code === "ArrowUp" ? 0 : event.code === "ArrowDown" ? 1 : undefined,
    );
  else if (
    event.code === "Space" &&
    (game.state === "MENU" ||
      (game.state === "GAME_OVER" && performance.now() - resultAt > 250))
  )
    start();
});
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  previousTime = performance.now();
});
new ResizeObserver(() => {
  renderer.resize();
  needsDraw = true;
}).observe($("stage"));
function frame(now: number) {
  const delta = Math.min(
    0.05,
    Math.max(0, (now - (previousTime || now)) / 1000),
  );
  previousTime = now;
  if (!document.hidden) {
    if (game.active) {
      accumulator += delta;
      while (accumulator >= STEP) {
        game.update();
        accumulator -= STEP;
      }
    } else accumulator = 0;
    for (const event of game.events) {
      renderer.effect(event);
      audio.play(event.kind);
    }
    game.events = [];
    if (previousState !== game.state) sync();
    if (displayScore !== game.score) {
      displayScore = game.score;
      $("score").textContent = number(game.score);
    }
    const seconds = Math.floor(game.seconds);
    if (displaySeconds !== seconds) {
      displaySeconds = seconds;
      $("time").textContent =
        `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
      $("play-hint").hidden = !game.active || seconds >= 7;
    }
    const combo = `×${game.multiplier}`;
    if ($("combo").textContent !== combo) $("combo").textContent = combo;
    const width = `${(game.streak % 5) * 20}%`;
    if ($("streak").style.width !== width) $("streak").style.width = width;
    if (
      game.active ||
      (game.state === "MENU" && prefs.motion) ||
      impactTime > 0 ||
      needsDraw
    ) {
      renderer.draw(game, now / 1000, delta);
      needsDraw = false;
      impactTime = Math.max(0, impactTime - delta);
    }
  }
  requestAnimationFrame(frame);
}
preferences();
sync();
requestAnimationFrame(frame);
