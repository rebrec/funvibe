# Backlog — idées, décisions, chantiers, limites connues

> Liste vivante. On y pioche au fil des jalons. Voir [`CAHIER-DES-CHARGES.md`](CAHIER-DES-CHARGES.md)
> pour la vision et [`../CLAUDE.md`](../CLAUDE.md) pour la technique.

## Prochaines étapes
- **M3** : hub-village jouable + boutique (dépenser pièces/cristaux en améliorations) + portes.
- Avant/pendant : régler au ressenti le **fonceur** et les **munitions** de shuriken ; éventuellement
  ajouter un type d'ennemi.

## Idées de bonus / objets (à piocher)
- Soin (cœur à ramasser), **bouclier temporaire**, aimant à pièces, dash, invincibilité courte,
  ralenti du temps, bottes de double/triple saut.
- Objets de progression : **clés** (portes), **fragments de maîtrise**, **recharges de shurikens**.

## Idées de types d'ennemis
- ✅ `walker` (patrouille + sauts), ✅ `charger` (avance, s'arrête en clignotant, puis charge).
- À venir : **volant** (trajectoire aérienne), **tireur** (projectiles), **blindé** (PV élevés,
  faille à exploiter), **gros sauteur**.

## Mécaniques à implémenter
- **Plateformes/pentes « semi-traversables »** : passer au travers par en dessous (saut qui
  traverse puis on se pose dessus), tout en gardant des surfaces pleines (ex. plafond d'un tunnel
  dans la montagne, infranchissable). Via filtrage de collision conditionnel (position/vitesse
  verticale, ou type de surface one-way vs pleine).
- **Améliorations évolutives** (boutique/maîtrises) à brancher sur des constantes déjà prêtes :
  nombre de sauts (`MAX_JUMPS` : double→triple→x4…), shurikens (stock max, vitesse de recharge,
  cadence de lancer), saut plus haut, vie max, dégâts.
- **Maîtrises & pouvoirs de franchissement** (vol, planer, triple saut) qui ouvrent des zones/portes.

## Chantiers techniques
- **Données de niveau** (JSON / Tiled) + éditeur léger, au lieu de coder les niveaux en dur
  (prérequis pour de longs niveaux non-linéaires et grands mondes).
- **Culling / découpage en chunks** des corps physiques et visuels pour les **grands mondes**
  (largeur ET hauteur très étendues).
- **Suivi « déjà ramassé » par niveau** dans la sauvegarde (actuellement, au rechargement, les
  collectibles réapparaissent alors que les totaux persistent → re-ramassables).
- **Contrôles tactiles mobiles** : brancher des boutons à l'écran sur `InputManager` (déjà abstrait).
- Build : un seul gros chunk (Phaser). Acceptable ; à optimiser plus tard si besoin.

## Esthétique (passe artistique — à valider plus tard)
- Choix du style (dessiné-main vs vectoriel cartoon), couleurs, ambiance.
- Personnages **plus fins et hauts**, agiles, façon *Ninja Legends* (les placeholders actuels
  font « Mario/blob » — volontairement temporaire).
- Vraies **animations** : course, saut, attaque, **mort** (l'écrasement actuel est un placeholder).
- Apparence des projectiles, ennemis, décors, effets de coups.

## Réglages de feel à affiner (au ressenti, dans `core/Constants.js`)
- Saut : `JUMP_VELOCITY`, `GRAVITY_Y`, `MAX_FALL_SPEED`, `RUN_SPEED` (valeurs premier jet sous Matter).
- Caméra : `CAM_LOOKAHEAD_X/Y` et leurs lerp.
- Combat : portée/durée de la frappe, recul/invincibilité, cadence/stock/recharge des shurikens.
- Placement des collectibles aériens (sur l'arc de saut réel).

## Limites connues (acceptables au stade maquette)
- Collectibles re-ramassables après rechargement (cf. chantier « déjà ramassé »).
- Vie non persistée (repart au max à chaque session/réapparition) — voulu.
- Niveaux codés en dur (cf. chantier « données de niveau »).
- Visuels = placeholders.
