/**
 * Décor autour de la boutique : sol, grille, rue, trottoirs, lampadaires,
 * arbres et immeubles voisins. Purement visuel, rien ne vient de la base.
 */
import { Grid } from '@react-three/drei';
import { MAP, type V3 } from './layout.ts';
import { Block, Gem, PALETTE, Prism } from './lowpoly.tsx';

const W = MAP.maxX - MAP.minX;
const D = MAP.maxZ - MAP.minZ;
const CX = (MAP.minX + MAP.maxX) / 2;
const CZ = (MAP.minZ + MAP.maxZ) / 2;

const ROAD = { minZ: 7.4, maxZ: 13.6 };

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, 0, CZ]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={PALETTE.ground} roughness={1} />
      </mesh>
      {/* Grille de construction, alignée sur le mètre */}
      <Grid
        position={[CX, 0.005, CZ]}
        args={[W, D]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#566074"
        sectionSize={4}
        sectionThickness={1.1}
        sectionColor="#77839a"
        fadeDistance={120}
        fadeStrength={0}
      />
    </group>
  );
}

function Street() {
  const roadZ = (ROAD.minZ + ROAD.maxZ) / 2;
  const roadD = ROAD.maxZ - ROAD.minZ;
  const dashes = [];
  for (let x = MAP.minX + 1; x < MAP.maxX; x += 3) dashes.push(x);
  return (
    <group>
      {/* Trottoirs (sous la boutique et en face) */}
      <Block size={[W, 0.12, 1.4]} position={[CX, 0.06, ROAD.minZ - 0.7]} color={PALETTE.sidewalk} shadows={false} />
      <Block size={[W, 0.12, 1.6]} position={[CX, 0.06, ROAD.maxZ + 0.8]} color={PALETTE.sidewalk} shadows={false} />
      <Block size={[W, 0.04, roadD]} position={[CX, 0.02, roadZ]} color={PALETTE.road} shadows={false} />
      {dashes.map((x) => (
        <Block key={x} size={[1.4, 0.01, 0.14]} position={[x, 0.045, roadZ + 1.2]} color={PALETTE.roadLine} shadows={false} />
      ))}
      {/* Passage piéton devant l'entrée */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Block key={i} size={[0.5, 0.01, roadD - 0.4]} position={[2.2 + i * 0.85, 0.045, roadZ]} color="#d9dade" shadows={false} />
      ))}
    </group>
  );
}

function LampPost({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Prism radius={0.08} height={3.2} sides={6} position={[0, 1.6, 0]} color="#2d3036" />
      <Block size={[0.5, 0.08, 0.1]} position={[0.2, 3.2, 0]} color="#2d3036" />
      <Block size={[0.24, 0.12, 0.24]} position={[0.42, 3.12, 0]} color={PALETTE.window} emissive={PALETTE.window} emissiveIntensity={1.2} shadows={false} />
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Prism radius={0.14} height={1.0} sides={5} position={[0, 0.5, 0]} color="#5b4030" />
      <Gem radius={0.75} position={[0, 1.45, 0]} color={PALETTE.grass} />
      <Gem radius={0.5} position={[0.25, 1.95, 0.1]} color="#5e7d50" />
    </group>
  );
}

function Planter({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Block size={[0.8, 0.45, 0.8]} position={[0, 0.225, 0]} color={PALETTE.woodDark} />
      <Gem radius={0.38} position={[0, 0.65, 0]} color="#4f7a43" />
    </group>
  );
}

/** Immeuble voisin low poly avec fenêtres éclairées. */
function NeighborBuilding({ position, size, color }: { position: V3; size: V3; color: string }) {
  const [w, h, d] = size;
  const windows = [];
  for (let y = 1.2; y < h - 0.6; y += 1.4) {
    for (let x = -w / 2 + 0.8; x < w / 2 - 0.4; x += 1.4) {
      const lit = (Math.round(x * 7 + y * 13) & 3) !== 0;
      windows.push(
        <Block
          key={`${x}-${y}`}
          size={[0.7, 0.8, 0.04]}
          position={[x, y, d / 2 + 0.02]}
          color={lit ? PALETTE.window : '#2b3240'}
          emissive={lit ? PALETTE.window : '#000000'}
          emissiveIntensity={lit ? 0.7 : 0}
          shadows={false}
        />,
      );
    }
  }
  return (
    <group position={position}>
      <Block size={size} position={[0, h / 2, 0]} color={color} />
      <Block size={[w + 0.2, 0.2, d + 0.2]} position={[0, h + 0.1, 0]} color="#3a3236" />
      {windows}
    </group>
  );
}

export function Surroundings() {
  return (
    <group>
      <Ground />
      <Street />
      {/* Lampadaires le long du trottoir de la boutique */}
      {[-14, -2.6, 8.5, 18].map((x) => (
        <LampPost key={x} position={[x, 0.12, ROAD.minZ - 0.3]} />
      ))}
      {[-20, -8, 4, 16].map((x) => (
        <LampPost key={x} position={[x, 0.12, ROAD.maxZ + 0.4]} />
      ))}
      <Planter position={[1.6, 0.12, 6.75]} />
      <Planter position={[6.4, 0.12, 6.75]} />
      {/* Arbres */}
      {(
        [
          [13, 0, 2],
          [15.5, 0, -3],
          [13.5, 0, -8],
          [-13, 0, 3],
          [-15, 0, -4],
          [-22, 0, 18],
          [-12, 0, 19],
          [10, 0, 20],
          [22, 0, 17],
          [21, 0, -1],
          [-28, 0, -18],
          [-30, 0, 6],
          [28, 0, 6],
          [30, 0, -22],
          [-6, 0, -25],
          [14, 0, -24],
          [-30, 0, 27],
          [28, 0, 28],
          [0, 0, 28],
        ] as V3[]
      ).map((p, i) => (
        <Tree key={i} position={p} scale={0.9 + (i % 3) * 0.15} />
      ))}
      {/* Immeubles voisins */}
      <NeighborBuilding position={[-4, 0, -15]} size={[9, 7, 6]} color="#6b4b3e" />
      <NeighborBuilding position={[8, 0, -14.5]} size={[8, 5.5, 5]} color="#7a5a48" />
      <NeighborBuilding position={[-19, 0, -9]} size={[6, 6, 8]} color="#5d5048" />
      <NeighborBuilding position={[20, 0, -13]} size={[7, 8, 7]} color="#695148" />
      <NeighborBuilding position={[-16, 0, 20]} size={[10, 4.5, 5]} color="#5f4a3f" />
      <NeighborBuilding position={[4, 0, 20.5]} size={[12, 5, 5]} color="#715243" />
      <NeighborBuilding position={[20, 0, 20.5]} size={[8, 6.5, 5]} color="#5d4c45" />
      <NeighborBuilding position={[-27, 0, -25]} size={[9, 9, 7]} color="#5a463d" />
      <NeighborBuilding position={[24, 0, -25]} size={[10, 6, 6]} color="#6d5244" />
      <NeighborBuilding position={[-28, 0, 20.5]} size={[8, 7, 5]} color="#634c40" />
    </group>
  );
}
