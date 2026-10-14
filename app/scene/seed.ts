/**
 * Jeu de données de démonstration pour la scène 3D.
 * Construit uniquement avec les types du data layer (src/), sans les modifier.
 */
import type {
  Backroom,
  BackroomId,
  Carton,
  CartonId,
  CartonLine,
  CartonLocation,
  CartonStatus,
  Delivery,
  DeliveryId,
  DeliveryTruck,
  Fixture,
  FixtureId,
  FixtureKind,
  InventoraDb,
  ISODateTime,
  Product,
  ProductId,
  Rack,
  RackId,
  ShelfSlot,
  Shop,
  ShopId,
  Showroom,
  ShowroomId,
  StaffId,
  StaffMember,
  StockPlacement,
  StockPlacementId,
  Supplier,
  SupplierId,
  SupplierOrder,
  SupplierOrderId,
  SupplierOrderLineId,
  Task,
  TaskId,
  TruckId,
} from '../../src/index.ts';
import { checkInvariants } from '../../src/index.ts';

const now = '2026-10-14T19:42:00Z' as ISODateTime;
const ts = { createdAt: now, updatedAt: now };

const shopId = 'shop_giftworks' as ShopId;
const showroomId = 'sr_1' as ShowroomId;
const backroomId = 'br_1' as BackroomId;

const shop: Shop = {
  id: shopId,
  name: 'Giftworks',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  address: { line1: '1 rue Exemple', postalCode: '75001', city: 'Paris', country: 'FR' },
  showroomId,
  backroomId,
  ...ts,
};
const showroom: Showroom = { id: showroomId, shopId, name: 'Expo', ...ts };
const backroom: Backroom = { id: backroomId, shopId, name: 'Réserve', ...ts };

// --- Meubles d'expo et rayonnages -------------------------------------------

const fixture = (code: string, kind: FixtureKind, levels: number, label?: string): Fixture => ({
  id: `fx_${code.replace(/\s+/g, '_')}` as FixtureId,
  showroomId,
  code,
  kind,
  levels,
  ...(label ? { label } : {}),
  ...ts,
});

const fixtures = [
  fixture('Shelf A1', 'shelf', 4, 'Gifts'),
  fixture('Shelf A2', 'shelf', 4),
  fixture('Shelf A3', 'shelf', 4, 'Nouveautés'),
  fixture('Shelf D1', 'shelf', 4),
  fixture('Gondola B1', 'gondola', 3),
  fixture('Gondola B2', 'gondola', 3),
  fixture('Table T1', 'table', 1, 'Coups de cœur'),
  fixture('Endcap E1', 'endcap', 3),
  fixture('Vitrine V1', 'display_case', 2),
  fixture('Comptoir C1', 'counter', 1),
];
const fx = (code: string): Fixture => fixtures.find((f) => f.code === code)!;

const rack = (code: string, levels: number): Rack => ({
  id: `rk_${code.replace(/\s+/g, '_')}` as RackId,
  backroomId,
  code,
  levels,
  ...ts,
});
const racks = [rack('Rack A', 3), rack('Rack B', 3), rack('Rack C', 3), rack('Rack D', 3)];
const rk = (code: string): Rack => racks.find((r) => r.code === code)!;

// --- Catalogue ---------------------------------------------------------------

const supplier = (id: string, name: string): Supplier => ({ id: id as SupplierId, name, ...ts });
const suppliers = [
  supplier('sup_toys', 'ToyCo'),
  supplier('sup_home', 'Maison & Co'),
  supplier('sup_paper', 'Papeterie Lune'),
  supplier('sup_deco', 'Grossiste Déco'),
];
const sid = (id: string) => id as SupplierId;

const product = (
  id: string,
  sku: string,
  name: string,
  category: string,
  retailPrice: number,
  supplierId: string,
): Product => ({
  id: id as ProductId,
  sku,
  name,
  category,
  retailPrice,
  defaultSupplierId: supplierId as SupplierId,
  archived: false,
  ...ts,
});
const products = [
  product('p_robot', 'TOY-001', 'Petit robot', 'Toys', 1290, 'sup_toys'),
  product('p_puzzle', 'TOY-002', 'Puzzle 500 pièces', 'Toys', 1590, 'sup_toys'),
  product('p_plush', 'PLU-001', 'Peluche ours', 'Plush', 1990, 'sup_toys'),
  product('p_mug_cat', 'MUG-001', 'Mug chat', 'Mugs', 990, 'sup_home'),
  product('p_mug_logo', 'MUG-002', 'Mug Giftworks', 'Mugs', 1190, 'sup_home'),
  product('p_candle', 'CAN-001', 'Bougie vanille', 'Candles', 1450, 'sup_home'),
  product('p_card', 'CRD-001', 'Carte anniversaire', 'Cards', 350, 'sup_paper'),
  product('p_book', 'BOK-001', 'Carnet illustré', 'Books', 1290, 'sup_paper'),
];
const pid = (id: string) => id as ProductId;

