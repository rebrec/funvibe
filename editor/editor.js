// Éditeur de niveaux jeuleo — vanilla JS + Canvas 2D.
// Communication jeu ↔ éditeur via localStorage (clé "customLevels").

import { smoothClosedCurve } from '../src/world/curve.js';

const STORAGE_KEY = 'customLevels';

// ── État global ────────────────────────────────────────────────────────────
let zoom = 0.5;
let snap = 20;
let currentTool = 'ground';
let selectedIdx = -1;     // index dans elements[]
let dragState = null;     // { phase, x0,y0,x1,y1 }
let panState  = null;
let moveState = null;     // déplacement (glisser-déposer) en mode Sélection
let curveKind = 'curve';  // 'curve' (pente ouverte) ou 'island' (boucle fermée)
let offsetX = 40, offsetY = 40;

let levelName  = 'Nouveau niveau';
let worldW = 4000, worldH = 2200;
let levelStart  = { x: 120, y: 1900 };
let levelFinish = null;
let elements    = []; // { type, ... } pour terrain + entités
let curveDraft  = null; // points de la courbe en cours de tracé
let showReference = false;
let referencePos = { x: 500, y: 1500 }; // position du repère joueur
let draggingReference = false;

// ── Canvas ───────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  render();
}
window.addEventListener('resize', resizeCanvas);

const COLORS = {
  ground:         { fill: '#4a7a40', stroke: '#88cc66' },
  platform:       { fill: '#6655bb', stroke: '#9977ff' },
  slope:          { fill: '#887744', stroke: '#ccaa66' },
  curve:          { fill: '#3a8a4a', stroke: '#7fe08f' },
  island:         { fill: '#3a7a55', stroke: '#7fe0a8' },
  landmark:       { fill: '#9944bb', stroke: '#dd88ff' },
  'enemy-walker': { fill: '#cc4444', stroke: '#ff8888' },
  'enemy-charger':{ fill: '#993311', stroke: '#ff6633' },
  coin:           { fill: '#ddbb22', stroke: '#ffee44' },
  crystal:        { fill: '#22bbdd', stroke: '#88eeff' },
};

const TOOL_LABELS = {
  ground: 'Sol', platform: 'Plateforme', slope: 'Pente droite', curve: 'Pente douce',
  island: 'Île suspendue', landmark: 'Repère', start: 'Début', finish: 'Arrivée',
  'enemy-walker': 'Ennemi walker', 'enemy-charger': 'Ennemi charger',
  coin: 'Pièce', crystal: 'Cristal', select: 'Sélection',
};

// ── Coordonnées ────────────────────────────────────────────────────────────
function toWorld(cx, cy) { return { x: Math.round((cx - offsetX) / zoom), y: Math.round((cy - offsetY) / zoom) }; }
function toCanvas(wx, wy) { return { x: wx * zoom + offsetX, y: wy * zoom + offsetY }; }
function snapV(v) { return Math.round(v / snap) * snap; }

// Recadre la vue (zoom + offset) pour englober tout le contenu chargé.
function frameView() {
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  const acc = (x, y) => { minx = Math.min(minx, x); miny = Math.min(miny, y); maxx = Math.max(maxx, x); maxy = Math.max(maxy, y); };
  elements.forEach((el) => {
    if (el.points) el.points.forEach((p) => acc(p.x, p.y));
    else if (el.x1 != null) { acc(el.x1, el.y1); acc(el.x2, el.y2); }
    else { acc(el.x, el.y); if (el.width) acc(el.x + el.width, el.y + 30); }
  });
  acc(levelStart.x, levelStart.y);
  if (levelFinish) acc(levelFinish.x, levelFinish.y);
  if (!Number.isFinite(minx)) { minx = 0; miny = 0; maxx = worldW; maxy = worldH; }
  const pad = 140;
  minx -= pad; miny -= pad; maxx += pad; maxy += pad;
  const bw = Math.max(1, maxx - minx), bh = Math.max(1, maxy - miny);
  const cw = canvas.width || canvas.offsetWidth, ch = canvas.height || canvas.offsetHeight;
  zoom = Math.min(2, Math.max(0.05, Math.min(cw / bw, ch / bh)));
  offsetX = -minx * zoom + (cw - bw * zoom) / 2;
  offsetY = -miny * zoom + (ch - bh * zoom) / 2;
  document.getElementById('zoom').value = Math.min(2, zoom);
  document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
}

