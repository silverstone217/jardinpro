import type { AuthResponse, LoginCredentials, User } from "@/types/user";
import { api } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  updateProfile: (data: {
    name: string;
    telephone: string;
    email: string;
  }) => Promise<void>;

  updateProfileImage: (image: string) => Promise<void>;

  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;

  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  setToken: (token: string) => void;
  clearSession: () => void;
  initialize: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // LOGIN
      login: async ({ telephone, password }) => {
        try {
          set({ isLoading: true });

          const response = await api.post<AuthResponse>("/auth/login", {
            telephone,
            password,
          });

          const { user, token } = response.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
          });

          throw error;
        }
      },

      // LOGOUT
      logout: async () => {
        try {
          const token = get().token;

          if (token) {
            try {
              await api.post(
                "/auth/logout",
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
            } catch {
              // Même si le serveur échoue,
              // on déconnecte localement.
            }
          }
        } finally {
          setTimeout(() => {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }, 2200);
        }
      },

      // UPDATE PROFILE
      updateProfile: async ({ name, telephone, email }) => {
        try {
          set({ isLoading: true });

          const token = get().token;

          if (!token) {
            throw new Error("Utilisateur non authentifié.");
          }

          const response = await api.patch(
            "/profile",
            {
              name,
              telephone,
              email,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const updatedUser = response.data.user;

          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
          });

          throw error;
        }
      },

      // UPDATE PROFILE IMAGE
      // updateProfileImage: async (image) => {
      //   try {
      //     set({ isLoading: true });

      //     const token = get().token;

      //     if (!token) {
      //       throw new Error("Utilisateur non authentifié.");
      //     }

      //     const response = await api.patch(
      //       "/profile/image",
      //       {
      //         image,
      //       },
      //       {
      //         headers: {
      //           Authorization: `Bearer ${token}`,
      //         },
      //       },
      //     );

      //     const updatedUser = response.data.user;

      //     set({
      //       user: updatedUser,
      //       isLoading: false,
      //     });
      //   } catch (error) {
      //     set({
      //       isLoading: false,
      //     });

      //     throw error;
      //   }
      // },

      updateProfileImage: async (imageUri) => {
        try {
          set({ isLoading: true });

          const formData = new FormData();

          formData.append("image", {
            uri: imageUri,
            name: "profile.jpg",
            type: "image/jpeg",
          } as any);

          const response = await api.patch("/profile/image", formData);

          const updatedUser = response.data.user;

          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // UPDATE PASSWORD
      updatePassword: async ({
        currentPassword,
        newPassword,
        confirmPassword,
      }) => {
        try {
          set({ isLoading: true });

          await api.patch("/security/password", {
            currentPassword,
            newPassword,
            confirmPassword,
          });

          set({
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
          });

          throw error;
        }
      },

      // DELETE ACCOUNT
      deleteAccount: async () => {
        try {
          set({ isLoading: true });

          const token = get().token;

          if (!token) {
            throw new Error("Utilisateur non authentifié.");
          }

          await api.delete("/auth/delete", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
          });

          throw error;
        }
      },

      // USER DATA
      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      // TOKEN
      setToken: (token) => {
        set({
          token,
        });
      },

      // REFRESH USER DATA
      refreshUser: async () => {
        const response = await api.get("/profile");

        set({
          user: response.data.user,
        });
      },

      // CLEAR SESSION
      clearSession: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      initialize: () => {
        set({
          isInitialized: true,
        });
      },
    }),

    {
      name: "jardin-user-storage",

      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),

      onRehydrateStorage: () => {
        return (state) => {
          state?.initialize();
        };
      },
    },
  ),
);
