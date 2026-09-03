import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { router } from "expo-router";
import { ENDPOINT_URL } from "./env.variables";

export const api = axios.create({
  baseURL: ENDPOINT_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  async (config) => {
    const storage = await AsyncStorage.getItem("jardin-user-storage");

    if (storage) {
      try {
        const parsed = JSON.parse(storage);
        const token = parsed?.state?.token;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Ignore une donnée de stockage invalide
      }
    }

    // Pour FormData, on laisse Axios/React Native
    // définir automatiquement le Content-Type et le boundary.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expirée ou token invalide.");

      await AsyncStorage.removeItem("jardin-user-storage");

      router.replace("/auth");
    }

    return Promise.reject(error);
  },
);

// ============================================================
// SERVER CONNECTION
// ============================================================

export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get("/health");

    return response.status === 200 && response.data?.status === "ok";
  } catch (error) {
    console.error("Server connection error:", error);
    return false;
  }
};