// Applique un décalage (dx,dy) à un élément quel que soit son type.
function applyDelta(el, dx, dy) {
  if (el.points) { el.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy })); }
  else if (el.x1 != null) { el.x1 += dx; el.y1 += dy; el.x2 += dx; el.y2 += dy; }
  else {
    if (el.x != null) el.x += dx;
    if (el.y != null) el.y += dy;
    if (el.minX != null) el.minX += dx;
    if (el.maxX != null) el.maxX += dx;
    if (el.platformTop != null) el.platformTop += dy;
  }
  return el;
}

// ── Rendu ──────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grille
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  const gStep = snap * zoom;
  if (gStep > 4) {
    for (let x = offsetX % gStep; x < canvas.width; x += gStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = offsetY % gStep; y < canvas.height; y += gStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  // Cadre du monde
  const o = toCanvas(0, 0);
  const e = toCanvas(worldW, worldH);
  ctx.strokeStyle = '#9977ff66';
  ctx.lineWidth = 2;
  ctx.strokeRect(o.x, o.y, e.x - o.x, e.y - o.y);
  ctx.fillStyle = '#9977ff44';
  ctx.font = '11px monospace';
  ctx.fillText(`${worldW} × ${worldH}`, o.x + 4, o.y + 14);

  elements.forEach((el, i) => drawElement(el, i === selectedIdx));

  drawFlag(levelStart, '#33dd55', 'DÉBUT');
  if (levelFinish) drawCheckered(levelFinish);

  if (dragState && dragState.phase === 'drag') drawDragPreview();
  if (curveDraft) drawCurveDraft();
  if (showReference) drawReference();
}

function smoothPath(pts) {
  // Trace une courbe douce passant par les points (midpoints quadratiques).
  if (pts.length < 2) return;
  const c0 = toCanvas(pts[0].x, pts[0].y);
  ctx.moveTo(c0.x, c0.y);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = toCanvas(pts[i].x, pts[i].y);
    const b = toCanvas(pts[i + 1].x, pts[i + 1].y);
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  const last = toCanvas(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.lineTo(last.x, last.y);
}

function drawElement(el, selected) {
  const col = COLORS[el.type] ?? COLORS.platform;
  ctx.fillStyle   = col.fill + (selected ? 'dd' : '99');
  ctx.strokeStyle = selected ? '#ffffff' : col.stroke;
  ctx.lineWidth   = selected ? 2 : 1;

  if (el.type === 'island') {
    const pts = smoothClosedCurve(el.points, 8);
    ctx.beginPath();
    const c0 = toCanvas(pts[0].x, pts[0].y); ctx.moveTo(c0.x, c0.y);
    for (let i = 1; i < pts.length; i++) { const c = toCanvas(pts[i].x, pts[i].y); ctx.lineTo(c.x, c.y); }
    ctx.closePath(); ctx.fill();
    ctx.lineWidth = selected ? 4 : 3; ctx.strokeStyle = selected ? '#ffffff' : col.stroke; ctx.stroke();
    ctx.fillStyle = col.stroke;
    el.points.forEach(p => { const c = toCanvas(p.x, p.y); ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI * 2); ctx.fill(); });
    return;
  }

  if (el.type === 'curve') {
    // Remplissage jusqu'au bas du monde + crête lissée
    const bottom = toCanvas(0, worldH).y;
    ctx.beginPath();
    smoothPath(el.points);
    const lastC = toCanvas(el.points[el.points.length - 1].x, el.points[el.points.length - 1].y);
    const firstC = toCanvas(el.points[0].x, el.points[0].y);
    ctx.lineTo(lastC.x, bottom);
    ctx.lineTo(firstC.x, bottom);
    ctx.closePath();
    ctx.fill();
    // Crête (herbe)
    ctx.beginPath(); smoothPath(el.points);
    ctx.strokeStyle = selected ? '#ffffff' : col.stroke;
    ctx.lineWidth = selected ? 4 : 3;
    ctx.stroke();
    // Points de contrôle
    ctx.fillStyle = col.stroke;
    el.points.forEach(p => { const c = toCanvas(p.x, p.y); ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI*2); ctx.fill(); });
    return;
  }

  if (el.type === 'slope') {
    const a = toCanvas(el.x1, el.y1);
    const b = toCanvas(el.x2, el.y2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 20 * zoom); ctx.lineTo(a.x, a.y + 20 * zoom);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    return;
  }

  if (el.type === 'coin' || el.type === 'crystal') {
    const c = toCanvas(el.x, el.y);
    const r = Math.max(4, 12 * zoom);
    if (el.type === 'crystal') {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.PI / 4);
      ctx.beginPath(); ctx.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); ctx.fill(); ctx.stroke(); ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    return;
  }

  if (el.type === 'enemy-walker' || el.type === 'enemy-charger') {
    const c = toCanvas(el.x, el.y);
    const w = Math.max(6, 28 * zoom), h = Math.max(6, 44 * zoom);
    ctx.beginPath(); ctx.rect(c.x - w / 2, c.y - h / 2, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `${Math.max(9, 11 * zoom)}px monospace`; ctx.textAlign = 'center';
    ctx.fillText(`HP:${el.hp}`, c.x, c.y + h / 2 + Math.max(10, 12 * zoom));
    // Zone de patrouille : ligne + bornes min/max marquées (◄ ►)
    if (el.minX != null && el.maxX != null) {
      const mn = toCanvas(el.minX, el.y), mx = toCanvas(el.maxX, el.y);
      const yy = mn.y + h / 2 + 4;
      ctx.strokeStyle = col.stroke; ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(mn.x, yy); ctx.lineTo(mx.x, yy); ctx.stroke(); ctx.setLineDash([]);
      // bornes verticales
      ctx.beginPath(); ctx.moveTo(mn.x, yy - 8); ctx.lineTo(mn.x, yy + 8);
      ctx.moveTo(mx.x, yy - 8); ctx.lineTo(mx.x, yy + 8); ctx.stroke();
      ctx.fillStyle = col.stroke; ctx.font = '11px monospace';
      ctx.fillText('◄ min', mn.x, yy + 20); ctx.fillText('max ►', mx.x, yy + 20);
    }
    ctx.textAlign = 'start';
    return;
  }

  // Ground / platform / landmark
  const a = toCanvas(el.x, el.y);
  const w = el.width * zoom, h = 28 * zoom;
  ctx.beginPath(); ctx.rect(a.x, a.y, w, h); ctx.fill(); ctx.stroke();
  if (el.label) {
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(10, 13 * zoom)}px monospace`; ctx.textAlign = 'center';
    ctx.fillText(el.label, a.x + w / 2, a.y - 4); ctx.textAlign = 'start';
  }
}

function drawFlag(pos, color, label) {
  const c = toCanvas(pos.x, pos.y);
  const hp = 40 * zoom;
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, c.y - hp); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(c.x, c.y - hp); ctx.lineTo(c.x + 22 * zoom, c.y - hp + 8 * zoom); ctx.lineTo(c.x, c.y - hp + 16 * zoom); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; ctx.font = `bold ${Math.max(9, 11*zoom)}px monospace`; ctx.textAlign = 'center';
  ctx.fillText(label, c.x, c.y + 14); ctx.textAlign = 'start';
}

function drawCheckered(pos) {
  const c = toCanvas(pos.x, pos.y);
  const hp = 40 * zoom, cell = 6 * zoom;
  ctx.strokeStyle = '#eee'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, c.y - hp); ctx.stroke();
  for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++) {
    ctx.fillStyle = (r + col) % 2 ? '#fff' : '#222';
    ctx.fillRect(c.x + col * cell, c.y - hp + r * cell, cell, cell);
  }
  ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(9, 11*zoom)}px monospace`; ctx.textAlign = 'center';
  ctx.fillText('ARRIVÉE', c.x, c.y + 14); ctx.textAlign = 'start';
}

