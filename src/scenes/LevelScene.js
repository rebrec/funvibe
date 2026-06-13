import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';
import InputManager from '../core/InputManager.js';
import Player from '../entities/Player.js';

// M0 — Validation des sensations de plateforme : course, saut, double-saut,
// coyote time, jump buffering, hauteur de saut variable, caméra qui suit.
// Décor en placeholders (rectangles colorés), niveau plus large que l'écran.

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = GAME.HEIGHT;

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('LevelScene');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor(GAME.BACKGROUND);

    this.platforms = [];
    this.input_ = new InputManager(this);

    // Sol principal (avec un trou pour tester les sauts au-dessus du vide).
    this.addPlatform(0, WORLD_HEIGHT - 32, 760, 32, 0x6b4f2a);
    this.addPlatform(920, WORLD_HEIGHT - 32, WORLD_WIDTH - 920, 32, 0x6b4f2a);

    // Plateformes flottantes, hauteurs croissantes.
    this.addPlatform(360, 420, 160, 24, 0x8a8f98);
    this.addPlatform(620, 340, 140, 24, 0x8a8f98);
    this.addPlatform(900, 300, 120, 24, 0x8a8f98);
    this.addPlatform(1160, 380, 180, 24, 0x8a8f98);
    this.addPlatform(1480, 300, 140, 24, 0x8a8f98);
    this.addPlatform(1720, 220, 120, 24, 0x8a8f98);

    // Escalier de petites marches pour tester la précision.
    this.addPlatform(2000, 440, 90, 24, 0x8a8f98);
    this.addPlatform(2150, 380, 90, 24, 0x8a8f98);
    this.addPlatform(2300, 320, 90, 24, 0x8a8f98);

    // Plateforme "haute" (atteignable au double-saut depuis la marche du haut) :
    // préfigure les zones bloquées par une compétence (cf. jalons M3/M4).
    this.addPlatform(2420, 180, 140, 24, 0xc06be0);

    // Joueur
    this.player = new Player(this, 120, WORLD_HEIGHT - 120);
    this.physics.add.collider(this.player, this.platforms);

    // Caméra suit le joueur en douceur.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(120, 120);

    this.createHelpOverlay();
  }

  addPlatform(x, y, width, height, color) {
    // Rectangle avec corps statique (placeholder, pas de texture nécessaire).
    const rect = this.add.rectangle(x + width / 2, y + height / 2, width, height, color);
    this.physics.add.existing(rect, true);
    this.platforms.push(rect);
    return rect;
  }

  createHelpOverlay() {
    const lines = [
      'M0 — Sensations de plateforme',
      'Flèches / A-D : se déplacer   ·   Espace / ↑ / W : sauter (double-saut)',
      'Astuce : relâcher le saut tôt = saut plus court',
    ];
    const text = this.add
      .text(16, 14, lines, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#0a2233',
        lineSpacing: 4,
      })
      .setScrollFactor(0)
      .setDepth(1000);
    text.setShadow(0, 1, '#ffffff', 0);
  }

  update(time, delta) {
    this.player.update(delta, this.input_);

    // Filet de sécurité : si on tombe dans un trou, on réapparaît au départ.
    if (this.player.y > WORLD_HEIGHT + 200) {
      this.player.setVelocity(0, 0);
      this.player.setPosition(120, WORLD_HEIGHT - 120);
    }
  }
}
