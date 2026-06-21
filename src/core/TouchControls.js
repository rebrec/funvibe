import { GAME } from './Constants.js';

// Contrôles tactiles pour mobile : boutons virtuels, recréés à chaque scène via mount().
// Multi-touch : chaque pointeur est associé à un seul bouton (Map pointerId → button).

const MOBILE_RE = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

// Détection : on affiche les boutons tactiles si l'appareil est mobile OU
// possède un écran tactile. Surcharge possible via l'URL pour pouvoir tester
// depuis un desktop : ?touch=1 (force l'affichage) · ?touch=0 (force le masquage).
function detectTouch() {
  try {
    const q = new URLSearchParams(window.location.search).get('touch');
    if (q === '1' || q === 'true')  return true;
    if (q === '0' || q === 'false') return false;
  } catch { /* ignore */ }
  const uaMobile  = MOBILE_RE.test(navigator.userAgent);
  const hasTouch  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  return uaMobile || hasTouch;
}

export default class TouchControls {
  constructor() {
    this.isMobile     = detectTouch();
    this.inputManager = null;
    this._graphics    = null;
    this._labels      = [];
    this._buttons     = [];
    this._scene       = null;
    this._pointerMap  = new Map(); // pointerId → button
    this._interactBtn = null;      // bouton « ENTRER » contextuel (masqué par défaut)
  }

  // Appeler au create() de chaque scène jouable (HubScene, LevelScene, …).
  mount(scene) {
    this._cleanup();
    this._scene = scene;
    if (!this.isMobile) return;
    this._build(scene);
    // Auto-nettoyage à l'arrêt de la scène. La garde évite qu'un shutdown
    // tardif de l'ancienne scène ne détruise les boutons d'une nouvelle scène
    // déjà montée (ordre Phaser non garanti).
    scene.events.once('shutdown', () => {
      if (this._scene === scene) this._cleanup();
    });
  }

  setInputManager(im) {
    this.inputManager = im;
  }

  // Affiche/masque le bouton « ENTRER » (porte de hub, portail de retour…).
  // Appelé depuis les boucles update des scènes selon la proximité.
  setInteractVisible(v) {
    const b = this._interactBtn;
    if (!b || b.hidden === !v) return; // pas de changement
    b.hidden = !v;
    if (!v) {
      // En masquant, on relâche l'action si elle était maintenue.
      if (b.pressed) {
        b.pressed = false;
        this.inputManager?.setVirtual('interact', false);
        for (const [id, btn] of this._pointerMap) {
          if (btn === b) this._pointerMap.delete(id);
        }
      }
    }
    this._draw();
  }

  // ── Privé ────────────────────────────────────────────────────────────────

  _cleanup() {
    if (this._graphics) { this._graphics.destroy(); this._graphics = null; }
    this._labels.forEach(t => t.destroy());
    this._labels = [];
    if (this._scene) {
      this._scene.input.off('pointerdown', this._onDown, this);
      this._scene.input.off('pointerup',   this._onUp,   this);
      this._scene = null;
    }
    this._pointerMap.clear();
    this.inputManager = null;
  }

  _build(scene) {
    const W = GAME.WIDTH, H = GAME.HEIGHT;
    const S = 76;  // taille des boutons (px jeu)
    const G = 10;  // espace entre boutons
    const M = 16;  // marge bord d'écran
    const y = H - M - S;  // rangée du bas

    this._buttons = [
      // Gauche : D-pad
      { x: M,             y, w: S,    h: S, label: '◀', action: 'left'       },
      { x: M + S + G,     y, w: S,    h: S, label: '▶', action: 'right'      },
      // Droite : actions (ATK à gauche du SAUT, SHU au-dessus)
      { x: W - M - S - G - S, y,           w: S, h: S, label: 'ATK', action: 'attack'     },
      { x: W - M - S,          y,           w: S, h: S, label: '▲',   action: 'jump'       },
      { x: W - M - S,          y: y - S - G, w: S, h: S, label: 'SHU', action: 'ranged' },
      // Fullscreen (coin haut-droit)
      { x: W - M - 52, y: M, w: 52, h: 46, label: '⛶', action: 'fullscreen' },
      // Interaction « ENTRER » : centré en haut, masqué tant qu'on n'est pas
      // près d'une porte / d'un portail (piloté par setInteractVisible).
      { x: W / 2 - 70, y: M, w: 140, h: 48, label: 'ENTRER', action: 'interact', hidden: true },
    ];
    for (const b of this._buttons) b.pressed = false;
    this._interactBtn = this._buttons.find(b => b.action === 'interact');

    this._graphics = scene.add.graphics().setDepth(1000).setScrollFactor(0);

    for (const b of this._buttons) {
      const isLong = b.label.length > 1;
      const t = scene.add.text(b.x + b.w / 2, b.y + b.h / 2, b.label, {
        fontFamily: 'monospace',
        fontSize: isLong ? '13px' : '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(1001).setScrollFactor(0).setVisible(!b.hidden);
      b._label = t;
      this._labels.push(t);
    }

    this._draw();

    scene.input.on('pointerdown', this._onDown, this);
    scene.input.on('pointerup',   this._onUp,   this);
  }

  _draw() {
    const g = this._graphics;
    if (!g) return;
    g.clear();
    for (let i = 0; i < this._buttons.length; i++) {
      const b = this._buttons[i];
      if (b._label) b._label.setVisible(!b.hidden);
      if (b.hidden) continue;
      // Le bouton « ENTRER » se distingue (vert) pour attirer l'œil.
      const accent = b.action === 'interact';
      const alpha = b.pressed ? 0.92 : 0.6;
      const fill  = b.pressed ? (accent ? 0x66dd88 : 0x55bbff)
                              : (accent ? 0x2a8a4a : 0x1a2d55);
      g.fillStyle(fill, alpha);
      g.fillRoundedRect(b.x, b.y, b.w, b.h, 12);
      g.lineStyle(2, b.pressed ? 0xffffff : (accent ? 0x88ffaa : 0x4477aa), b.pressed ? 1 : 0.8);
      g.strokeRoundedRect(b.x, b.y, b.w, b.h, 12);
      if (b._label) b._label.setAlpha(b.pressed ? 1 : 0.9);
    }
  }

  _onDown(pointer) {
    for (const b of this._buttons) {
      if (b.hidden) continue;
      if (!b.pressed && this._hit(pointer, b)) {
        b.pressed = true;
        this._pointerMap.set(pointer.id, b);
        if (b.action === 'fullscreen') {
          this._scene?.scale.toggleFullscreen();
        } else {
          this.inputManager?.setVirtual(b.action, true);
          if (navigator.vibrate) navigator.vibrate(8);
        }
        this._draw();
        break; // un seul bouton par pointeur
      }
    }
  }

  _onUp(pointer) {
    const b = this._pointerMap.get(pointer.id);
    if (b) {
      this._pointerMap.delete(pointer.id);
      b.pressed = false;
      if (b.action !== 'fullscreen') {
        this.inputManager?.setVirtual(b.action, false);
      }
      this._draw();
    }
  }

  _hit(pointer, b) {
    return pointer.x >= b.x && pointer.x <= b.x + b.w
        && pointer.y >= b.y && pointer.y <= b.y + b.h;
  }
}