function drawCurveDraft() {
  const pts = curveDraft;
  if (!pts.length) return;
  const col = COLORS[curveKind] ?? COLORS.curve;
  ctx.strokeStyle = col.stroke; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
  if (curveKind === 'island' && pts.length >= 3) {
    const sp = smoothClosedCurve(pts, 8);
    ctx.beginPath(); const c0 = toCanvas(sp[0].x, sp[0].y); ctx.moveTo(c0.x, c0.y);
    for (let i = 1; i < sp.length; i++) { const c = toCanvas(sp[i].x, sp[i].y); ctx.lineTo(c.x, c.y); }
    ctx.closePath(); ctx.stroke();
  } else {
    ctx.beginPath(); smoothPath(pts.length >= 2 ? pts : [pts[0], pts[0]]); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  pts.forEach(p => { const c = toCanvas(p.x, p.y); ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill(); });
}

function drawDragPreview() {
  const { x0, y0, x1, y1 } = dragState;
  const col = COLORS[currentTool] ?? COLORS.platform;
  ctx.fillStyle = col.fill + '66'; ctx.strokeStyle = col.stroke; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
  if (currentTool === 'slope') {
    const a = toCanvas(x0, y0), b = toCanvas(x1, y1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 20 * zoom); ctx.lineTo(a.x, a.y + 20 * zoom); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (currentTool === 'coin' || currentTool === 'crystal') {
    const c = toCanvas(x1, y1); const r = Math.max(4, 12 * zoom);
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    const a = toCanvas(x0, y0); const w = (x1 - x0) * zoom;
    ctx.beginPath(); ctx.rect(a.x, a.y, w, 28 * zoom); ctx.fill(); ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawReference() {
  // Affiche un repère de joueur + ellipses de portée de saut, draggable.
  // Distances calculées d'après la physique du jeu :
  // - JUMP_VELOCITY = 13, DOUBLE_JUMP_VELOCITY = 11, GRAVITY = 1.3
  // - Rayon horizontal (distance parcourue) ≠ rayon vertical (hauteur atteinte)
  const c = toCanvas(referencePos.x, referencePos.y);
  const playerW = 22 * zoom, playerH = 36 * zoom;

  // Silhouette joueur
  ctx.fillStyle = '#ff9933aa'; ctx.strokeStyle = '#ffcc66';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.rect(c.x - playerW/2, c.y - playerH/2, playerW, playerH);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffcc66'; ctx.font = `bold ${Math.max(8, 9*zoom)}px monospace`;
  ctx.textAlign = 'center'; ctx.fillText('J', c.x, c.y + playerH/2 + 8);

  // Ellipses de saut : rayon horizontal (distance) et vertical (hauteur atteinte)
  // Mesurés sur un niveau de test avec plateformes en quinconce
  // 1S: 400px horiz, 220px vert | 2S: 700px horiz, 380px vert | 3S: 950px horiz, 520px vert
  const jumpData = [
    { horiz: 400, vert: 220 },
    { horiz: 700, vert: 380 },
    { horiz: 950, vert: 520 }
  ];
  ctx.strokeStyle = '#ffff6666'; ctx.lineWidth = 1; ctx.setLineDash([3, 2]);

  jumpData.forEach((data, i) => {
    const radiusX = data.horiz * zoom;
    const radiusY = data.vert * zoom;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `${Math.max(8, 9*zoom)}px monospace`;
    ctx.textAlign = 'left'; ctx.fillText(`${i+1}S`, c.x + radiusX + 4, c.y - 4);
  });
  ctx.setLineDash([]);
}

// ── Souris ───────────────────────────────────────────────────────────────
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (curveDraft) { curveDraft = null; render(); return; }
  const w = toWorld(e.offsetX, e.offsetY);
  const hit = hitTest(w.x, w.y);
  if (hit >= 0) { elements.splice(hit, 1); selectedIdx = -1; refreshUI(); }
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    panState = { startX: e.clientX, startY: e.clientY, ox: offsetX, oy: offsetY };
    return;
  }
  if (e.button !== 0) return;
  const w = toWorld(e.offsetX, e.offsetY);
  const sx = snapV(w.x), sy = snapV(w.y);

  if (currentTool === 'curve' || currentTool === 'island') {
    // e.detail === 2 = deuxième clic du double-clic (finalization, ne pas ajouter de point)
    if (e.detail < 2) {
      curveKind = currentTool; (curveDraft ??= []).push({ x: sx, y: sy }); render();
    }
    return;
  }
  if (currentTool === 'start')  { levelStart = { x: sx, y: sy }; refreshUI(); return; }
  if (currentTool === 'finish') { levelFinish = { x: sx, y: sy }; refreshUI(); return; }
  // Drag référence si visible
  if (showReference && Math.hypot(w.x - referencePos.x, w.y - referencePos.y) < 40) {
    draggingReference = true;
    moveState = { kind: 'ref', sx0: w.x, sy0: w.y, orig: { ...referencePos } };
    return;
  }

  if (currentTool === 'select') {
    // Glisser-déposer : drapeaux d'abord, puis éléments.
    if (levelFinish && Math.hypot(w.x - levelFinish.x, w.y - levelFinish.y) < 50) {
      moveState = { kind: 'finish', sx0: w.x, sy0: w.y, orig: { ...levelFinish } }; return;
    }
    if (Math.hypot(w.x - levelStart.x, w.y - levelStart.y) < 50) {
      moveState = { kind: 'start', sx0: w.x, sy0: w.y, orig: { ...levelStart } }; return;
    }
    selectedIdx = hitTest(w.x, w.y);
    if (selectedIdx >= 0) moveState = { kind: 'el', sx0: w.x, sy0: w.y, orig: structuredClone(elements[selectedIdx]) };
    refreshUI(); return;
  }

  dragState = { phase: 'start', x0: sx, y0: sy, x1: sx, y1: sy };
});

canvas.addEventListener('mousemove', e => {
  const w = toWorld(e.offsetX, e.offsetY);
  document.getElementById('status-pos').textContent = `x: ${w.x}  y: ${w.y}`;
  if (panState) { offsetX = panState.ox + (e.clientX - panState.startX); offsetY = panState.oy + (e.clientY - panState.startY); render(); return; }
  if (moveState) {
    const dx = snapV(w.x - moveState.sx0), dy = snapV(w.y - moveState.sy0);
    if (moveState.kind === 'ref') {
      referencePos = { x: moveState.orig.x + dx, y: moveState.orig.y + dy };
    } else if (moveState.kind === 'el') {
      elements[selectedIdx] = applyDelta(structuredClone(moveState.orig), dx, dy);
    } else if (moveState.kind === 'start') {
      levelStart = { x: moveState.orig.x + dx, y: moveState.orig.y + dy };
    } else if (moveState.kind === 'finish') {
      levelFinish = { x: moveState.orig.x + dx, y: moveState.orig.y + dy };
    }
    render(); if (moveState.kind !== 'ref') refreshJsonPreview(); return;
  }
  if (dragState) { dragState.phase = 'drag'; dragState.x1 = snapV(w.x); dragState.y1 = snapV(w.y); render(); return; }
  if (curveDraft) render();
});

canvas.addEventListener('mouseup', e => {
  if (panState) { panState = null; return; }
  if (moveState) {
    draggingReference = false;
    moveState = null;
    if (!showReference) refreshUI(); else render();
    return;
  }
  if (!dragState) return;
  const { x0, y0, x1, y1 } = dragState;
  dragState = null;

  if (currentTool === 'slope') {
    elements.push({ type: 'slope', x1: Math.min(x0, x1), y1: x0 < x1 ? y0 : y1, x2: Math.max(x0, x1), y2: x0 < x1 ? y1 : y0 });
  } else if (currentTool === 'coin' || currentTool === 'crystal') {
    elements.push({ type: currentTool, x: x1, y: y1 });
  } else if (currentTool === 'enemy-walker' || currentTool === 'enemy-charger') {
    const behavior = currentTool === 'enemy-charger' ? 'charger' : 'walker';
    let lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    if (hi - lo < 80) { lo = x0 - 150; hi = x0 + 150; } // zone par défaut si pas de glissé
    elements.push({ type: currentTool, x: Math.round((lo + hi) / 2), y: y0, platformTop: y0, minX: lo, maxX: hi, hp: 1, behavior });
  } else if (currentTool === 'ground' || currentTool === 'platform' || currentTool === 'landmark') {
    const w = Math.abs(x1 - x0);
    if (w < snap) { render(); return; }
    const el = { type: currentTool, x: Math.min(x0, x1), y: y0, width: w };
    if (currentTool === 'landmark') el.label = 'Repère';
    elements.push(el);
  }
  selectedIdx = elements.length - 1;
  refreshUI();
});

canvas.addEventListener('dblclick', () => { finalizeCurve(); });

window.addEventListener('keydown', e => {
  if (e.key === 'Enter') finalizeCurve();
  else if (e.key === 'Escape') { if (curveDraft) { curveDraft = null; render(); } else { selectedIdx = -1; refreshUI(); } }
});

function finalizeCurve() {
  const min = curveKind === 'island' ? 3 : 2;
  if (curveDraft && curveDraft.length >= min) {
    elements.push({ type: curveKind, points: curveDraft });
    selectedIdx = elements.length - 1;
  }
  curveDraft = null;
  refreshUI();
}

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const wx = (e.offsetX - offsetX) / zoom, wy = (e.offsetY - offsetY) / zoom;
  zoom = Math.min(2, Math.max(0.05, zoom * factor));
  offsetX = e.offsetX - wx * zoom; offsetY = e.offsetY - wy * zoom;
  document.getElementById('zoom').value = Math.min(2, zoom);
  document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
  render();
}, { passive: false });

