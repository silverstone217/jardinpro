export type BottleSize = "ML_200" | "ML_500";

export type Unit = "PIECE" | "GRAM" | "KILOGRAM" | "MILLILITER" | "LITER";

export interface ProductVariantPackaging {
  id: string;
  name: string;
  size: BottleSize;
  unit: Unit;
}

export interface ProductVariant {
  id: string;
  productId: string;
  packagingId: string;
  size: BottleSize;
  volumeMl: number;
  price: number;
  sku: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  packaging: ProductVariantPackaging;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  image: string | null;

  /**
   * Rendement d'une recette complète en millilitres.
   *
   * Exemple :
   * 4 carottes + 2 pommes + 4 oranges = 2000 ml
   *
   * recipeVolumeMl = 2000
   *
   * Ce n'est PAS le volume d'une bouteille.
   */
  recipeVolumeMl: number;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];

  _count?: {
    ingredients: number;
    productions: number;
    orderItems: number;
  };
}

export interface RawMaterialReference {
  id: string;
  name: string;
  unit: Unit;
}

export interface ProductIngredient {
  id: string;
  productId: string;
  rawMaterialId: string;
  quantity: number | string;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
  rawMaterial: RawMaterialReference;
}

export interface ProductDetails extends Product {
  ingredients: ProductIngredient[];
}

export interface ProductVariantDetails extends ProductVariant {
  product: {
    id: string;
    name: string;
    shopId: string;
  };
}

export interface ProductVariantCount {
  stock: number;
  movements: number;
  productions: number;
  distributionItems: number;
  orderItems: number;
}

export interface ProductVariantWithCount extends ProductVariant {
  _count: ProductVariantCount;
}

export interface ProductImageInput {
  uri: string;
  name?: string;
  type?: string;
}
