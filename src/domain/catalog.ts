/**
 * Catalogue : ce que la boutique vend, et où se trouvent les unités « en vrac »
 * (sorties de leur carton).
 */
import type {
  Cents,
  Grams,
  ISODateTime,
  ProductId,
  Quantity,
  ShopId,
  StockPlacementId,
  SupplierId,
  Timestamps,
} from './common.ts';
import type { ShelfSlot } from './shop.ts';

export interface Supplier extends Timestamps {
  readonly id: SupplierId;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
}

export interface Product extends Timestamps {
  readonly id: ProductId;
  /** Référence interne, unique : "MUG-CAT-01". */
  readonly sku: string;
  readonly barcode?: string; // EAN-13 / UPC
  readonly name: string;
  readonly category: string; // "Toys", "Mugs"…
  readonly defaultSupplierId?: SupplierId;
  readonly unitWeight?: Grams;
  readonly retailPrice: Cents;
  readonly unitCost?: Cents;
  /** Seuil sous lequel l'expo doit être réassortie depuis la réserve. */
  readonly displayMinQuantity?: Quantity;
  /** Seuil de stock total sous lequel il faut recommander au fournisseur. */
  readonly reorderPoint?: Quantity;
  readonly archived: boolean;
}

/**
 * Quantité d'un produit posée en vrac à un emplacement (hors carton).
 * Clé d'unicité : (productId, slot). Une ligne à quantité 0 peut être supprimée.
 *
 * Le stock « où est mon article ? » se lit ainsi :
 *   - StockPlacement.slot.area === 'showroom'  → en expo
 *   - StockPlacement.slot.area === 'backroom'  → en réserve, en vrac
 *   - CartonLine.remainingQuantity              → encore dans un carton
 */
export interface StockPlacement {
  readonly id: StockPlacementId;
  readonly shopId: ShopId;
  readonly productId: ProductId;
  readonly slot: ShelfSlot;
  readonly quantity: Quantity;
  readonly updatedAt: ISODateTime;
}