// ── Hit-test ───────────────────────────────────────────────────────────────
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const len2 = dx*dx + dy*dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t*dx - px, ay + t*dy - py);
}
function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function hitTest(wx, wy) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.type === 'island') {
      if (pointInPoly(wx, wy, el.points)) return i;
      for (let k = 0; k < el.points.length; k++) {
        const a = el.points[k], b = el.points[(k + 1) % el.points.length];
        if (distToSeg(wx, wy, a.x, a.y, b.x, b.y) < 16) return i;
      }
    } else if (el.type === 'curve') {
      for (let k = 0; k < el.points.length - 1; k++) {
        if (distToSeg(wx, wy, el.points[k].x, el.points[k].y, el.points[k+1].x, el.points[k+1].y) < 16) return i;
      }
    } else if (el.type === 'slope') {
      if (distToSeg(wx, wy, el.x1, el.y1, el.x2, el.y2) < 20) return i;
    } else if (el.type === 'coin' || el.type === 'crystal') {
      if (Math.hypot(wx - el.x, wy - el.y) < 16) return i;
    } else if (el.type === 'enemy-walker' || el.type === 'enemy-charger') {
      if (Math.abs(wx - el.x) < 18 && Math.abs(wy - el.y) < 28) return i;
    } else {
      if (wx >= el.x && wx <= el.x + el.width && wy >= el.y && wy <= el.y + 30) return i;
    }
  }
  return -1;
}

