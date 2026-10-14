/**
 * Plan au sol de la scène. Le data model décrit QUOI est OÙ de façon logique
 * (« Rack B, niveau 2 ») ; ce fichier dit où ces lieux se trouvent en 3D.
 * Unités : mètres. Axe Y vers le haut, la rue est côté +Z.
 */
import type { Carton, CartonId, FixtureKind, InventoraDb } from '../../src/index.ts';

export type V3 = [number, number, number];

/** Limites de la carte : la caméra ne peut pas en sortir. */
export const MAP = { minX: -34, maxX: 34, minZ: -30, maxZ: 32 } as const;

/** Emprise du bâtiment. Expo à l'est de la cloison, réserve à l'ouest. */
export const BUILDING = {
  minX: -10,
  maxX: 10,
  minZ: -6,
  maxZ: 6,
  partitionX: -2,
  wallHeight: 3.2,
  cutHeight: 0.4, // murs « coupés » côté caméra, comme dans un jeu de gestion
  wallThickness: 0.2,
} as const;

/** Zone de réception des cartons, dans la réserve, près de la porte de quai. */
export const RECEIVING = { minX: -9.4, maxX: -5.4, minZ: 3.4, maxZ: 5.6 } as const;

/** Emplacement du camion à quai : l'arrière est contre le trottoir, face à la réception. */
export const DOCK = { x: -7.4, z: 8.0 } as const;

export interface Spot {
  readonly x: number;
  readonly z: number;
  /** Rotation autour de Y. 0 = la face avant du meuble regarde +Z. */
  readonly rotY: number;
}

const HALF_PI = Math.PI / 2;

/** Position de chaque meuble d'expo, par son code (Fixture.code). */
export const FIXTURE_SPOTS: Readonly<Record<string, Spot>> = {
  'Shelf A1': { x: 0.6, z: -5.6, rotY: 0 },
  'Shelf A2': { x: 3.4, z: -5.6, rotY: 0 },
  'Shelf A3': { x: 6.2, z: -5.6, rotY: 0 },
  'Shelf D1': { x: -1.6, z: -2.4, rotY: HALF_PI },
  'Gondola B1': { x: 1.8, z: -1.9, rotY: 0 },
  'Gondola B2': { x: 5.4, z: -1.9, rotY: 0 },
  'Table T1': { x: 1.9, z: 2.0, rotY: 0 },
  'Endcap E1': { x: 5.0, z: 1.8, rotY: 0 },
  'Vitrine V1': { x: 9.2, z: -3.4, rotY: -HALF_PI },
  'Comptoir C1': { x: 8.0, z: 3.0, rotY: 0 },
};

/** Position de chaque rayonnage de réserve, par son code (Rack.code). */
export const RACK_SPOTS: Readonly<Record<string, Spot>> = {
  'Rack A': { x: -9.4, z: -2.6, rotY: HALF_PI },
  'Rack B': { x: -6.4, z: -5.4, rotY: 0 },
  'Rack C': { x: -9.4, z: 0.9, rotY: HALF_PI },
  'Rack D': { x: -2.6, z: -3.0, rotY: -HALF_PI },
};

export interface FixtureDims {
  readonly width: number;
  readonly depth: number;
  /** Hauteur du plateau du niveau 1. */
  readonly base: number;
  /** Écart vertical entre deux niveaux. */
  readonly levelGap: number;
  /** Rangées d'articles par niveau, en Z local (2 = gondole double face). */
  readonly rows: readonly number[];
}

export const FIXTURE_DIMS: Readonly<Record<FixtureKind, FixtureDims>> = {
  shelf: { width: 2.4, depth: 0.5, base: 0.2, levelGap: 0.5, rows: [0.02] },
  gondola: { width: 2.6, depth: 1.0, base: 0.15, levelGap: 0.48, rows: [-0.26, 0.26] },
  table: { width: 1.8, depth: 1.0, base: 0.8, levelGap: 0, rows: [-0.22, 0.22] },
  endcap: { width: 1.2, depth: 0.8, base: 0.15, levelGap: 0.48, rows: [0.1] },
  display_case: { width: 1.4, depth: 0.7, base: 0.55, levelGap: 0.42, rows: [0] },
  counter: { width: 2.4, depth: 0.8, base: 1.0, levelGap: 0, rows: [0] },
};

export const RACK_DIMS = { width: 2.8, depth: 0.9, base: 0.12, levelGap: 0.78 } as const;

