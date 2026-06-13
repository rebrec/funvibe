import Phaser from 'phaser';
import { PLAYER, ENEMY, PROJECTILE } from '../core/Constants.js';
import SaveManager from '../core/SaveManager.js';

// Génère les textures "placeholder" (formes colorées) puis lance le niveau.
// Aucun asset externe pour la maquette : tout est dessiné par code.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Héros : carré bleu arrondi avec un petit repère (oeil) pour voir l'orientation.
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PLAYER.COLOR, 1);
    g.fillRoundedRect(0, 0, PLAYER.WIDTH, PLAYER.HEIGHT, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(PLAYER.WIDTH - 10, 14, 5); // "oeil" côté droit (sens par défaut)
    g.generateTexture('player', PLAYER.WIDTH, PLAYER.HEIGHT);
    g.destroy();

    // Ennemi : carré rouge arrondi avec des yeux (placeholder).
    const e = this.make.graphics({ x: 0, y: 0, add: false });
    e.fillStyle(ENEMY.COLOR, 1);
    e.fillRoundedRect(0, 0, ENEMY.WIDTH, ENEMY.HEIGHT, 8);
    e.fillStyle(0xffffff, 1);
    e.fillCircle(11, 15, 4);
    e.fillCircle(23, 15, 4);
    e.fillStyle(0x000000, 1);
    e.fillCircle(12, 16, 2);
    e.fillCircle(24, 16, 2);
    e.generateTexture('enemy', ENEMY.WIDTH, ENEMY.HEIGHT);
    e.destroy();

    // Shuriken : petite étoile à 4 branches (placeholder).
    const s = this.make.graphics({ x: 0, y: 0, add: false });
    const size = PROJECTILE.RADIUS * 2 + 4;
    const c = size / 2;
    const spikes = 4;
    const outer = PROJECTILE.RADIUS;
    const inner = PROJECTILE.RADIUS * 0.38;
    const pts = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / spikes) * i - Math.PI / 2;
      pts.push({ x: c + Math.cos(a) * r, y: c + Math.sin(a) * r });
    }
    s.fillStyle(PROJECTILE.COLOR, 1);
    s.fillPoints(pts, true);
    s.generateTexture('shuriken', size, size);
    s.destroy();

    // Charge la sauvegarde dans le registre global (lu par le HUD et le jeu).
    const save = SaveManager.load();
    this.registry.set('coins', save.coins);
    this.registry.set('crystals', save.crystals);

    this.scene.start('LevelScene');
  }
}