// ── Inspecteur ───────────────────────────────────────────────────────────
function refreshUI() { refreshInspector(); refreshLevelList(); refreshJsonPreview(); updateStatusCount(); render(); }

function refreshInspector() {
  const cont = document.getElementById('inspector-content');
  if (selectedIdx < 0 || selectedIdx >= elements.length) {
    cont.innerHTML = '<p class="hint">Outil Sélection : <b>glisser</b> pour déplacer un élément (ou les drapeaux Début/Arrivée).<br/><br/>Courbe : clique des points, Entrée/double-clic pour finir.<br/><br/>Clic droit : supprimer.</p>';
    return;
  }
  const el = elements[selectedIdx];
  if (el.type === 'curve' || el.type === 'island') {
    const min = el.type === 'island' ? 3 : 2;
    const nom = el.type === 'island' ? 'Île suspendue' : 'Pente douce';
    cont.innerHTML = `<p class="hint">${nom} — ${el.points.length} points.</p>
      <button id="del-last-pt" class="action-btn">Supprimer dernier point</button>`;
    document.getElementById('del-last-pt').addEventListener('click', () => {
      if (el.points.length > min) { el.points.pop(); refreshUI(); }
      else { elements.splice(selectedIdx, 1); selectedIdx = -1; refreshUI(); }
    });
    return;
  }
  const fields = getInspectorFields(el);
  cont.innerHTML = fields.map(f => `
    <div class="prop-row"><label>${f.label}</label>
      <input type="${f.type ?? 'number'}" data-key="${f.key}" value="${f.value ?? ''}" /></div>`).join('');
  cont.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      const v = inp.type === 'number' ? Number(inp.value) : inp.value;
      elements[selectedIdx][inp.dataset.key] = v; render(); refreshJsonPreview();
    });
  });
}