export const CARTON_SIZE: V3 = [0.6, 0.44, 0.46];
const CARTONS_PER_ROW = 4;

/** Transforme une position locale au meuble en position monde. */
export function toWorld(spot: Spot, lx: number, ly: number, lz: number): V3 {
  const c = Math.cos(spot.rotY);
  const s = Math.sin(spot.rotY);
  return [spot.x + lx * c + lz * s, ly, spot.z - lx * s + lz * c];
}

export function fixtureLevelY(kind: FixtureKind, level: number): number {
  const d = FIXTURE_DIMS[kind];
  return d.base + (level - 1) * d.levelGap;
}

export function rackLevelY(level: number): number {
  return RACK_DIMS.base + (level - 1) * RACK_DIMS.levelGap;
}

/** Positions locales (x, z) disponibles pour des articles sur un niveau. */
export function itemSlots(kind: FixtureKind, spacing = 0.27): Array<[number, number]> {
  const d = FIXTURE_DIMS[kind];
  const cols = Math.max(1, Math.floor((d.width - 0.2) / spacing));
  const startX = -((cols - 1) * spacing) / 2;
  const out: Array<[number, number]> = [];
  for (const z of d.rows) for (let i = 0; i < cols; i++) out.push([startX + i * spacing, z]);
  return out;
}

/** Position monde d'un carton posé dans la boutique (hors camion). */
export function cartonWorldPosition(db: InventoraDb, carton: Carton, index: number): V3 | null {
  const [w, h] = CARTON_SIZE;
  const col = index % CARTONS_PER_ROW;
  const stack = Math.floor(index / CARTONS_PER_ROW);
  const loc = carton.location;

  switch (loc.kind) {
    case 'backroom': {
      const rack = db.racks.get(loc.rackId);
      const spot = rack && RACK_SPOTS[rack.code];
      if (!spot) return null;
      const lx = -RACK_DIMS.width / 2 + 0.4 + col * (w + 0.06);
      return toWorld(spot, lx, rackLevelY(loc.level) + 0.04 + h / 2 + stack * h, 0);
    }
    case 'showroom': {
      const f = db.fixtures.get(loc.fixtureId);
      const spot = f && FIXTURE_SPOTS[f.code];
      if (!f || !spot) return null;
      const lx = -FIXTURE_DIMS[f.kind].width / 2 + 0.35 + col * (w + 0.06);
      return toWorld(spot, lx, fixtureLevelY(f.kind, loc.level) + 0.04 + h / 2 + stack * h, 0);
    }
    case 'receiving': {
      const perRow = 4;
      const x = RECEIVING.minX + 0.5 + (index % perRow) * 0.95;
      const z = RECEIVING.minZ + 0.5 + Math.floor(index / perRow) * 0.95;
      return [x, h / 2, z];
    }
    default:
      return null; // camion : rendu par le camion ; jeté / renvoyé : invisible
  }
}

/** Positions monde de tous les cartons présents en boutique (hors camion). */
export function placeCartons(db: InventoraDb): Map<CartonId, V3> {
  const countByPlace = new Map<string, number>();
  const out = new Map<CartonId, V3>();
  for (const c of db.cartons.values()) {
    const l = c.location;
    const key =
      l.kind === 'backroom' ? `r:${l.rackId}:${l.level}` : l.kind === 'showroom' ? `f:${l.fixtureId}:${l.level}` : l.kind;
    const index = countByPlace.get(key) ?? 0;
    const position = cartonWorldPosition(db, c, index);
    if (!position) continue;
    countByPlace.set(key, index + 1);
    out.set(c.id, position);
  }
  return out;
}

/** Position monde devant un carton, là où se tient la personne qui le manipule. */
export function standInFront(db: InventoraDb, carton: Carton, at: V3): V3 {
  const loc = carton.location;
  let spot: Spot | undefined;
  if (loc.kind === 'backroom') {
    const r = db.racks.get(loc.rackId);
    spot = r && RACK_SPOTS[r.code];
  } else if (loc.kind === 'showroom') {
    const f = db.fixtures.get(loc.fixtureId);
    spot = f && FIXTURE_SPOTS[f.code];
  }
  if (!spot) return [at[0] + 0.7, 0, at[2] + 0.7];
  const [dx, , dz] = toWorld({ x: 0, z: 0, rotY: spot.rotY }, 0, 0, 1.0);
  return [at[0] + dx, 0, at[2] + dz];
}
