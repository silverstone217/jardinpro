import { useShopStore } from "@/store/shopStore";
import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import FormShop from "@/components/shop/FormShop";
import { COLORS } from "@/utils/styles";

const ShopScreen = () => {
  const shop = useShopStore((state) => state.shop);
  const isLoading = useShopStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <FormShop key={shop?.id ?? "create"} shop={shop} />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ShopScreen;