function getInspectorFields(el) {
  if (el.type === 'slope') return [['x1','x1'],['y1','y1'],['x2','x2'],['y2','y2']].map(([l,k]) => ({label:l,key:k,value:el[k]}));
  if (el.type === 'coin' || el.type === 'crystal') return [['x','x'],['y','y']].map(([l,k]) => ({label:l,key:k,value:el[k]}));
  if (el.type === 'enemy-walker' || el.type === 'enemy-charger')
    return [['x (centre)','x'],['platformTop','platformTop'],['minX','minX'],['maxX','maxX'],['HP','hp']].map(([l,k]) => ({label:l,key:k,value:el[k]}));
  const base = [['x','x'],['y','y'],['largeur','width']].map(([l,k]) => ({label:l,key:k,value:el[k]}));
  if (el.type === 'landmark') base.push({ label: 'label', key: 'label', value: el.label ?? '', type: 'text' });
  return base;
}

// ── Niveaux sauvegardés ────────────────────────────────────────────────────
function getSavedLevels() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; } }
function setSavedLevels(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

function refreshLevelList() {
  const list = document.getElementById('level-list');
  const levels = getSavedLevels();
  if (!levels.length) { list.innerHTML = '<p class="hint" style="padding:4px 6px">Aucun niveau. Clique « Sauvegarder ».</p>'; return; }
  list.innerHTML = levels.map((l, i) => `
    <div class="level-item" data-idx="${i}">
      <span class="lvl-name">${l.name}</span>
      <span class="lvl-del" data-del="${i}" title="Supprimer">✕</span>
    </div>`).join('');
  list.querySelectorAll('.level-item').forEach(item => {
    item.addEventListener('click', ev => { if (ev.target.dataset.del !== undefined) return; loadCustomLevel(Number(item.dataset.idx)); });
  });
  list.querySelectorAll('.lvl-del').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const arr = getSavedLevels(); arr.splice(Number(btn.dataset.del), 1); setSavedLevels(arr); refreshLevelList();
    });
  });
}

