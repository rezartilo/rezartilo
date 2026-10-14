/**
 * Reproduit le panneau « SELECT STATUS: BOX #104 » de la maquette :
 *   Content: Assorted Toys & Mugs · 14.5 kg · 45 items · Stock level 65 %
 *   Current action: STOCKING (by Ben) · Dest: Shelf A3
 *   Storage location: Rack B, Lvl 2
 *
 * Lancer : npm run example
 */
import type {
  Carton,
  CartonId,
  Delivery,
  DeliveryId,
  DeliveryTruck,
  Fixture,
  FixtureId,
  ISODateTime,
  Product,
  ProductId,
  Rack,
  RackId,
  Shop,
  ShopId,
  Showroom,
  ShowroomId,
  Backroom,
  BackroomId,
  StaffId,
  StaffMember,
  Supplier,
  SupplierId,
  SupplierOrder,
  SupplierOrderId,
  SupplierOrderLineId,
  Task,
  TaskId,
  TruckId,
  InventoraDb,
} from '../src/index.ts';
import { cartonFillRatio, cartonUnitCount, checkInvariants, describeCartonLocation, productStock } from '../src/index.ts';

const now = '2026-10-14T19:42:00Z' as ISODateTime;
const ts = { createdAt: now, updatedAt: now };

const shopId = 'shop_giftworks' as ShopId;
const showroomId = 'sr_1' as ShowroomId;
const backroomId = 'br_1' as BackroomId;

const shop: Shop = {
  id: shopId, name: 'Giftworks', timezone: 'Europe/Paris', currency: 'EUR',
  address: { line1: '1 rue Exemple', postalCode: '75001', city: 'Paris', country: 'FR' },
  showroomId, backroomId, ...ts,
};
const showroom: Showroom = { id: showroomId, shopId, name: 'Expo', ...ts };
const backroom: Backroom = { id: backroomId, shopId, name: 'Réserve', ...ts };

const shelfA3: Fixture = { id: 'fx_A3' as FixtureId, showroomId, code: 'Shelf A3', kind: 'shelf', levels: 4, ...ts };
const rackB: Rack = { id: 'rk_B' as RackId, backroomId, code: 'Rack B', levels: 3, ...ts };

const supplier: Supplier = { id: 'sup_toys' as SupplierId, name: 'ToyCo', ...ts };
const toy: Product = {
  id: 'p_toy' as ProductId, sku: 'TOY-001', name: 'Petit robot', category: 'Toys',
  retailPrice: 1290, archived: false, ...ts,
};
const mug: Product = {
  id: 'p_mug' as ProductId, sku: 'MUG-001', name: 'Mug chat', category: 'Mugs',
  retailPrice: 990, archived: false, ...ts,
};

const order: SupplierOrder = {
  id: 'po_42' as SupplierOrderId, shopId, supplierId: supplier.id, reference: 'PO-2026-0042',
  status: 'partially_received',
  lines: [
    { id: 'pol_1' as SupplierOrderLineId, productId: toy.id, quantityOrdered: 40 },
    { id: 'pol_2' as SupplierOrderLineId, productId: mug.id, quantityOrdered: 30 },
  ],
  ...ts,
};

const truck: DeliveryTruck = { id: 'trk_1' as TruckId, carrierName: 'Transports Martin', licensePlate: 'AB-123-CD', ...ts };
const delivery: Delivery = {
  id: 'dlv_7' as DeliveryId, truckId: truck.id, shopId, supplierOrderIds: [order.id],
  status: 'completed', expectedAt: now, arrivedAt: now, completedAt: now, ...ts,
};

// 45 unités restantes sur 69 initiales ≈ 65 %
const box104: Carton = {
  id: 'ctn_104' as CartonId, shopId, code: 'BOX-104', contentLabel: 'Assorted Toys & Mugs',
  deliveryId: delivery.id, supplierOrderId: order.id,
  status: 'unpacking',
  location: { kind: 'backroom', rackId: rackB.id, level: 2 },
  destination: { area: 'showroom', fixtureId: shelfA3.id, level: 1 },
  grossWeight: 14_500, priority: 'normal',
  lines: [
    { productId: toy.id, initialQuantity: 39, remainingQuantity: 25, supplierOrderLineId: 'pol_1' as SupplierOrderLineId },
    { productId: mug.id, initialQuantity: 30, remainingQuantity: 20, supplierOrderLineId: 'pol_2' as SupplierOrderLineId },
  ],
  receivedAt: now, ...ts,
};

const ben: StaffMember = { id: 'st_ben' as StaffId, shopId, displayName: 'Ben', role: 'stock', active: true, ...ts };
const stocking: Task = {
  id: 'tsk_1' as TaskId, shopId, kind: 'unpack_carton', cartonId: box104.id,
  to: { area: 'showroom', fixtureId: shelfA3.id, level: 1 },
  status: 'in_progress', priority: 'normal', assigneeId: ben.id, startedAt: now, ...ts,
};

const byId = <K extends string, V extends { id: K }>(...rows: V[]) => new Map(rows.map((r) => [r.id, r] as const));

const db: InventoraDb = {
  shops: byId(shop), showrooms: byId(showroom), backrooms: byId(backroom),
  fixtures: byId(shelfA3), racks: byId(rackB),
  suppliers: byId(supplier), products: byId(toy, mug),
  stockPlacements: new Map(),
  supplierOrders: byId(order), trucks: byId(truck), deliveries: byId(delivery),
  cartons: byId(box104), staff: byId(ben), tasks: byId(stocking),
  movements: [],
};

console.log('Carton      :', box104.code, '—', box104.contentLabel);
console.log('Poids       :', (box104.grossWeight ?? 0) / 1000, 'kg');
console.log('Quantité    :', cartonUnitCount(box104), 'articles');
console.log('Remplissage :', Math.round(cartonFillRatio(box104) * 100), '%');
console.log('Emplacement :', describeCartonLocation(db, box104.location));
console.log('Action      :', stocking.kind, 'par', db.staff.get(stocking.assigneeId!)?.displayName);
console.log('Stock mug   :', productStock(db, shopId, mug.id));
console.log('Invariants  :', checkInvariants(db));
