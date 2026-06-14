import Phaser from 'phaser';
import { GAME, PLAYER, SHOP } from '../core/Constants.js';
import SaveManager from '../core/SaveManager.js';

const W = GAME.WIDTH;
const H = GAME.HEIGHT;
const ROW_H = 74;
const FIRST_Y = 158;

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene', active: false });
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1a);

    this.add.text(W / 2, 46, 'BOUTIQUE', {
      fontFamily: 'monospace', fontSize: '30px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.coins = this.registry.get('coins') ?? 0;
    this.upgrades = { ...(this.registry.get('upgrades') ?? {}) };
    this.selectedIndex = 0;

    this.coinText = this.add.text(W / 2, 90, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#ffd23f',
    }).setOrigin(0.5, 0.5);

    this.rows = this.buildRows();
    this.refreshDisplay();

    this.add.text(W / 2, H - 22, '[ Haut/Bas : naviguer ]   [ E / Espace : acheter ]   [ Echap : fermer ]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#777788',
    }).setOrigin(0.5, 0.5);

    this.input.keyboard.on('keydown-UP',    () => this.navigate(-1));
    this.input.keyboard.on('keydown-DOWN',  () => this.navigate(1));
    this.input.keyboard.on('keydown-E',     () => this.buy());
    this.input.keyboard.on('keydown-SPACE', () => this.buy());
    this.input.keyboard.on('keydown-ESC',   () => this.close());
  }

  buildRows() {
    return SHOP.ITEMS.map((item, i) => {
      const y = FIRST_Y + i * ROW_H;
      const bg = this.add.rectangle(W / 2, y, 840, 60, 0x1a1a33).setStrokeStyle(2, 0x333366);
      const nameTxt = this.add.text(82, y - 11, item.label, {
        fontFamily: 'monospace', fontSize: '17px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      const descTxt = this.add.text(82, y + 13, item.desc, {
        fontFamily: 'monospace', fontSize: '12px', color: '#9999bb',
      }).setOrigin(0, 0.5);
      const lvlTxt = this.add.text(710, y, '', {
        fontFamily: 'monospace', fontSize: '14px', color: '#88ddff',
      }).setOrigin(0.5, 0.5);
      const costTxt = this.add.text(820, y, '', {
        fontFamily: 'monospace', fontSize: '15px', color: '#ffd23f',
      }).setOrigin(0.5, 0.5);
      const badgeTxt = this.add.text(910, y, '', {
        fontFamily: 'monospace', fontSize: '13px',
      }).setOrigin(0.5, 0.5);
      return { bg, nameTxt, descTxt, lvlTxt, costTxt, badgeTxt, item };
    });
  }

  refreshDisplay() {
    this.coinText.setText(`Pieces : ${this.coins}`);

    this.rows.forEach(({ bg, lvlTxt, costTxt, badgeTxt, item }, i) => {
      const level = this.upgrades[item.id] ?? 0;
      const maxed = level >= item.maxLevel;
      const nextCost = maxed ? null : item.costs[level];
      const canAfford = !maxed && this.coins >= nextCost;
      const selected = i === this.selectedIndex;

      bg.setFillStyle(selected ? 0x2233aa : 0x1a1a33);
      bg.setStrokeStyle(2, selected ? 0x6688ff : 0x333366);

      lvlTxt.setText(`${level}/${item.maxLevel}`);

      if (maxed) {
        costTxt.setText('---').setColor('#555566');
        badgeTxt.setText('MAX').setColor('#88ff88');
      } else {
        costTxt.setText(`${nextCost} pcs`).setColor(canAfford ? '#ffd23f' : '#886644');
        badgeTxt.setText(canAfford ? '' : 'insuf.').setColor('#ff8866');
      }
    });
  }

  navigate(dir) {
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + dir, 0, SHOP.ITEMS.length - 1);
    this.refreshDisplay();
  }

  buy() {
    const { item } = this.rows[this.selectedIndex];
    const level = this.upgrades[item.id] ?? 0;
    if (level >= item.maxLevel) return;
    const cost = item.costs[level];
    if (this.coins < cost) return;

    this.coins -= cost;
    this.upgrades[item.id] = level + 1;

    // Met à jour le registry (UIScene se rafraîchit automatiquement pour les pièces).
    this.registry.set('coins', this.coins);
    this.registry.set('upgrades', { ...this.upgrades });
    this.registry.set('maxHealth', PLAYER.MAX_HEALTH + (this.upgrades.maxHealth ?? 0));
    this.registry.set('maxJumps',  PLAYER.MAX_JUMPS  + (this.upgrades.maxJumps  ?? 0));
    this.registry.set('maxAmmo',   PLAYER.RANGED_MAX_AMMO + (this.upgrades.maxAmmo ?? 0) * 2);
    this.registry.set('regenSpeed', this.upgrades.regenSpeed ?? 0);

    SaveManager.save({
      coins:    this.coins,
      crystals: this.registry.get('crystals') ?? 0,
      upgrades: { ...this.upgrades },
    });

    this.refreshDisplay();
  }

  close() {
    this.scene.stop('ShopScene');
    this.scene.resume('HubScene');
  }
}
