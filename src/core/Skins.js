// Skins.js — Définitions de skins + génération de textures procédurales
// Toutes les textures sont dessinées via l'API Graphics de Phaser (0 asset externe).

export const PLAYER_SKINS = ['ninja', 'warrior', 'monk'];
export const ENEMY_WALKER_SKINS = ['orc', 'goblin'];
export const ENEMY_CHARGER_SKINS = ['knight', 'boar'];
export const THEMES = ['forest', 'snow', 'sea', 'volcano'];

const THEME_DATA = {
  forest: {
    name: 'Forêt',
    decorFn: 'forest',
    background: '#2d5a3d',
    groundTop: 0x44aa33,
    groundBody: 0x3a2008,
    platColor: 0x7a5228,
    platHighlight: 0xaa7a3a,
    slopeColor: 0x4a2e0a,
    coinColor: 0xffd23f,
    coinStroke: 0xb8860b,
    crystalColor: 0x49e0e0,
    crystalStroke: 0x1f8a8a,
  },
  snow: {
    name: 'Neige',
    decorFn: 'snow',
    background: '#a8d0f0',
    groundTop: 0xe8f6ff,
    groundBody: 0x8ab0d0,
    platColor: 0xb0d0e8,
    platHighlight: 0xd8f0ff,
    slopeColor: 0xa0c0d8,
    coinColor: 0xd0e8ff,
    coinStroke: 0x8090c0,
    crystalColor: 0xaaccff,
    crystalStroke: 0x6080c0,
  },
  sea: {
    name: 'Mer',
    decorFn: 'sea',
    background: '#0a3060',
    groundTop: 0xd4a847,
    groundBody: 0x805020,
    platColor: 0xc04030,
    platHighlight: 0xff7060,
    slopeColor: 0x904020,
    coinColor: 0xffe8c0,
    coinStroke: 0xc09040,
    crystalColor: 0x40d0ff,
    crystalStroke: 0x2080c0,
  },
  volcano: {
    name: 'Volcan',
    decorFn: 'volcano',
    background: '#180800',
    groundTop: 0x503020,
    groundBody: 0x200e00,
    platColor: 0x4a3020,
    platHighlight: 0xff6600,
    slopeColor: 0x2a1800,
    coinColor: 0xff8800,
    coinStroke: 0xff4400,
    crystalColor: 0xff4488,
    crystalStroke: 0xaa0044,
  },
};

export function getTheme(name) {
  return THEME_DATA[name] ?? THEME_DATA.forest;
}

// ──────────────────────────────────────────────────────────────
// JOUEUR — 36 × 48 px, clé : 'player'
// ──────────────────────────────────────────────────────────────

export function generatePlayerTexture(scene, skinName) {
  const W = 36, H = 48;
  if (scene.textures.exists('player')) scene.textures.remove('player');
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  if (skinName === 'warrior') _drawWarrior(g, W, H);
  else if (skinName === 'monk') _drawMonk(g, W, H);
  else _drawNinja(g, W, H);
  g.generateTexture('player', W, H);
  g.destroy();
}

function _drawNinja(g, W, H) {
  // Corps bleu-noir foncé
  g.fillStyle(0x1a1a2e, 1);
  g.fillRoundedRect(0, 0, W, H, 7);
  // Zone tête légèrement plus claire
  g.fillStyle(0x252540, 1);
  g.fillRect(4, 0, 28, 13);
  // Bandeau rouge
  g.fillStyle(0xcc2222, 1);
  g.fillRect(3, 8, 30, 5);
  // Masque bas du visage
  g.fillStyle(0x0e0e22, 1);
  g.fillRect(5, 19, 26, 9);
  // Yeux blancs (fentes)
  g.fillStyle(0xffffff, 1);
  g.fillRect(7, 14, 9, 4);
  g.fillRect(20, 14, 9, 4);
  // Iris (légèrement bleutées)
  g.fillStyle(0x88aaff, 1);
  g.fillRect(9, 15, 5, 2);
  g.fillRect(22, 15, 5, 2);
  // Écharpe violette (côté gauche, signe d'orientation)
  g.fillStyle(0x4a1a6a, 1);
  g.fillRect(0, 20, 5, 14);
  g.fillRect(0, 34, 3, 8);
  // Ceinture
  g.fillStyle(0x3a2a10, 1);
  g.fillRect(4, 31, 28, 4);
  g.fillStyle(0x8a6a30, 1);
  g.fillRect(14, 31, 8, 4);
  // Jambes (séparées)
  g.fillStyle(0x141428, 1);
  g.fillRect(3, 37, 13, 11);
  g.fillRect(20, 37, 13, 11);
  g.fillStyle(0x080810, 1);
  g.fillRect(16, 37, 4, 11);
}

