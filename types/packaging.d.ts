export type BottleSize = "ML_200" | "ML_500";

export type PackagingUnit =
  | "PIECE"
  | "GRAM"
  | "KILOGRAM"
  | "MILLILITER"
  | "LITER";

export type Packaging = {
  id: string;
  shopId: string;
  name: string;
  size: BottleSize;
  unit: PackagingUnit;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePackagingInput = {
  name: string;
  size: BottleSize;
  unit: "PIECE";
};

export type UpdatePackagingInput = {
  name?: string;
  size?: BottleSize;
  unit?: "PIECE";
  isActive?: boolean;
};

export type GetPackagingsResponse = {
  message: string;
  packagings: Packaging[];
};

export type GetPackagingResponse = {
  message: string;
  packaging: Packaging;
};

export type CreatePackagingResponse = {
  message: string;
  packaging: Packaging;
};

export type UpdatePackagingResponse = {
  message: string;
  packaging: Packaging;
};
