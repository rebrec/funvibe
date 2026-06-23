import Phaser from 'phaser';
import { GAME, PHYSICS } from './core/Constants.js';
import BootScene from './scenes/BootScene.js';
import HubScene from './scenes/HubScene.js';
import LevelScene from './scenes/LevelScene.js';
import UIScene from './scenes/UIScene.js';
import ShopScene from './scenes/ShopScene.js';
import SkinDebugScene from './scenes/SkinDebugScene.js';
import CustomLevelsScene from './scenes/CustomLevelsScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: GAME.BACKGROUND,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'parent',
    expandParent: false, // on gère la taille du parent via CSS position:fixed
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: PHYSICS.GRAVITY_Y },
      debug: false, // passer à true pour visualiser les corps physiques
    },
  },
  scene: [BootScene, HubScene, LevelScene, UIScene, ShopScene, SkinDebugScene, CustomLevelsScene],
};

const game = new Phaser.Game(config);
// Exposé pour les tests automatisés (Playwright). Inoffensif en prod.
if (typeof window !== 'undefined') window.__game = game;

// En FIT, Phaser écoute le resize fenêtre, mais le passage plein écran
// (déclenché sur documentElement depuis index.html) et la rotation mobile
// ne provoquent pas toujours un recalcul → canvas resté petit, bandes énormes.
// On force un refresh après ces transitions (léger délai = viewport stabilisé).
if (typeof window !== 'undefined') {
  const refresh = () => game.scale.refresh();
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', () => setTimeout(refresh, 120));
  document.addEventListener('fullscreenchange',       () => setTimeout(refresh, 120));
  document.addEventListener('webkitfullscreenchange', () => setTimeout(refresh, 120));
  if (screen.orientation?.addEventListener) {
    screen.orientation.addEventListener('change', () => setTimeout(refresh, 120));
  }
}
