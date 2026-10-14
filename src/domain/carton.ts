/**
 * Cartons : l'unité physique qui voyage du fournisseur au camion, du camion à
 * la réserve, et qu'on déballe ensuite vers l'expo ou la réserve.
 *
 *   Delivery 1 ── n Carton          (carton.deliveryId)
 *   SupplierOrder 1 ── n Carton     (carton.supplierOrderId, optionnel)
 *   Carton 1 ── n CartonLine ── 1 Product
 */
import type {
  CartonId,
  DeliveryId,
  Grams,
  ISODateTime,
  Priority,
  ProductId,
  Quantity,
  RackId,
  FixtureId,
  ShopId,
  SupplierOrderId,
  SupplierOrderLineId,
  Timestamps,
} from './common.ts';
import type { ShelfSlot } from './shop.ts';

/**
 * Où se trouve physiquement le carton. Union discriminée : chaque variante
 * porte exactement la clé étrangère dont elle a besoin.
 */
export type CartonLocation =
  /** Encore dans le camion de la livraison. */
  | { readonly kind: 'in_truck'; readonly deliveryId: DeliveryId }
  /** Déchargé, posé en zone de réception, pas encore rangé. */
  | { readonly kind: 'receiving'; readonly shopId: ShopId }
  /** Rangé sur un rayonnage de réserve : « Rack B, niveau 2 ». */
  | { readonly kind: 'backroom'; readonly rackId: RackId; readonly level: number }
  /** Posé en expo (déballage sur place, présentoir carton…). */
  | { readonly kind: 'showroom'; readonly fixtureId: FixtureId; readonly level: number }
  /** Vide et jeté / recyclé, ou renvoyé au fournisseur. Plus physiquement là. */
  | { readonly kind: 'disposed' }
  | { readonly kind: 'returned_to_supplier' };

export type CartonStatus =
  | 'in_transit' // location.kind === 'in_truck'
  | 'received' // déchargé et contrôlé, en réception
  | 'stored' // rangé (réserve ou expo), encore fermé ou partiellement vidé
  | 'unpacking' // déballage en cours (une tâche unpack est active)
  | 'empty' // toutes les lignes à 0
  | 'damaged'
  | 'returned';

/** Une ligne de contenu : N unités d'un produit dans ce carton. */
export interface CartonLine {
  readonly productId: ProductId;
  /** Quantité au moment de la réception (ou annoncée par le fournisseur). */
  readonly initialQuantity: Quantity;
  /** Ce qui reste dedans. Décrémenté à chaque déballage. */
  readonly remainingQuantity: Quantity;
  /** Ligne de commande fournisseur que ce contenu honore, si connue. */
  readonly supplierOrderLineId?: SupplierOrderLineId;
}

export interface Carton extends Timestamps {
  readonly id: CartonId;
  readonly shopId: ShopId;
  /** Code imprimé sur l'étiquette / scanné : "BOX-104". Unique par boutique. */
  readonly code: string;
  /** Description libre du fournisseur : "Assorted Toys & Mugs". */
  readonly contentLabel?: string;
  /** Livraison (et donc camion) qui l'a apporté. Absent si créé sur place. */
  readonly deliveryId?: DeliveryId;
  readonly supplierOrderId?: SupplierOrderId;
  readonly status: CartonStatus;
  readonly location: CartonLocation;
  /**
   * Où le contenu doit finir (ex. « Shelf A3 »). Sert à guider le rangement /
   * déballage ; la tâche en cours porte la même info.
   */
  readonly destination?: ShelfSlot;
  readonly grossWeight?: Grams;
  readonly priority: Priority;
  readonly lines: readonly CartonLine[];
  readonly receivedAt?: ISODateTime;
}