function loadData(d, name) {
  levelName = name ?? d.id ?? 'Niveau';
  worldW = d.world?.width ?? 4000;
  worldH = d.world?.height ?? 2200;
  levelStart  = d.start ?? { x: 120, y: worldH - 300 };
  levelFinish = d.finish ?? null;
  elements = [];
  for (const t of d.terrain ?? []) elements.push({ ...t });
  // NB : on étale d'abord puis on force "type" — sinon e.type ('walker') écraserait
  // le type éditeur ('enemy-walker') et l'ennemi devenait invisible au rechargement.
  // On force aussi "y" (le JSON ne stocke que platformTop) sinon le rendu est à NaN.
  for (const e of d.enemies ?? []) elements.push({
    ...e,
    type: e.type === 'charger' ? 'enemy-charger' : 'enemy-walker',
    behavior: e.type,
    y: e.y ?? e.platformTop,
  });
  for (const c of d.coins   ?? []) elements.push({ ...c, type: 'coin' });
  for (const c of d.crystals?? []) elements.push({ ...c, type: 'crystal' });
  document.getElementById('world-w').value = worldW;
  document.getElementById('world-h').value = worldH;
  selectedIdx = -1; curveDraft = null;
  frameView();   // recadre pour voir tout le niveau chargé (ennemis compris)
  refreshUI();
}

function loadCustomLevel(idx) {
  const entry = getSavedLevels()[idx];
  if (entry) { loadData(entry.data, entry.name); toast(`Chargé : ${entry.name}`); }
}

