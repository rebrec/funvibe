import Phaser from 'phaser';
import { GAME, PHYSICS } from './core/Constants.js';
import BootScene from './scenes/BootScene.js';
import LevelScene from './scenes/LevelScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT, // s'adapte à la fenêtre (et au mobile plus tard)
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: PHYSICS.GRAVITY_Y },
      debug: false,
    },
  },
  scene: [BootScene, LevelScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
