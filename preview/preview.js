import Phaser from 'phaser';
import {
  generatePlayerTexture, generateEnemyTexture,
  PLAYER_SKINS, PLAYER_FRAME,
} from '../src/core/Skins.js';

// Page d'aperçu : affiche les frames du joueur (par skin) + des sprites animés.
// Sert à l'inspection visuelle et aux captures automatiques (scripts/report.mjs).

const FRAME_LABELS = ['idle', 'run1', 'run2', 'run3', 'run4', 'run5', 'run6',
  'jump', 'fall', 'land', 'spin1', 'spin2', 'spin3', 'spin4', 'spin5', 'hurt'];

class PreviewScene extends Phaser.Scene {
  constructor() { super('PreviewScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#20203a');

    // Génère les feuilles par skin sous des clés distinctes pour tout afficher.
    PLAYER_SKINS.forEach((skin) => this._sheetForSkin(skin));
    generateEnemyTexture(this, 'orc', 'walker');
    generateEnemyTexture(this, 'knight', 'charger');
    this._createAnims();

    const FW = PLAYER_FRAME.W, FH = PLAYER_FRAME.H;
    let y = 36;

    PLAYER_SKINS.forEach((skin) => {
      const key = `pv-${skin}`;
      this.add.text(14, y - 16, skin.toUpperCase(), { fontFamily: 'monospace', fontSize: '13px', color: '#cc99ff' });
      for (let i = 0; i < PLAYER_FRAME.COUNT; i++) {
        const x = 24 + i * (FW + 6);
        this.add.rectangle(x + FW / 2, y + FH / 2, FW, FH, 0x000000, 0.18);
        this.add.image(x, y, key, i).setOrigin(0, 0);
        if (skin === PLAYER_SKINS[0]) {
          this.add.text(x + FW / 2, y + FH + 2, FRAME_LABELS[i], { fontFamily: 'monospace', fontSize: '8px', color: '#7788aa' }).setOrigin(0.5, 0);
        }
      }
      y += FH + 34;
    });

    // Sprites animés
    const ry = y + 24;
    this.add.text(14, ry - 18, 'ANIMATIONS (jouées en boucle)', { fontFamily: 'monospace', fontSize: '13px', color: '#cc99ff' });
    const animKey = `pv-${PLAYER_SKINS[0]}`;
    const animated = (x, anim, label, oneShotLoop) => {
      this.add.text(x, ry + 78, label, { fontFamily: 'monospace', fontSize: '11px', color: '#aab' }).setOrigin(0.5, 0);
      const s = this.add.sprite(x, ry + 44, animKey, 0).setScale(2.2);
      if (oneShotLoop) this.time.addEvent({ delay: 800, loop: true, callback: () => s.play(anim) });
      else s.play(anim);
      return s;
    };
    animated(90, `${animKey}-idle`, 'idle');
    animated(210, `${animKey}-run`, 'course');
    animated(330, `${animKey}-spin`, 'rotation', true);

    this.add.text(440, ry + 78, 'walker', { fontFamily: 'monospace', fontSize: '11px', color: '#aab' }).setOrigin(0.5, 0);
    this.add.sprite(440, ry + 44, 'enemy-walker', 0).setScale(2).play('walker-walk');
    this.add.text(540, ry + 78, 'charger', { fontFamily: 'monospace', fontSize: '11px', color: '#aab' }).setOrigin(0.5, 0);
    this.add.sprite(540, ry + 44, 'enemy-charger', 0).setScale(2).play('charger-walk');

    this.add.text(14, ry + 110, 'PREVIEW READY', { fontFamily: 'monospace', fontSize: '10px', color: '#33dd55' });
  }

  // Génère la spritesheet d'un skin sous une clé dédiée (pv-<skin>).
  _sheetForSkin(skin) {
    generatePlayerTexture(this, skin, `pv-${skin}`);
  }

  _createAnims() {
    const mk = (k, cfg) => { if (!this.anims.exists(k)) this.anims.create({ key: k, ...cfg }); };
    const nums = (t, s, e) => this.anims.generateFrameNumbers(t, { start: s, end: e });
    PLAYER_SKINS.forEach((skin) => {
      const k = `pv-${skin}`;
      mk(`${k}-idle`, { frames: nums(k, 0, 0), frameRate: 2, repeat: -1 });
      mk(`${k}-run`,  { frames: nums(k, 1, 6), frameRate: 12, repeat: -1 });
      mk(`${k}-spin`, { frames: nums(k, 10, 14), frameRate: 18, repeat: 0 });
    });
    mk('walker-walk',  { frames: nums('enemy-walker', 0, 1),  frameRate: 6, repeat: -1 });
    mk('charger-walk', { frames: nums('enemy-charger', 0, 1), frameRate: 6, repeat: -1 });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 980,
  height: 520,
  backgroundColor: '#20203a',
  scene: [PreviewScene],
});
