/**
 * Scène complète : lumière, ombres douces, décor, et tout ce qui vient de la
 * base (meubles, articles, cartons, camions, personnel), plus les repères de
 * recherche et de sélection.
 */
import { SoftShadows } from '@react-three/drei';
import { useMemo } from 'react';
import type { DeliveryId, InventoraDb, ProductId, RackId } from '../../src/index.ts';
import { reserveEntries } from '../inventory/reserve.ts';
import type { Focus, Selection } from '../ui/state.ts';
import { Building } from './Building.tsx';
import { Cartons } from './Cartons.tsx';
import { Furniture } from './Furniture.tsx';
import { MAP, placeCartons } from './layout.ts';
import { Beacon } from './Markers.tsx';
import { entryWorldPosition } from './positions.ts';
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

/** Une balise par emplacement de réserve où se trouve l'article recherché. */
function SearchBeacons({ db, productId }: { db: InventoraDb; productId: ProductId }) {
  const beacons = useMemo(() => {
    const cartonPos = placeCartons(db);
    return reserveEntries(db)
      .filter((e) => e.productId === productId)
      .flatMap((e) => {
        const p = entryWorldPosition(db, e, cartonPos);
        if (!p) return [];
        const where = e.source.kind === 'carton' ? e.source.cartonCode : 'vrac';
        return [{ key: `${e.source.kind}-${e.source.kind === 'carton' ? e.source.cartonId : e.source.placementId}`, p, label: `${e.quantity} · ${where}` }];
      });
  }, [db, productId]);
  return (
    <>
      {beacons.map((b) => (
        <Beacon key={b.key} position={b.p} label={b.label} />
      ))}
    </>
  );
}

export interface ShopSceneProps {
  db: InventoraDb;
  selection: Selection;
  onSelectRack: (id: RackId) => void;
  onSelectTruck: (id: DeliveryId) => void;
  highlightProductId: ProductId | null;
  focus: Focus | null;
}

export function ShopScene({ db, selection, onSelectRack, onSelectTruck, highlightProductId, focus }: ShopSceneProps) {
  return (
    <>
      <color attach="background" args={['#1c212b']} />
      <SoftShadows size={18} samples={12} focus={0.6} />
      <Lights />
      <StrategyCamera focus={focus} />
      <Surroundings />
      <Building />
      <Furniture db={db} selectedRackId={selection?.kind === 'rack' ? selection.rackId : null} onSelectRack={onSelectRack} />
      <Cartons db={db} highlightProductId={highlightProductId} />
      <Trucks db={db} selectedDeliveryId={selection?.kind === 'truck' ? selection.deliveryId : null} onSelectTruck={onSelectTruck} />
      <Staff db={db} />
      {highlightProductId && <SearchBeacons db={db} productId={highlightProductId} />}
    </>
  );
}
