import { useUserStore } from "@/store/userStore";
import { APP_NAME } from "@/utils/data";
import { COLORS, fonts, fontSizes } from "@/utils/styles";

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MainLayout = () => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarShowLabel: true,

          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.darkGray,

          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarLabelStyle: styles.tabLabel,

          tabBarHideOnKeyboard: true,
        }}
      >
        {/* =====================================================
          ACCUEIL
      ===================================================== */}

        <Tabs.Screen
          name="index"
          options={{
            title: "Accueil",

            headerShown: true,

            header: () => (
              <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
                <View style={styles.header}>
                  {/* Logo + nom */}

                  <View style={styles.brandContainer}>
                    <View style={styles.brandIcon}>
                      <MaterialCommunityIcons
                        name="leaf"
                        size={19}
                        color={COLORS.primary}
                      />
                    </View>

                    <View>
                      <Text style={styles.brandName}>{APP_NAME}</Text>

                      <Text style={styles.brandSubtitle}>
                        ESPACE PROFESSIONNEL
                      </Text>
                    </View>
                  </View>

                  {/* Notifications */}

                  <Pressable
                    style={({ pressed }) => [
                      styles.notificationButton,
                      pressed && styles.pressed,
                    ]}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={21}
                      color={COLORS.text}
                    />

                    <View style={styles.notificationBadge} />
                  </Pressable>
                </View>
              </SafeAreaView>
            ),

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="home" />
            ),
          }}
        />

        {/* =====================================================
          COMMANDES
      ===================================================== */}

        <Tabs.Screen
          name="orders"
          options={{
            title: "Commandes",

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="shopping-bag" />
            ),
          }}
        />

        {/* =====================================================
          FACTURES
      ===================================================== */}

        <Tabs.Screen
          name="invoices"
          options={{
            title: "Factures",

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="file-text" />
            ),
          }}
        />

        {/* =====================================================
          PARAMÈTRES
      ===================================================== */}

        <Tabs.Screen
          name="settings"
          options={{
            title: "Paramètres",

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="settings" />
            ),
          }}
        />
      </Tabs>
      <StatusBar
        animated
        barStyle={"dark-content"}
        backgroundColor={"transparent"}
      />
    </>
  );
};

/* ============================================================
   TAB ICON
============================================================ */

type TabIconProps = {
  focused: boolean;
  icon: React.ComponentProps<typeof Feather>["name"];
};

const TabIcon = ({ focused, icon }: TabIconProps) => {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Feather
        name={icon}
        size={20}
        color={focused ? COLORS.white : COLORS.darkGray}
      />
    </View>
  );
};

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  /* ========================================================
     HEADER
  ======================================================== */

  headerSafeArea: {
    backgroundColor: COLORS.white,
  },

  header: {
    height: 62,

    paddingHorizontal: 20,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: COLORS.white,
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandIcon: {
    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E7F0E5",
  },

  brandName: {
    marginLeft: 10,

    fontFamily: fonts.bold,
    fontSize: fontSizes.large,

    color: COLORS.primary,

    letterSpacing: -0.3,
  },

  brandSubtitle: {
    marginLeft: 11,
    marginTop: 1,

    fontFamily: fonts.semibold,
    fontSize: 8,

    color: COLORS.darkGray,

    letterSpacing: 1.1,
  },

  notificationButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: "#ECECE8",
  },

  notificationBadge: {
    position: "absolute",

    top: 9,
    right: 9,

    width: 6,
    height: 6,

    borderRadius: 6,

    backgroundColor: COLORS.secondary,

    borderWidth: 1,
    borderColor: COLORS.white,
  },

  pressed: {
    opacity: 0.65,
  },

  /* ========================================================
     TAB BAR
  ======================================================== */

  tabBar: {
    position: "absolute",

    // left: 20,
    // right: 20,
    bottom: 14,
    marginHorizontal: 20,

    height: 70,

    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 8,

    borderRadius: 24,

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: "#ECECE8",

    shadowColor: COLORS.black,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.1,
    shadowRadius: 18,

    elevation: 10,
  },

  tabItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 18,
  },

  tabLabel: {
    marginTop: 3,

    fontFamily: fonts.semibold,
    fontSize: 10,

    lineHeight: 13,
  },

  /* ========================================================
     TAB ICON
  ======================================================== */

  iconContainer: {
    width: 38,
    height: 34,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",
  },

  iconContainerActive: {
    backgroundColor: COLORS.primary,
  },
});

export default MainLayout;
