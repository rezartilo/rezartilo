/**
 * Lectures « métier » pour l'interface : stock de la réserve par fournisseur,
 * recherche d'un article, manifeste d'un camion. Fonctions pures sur
 * InventoraDb ; ne modifient pas le data layer.
 *
 * Fournisseur d'une unité :
 *   - dans un carton  → carton.supplierOrderId → SupplierOrder.supplierId
 *   - en vrac         → Product.defaultSupplierId (le data model ne garde pas
 *                       l'origine d'une unité une fois sortie de son carton)
 */
import type {
  Carton,
  CartonId,
  Delivery,
  DeliveryId,
  DeliveryTruck,
  InventoraDb,
  Product,
  ProductId,
  RackId,
  StockPlacementId,
  Supplier,
  SupplierId,
  SupplierOrder,
} from '../../src/index.ts';

export type ReservePlace = { kind: 'rack'; rackId: RackId; level: number } | { kind: 'receiving' };

export type ReserveSource =
  | { kind: 'loose'; placementId: StockPlacementId }
  | { kind: 'carton'; cartonId: CartonId; cartonCode: string };

/** Une quantité d'un article à un endroit précis de la réserve. */
export interface ReserveEntry {
  readonly productId: ProductId;
  readonly supplierId: SupplierId | undefined;
  readonly place: ReservePlace;
  readonly source: ReserveSource;
  readonly quantity: number;
}

export function supplierOfCarton(db: InventoraDb, carton: Carton): SupplierId | undefined {
  const order = carton.supplierOrderId ? db.supplierOrders.get(carton.supplierOrderId) : undefined;
  return order?.supplierId;
}

/** Tout ce qui se trouve dans la réserve : rayonnages (vrac + cartons) et zone de réception. */
export function reserveEntries(db: InventoraDb): ReserveEntry[] {
  const out: ReserveEntry[] = [];
  for (const p of db.stockPlacements.values()) {
    if (p.slot.area !== 'backroom' || p.quantity <= 0) continue;
    out.push({
      productId: p.productId,
      supplierId: db.products.get(p.productId)?.defaultSupplierId,
      place: { kind: 'rack', rackId: p.slot.rackId, level: p.slot.level },
      source: { kind: 'loose', placementId: p.id },
      quantity: p.quantity,
    });
  }
  for (const c of db.cartons.values()) {
    const l = c.location;
    let place: ReservePlace;
    if (l.kind === 'backroom') place = { kind: 'rack', rackId: l.rackId, level: l.level };
    else if (l.kind === 'receiving') place = { kind: 'receiving' };
    else continue;
    const supplierId = supplierOfCarton(db, c);
    for (const line of c.lines) {
      if (line.remainingQuantity <= 0) continue;
      out.push({
        productId: line.productId,
        supplierId,
        place,
        source: { kind: 'carton', cartonId: c.id, cartonCode: c.code },
        quantity: line.remainingQuantity,
      });
    }
  }
  return out;
}

export function placeLabel(db: InventoraDb, place: ReservePlace): string {
  if (place.kind === 'receiving') return 'Réception';
  return `${db.racks.get(place.rackId)?.code ?? '?'} · niv. ${place.level}`;
}

export function supplierName(db: InventoraDb, id: SupplierId | undefined): string {
  return (id && db.suppliers.get(id)?.name) || 'Fournisseur inconnu';
}

// --- Stock de la réserve par fournisseur --------------------------------------

export interface SupplierStock {
  readonly supplier: Supplier | undefined;
  readonly supplierId: SupplierId | undefined;
  readonly total: number;
  readonly products: ReadonlyArray<{ product: Product; total: number; entries: ReserveEntry[] }>;
}

export function reserveBySupplier(db: InventoraDb, entries = reserveEntries(db)): SupplierStock[] {
  const bySupplier = new Map<string, Map<ProductId, ReserveEntry[]>>();
  for (const e of entries) {
    const key = e.supplierId ?? '';
    let products = bySupplier.get(key);
    if (!products) bySupplier.set(key, (products = new Map()));
    const list = products.get(e.productId);
    if (list) list.push(e);
    else products.set(e.productId, [e]);
  }
  const out: SupplierStock[] = [];
  for (const [key, products] of bySupplier) {
    const supplierId = (key || undefined) as SupplierId | undefined;
    const rows = [...products]
      .flatMap(([pid, list]) => {
        const product = db.products.get(pid);
        return product ? [{ product, entries: list, total: sum(list) }] : [];
      })
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'fr'));
    out.push({
      supplierId,
      supplier: supplierId ? db.suppliers.get(supplierId) : undefined,
      total: rows.reduce((s, r) => s + r.total, 0),
      products: rows,
    });
  }
  return out.sort((a, b) => supplierName(db, a.supplierId).localeCompare(supplierName(db, b.supplierId), 'fr'));
}

// --- Stock d'un rayonnage, niveau par niveau ----------------------------------