function _drawWarrior(g, W, H) {
  // Corps acier
  g.fillStyle(0x5a7090, 1);
  g.fillRoundedRect(0, 0, W, H, 6);
  // Cape violette derrière (côté gauche)
  g.fillStyle(0x1a0030, 1);
  g.fillRect(0, 14, 5, 26);
  // Casque gris foncé
  g.fillStyle(0x3a4a5a, 1);
  g.fillRoundedRect(0, 0, W, 20, { tl: 6, tr: 6, bl: 0, br: 0 });
  // Crête de casque (rouge)
  g.fillStyle(0xaa2222, 1);
  g.fillRect(13, 0, 10, 5);
  // Visière (fentes)
  g.fillStyle(0x1a2a3a, 1);
  g.fillRect(5, 8, 9, 5);
  g.fillRect(22, 8, 9, 5);
  // Lueur des yeux
  g.fillStyle(0xccddee, 1);
  g.fillRect(6, 9, 7, 3);
  g.fillRect(23, 9, 7, 3);
  // Épaulières
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(0, 19, 8, 10);
  g.fillRect(28, 19, 8, 10);
  // Plastron
  g.fillStyle(0x4a6080, 1);
  g.fillRect(5, 20, 26, 16);
  // Croix sur le plastron
  g.fillStyle(0x6a8aa0, 1);
  g.fillRect(16, 21, 4, 14);
  g.fillRect(6, 28, 22, 2);
  // Ceinture
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(3, 36, 30, 4);
  // Jambières
  g.fillStyle(0x4a6080, 1);
  g.fillRect(3, 40, 13, 8);
  g.fillRect(20, 40, 13, 8);
  g.fillStyle(0x3a5070, 1);
  g.fillRect(16, 40, 4, 8);
}

function _drawMonk(g, W, H) {
  // Robe safran
  g.fillStyle(0xe07820, 1);
  g.fillRoundedRect(0, 0, W, H, 6);
  // Crâne rasé (peau)
  g.fillStyle(0xd4aa70, 1);
  g.fillRoundedRect(7, 0, 22, 16, { tl: 8, tr: 8, bl: 4, br: 4 });
  // Yeux fermés (zen)
  g.fillStyle(0x6a4400, 1);
  g.fillRect(9, 11, 7, 2);
  g.fillRect(20, 11, 7, 2);
  // Sourire
  g.fillRect(13, 15, 10, 2);
  g.fillRect(12, 16, 2, 2);
  g.fillRect(22, 16, 2, 2);
  // Grand obi / ceinture
  g.fillStyle(0xcc5500, 1);
  g.fillRect(0, 28, W, 8);
  g.fillStyle(0xff6a00, 1);
  g.fillRect(13, 28, 10, 8);
  // Plis de robe
  g.fillStyle(0xc06810, 1);
  g.fillRect(14, 36, 2, 12);
  g.fillRect(7, 36, 2, 12);
  g.fillRect(27, 36, 2, 12);
  // Chapelet
  g.fillStyle(0x8a4400, 1);
  for (let i = 0; i < 5; i++) g.fillCircle(10 + i * 4, 26, 2);
}

