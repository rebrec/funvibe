import { GAME } from './Constants.js';

// Contrôles tactiles pour mobile : boutons virtuels en bas d'écran, caché sur desktop.
// Utilise l'API InputManager.setVirtual() existante.

export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.inputManager = null; // sera lié après création
    this.isMobile = this.detectMobile();
    this.buttons = null;
    this.fullscreenBtn = null;

    if (this.isMobile) {
      this.create();
    }
  }

  detectMobile() {
    const ua = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
  }

  create() {
    const scene = this.scene;
    const W = GAME.WIDTH;
    const H = GAME.HEIGHT;
    const btnH = 50;
    const btnW = 60;
    const gap = 8;
    const y = H - btnH - 10;

    // Conteneur graphique pour les boutons (dépth élevé, scrollFactor=0 = fixe à l'écran)
    const g = scene.add.graphics().setDepth(1000).setScrollFactor(0);

    // Touches directionnelles : gauche/droite
    const leftBtn = { x: 10, y, w: btnW, h: btnH, label: '◀', action: 'left', pressed: false };
    const rightBtn = { x: 10 + btnW + gap, y, w: btnW, h: btnH, label: '▶', action: 'right', pressed: false };

    // Saut (au centre bas)
    const jumpBtn = { x: W / 2 - btnW / 2, y, w: btnW * 1.2, h: btnH, label: 'SAUT', action: 'jump', pressed: false };

    // Attaque (droite)
    const attackBtn = { x: W - 10 - btnW, y, w: btnW, h: btnH, label: 'J', action: 'attack', pressed: false };

    // Shuriken (droite, au-dessus)
    const rangedBtn = { x: W - 10 - btnW, y: y - btnH - gap, w: btnW, h: btnH, label: 'K', action: 'ranged', pressed: false };

    this.buttons = [leftBtn, rightBtn, jumpBtn, attackBtn, rangedBtn];

    // Fullscreen button (coin haut-droit)
    this.fullscreenBtn = { x: W - btnW - 10, y: 10, w: btnW, h: btnH, label: '⛶', action: 'fullscreen', pressed: false };
    this.buttons.push(this.fullscreenBtn);

    // Rendu + gestion tactile
    const drawButtons = () => {
      g.clear();
      for (const btn of this.buttons) {
        g.fillStyle(btn.pressed ? 0x66ccff : 0x333366, btn.pressed ? 0.9 : 0.6);
        g.fillRect(btn.x, btn.y, btn.w, btn.h);
        g.lineStyle(2, btn.pressed ? 0xffffff : 0x888899, 0.8);
        g.strokeRect(btn.x, btn.y, btn.w, btn.h);
        g.fillStyle(0xffffff, 1);
        g.setFont(`bold 12px monospace`);
        g.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 4);
      }
    };

    drawButtons();

    // Détection tactile (pointers)
    scene.input.on('pointerdown', (pointer) => {
      for (const btn of this.buttons) {
        if (this.hitTest(pointer, btn)) {
          btn.pressed = true;
          if (btn.action === 'fullscreen') {
            scene.scale.toggleFullscreen();
          } else if (btn.action === 'left') {
            if (this.inputManager) this.inputManager.setVirtual('left', true);
          } else if (btn.action === 'right') {
            if (this.inputManager) this.inputManager.setVirtual('right', true);
          } else if (btn.action === 'jump') {
            if (this.inputManager) this.inputManager.setVirtual('jump', true);
          } else if (btn.action === 'attack') {
            if (this.inputManager) this.inputManager.setVirtual('attack', true);
          } else if (btn.action === 'ranged') {
            if (this.inputManager) this.inputManager.setVirtual('ranged', true);
          }
          drawButtons();
        }
      }
    });

    scene.input.on('pointerup', (pointer) => {
      for (const btn of this.buttons) {
        if (btn.pressed && (btn.action === 'left' || btn.action === 'right' || btn.action === 'attack' || btn.action === 'ranged')) {
          btn.pressed = false;
          if (this.inputManager) this.inputManager.setVirtual(btn.action, false);
        }
      }
      // Jump se relâche aussi mais handled via isJumpHeld (peut rester appuyé)
      const jumpBtn = this.buttons.find((b) => b.action === 'jump');
      if (jumpBtn) {
        jumpBtn.pressed = false;
        if (this.inputManager) this.inputManager.setVirtual('jump', false);
      }
      drawButtons();
    });

    scene.input.on('pointermove', () => {
      drawButtons();
    });
  }

  hitTest(pointer, btn) {
    return pointer.x >= btn.x && pointer.x <= btn.x + btn.w && pointer.y >= btn.y && pointer.y <= btn.y + btn.h;
  }

  setInputManager(inputManager) {
    this.inputManager = inputManager;
  }
}
