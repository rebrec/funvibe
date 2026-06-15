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
// JOUEUR — spritesheet articulée, clé : 'player'
// Frame 44×56. Disposition : 0 idle · 1-6 course · 7 saut · 8 chute
// · 9 atterrissage · 10-14 rotation en boule · 15 touché.
// ──────────────────────────────────────────────────────────────

export const PLAYER_FRAME = { W: 44, H: 56, COUNT: 16 };

const PLAYER_PALETTES = {
  ninja:   { cloth: 0x232b48, clothDark: 0x161c30, accent: 0xcc2222, skin: 0xe6b88a, boot: 0x0e1020, eye: 0x9ec3ff },
  warrior: { cloth: 0x5a7090, clothDark: 0x3a4a5a, accent: 0xaa2222, skin: 0xd6e2ee, boot: 0x2a3a4a, eye: 0xeaf2ff },
  monk:    { cloth: 0xe07820, clothDark: 0xb35e10, accent: 0xcc5500, skin: 0xd9b07a, boot: 0x7a3e08, eye: 0x3a2400 },
};

const DEG = Math.PI / 180;

// Dessine un membre à 2 segments depuis (x0,y0). Angles en degrés, 0 = vers le bas.
function _limb(g, x0, y0, a1, l1, a2, l2, thick, color) {
  const j1x = x0 + Math.sin(a1 * DEG) * l1;
  const j1y = y0 + Math.cos(a1 * DEG) * l1;
  const a2abs = a1 + a2;
  const fx = j1x + Math.sin(a2abs * DEG) * l2;
  const fy = j1y + Math.cos(a2abs * DEG) * l2;
  g.lineStyle(thick, color, 1);
  g.lineBetween(x0, y0, j1x, j1y);
  g.lineBetween(j1x, j1y, fx, fy);
  g.fillStyle(color, 1);
  g.fillCircle(j1x, j1y, thick / 2);
  g.fillCircle(fx, fy, thick / 2);
  return { x: fx, y: fy };
}

// Dessine l'humanoïde dans la frame i, à l'offset x0 (coin gauche de la frame).
function _drawHumanoid(g, x0, pal, pose) {
  const W = PLAYER_FRAME.W, H = PLAYER_FRAME.H;
  const cx = x0 + W / 2;
  const bob = pose.bob ?? 0;
  const groundY = H - 4 + bob;     // niveau des pieds
  const hipY = groundY - 20;       // hanches
  const shoulderY = hipY - 16;     // épaules
  const headY = shoulderY - 9;     // centre tête

  // ── Mode boule (rotation) ──
  if (pose.ball) {
    const r = 15;
    const ccy = (shoulderY + hipY) / 2 + 2;
    // Corps en boule
    g.fillStyle(pal.cloth, 1);
    g.fillCircle(cx, ccy, r);
    g.fillStyle(pal.clothDark, 1);
    g.fillCircle(cx, ccy, r - 5);
    // Bande accent + nubs de membres tournant
    const ang = (pose.ballAngle ?? 0) * DEG;
    g.fillStyle(pal.accent, 1);
    for (let k = 0; k < 2; k++) {
      const a = ang + k * Math.PI;
      g.fillCircle(cx + Math.cos(a) * (r - 3), ccy + Math.sin(a) * (r - 3), 4);
    }
    g.fillStyle(pal.boot, 1);
    for (let k = 0; k < 2; k++) {
      const a = ang + Math.PI / 2 + k * Math.PI;
      g.fillCircle(cx + Math.cos(a) * (r - 2), ccy + Math.sin(a) * (r - 2), 4);
    }
    // Petite tête qui dépasse
    g.fillStyle(pal.skin, 1);
    g.fillCircle(cx + Math.cos(ang) * (r - 1), ccy + Math.sin(ang) * (r - 1), 5);
    return;
  }

  const lean = pose.lean ?? 0;
  const sx = cx + Math.sin(lean * DEG) * 14; // décalage épaules selon inclinaison

  // ── Jambes (derrière le torse) ──
  _limb(g, cx - 4, hipY, pose.legL[0], 11, pose.legL[1], 11, 7, pal.boot);
  _limb(g, cx + 4, hipY, pose.legR[0], 11, pose.legR[1], 11, 7, pal.cloth);

  // ── Bras arrière ──
  _limb(g, sx - 6, shoulderY + 1, pose.armL[0], 9, pose.armL[1], 9, 6, pal.clothDark);

  // ── Torse ──
  g.fillStyle(pal.cloth, 1);
  g.fillRoundedRect(sx - 9, shoulderY - 2, 18, hipY - shoulderY + 6, 6);
  // Ceinture accent
  g.fillStyle(pal.accent, 1);
  g.fillRect(sx - 9, hipY - 2, 18, 4);

  // ── Tête ──
  g.fillStyle(pal.skin, 1);
  g.fillCircle(sx, headY, 8);
  // Bandeau / casque accent
  g.fillStyle(pal.accent, 1);
  g.fillRect(sx - 8, headY - 4, 16, 3);
  // Yeux (regard vers la droite = sens par défaut)
  g.fillStyle(pal.eye, 1);
  g.fillRect(sx + 1, headY - 1, 4, 3);

  // ── Bras avant ──
  _limb(g, sx + 6, shoulderY + 1, pose.armR[0], 9, pose.armR[1], 9, 6, pal.cloth);
}

