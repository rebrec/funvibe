# jeuleo — maquette

Maquette d'un jeu d'aventure-plateforme 2D (Phaser 3). Voir le cahier des charges
pour la vision complète et les jalons.

## Prérequis

Node **18+** (testé sur Node 22). Le dépôt fournit un `.nvmrc` :

```bash
nvm use      # bascule sur Node 22 (sinon : nvm install 22)
npm install
```

> ⚠️ Le Node par défaut du système est ici en v14, trop ancien pour Vite. Pense à
> faire `nvm use` dans ce dossier avant de lancer les commandes.

## Lancer

```bash
npm run dev      # serveur de dev (http://localhost:5173)
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build
```

## État actuel — Jalon M0 (sensations de plateforme)

Une scène jouable pour valider le « feel » du déplacement :

- course avec accélération/freinage,
- saut + **double-saut**,
- **coyote time** (on peut sauter juste après avoir quitté un bord),
- **jump buffering** (un appui juste avant l'atterrissage est mémorisé),
- **hauteur de saut variable** (relâcher tôt = saut plus court),
- caméra qui suit (horizontale **et verticale**),
- **grand niveau non-linéaire** (droite → tour d'escalade → gauche en hauteur → descente → repère),
- **pentes** (douces et escarpées, dans les deux sens) sur lesquelles le héros marche
  plus lentement en montée, plus un trou à franchir.

> Physique : **Matter.js** (gère nativement pentes et terrains complexes). Le
> mouvement est piloté à la main (vitesse) pour garder un "feel" précis : sur une
> pente le héros suit la tangente de la surface. Réglages dans `src/core/Constants.js`
> (valeurs de premier jet, à affiner au ressenti). Mettre `debug: true` dans
> `src/main.js` pour visualiser les corps physiques.

### Jalon M1 (collecte & HUD)

- **Pièces** (cercles jaunes) et **cristaux** (losanges cyan) à ramasser dans le niveau.
- **HUD** en haut à droite avec les deux compteurs (`UIScene`, scène superposée).
- **Persistance** via `localStorage` (`SaveManager`) : les totaux survivent au rechargement.

> Limite connue (acceptable au stade maquette) : au rechargement, les collectibles
> réapparaissent dans le niveau alors que les totaux persistent — on pourra donc
> les re-ramasser. Le suivi « déjà ramassé » par niveau viendra avec le format de
> données de niveau.

### Jalon M2 (combat de base)

- **Ennemis** (carrés rouges) qui patrouillent sur leurs plateformes.
- **Frappe** au corps-à-corps (`J` / `X`) : zone d'attaque devant le héros.
- **Lancer** à distance (`K` / `L`) : un shuriken file devant le héros, touche les
  ennemis et disparaît au contact d'un mur (prototype de variété d'attaques).
- Ennemis avec **PV** (1 ou 2 coups), sauts occasionnels, ils se traversent entre eux.
- **Vie** affichée en cœurs (haut-gauche). Contact d'un ennemi = -1 cœur, avec
  **invincibilité brève + recul + clignotement**. À 0 cœur : réapparition au départ.
- La vie n'est PAS persistée (repart au max à chaque session / réapparition) ;
  seuls pièces et cristaux le sont.

**Commandes** : Flèches / `A`-`D` pour se déplacer, `Espace` / `↑` / `W` pour sauter.

Tous les réglages du mouvement sont dans `src/core/Constants.js` (à ajuster pour le feel).

## Structure

```
src/
  main.js               config Phaser + scènes
  core/
    Constants.js        réglages (gravité, vitesses, saut...)
    InputManager.js      abstraction clavier/tactile -> actions
    SaveManager.js      persistance localStorage (pièces, cristaux...)
  entities/
    Player.js           déplacement, saut, double-saut, vie, attaque
    Enemy.js            ennemi qui patrouille (PV, sauts)
    Projectile.js       shuriken (attaque à distance)
  scenes/
    BootScene.js        génère les textures + charge la sauvegarde
    LevelScene.js       le niveau jouable + collectibles + ennemis
    UIScene.js          HUD superposé (compteurs + cœurs)
```

Prochains jalons : hub-village + boutique (M3),
portes & gating (M4), boss (M5), personnages & maîtrises (M6).
