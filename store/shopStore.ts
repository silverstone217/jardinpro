import type { CreateShopInput, Shop, UpdateShopInput } from "@/types/shop";

import { api } from "@/utils/api";
import { uploadShopLogo } from "@/utils/uploadShopLogo";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useUserStore } from "./userStore";

interface ShopState {
  shop: Shop | null;

  isLoading: boolean;
  isInitialized: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isUploadingLogo: boolean;

  createShop: (data: CreateShopInput, logoUri?: string) => Promise<void>;

  fetchShop: () => Promise<void>;

  updateShop: (data: UpdateShopInput) => Promise<void>;

  updateShopLogo: (logoUri: string) => Promise<void>;

  setShop: (shop: Shop) => void;

  clearShop: () => void;

  initialize: () => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // =========================================================
      // STATE
      // =========================================================

      shop: null,

      isLoading: false,
      isInitialized: false,

      isCreating: false,
      isUpdating: false,
      isUploadingLogo: false,

      // =========================================================
      // CREATE SHOP
      // =========================================================

      createShop: async (data, logoUri) => {
        try {
          const user = useUserStore.getState().user;

          // -----------------------------------------------------
          // Vérification utilisateur
          // -----------------------------------------------------

          if (!user) {
            throw new Error("AUTHENTICATION_REQUIRED");
          }

          // -----------------------------------------------------
          // Seul le manager peut créer la boutique
          // -----------------------------------------------------

          if (user.role !== "MANAGER") {
            throw new Error("FORBIDDEN");
          }

          // -----------------------------------------------------
          // Protection côté client
          //
          // La vraie protection reste côté serveur.
          // Le singleton Prisma garantit également
          // qu'une seule boutique peut exister.
          // -----------------------------------------------------

          if (get().shop) {
            throw new Error("SHOP_ALREADY_EXISTS");
          }

          set({
            isCreating: true,
            isLoading: true,
          });

          // =====================================================
          // ÉTAPE 1
          // Création de la boutique
          //
          // Le serveur crée la boutique avec le logo par défaut.
          // =====================================================

          const response = await api.post<{
            shop: Shop;
          }>("/shop", data);

          const createdShop = response.data.shop;

          // -----------------------------------------------------
          // On sauvegarde immédiatement la boutique.
          // Cela permet notamment d'avoir son ID.
          // -----------------------------------------------------

          set({
            shop: createdShop,
          });

          // =====================================================
          // ÉTAPE 2
          // Upload du logo
          // =====================================================

          if (logoUri) {
            set({
              isUploadingLogo: true,
            });

            try {
              /**
               * Expo
               *   ↓
               * Firebase Storage
               *   ↓
               * downloadURL
               */
              const logoUrl = await uploadShopLogo(logoUri, createdShop.id);

              // =================================================
              // ÉTAPE 3
              //
              // On envoie UNIQUEMENT l'URL à Next.js.
              //
              // L'image ne passe jamais par Next.js.
              // =================================================

              const logoResponse = await api.patch<{
                shop: Shop;
              }>(`/shop/logo`, {
                logo: logoUrl,
              });

              // -------------------------------------------------
              // Mise à jour locale avec la nouvelle boutique
              // -------------------------------------------------

              set({
                shop: logoResponse.data.shop,
              });
            } finally {
              set({
                isUploadingLogo: false,
              });
            }
          }

          // =====================================================
          // FIN
          // =====================================================

          set({
            isCreating: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            isCreating: false,
            isUploadingLogo: false,
            isLoading: false,
          });

          throw error;
        }
      },

      // =========================================================
      // FETCH SHOP
      // =========================================================

      fetchShop: async () => {
        try {
          const user = useUserStore.getState().user;

          if (!user) {
            throw new Error("AUTHENTICATION_REQUIRED");
          }

          set({
            isLoading: true,
          });

          const response = await api.get<{
            shop: Shop | null;
          }>("/shop");

          set({
            shop: response.data.shop,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
          });

          throw error;
        }
      },

      // =========================================================
      // UPDATE SHOP
      // =========================================================

      updateShop: async (data) => {
        try {
          const user = useUserStore.getState().user;

          // -----------------------------------------------------
          // Authentification
          // -----------------------------------------------------

          if (!user) {
            throw new Error("AUTHENTICATION_REQUIRED");
          }

          // -----------------------------------------------------
          // Manager uniquement
          // -----------------------------------------------------

          if (user.role !== "MANAGER") {
            throw new Error("FORBIDDEN");
          }

          // -----------------------------------------------------
          // Boutique obligatoire
          // -----------------------------------------------------

          if (!get().shop) {
            throw new Error("SHOP_NOT_FOUND");
          }

          set({
            isUpdating: true,
            isLoading: true,
          });

          // -----------------------------------------------------
          // Next.js
          // -----------------------------------------------------

          const response = await api.patch<{
            shop: Shop;
          }>("/shop/update", data);

          // -----------------------------------------------------
          // Zustand
          // -----------------------------------------------------

          set({
            shop: response.data.shop,
            isUpdating: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            isUpdating: false,
            isLoading: false,
          });

          throw error;
        }
      },

      // =========================================================
      // UPDATE SHOP LOGO
      // =========================================================

      updateShopLogo: async (logoUri) => {
        const shop = get().shop;

        if (!shop) {
          throw new Error("SHOP_NOT_FOUND");
        }

        const user = useUserStore.getState().user;

        if (!user) {
          throw new Error("AUTHENTICATION_REQUIRED");
        }

        if (user.role !== "MANAGER") {
          throw new Error("FORBIDDEN");
        }

        set({
          isUploadingLogo: true,
          isLoading: true,
        });

        try {
          // 1. Expo → Supabase
          const logoUrl = await uploadShopLogo(logoUri, shop.id);

          // 2. Expo → Next.js
          // api doit automatiquement envoyer le JWT
          const response = await api.patch<{
            shop: Shop;
          }>("/shop/logo", {
            logo: logoUrl,
          });

          // 3. Mise à jour locale
          set({
            shop: response.data.shop,
          });
        } finally {
          set({
            isUploadingLogo: false,
            isLoading: false,
          });
        }
      },
      // =========================================================
      // SET SHOP
      // =========================================================

      setShop: (shop) => {
        set({
          shop,
        });
      },

      // =========================================================
      // CLEAR SHOP
      // =========================================================

      clearShop: () => {
        set({
          shop: null,
        });
      },

      // =========================================================
      // INITIALIZE
      // =========================================================

      initialize: () => {
        set({
          isInitialized: true,
        });
      },
    }),

    // ===========================================================
    // PERSISTENCE
    // ===========================================================

    {
      name: "jardin-shop-storage",

      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        shop: state.shop,
      }),

      onRehydrateStorage: () => {
        return (state) => {
          state?.initialize();
        };
      },
    },
  ),
);
