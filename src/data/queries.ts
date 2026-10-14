/**
 * Valeurs dérivées : tout ce qui se calcule à partir des tables plutôt que
 * d'être stocké (et donc risquer d'être faux).
 */
import type {
  Carton,
  CartonLocation,
  ProductId,
  Quantity,
  ShopId,
  SupplierOrderLineId,
} from '../domain/index.ts';
import type { InventoraDb } from './schema.ts';

/** Remplissage d'un carton, 0..1. « Stock Level 65 % » dans la maquette. */
export function cartonFillRatio(carton: Carton): number {
  let initial = 0;
  let remaining = 0;
  for (const line of carton.lines) {
    initial += line.initialQuantity;
    remaining += line.remainingQuantity;
  }
  return initial === 0 ? 0 : remaining / initial;
}

export function cartonUnitCount(carton: Carton): Quantity {
  return carton.lines.reduce((sum, l) => sum + l.remainingQuantity, 0);
}

/** Un carton est-il physiquement dans la boutique ? */
export function isOnSite(location: CartonLocation): boolean {
  return location.kind === 'receiving' || location.kind === 'backroom' || location.kind === 'showroom';
}

export interface ProductStock {
  /** Unités en vrac sur les meubles d'expo. */
  readonly showroom: Quantity;
  /** Unités en vrac sur les rayonnages de réserve. */
  readonly backroomLoose: Quantity;
  /** Unités encore dans des cartons présents en boutique. */
  readonly inCartons: Quantity;
  /** Unités dans des cartons encore dans un camion. */
  readonly incoming: Quantity;
  /** showroom + backroomLoose + inCartons (vendable sans attendre un camion). */
  readonly onHand: Quantity;
}

/** Répartition du stock d'un produit pour une boutique. */
export function productStock(db: InventoraDb, shopId: ShopId, productId: ProductId): ProductStock {
  let showroom = 0;
  let backroomLoose = 0;
  for (const p of db.stockPlacements.values()) {
    if (p.shopId !== shopId || p.productId !== productId) continue;
    if (p.slot.area === 'showroom') showroom += p.quantity;
    else backroomLoose += p.quantity;
  }

  let inCartons = 0;
  let incoming = 0;
  for (const c of db.cartons.values()) {
    if (c.shopId !== shopId) continue;
    const qty = c.lines
      .filter((l) => l.productId === productId)
      .reduce((s, l) => s + l.remainingQuantity, 0);
    if (qty === 0) continue;
    if (c.location.kind === 'in_truck') incoming += qty;
    else if (isOnSite(c.location)) inCartons += qty;
  }

  return { showroom, backroomLoose, inCartons, incoming, onHand: showroom + backroomLoose + inCartons };
}

/** Quantité reçue pour une ligne de commande fournisseur (cartons hors camion). */
export function quantityReceived(db: InventoraDb, lineId: SupplierOrderLineId): Quantity {
  let total = 0;
  for (const c of db.cartons.values()) {
    if (c.location.kind === 'in_truck') continue;
    for (const l of c.lines) if (l.supplierOrderLineId === lineId) total += l.initialQuantity;
  }
  return total;
}

/** Libellé lisible d'un emplacement de carton : "Rack B · niv. 2". */
export function describeCartonLocation(db: InventoraDb, loc: CartonLocation): string {
  switch (loc.kind) {
    case 'in_truck': {
      const d = db.deliveries.get(loc.deliveryId);
      const truck = d && db.trucks.get(d.truckId);
      return `Camion ${truck?.licensePlate ?? truck?.carrierName ?? '?'}`;
    }
    case 'receiving':
      return 'Réception';
    case 'backroom':
      return `${db.racks.get(loc.rackId)?.code ?? '?'} · niv. ${loc.level}`;
    case 'showroom':
      return `${db.fixtures.get(loc.fixtureId)?.code ?? '?'} · niv. ${loc.level}`;
    case 'disposed':
      return 'Jeté';
    case 'returned_to_supplier':
      return 'Renvoyé au fournisseur';
  }
}
