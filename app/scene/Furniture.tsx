/**
 * Meubles d'expo (Fixture), rayonnages de réserve (Rack) et articles en vrac
 * posés dessus (StockPlacement). Tout est dérivé de la base.
 */
import { useMemo } from 'react';
import type { Fixture, InventoraDb, Product, Rack, StockPlacement } from '../../src/index.ts';
import {
  FIXTURE_DIMS,
  FIXTURE_SPOTS,
  RACK_DIMS,
  RACK_SPOTS,
  fixtureLevelY,
  itemSlots,
  rackLevelY,
  toWorld,
  type Spot,
} from './layout.ts';
import { Block, Gem, PALETTE, Prism } from './lowpoly.tsx';

// --- Meubles -----------------------------------------------------------------

function FixtureMesh({ fixture }: { fixture: Fixture }) {
  const d = FIXTURE_DIMS[fixture.kind];
  const levels = Array.from({ length: fixture.levels }, (_, i) => fixtureLevelY(fixture.kind, i + 1));
  const top = (levels.at(-1) ?? d.base) + d.levelGap * 0.9;

  switch (fixture.kind) {
    case 'shelf':
    case 'endcap':
      return (
        <group>
          <Block size={[d.width, top, 0.06]} position={[0, top / 2, -d.depth / 2 + 0.03]} color={PALETTE.woodDark} />
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.06, top, d.depth]} position={[(s * (d.width - 0.06)) / 2, top / 2, 0]} color={PALETTE.wood} />
          ))}
          {levels.map((y) => (
            <Block key={y} size={[d.width, 0.05, d.depth]} position={[0, y - 0.025, 0]} color={PALETTE.wood} />
          ))}
          <Block size={[d.width, 0.08, d.depth]} position={[0, top, 0]} color={PALETTE.woodDark} />
        </group>
      );
    case 'gondola':
      return (
        <group>
          <Block size={[d.width, top, 0.06]} position={[0, top / 2, 0]} color={PALETTE.woodDark} />
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.06, top, d.depth]} position={[(s * (d.width - 0.06)) / 2, top / 2, 0]} color={PALETTE.wood} />
          ))}
          {levels.map((y) => (
            <Block key={y} size={[d.width, 0.05, d.depth]} position={[0, y - 0.025, 0]} color={PALETTE.wood} />
          ))}
        </group>
      );
    case 'table':
      return (
        <group>
          <Block size={[d.width, 0.08, d.depth]} position={[0, d.base - 0.04, 0]} color={PALETTE.wood} />
          {[
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
          ].map(([sx, sz]) => (
            <Block
              key={`${sx}${sz}`}
              size={[0.08, d.base - 0.08, 0.08]}
              position={[(sx! * (d.width - 0.2)) / 2, (d.base - 0.08) / 2, (sz! * (d.depth - 0.2)) / 2]}
              color={PALETTE.woodDark}
            />
          ))}
        </group>
      );
    case 'display_case':
      return (
        <group>
          <Block size={[d.width, d.base, d.depth]} position={[0, d.base / 2, 0]} color={PALETTE.woodDark} />
          {levels.slice(1).map((y) => (
            <Block key={y} size={[d.width - 0.1, 0.03, d.depth - 0.1]} position={[0, y - 0.015, 0]} color={PALETTE.glass} opacity={0.5} shadows={false} />
          ))}
          <Block
            size={[d.width, top - d.base, d.depth]}
            position={[0, d.base + (top - d.base) / 2, 0]}
            color={PALETTE.glass}
            opacity={0.25}
            shadows={false}
          />
        </group>
      );
    case 'counter':
      return (
        <group>
          <Block size={[d.width, d.base, d.depth]} position={[0, d.base / 2, 0]} color={PALETTE.wood} />
          <Block size={[d.width + 0.1, 0.06, d.depth + 0.1]} position={[0, d.base + 0.03, 0]} color={PALETTE.woodDark} />
          {/* Caisse */}
          <Block size={[0.4, 0.22, 0.35]} position={[0.7, d.base + 0.17, 0.05]} color="#2b2f36" />
          <Block size={[0.36, 0.22, 0.03]} position={[0.7, d.base + 0.38, -0.08]} rotation={[-0.4, 0, 0]} color="#5fb3c9" emissive="#5fb3c9" emissiveIntensity={0.4} />
        </group>
      );
  }
}

