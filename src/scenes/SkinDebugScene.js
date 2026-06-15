import Phaser from 'phaser';
import {
  PLAYER_SKINS, ENEMY_WALKER_SKINS, ENEMY_CHARGER_SKINS, THEMES,
  generatePlayerTexture, generateEnemyTexture, generateShurikenTexture,
  getTheme,
} from '../core/Skins.js';

// Overlay debug pour cycler skins & thèmes sans recharger la page.
// Activation : F2 depuis HubScene ou LevelScene.
// Fermeture : Échap / F2.  Appliquer : régénère les textures + redémarre la scène.
export default class SkinDebugScene extends Phaser.Scene {
  constructor() {
    super('SkinDebugScene');
  }

  init(data) {
    this.callerScene = data?.from ?? 'HubScene';
  }

  create() {
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyF2  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

    // Sélections courantes (initialisées depuis le registry)
    this.sel = {
      player:  PLAYER_SKINS.indexOf(this.registry.get('skinPlayer')  ?? 'ninja'),
      walker:  ENEMY_WALKER_SKINS.indexOf(this.registry.get('skinWalker')  ?? 'orc'),
      charger: ENEMY_CHARGER_SKINS.indexOf(this.registry.get('skinCharger') ?? 'knight'),
      theme:   THEMES.indexOf(this.registry.get('theme') ?? 'forest'),
    };
    // Clamp au cas où la valeur en registry n'existe plus
    this.sel.player  = Math.max(0, this.sel.player);
    this.sel.walker  = Math.max(0, this.sel.walker);
    this.sel.charger = Math.max(0, this.sel.charger);
    this.sel.theme   = Math.max(0, this.sel.theme);

    this._buildUI();
  }

  _buildUI() {
    const W = 960, H = 540;
    const panW = 520, panH = 320;
    const panX = (W - panW) / 2, panY = (H - panH) / 2;

    // Fond semi-transparent
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6);
    // Panneau
    this.add.rectangle(panX + panW / 2, panY + panH / 2, panW, panH, 0x1a1a2e, 0.97)
      .setStrokeStyle(2, 0x6633cc);

