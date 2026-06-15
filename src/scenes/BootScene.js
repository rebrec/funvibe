import Phaser from 'phaser';
import { PLAYER } from '../core/Constants.js';
import SaveManager from '../core/SaveManager.js';
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
}
