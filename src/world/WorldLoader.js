// WorldLoader — construit les éléments d'un niveau à partir d'un objet de données JSON.
// Chaque scene utilisatrice doit exposer : addGroundSection, addPlatform, addSlope,
// addEnemy, addCoin, addCrystal. Les éléments propres à la scene (décors, portails...)
// restent dans la scène.

// Deux points sont « la même jonction » s'ils sont à moins de EPS px.
const JOIN_EPS = 3;
function _same(a, b) {
  return Math.abs(a.x - b.x) <= JOIN_EPS && Math.abs(a.y - b.y) <= JOIN_EPS;
}

// Fusionne les pentes douces qui se prolongent (fin de l'une = début de l'autre)
// en une seule liste de points : Catmull-Rom devient continu à la jonction →
// plus de rupture de tangente ni de "mur invisible" entre deux curves chaînées.
function _mergeCurves(terrain) {
  const curves = terrain.filter((t) => t.type === 'curve' && t.points?.length >= 2);
  const others = terrain.filter((t) => !(t.type === 'curve' && t.points?.length >= 2));
  const chains = curves.map((c) => c.points.map((p) => ({ x: p.x, y: p.y })));

  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < chains.length && !merged; i++) {
      for (let j = 0; j < chains.length; j++) {
        if (i === j) continue;
        const a = chains[i], b = chains[j];
        if (_same(a[a.length - 1], b[0])) {
          // a se prolonge par b → on accole (on évite de dupliquer le point partagé)
          chains[i] = a.concat(b.slice(1));
          chains.splice(j, 1);
          merged = true;
          break;
        }
      }
    }
  }
  return { curves: chains, others };
}

export default class WorldLoader {
  static build(scene, data, theme) {
    const { curves, others } = _mergeCurves(data.terrain ?? []);
    for (const pts of curves) scene.addCurve(pts);
    for (const t of others) {
      if (t.type === 'ground')    { scene.addGroundSection(t.x, t.y, t.width); }
      else if (t.type === 'platform') { scene.addPlatform(t.x, t.y, t.width, theme.platColor, true); }
      else if (t.type === 'wall')     { scene.addPlatform(t.x, t.y, t.width, theme.platColor, false); }
      else if (t.type === 'slope')    { scene.addSlope(t.x1, t.y1, t.x2, t.y2); }
      else if (t.type === 'island')   { scene.addIsland(t.points); }
      else if (t.type === 'landmark') {
        scene.addPlatform(t.x, t.y, t.width, 0xc06be0, true);
        if (t.label) {
          scene.add.text(t.x + t.width / 2, t.y - 8, t.label, {
            fontFamily: 'monospace', fontSize: '22px', color: '#3a1050', fontStyle: 'bold',
          }).setOrigin(0.5, 1);
        }
      }
    }
    for (const e of data.enemies  ?? []) scene.addEnemy(e.x, e.platformTop, e.minX, e.maxX, { hp: e.hp, behavior: e.type });
    for (const c of data.coins    ?? []) scene.addCoin(c.x, c.y);
    for (const c of data.crystals ?? []) scene.addCrystal(c.x, c.y);
    return data;
  }
}
