export type StockMovementType =
  | "PURCHASE"
  | "PRODUCTION_IN"
  | "PRODUCTION_OUT"
  | "SALE"
  | "DISTRIBUTION_IN"
  | "DISTRIBUTION_OUT"
  | "ADJUSTMENT"
  | "WASTE"
  | "RETURN";

/**
 * Stock actuel d'une ressource.
 *
 * Un stock peut représenter :
 * - une matière première
 * - un emballage
 * - une variante de produit
 *
 * Si pointOfSaleId est null, le stock est central.
 * Sinon, il appartient au point de vente indiqué.
 */
export type StockBalance = {
  id: string;

  pointOfSaleId: string | null;

  rawMaterialId: string | null;
  packagingId: string | null;
  productVariantId: string | null;

  quantity: number;

  updatedAt: string;
};

/**
 * Stock avec les relations renvoyées par l'API.
 */
export type StockBalanceWithRelations = StockBalance & {
  rawMaterial?: unknown | null;
  packaging?: unknown | null;
  productVariant?: unknown | null;
  pointOfSale?: unknown | null;
};

/**
 * Ressource concernée par le stock.
 *
 * Une seule des trois propriétés doit être renseignée.
 */
export type StockResource = {
  rawMaterialId?: string;
  packagingId?: string;
  productVariantId?: string;
};

/**
 * Filtres de récupération des stocks.
 */
export type GetStockInput = {
  pointOfSaleId?: string;
  rawMaterialId?: string;
  packagingId?: string;
  productVariantId?: string;
  lowStockOnly?: boolean;
};

/**
 * Données pour ajouter du stock.
 */
export type AddStockInput = StockResource & {
  pointOfSaleId?: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  movementType?: StockMovementType;
};

/**
 * Données pour retirer du stock.
 */
export type RemoveStockInput = StockResource & {
  pointOfSaleId?: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
  movementType?: StockMovementType;
};

/**
 * Données pour ajuster un stock.
 *
 * quantity représente la nouvelle quantité réelle
 * constatée après inventaire.
 */
export type AdjustStockInput = StockResource & {
  pointOfSaleId?: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};

/**
 * Mouvement de stock.
 */
export type StockMovement = {
  id: string;

  shopId: string;

  pointOfSaleId: string | null;

  rawMaterialId: string | null;
  packagingId: string | null;
  productVariantId: string | null;

  type: StockMovementType;

  quantity: number;

  reason: string | null;
  referenceId: string | null;

  createdById: string | null;

  createdAt: string;
};

/**
 * Filtres pour l'historique des mouvements.
 */
export type GetStockMovementsInput = {
  pointOfSaleId?: string;
  rawMaterialId?: string;
  packagingId?: string;
  productVariantId?: string;
  type?: StockMovementType;
  referenceId?: string;
  limit?: number;
  offset?: number;
};

/**
 * Réponse GET /stock
 */
export type GetStockResponse = {
  message: string;
  stocks: StockBalance[];
};

/**
 * Réponse POST /stock
 */
export type AddStockResponse = {
  message: string;
  stock: StockBalance;
};

/**
 * Réponse PATCH /stock
 */
export type AdjustStockResponse = {
  message: string;
  stock: StockBalance;
};

/**
 * Réponse DELETE /stock
 */
export type RemoveStockResponse = {
  message: string;
  stock: StockBalance;
};

/**
 * Réponse GET /stock/movements
 */
export type GetStockMovementsResponse = {
  message: string;
  movements: StockMovement[];
};
