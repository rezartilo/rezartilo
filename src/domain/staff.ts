/**
 * Personnel et tâches de manutention.
 *
 * Dans la maquette : « Current Action: STOCKING (by Ben) — Dest: Shelf A3 »
 * et les boutons PRIORITIZE / MOVE / UNPACK. Chaque action est une `Task`
 * typée, assignée à un membre du personnel.
 */
import type {
  CartonId,
  DeliveryId,
  ISODateTime,
  Priority,
  ProductId,
  Quantity,
  ShopId,
  StaffId,
  TaskId,
  Timestamps,
} from './common.ts';
import type { BackroomSlot, ShelfSlot, ShowroomSlot } from './shop.ts';
import type { CartonLocation } from './carton.ts';

export type StaffRole = 'manager' | 'sales' | 'stock';

export interface StaffMember extends Timestamps {
  readonly id: StaffId;
  readonly shopId: ShopId;
  readonly displayName: string; // "Ben"
  readonly role: StaffRole;
  readonly active: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

interface TaskBase extends Timestamps {
  readonly id: TaskId;
  readonly shopId: ShopId;
  readonly status: TaskStatus;
  readonly priority: Priority;
  readonly assigneeId?: StaffId;
  readonly startedAt?: ISODateTime;
  readonly completedAt?: ISODateTime;
}

/** Décharger une livraison : sortir ses cartons du camion vers la réception. */
export interface ReceiveDeliveryTask extends TaskBase {
  readonly kind: 'receive_delivery';
  readonly deliveryId: DeliveryId;
}

/** Ranger / déplacer un carton entier (réception → réserve, réserve → réserve…). */
export interface MoveCartonTask extends TaskBase {
  readonly kind: 'move_carton';
  readonly cartonId: CartonId;
  readonly to: Extract<CartonLocation, { kind: 'backroom' | 'showroom' | 'receiving' }>;
}

/** Ouvrir un carton et poser son contenu sur un emplacement (« STOCKING »). */
export interface UnpackCartonTask extends TaskBase {
  readonly kind: 'unpack_carton';
  readonly cartonId: CartonId;
  readonly to: ShelfSlot;
}

/** Réassort : transférer des unités en vrac de la réserve vers l'expo. */
export interface RestockDisplayTask extends TaskBase {
  readonly kind: 'restock_display';
  readonly productId: ProductId;
  readonly quantity: Quantity;
  readonly from: BackroomSlot;
  readonly to: ShowroomSlot;
}

export type Task =
  | ReceiveDeliveryTask
  | MoveCartonTask
  | UnpackCartonTask
  | RestockDisplayTask;

export type TaskKind = Task['kind'];
