/**
 * Cartons : position déduite de `Carton.location`, aspect déduit de
 * `Carton.status`. Survol = fiche du carton, comme le panneau BOX #104.
 */
import { Html } from '@react-three/drei';
import { useMemo, useState } from 'react';
import type { Carton, InventoraDb } from '../../src/index.ts';
import { cartonFillRatio, cartonUnitCount, describeCartonLocation } from '../../src/index.ts';
import { CARTON_SIZE, placeCartons, type V3 } from './layout.ts';
import { Block, PALETTE } from './lowpoly.tsx';

const STATUS_LABEL: Record<Carton['status'], string> = {
  in_transit: 'En transit',
  received: 'Reçu',
  stored: 'Rangé',
  unpacking: 'Déballage',
  empty: 'Vide',
  damaged: 'Endommagé',
  returned: 'Renvoyé',
};

/** Carton low poly. Origine = centre du carton. */
export function CartonMesh({ carton, highlighted = false }: { carton: Pick<Carton, 'status' | 'priority'>; highlighted?: boolean }) {
  const [w, h, d] = CARTON_SIZE;
  const open = carton.status === 'unpacking' || carton.status === 'empty';
  const damaged = carton.status === 'damaged';
  const body = damaged ? PALETTE.cartonDark : PALETTE.carton;
  const glow = highlighted ? { emissive: '#ff9a3c', emissiveIntensity: 0.45 } : {};
  return (
    <group rotation={damaged ? [0, 0.25, 0.06] : [0, 0, 0]}>
      <Block size={[w, h, d]} color={body} {...glow} />
      {open ? (
        <>
          {/* Rabats ouverts */}
          <Block size={[w, 0.02, d / 2]} position={[0, h / 2 + 0.08, -d / 2 - 0.12]} rotation={[-1.1, 0, 0]} color={PALETTE.cartonDark} />
          <Block size={[w, 0.02, d / 2]} position={[0, h / 2 + 0.08, d / 2 + 0.12]} rotation={[1.1, 0, 0]} color={PALETTE.cartonDark} />
          {carton.status === 'unpacking' && (
            <Block size={[w - 0.08, 0.02, d - 0.08]} position={[0, h / 2 - 0.04, 0]} color="#e0533d" shadows={false} />
          )}
        </>
      ) : (
        <Block size={[0.1, 0.012, d + 0.004]} position={[0, h / 2 + 0.004, 0]} color={PALETTE.tape} shadows={false} />
      )}
      {/* Étiquette d'expédition */}
      <Block size={[0.18, 0.12, 0.01]} position={[0.14, 0.02, d / 2 + 0.005]} color="#f4f1ea" shadows={false} />
      {carton.priority === 'high' || carton.priority === 'urgent' ? (
        <Block size={[0.1, 0.1, 0.01]} position={[-0.17, 0.08, d / 2 + 0.005]} color="#e0533d" shadows={false} />
      ) : null}
    </group>
  );
}

function CartonCard({ db, carton }: { db: InventoraDb; carton: Carton }) {
  const fill = Math.round(cartonFillRatio(carton) * 100);
  const task = [...db.tasks.values()].find(
    (t) => (t.kind === 'unpack_carton' || t.kind === 'move_carton') && t.cartonId === carton.id && t.status !== 'done',
  );
  const assignee = task?.assigneeId ? db.staff.get(task.assigneeId)?.displayName : undefined;
  const row = (k: string, v: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: '#b9b2a6' }}>{k}</span>
      <span style={{ color: '#f0a64a', textAlign: 'right' }}>{v}</span>
    </div>
  );
  return (
    <div
      style={{
        width: 230,
        padding: '10px 12px',
        background: 'rgba(28,30,34,0.94)',
        border: '2px solid #4a4d55',
        borderRadius: 8,
        color: '#ece6da',
        font: '12px/1.6 system-ui, sans-serif',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{carton.code}</div>
      {row('Contenu', carton.contentLabel ?? '—')}
      {carton.grossWeight !== undefined && row('Poids', `${(carton.grossWeight / 1000).toFixed(1)} kg`)}
      {row('Quantité', `${cartonUnitCount(carton)} articles`)}
      {row('Remplissage', `${fill} %`)}
      <div style={{ height: 6, background: '#3a3d44', borderRadius: 3, margin: '2px 0 4px' }}>
        <div style={{ width: `${fill}%`, height: '100%', background: '#f0a64a', borderRadius: 3 }} />
      </div>
      {row('Statut', STATUS_LABEL[carton.status])}
      {row('Emplacement', describeCartonLocation(db, carton.location))}
      {task && row('Action', `${task.kind === 'unpack_carton' ? 'Déballage' : 'Déplacement'}${assignee ? ` (${assignee})` : ''}`)}
    </div>
  );
}

/** Carton interactif : survol = surbrillance + fiche. */
export function InteractiveCarton({ db, carton, position }: { db: InventoraDb; carton: Carton; position: V3 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
    >
      <CartonMesh carton={carton} highlighted={hovered} />
      {hovered && (
        <Html position={[0, CARTON_SIZE[1] + 0.2, 0]} center zIndexRange={[100, 0]}>
          <CartonCard db={db} carton={carton} />
        </Html>
      )}
    </group>
  );
}

/** Tous les cartons présents dans la boutique (réception, réserve, expo). */
export function Cartons({ db }: { db: InventoraDb }) {
  const placed = useMemo(() => placeCartons(db), [db]);
  return (
    <group>
      {[...placed].map(([id, position]) => {
        const carton = db.cartons.get(id)!;
        return <InteractiveCarton key={id} db={db} carton={carton} position={position} />;
      })}
    </group>
  );
}
