/**
 * Briques de base partagées par tout le domaine.
 *
 * Les identifiants sont « brandés » : un `CartonId` n'est pas assignable à un
 * `RackId` même si les deux sont des `string` à l'exécution. Ça empêche de
 * brancher une relation sur la mauvaise table.
 */

declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type Id<Entity extends string> = Brand<string, Entity>;

export type ShopId = Id<'Shop'>;
export type ShowroomId = Id<'Showroom'>;
export type BackroomId = Id<'Backroom'>;
export type FixtureId = Id<'Fixture'>;
export type RackId = Id<'Rack'>;
export type ProductId = Id<'Product'>;
export type SupplierId = Id<'Supplier'>;
export type StockPlacementId = Id<'StockPlacement'>;
export type CartonId = Id<'Carton'>;
export type TruckId = Id<'Truck'>;
export type DeliveryId = Id<'Delivery'>;
export type SupplierOrderId = Id<'SupplierOrder'>;
export type SupplierOrderLineId = Id<'SupplierOrderLine'>;
export type StaffId = Id<'Staff'>;
export type TaskId = Id<'Task'>;
export type MovementId = Id<'Movement'>;

/** Horodatage ISO 8601 en UTC, ex. "2026-10-14T19:42:00Z". */
export type ISODateTime = Brand<string, 'ISODateTime'>;

/** Unités explicites : jamais de flottants pour l'argent ni le poids. */
export type Grams = number; // entier
export type Cents = number; // entier, devise de la boutique
export type Quantity = number; // entier >= 0, en unités de vente

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

/** Champs communs à toute entité persistée. */
export interface Timestamps {
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}
