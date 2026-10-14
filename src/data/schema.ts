/**
 * Forme de la base : une table par entité, indexée par son id.
 *
 * Modèle normalisé : les relations sont des clés étrangères (ids), jamais des
 * objets imbriqués, sauf pour les agrégats qui n'existent pas seuls
 * (CartonLine dans Carton, SupplierOrderLine dans SupplierOrder).
 *
 * Ce type ne présuppose aucun moteur : il peut être servi par un store mémoire,
 * SQLite, IndexedDB… Un adaptateur n'a qu'à respecter `InventoraDb`.
 */
import type {
  Backroom,
  Carton,
  CartonId,
  Delivery,
  DeliveryId,
  DeliveryTruck,
  Fixture,
  FixtureId,
  Movement,
  Product,
  ProductId,
  Rack,
  RackId,
  Shop,
  ShopId,
  Showroom,
  ShowroomId,
  BackroomId,
  StaffId,
  StaffMember,
  StockPlacement,
  StockPlacementId,
  Supplier,
  SupplierId,
  SupplierOrder,
  SupplierOrderId,
  Task,
  TaskId,
  TruckId,
} from '../domain/index.ts';

export type Table<K extends string, V> = ReadonlyMap<K, V>;

export interface InventoraDb {
  // Lieux
  readonly shops: Table<ShopId, Shop>;
  readonly showrooms: Table<ShowroomId, Showroom>;
  readonly backrooms: Table<BackroomId, Backroom>;
  readonly fixtures: Table<FixtureId, Fixture>;
  readonly racks: Table<RackId, Rack>;
  // Catalogue & stock en vrac
  readonly suppliers: Table<SupplierId, Supplier>;
  readonly products: Table<ProductId, Product>;
  readonly stockPlacements: Table<StockPlacementId, StockPlacement>;
  // Flux entrant
  readonly supplierOrders: Table<SupplierOrderId, SupplierOrder>;
  readonly trucks: Table<TruckId, DeliveryTruck>;
  readonly deliveries: Table<DeliveryId, Delivery>;
  readonly cartons: Table<CartonId, Carton>;
  // Opérations
  readonly staff: Table<StaffId, StaffMember>;
  readonly tasks: Table<TaskId, Task>;
  /** Append-only, ordre chronologique. */
  readonly movements: readonly Movement[];
}

/**
 * Récapitulatif des relations (cardinalités) — utile pour un futur schéma SQL.
 * `from.field` référence `to`.
 */
export const RELATIONS = [
  { from: 'shops.showroomId', to: 'showrooms', cardinality: '1-1' },
  { from: 'shops.backroomId', to: 'backrooms', cardinality: '1-1' },
  { from: 'fixtures.showroomId', to: 'showrooms', cardinality: 'n-1' },
  { from: 'racks.backroomId', to: 'backrooms', cardinality: 'n-1' },
  { from: 'stockPlacements.productId', to: 'products', cardinality: 'n-1' },
  { from: 'stockPlacements.slot.fixtureId', to: 'fixtures', cardinality: 'n-1' },
  { from: 'stockPlacements.slot.rackId', to: 'racks', cardinality: 'n-1' },
  { from: 'deliveries.truckId', to: 'trucks', cardinality: 'n-1' },
  { from: 'deliveries.shopId', to: 'shops', cardinality: 'n-1' },
  { from: 'deliveries.supplierOrderIds[]', to: 'supplierOrders', cardinality: 'n-n' },
  { from: 'cartons.deliveryId', to: 'deliveries', cardinality: 'n-1' },
  { from: 'cartons.supplierOrderId', to: 'supplierOrders', cardinality: 'n-1' },
  { from: 'cartons.location.rackId', to: 'racks', cardinality: 'n-1' },
  { from: 'cartons.location.fixtureId', to: 'fixtures', cardinality: 'n-1' },
  { from: 'cartons.lines[].productId', to: 'products', cardinality: 'n-1' },
  { from: 'cartons.lines[].supplierOrderLineId', to: 'supplierOrders.lines', cardinality: 'n-1' },
  { from: 'supplierOrders.supplierId', to: 'suppliers', cardinality: 'n-1' },
  { from: 'supplierOrders.lines[].productId', to: 'products', cardinality: 'n-1' },
  { from: 'tasks.assigneeId', to: 'staff', cardinality: 'n-1' },
  { from: 'tasks.cartonId', to: 'cartons', cardinality: 'n-1' },
  { from: 'tasks.deliveryId', to: 'deliveries', cardinality: 'n-1' },
] as const;