// ──────────────────────────────────────────────────────────────
// ENNEMIS — 34 × 46 px, clés : 'enemy-walker' / 'enemy-charger'
// ──────────────────────────────────────────────────────────────

export function generateEnemyTexture(scene, skinName, type) {
  const W = 34, H = 46;
  const key = type === 'charger' ? 'enemy-charger' : 'enemy-walker';
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  if (type === 'charger') {
    if (skinName === 'boar') _drawBoar(g, W, H);
    else _drawKnight(g, W, H);
  } else {
    if (skinName === 'goblin') _drawGoblin(g, W, H);
    else _drawOrc(g, W, H);
  }
  g.generateTexture(key, W, H);
  g.destroy();
}

function _drawOrc(g, W, H) {
  // Corps vert
  g.fillStyle(0x2a7a2a, 1);
  g.fillRoundedRect(0, 0, W, H, 6);
  // Tête plus claire
  g.fillStyle(0x3a9a3a, 1);
  g.fillRoundedRect(3, 2, 28, 24, 5);
  // Sourcils en colère (unibrow fendu)
  g.fillStyle(0x1a5a1a, 1);
  g.fillRect(5, 6, 10, 4);
  g.fillRect(19, 6, 10, 4);
  // Grand oeil unique (cyclope)
  g.fillStyle(0xdd2222, 1);
  g.fillCircle(17, 16, 7);
  g.fillStyle(0x000000, 1);
  g.fillCircle(17, 17, 3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(14, 14, 2);
  // Bouche foncée
  g.fillStyle(0x1a5a1a, 1);
  g.fillRect(8, 28, 18, 6);
  // Crocs jaunes
  g.fillStyle(0xddcc44, 1);
  g.fillTriangle(10, 28, 15, 28, 12, 42);
  g.fillTriangle(19, 28, 24, 28, 21, 42);
  // Armure rudimentaire
  g.fillStyle(0x1a4a1a, 1);
  g.fillRect(4, 32, 26, 4);
  g.fillRect(4, 38, 10, 8);
  g.fillRect(20, 38, 10, 8);
}

function _drawGoblin(g, W, H) {
  // Corps jaune-vert
  g.fillStyle(0x7a8a18, 1);
  g.fillRoundedRect(0, 6, W, 40, 5);
  // Tête ronde
  g.fillStyle(0x9aaa20, 1);
  g.fillRoundedRect(3, 0, 28, 26, 8);
  // Oreilles pointues
  g.fillStyle(0x7a8a18, 1);
  g.fillTriangle(1, 2, 7, 8, 1, 14);
  g.fillTriangle(33, 2, 27, 8, 33, 14);
  // Grands yeux effrayés
  g.fillStyle(0xffffaa, 1);
  g.fillCircle(11, 13, 7);
  g.fillCircle(23, 13, 7);
  g.fillStyle(0x1a1a00, 1);
  g.fillCircle(12, 14, 3);
  g.fillCircle(24, 14, 3);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(9, 11, 2);
  g.fillCircle(21, 11, 2);
  // Cernes nerveux
  g.fillStyle(0x5a6a08, 1);
  g.fillRect(6, 19, 10, 3);
  g.fillRect(18, 19, 10, 3);
  // Petite bouche crispée
  g.fillStyle(0x2a3a00, 1);
  g.fillRect(11, 23, 12, 3);
  g.fillRect(11, 22, 2, 2);
  g.fillRect(21, 22, 2, 2);
}

function _drawKnight(g, W, H) {
  // Corps armure acier
  g.fillStyle(0x7a8a9a, 1);
  g.fillRoundedRect(0, 0, W, H, 5);
  // Casque (haut 22px)
  g.fillStyle(0x4a5a6a, 1);
  g.fillRoundedRect(0, 0, W, 22, { tl: 5, tr: 5, bl: 0, br: 0 });
  // Crête rouge
  g.fillStyle(0xaa2222, 1);
  g.fillRect(14, 0, 6, 6);
  // Visière (deux fentes)
  g.fillStyle(0x1a2a3a, 1);
  g.fillRect(5, 9, 9, 5);
  g.fillRect(20, 9, 9, 5);
  // Lueur yeux (orange = dangereux)
  g.fillStyle(0xcc8800, 1);
  g.fillRect(6, 10, 7, 3);
  g.fillRect(21, 10, 7, 3);
  // Épaulières
  g.fillStyle(0x3a4a5a, 1);
  g.fillRect(0, 20, 9, 10);
  g.fillRect(25, 20, 9, 10);
  // Plastron avec croix
  g.fillStyle(0x5a6a7a, 1);
  g.fillRect(7, 22, 20, 18);
  g.fillStyle(0x8a9aaa, 1);
  g.fillRect(15, 23, 4, 16);
  g.fillRect(8, 30, 18, 4);
  // Ceinture
  g.fillStyle(0x2a3a4a, 1);
  g.fillRect(4, 38, 26, 4);
  // Jambières
  g.fillStyle(0x6a7a8a, 1);
  g.fillRect(3, 40, 12, 6);
  g.fillRect(19, 40, 12, 6);
  g.fillStyle(0x4a5a6a, 1);
  g.fillRect(15, 40, 4, 6);
}

function _drawBoar(g, W, H) {
  // Corps trapu marron
  g.fillStyle(0x7a4a20, 1);
  g.fillRoundedRect(0, 6, W, 40, 4);
  // Tête large
  g.fillStyle(0x8a5a28, 1);
  g.fillRoundedRect(1, 0, 32, 26, 6);
  // Poils hérissés sur le crâne
  g.fillStyle(0x4a2a0a, 1);
  g.fillRect(10, 0, 3, 8);
  g.fillRect(16, 0, 4, 10);
  g.fillRect(23, 0, 3, 8);
  // Groin
  g.fillStyle(0x9a6a40, 1);
  g.fillRoundedRect(7, 16, 20, 14, 5);
  // Narines
  g.fillStyle(0x5a2a08, 1);
  g.fillCircle(13, 24, 3);
  g.fillCircle(21, 24, 3);
  // Yeux rouges méchants
  g.fillStyle(0xff2222, 1);
  g.fillCircle(8, 10, 5);
  g.fillCircle(26, 10, 5);
  g.fillStyle(0x000000, 1);
  g.fillCircle(8, 10, 2);
  g.fillCircle(26, 10, 2);
  // Sourcils furieux (triangle)
  g.fillStyle(0x3a1a00, 1);
  g.fillTriangle(3, 5, 13, 7, 3, 8);
  g.fillTriangle(31, 5, 21, 7, 31, 8);
  // Défenses blanches
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(9, 30, 14, 30, 11, 46);
  g.fillTriangle(20, 30, 25, 30, 22, 46);
  // Pattes
  g.fillStyle(0x5a3010, 1);
  g.fillRect(3, 38, 11, 8);
  g.fillRect(20, 38, 11, 8);
  g.fillStyle(0x1a0a00, 1);
  g.fillRect(3, 44, 11, 2);
  g.fillRect(20, 44, 11, 2);
}

// ──────────────────────────────────────────────────────────────
// SHURIKEN — inchangé
// ──────────────────────────────────────────────────────────────

export function generateShurikenTexture(scene) {
  const RADIUS = 9;
  const size = RADIUS * 2 + 4;
  const c = size / 2;
  const spikes = 4;
  const outer = RADIUS;
  const inner = RADIUS * 0.38;
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push({ x: c + Math.cos(a) * r, y: c + Math.sin(a) * r });
  }
  if (scene.textures.exists('shuriken')) scene.textures.remove('shuriken');
  const s = scene.make.graphics({ x: 0, y: 0, add: false });
  s.fillStyle(0x33373d, 1);
  s.fillPoints(pts, true);
  s.generateTexture('shuriken', size, size);
  s.destroy();
}

