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
npm run dev      # http://localhost:5173
npm run build    # vérifie que tout compile (dist/)
```

Je ne peux pas juger le **ressenti** (saut, vitesse, combat) à la place de l'utilisateur :
après chaque changement de feel, je construis (`npm run build`) et je demande un test navigateur.

## Public & ton
Enfants 8 ans et +, doit aussi plaire aux ados/adultes. Univers façon *Ninja Legends*
(personnages fins/agiles) — à concrétiser à la passe artistique.

## Architecture (`src/`)
- `main.js` — config Phaser (physique Matter, scènes), `scale: FIT`.
- `core/Constants.js` — **TOUS les réglages** (gravité, vitesses, saut, combat, ennemis,
  projectiles). C'est ici qu'on ajuste le feel.
- `core/InputManager.js` — abstraction clavier→**actions** (move/jump/attack/ranged/interact).
  **Ne jamais lire le clavier directement dans le gameplay** (pour brancher le tactile mobile plus tard).
- `core/SaveManager.js` — persistance `localStorage` (pièces, cristaux).
- `entities/Player.js` — déplacement, saut/double-saut, vie, attaques (melee + shuriken).
- `entities/Enemy.js` — ennemis (`walker` patrouille+sauts, `charger` charge télégraphiée).
- `entities/Projectile.js` — shuriken (capteur Matter).
- `scenes/BootScene.js` — génère les textures placeholder + charge la sauvegarde.
- `scenes/LevelScene.js` — niveau jouable (plateformes, pentes, collectibles, ennemis, combat, caméra).
- `scenes/UIScene.js` — HUD superposé (pièces, cristaux, shurikens, cœurs).

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
- **M0** déplacement/saut/double-saut, pentes, verticalité, **grand niveau non-linéaire**, caméra anticipée — FAIT.
- **M1** collecte pièces+cristaux, HUD, persistance localStorage — FAIT.
- **M2** combat : ennemis (walker + charger), attaque melee + shuriken (stock régénératif), vie/cœurs,
  dégâts + invincibilité + recul, réapparition — FAIT.
- **Prochain : M3** hub-village jouable + boutique. Puis M4 portes & gating, M5 boss, M6 personnages & maîtrises.

## Commits
Un commit par étape notable, message préfixé du jalon : `Mx: …`. L'utilisateur autorise les commits à ma discrétion.