// --- Stock en vrac (expo + réserve) -----------------------------------------

let placementSeq = 0;
const placements: StockPlacement[] = [];
const place = (slot: ShelfSlot, productId: string, quantity: number) =>
  placements.push({
    id: `sp_${++placementSeq}` as StockPlacementId,
    shopId,
    productId: pid(productId),
    slot,
    quantity,
    updatedAt: now,
  });
const onFixture = (code: string, level: number): ShelfSlot => ({ area: 'showroom', fixtureId: fx(code).id, level });
const onRack = (code: string, level: number): ShelfSlot => ({ area: 'backroom', rackId: rk(code).id, level });

place(onFixture('Shelf A1', 1), 'p_plush', 4);
place(onFixture('Shelf A1', 2), 'p_robot', 8);
place(onFixture('Shelf A1', 3), 'p_puzzle', 6);
place(onFixture('Shelf A1', 4), 'p_plush', 5);
place(onFixture('Shelf A2', 1), 'p_candle', 9);
place(onFixture('Shelf A2', 2), 'p_candle', 7);
place(onFixture('Shelf A2', 3), 'p_mug_cat', 8);
place(onFixture('Shelf A2', 4), 'p_mug_logo', 6);
place(onFixture('Shelf A3', 1), 'p_mug_cat', 3); // en cours de réassort par Ben (BOX-104)
place(onFixture('Shelf A3', 2), 'p_robot', 5);
place(onFixture('Shelf A3', 3), 'p_book', 8);
place(onFixture('Shelf D1', 1), 'p_puzzle', 5);
place(onFixture('Shelf D1', 2), 'p_book', 7);
place(onFixture('Shelf D1', 3), 'p_card', 10);
place(onFixture('Shelf D1', 4), 'p_card', 10);
place(onFixture('Gondola B1', 1), 'p_mug_cat', 10);
place(onFixture('Gondola B1', 2), 'p_mug_logo', 12);
place(onFixture('Gondola B1', 3), 'p_candle', 9);
place(onFixture('Gondola B2', 1), 'p_robot', 10);
place(onFixture('Gondola B2', 2), 'p_puzzle', 8);
place(onFixture('Gondola B2', 3), 'p_plush', 6);
place(onFixture('Table T1', 1), 'p_book', 6);
place(onFixture('Table T1', 1), 'p_card', 6);
place(onFixture('Endcap E1', 1), 'p_candle', 4);
place(onFixture('Endcap E1', 2), 'p_mug_logo', 4);
place(onFixture('Endcap E1', 3), 'p_plush', 2);
place(onFixture('Vitrine V1', 1), 'p_candle', 4);
place(onFixture('Vitrine V1', 2), 'p_robot', 3);
place(onFixture('Comptoir C1', 1), 'p_card', 4);
place(onRack('Rack C', 3), 'p_plush', 6);
place(onRack('Rack D', 3), 'p_candle', 8);

// --- Commandes fournisseurs, camion, livraisons -----------------------------

const order = (
  id: string,
  reference: string,
  supplierId: string,
  status: SupplierOrder['status'],
  lines: Array<[productId: string, quantity: number]>,
): SupplierOrder => ({
  id: id as SupplierOrderId,
  shopId,
  supplierId: sid(supplierId),
  reference,
  status,
  lines: lines.map(([productId, quantityOrdered], i) => ({
    id: `${id}_l${i + 1}` as SupplierOrderLineId,
    productId: pid(productId),
    quantityOrdered,
  })),
  orderedAt: now,
  ...ts,
});

const orders: SupplierOrder[] = [
  order('po_41', 'PO-2026-0041', 'sup_deco', 'received', [
    ['p_candle', 24],
    ['p_mug_cat', 12],
  ]),
  order('po_42', 'PO-2026-0042', 'sup_toys', 'received', [
    ['p_robot', 87],
    ['p_puzzle', 20],
    ['p_plush', 24],
    ['p_mug_cat', 30],
  ]),
  order('po_43', 'PO-2026-0043', 'sup_home', 'partially_received', [
    ['p_candle', 120],
    ['p_mug_logo', 108],
    ['p_mug_cat', 36],
  ]),
  order('po_44', 'PO-2026-0044', 'sup_paper', 'confirmed', [
    ['p_card', 200],
    ['p_book', 60],
  ]),
];
const po = (id: string) => orders.find((o) => o.id === id)!;