// ──────────────────────────────────────────────────────────────
// DÉCORS D'ARRIÈRE-PLAN (appelé depuis LevelScene / HubScene)
// ──────────────────────────────────────────────────────────────

// Dessine les décors de fond pour un niveau (monde large).
// worldH est nécessaire pour le remplissage terreux global.
export function buildLevelDecor(scene, theme, worldW, worldH, groundY) {
  // ── Couche de fond (depth -5) : remplissage terreux global sous la ligne d'horizon
  const gBase = scene.add.graphics().setDepth(-5);
  gBase.fillStyle(theme.groundBody, 1);
  gBase.fillRect(0, groundY, worldW, worldH - groundY);
  // Bande de surface sur toute la largeur
  gBase.fillStyle(theme.groundTop, 1);
  gBase.fillRect(0, groundY, worldW, 12);

  // ── Couche décors (depth -10) : éléments thématiques
  const g = scene.add.graphics().setDepth(-10);
  const fn = theme.decorFn;
  if (fn === 'forest') _forestDecor(g, worldW, groundY);
  else if (fn === 'snow') _snowDecor(g, worldW, groundY);
  else if (fn === 'sea') _seaDecor(g, worldW, groundY);
  else _volcanoDecor(g, worldW, groundY);
}

function _forestDecor(g, W, groundY) {
  // Montagnes lointaines (silhouettes)
  g.fillStyle(0x2a5a3a, 0.5);
  [600, 1800, 3200, 5000, 7200, 9000, 10800].forEach((mx, i) => {
    const h = 350 + (i * 80) % 250;
    const w = 500 + (i * 130) % 400;
    g.fillTriangle(mx - w / 2, groundY, mx, groundY - h, mx + w / 2, groundY);
  });
  // Deuxième rang de montagnes (plus proches, plus foncées)
  g.fillStyle(0x1e4028, 0.6);
  [200, 1200, 2600, 4200, 6000, 8200, 10200, 11600].forEach((mx, i) => {
    const h = 200 + (i * 60) % 180;
    const w = 350 + (i * 90) % 300;
    g.fillTriangle(mx - w / 2, groundY, mx, groundY - h, mx + w / 2, groundY);
  });
  // Troncs d'arbres
  g.fillStyle(0x3a1a08, 0.75);
  for (let x = 80; x < W; x += 220 + (x % 180)) {
    const h = 100 + (x % 100);
    g.fillRect(x - 5, groundY - h, 10, h);
  }
  // Feuillages
  g.fillStyle(0x1a5a22, 0.7);
  for (let x = 80; x < W; x += 220 + (x % 180)) {
    const h = 100 + (x % 100);
    const r = 38 + (x % 32);
    g.fillCircle(x, groundY - h - r * 0.6, r);
  }
  // Arbustes au sol
  g.fillStyle(0x2a6a2a, 0.5);
  for (let x = 150; x < W; x += 350 + (x % 200)) {
    g.fillCircle(x, groundY - 10, 18 + (x % 12));
  }
}

