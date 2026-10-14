/**
 * Scène complète : lumière, ombres douces, décor, et tout ce qui vient de la
 * base (meubles, articles, cartons, camions, personnel).
 */
import { SoftShadows } from '@react-three/drei';
import type { InventoraDb } from '../../src/index.ts';
import { Building } from './Building.tsx';
import { Cartons } from './Cartons.tsx';
import { Furniture } from './Furniture.tsx';
import { MAP } from './layout.ts';
import { Staff } from './Staff.tsx';
import { StrategyCamera } from './StrategyCamera.tsx';
import { Surroundings } from './Surroundings.tsx';
import { Trucks } from './Trucks.tsx';

const SHADOW_HALF = Math.max(MAP.maxX - MAP.minX, MAP.maxZ - MAP.minZ) / 2 + 2;

function Lights() {
  return (
    <>
      <hemisphereLight args={['#c9d6ff', '#3a2f28', 0.9]} />
      <directionalLight
        position={[-14, 26, 12]}
        intensity={2.2}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      {/* Lumière chaude d'intérieur, sans ombre portée */}
      <pointLight position={[4, 2.8, 0]} intensity={18} distance={12} color="#ffc27a" />
      <pointLight position={[-6, 2.8, 0]} intensity={10} distance={10} color="#ffe6c4" />
    </>
  );
}

export function ShopScene({ db }: { db: InventoraDb }) {
  return (
    <>
      <color attach="background" args={['#1c212b']} />
      <SoftShadows size={18} samples={12} focus={0.6} />
      <Lights />
      <StrategyCamera />
      <Surroundings />
      <Building />
      <Furniture db={db} />
      <Cartons db={db} />
      <Trucks db={db} />
      <Staff db={db} />
    </>
  );
}