const trucks: DeliveryTruck[] = [
  { id: 'trk_1' as TruckId, carrierName: 'Transports Martin', licensePlate: 'AB-123-CD', maxCartons: 24, ...ts },
];

const delivery = (
  id: string,
  orderIds: string[],
  status: Delivery['status'],
  extra: Partial<Delivery> = {},
): Delivery => ({
  id: id as DeliveryId,
  truckId: trucks[0]!.id,
  shopId,
  supplierOrderIds: orderIds.map((o) => o as SupplierOrderId),
  status,
  expectedAt: now,
  arrivedAt: now,
  ...(status === 'completed' ? { completedAt: now } : {}),
  ...ts,
  ...extra,
});

const deliveries: Delivery[] = [
  delivery('dlv_6', ['po_41'], 'completed'),
  delivery('dlv_7', ['po_42'], 'completed'),
  delivery('dlv_8', ['po_43', 'po_44'], 'unloading', { driverName: 'Karim', announcedCartonCount: 14 }),
];
const [dlv6, dlv7, dlv8] = deliveries as [Delivery, Delivery, Delivery];


// --- Cartons -----------------------------------------------------------------

let cartonSeq = 100;
const cartons: Carton[] = [];
const line = (productId: string, initialQuantity: number, remainingQuantity = initialQuantity): CartonLine => ({
  productId: pid(productId),
  initialQuantity,
  remainingQuantity,
});
const carton = (
  location: CartonLocation,
  status: CartonStatus,
  delivery: Delivery,
  supplierOrder: SupplierOrder,
  lines: CartonLine[],
  extra: Partial<Carton> = {},
): Carton => {
  const c: Carton = {
    id: `ctn_${++cartonSeq}` as CartonId,
    shopId,
    code: `BOX-${cartonSeq}`,
    deliveryId: delivery.id,
    supplierOrderId: supplierOrder.id,
    status,
    location,
    priority: 'normal',
    // Chaque ligne honore la ligne de commande du même article.
    lines: lines.map((l) => {
      const ol = supplierOrder.lines.find((x) => x.productId === l.productId);
      return ol ? { ...l, supplierOrderLineId: ol.id } : l;
    }),
    ...(status !== 'in_transit' ? { receivedAt: now } : {}),
    ...ts,
    ...extra,
  };
  cartons.push(c);
  return c;
};
const inRack = (code: string, level: number): CartonLocation => ({ kind: 'backroom', rackId: rk(code).id, level });
const receiving: CartonLocation = { kind: 'receiving', shopId };
const inTruck: CartonLocation = { kind: 'in_truck', deliveryId: dlv8.id };

const po41 = po('po_41');
const po42 = po('po_42');
const po43 = po('po_43');
const po44 = po('po_44');

// Réserve : livraisons précédentes (dlv_6, dlv_7)
carton(inRack('Rack A', 1), 'stored', dlv7, po42, [line('p_robot', 24)], { contentLabel: 'Robots', grossWeight: 9800 });
carton(inRack('Rack A', 1), 'stored', dlv7, po42, [line('p_robot', 24)], { contentLabel: 'Robots', grossWeight: 9800 });
carton(inRack('Rack A', 2), 'stored', dlv7, po42, [line('p_puzzle', 20)], { contentLabel: 'Puzzles', grossWeight: 11200 });
const box104 = carton(
  inRack('Rack B', 2),
  'unpacking',
  dlv7,
  po42,
  [line('p_robot', 39, 25), line('p_mug_cat', 30, 20)],
  {
    contentLabel: 'Assorted Toys & Mugs',
    grossWeight: 14500,
    destination: onFixture('Shelf A3', 1),
  },
);
carton(inRack('Rack B', 1), 'stored', dlv7, po42, [line('p_plush', 12)], { contentLabel: 'Peluches', grossWeight: 5200 });
carton(inRack('Rack B', 1), 'stored', dlv7, po42, [line('p_plush', 12)], { contentLabel: 'Peluches', grossWeight: 5200 });
carton(inRack('Rack B', 3), 'stored', dlv8, po44, [line('p_book', 30)], { contentLabel: 'Carnets', grossWeight: 12000 });
carton(inRack('Rack C', 1), 'stored', dlv6, po41, [line('p_candle', 24, 18)], { contentLabel: 'Bougies (lot déco)', grossWeight: 7900 });
carton(inRack('Rack C', 2), 'stored', dlv6, po41, [line('p_mug_cat', 12)], { contentLabel: 'Mugs chat (lot déco)', grossWeight: 4400 });
carton(inRack('Rack D', 1), 'empty', dlv8, po44, [line('p_card', 100, 0)], { contentLabel: 'Cartes', grossWeight: 400 });

