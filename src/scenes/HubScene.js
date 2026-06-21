import Phaser from 'phaser';
import { GAME, PLAYER } from '../core/Constants.js';
import { getTheme, buildHubDecor } from '../core/Skins.js';
import InputManager from '../core/InputManager.js';
import Player from '../entities/Player.js';
import WorldLoader from '../world/WorldLoader.js';
import hubData from '../data/levels/hub.json';

const HUB_W    = hubData.world.width;
const HUB_H    = hubData.world.height;
const GROUND_Y = hubData.terrain[0].y; // y du sol principal
const START    = hubData.start;
const PLAT_T   = 28;

export default class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create() {
    this.theme = getTheme(this.registry.get('theme') ?? 'forest');
    this.keyF2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    this.matter.world.setBounds(0, 0, HUB_W, HUB_H, 64, true, true, true, false);
    this.cameras.main.setBounds(0, 0, HUB_W, HUB_H);
    this.cameras.main.setBackgroundColor(this.theme.background);

    this.input_ = new InputManager(this);

    // Contrôles tactiles : monter dans cette scène et connecter l'InputManager.
    this._touch = this.registry.get('touchControls');
    if (this._touch) {
      this._touch.mount(this);
      this._touch.setInputManager(this.input_);
    }

    this.doors = [];

    buildHubDecor(this, this.theme, HUB_W, GROUND_Y);
    WorldLoader.build(this, hubData, this.theme);
    this.buildHub();

    this.player = new Player(this, START.x, START.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.hintText = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT - 40, '', {
        fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
        backgroundColor: '#00000088', padding: { x: 12, y: 5 },
      })
      .setScrollFactor(0).setDepth(100).setOrigin(0.5).setVisible(false);

    this._buildEditorButton();

    // L'UI propre au niveau ne doit pas s'afficher par-dessus le hub.
    this.registry.set('inLevel', false);

