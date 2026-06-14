import Phaser from 'phaser';
import { GAME, PLAYER } from '../core/Constants.js';
import InputManager from '../core/InputManager.js';
import Player from '../entities/Player.js';

const HUB_W = 1400;
const HUB_H = 500;
const GROUND_Y = 370; // y de la surface du sol
const START = { x: 200, y: GROUND_Y - PLAYER.HEIGHT / 2 };
const PLAT_T = 28; // épaisseur des plateformes

export default class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create() {
    this.matter.world.setBounds(0, 0, HUB_W, HUB_H, 64, true, true, true, false);
    this.cameras.main.setBounds(0, 0, HUB_W, HUB_H);
    this.cameras.main.setBackgroundColor('#87ceeb');

    this.input_ = new InputManager(this);
    this.doors = [];

    this.buildHub();

    this.player = new Player(this, START.x, START.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.hintText = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT - 40, '', {
        fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 12, y: 5 },
      })
      .setScrollFactor(0).setDepth(100).setOrigin(0.5).setVisible(false);

    this.scene.launch('UIScene');
  }

  addPlatform(x, topY, width, color) {
    const rect = this.add.rectangle(x + width / 2, topY + PLAT_T / 2, width, PLAT_T, color);
    this.matter.add.gameObject(rect, { isStatic: true, friction: 0, label: 'platform' });
  }

  buildHub() {
    // Sol
    this.addPlatform(0, GROUND_Y, HUB_W, 0x6b4f2a);

    // Petites plateformes décoratives (pas de sol sous les pieds du joueur ici)
    this.addPlatform(460,  GROUND_Y - 100, 110, 0x8a8f98);
    this.addPlatform(660,  GROUND_Y - 155, 90,  0x8a8f98);

    // === Bâtiment BOUTIQUE (x=520) ===
    const bx = 520, bw = 190, bh = 126;
    this.add.rectangle(bx, GROUND_Y - bh / 2, bw, bh, 0xc09060);       // murs
    this.add.rectangle(bx, GROUND_Y - bh - 7, bw + 20, 14, 0x8a5a20);  // toit
    this.add.text(bx, GROUND_Y - bh + 12, 'BOUTIQUE', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffe0a0', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.rectangle(bx, GROUND_Y - 28, 44, 56, 0x3a1500); // porte

    this.doors.push({ x: bx, y: GROUND_Y, action: 'shop', hint: 'E : entrer dans la boutique' });

    // === Portail NIVEAU (x=950) ===
    const px = 950, py = GROUND_Y - 56;
    const halo = this.add.circle(px, py, 44, 0x6633cc, 0.8);
    const core = this.add.circle(px, py, 34, 0x9966ff, 0.6);
    this.tweens.add({
      targets: [halo, core], scale: { from: 0.93, to: 1.07 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.add.text(px, py - 58, 'NIVEAU', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cc99ff', fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    this.doors.push({ x: px, y: py, action: 'level', hint: 'E : entrer dans le niveau' });

    // Arbres (tronc + feuillage)
    [310, 770, 1160].forEach((tx) => {
      this.add.rectangle(tx, GROUND_Y - 20, 12, 40, 0x5a3a10);
      this.add.circle(tx, GROUND_Y - 62, 28, 0x228844);
    });

    // Message de bienvenue
    this.add.text(200, GROUND_Y - 80, 'Bienvenue au village !', {
      fontFamily: 'monospace', fontSize: '14px', color: '#1a0800',
    }).setOrigin(0.5, 1);

    // Aide touches (fixée à l'écran)
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 70, 'Fleches / A-D : se deplacer   *   Espace : sauter', {
      fontFamily: 'monospace', fontSize: '14px', color: '#1a1a1a',
    }).setScrollFactor(0).setDepth(10);
  }

  update(time, delta) {
    this.player.update(delta, this.input_);

    let nearDoor = null;
    for (const d of this.doors) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y) < 90) {
        nearDoor = d;
        break;
      }
    }

    if (nearDoor) {
      this.hintText.setText(nearDoor.hint).setVisible(true);
      if (this.input_.isInteractJustPressed()) this.triggerDoor(nearDoor.action);
    } else {
      this.hintText.setVisible(false);
    }

    if (this.player.y > HUB_H) {
      this.player.setVelocity(0, 0);
      this.player.setPosition(START.x, START.y);
    }
  }

  triggerDoor(action) {
    if (action === 'shop') {
      this.scene.pause('HubScene');
      this.scene.launch('ShopScene');
    } else if (action === 'level') {
      this.scene.stop('UIScene');
      this.scene.start('LevelScene');
    }
  }
}