function _snowDecor(g, W, groundY) {
  // Montagnes enneigées
  g.fillStyle(0x8ab0c8, 0.5);
  [500, 2000, 4000, 6500, 9000, 11000].forEach((mx, i) => {
    const h = 400 + (i * 70) % 200;
    const w = 600 + (i * 100) % 300;
    g.fillTriangle(mx - w / 2, groundY, mx, groundY - h, mx + w / 2, groundY);
  });
  // Capuchons neige sur montagnes
  g.fillStyle(0xe8f6ff, 0.8);
  [500, 2000, 4000, 6500, 9000, 11000].forEach((mx, i) => {
    const h = 400 + (i * 70) % 200;
    g.fillTriangle(mx - 80, groundY - h + 100, mx, groundY - h, mx + 80, groundY - h + 100);
  });
  // Sapins (triangles)
  g.fillStyle(0x2a5a2a, 0.7);
  for (let x = 100; x < W; x += 200 + (x % 150)) {
    const h = 120 + (x % 80);
    const w = 50 + (x % 30);
    g.fillTriangle(x - w, groundY, x, groundY - h, x + w, groundY);
    g.fillTriangle(x - w * 0.7, groundY - h * 0.4, x, groundY - h - 30, x + w * 0.7, groundY - h * 0.4);
  }
  // Troncs sapins
  g.fillStyle(0x4a2a08, 0.7);
  for (let x = 100; x < W; x += 200 + (x % 150)) {
    g.fillRect(x - 4, groundY - 18, 8, 18);
  }
  // Flocons (petits cercles blancs dispersés)
  g.fillStyle(0xffffff, 0.6);
  const flakePositions = [
    [200, groundY - 300], [800, groundY - 500], [1500, groundY - 400],
    [2400, groundY - 600], [3200, groundY - 350], [4500, groundY - 480],
    [5800, groundY - 420], [7000, groundY - 550], [8500, groundY - 380],
    [9800, groundY - 500], [11000, groundY - 320],
  ];
  flakePositions.forEach(([fx, fy]) => {
    g.fillCircle(fx, fy, 4);
    g.fillCircle(fx + 80, fy - 60, 3);
    g.fillCircle(fx - 50, fy + 40, 5);
  });
}

