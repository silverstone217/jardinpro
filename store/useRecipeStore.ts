import { create } from "zustand";

import { api } from "@/utils/api";

import type { ProductRecipe, UpdateProductRecipeInput } from "@/types/recipe";

interface RecipeState {
  recipe: ProductRecipe | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  getProductRecipe: (productId: string) => Promise<ProductRecipe | null>;

  saveProductRecipe: (
    productId: string,
    data: UpdateProductRecipeInput,
  ) => Promise<ProductRecipe | null>;

  clearRecipe: () => void;
  clearError: () => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipe: null,
  isLoading: false,
  isSaving: false,
  error: null,

  /**
   * Récupère la recette d'un produit.
   */
  getProductRecipe: async (productId) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.get(`/products/${productId}/recipe`);

      const recipe = response.data.recipe as ProductRecipe;

      set({
        recipe,
        isLoading: false,
        error: null,
      });

      return recipe;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible de récupérer la recette";

      set({
        recipe: null,
        isLoading: false,
        error: message,
      });

      return null;
    }
  },

  /**
   * Crée ou remplace complètement la recette d'un produit.
   */
  saveProductRecipe: async (productId, data) => {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const response = await api.put(`/products/${productId}/recipe`, data);

      const recipe = response.data.recipe as ProductRecipe;

      set({
        recipe,
        isSaving: false,
        error: null,
      });

      return recipe;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible d'enregistrer la recette";

      set({
        isSaving: false,
        error: message,
      });

      return null;
    }
  },

  /**
   * Efface la recette actuellement chargée.
   */
  clearRecipe: () => {
    set({
      recipe: null,
      error: null,
    });
  },

  /**
   * Efface uniquement l'erreur.
   */
  clearError: () => {
    set({
      error: null,
    });
  },
}));