function RackMesh({ rack }: { rack: Rack }) {
  const { width: w, depth: d, levelGap } = RACK_DIMS;
  const levels = Array.from({ length: rack.levels }, (_, i) => rackLevelY(i + 1));
  const top = (levels.at(-1) ?? 0) + levelGap;
  const posts: Array<[number, number]> = [
    [-w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
  ];
  return (
    <group>
      {posts.map(([x, z]) => (
        <Block key={`${x}${z}`} size={[0.07, top, 0.07]} position={[x, top / 2, z]} color={PALETTE.steel} />
      ))}
      {levels.map((y) => (
        <group key={y}>
          <Block size={[w, 0.04, d]} position={[0, y, 0]} color="#7d6a55" />
          {[-1, 1].map((s) => (
            <Block key={s} size={[w, 0.09, 0.05]} position={[0, y - 0.02, (s * d) / 2]} color={PALETTE.beam} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Placed({ spot, children }: { spot: Spot; children: React.ReactNode }) {
  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.rotY, 0]}>
      {children}
    </group>
  );
}

// --- Articles ----------------------------------------------------------------

const CATEGORY_COLORS: Record<string, readonly string[]> = {
  Toys: ['#e0533d', '#3f8fd2', '#f1c232'],
  Plush: ['#c58a5a', '#e9b7c4', '#d9d2c5'],
  Mugs: ['#f2efe8', '#4e9c8f', '#2f4f6e'],
  Candles: ['#f4e1b5', '#e7a7a0', '#b9d3b0'],
  Cards: ['#f6f1e7', '#e55f5f', '#7aa6d8'],
  Books: ['#33577a', '#8a3b3b', '#3f6b4c'],
};

/** Un article low poly ; la forme dépend de la catégorie. Origine = base de l'objet. */
export function ProductItem({ product, variant }: { product: Product; variant: number }) {
  const colors = CATEGORY_COLORS[product.category] ?? ['#b0b0b0'];
  const color = colors[variant % colors.length]!;
  switch (product.category) {
    case 'Mugs':
      return (
        <group>
          <Prism radius={0.07} height={0.16} sides={7} position={[0, 0.08, 0]} color={color} />
          <Block size={[0.03, 0.08, 0.03]} position={[0.085, 0.09, 0]} color={color} />
        </group>
      );
    case 'Candles':
      return (
        <group>
          <Prism radius={0.065} height={0.18} sides={6} position={[0, 0.09, 0]} color={color} />
          <Block size={[0.015, 0.04, 0.015]} position={[0, 0.2, 0]} color="#3a2a1a" shadows={false} />
        </group>
      );
    case 'Plush':
      return (
        <group>
          <Gem radius={0.11} position={[0, 0.1, 0]} color={color} />
          <Gem radius={0.075} position={[0, 0.25, 0]} color={color} />
          {[-1, 1].map((s) => (
            <Gem key={s} radius={0.03} position={[s * 0.05, 0.32, 0]} color={color} />
          ))}
        </group>
      );
    case 'Toys':
      return product.sku.endsWith('2') ? (
        <Block size={[0.22, 0.16, 0.06]} position={[0, 0.08, 0]} color={color} />
      ) : (
        <group>
          <Block size={[0.14, 0.14, 0.1]} position={[0, 0.07, 0]} color={color} />
          <Block size={[0.1, 0.09, 0.09]} position={[0, 0.19, 0]} color="#c9ccd1" />
        </group>
      );
    case 'Cards':
      return <Block size={[0.14, 0.2, 0.02]} position={[0, 0.1, 0]} rotation={[-0.15, 0, 0]} color={color} />;
    case 'Books':
      return <Block size={[0.17, 0.23, 0.05]} position={[0, 0.115, 0]} color={color} />;
    default:
      return <Block size={[0.15, 0.15, 0.15]} position={[0, 0.075, 0]} color={color} />;
  }
}

interface SlotGroup {
  spot: Spot;
  surfaceY: number;
  slots: Array<[number, number]>;
  placements: StockPlacement[];
}

/** Regroupe les placements par emplacement physique, pour les répartir sur le plateau. */
function useSlotGroups(db: InventoraDb): SlotGroup[] {
  return useMemo(() => {
    const groups = new Map<string, SlotGroup>();
    for (const p of db.stockPlacements.values()) {
      let key: string;
      let group: Omit<SlotGroup, 'placements'> | undefined;
      if (p.slot.area === 'showroom') {
        const f = db.fixtures.get(p.slot.fixtureId);
        const spot = f && FIXTURE_SPOTS[f.code];
        key = `f:${p.slot.fixtureId}:${p.slot.level}`;
        if (f && spot) group = { spot, surfaceY: fixtureLevelY(f.kind, p.slot.level), slots: itemSlots(f.kind) };
      } else {
        const r = db.racks.get(p.slot.rackId);
        const spot = r && RACK_SPOTS[r.code];
        key = `r:${p.slot.rackId}:${p.slot.level}`;
        if (r && spot) {
          const cols = 9;
          const slots: Array<[number, number]> = [];
          for (const z of [-0.2, 0.2]) for (let i = 0; i < cols; i++) slots.push([-1.2 + i * 0.3, z]);
          group = { spot, surfaceY: rackLevelY(p.slot.level) + 0.02, slots };
        }
      }
      if (!group) continue;
      const existing = groups.get(key);
      if (existing) existing.placements.push(p);
      else groups.set(key, { ...group, placements: [p] });
    }
    return [...groups.values()];
  }, [db]);
}

function ShelfItems({ db }: { db: InventoraDb }) {
  const groups = useSlotGroups(db);
  return (
    <group>
      {groups.flatMap((g, gi) => {
        let cursor = 0;
        return g.placements.flatMap((p) => {
          const product = db.products.get(p.productId);
          if (!product) return [];
          const items = [];
          // Affichage plafonné à la place disponible sur le plateau.
          for (let i = 0; i < p.quantity && cursor < g.slots.length; i++, cursor++) {
            const [lx, lz] = g.slots[cursor]!;
            const pos = toWorld(g.spot, lx, g.surfaceY, lz);
            items.push(
              <group key={`${gi}-${p.id}-${i}`} position={pos} rotation={[0, g.spot.rotY + (i % 3) * 0.12, 0]}>
                <ProductItem product={product} variant={i} />
              </group>,
            );
          }
          return items;
        });
      })}
    </group>
  );
}

export function Furniture({ db }: { db: InventoraDb }) {
  return (
    <group>
      {[...db.fixtures.values()].map((f) => {
        const spot = FIXTURE_SPOTS[f.code];
        return spot ? (
          <Placed key={f.id} spot={spot}>
            <FixtureMesh fixture={f} />
          </Placed>
        ) : null;
      })}
      {[...db.racks.values()].map((r) => {
        const spot = RACK_SPOTS[r.code];
        return spot ? (
          <Placed key={r.id} spot={spot}>
            <RackMesh rack={r} />
          </Placed>
        ) : null;
      })}
      <ShelfItems db={db} />
    </group>
  );
}
