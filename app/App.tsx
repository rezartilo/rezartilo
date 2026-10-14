import { Canvas } from '@react-three/fiber';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ProductId } from '../src/index.ts';
import { reserveEntries, searchReserve, type ReserveEntry } from './inventory/reserve.ts';
import { placeCartons } from './scene/layout.ts';
import { centroid, entryWorldPosition } from './scene/positions.ts';
import { ShopScene } from './scene/ShopScene.tsx';
import { SHOP_ID, db } from './scene/seed.ts';
import { DetailPanel } from './ui/DetailPanel.tsx';
import { InventoryPanel } from './ui/InventoryPanel.tsx';
import type { Focus, Selection } from './ui/state.ts';
import './ui/ui.css';

export function App() {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ProductId | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [focus, setFocus] = useState<Focus | null>(null);

  const cartonPos = useMemo(() => placeCartons(db), []);
  // Un clic dans le vide ferme le panneau ; la fin d'un glisser (pan) non.
  const downAt = useRef<[number, number] | null>(null);
  const entries = useMemo(() => reserveEntries(db), []);

  // Article surligné : celui choisi, ou le seul résultat de la recherche.
  const highlightProductId = useMemo(() => {
    if (!query.trim()) return picked;
    const hits = searchReserve(db, query, entries);
    if (picked && hits.some((h) => h.product.id === picked)) return picked;
    return hits.length === 1 && hits[0]!.entries.length > 0 ? hits[0]!.product.id : null;
  }, [query, picked, entries]);

  const focusOn = useCallback((points: ReturnType<typeof entryWorldPosition>[], zoom: number) => {
    const c = centroid(points.filter((p): p is NonNullable<typeof p> => p !== null));
    if (c) setFocus({ point: c, zoom, nonce: Date.now() });
  }, []);

  const pickProduct = useCallback(
    (id: ProductId) => {
      setPicked(id);
      const product = db.products.get(id);
      if (product && !query.trim()) setQuery(product.name);
      const points = entries.filter((e) => e.productId === id).map((e) => entryWorldPosition(db, e, cartonPos));
      focusOn(points, 62);
    },
    [entries, cartonPos, focusOn, query],
  );

  const pickEntry = useCallback(
    (e: ReserveEntry) => {
      setPicked(e.productId);
      focusOn([entryWorldPosition(db, e, cartonPos)], 85);
      if (e.place.kind === 'rack') setSelection({ kind: 'rack', rackId: e.place.rackId });
    },
    [cartonPos, focusOn],
  );

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        onPointerDown={(e) => (downAt.current = [e.clientX, e.clientY])}
        onPointerMissed={(e) => {
          // Les étiquettes HTML (rayonnages, camion) sont au-dessus du canvas :
          // leur clic remonte ici sans toucher d'objet 3D. Ce n'est pas un clic dans le vide.
          if (!(e.target instanceof HTMLCanvasElement)) return;
          const d = downAt.current;
          if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 5) setSelection(null);
        }}
      >
        <ShopScene
          db={db}
          selection={selection}
          onSelectRack={(rackId) => setSelection({ kind: 'rack', rackId })}
          onSelectTruck={(deliveryId) => setSelection({ kind: 'truck', deliveryId })}
          highlightProductId={highlightProductId}
          focus={focus}
        />
      </Canvas>
      <div className="hud">
        <InventoryPanel
          db={db}
          shopId={SHOP_ID}
          query={query}
          onQueryChange={(q) => {
            setQuery(q);
            if (!q.trim()) setPicked(null);
          }}
          highlightProductId={highlightProductId}
          onPickProduct={pickProduct}
          onPickEntry={pickEntry}
        />
        <DetailPanel db={db} selection={selection} onClose={() => setSelection(null)} />
      </div>
      <div className="hint">Glisser : déplacer · Molette : zoom · Clic : rayonnage ou camion</div>
    </>
  );
}
