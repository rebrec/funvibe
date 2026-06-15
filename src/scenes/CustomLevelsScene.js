import Phaser from 'phaser';

const CUSTOM_LEVELS_KEY = 'customLevels';

// Overlay listant les niveaux créés dans l'éditeur (localStorage "customLevels").
// Sélection → lance LevelScene avec l'index choisi. Échap/clic = fermer.
export default class CustomLevelsScene extends Phaser.Scene {
  constructor() {
    super('CustomLevelsScene');
  }

  create() {
    const W = 960, H = 540;
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65);
    const panW = 560, panH = 400;
    const px = (W - panW) / 2, py = (H - panH) / 2;
    this.add.rectangle(px + panW / 2, py + panH / 2, panW, panH, 0x14142a, 0.98)
      .setStrokeStyle(2, 0x6633cc);

    this.add.text(W / 2, py + 26, 'NIVEAUX CUSTOM', {
      fontFamily: 'monospace', fontSize: '20px', color: '#cc99ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const levels = this._load();
    if (!levels.length) {
      this.add.text(W / 2, H / 2, "Aucun niveau créé.\nOuvre l'éditeur depuis le village.", {
        fontFamily: 'monospace', fontSize: '15px', color: '#aab', align: 'center',
      }).setOrigin(0.5);
    } else {
      levels.forEach((lvl, i) => {
        const ry = py + 70 + i * 44;
        if (ry > py + panH - 60) return; // garde-fou : on n'affiche pas hors panneau
        const row = this.add.text(px + 30, ry, `▶  ${lvl.name}`, {
          fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
          backgroundColor: '#2a2a4a', padding: { x: 12, y: 8 },
          fixedWidth: panW - 60,
        }).setInteractive({ useHandCursor: true });
        row.on('pointerover', () => row.setStyle({ backgroundColor: '#3a3a6a' }));
        row.on('pointerout',  () => row.setStyle({ backgroundColor: '#2a2a4a' }));
        row.on('pointerdown', () => this._play(i));
      });
    }

    this.add.text(W / 2, py + panH - 24, 'Échap = fermer', {
      fontFamily: 'monospace', fontSize: '12px', color: '#778899',
    }).setOrigin(0.5);
  }

  _load() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_LEVELS_KEY) ?? '[]'); }
    catch { return []; }
  }

  _play(idx) {
    this.scene.stop('UIScene');
    this.scene.stop('HubScene');
    this.scene.stop();
    this.scene.start('LevelScene', { customLevelIdx: idx });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.scene.resume('HubScene');
      this.scene.stop();
    }
  }
}
