/**
 * Repères visuels : balise au-dessus d'un emplacement trouvé par la recherche,
 * cadre au sol autour de l'objet sélectionné.
 */
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { V3 } from './layout.ts';

const ACCENT = '#ff9a3c';

/** Flèche low poly qui flotte au-dessus d'un emplacement, avec la quantité. */
export function Beacon({ position, label }: { position: V3; label: string }) {
  const arrow = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (arrow.current) arrow.current.position.y = 0.95 + Math.sin(clock.elapsedTime * 3) * 0.08;
  });
  return (
    <group position={position}>
      <group ref={arrow}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.18, 0.4, 4]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.9} flatShading />
        </mesh>
        <Html position={[0, 0.42, 0]} center zIndexRange={[50, 0]}>
          <div className="beacon-tag">{label}</div>
        </Html>
      </group>
    </group>
  );
}

/** Cadre lumineux posé au sol, `size` = [largeur X, profondeur Z]. */
export function SelectionFrame({ center, size, rotY = 0 }: { center: V3; size: [number, number]; rotY?: number }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 4) * 0.015;
    ref.current?.scale.set(s, 1, s);
  });
  const [w, d] = size;
  const t = 0.08;
  const bars: Array<[V3, V3]> = [
    [[0, 0, -d / 2], [w + t, 0.03, t]],
    [[0, 0, d / 2], [w + t, 0.03, t]],
    [[-w / 2, 0, 0], [t, 0.03, d + t]],
    [[w / 2, 0, 0], [t, 0.03, d + t]],
  ];
  return (
    <group ref={ref} position={[center[0], 0.11, center[2]]} rotation={[0, rotY, 0]}>
      {bars.map(([p, s], i) => (
        <Bar key={i} position={p} size={s} />
      ))}
    </group>
  );
}

function Bar({ position, size }: { position: V3; size: V3 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={ACCENT} />
    </mesh>
  );
}
