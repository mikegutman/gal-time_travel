# מסע בזמן — 2D Browser Platformer

A 2D side-scrolling platformer inspired by **Astro Bot** (PlayStation), with a cute robot character, smooth motion, and collectible gems. Play in any modern browser.

## How to Play

- **Desktop:** Arrow keys or **A / D** to move, **Space** or **W** to jump.
- **Mobile:** Use the on-screen left / right / jump buttons.
- **Goal:** Collect gems and reach the green flag at the end of the level.
- **Lives:** You have 3 lives; falling off the bottom of the level costs one life.

## Run Locally

1. Open the project folder and start a simple HTTP server (so the game loads correctly):
   - **Python 3:** `python -m http.server 8000`
   - **Node (npx):** `npx serve .`
2. In your browser, go to `http://localhost:8000` and open `index.html`.

You can also open `index.html` directly from the file system in some browsers, but using a local server is more reliable.

## Tech

- **HTML5 Canvas** for rendering and smooth motion
- **Vanilla JavaScript** (no frameworks)
- Responsive layout with touch controls on small screens
- Parallax background and simple physics (gravity, friction, jump)

## Files

- `index.html` — Page structure and UI (start/game over/win screens, score, touch buttons)
- `styles.css` — Layout and styling (fullscreen canvas, overlays, buttons)
- `game.js` — Game logic: player, platforms, gems, goal, camera, input, and draw loop

---

## Publish to GitHub Pages

1. **Create a new repository on GitHub**  
   Go to [github.com/new](https://github.com/new), name it (e.g. `game-for-gal` or `masa-bezman`), and leave it empty (no README, no .gitignore).

2. **Push this project to the repo** (run in this folder):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: מסע בזמן platformer"
   git branch -M main
   git remote add origin https://github.com/mikegutman/gal-time_travel.git
   git pull origin main --allow-unrelated-histories
   git push -u origin main
   ```
   (The pull merges in the existing LICENSE from the repo; then push uploads your game.)

3. **Enable GitHub Pages**  
   In your repo: **Settings → Pages**. Under **Build and deployment**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / **Folder:** `/ (root)`  
   Click **Save**.

4. **Open the game**  
   After a minute or two, the game will be at:  
   **https://mikegutman.github.io/gal-time_travel/**

Enjoy the game.
