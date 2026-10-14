/**
 * Commandes fournisseurs (réapprovisionnement de la boutique).
 *
 *   Supplier      1 ── n SupplierOrder
 *   SupplierOrder 1 ── n SupplierOrderLine ── 1 Product
 *   SupplierOrderLine 1 ── n CartonLine  (via cartonLine.supplierOrderLineId)
 *
 * La quantité reçue n'est PAS stockée sur la ligne : elle se calcule depuis
 * les cartons reçus (voir `quantityReceived` dans data/queries.ts). Une seule
 * source de vérité, pas de compteur à désynchroniser.
 */
import type {
  Cents,
  ISODateTime,
  ProductId,
  Quantity,
  ShopId,
  SupplierId,
  SupplierOrderId,
  SupplierOrderLineId,
  Timestamps,
} from './common.ts';

export type SupplierOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface SupplierOrderLine {
  readonly id: SupplierOrderLineId;
  readonly productId: ProductId;
  readonly quantityOrdered: Quantity;
  readonly unitCost?: Cents;
}

export interface SupplierOrder extends Timestamps {
  readonly id: SupplierOrderId;
  readonly shopId: ShopId;
  readonly supplierId: SupplierId;
  /** Référence du bon de commande : "PO-2026-0042". */
  readonly reference: string;
  readonly status: SupplierOrderStatus;
  readonly lines: readonly SupplierOrderLine[];
  readonly orderedAt?: ISODateTime;
  readonly expectedAt?: ISODateTime;
}
