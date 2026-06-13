import Phaser from 'phaser';
import { PLAYER, ENEMY } from '../core/Constants.js';
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
    e.fillCircle(13, 15, 5);
    e.fillCircle(27, 15, 5);
    e.fillStyle(0x000000, 1);
    e.fillCircle(14, 16, 2);
    e.fillCircle(28, 16, 2);
    e.generateTexture('enemy', ENEMY.WIDTH, ENEMY.HEIGHT);
    e.destroy();

    // Charge la sauvegarde dans le registre global (lu par le HUD et le jeu).
    const save = SaveManager.load();
    this.registry.set('coins', save.coins);
    this.registry.set('crystals', save.crystals);

    this.scene.start('LevelScene');
  }
}