export interface RackRow {
  readonly product: Product;
  readonly supplierId: SupplierId | undefined;
  readonly loose: number;
  readonly inCartons: number;
  readonly cartonCodes: readonly string[];
}

export function rackStock(db: InventoraDb, rackId: RackId, entries = reserveEntries(db)) {
  const rack = db.racks.get(rackId);
  if (!rack) return [];
  const levels: Array<{ level: number; rows: RackRow[] }> = [];
  for (let level = rack.levels; level >= 1; level--) {
    const rows = new Map<string, { product: Product; supplierId: SupplierId | undefined; loose: number; inCartons: number; cartonCodes: string[] }>();
    for (const e of entries) {
      if (e.place.kind !== 'rack' || e.place.rackId !== rackId || e.place.level !== level) continue;
      const product = db.products.get(e.productId);
      if (!product) continue;
      const key = `${e.productId}|${e.supplierId ?? ''}`;
      let row = rows.get(key);
      if (!row) rows.set(key, (row = { product, supplierId: e.supplierId, loose: 0, inCartons: 0, cartonCodes: [] }));
      if (e.source.kind === 'loose') row.loose += e.quantity;
      else {
        row.inCartons += e.quantity;
        if (!row.cartonCodes.includes(e.source.cartonCode)) row.cartonCodes.push(e.source.cartonCode);
      }
    }
    levels.push({ level, rows: [...rows.values()].sort((a, b) => a.product.name.localeCompare(b.product.name, 'fr')) });
  }
  return levels;
}

// --- Recherche ----------------------------------------------------------------

/** Minuscules, sans accents ni espaces superflus. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export interface ProductHit {
  readonly product: Product;
  readonly entries: ReserveEntry[];
  readonly total: number;
}

/**
 * Articles dont le nom, la référence, le code-barres, la catégorie ou le nom
 * d'un fournisseur contiennent la requête. Un article trouvé mais absent de la
 * réserve est renvoyé avec `entries: []`, pour pouvoir le dire.
 */
export function searchReserve(db: InventoraDb, query: string, entries = reserveEntries(db)): ProductHit[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/);
  const hits: ProductHit[] = [];
  for (const product of db.products.values()) {
    if (product.archived) continue;
    const mine = entries.filter((e) => e.productId === product.id);
    const supplierNames = new Set<string>();
    for (const e of mine) supplierNames.add(supplierName(db, e.supplierId));
    if (product.defaultSupplierId) supplierNames.add(supplierName(db, product.defaultSupplierId));
    const haystack = normalize([product.name, product.sku, product.barcode ?? '', product.category, ...supplierNames].join(' '));
    if (terms.every((t) => haystack.includes(t))) hits.push({ product, entries: mine, total: sum(mine) });
  }
  return hits.sort((a, b) => b.total - a.total || a.product.name.localeCompare(b.product.name, 'fr'));
}

// --- Manifeste d'un camion ----------------------------------------------------

export interface ManifestOrder {
  readonly order: SupplierOrder;
  readonly supplier: Supplier | undefined;
  readonly cartons: Carton[];
  readonly lines: ReadonlyArray<{ product: Product; ordered: number; onBoard: number }>;
}

export interface TruckManifest {
  readonly delivery: Delivery;
  readonly truck: DeliveryTruck | undefined;
  readonly orders: ManifestOrder[];
  /** Cartons à bord sans commande rattachée. */
  readonly unassigned: Carton[];
  readonly cartonsOnBoard: number;
}

/** Cartons encore dans le camion, regroupés par commande fournisseur. */
export function truckManifest(db: InventoraDb, deliveryId: DeliveryId): TruckManifest | undefined {
  const delivery = db.deliveries.get(deliveryId);
  if (!delivery) return undefined;
  const onBoard = [...db.cartons.values()].filter(
    (c) => c.location.kind === 'in_truck' && c.location.deliveryId === deliveryId,
  );
  const orders: ManifestOrder[] = delivery.supplierOrderIds.flatMap((oid) => {
    const order = db.supplierOrders.get(oid);
    if (!order) return [];
    const cartons = onBoard.filter((c) => c.supplierOrderId === oid);
    const lines = order.lines.flatMap((l) => {
      const product = db.products.get(l.productId);
      if (!product) return [];
      let qty = 0;
      for (const c of cartons) for (const cl of c.lines) if (cl.supplierOrderLineId === l.id) qty += cl.remainingQuantity;
      return [{ product, ordered: l.quantityOrdered, onBoard: qty }];
    });
    return [{ order, supplier: db.suppliers.get(order.supplierId), cartons, lines }];
  });
  const assigned = new Set(orders.flatMap((o) => o.cartons.map((c) => c.id)));
  return {
    delivery,
    truck: db.trucks.get(delivery.truckId),
    orders,
    unassigned: onBoard.filter((c) => !assigned.has(c.id)),
    cartonsOnBoard: onBoard.length,
  };
}

function sum(entries: readonly ReserveEntry[]): number {
  return entries.reduce((s, e) => s + e.quantity, 0);
}
