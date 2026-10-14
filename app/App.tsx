import { Canvas } from '@react-three/fiber';
import { ShopScene } from './scene/ShopScene.tsx';
import { db } from './scene/seed.ts';

export function App() {
  return (
    <>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <ShopScene db={db} />
      </Canvas>
      <div
        style={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          padding: '8px 12px',
          background: 'rgba(28,30,34,0.85)',
          border: '1px solid #4a4d55',
          borderRadius: 8,
          color: '#ece6da',
          font: '12px/1.5 system-ui, sans-serif',
          pointerEvents: 'none',
        }}
      >
        Glisser : déplacer · Molette : zoom · Survol : détails carton / personnel
      </div>
    </>
  );
}
