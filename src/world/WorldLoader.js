// WorldLoader — construit les éléments d'un niveau à partir d'un objet de données JSON.
// Chaque scene utilisatrice doit exposer : addGroundSection, addPlatform, addSlope,
// addEnemy, addCoin, addCrystal. Les éléments propres à la scene (décors, portails...)
// restent dans la scène.

export default class WorldLoader {
  static build(scene, data, theme) {
    for (const t of data.terrain ?? []) {
      if (t.type === 'ground')    { scene.addGroundSection(t.x, t.y, t.width); }
      else if (t.type === 'platform') { scene.addPlatform(t.x, t.y, t.width, theme.platColor, true); }
      else if (t.type === 'wall')     { scene.addPlatform(t.x, t.y, t.width, theme.platColor, false); }
      else if (t.type === 'slope')    { scene.addSlope(t.x1, t.y1, t.x2, t.y2); }
      else if (t.type === 'curve')    { scene.addCurve(t.points); }
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
