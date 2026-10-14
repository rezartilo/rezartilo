import type { DeliveryId, ProductId, RackId } from '../../src/index.ts';
import type { V3 } from '../scene/layout.ts';

/** Objet ouvert dans le panneau de détail. */
export type Selection = { kind: 'rack'; rackId: RackId } | { kind: 'truck'; deliveryId: DeliveryId } | null;

/** Demande de recentrage caméra ; `nonce` change à chaque demande. */
export interface Focus {
  readonly point: V3;
  readonly zoom?: number;
  readonly nonce: number;
}

export type HighlightedProduct = ProductId | null;
