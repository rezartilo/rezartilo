/**
 * Bâtiment : sols (bois en expo, béton en réserve), murs du fond pleine
 * hauteur, murs côté caméra coupés bas pour voir l'intérieur.
 */
import { BUILDING as B, RECEIVING } from './layout.ts';
import { Block, PALETTE } from './lowpoly.tsx';

interface WallProps {
  /** Segment horizontal de (x1, z1) à (x2, z2), aligné sur X ou Z. */
  from: [number, number];
  to: [number, number];
  height: number;
  inner?: string;
}

function Wall({ from, to, height, inner = PALETTE.wallInner }: WallProps) {
  const [x1, z1] = from;
  const [x2, z2] = to;
  const alongX = z1 === z2;
  const length = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const t = B.wallThickness;
  const size: [number, number, number] = alongX ? [length, height, t] : [t, height, length];
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  return (
    <group>
      <Block size={size} position={[cx, height / 2, cz]} color={inner} />
      {/* Chaperon pour lire l'épaisseur du mur coupé */}
      <Block
        size={alongX ? [length, 0.06, t + 0.04] : [t + 0.04, 0.06, length]}
        position={[cx, height + 0.03, cz]}
        color={PALETTE.wallTrim}
      />
    </group>
  );
}

export function Building() {
  const { minX, maxX, minZ, maxZ, partitionX, wallHeight: H, cutHeight: h } = B;
  return (
    <group>
      {/* Sols */}
      <Block
        size={[maxX - partitionX, 0.08, maxZ - minZ]}
        position={[(maxX + partitionX) / 2, 0.04, (minZ + maxZ) / 2]}
        color={PALETTE.woodFloor}
        shadows={false}
      />
      <Block
        size={[partitionX - minX, 0.08, maxZ - minZ]}
        position={[(minX + partitionX) / 2, 0.04, (minZ + maxZ) / 2]}
        color={PALETTE.concrete}
        shadows={false}
      />
      {/* Marquage de la zone de réception */}
      <Block
        size={[RECEIVING.maxX - RECEIVING.minX, 0.01, RECEIVING.maxZ - RECEIVING.minZ]}
        position={[(RECEIVING.minX + RECEIVING.maxX) / 2, 0.085, (RECEIVING.minZ + RECEIVING.maxZ) / 2]}
        color="#c9a23a"
        opacity={0.35}
        shadows={false}
      />

      {/* Murs du fond, pleine hauteur */}
      <Wall from={[minX, minZ]} to={[maxX, minZ]} height={H} />
      <Wall from={[minX, minZ]} to={[minX, maxZ]} height={H} inner={PALETTE.concrete} />
      {/* Bandeau intérieur expo + fenêtres éclairées */}
      <Block size={[maxX - partitionX - 0.2, 0.5, 0.05]} position={[(maxX + partitionX) / 2, 2.6, minZ + 0.13]} color={PALETTE.wallTrim} />
      {[-0.6, 2.4, 5.4, 8.4].map((x) => (
        <Block key={x} size={[1.0, 0.5, 0.04]} position={[x, 2.6, minZ + 0.16]} color={PALETTE.sign} />
      ))}
      {[-8, -5].map((x) => (
        <Block key={x} size={[1.4, 0.7, 0.04]} position={[x, 2.4, minZ + 0.13]} color={PALETTE.window} emissive={PALETTE.window} emissiveIntensity={0.6} shadows={false} />
      ))}

      {/* Murs côté caméra, coupés bas, avec ouvertures */}
      <Wall from={[minX, maxZ]} to={[-9.6, maxZ]} height={h} inner={PALETTE.wallOuter} />
      <Wall from={[-5.2, maxZ]} to={[2.8, maxZ]} height={h} inner={PALETTE.wallOuter} />
      <Wall from={[5.2, maxZ]} to={[maxX, maxZ]} height={h} inner={PALETTE.wallOuter} />
      <Wall from={[maxX, minZ]} to={[maxX, maxZ]} height={h} inner={PALETTE.wallOuter} />
      {/* Cloison expo / réserve, avec porte */}
      <Wall from={[partitionX, minZ]} to={[partitionX, 1.6]} height={h + 0.4} inner={PALETTE.wallTrim} />
      <Wall from={[partitionX, 3.4]} to={[partitionX, maxZ]} height={h + 0.4} inner={PALETTE.wallTrim} />

      {/* Tapis d'entrée */}
      <Block size={[2.2, 0.02, 1.0]} position={[4, 0.09, 5.3]} color="#2f3a33" shadows={false} />
    </group>
  );
}
