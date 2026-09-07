import { api } from "@/utils/api";
import { create } from "zustand";

import type {
  BottleSize,
  Product,
  ProductDetails,
  ProductImageInput,
  ProductVariant,
  ProductVariantDetails,
} from "@/types/product";

/* ============================================================
   Types
============================================================ */

export interface CreateProductData {
  name: string;
  description?: string;
  recipeVolumeMl: number;
  image?: ProductImageInput;
}

export interface UpdateProductData {
  name?: string;
  description?: string | null;
  recipeVolumeMl?: number;
  isActive?: boolean;
}

export interface CreateVariantData {
  packagingId: string;
  size: BottleSize;
  volumeMl: number;
  price: number;
  sku?: string;
}

export interface UpdateVariantData {
  packagingId?: string;
  size?: BottleSize;
  volumeMl?: number;
  price?: number;
  sku?: string | null;
  isActive?: boolean;
}

/* ============================================================
   Store
============================================================ */

interface ProductState {
  products: Product[];

  selectedProduct: ProductDetails | null;

  variants: ProductVariant[];

  selectedVariant: ProductVariantDetails | null;

  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  isSavingImage: boolean;
  isLoadingVariants: boolean;
  isSavingVariant: boolean;

  error: string | null;

  /* ==========================================================
     Products
  ========================================================== */

  fetchProducts: (options?: {
    search?: string;
    isActive?: boolean;
  }) => Promise<void>;

  refreshProducts: () => Promise<void>;

  fetchProductById: (productId: string) => Promise<ProductDetails>;

  createProduct: (data: CreateProductData) => Promise<Product>;

  updateProduct: (
    productId: string,
    data: UpdateProductData,
  ) => Promise<Product>;

  updateProductImage: (
    productId: string,
    image: ProductImageInput,
  ) => Promise<Product>;

  removeProductImage: (productId: string) => Promise<Product>;

  updateProductStatus: (
    productId: string,
    isActive: boolean,
  ) => Promise<Product>;

  /* ==========================================================
     Variants
  ========================================================== */

  fetchVariants: (productId: string) => Promise<ProductVariant[]>;

  fetchVariantById: (
    productId: string,
    variantId: string,
  ) => Promise<ProductVariantDetails>;

  createVariant: (
    productId: string,
    data: CreateVariantData,
  ) => Promise<ProductVariant>;

  updateVariant: (
    productId: string,
    variantId: string,
    data: UpdateVariantData,
  ) => Promise<ProductVariant>;

  updateVariantStatus: (
    productId: string,
    variantId: string,
    isActive: boolean,
  ) => Promise<ProductVariant>;

  /* ==========================================================
     Selection
  ========================================================== */

  setSelectedProduct: (product: ProductDetails | null) => void;

  setSelectedVariant: (variant: ProductVariantDetails | null) => void;

  /* ==========================================================
     Utility
  ========================================================== */

  clearError: () => void;

  clearSelection: () => void;

  reset: () => void;
}

/* ============================================================
   Initial state
============================================================ */

const initialState = {
  products: [] as Product[],

  selectedProduct: null as ProductDetails | null,

  variants: [] as ProductVariant[],

  selectedVariant: null as ProductVariantDetails | null,

  isLoading: false,
  isRefreshing: false,
  isSaving: false,
  isSavingImage: false,
  isLoadingVariants: false,
  isSavingVariant: false,

  error: null as string | null,
};

/* ============================================================
   Helpers
============================================================ */

const getErrorMessage = (
  error: any,
  fallback = "Une erreur est survenue.",
): string => {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    fallback
  );
};

const normalizeProduct = (product: Product): Product => {
  return {
    ...product,
    variants: product.variants ?? [],
  };
};

const normalizeProductDetails = (product: ProductDetails): ProductDetails => {
  return {
    ...product,
    variants: product.variants ?? [],
    ingredients: product.ingredients ?? [],
  };
};

const normalizeVariant = (variant: ProductVariant): ProductVariant => {
  return variant;
};

