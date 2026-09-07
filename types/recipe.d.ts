import type { Unit } from "./product";

export interface RecipeRawMaterial {
  id: string;
  name: string;
  unit: Unit;
}

export interface RecipeIngredient {
  id: string;
  productId: string;
  rawMaterialId: string;
  quantity: number;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
  rawMaterial: RecipeRawMaterial;
}

export interface RecipeProduct {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  image: string | null;
  recipeVolumeMl: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRecipe {
  product: RecipeProduct;
  ingredients: RecipeIngredient[];
}

export interface CreateRecipeIngredientInput {
  rawMaterialId: string;
  quantity: number;
  unit: Unit;
}

export interface UpdateRecipeIngredientInput {
  rawMaterialId?: string;
  quantity?: number;
  unit?: Unit;
}

export interface UpdateProductRecipeInput {
  ingredients: CreateRecipeIngredientInput[];
}
