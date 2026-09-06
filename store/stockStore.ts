import { create } from "zustand";

import { api } from "@/utils/api";

import type {
  AddStockInput,
  AddStockResponse,
  AdjustStockInput,
  AdjustStockResponse,
  GetStockInput,
  GetStockResponse,
  RemoveStockInput,
  RemoveStockResponse,
  StockBalance,
} from "@/types/stock";

type StockStore = {
  stocks: StockBalance[];

  isLoading: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  isAdjusting: boolean;

  error: string | null;

  fetchStocks: (filters?: GetStockInput) => Promise<void>;

  addStock: (data: AddStockInput) => Promise<StockBalance>;

  removeStock: (data: RemoveStockInput) => Promise<StockBalance>;

  adjustStock: (data: AdjustStockInput) => Promise<StockBalance>;

  getStockById: (id: string) => StockBalance | null;

  clearError: () => void;

  clearStocks: () => void;
};

export const useStockStore = create<StockStore>((set, get) => ({
  stocks: [],

  isLoading: false,
  isAdding: false,
  isRemoving: false,
  isAdjusting: false,

  error: null,

  /**
   * Récupérer les stocks.
   */
  fetchStocks: async (filters) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.get<GetStockResponse>("/stock", {
        params: filters,
      });

      set({
        stocks: response.data.stocks,
        error: null,
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible de récupérer les stocks.";

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
   * Récupérer un stock par son ID.
   *
   * Cette opération utilise le stock déjà présent
   * dans le store afin d'éviter une requête supplémentaire.
   */
  getStockById: (id) => {
    return get().stocks.find((stock) => stock.id === id) ?? null;
  },

  /**
   * Ajouter du stock.
   */
  addStock: async (data) => {
    set({
      isAdding: true,
      error: null,
    });

    try {
      const response = await api.post<AddStockResponse>("/stock", data);

      const stock = response.data.stock;

      set((state) => {
        const existingStockIndex = state.stocks.findIndex(
          (item) => item.id === stock.id,
        );

        if (existingStockIndex === -1) {
          return {
            stocks: [...state.stocks, stock],
            error: null,
          };
        }

        const stocks = [...state.stocks];

        stocks[existingStockIndex] = stock;

        return {
          stocks,
          error: null,
        };
      });

      return stock;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible d'ajouter le stock.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isAdding: false,
      });
    }
  },

  /**
   * Retirer du stock.
   */
  removeStock: async (data) => {
    set({
      isRemoving: true,
      error: null,
    });

    try {
      const response = await api.delete<RemoveStockResponse>("/stock", {
        data,
      });

      const stock = response.data.stock;

      set((state) => ({
        stocks: state.stocks.map((item) =>
          item.id === stock.id ? stock : item,
        ),
        error: null,
      }));

      return stock;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible de retirer le stock.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isRemoving: false,
      });
    }
  },

  /**
   * Ajuster le stock.
   */
  adjustStock: async (data) => {
    set({
      isAdjusting: true,
      error: null,
    });

    try {
      const response = await api.patch<AdjustStockResponse>("/stock", data);

      const stock = response.data.stock;

      set((state) => {
        const existingStockIndex = state.stocks.findIndex(
          (item) => item.id === stock.id,
        );

        if (existingStockIndex === -1) {
          return {
            stocks: [...state.stocks, stock],
            error: null,
          };
        }

        const stocks = [...state.stocks];

        stocks[existingStockIndex] = stock;

        return {
          stocks,
          error: null,
        };
      });

      return stock;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Impossible d'ajuster le stock.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isAdjusting: false,
      });
    }
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
   * Vider les stocks du store.
   */
  clearStocks: () => {
    set({
      stocks: [],
      error: null,
    });
  },
}));
