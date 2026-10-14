/**
 * Personnel : chaque membre actif se tient là où l'emmène sa tâche en cours
 * (devant le carton qu'il déballe, au cul du camion qu'il décharge…),
 * sinon à son poste par défaut selon son rôle.
 */
import { Html } from '@react-three/drei';
import { useMemo, useState } from 'react';
import type { InventoraDb, StaffMember, Task } from '../../src/index.ts';
import { DOCK, FIXTURE_SPOTS, RACK_SPOTS, fixtureLevelY, placeCartons, rackLevelY, standInFront, toWorld, type V3 } from './layout.ts';
import { Block, Gem, PALETTE } from './lowpoly.tsx';
import { CartonMesh } from './Cartons.tsx';

const TASK_LABEL: Record<Task['kind'], string> = {
  receive_delivery: 'Réception livraison',
  move_carton: 'Déplacement carton',
  unpack_carton: 'Déballage',
  restock_display: 'Réassort expo',
};

const SHIRT: Record<StaffMember['role'], string> = { stock: '#d8d2c4', sales: '#e08a3c', manager: '#3d5f87' };
const SKIN = ['#e7b48f', '#c98d63', '#8d5a3b', '#f1c9a5'];
const HAIR = ['#3a2a1f', '#7a4a24', '#1f1b18', '#b9873f'];

function Person({ member, index, carrying }: { member: StaffMember; index: number; carrying?: boolean }) {
  const skin = SKIN[index % SKIN.length]!;
  const hair = HAIR[index % HAIR.length]!;
  const shirt = SHIRT[member.role];
  return (
    <group>
      {[-1, 1].map((s) => (
        <Block key={s} size={[0.13, 0.75, 0.15]} position={[s * 0.09, 0.375, 0]} color="#2e3440" />
      ))}
      <Block size={[0.4, 0.55, 0.24]} position={[0, 1.02, 0]} color={shirt} />
      {member.role === 'stock' && <Block size={[0.34, 0.5, 0.02]} position={[0, 0.98, 0.13]} color="#2f6b4a" />}
      {[-1, 1].map((s) => (
        <Block
          key={s}
          size={[0.1, 0.5, 0.12]}
          position={carrying ? [s * 0.25, 1.05, 0.2] : [s * 0.26, 1.0, 0]}
          rotation={carrying ? [-1.2, 0, 0] : [0, 0, 0]}
          color={shirt}
        />
      ))}
      <Gem radius={0.16} position={[0, 1.47, 0]} color={skin} />
      <Block size={[0.3, 0.1, 0.3]} position={[0, 1.6, -0.02]} color={hair} />
      {carrying && (
        <group position={[0, 1.15, 0.45]} scale={0.8}>
          <CartonMesh carton={{ status: 'stored', priority: 'normal' }} />
        </group>
      )}
    </group>
  );
}

interface Pose {
  position: V3;
  /** Point regardé (pour orienter le personnage). */
  lookAt: V3;
  task?: Task;
  carrying?: boolean;
}

function poseFor(db: InventoraDb, member: StaffMember, cartonPos: ReturnType<typeof placeCartons>, idleIndex: number): Pose {
  const task = [...db.tasks.values()].find((t) => t.assigneeId === member.id && t.status === 'in_progress');

  if (task && (task.kind === 'unpack_carton' || task.kind === 'move_carton')) {
    const carton = db.cartons.get(task.cartonId);
    const at = carton && cartonPos.get(carton.id);
    if (carton && at) return { position: standInFront(db, carton, at), lookAt: at, task };
  }
  if (task?.kind === 'receive_delivery') {
    // Entre l'arrière du camion et la réception, un carton dans les bras.
    return { position: [DOCK.x + 0.6, 0, DOCK.z - 1.6], lookAt: [DOCK.x - 1, 0, 3], task, carrying: true };
  }
  if (task?.kind === 'restock_display') {
    const f = db.fixtures.get(task.to.fixtureId);
    const spot = f && FIXTURE_SPOTS[f.code];
    if (f && spot) {
      const target = toWorld(spot, 0, fixtureLevelY(f.kind, task.to.level), 0);
      return { position: toWorld(spot, 0, 0, 1.1), lookAt: target, task };
    }
  }

  // Postes par défaut
  if (member.role === 'sales') {
    const spot = FIXTURE_SPOTS['Comptoir C1'];
    if (spot) return { position: toWorld(spot, -0.3, 0, -0.85), lookAt: toWorld(spot, 0, 0, 2) };
  }
  if (member.role === 'stock') {
    const spot = RACK_SPOTS['Rack C'];
    if (spot) return { position: toWorld(spot, 0, 0, 1.3), lookAt: toWorld(spot, 0, rackLevelY(1), 0) };
  }
  const floor: V3[] = [
    [3.6, 0, 0.1],
    [7.2, 0, -0.4],
    [0.4, 0, 3.8],
  ];
  const p = floor[idleIndex % floor.length]!;
  return { position: p, lookAt: [p[0] - 1, 0, p[2] - 1] };
}

export function Staff({ db }: { db: InventoraDb }) {
  const poses = useMemo(() => {
    const cartonPos = placeCartons(db);
    return [...db.staff.values()]
      .filter((m) => m.active)
      .map((m, i) => ({ member: m, index: i, pose: poseFor(db, m, cartonPos, i) }));
  }, [db]);

  return (
    <group>
      {poses.map(({ member, index, pose }) => (
        <StaffMemberView key={member.id} member={member} index={index} pose={pose} />
      ))}
    </group>
  );
}

function StaffMemberView({ member, index, pose }: { member: StaffMember; index: number; pose: Pose }) {
  const [hovered, setHovered] = useState(false);
  const [x, , z] = pose.position;
  const rotY = Math.atan2(pose.lookAt[0] - x, pose.lookAt[2] - z);
  return (
    <group
      position={[x, 0.08, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group rotation={[0, rotY, 0]}>
        <Person member={member} index={index} carrying={pose.carrying ?? false} />
      </group>
      {/* Anneau de sélection au sol */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.38, 0.46, 12]} />
          <meshBasicMaterial color={PALETTE.beam} />
        </mesh>
      )}
      {hovered && (
        <Html position={[0, 2.0, 0]} center zIndexRange={[100, 0]}>
          <div
            style={{
              padding: '6px 10px',
              background: 'rgba(28,30,34,0.94)',
              border: '2px solid #4a4d55',
              borderRadius: 8,
              color: '#ece6da',
              font: '12px/1.5 system-ui, sans-serif',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <b>{member.displayName}</b>
            <span style={{ color: '#f0a64a' }}> · {pose.task ? TASK_LABEL[pose.task.kind] : 'Disponible'}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
