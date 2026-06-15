// WeaponVisual — affiche le visuel d'attaque du joueur.
// Extensible : 'fist' maintenant, 'katana' / 'spear' / 'boomerang'... plus tard.
// Chaque fonction reçoit la scène, la position du joueur et la direction (1=droite, -1=gauche).

export function showAttack(scene, x, y, facing, type = 'fist') {
  if (type === 'fist')   return _showFist(scene, x, y, facing);
  if (type === 'katana') return _showKatana(scene, x, y, facing);
  return _showFist(scene, x, y, facing); // fallback
}

function _showFist(scene, x, y, facing) {
  const g = scene.add.graphics().setDepth(6);
  const ox = x + facing * 34; // point de départ du poing
  const tx = x + facing * 52; // point d'arrivée

  // Corps du poing (cercle chair)
  g.fillStyle(0xf0c070, 1);
  g.fillCircle(0, 0, 13);
  // Jointures (3 petits cercles sur le dessus)
  g.fillStyle(0xc08040, 1);
  [-5, 0, 5].forEach(dx => g.fillCircle(dx, -11, 4));
  // Contour knuckle (ligne d'ombre)
  g.lineStyle(2, 0x8a5a20, 0.8);
  g.strokeCircle(0, 0, 13);

  g.setPosition(ox, y + 4);

  scene.tweens.add({
    targets: g,
    x: tx,
    scaleX: 1.2,
    scaleY: 0.85,
    alpha: { from: 1, to: 0 },
    duration: 150,
    ease: 'Back.easeOut',
    onComplete: () => g.destroy(),
  });
}

function _showKatana(scene, x, y, facing) {
  const g = scene.add.graphics().setDepth(6);
  // Lame (rectangle fin à 45°)
  g.fillStyle(0xe0f0ff, 0.9);
  g.fillRect(-2, -50, 4, 50);
  // Garde (crossguard)
  g.fillStyle(0xd4aa50, 1);
  g.fillRect(-10, -8, 20, 6);
  // Reflet de lame
  g.fillStyle(0xffffff, 0.5);
  g.fillRect(-1, -50, 2, 50);

  const angle = facing > 0 ? -40 : 220; // angle de départ
  g.setPosition(x + facing * 20, y - 10);
  g.setAngle(angle);

  scene.tweens.add({
    targets: g,
    angle: angle + facing * 90, // arc de balayage de 90°
    x: x + facing * 48,
    alpha: { from: 1, to: 0 },
    duration: 160,
    ease: 'Quad.easeOut',
    onComplete: () => g.destroy(),
  });
}
