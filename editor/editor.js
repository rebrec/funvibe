// Éditeur de niveaux jeuleo — vanilla JS + Canvas 2D.
// Communication jeu ↔ éditeur via localStorage (clé "customLevels").

const STORAGE_KEY = 'customLevels';

// ── État global ────────────────────────────────────────────────────────────
let zoom = 0.5;
let snap = 20;
let currentTool = 'ground';
let selectedIdx = -1;     // index dans elements[]
let dragState = null;     // { phase:'start'|'drag'|'done', x0,y0,x1,y1 }
let panState  = null;     // { startX, startY, ox, oy }
let offsetX = 40, offsetY = 40; // décalage de vue (pan)

// Données du niveau courant
let levelName = 'Nouveau niveau';
let elements  = []; // tableau d'objets { type, ... }

// ── Canvas & contexte ──────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  render();
}
window.addEventListener('resize', resizeCanvas);

// ── Couleurs par type ──────────────────────────────────────────────────────
const COLORS = {
  ground:         { fill: '#4a7a40', stroke: '#88cc66' },
  platform:       { fill: '#6655bb', stroke: '#9977ff' },
  slope:          { fill: '#887744', stroke: '#ccaa66' },
  landmark:       { fill: '#9944bb', stroke: '#dd88ff' },
  'enemy-walker': { fill: '#cc4444', stroke: '#ff8888' },
  'enemy-charger':{ fill: '#993311', stroke: '#ff6633' },
  coin:           { fill: '#ddbb22', stroke: '#ffee44' },
  crystal:        { fill: '#22bbdd', stroke: '#88eeff' },
};

// ── Conversion coordonnées ─────────────────────────────────────────────────
function toWorld(cx, cy) {
  return { x: Math.round((cx - offsetX) / zoom), y: Math.round((cy - offsetY) / zoom) };
}
function toCanvas(wx, wy) {
  return { x: wx * zoom + offsetX, y: wy * zoom + offsetY };
}
function snapV(v) {
  return Math.round(v / snap) * snap;
}

// ── Dessin ─────────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grille
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  const gStep = snap * zoom;
  for (let x = offsetX % gStep; x < canvas.width; x += gStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = offsetY % gStep; y < canvas.height; y += gStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Axe X=0, Y=0
  const o = toCanvas(0, 0);
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, canvas.height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(canvas.width, o.y); ctx.stroke();

  // Éléments
  elements.forEach((el, i) => drawElement(el, i === selectedIdx));

  // Aperçu du drag en cours
  if (dragState && dragState.phase === 'drag') {
    drawDragPreview();
  }
}

function drawElement(el, selected) {
  const col = COLORS[el.type] ?? COLORS.platform;
  ctx.fillStyle   = col.fill + (selected ? 'dd' : '99');
  ctx.strokeStyle = selected ? '#ffffff' : col.stroke;
  ctx.lineWidth   = selected ? 2 : 1;

  if (el.type === 'slope') {
    const a = toCanvas(el.x1, el.y1);
    const b = toCanvas(el.x2, el.y2);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 20 * zoom);
    ctx.lineTo(a.x, a.y + 20 * zoom);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    return;
  }

  if (el.type === 'coin' || el.type === 'crystal') {
    const c = toCanvas(el.x, el.y);
    const r = Math.max(4, 12 * zoom);
    if (el.type === 'crystal') {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    return;
  }

  if (el.type === 'enemy-walker' || el.type === 'enemy-charger') {
    const c = toCanvas(el.x, el.y);
    const w = Math.max(6, 28 * zoom);
    const h = Math.max(6, 44 * zoom);
    ctx.beginPath();
    ctx.rect(c.x - w / 2, c.y - h / 2, w, h);
    ctx.fill(); ctx.stroke();
    // Indicateur HP
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(9, 11 * zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`HP:${el.hp}`, c.x, c.y + h / 2 + Math.max(10, 12 * zoom));
    return;
  }

  // Ground / platform / landmark
  const a = toCanvas(el.x, el.y);
  const w = el.width * zoom;
  const h = 28 * zoom;
  ctx.beginPath();
  ctx.rect(a.x, a.y, w, h);
  ctx.fill(); ctx.stroke();

  if (el.label) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(10, 13 * zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(el.label, a.x + w / 2, a.y - 4);
  }
}

