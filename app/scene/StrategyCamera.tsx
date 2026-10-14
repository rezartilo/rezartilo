/**
 * Caméra de jeu de stratégie :
 *  - projection orthographique, angle isométrique (direction (1, 1, 1))
 *  - glisser à la souris = panoramique sur le plan du sol (MapControls)
 *  - molette = zoom vers le curseur
 *  - pas de rotation
 *  - limites : la zone visible au sol ne sort jamais de la carte, et le zoom
 *    arrière minimal est recalculé pour que la vue tienne dans la carte.
 */
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, type ComponentRef } from 'react';
import { MathUtils, type OrthographicCamera as OrthoCam } from 'three';
import { MAP } from './layout.ts';

/** Direction caméra → cible : isométrique vraie (élévation ≈ 35,26°). */
const ISO_DIR = [1, 1, 1] as const;
const DISTANCE = 60;
const START_TARGET = [-1, 0, 2.5] as const;
const START_ZOOM = 48;
const MAX_ZOOM = 140;

/**
 * Demi-étendue au sol (en X et en Z) du rectangle visible. En vue iso, l'axe
 * horizontal de l'écran est (1,0,-1)/√2 et l'axe vertical, projeté au sol, est
 * (-1,0,-1)/√2 étiré d'un facteur 1/sin(35,26°) = √3.
 */
function groundHalfExtent(cam: OrthoCam): number {
  const halfW = (cam.right - cam.left) / 2 / cam.zoom;
  const halfH = (cam.top - cam.bottom) / 2 / cam.zoom;
  return (halfW + Math.sqrt(3) * halfH) / Math.SQRT2;
}

export function StrategyCamera() {
  const controls = useRef<ComponentRef<typeof MapControls>>(null);
  const size = useThree((s) => s.size);

  // Zoom arrière minimal : toute la vue doit tenir dans la carte. Passé en prop
  // (et non posé dans un effet) car drei recrée l'instance de MapControls quand
  // la caméra par défaut change.
  const needed = (size.width / 2 + Math.sqrt(3) * (size.height / 2)) / Math.SQRT2;
  const minZoom = needed / (Math.min(MAP.maxX - MAP.minX, MAP.maxZ - MAP.minZ) / 2);
  const maxZoom = Math.max(MAX_ZOOM, minZoom);

  // Limites de panoramique, appliquées à chaque changement (pan, zoom, inertie).
  const clampToMap = useCallback(() => {
    const c = controls.current;
    if (!c) return;
    const cam = c.object as OrthoCam;
    const e = groundHalfExtent(cam);
    const t = c.target;
    const lo = (min: number, max: number) => (max - min > 2 * e ? min + e : (min + max) / 2);
    const hi = (min: number, max: number) => (max - min > 2 * e ? max - e : (min + max) / 2);
    const x = MathUtils.clamp(t.x, lo(MAP.minX, MAP.maxX), hi(MAP.minX, MAP.maxX));
    const z = MathUtils.clamp(t.z, lo(MAP.minZ, MAP.maxZ), hi(MAP.minZ, MAP.maxZ));
    const dx = x - t.x;
    const dz = z - t.z;
    if (dx !== 0 || dz !== 0 || t.y !== 0) {
      // On déplace cible et caméra ensemble pour garder l'angle iso intact.
      cam.position.x += dx;
      cam.position.z += dz;
      cam.position.y -= t.y;
      t.set(x, 0, z);
    }
  }, []);

  // Si la fenêtre rétrécit, le zoom courant peut passer sous le nouveau minimum.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cam = c.object as OrthoCam;
    if (cam.zoom < minZoom) {
      cam.zoom = minZoom;
      cam.updateProjectionMatrix();
    }
    clampToMap();
  }, [minZoom, clampToMap]);

  const n = Math.hypot(...ISO_DIR);
  const pos: [number, number, number] = [
    START_TARGET[0] + (ISO_DIR[0] / n) * DISTANCE,
    START_TARGET[1] + (ISO_DIR[1] / n) * DISTANCE,
    START_TARGET[2] + (ISO_DIR[2] / n) * DISTANCE,
  ];

  return (
    <>
      <OrthographicCamera makeDefault position={pos} zoom={Math.max(START_ZOOM, minZoom)} near={0.1} far={200} />
      <MapControls
        ref={controls}
        makeDefault
        target={[...START_TARGET]}
        enableRotate={false}
        screenSpacePanning={false}
        zoomToCursor
        enableDamping
        dampingFactor={0.12}
        zoomSpeed={1.1}
        panSpeed={1}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onChange={clampToMap}
      />
    </>
  );
}
