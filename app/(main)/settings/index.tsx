import { useUserStore } from "@/store/userStore";
import {
  LINKS_SETTINGS,
  SECTION_CONFIG,
  SECTION_ORDER,
  type SettingsLink,
  type UserRole,
} from "@/utils/links";
import { COLORS, fonts, fontSizes, SETTINGS_COLORS } from "@/utils/styles";

import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SettingsScreen = () => {
  const router = useRouter();

  const user = useUserStore((state) => state.user);

  const role = user?.role as UserRole | undefined;

  /**
   * On garde uniquement les liens accessibles
   * au rôle de l'utilisateur connecté.
   */
  const visibleLinks = useMemo(() => {
    if (!role) return [];

    return LINKS_SETTINGS.filter((link) => link.roles.includes(role));
  }, [role]);

  /**
   * Regroupement des liens par section.
   */
  const sections = useMemo(() => {
    return SECTION_ORDER.map((section) => {
      const links = visibleLinks.filter((link) => link.section === section);

      return {
        section,
        ...SECTION_CONFIG[section],
        links,
      };
    }).filter((section) => section.links.length > 0);
  }, [visibleLinks]);

  const isEmployee = role === "EMPLOYEE";

  const getRoleLabel = () => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";

      case "MANAGER":
        return "Gestionnaire";

      case "EMPLOYEE":
        return "Employé";

      default:
        return "Utilisateur";
    }
  };

  const handleNavigate = (link: SettingsLink) => {
    router.push(link.value as never);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Paramètres</Text>

            <Text style={styles.headerSubtitle}>
              Gérez votre espace Jardin Pro
            </Text>
          </View>

          <View style={styles.settingsIcon}>
            <Feather name="settings" size={20} color={COLORS.primary} />
          </View>
        </View>

        {/* ==================================================
            PROFILE CARD
        ================================================== */}

        {user && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </Text>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.name}
              </Text>

              <Text style={styles.profilePhone} numberOfLines={1}>
                {user.telephone}
              </Text>

              <View style={styles.roleBadge}>
                <View style={styles.roleDot} />

                <Text style={styles.roleText}>{getRoleLabel()}</Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/settings/profile" as never)}
              style={({ pressed }) => [
                styles.profileArrow,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Feather name="chevron-right" size={20} color={COLORS.darkGray} />
            </Pressable>
          </View>
        )}

        {/* ==================================================
            EMPLOYEE INFO
        ================================================== */}

        {isEmployee && (
          <View style={styles.employeeCard}>
            <View style={styles.employeeIcon}>
              <Feather name="briefcase" size={18} color={COLORS.primary} />
            </View>

            <View style={styles.employeeInfo}>
              <Text style={styles.employeeTitle}>Espace employé</Text>

              <Text style={styles.employeeDescription}>
                Les options de gestion avancée sont réservées aux responsables.
              </Text>
            </View>
          </View>
        )}

        {/* ==================================================
            SECTIONS
        ================================================== */}

        {sections.map((section) => (
          <View key={section.section} style={styles.section}>
            {/* Section header */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              <Text style={styles.sectionDescription}>
                {section.description}
              </Text>
            </View>

            {/* Links */}

            <View style={styles.linksContainer}>
              {section.links.map((link, index) => (
                <SettingItem
                  key={link.value}
                  link={link}
                  isLast={index === section.links.length - 1}
                  onPress={() => handleNavigate(link)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* ==================================================
            VERSION
        ================================================== */}

        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <MaterialCommunityIcons
              name="leaf"
              size={14}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.footerText}>Jardin Pro</Text>

          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>

        {/* Important :
            espace supplémentaire pour ne pas que le
            bottom tab flottant recouvre le contenu.
        */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ============================================================
   SETTING ITEM
============================================================ */

type SettingItemProps = {
  link: SettingsLink;
  isLast: boolean;
  onPress: () => void;
};

const SettingItem = ({ link, isLast, onPress }: SettingItemProps) => {
  const colors = SETTINGS_COLORS[link.section];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingItem,
        !isLast && styles.settingItemBorder,
        pressed && styles.settingItemPressed,
      ]}
    >
      {/* ICON */}

      <View
        style={[
          styles.itemIcon,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {!link.value.includes("packaging") ? (
          <Feather
            name={link.icon as React.ComponentProps<typeof Feather>["name"]}
            size={18}
            color={colors.icon}
          />
        ) : (
          <MaterialCommunityIcons
            name="bottle-soda"
            size={30}
            color={colors.icon}
          />
        )}
      </View>

      {/* CONTENT */}

      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{link.label}</Text>

        {link.description && (
          <Text style={styles.itemDescription} numberOfLines={1}>
            {link.description}
          </Text>
        )}
      </View>

      {/* ARROW */}

      <Feather name="chevron-right" size={18} color={COLORS.darkGray} />
    </Pressable>
  );
};

export default SettingsScreen;

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,

    // Ton bottom tab est flottant.
    // On laisse suffisamment d'espace.
    paddingBottom: 120,
  },

  /* ========================================================
     HEADER
  ======================================================== */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 20,
  },

  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxlarge,

    color: COLORS.text,

    letterSpacing: -0.5,
  },

  headerSubtitle: {
    marginTop: 4,

    fontFamily: fonts.regular,
    fontSize: fontSizes.small,

    color: COLORS.darkGray,
  },

  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F0F2ED",

    borderWidth: 1,
    borderColor: "#E5E8E1",
  },

  /* ========================================================
     PROFILE
  ======================================================== */

  profileCard: {
    flexDirection: "row",
    alignItems: "center",

    padding: 14,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ECECE8",

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F0E5",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
  },

  avatarText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.primary,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  profileName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
    textTransform: "capitalize",
  },

  profilePhone: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,

    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#F0F5EE",
  },

  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginRight: 5,
    backgroundColor: COLORS.success,
  },

  roleText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: COLORS.primary,
  },

  profileArrow: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ========================================================
     EMPLOYEE
  ======================================================== */

  employeeCard: {
    flexDirection: "row",
    alignItems: "center",

    padding: 14,
    marginBottom: 24,
    borderRadius: 18,
    backgroundColor: "#F4F7F2",
    borderWidth: 1,
    borderColor: "#E3EBDD",
  },

  employeeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  employeeInfo: {
    flex: 1,
    marginLeft: 11,
  },

  employeeTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.primary,
  },

  employeeDescription: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.darkGray,
  },

  /* ========================================================
     SECTION
  ======================================================== */

  section: {
    marginBottom: 25,
  },

  sectionHeader: {
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  sectionDescription: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.darkGray,
  },

  /* ========================================================
     LINKS
  ======================================================== */

  linksContainer: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ECECE8",
  },

  settingItem: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0ED",
  },

  settingItemPressed: {
    backgroundColor: "#F8F9F6",
  },

  itemIcon: {
    width: 40,
    height: 40,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F0F5EE",
  },

  itemContent: {
    flex: 1,

    marginLeft: 12,
    marginRight: 10,
  },

  itemTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,

    color: COLORS.text,
  },

  itemDescription: {
    marginTop: 3,

    fontFamily: fonts.regular,
    fontSize: 10,

    color: COLORS.darkGray,
  },

  /* ========================================================
     FOOTER
  ======================================================== */

  footer: {
    alignItems: "center",

    marginTop: 8,
    marginBottom: 10,
  },

  footerLogo: {
    width: 28,
    height: 28,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E7F0E5",
  },

  footerText: {
    marginTop: 6,

    fontFamily: fonts.semibold,
    fontSize: 11,

    color: COLORS.primary,
  },

  footerVersion: {
    marginTop: 2,

    fontFamily: fonts.regular,
    fontSize: 9,

    color: COLORS.darkGray,
  },

  bottomSpace: {
    height: 20,
  },

  pressed: {
    opacity: 0.7,
  },
});