function _seaDecor(g, W, groundY) {
  // Fond marin (gradient simulé avec des bandes)
  g.fillStyle(0x0a2850, 0.6);
  g.fillRect(0, groundY - 400, W, 400);
  g.fillStyle(0x0a3870, 0.4);
  g.fillRect(0, groundY - 700, W, 300);
  // Vagues à l'horizon (ondulations)
  g.fillStyle(0x2060a0, 0.5);
  for (let x = 0; x < W; x += 200) {
    g.fillEllipse(x + 100, groundY - 500, 240, 60);
  }
  // Soleil / lune (haut de l'écran)
  g.fillStyle(0xffee44, 0.8);
  g.fillCircle(W * 0.8, groundY - 1200, 80);
  // Reflet du soleil sur l'eau
  g.fillStyle(0xffee44, 0.3);
  for (let i = 0; i < 5; i++) {
    g.fillRect(W * 0.8 - 10 + i * 8, groundY - 500, 4, 300 - i * 40);
  }
  // Coraux / algues au "sol"
  g.fillStyle(0xcc4422, 0.7);
  for (let x = 150; x < W; x += 400 + (x % 250)) {
    g.fillEllipse(x, groundY - 20, 40, 60);
    g.fillEllipse(x + 30, groundY - 15, 30, 45);
  }
  g.fillStyle(0x228844, 0.6);
  for (let x = 300; x < W; x += 300 + (x % 200)) {
    g.fillRect(x - 4, groundY - 80, 8, 80);
    g.fillEllipse(x, groundY - 90, 30, 20);
  }
  // Bulles
  g.fillStyle(0xaaddff, 0.4);
  [400, 1200, 2500, 4000, 6000, 8500, 10000].forEach((bx, i) => {
    g.fillCircle(bx, groundY - 150 - i * 30, 8 + i % 5);
    g.fillCircle(bx + 60, groundY - 250, 5);
  });
}

