# Code review: מסע בזמן — 2D Platformer

## Macro: architecture and flow

### What works well
- **Single entry point**: IIFE in `game.js` keeps global scope clean; state lives in closure.
- **UI centralization**: `UI` object holds all DOM refs; easy to maintain.
- **Game state**: Clear states `home | playing | gameover | win` and transitions (`startGame`, `goToHome`, game over/win).
- **Scaling**: `resize()` sets `scale`, `offsetX`, `offsetY` and `--game-scale`; narrow viewport fills width and vertically centers; UI scales with `--game-scale`.

### Issues and improvements

1. **Start screen flow (fixed)**  
   - **Now**: Home → "שחק / Play" shows start screen; Start screen "Play" → `startGame()`. Desktop/mobile hints and the short instructions are visible before play. `goToHome()` and `startGame()` hide start screen where needed.

2. **Restart / Play Again**  
   - Both buttons call `goToHome()`, so the user returns to the main menu and must tap "שחק / Play" again. This is consistent and fine; no change needed unless you want a one-tap “Play again” that restarts the same run.

3. **localStorage key name**  
   - Outfit is still stored as `astroOutfit`. Consider renaming to e.g. `playerOutfit` after removing the astro asset.

---

## Micro: gameplay

### What works well
- **Input**: Keyboard (ArrowLeft/Right, A/D, W, Space) and touch (pointerdown/up/leave) mapped to the same `keys` object; touch uses `pointerleave` so keys don’t stay “stuck”.
- **Difficulty**: Lives and enemy speed/shoot interval scale correctly from `DIFFICULTY`.
- **Missions**: Per-level targets; UI updates; mission panel shown only during play.
- **Physics**: Gravity, friction, jump, camera follow, collision (AABB) and stomp logic are consistent.

### Things to watch
- **Key repeat**: `keydown` fires repeatedly when held; `attackCooldownUntil` limits fire rate, so no change needed.
- **Touch overlay**: `#touch-controls` covers the full area but only buttons have `pointer-events: auto`; center of the screen doesn’t need touch for gameplay. Good.

---

## Macro: visualization

### What works well
- **Canvas**: Sized to viewport; drawing uses a single transform (`translate(offsetX - cameraX*scale, offsetY)` + `scale(scale, scale)`); letterbox shows body background.
- **Themes**: Outfit drives world theme (desert / ocean / forest); backgrounds and platform colors match.
- **UI scaling**: Level, Gems, Lives, and Missions use `--game-scale` with min/max so they stay readable across viewports.

### Issues and improvements

4. **Initial `--game-scale` (fixed)**  
   - `:root { --game-scale: 0.5; }` is set in CSS so the first paint always has a value; JS overwrites it in `resize()`.

5. **Canvas CSS**  
   - `#game-canvas` has `object-fit: contain`; the canvas buffer is set to `window.innerWidth/Height`, so in practice it matches the container. No bug; could drop `object-fit` for clarity if you prefer.

---

## Micro: visualization

### What works well
- **Safe areas**: `env(safe-area-inset-*)` used on home, overlays, and touch bar.
- **Z-order**: Only `#rotate-prompt` has `z-index: 100`; overlay order is correct (UI, then touch controls, then rotate prompt).
- **Fallbacks**: If `avatar.png` doesn’t load, the drawn robot is used; no broken images.

### Things to watch
- **Fonts**: Fredoka and Heebo loaded from Google Fonts. Adding `&display=swap` (or similar) improves perceived load and avoids invisible text during load if you ever rely on them for critical UI.

---

## Full browser (desktop)

### What works well
- **Resize**: Scale and offsets recompute; narrow portrait fills width and centers vertically; UI and missions scale and wrap.
- **No scroll**: `overflow: hidden` on `html`/`body` avoids double scrollbars.
- **Viewport**: `100vw`/`100vh` with fixed body is consistent; no layout jump from scrollbar.

### Optional
- **Scrollbar**: On some OS/browsers, `100vw` includes scrollbar and can cause a tiny horizontal scroll. If you ever see that, consider `100dvw` or ensuring the root doesn’t overflow.

---

## Mobile

### What works well
- **Home**: Scrollable `#home-content` with compact layout; Play button reachable; character and options scale down.
- **Landscape**: Rotate prompt when portrait during play; orientation lock attempted where supported; prompt hides when landscape.
- **Touch**: Controls only visible when `gameState === 'playing'`; no controls on menus.
- **Min scale**: On touch devices, scale has a minimum (0.4) so level elements stay visible.
- **Touch scroll**: `touch-action: pan-y` and `-webkit-overflow-scrolling: touch` on the home content so scrolling works on iOS/Android.

### Things to watch
- **Mission panel on very narrow**: At ≤520px the mission panel goes to its own row and text can ellipsize; scaling still uses `--game-scale`. Acceptable; no change unless you want different truncation.

---

## Summary table

| Area            | Status   | Notes                                              |
|-----------------|----------|----------------------------------------------------|
| Start screen    | Fixed    | Shown after Home "Play"; then Start "Play" starts game |
| Home → Play     | Good     | Clear CTA                                          |
| Game over / Win | Good     | Both return to home                                 |
| Scaling/resize  | Good     | Fill width when narrow; UI scales with game        |
| Touch controls  | Good     | Only during play; pointerleave prevents stuck keys |
| Rotate prompt   | Good     | Portrait during play; hides in landscape            |
| Missions UI     | Good     | Wraps and scales; doesn’t get cut off              |
| Fonts           | Minor    | Add display=swap if desired                         |
| localStorage    | Minor    | Consider renaming astroOutfit → playerOutfit       |

---

## Recommended changes (in order)

1. ~~**Wire up or remove start screen**~~ **Done**: Flow is Home → Start screen → Play; hints and instructions are shown.
2. ~~**Null-safe UI**~~ **Done**: `UI.startBtn` and `UI.startScreen` guarded before use.
3. **Font loading**: Google Fonts URL already uses `display=swap`; `crossorigin` added on the link.
4. ~~**Optional: default --game-scale**~~ **Done**: `:root { --game-scale: 0.5; }` in CSS.
5. **Optional**: Rename `astroOutfit` to `playerOutfit` in code and localStorage for consistency.
