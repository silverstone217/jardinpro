import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { ENDPOINT_URL } from "./env.variables";

export const api = axios.create({
  baseURL: ENDPOINT_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    return config;
  },
  (error) => Promise.reject(error),
);

export const checkServerConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get("/health");

    return response.status === 200 && response.data?.status === "ok";
  } catch (error) {
    console.error("Server connection error:", error);

    return false;
  }
};
