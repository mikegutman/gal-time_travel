(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const UI = {
    scoreEl: document.getElementById('score-value'),
    livesEl: document.getElementById('lives-value'),
    levelEl: document.getElementById('level-value'),
    missionList: document.getElementById('mission-list'),
    missionPanel: document.getElementById('mission-panel'),
    homeScreen: document.getElementById('home-screen'),
    homeCharacterCanvas: document.getElementById('home-character-canvas'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    winScreen: document.getElementById('win-screen'),
    startBtn: document.getElementById('start-btn'),
    playFromHomeBtn: document.getElementById('play-from-home-btn'),
    restartBtn: document.getElementById('restart-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    finalScore: document.getElementById('final-score'),
    winScore: document.getElementById('win-score'),
    touchPanel: document.getElementById('touch-controls'),
    rotatePrompt: document.getElementById('rotate-prompt'),
  };

  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  const OUTFITS = {
    classic: { head: '#f1f5f9', body: '#cbd5e1', antenna: '#e2e8f0' },
    gold:    { head: '#fef08a', body: '#facc15', antenna: '#fde047' },
    fire:    { head: '#fecaca', body: '#f87171', antenna: '#fb923c' },
    ocean:   { head: '#bae6fd', body: '#38bdf8', antenna: '#7dd3fc' },
    forest:  { head: '#bbf7d0', body: '#4ade80', antenna: '#86efac' },
  };

  let selectedOutfit = 'classic';
  try {
    const saved = localStorage.getItem('astroOutfit');
    if (saved && OUTFITS[saved]) selectedOutfit = saved;
  } catch (_) {}

  let enemiesShoot = true;
  try {
    const shootSaved = localStorage.getItem('enemiesShoot');
    if (shootSaved !== null) enemiesShoot = shootSaved === '1';
  } catch (_) {}

  const DIFFICULTY = {
    easy:   { lives: 7, enemySpeedMul: 0.7,  shootIntervalMul: 1.5 },
    normal: { lives: 5, enemySpeedMul: 1,    shootIntervalMul: 1 },
    hard:   { lives: 3, enemySpeedMul: 1.35, shootIntervalMul: 0.65 },
  };
  let difficulty = 'normal';
  try {
    const d = localStorage.getItem('difficulty');
    if (d && DIFFICULTY[d]) difficulty = d;
  } catch (_) {}

  const WORLD = {
    width: 3200,
    height: 600,
    gravity: 0.55,
    friction: 0.82,
    jumpForce: -14,
    moveSpeed: 5.5,
  };

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let keys = {};
  let gameState = 'home'; // home | playing | gameover | win
  let score = 0;
  let lives = 5;
  let missionGems = 0;
  let missionEnemies = 0;
  let missionTrophies = 0;
  let missionTargets = { gems: 3, enemies: 2, trophies: 1 };

  const player = {
    x: 120,
    y: 300,
    w: 36,
    h: 44,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    animTime: 0,
    invincibleUntil: 0,
    attackCooldownUntil: 0,
  };
  const PROJECTILE_SPEED = 14;
  const PROJECTILE_R = 10;
  const ATTACK_COOLDOWN = 450;
  let projectiles = [];
  const ENEMY_PROJECTILE_SPEED = 7;
  const ENEMY_PROJECTILE_R = 8;
  const ENEMY_SHOOT_INTERVAL = 3800;
  let enemyProjectiles = [];

  const LEVELS = [
    {
      platforms: [
        { x: 0, y: 520, w: 400, h: 80 },
        { x: 450, y: 450, w: 180, h: 24 },
        { x: 700, y: 380, w: 160, h: 24 },
        { x: 920, y: 320, w: 200, h: 24 },
        { x: 1180, y: 400, w: 220, h: 24 },
        { x: 1450, y: 340, w: 180, h: 24 },
        { x: 1680, y: 420, w: 200, h: 24 },
        { x: 1930, y: 360, w: 240, h: 24 },
        { x: 2220, y: 280, w: 200, h: 24 },
        { x: 2470, y: 380, w: 180, h: 24 },
        { x: 2700, y: 460, w: 500, h: 80 },
      ],
      gems: [
        { x: 520, y: 400, r: 14 }, { x: 760, y: 330, r: 14 }, { x: 1000, y: 270, r: 14 },
        { x: 1260, y: 350, r: 14 }, { x: 1540, y: 290, r: 14 }, { x: 1780, y: 370, r: 14 },
        { x: 2060, y: 310, r: 14 },         { x: 2340, y: 230, r: 14 }, { x: 2580, y: 330, r: 14 },
      ],
      trophies: [
        { x: 1180, y: 356, w: 20, h: 28 }, { x: 1930, y: 316, w: 20, h: 28 },
      ],
      hearts: [
        { x: 350, y: 420 }, { x: 1400, y: 330 }, { x: 2520, y: 380 },
      ],
      goal: { x: 3050, y: 380, w: 60, h: 120 },
      enemies: [
        { x: 200, y: 496, w: 28, h: 24, vx: 1.2, left: 180, right: 350 },
        { x: 520, y: 426, w: 28, h: 24, vx: -1, left: 460, right: 620, canShoot: true },
        { x: 750, y: 356, w: 28, h: 24, vx: 1, left: 710, right: 820 },
        { x: 1010, y: 284, w: 40, h: 36, vx: -1.1, left: 930, right: 1170, lives: 3 },
        { x: 1020, y: 296, w: 28, h: 24, vx: -1.1, left: 930, right: 1170, canShoot: true },
        { x: 1280, y: 376, w: 28, h: 24, vx: 1, left: 1190, right: 1380 },
        { x: 1580, y: 316, w: 28, h: 24, vx: -1, left: 1460, right: 1680, canShoot: true },
        { x: 1820, y: 396, w: 28, h: 24, vx: 1.2, left: 1690, right: 1900 },
        { x: 2080, y: 336, w: 28, h: 24, vx: -1, left: 1940, right: 2140 },
        { x: 2380, y: 256, w: 28, h: 24, vx: 1, left: 2230, right: 2510, canShoot: true },
      ],
    },
    {
      platforms: [
        { x: 0, y: 520, w: 280, h: 80 },
        { x: 350, y: 460, w: 140, h: 24 },
        { x: 560, y: 400, w: 160, h: 24 },
        { x: 780, y: 340, w: 120, h: 24 },
        { x: 960, y: 480, w: 200, h: 24 },
        { x: 1220, y: 400, w: 180, h: 24 },
        { x: 1460, y: 320, w: 140, h: 24 },
        { x: 1660, y: 450, w: 220, h: 24 },
        { x: 1940, y: 360, w: 160, h: 24 },
        { x: 2160, y: 280, w: 180, h: 24 },
        { x: 2400, y: 400, w: 200, h: 24 },
        { x: 2660, y: 320, w: 240, h: 24 },
        { x: 2950, y: 440, w: 250, h: 80 },
      ],
      gems: [
        { x: 400, y: 410, r: 14 }, { x: 640, y: 350, r: 14 }, { x: 840, y: 290, r: 14 },
        { x: 1060, y: 430, r: 14 }, { x: 1310, y: 350, r: 14 }, { x: 1530, y: 270, r: 14 },
        { x: 1770, y: 400, r: 14 }, { x: 2020, y: 310, r: 14 }, { x: 2250, y: 230, r: 14 },
        { x: 2560, y: 270, r: 14 }, { x: 2850, y: 390, r: 14 },
      ],
      trophies: [
        { x: 1220, y: 346, w: 20, h: 28 }, { x: 2160, y: 276, w: 20, h: 28 },
      ],
      hearts: [
        { x: 500, y: 380 }, { x: 1400, y: 300 }, { x: 2600, y: 330 },
      ],
      goal: { x: 3050, y: 380, w: 60, h: 120 },
      enemies: [
        { x: 380, y: 436, w: 28, h: 24, vx: -1, left: 360, right: 470, canShoot: true },
        { x: 800, y: 304, w: 40, h: 36, vx: 1, left: 790, right: 880, lives: 3 },
        { x: 820, y: 316, w: 28, h: 24, vx: 1, left: 790, right: 880 },
        { x: 1080, y: 456, w: 28, h: 24, vx: -1.2, left: 970, right: 1220, canShoot: true },
        { x: 1500, y: 296, w: 28, h: 24, vx: 1, left: 1470, right: 1580 },
        { x: 1820, y: 426, w: 28, h: 24, vx: -1, left: 1670, right: 2010, canShoot: true },
        { x: 2120, y: 336, w: 28, h: 24, vx: 1.1, left: 2150, right: 2320 },
        { x: 2520, y: 376, w: 28, h: 24, vx: -1, left: 2410, right: 2680 },
      ],
    },
    {
      platforms: [
        { x: 0, y: 520, w: 220, h: 80 },
        { x: 300, y: 420, w: 150, h: 24 },
        { x: 520, y: 350, w: 130, h: 24 },
        { x: 720, y: 480, w: 170, h: 24 },
        { x: 950, y: 380, w: 140, h: 24 },
        { x: 1150, y: 300, w: 160, h: 24 },
        { x: 1380, y: 430, w: 150, h: 24 },
        { x: 1600, y: 350, w: 180, h: 24 },
        { x: 1850, y: 270, w: 140, h: 24 },
        { x: 2060, y: 400, w: 200, h: 24 },
        { x: 2320, y: 320, w: 160, h: 24 },
        { x: 2550, y: 450, w: 180, h: 24 },
        { x: 2800, y: 360, w: 200, h: 24 },
        { x: 3050, y: 480, w: 150, h: 80 },
      ],
      gems: [
        { x: 370, y: 370, r: 14 }, { x: 585, y: 300, r: 14 }, { x: 790, y: 430, r: 14 },
        { x: 1020, y: 330, r: 14 }, { x: 1230, y: 250, r: 14 }, { x: 1460, y: 380, r: 14 },
        { x: 1690, y: 300, r: 14 }, { x: 1920, y: 220, r: 14 }, { x: 2160, y: 350, r: 14 },
        { x: 2400, y: 270, r: 14 }, { x: 2640, y: 400, r: 14 }, { x: 2920, y: 430, r: 14 },
      ],
      trophies: [
        { x: 1600, y: 306, w: 20, h: 28 }, { x: 2550, y: 416, w: 20, h: 28 },
      ],
      hearts: [
        { x: 400, y: 390 }, { x: 1300, y: 340 }, { x: 2500, y: 390 },
      ],
      goal: { x: 3050, y: 420, w: 60, h: 120 },
      enemies: [
        { x: 340, y: 396, w: 28, h: 24, vx: 1, left: 310, right: 430 },
        { x: 590, y: 314, w: 40, h: 36, vx: -1.1, left: 530, right: 640, lives: 3 },
        { x: 600, y: 326, w: 28, h: 24, vx: -1.1, left: 530, right: 640, canShoot: true },
        { x: 1000, y: 356, w: 28, h: 24, vx: 1, left: 960, right: 1070 },
        { x: 1320, y: 406, w: 28, h: 24, vx: -1, left: 1390, right: 1510, canShoot: true },
        { x: 1770, y: 326, w: 28, h: 24, vx: 1.2, left: 1860, right: 1970, canShoot: true },
        { x: 2120, y: 376, w: 28, h: 24, vx: -1, left: 2070, right: 2240 },
        { x: 2480, y: 296, w: 28, h: 24, vx: 1, left: 2330, right: 2620 },
      ],
    },
    {
      platforms: [
        { x: 0, y: 520, w: 260, h: 80 },
        { x: 330, y: 440, w: 140, h: 24 },
        { x: 540, y: 360, w: 150, h: 24 },
        { x: 760, y: 470, w: 160, h: 24 },
        { x: 980, y: 390, w: 130, h: 24 },
        { x: 1170, y: 310, w: 170, h: 24 },
        { x: 1400, y: 430, w: 140, h: 24 },
        { x: 1600, y: 340, w: 180, h: 24 },
        { x: 1840, y: 260, w: 150, h: 24 },
        { x: 2050, y: 380, w: 190, h: 24 },
        { x: 2300, y: 300, w: 160, h: 24 },
        { x: 2520, y: 420, w: 200, h: 24 },
        { x: 2780, y: 340, w: 170, h: 24 },
        { x: 3010, y: 460, w: 190, h: 80 },
      ],
      gems: [
        { x: 400, y: 390, r: 14 }, { x: 615, y: 310, r: 14 }, { x: 830, y: 420, r: 14 },
        { x: 1045, y: 340, r: 14 }, { x: 1260, y: 260, r: 14 }, { x: 1470, y: 380, r: 14 },
        { x: 1690, y: 290, r: 14 }, { x: 1915, y: 210, r: 14 }, { x: 2145, y: 330, r: 14 },
        { x: 2370, y: 250, r: 14 }, { x: 2620, y: 370, r: 14 }, { x: 2860, y: 290, r: 14 },
      ],
      trophies: [
        { x: 980, y: 346, w: 20, h: 28 }, { x: 1840, y: 226, w: 20, h: 28 }, { x: 2780, y: 306, w: 20, h: 28 },
      ],
      hearts: [
        { x: 450, y: 400 }, { x: 1550, y: 300 }, { x: 2650, y: 340 },
      ],
      goal: { x: 3050, y: 400, w: 60, h: 120 },
      enemies: [
        { x: 370, y: 416, w: 28, h: 24, vx: -1, left: 340, right: 460, canShoot: true },
        { x: 590, y: 324, w: 40, h: 36, vx: 1, left: 550, right: 680, lives: 3 },
        { x: 600, y: 336, w: 28, h: 24, vx: 1, left: 550, right: 680 },
        { x: 860, y: 446, w: 28, h: 24, vx: -1.1, left: 770, right: 920, canShoot: true },
        { x: 1050, y: 366, w: 28, h: 24, vx: 1, left: 990, right: 1090 },
        { x: 1280, y: 286, w: 28, h: 24, vx: -1, left: 1180, right: 1320, canShoot: true },
        { x: 1490, y: 406, w: 28, h: 24, vx: 1, left: 1410, right: 1530 },
        { x: 1710, y: 316, w: 28, h: 24, vx: -1, left: 1610, right: 1770 },
        { x: 1920, y: 236, w: 28, h: 24, vx: 1.2, left: 1850, right: 1970, canShoot: true },
        { x: 2160, y: 356, w: 28, h: 24, vx: -1, left: 2060, right: 2220 },
        { x: 2400, y: 276, w: 28, h: 24, vx: 1, left: 2310, right: 2470, canShoot: true },
        { x: 2640, y: 396, w: 28, h: 24, vx: -1, left: 2530, right: 2700 },
      ],
    },
    {
      platforms: [
        { x: 0, y: 520, w: 240, h: 80 },
        { x: 310, y: 430, w: 160, h: 24 },
        { x: 530, y: 350, w: 140, h: 24 },
        { x: 730, y: 460, w: 180, h: 24 },
        { x: 970, y: 370, w: 150, h: 24 },
        { x: 1180, y: 290, w: 160, h: 24 },
        { x: 1400, y: 410, w: 170, h: 24 },
        { x: 1630, y: 330, w: 140, h: 24 },
        { x: 1830, y: 250, w: 160, h: 24 },
        { x: 2050, y: 370, w: 190, h: 24 },
        { x: 2300, y: 290, w: 150, h: 24 },
        { x: 2510, y: 410, w: 180, h: 24 },
        { x: 2750, y: 330, w: 160, h: 24 },
        { x: 2970, y: 450, w: 180, h: 80 },
      ],
      gems: [
        { x: 390, y: 380, r: 14 }, { x: 610, y: 300, r: 14 }, { x: 820, y: 410, r: 14 },
        { x: 1045, y: 320, r: 14 }, { x: 1260, y: 240, r: 14 }, { x: 1480, y: 360, r: 14 },
        { x: 1700, y: 280, r: 14 }, { x: 1910, y: 200, r: 14 }, { x: 2145, y: 320, r: 14 },
        { x: 2375, y: 240, r: 14 }, { x: 2590, y: 360, r: 14 }, { x: 2830, y: 280, r: 14 },
      ],
      trophies: [
        { x: 1180, y: 266, w: 20, h: 28 }, { x: 2050, y: 346, w: 20, h: 28 }, { x: 2750, y: 306, w: 20, h: 28 },
      ],
      hearts: [
        { x: 500, y: 350 }, { x: 1500, y: 270 }, { x: 2600, y: 330 },
      ],
      goal: { x: 3050, y: 390, w: 60, h: 120 },
      enemies: [
        { x: 380, y: 406, w: 28, h: 24, vx: 1, left: 320, right: 460, canShoot: true },
        { x: 600, y: 314, w: 40, h: 36, vx: -1, left: 540, right: 660, lives: 3 },
        { x: 610, y: 326, w: 28, h: 24, vx: -1, left: 540, right: 660 },
        { x: 820, y: 436, w: 28, h: 24, vx: 1.1, left: 740, right: 910, canShoot: true },
        { x: 1050, y: 346, w: 28, h: 24, vx: -1, left: 980, right: 1110 },
        { x: 1260, y: 266, w: 28, h: 24, vx: 1, left: 1190, right: 1320, canShoot: true },
        { x: 1480, y: 386, w: 28, h: 24, vx: -1.2, left: 1410, right: 1560 },
        { x: 1710, y: 306, w: 28, h: 24, vx: 1, left: 1640, right: 1750, canShoot: true },
        { x: 1920, y: 226, w: 28, h: 24, vx: -1, left: 1840, right: 1980 },
        { x: 2160, y: 346, w: 28, h: 24, vx: 1, left: 2060, right: 2220, canShoot: true },
        { x: 2400, y: 266, w: 28, h: 24, vx: -1, left: 2310, right: 2480 },
        { x: 2640, y: 386, w: 28, h: 24, vx: 1, left: 2520, right: 2720 },
      ],
    },
  ];

  let currentLevel = 0;
  let platforms = [];
  let gems = [];
  let trophies = [];
  let hearts = [];
  let goal = { x: 0, y: 0, w: 60, h: 120 };
  let enemies = [];

  function loadLevel(index) {
    const lev = LEVELS[index];
    platforms = lev.platforms.map((p) => ({ ...p }));
    gems = lev.gems.map((g) => ({ ...g, collected: false, anim: Math.random() * Math.PI * 2 }));
    trophies = (lev.trophies || []).map((t) => ({ ...t, collected: false }));
    hearts = (lev.hearts || []).map((h) => ({ x: h.x, y: h.y, size: h.size || 8, collected: false }));
    goal = { ...lev.goal };
    const diff = DIFFICULTY[difficulty] || DIFFICULTY.normal;
    enemies = lev.enemies.map((e) => ({
      ...e,
      alive: true,
      shootUntil: 0,
      canShoot: (e.canShoot || false) && enemiesShoot,
      lives: e.lives !== undefined ? e.lives : 1,
      isMonster: (e.lives !== undefined && e.lives > 1),
      vx: (e.vx || 0) * diff.enemySpeedMul,
    }));
    missionGems = 0;
    missionEnemies = 0;
    missionTrophies = 0;
    if (lev.missions) missionTargets = { ...lev.missions };
    else missionTargets = { gems: 3, enemies: 2, trophies: 1 };
    currentLevel = index;
    if (UI.levelEl) UI.levelEl.textContent = (index + 1) + '/' + LEVELS.length;
    updateMissionUI();
  }

  const avatarImage = new Image();
  let avatarCanvas = null;
  avatarImage.onload = function () {
    avatarCanvas = makeWhiteTransparent(avatarImage);
  };
  avatarImage.src = 'avatar.png';

  function makeWhiteTransparent(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    const id = cx.getImageData(0, 0, c.width, c.height);
    const data = id.data;
    const w = c.width;
    const h = c.height;
    const sample = (x, y) => {
      const i = ((y | 0) * w + (x | 0)) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    let r0 = 0, g0 = 0, b0 = 0, n = 0;
    const margin = Math.min(15, Math.floor(w / 4), Math.floor(h / 4));
    for (let y = 0; y < margin; y++) {
      for (let x = 0; x < margin; x++) {
        const p = sample(x, y);
        r0 += p[0]; g0 += p[1]; b0 += p[2];
        n++;
      }
      for (let x = w - margin; x < w; x++) {
        const p = sample(x, y);
        r0 += p[0]; g0 += p[1]; b0 += p[2];
        n++;
      }
    }
    for (let y = h - margin; y < h; y++) {
      for (let x = 0; x < margin; x++) {
        const p = sample(x, y);
        r0 += p[0]; g0 += p[1]; b0 += p[2];
        n++;
      }
      for (let x = w - margin; x < w; x++) {
        const p = sample(x, y);
        r0 += p[0]; g0 += p[1]; b0 += p[2];
        n++;
      }
    }
    r0 /= n; g0 /= n; b0 /= n;
    const dist = (r, g, b) => Math.sqrt((r - r0) ** 2 + (g - g0) ** 2 + (b - b0) ** 2);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luminance = (r + g + b) / 3;
      const likeBg = dist(r, g, b) < 55;
      const isVeryLight = luminance >= 230;
      if (likeBg || isVeryLight) data[i + 3] = 0;
    }
    cx.putImageData(id, 0, 0);
    return c;
  }

  const parallaxLayers = [
    { speed: 0.12, dunes: [] },
    { speed: 0.28, dunes: [] },
    { speed: 0.5, dunes: [] },
  ];

  function initParallax() {
    for (let i = 0; i < parallaxLayers.length; i++) {
      const layer = parallaxLayers[i];
      layer.dunes = [];
      const count = 15 + i * 8;
      for (let j = 0; j < count; j++) {
        layer.dunes.push({
          x: Math.random() * WORLD.width * 1.5,
          y: 380 + Math.random() * 220 + i * 40,
          w: 80 + Math.random() * 120,
          h: 30 + Math.random() * 50,
          opacity: 0.15 + 0.2 * (1 - i / 3) + Math.random() * 0.1,
        });
      }
    }
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    const narrow = w < h;
    if (narrow) {
      scale = w / WORLD.width;
      if (isTouchDevice) scale = Math.max(0.4, scale);
      offsetX = 0;
      offsetY = (h - WORLD.height * scale) / 2;
      document.documentElement.style.setProperty('--game-scale', String(scale));
    } else {
      let fitScale = Math.min(w / WORLD.width, h / WORLD.height);
      if (isTouchDevice) {
        scale = Math.max(0.4, fitScale);
      } else {
        scale = fitScale;
      }
    offsetX = (w - WORLD.width * scale) / 2;
    offsetY = (h - WORLD.height * scale) / 2;
    document.documentElement.style.setProperty('--game-scale', String(scale));
    }
    updateRotatePrompt();
  }

  function updateRotatePrompt() {
    if (!UI.rotatePrompt || gameState !== 'playing') return;
    const isPortrait = window.innerWidth < window.innerHeight;
    if (isTouchDevice && isPortrait) {
      UI.rotatePrompt.classList.remove('hidden');
    } else {
      UI.rotatePrompt.classList.add('hidden');
    }
  }

  function worldToScreen(x, y) {
    return {
      x: offsetX + x * scale,
      y: offsetY + y * scale,
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - offsetX) / scale,
      y: (sy - offsetY) / scale,
    };
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function updateMissionUI() {
    if (!UI.missionList) return;
    const g = missionGems >= missionTargets.gems;
    const e = missionEnemies >= missionTargets.enemies;
    const t = missionTrophies >= missionTargets.trophies;
    UI.missionList.innerHTML =
      '<span class="' + (g ? 'mission-done' : '') + '">ג\'מס Gems: ' + missionGems + '/' + missionTargets.gems + (g ? ' ✓' : '') + '</span>' +
      '<span class="' + (e ? 'mission-done' : '') + '">אויבים Enemies: ' + missionEnemies + '/' + missionTargets.enemies + (e ? ' ✓' : '') + '</span>' +
      '<span class="' + (t ? 'mission-done' : '') + '">גביעים Trophies: ' + missionTrophies + '/' + missionTargets.trophies + (t ? ' ✓' : '') + '</span>';
  }

  function updatePlayer(dt) {
    player.animTime += dt * 0.012;

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      player.vx = -WORLD.moveSpeed;
      player.facing = -1;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      player.vx = WORLD.moveSpeed;
      player.facing = 1;
    }
    if (!keys['ArrowLeft'] && !keys['a'] && !keys['A'] && !keys['ArrowRight'] && !keys['d'] && !keys['D']) {
      player.vx *= WORLD.friction;
    }

    if ((keys['ArrowUp'] || keys['w'] || keys['W']) && player.grounded) {
      player.vy = WORLD.jumpForce;
      player.grounded = false;
    }

    const now = Date.now();
    if ((keys[' '] || keys['Space']) && now >= player.attackCooldownUntil) {
      player.attackCooldownUntil = now + ATTACK_COOLDOWN;
      projectiles.push({
        x: player.x + player.w / 2 + player.facing * (player.w / 2 + 4),
        y: player.y + player.h / 2,
        vx: PROJECTILE_SPEED * player.facing,
        r: PROJECTILE_R,
      });
    }

    player.vy += WORLD.gravity;
    player.x += player.vx * (dt / 16);
    player.y += player.vy * (dt / 16);

    player.vx *= WORLD.friction;
    player.grounded = false;

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > WORLD.width) player.x = WORLD.width - player.w;

    for (const p of platforms) {
        if (aabb(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
          const overlapTop = (player.y + player.h) - p.y;
          const overlapBottom = (p.y + p.h) - player.y;
          const overlapLeft = (player.x + player.w) - p.x;
          const overlapRight = (p.x + p.w) - player.x;
          const minY = Math.min(overlapTop, overlapBottom);
          const minX = Math.min(overlapLeft, overlapRight);
          if (minY < minX) {
            if (overlapTop < overlapBottom) {
              player.y = p.y - player.h;
              player.vy = 0;
              player.grounded = true;
            } else {
              player.y = p.y + p.h;
              player.vy = 0;
            }
          } else {
            if (overlapLeft < overlapRight) player.x = p.x - player.w;
            else player.x = p.x + p.w;
            player.vx = 0;
          }
        }
    }
    if (player.y > WORLD.height) {
      lives--;
      UI.livesEl.textContent = lives;
      if (lives <= 0) {
        gameState = 'gameover';
        if (UI.touchPanel) UI.touchPanel.classList.add('hidden');
        if (UI.rotatePrompt) UI.rotatePrompt.classList.add('hidden');
        UI.finalScore.textContent = score;
        UI.gameOverScreen.classList.remove('hidden');
      } else {
        player.x = 120;
        player.y = 300;
        player.vx = 0;
        player.vy = 0;
        player.invincibleUntil = Date.now() + 1500;
      }
    }

    gems.forEach((g) => {
      if (g.collected) return;
      g.anim += dt * 0.008;
      const dx = (player.x + player.w / 2) - (g.x + g.r);
      const dy = (player.y + player.h / 2) - (g.y + g.r);
      if (dx * dx + dy * dy < (player.w / 2 + g.r) * (player.w / 2 + g.r)) {
        g.collected = true;
        score++;
        missionGems++;
        UI.scoreEl.textContent = score;
        updateMissionUI();
      }
    });

    trophies.forEach((t) => {
      if (t.collected) return;
      if (aabb(player.x, player.y, player.w, player.h, t.x, t.y, t.w, t.h)) {
        t.collected = true;
        score += 3;
        missionTrophies++;
        UI.scoreEl.textContent = score;
        updateMissionUI();
      }
    });

    hearts.forEach((h) => {
      if (h.collected) return;
      const dx = (player.x + player.w / 2) - h.x;
      const dy = (player.y + player.h / 2) - h.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.w / 2 + h.size) {
        h.collected = true;
        lives = Math.min(5, lives + 1);
        UI.livesEl.textContent = lives;
      }
    });

    if (aabb(player.x, player.y, player.w, player.h, goal.x, goal.y, goal.w, goal.h)) {
      if (currentLevel < LEVELS.length - 1) {
        loadLevel(currentLevel + 1);
        player.x = 120;
        player.y = 300;
        player.vx = 0;
        player.vy = 0;
        player.grounded = false;
        player.invincibleUntil = Date.now() + 1500;
        projectiles = [];
        enemyProjectiles = [];
      } else {
        gameState = 'win';
        if (UI.touchPanel) UI.touchPanel.classList.add('hidden');
        if (UI.rotatePrompt) UI.rotatePrompt.classList.add('hidden');
        UI.winScore.textContent = score;
        UI.winScreen.classList.remove('hidden');
      }
    }

    let enemyHitThisFrame = false;
    enemies.forEach((e) => {
      if (!e.alive) return;
      if (player.invincibleUntil > Date.now()) return;
      if (enemyHitThisFrame) return;
      if (!aabb(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) return;
      const stompMargin = 22;
      const feetY = player.y + player.h;
      const stomping = player.vy >= 0 && feetY >= e.y - 2 && feetY <= e.y + stompMargin;
      if (stomping) {
        const livesLeft = (e.lives !== undefined ? e.lives : 1) - 1;
        e.lives = livesLeft;
        if (livesLeft <= 0) {
          e.alive = false;
          score += 2;
          missionEnemies++;
          UI.scoreEl.textContent = score;
          updateMissionUI();
        }
        player.vy = -12;
      } else {
        enemyHitThisFrame = true;
        lives--;
        UI.livesEl.textContent = lives;
        if (lives <= 0) {
          gameState = 'gameover';
          if (UI.touchPanel) UI.touchPanel.classList.add('hidden');
          if (UI.rotatePrompt) UI.rotatePrompt.classList.add('hidden');
          UI.finalScore.textContent = score;
          UI.gameOverScreen.classList.remove('hidden');
        } else {
          player.x = Math.max(120, player.x - 60);
          player.y = Math.min(player.y, 300);
          player.vx = 0;
          player.vy = 0;
          player.invincibleUntil = Date.now() + 1500;
        }
      }
    });
  }

  function updateEnemies(dt) {
    enemies.forEach((e) => {
      if (!e.alive) return;
      e.x += e.vx * (dt / 16);
      if (e.x <= e.left) { e.x = e.left; e.vx = -e.vx; }
      if (e.x + e.w >= e.right) { e.x = e.right - e.w; e.vx = -e.vx; }
    });
  }

  function updateEnemyShooters() {
    const now = Date.now();
    const ex = player.x + player.w / 2;
    const ey = player.y + player.h / 2;
    const shootRange = 220;
    enemies.forEach((e) => {
      if (!e.alive || !e.canShoot || now < e.shootUntil) return;
      const dist = Math.abs((e.x + e.w / 2) - ex);
      if (dist > shootRange) return;
      const shootInterval = ENEMY_SHOOT_INTERVAL * ((DIFFICULTY[difficulty] || DIFFICULTY.normal).shootIntervalMul || 1);
      e.shootUntil = now + shootInterval;
      const sx = e.x + e.w / 2;
      const sy = e.y + e.h / 2;
      let dx = ex - sx;
      let dy = ey - sy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len;
      dy /= len;
      enemyProjectiles.push({
        x: sx + dx * (e.w / 2 + ENEMY_PROJECTILE_R),
        y: sy,
        vx: dx * ENEMY_PROJECTILE_SPEED,
        vy: dy * ENEMY_PROJECTILE_SPEED,
        r: ENEMY_PROJECTILE_R,
      });
    });
  }

  function updateEnemyProjectiles(dt) {
    const mul = dt / 16;
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = enemyProjectiles[i];
      ep.x += ep.vx * mul;
      ep.y += ep.vy * mul;
      if (ep.x < -ep.r * 2 || ep.x > WORLD.width + ep.r * 2 || ep.y < -50 || ep.y > WORLD.height + 50) {
        enemyProjectiles.splice(i, 1);
        continue;
      }
      if (player.invincibleUntil <= Date.now() && aabb(player.x, player.y, player.w, player.h, ep.x - ep.r, ep.y - ep.r, ep.r * 2, ep.r * 2)) {
        lives--;
        UI.livesEl.textContent = lives;
        if (lives <= 0) {
          gameState = 'gameover';
          if (UI.touchPanel) UI.touchPanel.classList.add('hidden');
          if (UI.rotatePrompt) UI.rotatePrompt.classList.add('hidden');
          UI.finalScore.textContent = score;
          UI.gameOverScreen.classList.remove('hidden');
        } else {
          player.invincibleUntil = Date.now() + 1500;
          player.x = Math.max(120, player.x - 60);
          player.y = Math.min(player.y, 300);
          player.vx = 0;
          player.vy = 0;
        }
        enemyProjectiles.splice(i, 1);
      }
    }
  }

  function updateProjectiles(dt) {
    const mul = dt / 16;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * mul;
      if (p.x < -p.r * 2 || p.x > WORLD.width + p.r * 2) {
        projectiles.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = enemyProjectiles.length - 1; j >= 0 && !hit; j--) {
        const ep = enemyProjectiles[j];
        const dx = p.x - ep.x;
        const dy = p.y - ep.y;
        if (dx * dx + dy * dy < (p.r + ep.r) * (p.r + ep.r)) {
          enemyProjectiles.splice(j, 1);
          hit = true;
        }
      }
      if (hit) { projectiles.splice(i, 1); continue; }
      for (const e of enemies) {
        if (!e.alive) continue;
        const dx = p.x - (e.x + e.w / 2);
        const dy = p.y - (e.y + e.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.r + Math.min(e.w, e.h) / 2) {
          const livesLeft = (e.lives !== undefined ? e.lives : 1) - 1;
          e.lives = livesLeft;
          if (livesLeft <= 0) {
            e.alive = false;
            score += 2;
            missionEnemies++;
            UI.scoreEl.textContent = score;
            updateMissionUI();
          }
          hit = true;
          break;
        }
      }
      if (hit) projectiles.splice(i, 1);
    }
  }

  function drawDesertBackground(camX) {
    const left = camX - 50;
    const right = camX + (canvas.width / scale) + 50;
    const top = 0;
    const bottom = WORLD.height;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    skyGrad.addColorStop(0, '#fef9c3');
    skyGrad.addColorStop(0.4, '#fde68a');
    skyGrad.addColorStop(0.7, '#fcd34d');
    skyGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(left, top, right - left + 100, bottom - top);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(left, 500, right - left + 100, 120);

    const sandGrad = ctx.createLinearGradient(0, 480, 0, WORLD.height);
    sandGrad.addColorStop(0, '#f59e0b');
    sandGrad.addColorStop(0.5, '#d97706');
    sandGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(left, 500, right - left + 100, 120);

    const sunX = camX + (right - left) * 0.72;
    const sunY = 90;
    const rSun = 55;
    const sunGrad = ctx.createRadialGradient(sunX - rSun * 0.3, sunY - rSun * 0.3, 0, sunX, sunY, rSun);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.6, '#fde047');
    sunGrad.addColorStop(1, 'rgba(253,224,71,0.3)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, rSun, 0, Math.PI * 2);
    ctx.fill();
  }

  function getWorldTheme() {
    if (selectedOutfit === 'ocean') return 'ocean';
    if (selectedOutfit === 'forest') return 'forest';
    return 'desert';
  }

  function drawOceanBackground(camX) {
    const left = camX - 50;
    const right = camX + (canvas.width / scale) + 50;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    skyGrad.addColorStop(0, '#7dd3fc');
    skyGrad.addColorStop(0.4, '#38bdf8');
    skyGrad.addColorStop(0.7, '#0ea5e9');
    skyGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(left, 0, right - left + 100, WORLD.height);
    const seaGrad = ctx.createLinearGradient(0, 400, 0, WORLD.height);
    seaGrad.addColorStop(0, '#38bdf8');
    seaGrad.addColorStop(0.5, '#0ea5e9');
    seaGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(left, 400, right - left + 100, 220);
    const sunX = camX + (right - left) * 0.7;
    const sunY = 85;
    const rSun = 50;
    const sunGrad = ctx.createRadialGradient(sunX - rSun * 0.3, sunY - rSun * 0.3, 0, sunX, sunY, rSun);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.5, '#fde047');
    sunGrad.addColorStop(1, 'rgba(253,224,71,0.2)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, rSun, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawForestBackground(camX) {
    const left = camX - 50;
    const right = camX + (canvas.width / scale) + 50;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    skyGrad.addColorStop(0, '#bae6fd');
    skyGrad.addColorStop(0.3, '#7dd3fc');
    skyGrad.addColorStop(0.6, '#38bdf8');
    skyGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(left, 0, right - left + 100, WORLD.height);
    const grassGrad = ctx.createLinearGradient(0, 450, 0, WORLD.height);
    grassGrad.addColorStop(0, '#4ade80');
    grassGrad.addColorStop(0.4, '#22c55e');
    grassGrad.addColorStop(0.8, '#15803d');
    grassGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(left, 450, right - left + 100, 170);
    const sunX = camX + (right - left) * 0.65;
    const sunY = 95;
    const rSun = 45;
    const sunGrad = ctx.createRadialGradient(sunX - rSun * 0.3, sunY - rSun * 0.3, 0, sunX, sunY, rSun);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.6, '#fde047');
    sunGrad.addColorStop(1, 'rgba(254,240,138,0.25)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, rSun, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground(camX) {
    const theme = getWorldTheme();
    if (theme === 'ocean') drawOceanBackground(camX);
    else if (theme === 'forest') drawForestBackground(camX);
    else drawDesertBackground(camX);
  }

  function drawParallax(camX) {
    const theme = getWorldTheme();
    for (let i = 0; i < parallaxLayers.length; i++) {
      const layer = parallaxLayers[i];
      const shift = (camX * layer.speed) % (WORLD.width * 1.5);
      for (const d of layer.dunes) {
        let x = d.x - shift;
        while (x < -d.w - 50) x += WORLD.width * 1.5;
        while (x > WORLD.width + 50) x -= WORLD.width * 1.5;
        if (theme === 'ocean') {
          ctx.fillStyle = `rgba(56,189,248,${d.opacity * 0.8})`;
          ctx.beginPath();
          ctx.ellipse(x + d.w / 2, d.y + d.h, d.w / 2, d.h * 0.6, 0, Math.PI, Math.PI * 2);
          ctx.fill();
        } else if (theme === 'forest') {
          ctx.fillStyle = `rgba(34,197,94,${d.opacity})`;
          ctx.beginPath();
          ctx.ellipse(x + d.w / 2, d.y + d.h, d.w / 2, d.h, 0, 0, Math.PI);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(212,175,55,${d.opacity})`;
          ctx.beginPath();
          ctx.ellipse(x + d.w / 2, d.y + d.h, d.w / 2, d.h, 0, 0, Math.PI);
          ctx.fill();
        }
      }
    }
  }

  const THEME_PLATFORMS = {
    desert: { grad: ['#e0a84a', '#c4953a', '#a67c2e', '#8b6914'], stroke: '#92400e', top: 'rgba(251,191,36,0.25)' },
    ocean:  { grad: ['#94a3b8', '#64748b', '#475569', '#334155'], stroke: '#1e293b', top: 'rgba(148,163,184,0.3)' },
    forest: { grad: ['#65a30d', '#4d7c0f', '#3f6212', '#365314'], stroke: '#1a2e05', top: 'rgba(134,239,172,0.25)' },
  };

  function drawPlatforms(camX) {
    const theme = getWorldTheme();
    const pal = THEME_PLATFORMS[theme] || THEME_PLATFORMS.desert;
    const left = camX - 100;
    const right = camX + (canvas.width / scale) + 100;
    platforms.forEach((p) => {
      if (p.x + p.w < left || p.x > right) return;
      const s = worldToScreen(p.x, p.y);
      const sw = p.w * scale;
      const sh = p.h * scale;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x + sw, s.y + sh);
      grad.addColorStop(0, pal.grad[0]);
      grad.addColorStop(0.4, pal.grad[1]);
      grad.addColorStop(0.7, pal.grad[2]);
      grad.addColorStop(1, pal.grad[3]);
      ctx.fillStyle = grad;
      ctx.fillRect(s.x, s.y, sw, sh);
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x, s.y, sw, sh);
      ctx.fillStyle = pal.top;
      ctx.fillRect(s.x, s.y, sw, Math.min(10 * scale, sh * 0.25));
    });
  }

  function drawGems(camX) {
    const left = camX - 80;
    const right = camX + (canvas.width / scale) + 80;
    gems.forEach((g) => {
      if (g.collected) return;
      if (g.x + g.r * 2 < left || g.x > right) return;
      const s = worldToScreen(g.x + g.r, g.y + g.r);
      const r = g.r * scale;
      const pulse = 1 + Math.sin(g.anim) * 0.1;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(pulse, pulse);
      const gradient = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
      gradient.addColorStop(0, '#fef08a');
      gradient.addColorStop(0.5, '#facc15');
      gradient.addColorStop(1, '#ca8a04');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(254,240,138,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawHearts(camX) {
    const left = camX - 60;
    const right = camX + (canvas.width / scale) + 60;
    hearts.forEach((h) => {
      if (h.collected) return;
      if (h.x + h.size * 2 < left || h.x > right) return;
      const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.08;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.scale(pulse, pulse);
      ctx.translate(-h.x, -h.y);
      drawHeartAt(h.x, h.y, h.size);
      ctx.restore();
    });
  }

  function drawTrophies(camX) {
    const left = camX - 60;
    const right = camX + (canvas.width / scale) + 60;
    trophies.forEach((t) => {
      if (t.collected) return;
      if (t.x + t.w < left || t.x > right) return;
      const x = t.x + t.w / 2;
      const y = t.y + t.h;
      const w = t.w;
      const h = t.h;
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.4, y - h * 0.3);
      ctx.lineTo(x + w * 0.4, y - h * 0.3);
      ctx.lineTo(x + w * 0.25, y);
      ctx.lineTo(x + w * 0.15, y - h * 0.15);
      ctx.lineTo(x, y - h * 0.5);
      ctx.lineTo(x - w * 0.15, y - h * 0.15);
      ctx.lineTo(x - w * 0.25, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x - w * 0.15, y - h * 0.55, w * 0.3, h * 0.2);
      ctx.strokeRect(x - w * 0.15, y - h * 0.55, w * 0.3, h * 0.2);
    });
  }

  const THEME_ENEMIES = {
    desert: { fill: '#a16207', stroke: '#713f12' },
    ocean:  { fill: '#0e7490', stroke: '#155e75' },
    forest: { fill: '#166534', stroke: '#14532d' },
  };

  const SHOOTER_ENEMY = { fill: '#7c3aed', stroke: '#5b21b6', eyeFill: '#f87171' };

  const MONSTER_STYLE = { fill: '#059669', fillDark: '#047857', stroke: '#064e3b', eye: '#fef08a', spike: '#0d9488' };

  function drawEnemies(camX) {
    const theme = getWorldTheme();
    const pal = THEME_ENEMIES[theme] || THEME_ENEMIES.desert;
    const left = camX - 60;
    const right = camX + (canvas.width / scale) + 60;
    enemies.forEach((e) => {
      if (!e.alive) return;
      if (e.x + e.w < left || e.x > right) return;
      const s = worldToScreen(e.x + e.w / 2, e.y + e.h / 2);
      const isMonster = e.isMonster;
      if (isMonster) {
        const rw = e.w * scale * 0.6;
        const rh = e.h * scale * 0.6;
        ctx.fillStyle = MONSTER_STYLE.fill;
        ctx.strokeStyle = MONSTER_STYLE.stroke;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(s.x - rw, s.y - rh * 0.5, rw * 2, rh * 1.4, 8) : ctx.rect(s.x - rw, s.y - rh * 0.5, rw * 2, rh * 1.4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = MONSTER_STYLE.fillDark;
        ctx.beginPath();
        ctx.arc(s.x - rw * 0.4, s.y - rh * 0.2, 4 * scale, 0, Math.PI * 2);
        ctx.arc(s.x + rw * 0.4, s.y - rh * 0.2, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = MONSTER_STYLE.eye;
        ctx.beginPath();
        ctx.arc(s.x - rw * 0.35, s.y - rh * 0.25, 2.5 * scale, 0, Math.PI * 2);
        ctx.arc(s.x + rw * 0.35, s.y - rh * 0.25, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = MONSTER_STYLE.spike;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(s.x + i * rw * 0.5, s.y - rh * 0.6);
          ctx.lineTo(s.x + i * rw * 0.5 - 3 * scale, s.y - rh * 0.95);
          ctx.lineTo(s.x + i * rw * 0.5 + 3 * scale, s.y - rh * 0.95);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        const hearts = e.lives !== undefined ? e.lives : 1;
        for (let h = 0; h < hearts; h++) {
          const hx = s.x - (hearts - 1) * 6 * scale * 0.5 + h * 6 * scale;
          const hy = s.y - rh * 1.1;
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(hx, hy, 3 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      const isShooter = e.canShoot;
      const fill = isShooter ? SHOOTER_ENEMY.fill : pal.fill;
      const stroke = isShooter ? SHOOTER_ENEMY.stroke : pal.stroke;
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, e.w * scale * 0.5, e.h * scale * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (isShooter) {
        const dir = e.vx > 0 ? 1 : -1;
        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(s.x + dir * (e.w * scale * 0.35), s.y - 3 * scale, dir * (8 * scale), 6 * scale);
        ctx.strokeStyle = '#5b21b6';
        ctx.strokeRect(s.x + dir * (e.w * scale * 0.35), s.y - 3 * scale, dir * (8 * scale), 6 * scale);
      }
      ctx.fillStyle = isShooter ? SHOOTER_ENEMY.eyeFill : '#1c1917';
      ctx.beginPath();
      ctx.arc(s.x - 4 * scale, s.y - 2 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.arc(s.x + 4 * scale, s.y - 2 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawEnemyProjectiles(camX) {
    const left = camX - 40;
    const right = camX + (canvas.width / scale) + 40;
    enemyProjectiles.forEach((ep) => {
      if (ep.x + ep.r < left || ep.x - ep.r > right) return;
      const s = worldToScreen(ep.x, ep.y);
      const r = ep.r * scale;
      const gradient = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, 0, s.x, s.y, r);
      gradient.addColorStop(0, '#fca5a5');
      gradient.addColorStop(0.6, '#ef4444');
      gradient.addColorStop(1, '#b91c1c');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(185,28,28,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function drawProjectiles(camX) {
    const left = camX - 40;
    const right = camX + (canvas.width / scale) + 40;
    projectiles.forEach((p) => {
      if (p.x + p.r < left || p.x - p.r > right) return;
      const s = worldToScreen(p.x, p.y);
      const r = p.r * scale;
      const gradient = ctx.createRadialGradient(s.x - r * 0.3, s.y - r * 0.3, 0, s.x, s.y, r);
      gradient.addColorStop(0, '#fef08a');
      gradient.addColorStop(0.6, '#facc15');
      gradient.addColorStop(1, '#ca8a04');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(254,240,138,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function drawGoal(camX) {
    const s = worldToScreen(goal.x, goal.y);
    const sw = goal.w * scale;
    const sh = goal.h * scale;
    const poleGrad = ctx.createLinearGradient(s.x, s.y, s.x + sw, s.y);
    poleGrad.addColorStop(0, '#78716c');
    poleGrad.addColorStop(0.5, '#a8a29e');
    poleGrad.addColorStop(1, '#78716c');
    ctx.fillStyle = poleGrad;
    ctx.fillRect(s.x + sw * 0.35, s.y + sh * 0.3, sw * 0.3, sh * 0.7);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(s.x, s.y, sw, sh * 0.35);
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x, s.y, sw, sh * 0.35);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(s.x + sw / 2, s.y + 18 * scale);
    ctx.lineTo(s.x + sw / 2 - 10 * scale, s.y + 42 * scale);
    ctx.lineTo(s.x + sw / 2, s.y + 35 * scale);
    ctx.lineTo(s.x + sw / 2 + 10 * scale, s.y + 42 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.stroke();
  }

  function drawAttackDirectionArrow() {
    if (gameState !== 'playing') return;
    const dir = player.facing;
    const ox = player.x + player.w / 2 + dir * (player.w / 2 + 6);
    const oy = player.y + player.h / 2;
    const len = 14;
    const tipX = ox + dir * len;
    const headSize = 5;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(tipX, oy);
    ctx.stroke();
    ctx.beginPath();
    if (dir > 0) {
      ctx.moveTo(tipX, oy);
      ctx.lineTo(tipX - headSize, oy - headSize * 0.6);
      ctx.lineTo(tipX - headSize, oy + headSize * 0.6);
    } else {
      ctx.moveTo(tipX, oy);
      ctx.lineTo(tipX + headSize, oy - headSize * 0.6);
      ctx.lineTo(tipX + headSize, oy + headSize * 0.6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawRobot() {
    const s = worldToScreen(player.x, player.y);
    const inv = player.invincibleUntil > Date.now();
    if (inv && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.6;
    }

    const drawW = player.w * scale;
    const drawH = player.h * scale;
    const useAvatar = avatarCanvas && avatarImage.complete && avatarImage.naturalWidth > 0;
    const isWalking = player.grounded && Math.abs(player.vx) > 0.3;
    const bounce = player.grounded ? Math.sin(player.animTime) * (isWalking ? 2.5 : 1.5) : 0;
    const stepWobble = useAvatar && isWalking ? Math.sin(player.animTime * 2) * 2.5 * scale : 0;
    if (useAvatar) {
      const cx = s.x + drawW / 2 + stepWobble;
      const cy = s.y + drawH / 2 + bounce;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(player.facing, 1);
      const scaleFill = Math.max(drawW / avatarCanvas.width, drawH / avatarCanvas.height);
      const w = avatarCanvas.width * scaleFill;
      const h = avatarCanvas.height * scaleFill;
      ctx.translate(-drawW / 2, -drawH / 2);
      ctx.drawImage(avatarCanvas, 0, 0, avatarCanvas.width, avatarCanvas.height, (drawW - w) / 2, (drawH - h) / 2, w, h);
      ctx.restore();
    } else {
      drawRobotFallback(s, bounce, drawW, drawH);
    }

    ctx.globalAlpha = 1;
  }

  function drawHeartAt(wx, wy, size) {
    const x = wx;
    const y = wy;
    const s = size;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x, y, x - s * 0.75, y - s * 0.75, x - s * 0.75, y + s * 0.25);
    ctx.bezierCurveTo(x - s * 0.75, y + s * 0.9, x, y + s * 1.35, x, y + s * 1.35);
    ctx.bezierCurveTo(x, y + s * 1.35, x + s * 0.75, y + s * 0.9, x + s * 0.75, y + s * 0.25);
    ctx.bezierCurveTo(x + s * 0.75, y - s * 0.75, x, y, x, y + s * 0.35);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  const SPEECH_BUBBLE_PHRASES = [
    'יאללה!',
    'אני יכול!',
    'עוד שלב!',
    'כל הכבוד לי',
    'מסע בזמן!',
    'קדימה!',
    'זה כיף!',
  ];
  let speechBubbleUntil = 0;
  let currentSpeechPhrase = 0;

  function drawSpeechBubble() {
    if (gameState !== 'playing') return;
    const now = Date.now();
    if (now > speechBubbleUntil) {
      speechBubbleUntil = now + 4000;
      currentSpeechPhrase = (currentSpeechPhrase + 1) % SPEECH_BUBBLE_PHRASES.length;
    }
    const phrase = SPEECH_BUBBLE_PHRASES[currentSpeechPhrase];
    const centerX = player.x + player.w / 2;
    const bubbleY = player.y - 58;
    const padding = 8 * scale;
    const lineHeight = 14 * scale;
    ctx.font = (12 * scale) + 'px "Heebo", "Fredoka", sans-serif';
    const metrics = ctx.measureText(phrase);
    const textW = metrics.width;
    const bubbleW = Math.max(textW + padding * 2, 40 * scale);
    const bubbleH = lineHeight + padding * 2;
    const bx = centerX - bubbleW / 2;
    const by = bubbleY - bubbleH;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(bx, by, bubbleW, bubbleH, 10);
    } else {
      ctx.rect(bx, by, bubbleW, bubbleH);
    }
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 8, by + bubbleH);
    ctx.lineTo(centerX, by + bubbleH + 10);
    ctx.lineTo(centerX + 8, by + bubbleH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(phrase, centerX, by + bubbleH / 2);
    ctx.restore();
  }

  function drawHeartsAbovePlayer() {
    if (gameState !== 'playing') return;
    const centerX = player.x + player.w / 2;
    const aboveY = player.y - 38;
    const heartSize = 7;
    const spacing = 16;
    const totalW = (lives - 1) * spacing;
    for (let i = 0; i < lives; i++) {
      const hx = centerX - totalW / 2 + i * spacing;
      drawHeartAt(hx, aboveY, heartSize);
    }
  }

  function drawRobotFallback(s, bounce, drawW, drawH) {
    const runPhase = Math.sin(player.animTime * 2) * 0.4;
    const legL = player.grounded ? runPhase : 0.2;
    const legR = player.grounded ? -runPhase : -0.2;
    const armSwing = player.grounded && Math.abs(player.vx) > 0.5 ? Math.sin(player.animTime * 2) * 0.5 : 0;
    const cx = s.x + drawW / 2;
    const headY = s.y + 14 * scale + bounce;
    const bodyY = s.y + 28 * scale + bounce;
    const outfit = OUTFITS[selectedOutfit] || OUTFITS.classic;

    ctx.save();
    ctx.translate(cx, headY);
    ctx.scale(player.facing, 1);
    ctx.fillStyle = outfit.head;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    const eyeY = -2 * scale;
    ctx.beginPath();
    ctx.arc(-5 * scale, eyeY, 4 * scale, 0, Math.PI * 2);
    ctx.arc(5 * scale, eyeY, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4 * scale, eyeY - 1 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.arc(6 * scale, eyeY - 1 * scale, 1.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = outfit.antenna;
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(-3 * scale, -22 * scale);
    ctx.lineTo(3 * scale, -22 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, bodyY);
    ctx.scale(player.facing, 1);
    ctx.fillStyle = outfit.body;
    ctx.beginPath();
    const bw = 24 * scale;
    const bh = 18 * scale;
    if (ctx.roundRect) {
      ctx.roundRect(-bw / 2, 0, bw, bh, 6);
    } else {
      ctx.rect(-bw / 2, 0, bw, bh);
    }
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14 * scale, 6 * scale);
    ctx.lineTo(-24 * scale + armSwing * 8 * scale, 10 * scale);
    ctx.moveTo(14 * scale, 6 * scale);
    ctx.lineTo(24 * scale - armSwing * 8 * scale, 10 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 18 * scale);
    ctx.lineTo(-12 * scale + legL * 10 * scale, 28 * scale);
    ctx.moveTo(8 * scale, 18 * scale);
    ctx.lineTo(12 * scale + legR * 10 * scale, 28 * scale);
    ctx.stroke();
    ctx.restore();
  }

  let lastTime = 0;
  let cameraX = 0;
  let homeAnimTime = 0;

  function drawHomeCharacter() {
    const c = UI.homeCharacterCanvas;
    if (!c) return;
    const hctx = c.getContext('2d');
    const cw = c.width;
    const ch = c.height;
    hctx.clearRect(0, 0, cw, ch);
    const bounce = Math.sin(homeAnimTime * 0.004) * 6;
    const drawW = 162;
    const drawH = 198;
    const cx = cw / 2;
    const cy = ch / 2 + bounce;
    const useAvatar = avatarCanvas && avatarImage.complete && avatarImage.naturalWidth > 0;
    if (useAvatar) {
      hctx.save();
      hctx.translate(cx, cy);
      const scaleFill = Math.max(drawW / avatarCanvas.width, drawH / avatarCanvas.height);
      const w = avatarCanvas.width * scaleFill;
      const h = avatarCanvas.height * scaleFill;
      hctx.drawImage(avatarCanvas, 0, 0, avatarCanvas.width, avatarCanvas.height, -drawW / 2, -drawH / 2, drawW, drawH);
      hctx.restore();
    } else {
      const sc = 4.5;
      const outfit = OUTFITS[selectedOutfit] || OUTFITS.classic;
      hctx.save();
      hctx.translate(cx, cy);
      const headY = 14 * sc - drawH / 2;
      const bodyY = 28 * sc - drawH / 2;
      hctx.fillStyle = outfit.head;
      hctx.strokeStyle = '#94a3b8';
      hctx.lineWidth = 2;
      hctx.beginPath();
      hctx.arc(0, headY, 14 * sc, 0, Math.PI * 2);
      hctx.fill();
      hctx.stroke();
      hctx.fillStyle = '#0f172a';
      hctx.beginPath();
      hctx.arc(-5 * sc, headY - 2 * sc, 4 * sc, 0, Math.PI * 2);
      hctx.arc(5 * sc, headY - 2 * sc, 4 * sc, 0, Math.PI * 2);
      hctx.fill();
      hctx.fillStyle = '#fff';
      hctx.beginPath();
      hctx.arc(-4 * sc, headY - 3 * sc, 1.5 * sc, 0, Math.PI * 2);
      hctx.arc(6 * sc, headY - 3 * sc, 1.5 * sc, 0, Math.PI * 2);
      hctx.fill();
      hctx.fillStyle = outfit.antenna;
      hctx.beginPath();
      hctx.moveTo(0, headY - 14 * sc);
      hctx.lineTo(-3 * sc, headY - 22 * sc);
      hctx.lineTo(3 * sc, headY - 22 * sc);
      hctx.closePath();
      hctx.fill();
      hctx.stroke();
      hctx.fillStyle = outfit.body;
      hctx.beginPath();
      const bw = 24 * sc;
      const bh = 18 * sc;
      if (hctx.roundRect) hctx.roundRect(-bw / 2, bodyY, bw, bh, 6);
      else hctx.rect(-bw / 2, bodyY, bw, bh);
      hctx.fill();
      hctx.strokeStyle = '#94a3b8';
      hctx.stroke();
      hctx.strokeStyle = '#64748b';
      hctx.lineWidth = 5;
      hctx.lineCap = 'round';
      hctx.beginPath();
      hctx.moveTo(-14 * sc, bodyY + 6 * sc);
      hctx.lineTo(-24 * sc, bodyY + 10 * sc);
      hctx.moveTo(14 * sc, bodyY + 6 * sc);
      hctx.lineTo(24 * sc, bodyY + 10 * sc);
      hctx.stroke();
      hctx.beginPath();
      hctx.moveTo(-8 * sc, bodyY + 18 * sc);
      hctx.lineTo(-12 * sc, bodyY + 28 * sc);
      hctx.moveTo(8 * sc, bodyY + 18 * sc);
      hctx.lineTo(12 * sc, bodyY + 28 * sc);
      hctx.stroke();
      hctx.restore();
    }
  }

  function gameLoop(now) {
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;

    if (gameState === 'home') {
      homeAnimTime = now;
      drawHomeCharacter();
    }

    if (gameState === 'playing') {
      updateEnemies(dt);
      updateEnemyShooters();
      updateEnemyProjectiles(dt);
      updateProjectiles(dt);
      updatePlayer(dt);
      cameraX = player.x - 180;
      if (cameraX < 0) cameraX = 0;
      if (cameraX > WORLD.width - canvas.width / scale) cameraX = WORLD.width - canvas.width / scale;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.translate(offsetX - cameraX * scale, offsetY);
    ctx.scale(scale, scale);

    drawBackground(cameraX);
    drawParallax(cameraX);
    drawPlatforms(cameraX);
    drawGems(cameraX);
    drawTrophies(cameraX);
    drawHearts(cameraX);
    drawEnemies(cameraX);
    drawProjectiles(cameraX);
    drawEnemyProjectiles(cameraX);
    drawGoal(cameraX);
    drawRobot();
    drawSpeechBubble();
    drawAttackDirectionArrow();
    drawHeartsAbovePlayer();

    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    gameState = 'playing';
    score = 0;
    lives = (DIFFICULTY[difficulty] || DIFFICULTY.normal).lives;
    currentLevel = 0;
    loadLevel(0);
    player.x = 120;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.facing = 1;
    player.animTime = 0;
    player.invincibleUntil = 0;
    player.attackCooldownUntil = 0;
    projectiles = [];
    enemyProjectiles = [];
    UI.scoreEl.textContent = '0';
    UI.livesEl.textContent = String(lives);
    if (UI.homeScreen) UI.homeScreen.classList.add('hidden');
    if (UI.startScreen) UI.startScreen.classList.add('hidden');
    UI.gameOverScreen.classList.add('hidden');
    UI.winScreen.classList.add('hidden');
    if (UI.missionPanel) UI.missionPanel.classList.remove('hidden');
    if (UI.touchPanel && isTouchDevice) {
      UI.touchPanel.classList.remove('hidden');
    }
    updateRotatePrompt();
    try {
      if (isTouchDevice && screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {}
  }

  function goToHome() {
    gameState = 'home';
    if (UI.touchPanel) UI.touchPanel.classList.add('hidden');
    if (UI.rotatePrompt) UI.rotatePrompt.classList.add('hidden');
    try {
      if (screen.orientation && typeof screen.orientation.unlock === 'function') {
        screen.orientation.unlock();
      }
    } catch (e) {}
    if (UI.homeScreen) UI.homeScreen.classList.remove('hidden');
    if (UI.startScreen) UI.startScreen.classList.add('hidden');
    UI.gameOverScreen.classList.add('hidden');
    UI.winScreen.classList.add('hidden');
    if (UI.missionPanel) UI.missionPanel.classList.add('hidden');
  }

  function onKey(e, down) {
    if (e.code === 'Space') e.preventDefault();
    keys[e.key] = down;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));

  if (UI.playFromHomeBtn) {
    UI.playFromHomeBtn.addEventListener('click', () => {
      if (UI.homeScreen) UI.homeScreen.classList.add('hidden');
      if (UI.startScreen) UI.startScreen.classList.remove('hidden');
    });
  }
  if (UI.startBtn) {
    UI.startBtn.addEventListener('click', () => {
      if (UI.startScreen) UI.startScreen.classList.add('hidden');
      startGame();
    });
  }
  UI.restartBtn.addEventListener('click', () => {
    goToHome();
  });
  UI.playAgainBtn.addEventListener('click', () => {
    goToHome();
  });

  document.querySelectorAll('.outfit-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-outfit') === selectedOutfit) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const outfit = btn.getAttribute('data-outfit');
      if (!outfit || !OUTFITS[outfit]) return;
      selectedOutfit = outfit;
      try { localStorage.setItem('astroOutfit', outfit); } catch (_) {}
      document.querySelectorAll('.outfit-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const toggleShootingBtn = document.getElementById('toggle-shooting-btn');
  function updateShootingButtonText() {
    if (toggleShootingBtn) {
      toggleShootingBtn.textContent = enemiesShoot ? 'כן / On' : 'לא / Off';
      toggleShootingBtn.classList.toggle('option-off', !enemiesShoot);
    }
  }
  if (toggleShootingBtn) {
    updateShootingButtonText();
    toggleShootingBtn.addEventListener('click', () => {
      enemiesShoot = !enemiesShoot;
      try { localStorage.setItem('enemiesShoot', enemiesShoot ? '1' : '0'); } catch (_) {}
      updateShootingButtonText();
    });
  }

  document.querySelectorAll('.difficulty-btn').forEach((btn) => {
    if (btn.getAttribute('data-difficulty') === difficulty) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const d = btn.getAttribute('data-difficulty');
      if (!d || !DIFFICULTY[d]) return;
      difficulty = d;
      try { localStorage.setItem('difficulty', difficulty); } catch (_) {}
      document.querySelectorAll('.difficulty-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const touchLeft = document.getElementById('touch-left');
  const touchRight = document.getElementById('touch-right');
  const touchJump = document.getElementById('touch-jump');
  const touchAttack = document.getElementById('touch-attack');
  const touchPanel = UI.touchPanel;
  if (touchPanel && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    function setKey(key, down) {
      keys[key] = down;
    }
    function preventScroll(e) {
      if (gameState === 'playing') e.preventDefault();
    }
    document.addEventListener('touchmove', preventScroll, { passive: false });
    touchLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); setKey('ArrowLeft', true); });
    touchLeft.addEventListener('pointerup', () => setKey('ArrowLeft', false));
    touchLeft.addEventListener('pointerleave', () => setKey('ArrowLeft', false));
    touchRight.addEventListener('pointerdown', (e) => { e.preventDefault(); setKey('ArrowRight', true); });
    touchRight.addEventListener('pointerup', () => setKey('ArrowRight', false));
    touchRight.addEventListener('pointerleave', () => setKey('ArrowRight', false));
    touchJump.addEventListener('pointerdown', (e) => { e.preventDefault(); setKey('w', true); });
    touchJump.addEventListener('pointerup', () => setKey('w', false));
    touchJump.addEventListener('pointerleave', () => setKey('w', false));
    if (touchAttack) {
      touchAttack.addEventListener('pointerdown', (e) => { e.preventDefault(); setKey(' ', true); });
      touchAttack.addEventListener('pointerup', () => setKey(' ', false));
      touchAttack.addEventListener('pointerleave', () => setKey(' ', false));
    }
  }

  initParallax();
  resize();
  requestAnimationFrame(gameLoop);
})();
