# SWITCH RUSH

**Two lanes. One tap. How long can you survive?**

A lightweight neon arcade survival game built with TypeScript, Vite, and Canvas 2D. Dodge barriers, collect energy shards, and land last-second Perfect Shifts. No account, analytics, ads, external assets, or backend.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

```sh
npm run build    # Type-check and create dist/
npm run preview  # Serve the production build locally
npm test         # Deterministic simulation and persistence tests
```

Browser smoke tests use Chromium on desktop and an emulated touch phone:

```sh
npx playwright install --with-deps chromium
npm run test:browser
```

## How to play

- Tap **TAP TO PLAY**. Tap anywhere in the arena or press **Space** to switch lanes.
- **↑ / ↓** select the upper or lower lane. A switch takes about 140 ms; extra inputs during it are ignored. Holding a key does not repeat switches.
- Avoid the coral rectangles marked **×**. Collect gold diamonds.
- **Escape / P**, or the pause button, pauses and resumes. Leaving the tab or window pauses automatically; resume explicitly when ready.
- Retry with one press of **PLAY AGAIN**. Sound and reduced-motion controls remain available. Preferences and your best score are saved locally when browser storage permits.

## Scoring

- Survival: **10 points per second**, rounded down.
- Shards: **25 × the current multiplier**. Every five consecutive pickups raises the multiplier, up to ×4. The fifth pickup uses the previous multiplier; the next uses the new one. Missing any shard resets the streak.
- Perfect Shift: **40 points** when a completed escape from an approaching barrier leaves at most 220 ms until its center reaches your horizontal position. A barrier rewards at most one escape. Empty-lane switches earn nothing.

## Architecture and fairness

- `src/game/Game.ts`: pure fixed-step simulation (120 Hz), state transitions, hitboxes, seeded pattern scheduler, scoring, and collectibles. No DOM or rendering dependencies.
- `src/game/Renderer.ts`: responsive 360 × 640 Canvas world, capped DPR, trails, particles, geometric art, and feedback.
- `src/main.ts` / `src/style.css`: accessible DOM menus, HUD, keyboard/pointer controls, pause lifecycle, and responsive layout.
- `src/systems/`: resilient local storage and short, user-activated Web Audio effects.
- `tests/game.test.ts`: rules, scoring, storage, and seeded fairness tests.
- `tests/browser/play.spec.ts`: real browser start/switch/collision/retry, pause, preferences, touch, and keyboard checks.

Speed increases continuously from 170 to 255 virtual units/second. The scheduler uses a small collection of single-barrier patterns with at least 0.92 seconds between spawns. Barriers first become visible more than one second before reaching the player at maximum speed. Conservative spacing leaves over 0.43 seconds of clear travel between adjacent hazards, including both collision footprints, so the 0.142-second lane transition always has a valid route. Standard shards occupy the open lane; optional shards sit in the clear gap between hazards. Tests simulate a surviving route across the full difficulty curve for 30 seeds and validate 30,000 generated pattern steps.

The renderer never determines scoring or collision results. Long frame delays are clamped to 50 ms rather than advancing through unseen hazards. Reduced motion removes trails, screen pulses, decorative movement, and particle bursts while retaining essential hazard and player movement. Best scores and preferences fall back safely when storage is blocked or corrupt. No audio plays until interaction.

## Static deployment

Run `npm run build` and upload **the contents of `dist/`** to any static host (GitHub Pages, Cloudflare Pages, Netlify, or similar). The build uses relative asset paths, including the favicon, so repository subdirectories work. No server runtime, environment variables, or secrets are needed.

The live game is at **https://hiyroscript.github.io/switch/**.

GitHub Pages serves the compiled files from the `gh-pages` branch. The
`.github/workflows/deploy.yml` workflow tests and builds changes to `main`, then
updates that branch and requests a Pages build. In Settings → Pages, keep
**Deploy from a branch → gh-pages → / (root)** selected.

Do not point Pages at the source files on `main`: browsers cannot execute the
uncompiled TypeScript entry point. Only the output of `npm run build` is a
standalone static website. The deployment branch includes `.nojekyll` so Pages
serves the generated files unchanged.

## Limits

Scores are local to this browser and device, not an online leaderboard. Browser checks emulate mobile touch; they do not substitute for testing on physical phones. The visual arena requires sight, although menus and controls use semantic HTML, visible focus, and a live result announcement. Disabling storage prevents best scores and preferences from surviving a reload.

The original task specification is preserved in `Max`.
