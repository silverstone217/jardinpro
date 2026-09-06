export type RawMaterialUnit =
  | "PIECE"
  | "GRAM"
  | "KILOGRAM"
  | "MILLILITER"
  | "LITER";

export type RawMaterial = {
  id: string;
  shopId: string;
  name: string;
  unit: RawMaterialUnit;
  minStock: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RawMaterialStock = {
  id: string;
  pointOfSaleId: string | null;
  rawMaterialId: string | null;
  packagingId: string | null;
  productVariantId: string | null;
  quantity: number;
  updatedAt: string;
};

export type RawMaterialWithStock = RawMaterial & {
  stock: RawMaterialStock[];
};

export type CreateRawMaterialInput = {
  name: string;
  unit: RawMaterialUnit;
  minStock?: number;
};

export type UpdateRawMaterialInput = {
  name?: string;
  unit?: RawMaterialUnit;
  minStock?: number | null;
  isActive?: boolean;
};

export type GetRawMaterialsInput = {
  search?: string;
  isActive?: boolean;
};

export type GetRawMaterialsResponse = {
  message: string;
  rawMaterials: RawMaterialWithStock[];
};

export type GetRawMaterialResponse = {
  message: string;
  rawMaterial: RawMaterialWithStock;
};

export type CreateRawMaterialResponse = {
  message: string;
  rawMaterial: RawMaterialWithStock;
};

export type UpdateRawMaterialResponse = {
  message: string;
  rawMaterial: RawMaterialWithStock;
};