    this.scene.launch('UIScene');
  }

  _hasCustomLevels() {
    try { return JSON.parse(localStorage.getItem('customLevels') ?? '[]').length > 0; }
    catch { return false; }
  }

  // Bouton fixé à l'écran (coin haut-droit) : ouvre l'éditeur dans un nouvel onglet.
  _buildEditorButton() {
    const btn = this.add.text(GAME.WIDTH - 12, 12, '✎ ÉDITEUR', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#5533aa', padding: { x: 10, y: 6 },
    }).setScrollFactor(0).setDepth(200).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#7744cc' }));
    btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#5533aa' }));
    // En prod, l'éditeur est servi à editor/ (même origine) — nouvel onglet.
    btn.on('pointerdown', () => window.open('editor/', '_blank'));
  }

  addPlatform(x, topY, width, color) {
    const rect = this.add.rectangle(x + width / 2, topY + PLAT_T / 2, width, PLAT_T, color);
    this.matter.add.gameObject(rect, { isStatic: true, friction: 0, label: 'platform' });
    return rect;
  }

  addGroundSection(x, topY, width) {
    const fillH = HUB_H - topY;
    this.add.rectangle(x + width / 2, topY + fillH / 2, width, fillH, this.theme.groundBody).setDepth(-3);
    this.add.rectangle(x + width / 2, topY + 5, width, 10, this.theme.groundTop).setDepth(-2);
    const rect = this.add.rectangle(x + width / 2, topY + PLAT_T / 2, width, PLAT_T, this.theme.groundBody);
    this.matter.add.gameObject(rect, { isStatic: true, friction: 0, label: 'platform' });
    return rect;
  }

  buildHub() {
    // Le sol est chargé via WorldLoader (hub.json). Les éléments interactifs / décoratifs suivent :

    // === Bâtiment BOUTIQUE ===
    const bx = 520, bw = 190, bh = 126;
    // Murs (couleur qui contraste avec le thème mais reste "bâtiment")
    this.add.rectangle(bx, GROUND_Y - bh / 2, bw, bh, 0xc09060);
    // Toit
    this.add.rectangle(bx, GROUND_Y - bh - 7, bw + 20, 14, 0x8a5a20);
    // Enseigne
    this.add.text(bx, GROUND_Y - bh + 12, 'BOUTIQUE', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffe0a0', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    // Porte
    this.add.rectangle(bx, GROUND_Y - 28, 44, 56, 0x3a1500);
    // Fenêtres
    this.add.rectangle(bx - 55, GROUND_Y - 80, 28, 28, 0x88ccff, 0.6);
    this.add.rectangle(bx + 55, GROUND_Y - 80, 28, 28, 0x88ccff, 0.6);

    this.doors.push({ x: bx, y: GROUND_Y, action: 'shop', hint: 'E : entrer dans la boutique' });

    // === Portail NIVEAU ===
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

    // === Portail NIVEAUX CUSTOM (visible seulement si des niveaux existent) ===
    if (this._hasCustomLevels()) {
      const cxp = 1230, cyp = GROUND_Y - 56;
      const chalo = this.add.circle(cxp, cyp, 42, 0xaa6611, 0.8);
      const ccore = this.add.circle(cxp, cyp, 32, 0xffaa33, 0.6);
      this.tweens.add({
        targets: [chalo, ccore], scale: { from: 0.93, to: 1.07 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.add.text(cxp, cyp - 56, 'CUSTOM', {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffcc66', fontStyle: 'bold',
      }).setOrigin(0.5, 1);
      this.doors.push({ x: cxp, y: cyp, action: 'custom', hint: 'E : choisir un niveau custom' });
    }

    // Arbres (style selon thème)
    [310, 770, 1160].forEach(tx => this._drawTree(tx, GROUND_Y));

    // Message de bienvenue (couleur lisible selon thème)
    const textColor = this.theme.decorFn === 'volcano' ? '#ff9966' : '#ffffff';
    this.add.text(200, GROUND_Y - 80, 'Bienvenue au village !', {
      fontFamily: 'monospace', fontSize: '14px', color: textColor,
    }).setOrigin(0.5, 1);

    // Aide touches (fixée à l'écran)
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 70,
      'Flèches/A-D : se déplacer   ·   Espace : sauter   ·   F2 : skins & thèmes', {
        fontFamily: 'monospace', fontSize: '13px', color: '#cccccc',
      }).setScrollFactor(0).setDepth(10);
  }

  _drawTree(x, groundY) {
    const fn = this.theme.decorFn;
    if (fn === 'snow') {
      // Sapin : triangle foncé
      const g = this.add.graphics();
      g.fillStyle(0x2a5a2a, 1);
      g.fillTriangle(x - 28, groundY, x, groundY - 110, x + 28, groundY);
      g.fillTriangle(x - 20, groundY - 55, x, groundY - 130, x + 20, groundY - 55);
      g.fillStyle(0x4a2a08, 1);
      g.fillRect(x - 5, groundY - 15, 10, 15);
    } else if (fn === 'sea') {
      // Palmier : tronc courbe (approché par rectangles décalés) + feuilles
      const g = this.add.graphics();
      g.fillStyle(0x7a5a20, 1);
      g.fillRect(x - 5, groundY - 80, 10, 80);
      g.fillRect(x - 3, groundY - 120, 8, 40);
      // Feuilles (triangles verts)
      g.fillStyle(0x228833, 1);
      g.fillTriangle(x - 5, groundY - 120, x + 60, groundY - 140, x + 40, groundY - 100);
      g.fillTriangle(x + 5, groundY - 120, x - 60, groundY - 145, x - 40, groundY - 105);
      g.fillTriangle(x, groundY - 120, x + 20, groundY - 185, x + 50, groundY - 155);
    } else if (fn === 'volcano') {
      // Arbre mort (tronc sans feuilles, branches sèches)
      const g = this.add.graphics();
      g.fillStyle(0x2a1808, 1);
      g.fillRect(x - 5, groundY - 90, 10, 90);
      g.fillRect(x, groundY - 70, 30, 5);
      g.fillRect(x - 30, groundY - 50, 30, 5);
    } else {
      // Forêt : tronc + feuillage circulaire (défaut)
      const g = this.add.graphics();
      g.fillStyle(0x5a3a10, 1);
      g.fillRect(x - 6, groundY - 30, 12, 30);
      g.fillStyle(0x1a6622, 1);
      g.fillCircle(x, groundY - 65, 32);
      g.fillStyle(0x228833, 1);
      g.fillCircle(x - 12, groundY - 75, 20);
      g.fillCircle(x + 12, groundY - 78, 22);
    }
  }

  update(time, delta) {
    // Menu debug skins (F2)
    if (Phaser.Input.Keyboard.JustDown(this.keyF2)) {
      this.scene.pause();
      this.scene.launch('SkinDebugScene', { from: 'HubScene' });
      return;
    }

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
    this._touch?.setInteractVisible(!!nearDoor);

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
      this.scene.pause();
      this.scene.launch('LevelScene');
    } else if (action === 'custom') {
      this.scene.pause();
      this.scene.launch('CustomLevelsScene');
    }
  }
}