function drawDragPreview() {
  const { x0, y0, x1, y1 } = dragState;
  const col = COLORS[currentTool] ?? COLORS.platform;
  ctx.fillStyle   = col.fill + '66';
  ctx.strokeStyle = col.stroke;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([5, 3]);

  if (currentTool === 'slope') {
    const a = toCanvas(x0, y0);
    const b = toCanvas(x1, y1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 20 * zoom); ctx.lineTo(a.x, a.y + 20 * zoom);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (currentTool === 'coin' || currentTool === 'crystal') {
    const c = toCanvas(x1, y1);
    const r = Math.max(4, 12 * zoom);
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  } else {
    const a = toCanvas(x0, y0);
    const w = (x1 - x0) * zoom;
    ctx.beginPath(); ctx.rect(a.x, a.y, w, 28 * zoom);
    ctx.fill(); ctx.stroke();
  }
  ctx.setLineDash([]);
}

// ── Interactions souris ────────────────────────────────────────────────────
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const w = toWorld(e.offsetX, e.offsetY);
  const hit = hitTest(w.x, w.y);
  if (hit >= 0) { elements.splice(hit, 1); selectedIdx = -1; refreshUI(); }
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    // Pan (molette ou alt+clic)
    panState = { startX: e.clientX, startY: e.clientY, ox: offsetX, oy: offsetY };
    return;
  }
  if (e.button !== 0) return;

  const w = toWorld(e.offsetX, e.offsetY);
  const sx = snapV(w.x), sy = snapV(w.y);

  if (currentTool === 'select') {
    selectedIdx = hitTest(w.x, w.y);
    refreshUI();
    return;
  }

  dragState = { phase: 'start', x0: sx, y0: sy, x1: sx, y1: sy };
});

canvas.addEventListener('mousemove', e => {
  const w = toWorld(e.offsetX, e.offsetY);
  document.getElementById('status-pos').textContent = `x: ${w.x}  y: ${w.y}`;

  if (panState) {
    offsetX = panState.ox + (e.clientX - panState.startX);
    offsetY = panState.oy + (e.clientY - panState.startY);
    render(); return;
  }

  if (!dragState) return;
  dragState.phase = 'drag';
  dragState.x1 = snapV(w.x);
  dragState.y1 = snapV(w.y);
  render();
});

canvas.addEventListener('mouseup', e => {
  if (panState) { panState = null; return; }
  if (!dragState) return;

  const { x0, y0, x1, y1 } = dragState;
  dragState = null;

  if (currentTool === 'slope') {
    elements.push({ type: 'slope', x1: Math.min(x0,x1), y1: x0<x1?y0:y1, x2: Math.max(x0,x1), y2: x0<x1?y1:y0 });
  } else if (currentTool === 'coin' || currentTool === 'crystal') {
    elements.push({ type: currentTool, x: x1, y: y1 });
  } else if (currentTool === 'enemy-walker' || currentTool === 'enemy-charger') {
    const behavior = currentTool === 'enemy-charger' ? 'charger' : 'walker';
    const pw = x1 - x0;
    elements.push({ type: currentTool, x: x0 + pw / 2, y: y0, platformTop: y0, minX: x0, maxX: x0 + pw, hp: 1, behavior });
  } else {
    const w = Math.abs(x1 - x0);
    if (w < snap) { render(); return; }
    const el = { type: currentTool, x: Math.min(x0,x1), y: y0, width: w };
    if (currentTool === 'landmark') el.label = 'Repère';
    elements.push(el);
  }
  selectedIdx = elements.length - 1;
  refreshUI();
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const wx = (e.offsetX - offsetX) / zoom;
  const wy = (e.offsetY - offsetY) / zoom;
  zoom = Math.min(2, Math.max(0.1, zoom * factor));
  offsetX = e.offsetX - wx * zoom;
  offsetY = e.offsetY - wy * zoom;
  document.getElementById('zoom').value = zoom;
  document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
  render();
}, { passive: false });

