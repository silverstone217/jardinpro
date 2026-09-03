// import { useUserStore } from "@/store/userStore";
import { useUserStore } from "@/store/userStore";
import { COLORS } from "@/utils/styles";
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from "expo-google-fonts-manrope";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, StatusBar, View } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => {
  // Le splash peut déjà être contrôlé par Expo.
});

const MIN_SPLASH_DURATION = 4000;

export default function RootLayout() {
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_300Light,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  const [minimumTimePassed, setMinimumTimePassed] = useState(false);

  const refreshUser = useUserStore((state) => state.refreshUser);

  /**
   * Garde le splash affiché pendant au moins 4 secondes.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimePassed(true);
    }, MIN_SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Synchronisation au démarrage
    refreshUser().catch((error) => {
      console.log("Synchronisation utilisateur échouée :", error);
    });

    // Synchronisation lorsque l'application revient au premier plan
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshUser().catch((error) => {
          console.log("Synchronisation utilisateur échouée :", error);
        });
      }
    });

    return () => subscription.remove();
  }, [refreshUser]);

  const appReady = fontsLoaded && minimumTimePassed;

  const onLayoutRootView = useCallback(async () => {
    if (!appReady) {
      return;
    }

    await SplashScreen.hideAsync();
  }, [appReady]);

  // const user = useUserStore((state) => state.user);

  if (!appReady) {
    return null;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View
      onLayout={onLayoutRootView}
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <StatusBar animated barStyle={"dark-content"} />
    </View>
  );
}