/* ============================================================
   Store
============================================================ */

export const useProductStore = create<ProductState>((set, get) => ({
  ...initialState,

  /* ========================================================
       Products
    ======================================================== */

  fetchProducts: async (options) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await api.get("/products", {
        params: {
          ...(options?.search
            ? {
                search: options.search,
              }
            : {}),

          ...(options?.isActive !== undefined
            ? {
                isActive: options.isActive,
              }
            : {}),
        },
      });

      const products: Product[] = (response.data.products ?? []).map(
        normalizeProduct,
      );

      set({
        products,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de récupérer les produits.",
      );

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  refreshProducts: async () => {
    try {
      set({
        isRefreshing: true,
        error: null,
      });

      const response = await api.get("/products");

      const products: Product[] = (response.data.products ?? []).map(
        normalizeProduct,
      );

      set({
        products,
        isRefreshing: false,
        error: null,
      });
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible d'actualiser les produits.",
      );

      set({
        isRefreshing: false,
        error: message,
      });

      throw error;
    }
  },

  fetchProductById: async (productId) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const response = await api.get(`/products/${productId}`);

      const product = normalizeProductDetails(response.data.product);

      set({
        selectedProduct: product,
        variants: product.variants ?? [],
        isLoading: false,
        error: null,
      });

      return product;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de récupérer le produit.",
      );

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },

  createProduct: async (data) => {
    try {
      set({
        isSaving: true,
        error: null,
      });

      const formData = new FormData();

      formData.append("name", data.name.trim());

      /*
       * recipeVolumeMl représente le rendement
       * de la recette de base en millilitres.
       *
       * Exemple :
       * 4 carottes + 2 pommes + 4 oranges
       * = 2000 ml
       */
      formData.append("recipeVolumeMl", String(data.recipeVolumeMl));

      if (data.description?.trim()) {
        formData.append("description", data.description.trim());
      }

      if (data.image) {
        formData.append("image", {
          uri: data.image.uri,
          name: data.image.name ?? "product-image.jpg",
          type: data.image.type ?? "image/jpeg",
        } as any);
      }

      const response = await api.post("/products", formData);

      const product: Product = normalizeProduct(response.data.product);

      set((state) => ({
        products: [product, ...state.products],

        isSaving: false,
        error: null,
      }));

      return product;
    } catch (error: any) {
      const message = getErrorMessage(error, "Impossible de créer le produit.");

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },

  updateProduct: async (productId, data) => {
    try {
      set({
        isSaving: true,
        error: null,
      });

      const response = await api.patch(`/products/${productId}`, data);

      const updatedProduct: Product = normalizeProduct(response.data.product);

      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId
            ? normalizeProduct({
                ...product,
                ...updatedProduct,
                variants: updatedProduct.variants ?? product.variants ?? [],
              })
            : product,
        ),

        selectedProduct:
          state.selectedProduct?.id === productId
            ? normalizeProductDetails({
                ...state.selectedProduct,
                ...updatedProduct,
                variants: state.selectedProduct.variants ?? [],
                ingredients: state.selectedProduct.ingredients ?? [],
              })
            : state.selectedProduct,

        isSaving: false,
        error: null,
      }));

      return updatedProduct;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de modifier le produit.",
      );

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },

  updateProductImage: async (productId, image) => {
    try {
      set({
        isSavingImage: true,
        error: null,
      });

      const formData = new FormData();

      formData.append("image", {
        uri: image.uri,
        name: image.name ?? "product-image.jpg",
        type: image.type ?? "image/jpeg",
      } as any);

      const response = await api.patch(
        `/products/${productId}/image`,
        formData,
      );

      const updatedProduct: Product = normalizeProduct(response.data.product);

      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId
            ? {
                ...product,
                ...updatedProduct,
                variants: product.variants ?? [],
              }
            : product,
        ),

        selectedProduct:
          state.selectedProduct?.id === productId
            ? {
                ...state.selectedProduct,
                ...updatedProduct,
                variants: state.selectedProduct.variants ?? [],
                ingredients: state.selectedProduct.ingredients ?? [],
              }
            : state.selectedProduct,

        isSavingImage: false,
        error: null,
      }));

      return updatedProduct;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de modifier l'image du produit.",
      );

      set({
        isSavingImage: false,
        error: message,
      });

      throw error;
    }
  },

  removeProductImage: async (productId) => {
    try {
      set({
        isSavingImage: true,
        error: null,
      });

      const response = await api.delete(`/products/${productId}/image`);

      const updatedProduct: Product = normalizeProduct(response.data.product);

      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId
            ? {
                ...product,
                ...updatedProduct,
                image: updatedProduct.image ?? null,
                variants: product.variants ?? [],
              }
            : product,
        ),

        selectedProduct:
          state.selectedProduct?.id === productId
            ? {
                ...state.selectedProduct,
                ...updatedProduct,
                image: updatedProduct.image ?? null,
                variants: state.selectedProduct.variants ?? [],
                ingredients: state.selectedProduct.ingredients ?? [],
              }
            : state.selectedProduct,

        isSavingImage: false,
        error: null,
      }));

      return updatedProduct;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de supprimer l'image du produit.",
      );

      set({
        isSavingImage: false,
        error: message,
      });

      throw error;
    }
  },

  updateProductStatus: async (productId, isActive) => {
    try {
      set({
        isSaving: true,
        error: null,
      });

      const response = await api.patch(`/products/${productId}/status`, {
        isActive,
      });

      const updatedProduct: Product = normalizeProduct(response.data.product);

      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId
            ? {
                ...product,
                ...updatedProduct,
                isActive,
                variants: product.variants ?? [],
              }
            : product,
        ),

        selectedProduct:
          state.selectedProduct?.id === productId
            ? {
                ...state.selectedProduct,
                ...updatedProduct,
                isActive,
                variants: state.selectedProduct.variants ?? [],
                ingredients: state.selectedProduct.ingredients ?? [],
              }
            : state.selectedProduct,

        isSaving: false,
        error: null,
      }));

      return {
        ...updatedProduct,
        isActive,
      };
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de modifier le statut du produit.",
      );

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },

  /* ========================================================
       Variants
    ======================================================== */

  fetchVariants: async (productId) => {
    try {
      set({
        isLoadingVariants: true,
        error: null,
      });

      const response = await api.get(`/products/${productId}/variants`);

      const variants: ProductVariant[] = response.data.variants ?? [];

      set({
        variants,
        isLoadingVariants: false,
        error: null,
      });

      /*
       * Synchronise également les variantes
       * du produit actuellement sélectionné.
       */
      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId
            ? {
                ...product,
                variants,
              }
            : product,
        ),

        selectedProduct:
          state.selectedProduct?.id === productId
            ? {
                ...state.selectedProduct,
                variants,
              }
            : state.selectedProduct,
      }));

      return variants;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de récupérer les variantes.",
      );

      set({
        isLoadingVariants: false,
        error: message,
      });

      throw error;
    }
  },

  fetchVariantById: async (productId, variantId) => {
    try {
      set({
        isLoadingVariants: true,
        error: null,
      });

      const response = await api.get(
        `/products/${productId}/variants/${variantId}`,
      );

      const variant: ProductVariantDetails = response.data.variant;

      set({
        selectedVariant: variant,
        isLoadingVariants: false,
        error: null,
      });

      return variant;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de récupérer la variante.",
      );

      set({
        isLoadingVariants: false,
        error: message,
      });

      throw error;
    }
  },

  createVariant: async (productId, data) => {
    try {
      set({
        isSavingVariant: true,
        error: null,
      });

      const response = await api.post(`/products/${productId}/variants`, data);

      const variant: ProductVariant = normalizeVariant(response.data.variant);

      set((state) => {
        const currentProduct = state.products.find(
          (product) => product.id === productId,
        );

        const currentVariants = currentProduct?.variants ?? [];

        const variants = [...currentVariants, variant].sort(
          (a, b) => a.volumeMl - b.volumeMl,
        );

        return {
          variants,

          products: state.products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  variants,
                }
              : product,
          ),

          selectedProduct:
            state.selectedProduct?.id === productId
              ? {
                  ...state.selectedProduct,
                  variants,
                }
              : state.selectedProduct,

          isSavingVariant: false,
          error: null,
        };
      });

      return variant;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de créer la variante.",
      );

      set({
        isSavingVariant: false,
        error: message,
      });

      throw error;
    }
  },

  updateVariant: async (productId, variantId, data) => {
    try {
      set({
        isSavingVariant: true,
        error: null,
      });

      const response = await api.patch(
        `/products/${productId}/variants/${variantId}`,
        data,
      );

      const updatedVariant: ProductVariant = normalizeVariant(
        response.data.variant,
      );

      set((state) => {
        const currentProduct = state.products.find(
          (product) => product.id === productId,
        );

        const currentVariants = currentProduct?.variants ?? [];

        const variants = currentVariants
          .map((variant) =>
            variant.id === variantId
              ? {
                  ...variant,
                  ...updatedVariant,
                }
              : variant,
          )
          .sort((a, b) => a.volumeMl - b.volumeMl);

        return {
          variants,

          products: state.products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  variants,
                }
              : product,
          ),

          selectedProduct:
            state.selectedProduct?.id === productId
              ? {
                  ...state.selectedProduct,
                  variants,
                }
              : state.selectedProduct,

          selectedVariant:
            state.selectedVariant?.id === variantId
              ? {
                  ...state.selectedVariant,
                  ...updatedVariant,
                }
              : state.selectedVariant,

          isSavingVariant: false,
          error: null,
        };
      });

      return updatedVariant;
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de modifier la variante.",
      );

      set({
        isSavingVariant: false,
        error: message,
      });

      throw error;
    }
  },

  updateVariantStatus: async (productId, variantId, isActive) => {
    try {
      set({
        isSavingVariant: true,
        error: null,
      });

      const response = await api.patch(
        `/products/${productId}/variants/${variantId}/status`,
        {
          isActive,
        },
      );

      const updatedVariant: ProductVariant = normalizeVariant(
        response.data.variant,
      );

      set((state) => {
        const currentProduct = state.products.find(
          (product) => product.id === productId,
        );

        const currentVariants = currentProduct?.variants ?? [];

        const variants = currentVariants.map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                ...updatedVariant,
                isActive,
              }
            : variant,
        );

        return {
          variants,

          products: state.products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  variants,
                }
              : product,
          ),

          selectedProduct:
            state.selectedProduct?.id === productId
              ? {
                  ...state.selectedProduct,
                  variants,
                }
              : state.selectedProduct,

          selectedVariant:
            state.selectedVariant?.id === variantId
              ? {
                  ...state.selectedVariant,
                  ...updatedVariant,
                  isActive,
                }
              : state.selectedVariant,

          isSavingVariant: false,
          error: null,
        };
      });

      return {
        ...updatedVariant,
        isActive,
      };
    } catch (error: any) {
      const message = getErrorMessage(
        error,
        "Impossible de modifier le statut de la variante.",
      );

      set({
        isSavingVariant: false,
        error: message,
      });

      throw error;
    }
  },

  /* ========================================================
       Selection
    ======================================================== */

  setSelectedProduct: (product) => {
    set({
      selectedProduct: product ? normalizeProductDetails(product) : null,

      variants: product?.variants ?? [],
    });
  },

  setSelectedVariant: (variant) => {
    set({
      selectedVariant: variant,
    });
  },

  /* ========================================================
       Utility
    ======================================================== */

  clearError: () => {
    set({
      error: null,
    });
  },

  clearSelection: () => {
    set({
      selectedProduct: null,
      selectedVariant: null,
      variants: [],
    });
  },

  reset: () => {
    set({
      ...initialState,
    });
  },
}));
