/**
 * Panneau gauche : barre de recherche d'article dans la réserve et, sans
 * recherche, le stock de la réserve par fournisseur.
 */
import { useMemo, useState } from 'react';
import type { InventoraDb, ProductId, ShopId } from '../../src/index.ts';
import { productStock } from '../../src/index.ts';
import {
  placeLabel,
  reserveBySupplier,
  reserveEntries,
  searchReserve,
  supplierName,
  type ReserveEntry,
} from '../inventory/reserve.ts';

interface Props {
  db: InventoraDb;
  shopId: ShopId;
  query: string;
  onQueryChange: (q: string) => void;
  highlightProductId: ProductId | null;
  /** Clic sur un article : surligner et recentrer sur tous ses emplacements. */
  onPickProduct: (id: ProductId) => void;
  /** Clic sur un emplacement : recentrer dessus. */
  onPickEntry: (entry: ReserveEntry) => void;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function sourceLabel(e: ReserveEntry): string {
  return e.source.kind === 'carton' ? `Carton ${e.source.cartonCode}` : 'En vrac';
}

export function InventoryPanel({ db, shopId, query, onQueryChange, highlightProductId, onPickProduct, onPickEntry }: Props) {
  const entries = useMemo(() => reserveEntries(db), [db]);
  const bySupplier = useMemo(() => reserveBySupplier(db, entries), [db, entries]);
  const hits = useMemo(() => searchReserve(db, query, entries), [db, query, entries]);
  const [collapsed, setCollapsed] = useState(false);
  const total = bySupplier.reduce((s, g) => s + g.total, 0);

  return (
    <section className="panel panel--inventory" aria-label="Réserve">
      <div className="panel__head">
        <h2 className="panel__title">Réserve</h2>
        <span className="panel__sub">
          {total} articles · <span className="demo-badge">données de démo</span>
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Déplier le panneau' : 'Replier le panneau'}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? '▾' : '▴'}
        </button>
      </div>
      <label className="search">
        <SearchIcon />
        <input
          id="reserve-search"
          type="search"
          value={query}
          placeholder="Où est… (nom, réf., code-barres, fournisseur)"
          autoComplete="off"
          onChange={(e) => {
            onQueryChange(e.target.value);
            setCollapsed(false);
          }}
        />
      </label>

      {!collapsed && (
        <div className="panel__body">
          {query.trim() ? (
            <>
              <div className="section-label">
                {hits.length === 0 ? 'Aucun article trouvé' : `${hits.length} article${hits.length > 1 ? 's' : ''}`}
              </div>
              {hits.map((h) => {
                const active = h.product.id === highlightProductId;
                return (
                  <article key={h.product.id} className={`hit${active ? ' is-active' : ''}`}>
                    <button type="button" className="hit__head" onClick={() => onPickProduct(h.product.id)}>
                      <span className="hit__name">{h.product.name}</span>
                      <span className="qty">{h.total} en réserve</span>
                      <span className="hit__sku">
                        {h.product.sku} · {h.product.category}
                      </span>
                    </button>
                    {h.entries.length === 0 ? (
                      <ElsewhereNote db={db} shopId={shopId} productId={h.product.id} />
                    ) : (
                      h.entries.map((e, i) => (
                        <button key={i} type="button" className="loc" onClick={() => onPickEntry(e)}>
                          <span className="loc__where">{placeLabel(db, e.place)}</span>
                          <span className="qty">{e.quantity}</span>
                          <span className="loc__what">
                            {sourceLabel(e)} · {supplierName(db, e.supplierId)}
                          </span>
                        </button>
                      ))
                    )}
                  </article>
                );
              })}
            </>
          ) : (
            <>
              <div className="section-label">Stock par fournisseur</div>
              {bySupplier.length === 0 && <p className="empty-state">La réserve est vide.</p>}
              {bySupplier.map((g) => (
                <details key={g.supplierId ?? 'none'} className="supplier" open>
                  <summary>
                    <span>{supplierName(db, g.supplierId)}</span>
                    <span className="qty">{g.total}</span>
                  </summary>
                  {g.products.map((p) => {
                    const places = new Set(p.entries.map((e) => placeLabel(db, e.place)));
                    return (
                      <button
                        key={p.product.id}
                        type="button"
                        className={`row-btn${p.product.id === highlightProductId ? ' is-active' : ''}`}
                        onClick={() => onPickProduct(p.product.id)}
                      >
                        <span>{p.product.name}</span>
                        <span className="qty">{p.total}</span>
                        <span className="row-btn__meta">{[...places].join(' · ')}</span>
                      </button>
                    );
                  })}
                </details>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Article trouvé mais absent de la réserve : dire où il est ailleurs. */
function ElsewhereNote({ db, shopId, productId }: { db: InventoraDb; shopId: ShopId; productId: ProductId }) {
  const s = productStock(db, shopId, productId);
  const parts = [];
  if (s.showroom) parts.push(`${s.showroom} en expo`);
  if (s.incoming) parts.push(`${s.incoming} dans le camion`);
  return <p className="hit__empty">Absent de la réserve{parts.length ? ` · ${parts.join(' · ')}` : ''}.</p>;
}
