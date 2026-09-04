import { create } from "zustand";

import { api } from "@/utils/api";

import type {
  CreatePointOfSaleInput,
  PointOfSale,
  UpdatePointOfSaleInput,
} from "@/types/pointOfSale";

type PointOfSaleStore = {
  pointsOfSale: PointOfSale[];

  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isUpdatingStatus: boolean;

  fetchPointsOfSale: () => Promise<void>;

  createPointOfSale: (data: CreatePointOfSaleInput) => Promise<PointOfSale>;

  updatePointOfSale: (
    pointOfSaleId: string,
    data: UpdatePointOfSaleInput,
  ) => Promise<PointOfSale>;

  updatePointOfSaleStatus: (
    pointOfSaleId: string,
    isActive: boolean,
  ) => Promise<PointOfSale>;

  getPointOfSaleById: (pointOfSaleId: string) => PointOfSale | undefined;

  clearPointsOfSale: () => void;
};

export const usePointOfSaleStore = create<PointOfSaleStore>((set, get) => ({
  pointsOfSale: [],

  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isUpdatingStatus: false,

  /**
   * Récupérer tous les points de vente
   */
  fetchPointsOfSale: async () => {
    set({ isLoading: true });

    try {
      const response = await api.get("/points-of-sale");

      set({
        pointsOfSale: response.data.pointsOfSale,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Créer un point de vente
   */
  createPointOfSale: async (data) => {
    set({ isCreating: true });

    try {
      const response = await api.post("/points-of-sale", data);

      const pointOfSale: PointOfSale = response.data.pointOfSale;

      set((state) => ({
        pointsOfSale: [...state.pointsOfSale, pointOfSale],
      }));

      return pointOfSale;
    } finally {
      set({ isCreating: false });
    }
  },

  /**
   * Modifier un point de vente
   */
  updatePointOfSale: async (pointOfSaleId, data) => {
    set({ isUpdating: true });

    try {
      const response = await api.patch(
        `/points-of-sale/${pointOfSaleId}`,
        data,
      );

      const updatedPointOfSale: PointOfSale = response.data.pointOfSale;

      set((state) => ({
        pointsOfSale: state.pointsOfSale.map((pointOfSale) =>
          pointOfSale.id === pointOfSaleId ? updatedPointOfSale : pointOfSale,
        ),
      }));

      return updatedPointOfSale;
    } finally {
      set({ isUpdating: false });
    }
  },

  /**
   * Activer / désactiver un point de vente
   */
  updatePointOfSaleStatus: async (pointOfSaleId, isActive) => {
    set({ isUpdatingStatus: true });

    try {
      const response = await api.patch(
        `/points-of-sale/${pointOfSaleId}/status`,
        {
          isActive,
        },
      );

      const updatedPointOfSale: PointOfSale = response.data.pointOfSale;

      set((state) => ({
        pointsOfSale: state.pointsOfSale.map((pointOfSale) =>
          pointOfSale.id === pointOfSaleId ? updatedPointOfSale : pointOfSale,
        ),
      }));

      return updatedPointOfSale;
    } finally {
      set({ isUpdatingStatus: false });
    }
  },

  /**
   * Récupérer un POS depuis le store
   */
  getPointOfSaleById: (pointOfSaleId) => {
    return get().pointsOfSale.find(
      (pointOfSale) => pointOfSale.id === pointOfSaleId,
    );
  },

  /**
   * Vider le store
   */
  clearPointsOfSale: () => {
    set({
      pointsOfSale: [],
    });
  },
}));
