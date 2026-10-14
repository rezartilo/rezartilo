/**
 * Lieux physiques de la boutique.
 *
 *   Shop (boutique)
 *    ├── 1  Showroom (expo, espace de vente)
 *    │       └── n Fixture (étagère, table, vitrine…) ── n niveaux
 *    ├── 1  Backroom (réserve)
 *    │       └── n Rack (rayonnage) ── n niveaux
 *    └── zone de réception (quai) : implicite, 1 par boutique
 *
 * Un emplacement précis (« Shelf A3 niv. 1 », « Rack B niv. 2 ») est un
 * `ShelfSlot`, utilisé à la fois pour les articles en vrac et pour les cartons.
 */
import type {
  BackroomId,
  FixtureId,
  Grams,
  RackId,
  ShopId,
  ShowroomId,
  Timestamps,
} from './common.ts';

export interface Address {
  readonly line1: string;
  readonly line2?: string;
  readonly postalCode: string;
  readonly city: string;
  readonly country: string; // ISO 3166-1 alpha-2, ex. "FR"
}

export interface Shop extends Timestamps {
  readonly id: ShopId;
  readonly name: string; // "Giftworks"
  readonly address: Address;
  readonly timezone: string; // IANA, ex. "Europe/Paris"
  readonly currency: string; // ISO 4217, ex. "EUR"
  /** 1–1 : chaque boutique a exactement une expo et une réserve. */
  readonly showroomId: ShowroomId;
  readonly backroomId: BackroomId;
}

/** L'expo : la surface de vente visible des clients. */
export interface Showroom extends Timestamps {
  readonly id: ShowroomId;
  readonly shopId: ShopId;
  readonly name: string;
}

/** La réserve : stockage non visible des clients. */
export interface Backroom extends Timestamps {
  readonly id: BackroomId;
  readonly shopId: ShopId;
  readonly name: string;
}

export type FixtureKind =
  | 'shelf' // étagère murale
  | 'gondola' // gondole centrale
  | 'table' // table de présentation
  | 'display_case' // vitrine
  | 'counter' // comptoir / caisse
  | 'endcap'; // tête de gondole

/** Meuble d'exposition, rattaché à l'expo. */
export interface Fixture extends Timestamps {
  readonly id: FixtureId;
  readonly showroomId: ShowroomId;
  /** Code affiché et imprimé sur l'étiquette, unique dans l'expo : "Shelf A3". */
  readonly code: string;
  readonly kind: FixtureKind;
  /** Nombre de niveaux (1 = le plateau d'une table). Niveaux numérotés 1..levels. */
  readonly levels: number;
  readonly label?: string; // "Nouveautés", "Gifts"
}

/** Rayonnage de réserve, rattaché à la réserve. */
export interface Rack extends Timestamps {
  readonly id: RackId;
  readonly backroomId: BackroomId;
  /** Code unique dans la réserve : "Rack B". */
  readonly code: string;
  /** Niveaux numérotés 1..levels, 1 = le plus bas. */
  readonly levels: number;
  readonly maxLoadPerLevel?: Grams;
}

/**
 * Emplacement précis sur un meuble d'expo ou un rayonnage de réserve.
 * L'union discriminée par `area` garantit qu'on ne peut pas mettre un
 * `rackId` côté expo ni un `fixtureId` côté réserve.
 */
export type ShelfSlot =
  | { readonly area: 'showroom'; readonly fixtureId: FixtureId; readonly level: number }
  | { readonly area: 'backroom'; readonly rackId: RackId; readonly level: number };

export type ShowroomSlot = Extract<ShelfSlot, { area: 'showroom' }>;
export type BackroomSlot = Extract<ShelfSlot, { area: 'backroom' }>;
