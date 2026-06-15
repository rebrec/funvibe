// Lissage de courbe (spline Catmull-Rom) — pur, sans dépendance Phaser.
// Sert aux pentes douces "type Sonic" : on passe des points de contrôle et on
// obtient une polyligne lissée passant par ces points.

function _catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

// Renvoie une polyligne lissée. Pour N points de contrôle et `segPerSpan`
// segments par intervalle : (N-1)*segPerSpan + 1 points en sortie.
export function smoothCurve(points, segPerSpan = 8) {
  if (!points || points.length < 2) return (points ?? []).map((p) => ({ x: p.x, y: p.y }));
  const pts = points.map((p) => ({ x: p.x, y: p.y }));
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    for (let s = 0; s < segPerSpan; s++) {
      out.push(_catmull(p0, p1, p2, p3, s / segPerSpan));
    }
  }
  out.push({ x: pts[n - 1].x, y: pts[n - 1].y });
  return out;
}

// Boucle fermée lissée (île suspendue) : la courbe se referme sur elle-même.
// Pour N points de contrôle : N*segPerSpan + 1 points (le dernier = le premier).
export function smoothClosedCurve(points, segPerSpan = 8) {
  const n = points?.length ?? 0;
  if (n < 3) return smoothCurve(points, segPerSpan);
  const pts = points.map((p) => ({ x: p.x, y: p.y }));
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let s = 0; s < segPerSpan; s++) {
      out.push(_catmull(p0, p1, p2, p3, s / segPerSpan));
    }
  }
  out.push({ x: out[0].x, y: out[0].y }); // referme la boucle
  return out;
}
