import { create } from "zustand";

import { api } from "@/utils/api";

import type {
  CreateRawMaterialInput,
  CreateRawMaterialResponse,
  GetRawMaterialsInput,
  GetRawMaterialsResponse,
  RawMaterialWithStock,
  UpdateRawMaterialInput,
  UpdateRawMaterialResponse,
} from "@/types/rawMaterial";

type RawMaterialStore = {
  rawMaterials: RawMaterialWithStock[];

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;

  error: string | null;

  fetchRawMaterials: (filters?: GetRawMaterialsInput) => Promise<void>;

  getRawMaterialById: (id: string) => RawMaterialWithStock | null;

  createRawMaterial: (
    data: CreateRawMaterialInput,
  ) => Promise<RawMaterialWithStock>;

  updateRawMaterial: (
    id: string,
    data: UpdateRawMaterialInput,
  ) => Promise<RawMaterialWithStock>;

  activateRawMaterial: (id: string) => Promise<RawMaterialWithStock>;

  deactivateRawMaterial: (id: string) => Promise<RawMaterialWithStock>;

  clearError: () => void;

  clearRawMaterials: () => void;
};

export const useRawMaterialStore = create<RawMaterialStore>((set, get) => ({
  rawMaterials: [],

  isLoading: false,
  isCreating: false,
  isUpdating: false,

  error: null,

  /**
   * Récupérer toutes les matières premières
   */
  fetchRawMaterials: async (filters) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.get<GetRawMaterialsResponse>("/raw-material", {
        params: filters,
      });

      set({
        rawMaterials: response.data.rawMaterials,
        error: null,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Impossible de récupérer les matières premières.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  /**
   * Récupérer une matière première depuis le store
   */
  getRawMaterialById: (id) => {
    return (
      get().rawMaterials.find((rawMaterial) => rawMaterial.id === id) ?? null
    );
  },

  /**
   * Créer une matière première
   */
  createRawMaterial: async (data) => {
    set({
      isCreating: true,
      error: null,
    });

    try {
      const response = await api.post<CreateRawMaterialResponse>(
        "/raw-material",
        data,
      );

      const rawMaterial = response.data.rawMaterial;

      set((state) => ({
        rawMaterials: [...state.rawMaterials, rawMaterial],
        error: null,
      }));

      return rawMaterial;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Impossible de créer la matière première.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isCreating: false,
      });
    }
  },

  /**
   * Modifier une matière première
   */
  updateRawMaterial: async (id, data) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      const response = await api.patch<UpdateRawMaterialResponse>(
        "/raw-material",
        {
          id,
          ...data,
        },
      );

      const rawMaterial = response.data.rawMaterial;

      set((state) => {
        const index = state.rawMaterials.findIndex(
          (item) => item.id === rawMaterial.id,
        );

        if (index === -1) {
          return {
            rawMaterials: [...state.rawMaterials, rawMaterial],
            error: null,
          };
        }

        const rawMaterials = [...state.rawMaterials];

        rawMaterials[index] = rawMaterial;

        return {
          rawMaterials,
          error: null,
        };
      });

      return rawMaterial;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Impossible de modifier la matière première.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isUpdating: false,
      });
    }
  },

  /**
   * Activer une matière première
   */
  activateRawMaterial: async (id) => {
    return get().updateRawMaterial(id, {
      isActive: true,
    });
  },

  /**
   * Désactiver une matière première
   */
  deactivateRawMaterial: async (id) => {
    return get().updateRawMaterial(id, {
      isActive: false,
    });
  },

  /**
   * Effacer l'erreur actuelle
   */
  clearError: () => {
    set({
      error: null,
    });
  },

  /**
   * Vider la liste locale
   */
  clearRawMaterials: () => {
    set({
      rawMaterials: [],
      error: null,
    });
  },
}));