// ── Sérialisation ──────────────────────────────────────────────────────────
function buildLevelData() {
  const terrainTypes = ['ground', 'platform', 'slope', 'curve', 'island', 'landmark', 'wall'];
  const terrain = elements.filter(e => terrainTypes.includes(e.type));
  const enemies = elements.filter(e => e.type === 'enemy-walker' || e.type === 'enemy-charger').map(e => ({
    x: e.x, platformTop: e.platformTop ?? e.y, minX: e.minX, maxX: e.maxX,
    hp: e.hp ?? 1, type: e.type === 'enemy-charger' ? 'charger' : 'walker',
  }));
  const coins    = elements.filter(e => e.type === 'coin').map(({ x, y }) => ({ x, y }));
  const crystals = elements.filter(e => e.type === 'crystal').map(({ x, y }) => ({ x, y }));

  const data = {
    id: levelName.replace(/\s+/g, '_').toLowerCase(),
    world: { width: worldW, height: worldH },
    start: levelStart,
    hubPortal: { x: Math.max(60, levelStart.x - 40), y: levelStart.y, radius: 140 },
    camera: { zoom: 1, wide: worldH > 3000 ? 0.6 : 0.8 },
    terrain, enemies, coins, crystals,
  };
  if (levelFinish) data.finish = levelFinish;
  return data;
}

function refreshJsonPreview() { document.getElementById('json-preview').value = JSON.stringify(buildLevelData(), null, 2); }
function updateStatusCount() {
  const n = elements.length;
  document.getElementById('status-count').textContent = `${n} élément${n !== 1 ? 's' : ''}` + (levelFinish ? ' · arrivée définie' : ' · pas d’arrivée');
}

function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:#5533aa;color:#fff;padding:8px 16px;border-radius:6px;z-index:99;font-family:monospace;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

// ── Boutons ──────────────────────────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click', () => {
  if (elements.length && !confirm('Effacer le niveau courant ?')) return;
  elements = []; levelFinish = null; selectedIdx = -1; curveDraft = null;
  levelName = prompt('Nom du nouveau niveau', 'Nouveau niveau') ?? 'Nouveau niveau';
  refreshUI();
});

document.getElementById('btn-save').addEventListener('click', () => {
  const name = prompt('Nom du niveau', levelName) ?? levelName; levelName = name;
  const levels = getSavedLevels();
  const idx = levels.findIndex(l => l.name === name);
  const entry = { name, createdAt: Date.now(), data: buildLevelData() };
  if (idx >= 0) levels[idx] = entry; else levels.push(entry);
  setSavedLevels(levels); refreshLevelList(); toast(`Niveau « ${name} » sauvegardé`);
});

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(buildLevelData(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (levelName.replace(/\s+/g, '_').toLowerCase() || 'level') + '.json';
  a.click();
});

document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', ev => {
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { loadData(JSON.parse(reader.result), file.name.replace(/\.json$/, '')); toast('Importé'); }
    catch { alert('Fichier JSON invalide.'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
});

document.getElementById('btn-reference').addEventListener('click', () => {
  showReference = !showReference;
  document.getElementById('btn-reference').textContent = showReference ? '📏 Masquer repères' : '📏 Afficher repères';
  render();
});

// ── Outils & vue ───────────────────────────────────────────────────────────
document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
    if (currentTool !== 'curve' && currentTool !== 'island') { curveDraft = null; }
    document.getElementById('status-tool').textContent = 'Outil : ' + (TOOL_LABELS[currentTool] ?? currentTool);
    canvas.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
    render();
  });
});

document.getElementById('world-w').addEventListener('input', e => { worldW = Math.max(500, Number(e.target.value) || 500); render(); refreshJsonPreview(); });
document.getElementById('world-h').addEventListener('input', e => { worldH = Math.max(500, Number(e.target.value) || 500); render(); refreshJsonPreview(); });
document.getElementById('snap').addEventListener('input', e => { snap = Math.max(1, Number(e.target.value)); render(); });
document.getElementById('zoom').addEventListener('input', e => {
  zoom = Number(e.target.value);
  document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%'; render();
});

// ── Démarrage ──────────────────────────────────────────────────────────────
resizeCanvas();
refreshUI();