// Réception : déjà sortis du camion (dlv_8)
const box111 = carton(receiving, 'received', dlv8, po43, [line('p_candle', 24)], { contentLabel: 'Bougies', grossWeight: 8400 });
carton(receiving, 'received', dlv8, po43, [line('p_candle', 24)], { contentLabel: 'Bougies', grossWeight: 8400 });
carton(receiving, 'received', dlv8, po43, [line('p_mug_logo', 36)], { contentLabel: 'Mugs logo', grossWeight: 13500 });
carton(receiving, 'damaged', dlv8, po43, [line('p_mug_cat', 36, 31)], { contentLabel: 'Mugs chat', grossWeight: 13000, priority: 'high' });

// Encore dans le camion : commandes PO-2026-0043 et PO-2026-0044
const inTruckPlan: Array<[SupplierOrder, string, number, string]> = [
  [po43, 'p_candle', 24, 'Bougies'],
  [po43, 'p_candle', 24, 'Bougies'],
  [po43, 'p_candle', 24, 'Bougies'],
  [po43, 'p_mug_logo', 36, 'Mugs logo'],
  [po43, 'p_mug_logo', 36, 'Mugs logo'],
  [po44, 'p_card', 100, 'Cartes anniversaire'],
  [po44, 'p_card', 100, 'Cartes anniversaire'],
  [po44, 'p_book', 30, 'Carnets'],
];
for (const [o, productId, qty, label] of inTruckPlan) {
  carton(inTruck, 'in_transit', dlv8, o, [line(productId, qty)], { contentLabel: label });
}

// Carton présentoir posé en expo
carton({ kind: 'showroom', fixtureId: fx('Endcap E1').id, level: 1 }, 'stored', dlv8, po44, [line('p_card', 50, 32)], {
  contentLabel: 'Présentoir cartes',
  grossWeight: 1800,
});

// --- Personnel & tâches ------------------------------------------------------

const staffMember = (id: string, displayName: string, role: StaffMember['role']): StaffMember => ({
  id: id as StaffId,
  shopId,
  displayName,
  role,
  active: true,
  ...ts,
});
const staff = [
  staffMember('st_ben', 'Ben', 'stock'),
  staffMember('st_lea', 'Léa', 'stock'),
  staffMember('st_sam', 'Sam', 'sales'),
  staffMember('st_noa', 'Noa', 'manager'),
];

const tasks: Task[] = [
  {
    id: 'tsk_1' as TaskId,
    shopId,
    kind: 'unpack_carton',
    cartonId: box104.id,
    to: onFixture('Shelf A3', 1),
    status: 'in_progress',
    priority: 'normal',
    assigneeId: 'st_ben' as StaffId,
    startedAt: now,
    ...ts,
  },
  {
    id: 'tsk_2' as TaskId,
    shopId,
    kind: 'receive_delivery',
    deliveryId: dlv8.id,
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'st_lea' as StaffId,
    startedAt: now,
    ...ts,
  },
  {
    id: 'tsk_3' as TaskId,
    shopId,
    kind: 'move_carton',
    cartonId: box111.id,
    to: { kind: 'backroom', rackId: rk('Rack C').id, level: 2 },
    status: 'todo',
    priority: 'normal',
    ...ts,
  },
];

// --- Base ----------------------------------------------------------------------

const byId = <K extends string, V extends { id: K }>(rows: readonly V[]) =>
  new Map(rows.map((r) => [r.id, r] as const));

export const db: InventoraDb = {
  shops: byId([shop]),
  showrooms: byId([showroom]),
  backrooms: byId([backroom]),
  fixtures: byId(fixtures),
  racks: byId(racks),
  suppliers: byId(suppliers),
  products: byId(products),
  stockPlacements: byId(placements),
  supplierOrders: byId(orders),
  trucks: byId(trucks),
  deliveries: byId(deliveries),
  cartons: byId(cartons),
  staff: byId(staff),
  tasks: byId(tasks),
  movements: [],
};

export const SHOP_ID = shopId;

const violations = checkInvariants(db);
if (violations.length > 0) console.warn('[Inventora] données de démo incohérentes', violations);
