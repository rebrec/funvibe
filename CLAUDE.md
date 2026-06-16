# jeuleo — guide projet (lu automatiquement par Claude Code)

Jeu d'**aventure-plateforme 2D** (vue de côté) en **Phaser 3 + Vite**, physique **Matter.js**.
Au stade **maquette** : on valide gameplay / ressenti / mécaniques avec des **placeholders**
(formes colorées), l'art réel viendra plus tard.

➡️ **Vision complète & jalons** : [`docs/CAHIER-DES-CHARGES.md`](docs/CAHIER-DES-CHARGES.md)
➡️ **Idées, décisions, chantiers, limites connues** : [`docs/BACKLOG.md`](docs/BACKLOG.md)

## Lancer / construire

> ⚠️ **Piège** : le Node par défaut du système est en v14 (trop vieux pour Vite).
> Toujours faire `nvm use` dans ce dossier d'abord (un `.nvmrc` pointe sur Node 22).

```bash
nvm use          # bascule sur Node 22
npm install
npm run dev      # http://localhost:5173  · /editor/ (éditeur) · /preview/ (aperçu sprites)
npm run build    # vérifie que tout compile (dist/ multi-pages : main + editor + preview)
npm test         # Vitest (fonctions pures : WorldLoader, Skins, curve)
npm run report   # tests + build + captures Playwright → tests-output/<horodatage>/ (gitignoré)
```

**Fullscreen** : F11 natif (Phaser scale config `fullscreenTarget`, `expandParent`) ; bouton ⛶ en haut-droit sur mobile.
**Mobile/Tactile** : contrôles tactiles (boutons virtuels) : gauche/droite/saut/attaque/shuriken, caché sur desktop, auto-détecté sur mobile via UA.
**Déploiement** : GitHub Pages via workflow GitHub Actions (`.github/workflows/deploy.yml`) — déclenché à chaque push sur main/master. Build → déploie `dist/` vers `/funvibe/` (base URL paramétrable).

Je ne peux pas juger le **ressenti** (saut, vitesse, combat, zoom) à la place de l'utilisateur :
après chaque changement de feel, je construis (`npm run build`), je vérifie le rendu via
`npm run report` (captures réelles), puis je demande un test navigateur.

## Public & ton
Enfants 8 ans et +, doit aussi plaire aux ados/adultes. Univers façon *Ninja Legends*
(personnages fins/agiles) — à concrétiser à la passe artistique.

## Architecture
- `src/main.js` — config Phaser (Matter, scènes : Boot/Hub/Level/UI/Shop/SkinDebug/CustomLevels), `scale: FIT, fullscreenTarget, expandParent`.
- `src/core/Constants.js` — **TOUS les réglages** (gravité, vitesses, saut, combat, ennemis, projectiles, boutique).
- `src/core/InputManager.js` — abstraction clavier→**actions**. **Ne jamais lire le clavier dans le gameplay**. Supporte entrées virtuelles (`setVirtual`) pour les contrôles tactiles.
- `src/core/TouchControls.js` — boutons tactiles sur mobile (détection UA) ; rendu Canvas, interaction pointerdown/up → `InputManager.setVirtual()`.
- `src/core/SaveManager.js` — persistance `localStorage` (pièces, cristaux, upgrades).
- `src/core/Skins.js` — **textures/anims procédurales** : `generatePlayerTexture` = spritesheet articulée 16 frames (idle/course/saut/chute/atterrissage/rotation-boule/touché), `generateEnemyTexture` 2 frames ; thèmes + décors. Clé de texture paramétrable → brancher des **PNG** plus tard.
- `src/data/levels/*.json` — **niveaux en données** (`level1.json` démo, `hub.json`). Types : ground/platform/wall/slope/curve (pente douce)/island (île fermée)/landmark + enemies/coins/crystals/start/finish/hubPortal/horizon/camera/world.
- `src/world/WorldLoader.js` — `build(scene, data, theme)` instancie le niveau. `src/world/curve.js` — `smoothCurve()` (Catmull-Rom, pentes douces Sonic).
- `src/entities/` — `Player.js` (déplacement, multi-saut + anims + pirouette), `Enemy.js` (walker/charger + anim), `Projectile.js` (shuriken), `WeaponVisual.js` (poing/arme).
- `src/scenes/` — Boot (textures+anims+save), Hub (bouton ÉDITEUR, portail CUSTOM), Level (WorldLoader, finish, **zoom adaptatif**), UI (HUD + aide **hors zoom**), Shop, SkinDebug (F2), CustomLevels.
- `editor/` — **éditeur de niveaux externe** (page Vite, Canvas, glisser-déposer) ; échange via `localStorage.customLevels`.
- `preview/` — page d'aperçu des sprites/anims. `scripts/report.mjs` — captures Playwright. `tests/` — Vitest.

## Conventions importantes
- **Mouvement kinématique** : on pilote la **vitesse** à la main (pas de forces), pour un feel précis.
- **Pentes** : sur une pente, le joueur suit la **tangente** de la surface (montée plus lente) ;
  à l'arrêt au sol on coupe sa gravité (`setIgnoreGravity`) pour ne pas glisser.
- **Détection de sol** : via la normale de contact Matter (on ignore capteurs et ennemis).
- **Ennemis** : `collisionFilter.group = -1` → ils se traversent entre eux, restent solides au sol/joueur.
- **Réglages de feel** = constantes (valeurs souvent "premier jet", à affiner au ressenti).
- Beaucoup de stats sont pensées **évolutives** (boutique/maîtrises) : nombre de sauts (`MAX_JUMPS`),
  stock/recharge/cadence des shurikens, etc.

## État d'avancement
- **M0** déplacement/saut/double-saut, pentes, verticalité, grand niveau, caméra anticipée — FAIT.
- **M1** collecte pièces+cristaux, HUD, persistance localStorage — FAIT.
- **M2** combat : walker + charger, melee + shuriken (stock régénératif, 1 tir = 1 cible), cœurs,
  invincibilité + recul, réapparition — FAIT.
- **M3** hub-village jouable + boutique d'upgrades — FAIT.
- **M4 (en cours)** refonte assets/architecture : skins/anims procéduraux articulés + rotation au saut ;
  thèmes/décors ; **niveaux en JSON + WorldLoader** ; **pentes douces (curve) type Sonic** ;
  **éditeur de niveaux externe** (`editor/`, localStorage) + niveaux custom jouables ;
  **zoom caméra adaptatif** ; multi-sauts jusqu'à 15 (boutique) ; tests Vitest + captures Playwright.
- **Prochain** : portes & gating, boss, personnages & maîtrises ; passe artistique (vrais PNG via le pipeline de skins).

## Commits
Un commit par étape notable, message préfixé du jalon : `Mx: …`. L'utilisateur autorise les commits à ma discrétion.
