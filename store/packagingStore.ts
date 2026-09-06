import { create } from "zustand";

import { api } from "@/utils/api";

import type {
  CreatePackagingInput,
  CreatePackagingResponse,
  GetPackagingResponse,
  GetPackagingsResponse,
  Packaging,
  UpdatePackagingInput,
  UpdatePackagingResponse,
} from "@/types/packaging";

type PackagingStore = {
  packagings: Packaging[];

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;

  error: string | null;

  fetchPackagings: () => Promise<void>;

  getPackagingById: (id: string) => Promise<Packaging | null>;

  createPackaging: (data: CreatePackagingInput) => Promise<Packaging>;

  updatePackaging: (
    id: string,
    data: UpdatePackagingInput,
  ) => Promise<Packaging>;

  activatePackaging: (id: string) => Promise<Packaging>;

  deactivatePackaging: (id: string) => Promise<Packaging>;

  clearError: () => void;

  clearPackagings: () => void;
};

export const usePackagingStore = create<PackagingStore>((set, get) => ({
  packagings: [],

  isLoading: false,
  isCreating: false,
  isUpdating: false,

  error: null,

  /**
   * Récupérer tous les emballages.
   */
  fetchPackagings: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.get<GetPackagingsResponse>("/packaging");

      set({
        packagings: response.data.packagings,
        error: null,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        "Impossible de récupérer les emballages.";

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
   * Récupérer un emballage par son ID.
   */
  getPackagingById: async (id) => {
    const localPackaging = get().packagings.find(
      (packaging) => packaging.id === id,
    );

    if (localPackaging) {
      return localPackaging;
    }

    try {
      const response = await api.get<GetPackagingResponse>(`/packaging/${id}`);

      return response.data.packaging;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'emballage :", error);
      return null;
    }
  },

  /**
   * Créer un emballage.
   */
  createPackaging: async (data) => {
    set({
      isCreating: true,
      error: null,
    });

    try {
      const response = await api.post<CreatePackagingResponse>(
        "/packaging",
        data,
      );

      const packaging = response.data.packaging;

      set((state) => ({
        packagings: [...state.packagings, packaging],
        error: null,
      }));

      return packaging;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible de créer l'emballage.";

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
   * Modifier un emballage.
   */
  updatePackaging: async (id, data) => {
    set({
      isUpdating: true,
      error: null,
    });

    try {
      const response = await api.patch<UpdatePackagingResponse>(
        `/packaging/${id}`,
        data,
      );

      const packaging = response.data.packaging;

      set((state) => ({
        packagings: state.packagings.map((item) =>
          item.id === id ? packaging : item,
        ),
        error: null,
      }));

      return packaging;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible de modifier l'emballage.";

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
   * Activer un emballage.
   */
  activatePackaging: async (id) => {
    return get().updatePackaging(id, {
      isActive: true,
    });
  },

  /**
   * Désactiver un emballage.
   */
  deactivatePackaging: async (id) => {
    return get().updatePackaging(id, {
      isActive: false,
    });
  },

  /**
   * Effacer l'erreur actuelle.
   */
  clearError: () => {
    set({
      error: null,
    });
  },

  /**
   * Vider les emballages du store.
   */
  clearPackagings: () => {
    set({
      packagings: [],
      error: null,
    });
  },
}));
