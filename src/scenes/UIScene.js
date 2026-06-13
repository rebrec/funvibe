import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';

// HUD superposé (scène parallèle au niveau). Affiche les compteurs de pièces et
// de cristaux. Les valeurs vivent dans le registre global (this.registry), mis à
// jour par la scène de jeu ; le HUD se rafraîchit quand elles changent.
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    const right = GAME.WIDTH - 24;
    const textStyle = {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    };

    // Ligne pièces
    this.add.circle(right - 150, 34, 11, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.coinText = this.add.text(right - 132, 34, '0', textStyle).setOrigin(0, 0.5);
    this.coinText.setShadow(1, 1, '#00000088', 2);

    // Ligne cristaux
    this.add.rectangle(right - 150, 76, 18, 18, 0x49e0e0).setStrokeStyle(2, 0x1f8a8a).setRotation(Math.PI / 4);
    this.crystalText = this.add.text(right - 132, 76, '0', textStyle).setOrigin(0, 0.5);
    this.crystalText.setShadow(1, 1, '#00000088', 2);

    this.refresh();

    this.registry.events.on('changedata', this.onChange, this);
    this.events.once('shutdown', () => {
      this.registry.events.off('changedata', this.onChange, this);
    });
  }

  onChange(parent, key) {
    if (key === 'coins' || key === 'crystals') this.refresh();
  }

  refresh() {
    this.coinText.setText(`${this.registry.get('coins') ?? 0}`);
    this.crystalText.setText(`${this.registry.get('crystals') ?? 0}`);
  }
}