export function generatePlayerTexture(scene, skinName, key = 'player') {
  const pal = PLAYER_PALETTES[skinName] ?? PLAYER_PALETTES.ninja;
  const { W, H, COUNT } = PLAYER_FRAME;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  for (let i = 0; i < COUNT; i++) {
    _drawHumanoid(g, i * W, pal, _playerPose(i));
  }
  g.generateTexture(key, W * COUNT, H);
  g.destroy();

  // Découpe en frames numériques 0..COUNT-1
  const tex = scene.textures.get(key);
  for (let i = 0; i < COUNT; i++) {
    if (!tex.has(String(i))) tex.add(i, 0, i * W, 0, W, H);
  }
}

// Renvoie la pose (angles articulaires) de la frame i.
function _playerPose(i) {
  // 0 : idle
  if (i === 0) {
    return { legL: [6, 4], legR: [-6, 4], armL: [10, 8], armR: [-10, 8], lean: 2, bob: 1 };
  }
  // 1-6 : course (cycle de marche)
  if (i >= 1 && i <= 6) {
    const p = (i - 1) / 6 * Math.PI * 2;
    const sw = 34 * Math.sin(p);          // balancement jambe
    const swA = 28 * Math.sin(p + Math.PI); // bras opposés
    return {
      legL: [sw, Math.max(0, 22 * Math.sin(p + 1)) ],
      legR: [-sw, Math.max(0, 22 * Math.sin(p + 1 + Math.PI))],
      armL: [swA, 18], armR: [-swA, 18],
      lean: 8, bob: Math.abs(Math.cos(p)) * -2,
    };
  }
  // 7 : saut (montée) — jambes repliées, bras hauts
  if (i === 7) {
    return { legL: [22, 40], legR: [-18, 40], armL: [150, 20], armR: [-150, 20], lean: 6, bob: -2 };
  }
  // 8 : chute — jambes écartées, bras tendus
  if (i === 8) {
    return { legL: [26, 8], legR: [-26, 8], armL: [120, 12], armR: [-120, 12], lean: -4, bob: 0 };
  }
  // 9 : atterrissage (squash)
  if (i === 9) {
    return { legL: [34, 50], legR: [-34, 50], armL: [50, 14], armR: [-50, 14], lean: 14, bob: 6 };
  }
  // 10-14 : rotation en boule
  if (i >= 10 && i <= 14) {
    return { ball: true, ballAngle: (i - 10) * 72 };
  }
  // 15 : touché — bascule en arrière
  return { legL: [-20, 10], legR: [12, 10], armL: [-140, 16], armR: [140, 16], lean: -18, bob: 2 };
}

// ──────────────────────────────────────────────────────────────
// ENNEMIS — 34 × 46 px, clés : 'enemy-walker' / 'enemy-charger'
// ──────────────────────────────────────────────────────────────

export const ENEMY_FRAME = { W: 34, H: 46, COUNT: 2 };

export function generateEnemyTexture(scene, skinName, type) {
  const { W, H, COUNT } = ENEMY_FRAME;
  const key = type === 'charger' ? 'enemy-charger' : 'enemy-walker';
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  const draw = (gg, ox, dy, squash) => {
    gg.save();
    gg.translateCanvas(ox, dy);
    if (squash) { gg.translateCanvas(0, H * 0.04); gg.scaleCanvas(1.04, 0.96); }
    if (type === 'charger') {
      if (skinName === 'boar') _drawBoar(gg, W, H);
      else _drawKnight(gg, W, H);
    } else {
      if (skinName === 'goblin') _drawGoblin(gg, W, H);
      else _drawOrc(gg, W, H);
    }
    gg.restore();
  };
  // Frame 0 : repos · Frame 1 : rebond de marche (léger squash + descente)
  draw(g, 0, 0, false);
  draw(g, W, 2, true);

  g.generateTexture(key, W * COUNT, H);
  g.destroy();

  const tex = scene.textures.get(key);
  for (let i = 0; i < COUNT; i++) {
    if (!tex.has(String(i))) tex.add(i, 0, i * W, 0, W, H);
  }
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
