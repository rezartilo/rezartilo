/**
 * Camions à quai : une livraison `arrived` ou `unloading` fait apparaître son
 * camion devant la réception, avec les cartons encore `in_truck` dans la caisse.
 */
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Delivery, DeliveryId, DeliveryTruck, InventoraDb } from '../../src/index.ts';
import { SelectionFrame } from './Markers.tsx';
import { CARTON_SIZE, DOCK } from './layout.ts';
import { InteractiveCarton } from './Cartons.tsx';
import { Block, PALETTE, Prism, hashHue } from './lowpoly.tsx';

const BODY_COLORS = ['#d8d4cb', '#3f7cb3', '#c0583a', '#5c8a4f'];
const CARGO = { width: 2.2, length: 3.8, height: 2.0, floor: 0.75 };
const CUT = 0.45;

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.38, z]} rotation={[0, 0, Math.PI / 2]}>
      <Prism radius={0.38} height={0.28} sides={8} color="#1f2125" />
      <Prism radius={0.18} height={0.3} sides={6} color="#9aa0a8" shadows={false} />
    </group>
  );
}

function TruckMesh({ truck, delivery, db }: { truck: DeliveryTruck; delivery: Delivery; db: InventoraDb }) {
  const color = BODY_COLORS[hashHue(truck.id) % BODY_COLORS.length]!;
  const { width: W, length: L, height: H, floor: F } = CARGO;
  const t = 0.08;
  const cartons = [...db.cartons.values()].filter(
    (c) => c.location.kind === 'in_truck' && c.location.deliveryId === delivery.id,
  );
  const [cw, ch, cd] = CARTON_SIZE;

  // Repère local : l'arrière de la caisse est en z = 0, la cabine vers +Z.
  return (
    <group>
      {/* Châssis */}
      <Block size={[W - 0.2, 0.25, L + 2.2]} position={[0, 0.55, (L + 2.2) / 2]} color="#2c2f35" />
      {/* Caisse ouverte sur le dessus (vue en coupe) */}
      <Block size={[W, t, L]} position={[0, F, L / 2]} color="#4b4f57" />
      {/* Paroi gauche pleine ; paroi droite (côté caméra) coupée bas pour voir le chargement */}
      <Block size={[t, H, L]} position={[-(W - t) / 2, F + H / 2, L / 2]} color={color} />
      <Block size={[t, CUT, L]} position={[(W - t) / 2, F + CUT / 2, L / 2]} color={color} />
      <Block size={[W, H, t]} position={[0, F + H / 2, L - t / 2]} color={color} />
      {/* Bandes latérales */}
      <Block size={[0.02, 0.25, L - 0.4]} position={[-(W / 2 + 0.01), F + 1.2, L / 2]} color={PALETTE.beam} shadows={false} />
      {/* Portes arrière ouvertes */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.06, H, W / 2]} position={[s * (W / 2 + 0.02), F + H / 2, -W / 4]} color={color} />
      ))}
      {/* Hayon */}
      <Block size={[W - 0.2, 0.06, 0.9]} position={[0, 0.35, -0.4]} rotation={[0.45, 0, 0]} color="#7d828b" />
      {/* Cabine */}
      <group position={[0, 0, L + 0.15]}>
        <Block size={[W, 1.5, 1.7]} position={[0, F + 0.75, 0.85]} color={color} />
        <Block size={[W - 0.1, 0.7, 1.0]} position={[0, F + 1.85, 0.6]} color={color} />
        <Block size={[W - 0.2, 0.5, 0.04]} position={[0, F + 1.85, 1.12]} color="#2f3e4c" emissive="#6fa8c9" emissiveIntensity={0.15} />
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.04, 0.45, 0.7]} position={[s * (W / 2 + 0.01), F + 1.85, 0.6]} color="#2f3e4c" shadows={false} />
        ))}
        {[-0.7, 0.7].map((x) => (
          <Block key={x} size={[0.3, 0.14, 0.04]} position={[x, F + 0.4, 1.72]} color="#fff2c4" emissive="#fff2c4" emissiveIntensity={0.8} shadows={false} />
        ))}
      </group>
      {/* Roues */}
      {[0.7, 2.9, L + 1.4].map((z) => [-1, 1].map((s) => <Wheel key={`${z}${s}`} x={s * (W / 2 - 0.12)} z={z} />))}
      {/* Cartons encore dans la caisse */}
      {cartons.map((c, i) => {
        const perRow = 3;
        const row = Math.floor(i / perRow) % 4;
        const layer = Math.floor(i / (perRow * 4));
        const x = -W / 2 + 0.45 + (i % perRow) * (cw + 0.08);
        const z = L - 0.45 - row * (cd + 0.1);
        return <InteractiveCarton key={c.id} db={db} carton={c} position={[x, F + t / 2 + ch / 2 + layer * ch, z]} />;
      })}
    </group>
  );
}

interface TrucksProps {
  db: InventoraDb;
  selectedDeliveryId: DeliveryId | null;
  onSelectTruck: (id: DeliveryId) => void;
}

export function Trucks({ db, selectedDeliveryId, onSelectTruck }: TrucksProps) {
  const atDock = [...db.deliveries.values()].filter((d) => d.status === 'arrived' || d.status === 'unloading');
  return (
    <group>
      {atDock.map((delivery, i) => {
        const truck = db.trucks.get(delivery.truckId);
        if (!truck) return null;
        const onBoard = [...db.cartons.values()].filter(
          (c) => c.location.kind === 'in_truck' && c.location.deliveryId === delivery.id,
        ).length;
        const selected = selectedDeliveryId === delivery.id;
        const select = (e: ThreeEvent<MouseEvent>) => {
          if (e.delta > 4) return; // glisser = pan caméra, pas une sélection
          e.stopPropagation();
          onSelectTruck(delivery.id);
        };
        const length = CARGO.length + 2.2;
        return (
          <group key={delivery.id} position={[DOCK.x + i * 3.2, 0, DOCK.z]}>
            <group
              onClick={select}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = '')}
            >
              <TruckMesh truck={truck} delivery={delivery} db={db} />
            </group>
            {selected && <SelectionFrame center={[0, 0, length / 2 - 0.4]} size={[CARGO.width + 0.5, length + 0.9]} />}
            <Html position={[0, CARGO.floor + CARGO.height + 0.9, CARGO.length / 2]} center zIndexRange={[40, 0]}>
              <button type="button" className={`rack-tag${selected ? ' is-selected' : ''}`} onClick={() => onSelectTruck(delivery.id)}>
                <span className="rack-tag__code">Camion</span>
                <span className="rack-tag__qty">{onBoard} cartons</span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