// ── Hit-test ───────────────────────────────────────────────────────────────
function hitTest(wx, wy) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.type === 'slope') {
      const dx = el.x2 - el.x1, dy = el.y2 - el.y1;
      const len = Math.hypot(dx, dy);
      const t = ((wx - el.x1) * dx + (wy - el.y1) * dy) / (len * len);
      if (t < 0 || t > 1) continue;
      const px = el.x1 + t * dx - wx;
      const py = el.y1 + t * dy - wy;
      if (Math.hypot(px, py) < 20) return i;
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

// ── Inspector ──────────────────────────────────────────────────────────────
function refreshUI() {
  refreshInspector();
  refreshLevelList();
  refreshJsonPreview();
  updateStatusCount();
  render();
}

function refreshInspector() {
  const cont = document.getElementById('inspector-content');
  if (selectedIdx < 0 || selectedIdx >= elements.length) {
    cont.innerHTML = '<p class="hint">Sélectionnez un élément<br/>ou placez-en un.</p>';
    return;
  }
  const el = elements[selectedIdx];
  const fields = getInspectorFields(el);
  cont.innerHTML = fields.map(f => `
    <div class="prop-row">
      <label>${f.label}</label>
      <input type="${f.type ?? 'number'}" data-key="${f.key}" value="${f.value ?? ''}" ${f.extra ?? ''} />
    </div>`).join('');

  cont.querySelectorAll('input, select').forEach(inp => {
    inp.addEventListener('input', () => {
      const key = inp.dataset.key;
      const val = inp.type === 'number' ? Number(inp.value) : inp.value;
      elements[selectedIdx][key] = val;
      render();
      refreshJsonPreview();
    });
  });
}

function getInspectorFields(el) {
  const base = [];
  if (el.type === 'slope') {
    base.push({ label: 'x1', key: 'x1', value: el.x1 },
               { label: 'y1', key: 'y1', value: el.y1 },
               { label: 'x2', key: 'x2', value: el.x2 },
               { label: 'y2', key: 'y2', value: el.y2 });
  } else if (el.type === 'coin' || el.type === 'crystal') {
    base.push({ label: 'x', key: 'x', value: el.x },
               { label: 'y', key: 'y', value: el.y });
  } else if (el.type === 'enemy-walker' || el.type === 'enemy-charger') {
    base.push({ label: 'x (centre)', key: 'x', value: el.x },
               { label: 'platformTop', key: 'platformTop', value: el.platformTop },
               { label: 'minX', key: 'minX', value: el.minX },
               { label: 'maxX', key: 'maxX', value: el.maxX },
               { label: 'HP', key: 'hp', value: el.hp });
  } else {
    base.push({ label: 'x', key: 'x', value: el.x },
               { label: 'y', key: 'y', value: el.y },
               { label: 'largeur', key: 'width', value: el.width });
    if (el.type === 'landmark') base.push({ label: 'label', key: 'label', value: el.label ?? '', type: 'text' });
  }
  return base;
}

// ── Liste des niveaux sauvegardés ──────────────────────────────────────────
function getSavedLevels() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function setSavedLevels(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function refreshLevelList() {
  const list = document.getElementById('level-list');
  const levels = getSavedLevels();
  if (!levels.length) { list.innerHTML = '<p class="hint" style="padding:4px 6px">Aucun niveau sauvegardé.</p>'; return; }
  list.innerHTML = levels.map((l, i) => `
    <div class="level-item" data-idx="${i}">
      <span class="lvl-name">${l.name}</span>
      <span class="lvl-del" data-del="${i}" title="Supprimer">✕</span>
    </div>`).join('');

  list.querySelectorAll('.level-item').forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.dataset.del !== undefined) return;
      loadCustomLevel(Number(item.dataset.idx));
    });
  });
  list.querySelectorAll('.lvl-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = Number(btn.dataset.del);
      const levels = getSavedLevels();
      levels.splice(i, 1);
      setSavedLevels(levels);
      refreshLevelList();
    });
  });
}