function _volcanoDecor(g, W, groundY) {
  // Cratère / volcan en arrière-plan
  g.fillStyle(0x3a1400, 0.8);
  [1500, 5000, 9000].forEach((vx, i) => {
    const h = 500 + i * 100;
    const w = 600 + i * 80;
    g.fillTriangle(vx - w / 2, groundY, vx, groundY - h, vx + w / 2, groundY);
    // Bouche du cratère (dépression au sommet)
    g.fillStyle(0x200800, 0.9);
    g.fillEllipse(vx, groundY - h, 120, 40);
    // Lueur de lave dans le cratère
    g.fillStyle(0xff6600, 0.4);
    g.fillEllipse(vx, groundY - h + 10, 100, 30);
    g.fillStyle(0x3a1400, 0.8);
  });
  // Colonnes de lave solidifiée (roche sombre)
  g.fillStyle(0x2a1808, 0.8);
  for (let x = 200; x < W; x += 500 + (x % 300)) {
    const h = 100 + (x % 120);
    g.fillRect(x - 18, groundY - h, 36, h);
    // Pic en haut
    g.fillTriangle(x - 18, groundY - h, x, groundY - h - 30, x + 18, groundY - h);
  }
  // Fissures de lave au sol (orange)
  g.fillStyle(0xff6600, 0.5);
  [300, 900, 2000, 3500, 5500, 7500, 10000].forEach(lx => {
    g.fillRect(lx, groundY - 8, 80 + (lx % 60), 6);
    g.fillRect(lx + 20, groundY - 14, 30, 6);
  });
  // Braise / cendres (petits points rouges en l'air)
  g.fillStyle(0xff4400, 0.6);
  [600, 1800, 3500, 6000, 8000, 11000].forEach((cx, i) => {
    g.fillCircle(cx, groundY - 300 - i * 20, 5);
    g.fillCircle(cx + 40, groundY - 400, 3);
    g.fillCircle(cx - 30, groundY - 350, 4);
  });
}

// Décors pour le hub (monde court)
export function buildHubDecor(scene, theme, hubW, groundY) {
  const g = scene.add.graphics();
  g.setDepth(-10);
  const fn = theme.decorFn;
  if (fn === 'forest') _hubForest(g, hubW, groundY);
  else if (fn === 'snow') _hubSnow(g, hubW, groundY);
  else if (fn === 'sea') _hubSea(g, hubW, groundY);
  else _hubVolcano(g, hubW, groundY);
}

function _hubForest(g, W, groundY) {
  // Montagne lointaine unique
  g.fillStyle(0x2a5a3a, 0.4);
  g.fillTriangle(W * 0.6, groundY, W * 0.8, groundY - 280, W * 1.0, groundY);
  // Quelques nuages
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(200, 80, 120, 50);
  g.fillEllipse(250, 70, 80, 40);
  g.fillEllipse(700, 100, 150, 55);
  g.fillEllipse(760, 88, 100, 45);
  g.fillEllipse(1050, 65, 110, 48);
}

function _hubSnow(g, W, groundY) {
  g.fillStyle(0x8ab0c8, 0.4);
  g.fillTriangle(W * 0.5, groundY, W * 0.7, groundY - 300, W * 0.9, groundY);
  g.fillStyle(0xe8f6ff, 0.7);
  g.fillTriangle(W * 0.55, groundY - 220, W * 0.7, groundY - 300, W * 0.85, groundY - 220);
  // Flocons
  g.fillStyle(0xffffff, 0.5);
  [[150, 120], [400, 80], [800, 150], [1100, 90], [1300, 130]].forEach(([x, y]) => {
    g.fillCircle(x, y, 4);
  });
}

function _hubSea(g, W, groundY) {
  // Soleil
  g.fillStyle(0xffee44, 0.7);
  g.fillCircle(W - 150, 100, 60);
  // Vagues
  g.fillStyle(0x2060a0, 0.4);
  for (let x = 0; x < W; x += 180) {
    g.fillEllipse(x + 90, groundY - 400, 210, 50);
  }
}

function _hubVolcano(g, W, groundY) {
  g.fillStyle(0x3a1400, 0.7);
  g.fillTriangle(W * 0.7, groundY, W * 0.85, groundY - 350, W * 1.0, groundY);
  g.fillStyle(0xff6600, 0.3);
  g.fillEllipse(W * 0.85, groundY - 350, 80, 25);
  g.fillStyle(0xff2200, 0.5);
  for (let x = 100; x < W; x += 400) {
    g.fillRect(x, groundY - 6, 60, 5);
  }
}
