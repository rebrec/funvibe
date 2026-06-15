// WeaponVisual — affiche le visuel d'attaque du joueur.
// Extensible : 'fist' maintenant, 'katana' / 'spear' / 'boomerang'... plus tard.
// Chaque fonction reçoit la scène, la position du joueur et la direction (1=droite, -1=gauche).

export function showAttack(scene, x, y, facing, type = 'fist') {
  if (type === 'fist')   return _showFist(scene, x, y, facing);
  if (type === 'katana') return _showKatana(scene, x, y, facing);
  return _showFist(scene, x, y, facing); // fallback
}

function _showFist(scene, x, y, facing) {
  // Tout est dessiné vers la droite puis retourné via scaleX = facing.
  const g = scene.add.graphics().setDepth(6);

  // Lignes de mouvement (derrière le poing, vers le corps)
  g.lineStyle(2, 0xffffff, 0.45);
  for (let i = -1; i <= 1; i++) g.lineBetween(-26, i * 6, -8, i * 6);

  // Avant-bras (manche) puis poignet
  g.lineStyle(8, 0x2a2a4a, 1);
  g.lineBetween(-24, 0, -6, 0);
  g.lineStyle(7, 0xe0b080, 1); // peau
  g.lineBetween(-10, 0, 2, 0);

  // Poing (carré arrondi) + jointures dessinées de face
  g.fillStyle(0xf0c890, 1);
  g.fillRoundedRect(0, -8, 14, 16, 4);
  g.fillStyle(0xc89868, 1);
  for (let k = -1; k <= 1; k++) g.fillRect(11, -6 + (k + 1) * 5, 3, 3);
  g.lineStyle(1.5, 0x8a5a20, 0.7);
  g.strokeRoundedRect(0, -8, 14, 16, 4);

  g.setPosition(x + facing * 16, y + 2);
  g.setScale(facing, 1);

  // Jab rapide : le poing s'avance puis disparaît (pas de "boule" qui grossit).
  scene.tweens.add({
    targets: g,
    x: x + facing * 34,
    alpha: { from: 1, to: 0 },
    duration: 130,
    ease: 'Quad.easeOut',
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
