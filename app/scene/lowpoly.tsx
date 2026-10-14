/**
 * Primitives low poly : peu de faces, flat shading, matériaux mats.
 * Tous les assets de la scène sont composés de ces briques.
 */
import type { ThreeElements } from '@react-three/fiber';
import type { V3 } from './layout.ts';

export const PALETTE = {
  ground: '#3b4250',
  sidewalk: '#7b818d',
  road: '#2a2f38',
  roadLine: '#e8d9a8',
  grass: '#4f6b45',
  wallOuter: '#a2694a',
  wallInner: '#3f5a46',
  wallTrim: '#5b3a28',
  woodFloor: '#8c5a39',
  concrete: '#6c707a',
  wood: '#a8774f',
  woodDark: '#6e4a31',
  steel: '#8a94a3',
  beam: '#d9822b',
  carton: '#c79a62',
  cartonDark: '#a97c47',
  tape: '#e6d3a8',
  glass: '#a9d6e5',
  sign: '#b8322b',
  window: '#ffd27a',
} as const;

type MeshProps = Omit<ThreeElements['mesh'], 'children'>;

interface MatProps {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
}

function Mat({ color, emissive, emissiveIntensity = 0, opacity }: MatProps) {
  const transparent = opacity !== undefined && opacity < 1;
  return (
    <meshStandardMaterial
      color={color}
      flatShading
      roughness={0.85}
      metalness={0.05}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity}
      transparent={transparent}
      opacity={opacity ?? 1}
      depthWrite={!transparent}
    />
  );
}

type PrimitiveProps = MeshProps & MatProps & { shadows?: boolean };

/** Pavé. `size` = [largeur, hauteur, profondeur]. */
export function Block({ size, shadows = true, color, emissive, emissiveIntensity, opacity, ...mesh }: PrimitiveProps & { size: V3 }) {
  return (
    <mesh castShadow={shadows} receiveShadow {...mesh}>
      <boxGeometry args={size} />
      <Mat color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} opacity={opacity} />
    </mesh>
  );
}

/** Cylindre / prisme à peu de côtés (6–8). */
export function Prism({
  radius,
  radiusTop,
  height,
  sides = 7,
  shadows = true,
  color,
  emissive,
  emissiveIntensity,
  opacity,
  ...mesh
}: PrimitiveProps & { radius: number; radiusTop?: number; height: number; sides?: number }) {
  return (
    <mesh castShadow={shadows} receiveShadow {...mesh}>
      <cylinderGeometry args={[radiusTop ?? radius, radius, height, sides]} />
      <Mat color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} opacity={opacity} />
    </mesh>
  );
}

/** Polyèdre à facettes (icosaèdre détail 0) pour têtes, peluches, feuillages. */
export function Gem({ radius, shadows = true, color, emissive, emissiveIntensity, opacity, ...mesh }: PrimitiveProps & { radius: number }) {
  return (
    <mesh castShadow={shadows} receiveShadow {...mesh}>
      <icosahedronGeometry args={[radius, 0]} />
      <Mat color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} opacity={opacity} />
    </mesh>
  );
}

/** Couleur stable dérivée d'une chaîne (pour varier sans aléatoire). */
export function hashHue(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}
