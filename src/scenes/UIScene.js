import Phaser from 'phaser';
import { GAME, PLAYER } from '../core/Constants.js';

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

    // Ligne shurikens (stock régénératif)
    this.add.image(right - 150, 118, 'shuriken');
    this.ammoText = this.add.text(right - 132, 118, '0', textStyle).setOrigin(0, 0.5);
    this.ammoText.setShadow(1, 1, '#00000088', 2);

    // Cœurs (vie) en haut à gauche
    this.hearts = [];
    const max = this.registry.get('maxHealth') ?? PLAYER.MAX_HEALTH;
    for (let i = 0; i < max; i++) {
      const h = this.add
        .text(26 + i * 32, 34, '♥', { fontFamily: 'monospace', fontSize: '30px', color: '#ff5566' })
        .setOrigin(0, 0.5);
      h.setShadow(1, 1, '#00000088', 2);
      this.hearts.push(h);
    }

    this._buildLevelUI();
    this.refresh();
    this._refreshLevelUI();

    this.registry.events.on('changedata', this.onChange, this);
    this.events.once('shutdown', () => {
      this.registry.events.off('changedata', this.onChange, this);
    });
  }

  // Éléments d'interface propres au niveau (aide, retour hub, bannière de fin,
  // badge custom). Rendus ici → non affectés par le zoom de la caméra de jeu.
  _buildLevelUI() {
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    const helpLines = isMobile ? [] : [
      'Flèches / A-D : se déplacer   ·   Espace / ↑ / W : sauter (double-saut)',
      'J / X : frapper   ·   K / L : shuriken   ·   molette : zoom   ·   ramasse pièces & cristaux',
    ];
    this.levelHelp = this.add.text(16, GAME.HEIGHT - 52, helpLines,
      { fontFamily: 'monospace', fontSize: '15px', color: '#0a2233', lineSpacing: 4 }).setDepth(50);
    this.levelHelp.setShadow(0, 1, '#ffffff', 0);

    this.hubReturnHint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 100, 'E : retourner au village', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(50);

    this.customBadge = this.add.text(GAME.WIDTH / 2, 30, '⚡ Niveau custom', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffcc00',
      backgroundColor: '#00000088', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(50);

    this.finishBanner = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, 'NIVEAU TERMINÉ !', {
      fontFamily: 'monospace', fontSize: '40px', color: '#ffe066', fontStyle: 'bold',
      backgroundColor: '#000000aa', padding: { x: 20, y: 14 },
    }).setOrigin(0.5).setDepth(60);
  }

  _refreshLevelUI() {
    const inLevel = this.registry.get('inLevel') === true;
    this.levelHelp.setVisible(inLevel);
    this.customBadge.setVisible(inLevel && this.registry.get('isCustom') === true);
    this.hubReturnHint.setVisible(inLevel && this.registry.get('nearHub') === true);
    const done = inLevel && this.registry.get('levelComplete') === true;
    if (done && !this.finishBanner.visible) {
      this.finishBanner.setVisible(true).setScale(0.6);
      this.tweens.add({ targets: this.finishBanner, scale: 1, duration: 300, ease: 'Back.easeOut' });
    } else if (!done) {
      this.finishBanner.setVisible(false);
    }
  }

  onChange(parent, key) {
    if (['coins', 'crystals', 'health', 'ammo', 'maxAmmo'].includes(key)) this.refresh();
    if (['inLevel', 'isCustom', 'nearHub', 'levelComplete'].includes(key)) this._refreshLevelUI();
  }

  refresh() {
    this.coinText.setText(`${this.registry.get('coins') ?? 0}`);
    this.crystalText.setText(`${this.registry.get('crystals') ?? 0}`);
    const ammo = this.registry.get('ammo') ?? 0;
    const maxAmmo = this.registry.get('maxAmmo') ?? PLAYER.RANGED_MAX_AMMO;
    this.ammoText.setText(`${ammo}/${maxAmmo}`);
    const hp = this.registry.get('health') ?? 0;
    this.hearts.forEach((h, i) => h.setAlpha(i < hp ? 1 : 0.25));
  }
}
