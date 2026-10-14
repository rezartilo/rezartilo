/**
 * Règles que le système de types ne peut pas exprimer seul (intégrité
 * référentielle, cohérence statut ↔ emplacement, bornes de niveaux…).
 * Renvoie la liste des violations ; vide = base cohérente.
 */
import type { Carton, CartonStatus, ShelfSlot } from '../domain/index.ts';
import type { InventoraDb } from './schema.ts';

export interface Violation {
  readonly entity: string;
  readonly id: string;
  readonly message: string;
}

/** Statuts autorisés pour chaque type d'emplacement de carton. */
const STATUS_BY_LOCATION: Record<Carton['location']['kind'], readonly CartonStatus[]> = {
  in_truck: ['in_transit'],
  receiving: ['received', 'unpacking', 'empty', 'damaged'],
  backroom: ['stored', 'unpacking', 'empty', 'damaged'],
  showroom: ['stored', 'unpacking', 'empty', 'damaged'],
  disposed: ['empty', 'damaged'],
  returned_to_supplier: ['returned'],
};

function slotExists(db: InventoraDb, slot: ShelfSlot): boolean {
  if (slot.area === 'showroom') {
    const f = db.fixtures.get(slot.fixtureId);
    return !!f && slot.level >= 1 && slot.level <= f.levels;
  }
  const r = db.racks.get(slot.rackId);
  return !!r && slot.level >= 1 && slot.level <= r.levels;
}

export function checkInvariants(db: InventoraDb): Violation[] {
  const out: Violation[] = [];
  const v = (entity: string, id: string, message: string) => out.push({ entity, id, message });

  for (const s of db.shops.values()) {
    if (db.showrooms.get(s.showroomId)?.shopId !== s.id) v('Shop', s.id, 'expo manquante ou rattachée ailleurs');
    if (db.backrooms.get(s.backroomId)?.shopId !== s.id) v('Shop', s.id, 'réserve manquante ou rattachée ailleurs');
  }

  for (const p of db.stockPlacements.values()) {
    if (!db.products.has(p.productId)) v('StockPlacement', p.id, 'produit inconnu');
    if (!slotExists(db, p.slot)) v('StockPlacement', p.id, 'emplacement inexistant');
    if (!Number.isInteger(p.quantity) || p.quantity < 0) v('StockPlacement', p.id, 'quantité invalide');
  }

  for (const d of db.deliveries.values()) {
    if (!db.trucks.has(d.truckId)) v('Delivery', d.id, 'camion inconnu');
    for (const oid of d.supplierOrderIds) if (!db.supplierOrders.has(oid)) v('Delivery', d.id, `commande ${oid} inconnue`);
  }

  for (const c of db.cartons.values()) {
    if (!STATUS_BY_LOCATION[c.location.kind].includes(c.status)) {
      v('Carton', c.id, `statut "${c.status}" incompatible avec l'emplacement "${c.location.kind}"`);
    }
    if (c.deliveryId && !db.deliveries.has(c.deliveryId)) v('Carton', c.id, 'livraison inconnue');
    if (c.location.kind === 'in_truck' && c.location.deliveryId !== c.deliveryId) {
      v('Carton', c.id, 'dans un camion qui ne correspond pas à sa livraison');
    }
    if (c.location.kind === 'backroom' || c.location.kind === 'showroom') {
      const slot: ShelfSlot =
        c.location.kind === 'backroom'
          ? { area: 'backroom', rackId: c.location.rackId, level: c.location.level }
          : { area: 'showroom', fixtureId: c.location.fixtureId, level: c.location.level };
      if (!slotExists(db, slot)) v('Carton', c.id, 'emplacement inexistant');
    }
    if (c.destination && !slotExists(db, c.destination)) v('Carton', c.id, 'destination inexistante');
    for (const l of c.lines) {
      if (!db.products.has(l.productId)) v('Carton', c.id, `produit ${l.productId} inconnu`);
      if (l.remainingQuantity < 0 || l.remainingQuantity > l.initialQuantity) {
        v('Carton', c.id, `quantité restante hors bornes pour ${l.productId}`);
      }
    }
    const empty = c.lines.every((l) => l.remainingQuantity === 0);
    if (c.status === 'empty' && !empty) v('Carton', c.id, 'marqué vide mais contient encore des articles');
  }

  for (const t of db.tasks.values()) {
    if (t.assigneeId && !db.staff.has(t.assigneeId)) v('Task', t.id, 'assigné inconnu');
    if ((t.kind === 'move_carton' || t.kind === 'unpack_carton') && !db.cartons.has(t.cartonId)) {
      v('Task', t.id, 'carton inconnu');
    }
    if (t.kind === 'receive_delivery' && !db.deliveries.has(t.deliveryId)) v('Task', t.id, 'livraison inconnue');
    if (t.kind === 'unpack_carton' && !slotExists(db, t.to)) v('Task', t.id, 'destination inexistante');
  }

  return out;
}
