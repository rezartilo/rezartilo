/**
 * Camions de livraison et livraisons.
 *
 *   DeliveryTruck 1 ── n Delivery   (un camion fait plusieurs tournées)
 *   Delivery      n ── 1 Shop
 *   Delivery      n ── n SupplierOrder (une livraison peut regrouper plusieurs
 *                                       commandes ; une commande peut arriver
 *                                       en plusieurs livraisons)
 *   Delivery      1 ── n Carton      (clé portée par carton.deliveryId)
 *
 * On sépare le véhicule (`DeliveryTruck`, stable) du passage (`Delivery`,
 * un événement daté) : sinon on perd l'historique dès que le camion revient.
 */
import type {
  DeliveryId,
  ISODateTime,
  ShopId,
  SupplierOrderId,
  Timestamps,
  TruckId,
  Grams,
} from './common.ts';

export interface DeliveryTruck extends Timestamps {
  readonly id: TruckId;
  /** Transporteur : "DHL Freight", "Transports Martin"… */
  readonly carrierName: string;
  readonly licensePlate?: string;
  readonly maxPayload?: Grams;
  readonly maxCartons?: number;
}

export type DeliveryStatus =
  | 'scheduled' // prévue, camion pas parti
  | 'in_transit' // en route
  | 'arrived' // au quai, pas encore déchargé
  | 'unloading' // déchargement en cours
  | 'completed' // tous les cartons sont sortis du camion
  | 'cancelled';

export interface Delivery extends Timestamps {
  readonly id: DeliveryId;
  readonly truckId: TruckId;
  readonly shopId: ShopId;
  readonly supplierOrderIds: readonly SupplierOrderId[];
  readonly status: DeliveryStatus;
  /** Numéro de suivi transporteur. */
  readonly trackingNumber?: string;
  readonly driverName?: string;
  readonly expectedAt: ISODateTime;
  readonly departedAt?: ISODateTime;
  readonly arrivedAt?: ISODateTime;
  readonly completedAt?: ISODateTime;
  /** Nombre de cartons annoncé sur le bon de livraison, pour contrôle. */
  readonly announcedCartonCount?: number;
}