function loadCustomLevel(idx) {
  const levels = getSavedLevels();
  const entry = levels[idx];
  if (!entry) return;
  levelName = entry.name;
  const d = entry.data;
  elements = [];
  for (const t of d.terrain ?? []) elements.push({ ...t });
  for (const e of d.enemies ?? []) elements.push({ type: e.type === 'charger' ? 'enemy-charger' : 'enemy-walker', ...e });
  for (const c of d.coins   ?? []) elements.push({ type: 'coin',    ...c });
  for (const c of d.crystals?? []) elements.push({ type: 'crystal', ...c });
  selectedIdx = -1;
  refreshUI();
}

// ── Sérialisation vers le format jeu ──────────────────────────────────────
function buildLevelData() {
  const terrain  = elements.filter(e => ['ground','platform','slope','landmark','wall'].includes(e.type));
  const enemies  = elements.filter(e => e.type === 'enemy-walker' || e.type === 'enemy-charger').map(e => ({
    x: e.x, platformTop: e.platformTop ?? e.y, minX: e.minX, maxX: e.maxX,
    hp: e.hp ?? 1, type: e.type === 'enemy-charger' ? 'charger' : 'walker',
  }));
  const coins    = elements.filter(e => e.type === 'coin').map(({ x, y }) => ({ x, y }));
  const crystals = elements.filter(e => e.type === 'crystal').map(({ x, y }) => ({ x, y }));

  const xs = elements.map(e => e.x ?? e.x1 ?? 0).filter(Boolean);
  const worldW = xs.length ? Math.max(...xs) + 800 : 1000;

  return {
    id: levelName.replace(/\s+/g, '_').toLowerCase(),
    world: { width: worldW, height: 2200 },
    start: { x: 120, y: 1720 },
    hubPortal: { x: 100, y: 1750, radius: 140 },
    terrain,
    enemies,
    coins,
    crystals,
  };
}

function refreshJsonPreview() {
  document.getElementById('json-preview').value = JSON.stringify(buildLevelData(), null, 2);
}

function updateStatusCount() {
  const n = elements.length;
  document.getElementById('status-count').textContent = `${n} élément${n !== 1 ? 's' : ''}`;
}

// ── Boutons ────────────────────────────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click', () => {
  if (elements.length && !confirm('Effacer le niveau courant ?')) return;
  elements = []; selectedIdx = -1;
  levelName = prompt('Nom du nouveau niveau', 'Nouveau niveau') ?? 'Nouveau niveau';
  refreshUI();
});

document.getElementById('btn-save').addEventListener('click', () => {
  const name = prompt('Nom du niveau', levelName) ?? levelName;
  levelName = name;
  const levels = getSavedLevels();
  const existing = levels.findIndex(l => l.name === name);
  const entry = { name, createdAt: Date.now(), data: buildLevelData() };
  if (existing >= 0) levels[existing] = entry;
  else levels.push(entry);
  setSavedLevels(levels);
  refreshLevelList();
  alert(`Niveau "${name}" sauvegardé !`);
});

document.getElementById('btn-load').addEventListener('click', () => {
  refreshLevelList(); // met à jour la liste visible
  alert('Cliquez sur un niveau dans la liste "Niveaux sauvegardés".');
});

document.getElementById('btn-export').addEventListener('click', () => {
  const json = JSON.stringify(buildLevelData(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (levelName.replace(/\s+/g, '_').toLowerCase() || 'level') + '.json';
  a.click();
});

// ── Toolbar tools ──────────────────────────────────────────────────────────
document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
    document.getElementById('status-tool').textContent = 'Outil : ' + btn.textContent;
    canvas.style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
  });
});

document.getElementById('snap').addEventListener('input', e => { snap = Math.max(1, Number(e.target.value)); render(); });

document.getElementById('zoom').addEventListener('input', e => {
  zoom = Number(e.target.value);
  document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
  render();
});

// ── Démarrage ──────────────────────────────────────────────────────────────
resizeCanvas();
refreshUI();
