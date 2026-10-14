/**
 * Panneau droit : contenu d'un rayonnage (stock par article et fournisseur,
 * niveau par niveau) ou manifeste du camion (cartons à bord par commande).
 */
import type { Delivery, DeliveryId, InventoraDb, RackId, SupplierOrder } from '../../src/index.ts';
import { rackStock, supplierName, truckManifest } from '../inventory/reserve.ts';
import type { Selection } from './state.ts';

const DELIVERY_STATUS: Record<Delivery['status'], string> = {
  scheduled: 'Prévue',
  in_transit: 'En route',
  arrived: 'À quai',
  unloading: 'Déchargement',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const ORDER_STATUS: Record<SupplierOrder['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  confirmed: 'Confirmée',
  partially_received: 'Reçue en partie',
  received: 'Reçue',
  cancelled: 'Annulée',
};

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="icon-btn" aria-label="Fermer" onClick={onClose}>
      ✕
    </button>
  );
}

function RackDetail({ db, rackId, onClose }: { db: InventoraDb; rackId: RackId; onClose: () => void }) {
  const rack = db.racks.get(rackId);
  if (!rack) return null;
  const levels = rackStock(db, rackId);
  const total = levels.reduce((s, l) => s + l.rows.reduce((t, r) => t + r.loose + r.inCartons, 0), 0);
  return (
    <section className="panel panel--detail" aria-label={rack.code}>
      <div className="panel__head">
        <h2 className="panel__title">{rack.code}</h2>
        <span className="panel__sub">
          Réserve · {rack.levels} niveaux · <span className="qty">{total} u.</span>
        </span>
        <CloseButton onClose={onClose} />
      </div>
      <div className="panel__body">
        {levels.map(({ level, rows }) => (
          <div key={level} className="level">
            <div className="level__title">
              <span className="section-label">Niveau {level}</span>
              <span className="panel__sub">{rows.length === 0 ? 'Vide' : `${rows.length} article${rows.length > 1 ? 's' : ''}`}</span>
            </div>
            {rows.length > 0 && (
              <div className="table-wrap">
                <table className="stock">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Fournisseur</th>
                      <th className="num">Qté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={`${r.product.id}-${r.supplierId ?? ''}`}>
                        <td>
                          {r.product.name}
                          <span className="sub">{r.product.sku}</span>
                        </td>
                        <td>{supplierName(db, r.supplierId)}</td>
                        <td className="num">
                          <span className="qty">{r.loose + r.inCartons}</span>
                          <span className="sub">
                            {[r.loose ? `${r.loose} vrac` : '', r.inCartons ? `${r.inCartons} en carton (${r.cartonCodes.join(', ')})` : '']
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        <p className="note">Vrac : fournisseur par défaut de l'article. Carton : fournisseur de la commande qui l'a livré.</p>
      </div>
    </section>
  );
}

function TruckDetail({ db, deliveryId, onClose }: { db: InventoraDb; deliveryId: DeliveryId; onClose: () => void }) {
  const m = truckManifest(db, deliveryId);
  if (!m) return null;
  const { delivery, truck } = m;
  return (
    <section className="panel panel--detail" aria-label="Camion de livraison">
      <div className="panel__head">
        <h2 className="panel__title">{truck?.carrierName ?? 'Camion'}</h2>
        <span className="chip chip--accent">{DELIVERY_STATUS[delivery.status]}</span>
        <CloseButton onClose={onClose} />
      </div>
      <div className="panel__body">
        <dl className="facts">
          {truck?.licensePlate && (
            <>
              <dt>Immatriculation</dt>
              <dd>{truck.licensePlate}</dd>
            </>
          )}
          {delivery.driverName && (
            <>
              <dt>Chauffeur</dt>
              <dd>{delivery.driverName}</dd>
            </>
          )}
          <dt>Cartons à bord</dt>
          <dd>
            <span className="qty">{m.cartonsOnBoard}</span>
            {delivery.announcedCartonCount !== undefined && ` / ${delivery.announcedCartonCount} annoncés`}
          </dd>
        </dl>

        <div className="section-label">Commandes en cours de livraison</div>
        {m.orders.map((o) => (
          <article key={o.order.id} className="order">
            <div className="order__head">
              <span className="order__ref">{o.order.reference}</span>
              <span>{o.supplier?.name ?? supplierName(db, undefined)}</span>
              <span className="chip">{ORDER_STATUS[o.order.status]}</span>
            </div>
            <div className="table-wrap">
              <table className="stock">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th className="num">À bord</th>
                    <th className="num">Commandé</th>
                  </tr>
                </thead>
                <tbody>
                  {o.lines.map((l) => (
                    <tr key={l.product.id}>
                      <td>{l.product.name}</td>
                      <td className="num">
                        <span className="qty">{l.onBoard}</span>
                      </td>
                      <td className="num">{l.ordered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="chips" aria-label="Cartons à bord">
              {o.cartons.length === 0 ? (
                <span className="note">Plus aucun carton de cette commande dans le camion.</span>
              ) : (
                o.cartons.map((c) => (
                  <span key={c.id} className="chip" title={c.contentLabel}>
                    {c.code}
                  </span>
                ))
              )}
            </div>
          </article>
        ))}
        {m.unassigned.length > 0 && (
          <article className="order">
            <div className="order__head">
              <span className="order__ref">Sans commande</span>
            </div>
            <div className="chips">
              {m.unassigned.map((c) => (
                <span key={c.id} className="chip">
                  {c.code}
                </span>
              ))}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

export function DetailPanel({ db, selection, onClose }: { db: InventoraDb; selection: Selection; onClose: () => void }) {
  if (!selection) return null;
  return selection.kind === 'rack' ? (
    <RackDetail db={db} rackId={selection.rackId} onClose={onClose} />
  ) : (
    <TruckDetail db={db} deliveryId={selection.deliveryId} onClose={onClose} />
  );
}
