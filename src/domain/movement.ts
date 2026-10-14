/**
 * Journal des mouvements : append-only, jamais modifié.
 *
 * Les tables d'état (Carton, StockPlacement) disent « où c'est maintenant » ;
 * le journal dit « comment c'est arrivé là, quand, et par qui ». C'est lui qui
 * permet de tracer un article de la commande jusqu'à l'étagère.
 */
import type {
  CartonId,
  DeliveryId,
  ISODateTime,
  MovementId,
  ProductId,
  Quantity,
  ShopId,
  StaffId,
  TaskId,
} from './common.ts';
import type { CartonLocation } from './carton.ts';
import type { ShelfSlot, ShowroomSlot } from './shop.ts';

interface MovementBase {
  readonly id: MovementId;
  readonly shopId: ShopId;
  readonly at: ISODateTime;
  readonly actorId?: StaffId;
  readonly taskId?: TaskId;
}

export type AdjustmentReason = 'inventory_count' | 'damaged' | 'theft' | 'found' | 'other';

export type Movement = MovementBase &
  (
    | { readonly kind: 'carton_unloaded'; readonly cartonId: CartonId; readonly deliveryId: DeliveryId }
    | {
        readonly kind: 'carton_moved';
        readonly cartonId: CartonId;
        readonly from: CartonLocation;
        readonly to: CartonLocation;
      }
    | {
        readonly kind: 'units_unpacked';
        readonly cartonId: CartonId;
        readonly productId: ProductId;
        readonly quantity: Quantity;
        readonly to: ShelfSlot;
      }
    | {
        readonly kind: 'units_transferred';
        readonly productId: ProductId;
        readonly quantity: Quantity;
        readonly from: ShelfSlot;
        readonly to: ShelfSlot;
      }
    | {
        readonly kind: 'units_sold';
        readonly productId: ProductId;
        readonly quantity: Quantity;
        readonly from: ShowroomSlot;
      }
    | {
        readonly kind: 'adjustment';
        readonly productId: ProductId;
        readonly slot: ShelfSlot;
        /** Positif ou négatif. */
        readonly delta: number;
        readonly reason: AdjustmentReason;
        readonly note?: string;
      }
  );

export type MovementKind = Movement['kind'];
