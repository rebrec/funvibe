import Phaser from 'phaser';
import { PLAYER } from '../core/Constants.js';
import SaveManager from '../core/SaveManager.js';
import TouchControls from '../core/TouchControls.js';
import {
  generatePlayerTexture,
  generateEnemyTexture,
  generateShurikenTexture,
} from '../core/Skins.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Choix de skins (défaut si rien en registry)
    const skinPlayer  = this.registry.get('skinPlayer')  ?? 'ninja';
    const skinWalker  = this.registry.get('skinWalker')  ?? 'orc';
    const skinCharger = this.registry.get('skinCharger') ?? 'knight';

    generatePlayerTexture(this, skinPlayer);
    generateEnemyTexture(this, skinWalker, 'walker');
    generateEnemyTexture(this, skinCharger, 'charger');
    generateShurikenTexture(this);

    this._createAnimations();

    // Contrôles tactiles (mobile uniquement, caché sur desktop)
    const touchControls = new TouchControls(this);
    this.registry.set('touchControls', touchControls);

    // Charge la sauvegarde et initialise le registre global.
    const save = SaveManager.load();
    this.registry.set('coins', save.coins);
    this.registry.set('crystals', save.crystals);

    const upg = save.upgrades ?? {};
    this.registry.set('upgrades', upg);
    this.registry.set('maxHealth', PLAYER.MAX_HEALTH + (upg.maxHealth ?? 0));
    this.registry.set('maxJumps',  PLAYER.MAX_JUMPS  + (upg.maxJumps  ?? 0));
    this.registry.set('maxAmmo',   PLAYER.RANGED_MAX_AMMO + (upg.maxAmmo ?? 0) * 2);
    this.registry.set('regenSpeed', upg.regenSpeed ?? 0);

    this.scene.start('HubScene');
  }

  // Anims globales (le gestionnaire d'anims est partagé entre scènes).
  // Idempotent : on ne recrée pas une anim déjà définie. Les indices de frames
  // restent valides même après régénération des textures (menu skins).
  _createAnimations() {
    const mk = (key, cfg) => { if (!this.anims.exists(key)) this.anims.create({ key, ...cfg }); };
    const nums = (tex, start, end) => this.anims.generateFrameNumbers(tex, { start, end });

    mk('player-idle', { frames: nums('player', 0, 0), frameRate: 2, repeat: -1 });
    mk('player-run',  { frames: nums('player', 1, 6), frameRate: 12, repeat: -1 });
    mk('player-jump', { frames: nums('player', 7, 7), frameRate: 1 });
    mk('player-fall', { frames: nums('player', 8, 8), frameRate: 1 });
    mk('player-land', { frames: nums('player', 9, 9), frameRate: 1 });
    mk('player-spin', { frames: nums('player', 10, 14), frameRate: 22, repeat: 0 });
    mk('player-hurt', { frames: nums('player', 15, 15), frameRate: 1 });

    mk('walker-walk',  { frames: nums('enemy-walker', 0, 1),  frameRate: 6, repeat: -1 });
    mk('charger-walk', { frames: nums('enemy-charger', 0, 1), frameRate: 6, repeat: -1 });
  }
}
