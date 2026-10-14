# Inventora

Gestion du stock d'une boutique : emplacement des articles (expo et réserve), cartons, livraisons et commandes fournisseurs.

## Structure

| Dossier | Contenu |
|---|---|
| `src/domain/` | Types du domaine (boutique, expo, réserve, cartons, camions, commandes fournisseurs, personnel, mouvements) |
| `src/data/` | Schéma de la base, requêtes dérivées, vérification des invariants |
| `app/` | Scène 3D de la boutique (React Three Fiber + drei), alimentée par le data layer |
| `docs/data-model.md` | Diagramme des relations |

## Commandes

```bash
npm install
npm run dev        # scène 3D sur http://localhost:5173
npm run build      # build de production dans dist/
npm run typecheck  # data layer + app
npm run example    # carton BOX-104 en console
```

## Scène 3D

- **Caméra** : vue isométrique orthographique. Glisser pour se déplacer, molette pour zoomer vers le curseur, pas de rotation. La zone visible ne sort jamais de la carte, et le zoom arrière minimal s'adapte à la taille de la fenêtre.
- **Assets** : tout est low poly (pavés, prismes à 5–8 côtés, icosaèdres), en flat shading.
- **Rendu** : ombres douces (`SoftShadows`, PCSS) et grille au sol (`Grid`).
- **Données** : la scène lit une `InventoraDb` de démonstration (`app/scene/seed.ts`).
  - Meubles, rayonnages et articles viennent de `Fixture`, `Rack` et `StockPlacement`.
  - Les cartons sont placés selon `Carton.location`.
  - Le camion n'apparaît que pour une `Delivery` `arrived` ou `unloading`.
  - Le personnel se place selon sa `Task` en cours.
- **Plan** : le data model ne contient pas de coordonnées 3D. `app/scene/layout.ts` associe chaque code de meuble (`Shelf A3`, `Rack B`…) à une position au sol.
- **Survol** : passer sur un carton affiche sa fiche (contenu, remplissage, emplacement, action en cours) ; passer sur une personne affiche sa tâche.
