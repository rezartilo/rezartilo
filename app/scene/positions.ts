/** Positions monde des entrées de réserve (pour balises et recentrage caméra). */
import type { CartonId, InventoraDb } from '../../src/index.ts';
import type { ReserveEntry } from '../inventory/reserve.ts';
import { RACK_DIMS, RACK_SPOTS, RECEIVING, rackLevelY, toWorld, type V3 } from './layout.ts';

export function entryWorldPosition(db: InventoraDb, entry: ReserveEntry, cartonPos: ReadonlyMap<CartonId, V3>): V3 | null {
  if (entry.source.kind === 'carton') return cartonPos.get(entry.source.cartonId) ?? null;
  if (entry.place.kind === 'receiving') {
    return [(RECEIVING.minX + RECEIVING.maxX) / 2, 0.3, (RECEIVING.minZ + RECEIVING.maxZ) / 2];
  }
  const rack = db.racks.get(entry.place.rackId);
  const spot = rack && RACK_SPOTS[rack.code];
  if (!spot) return null;
  return toWorld(spot, 0, rackLevelY(entry.place.level) + 0.2, 0);
}

export function centroid(points: readonly V3[]): V3 | null {
  if (points.length === 0) return null;
  const s = points.reduce<V3>((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
  return [s[0] / points.length, s[1] / points.length, s[2] / points.length];
}

/** Centre du haut d'un rayonnage (pour son étiquette). */
export function rackTop(rackCode: string, levels: number): V3 | null {
  const spot = RACK_SPOTS[rackCode];
  if (!spot) return null;
  return toWorld(spot, 0, rackLevelY(levels) + RACK_DIMS.levelGap + 0.25, 0);
}