    // Titre
    this.add.text(W / 2, panY + 22, 'DEBUG — SKINS & THÈMES', {
      fontFamily: 'monospace', fontSize: '18px', color: '#cc99ff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // Ligne de séparation
    this.add.rectangle(W / 2, panY + 44, panW - 20, 2, 0x6633cc, 0.5);

    // Lignes de sélection
    const rows = [
      { label: 'JOUEUR',         key: 'player',  list: PLAYER_SKINS },
      { label: 'ENNEMI WALKER',  key: 'walker',  list: ENEMY_WALKER_SKINS },
      { label: 'ENNEMI CHARGER', key: 'charger', list: ENEMY_CHARGER_SKINS },
      { label: 'THÈME',          key: 'theme',   list: THEMES },
    ];

    this._valueTexts = {};
    rows.forEach((row, i) => {
      const ry = panY + 80 + i * 52;
      // Label
      this.add.text(panX + 30, ry, row.label + ' :', {
        fontFamily: 'monospace', fontSize: '14px', color: '#aabbcc',
      }).setOrigin(0, 0.5);

      // Bouton ◄
      this._makeButton(panX + 240, ry, '◄', () => this._cycle(row.key, row.list, -1));
      // Bouton ►
      this._makeButton(panX + 430, ry, '►', () => this._cycle(row.key, row.list, +1));

      // Texte valeur courante
      const vt = this.add.text(panX + 335, ry, '', {
        fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5, 0.5);
      this._valueTexts[row.key] = vt;
    });

    // Bouton APPLIQUER
    const btnY = panY + panH - 44;
    this._makeButton(W / 2, btnY, '  APPLIQUER & RECHARGER  ', () => this._apply(), 0x3a1a6a, '#cc99ff');

    // Aide fermeture
    this.add.text(W / 2, panY + panH - 14, 'Échap / F2 = fermer sans changer', {
      fontFamily: 'monospace', fontSize: '12px', color: '#778899',
    }).setOrigin(0.5, 0.5);

    // Aperçu joueur (rendu en temps réel du skin sélectionné)
    this._previewPlayer = this.add.image(panX + panW - 50, panY + 130, 'player').setScale(2);
    this._previewWalker  = this.add.image(panX + panW - 50, panY + 182, 'enemy-walker').setScale(2);
    this._previewCharger = this.add.image(panX + panW - 50, panY + 234, 'enemy-charger').setScale(2);
    this.add.text(panX + panW - 50, panY + 100, 'Aperçu', {
      fontFamily: 'monospace', fontSize: '11px', color: '#778899',
    }).setOrigin(0.5, 0.5);

    this._refresh();
  }

  _makeButton(x, y, label, cb, bg = 0x2a2a4a, color = '#9966ff') {
    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '14px', color,
      backgroundColor: '#' + bg.toString(16).padStart(6, '0'),
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

    txt.on('pointerover',  () => txt.setStyle({ color: '#ffffff' }));
    txt.on('pointerout',   () => txt.setStyle({ color }));
    txt.on('pointerdown',  cb);
    return txt;
  }

  _cycle(key, list, dir) {
    this.sel[key] = (this.sel[key] + dir + list.length) % list.length;
    // Regénère le skin dans les aperçus
    const skinName = list[this.sel[key]];
    if (key === 'player')  generatePlayerTexture(this, skinName);
    if (key === 'walker')  generateEnemyTexture(this, skinName, 'walker');
    if (key === 'charger') generateEnemyTexture(this, skinName, 'charger');
    this._refresh();
  }

  _refresh() {
    const lists = {
      player: PLAYER_SKINS, walker: ENEMY_WALKER_SKINS,
      charger: ENEMY_CHARGER_SKINS, theme: THEMES,
    };
    const themeNames = THEMES.map(t => getTheme(t).name);

    for (const [key, txt] of Object.entries(this._valueTexts)) {
      const list = lists[key];
      const val  = list[this.sel[key]];
      txt.setText(key === 'theme' ? getTheme(val).name : val);
    }

    // Rafraîchit les aperçus (les textures ont été régénérées dans _cycle)
    if (this._previewPlayer)  this._previewPlayer.setTexture('player');
    if (this._previewWalker)  this._previewWalker.setTexture('enemy-walker');
    if (this._previewCharger) this._previewCharger.setTexture('enemy-charger');
  }

  _apply() {
    // Sauvegarde les choix dans le registry
    this.registry.set('skinPlayer',  PLAYER_SKINS[this.sel.player]);
    this.registry.set('skinWalker',  ENEMY_WALKER_SKINS[this.sel.walker]);
    this.registry.set('skinCharger', ENEMY_CHARGER_SKINS[this.sel.charger]);
    this.registry.set('theme',       THEMES[this.sel.theme]);

    // Regénère toutes les textures
    generatePlayerTexture(this,  PLAYER_SKINS[this.sel.player]);
    generateEnemyTexture(this,   ENEMY_WALKER_SKINS[this.sel.walker], 'walker');
    generateEnemyTexture(this,   ENEMY_CHARGER_SKINS[this.sel.charger], 'charger');
    generateShurikenTexture(this);

    // Arrête la scène appelante (UIScene + caller) puis redémarre le hub
    this.scene.stop('UIScene');
    this.scene.stop(this.callerScene);
    this.scene.start('HubScene'); // stoppe SkinDebugScene implicitement
  }

  _close() {
    this.scene.resume(this.callerScene);
    this.scene.stop();
  }

  update() {
    if (
      Phaser.Input.Keyboard.JustDown(this.keyEsc) ||
      Phaser.Input.Keyboard.JustDown(this.keyF2)
    ) {
      this._close();
    }
  }
}
