import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PointOfSale } from "@/types/pointOfSale";
import { COLORS, fonts } from "@/utils/styles";

type PointOfSaleCardProps = {
  pointOfSale: PointOfSale;
  onPress: () => void;
};

const PointOfSaleCard = ({ pointOfSale, onPress }: PointOfSaleCardProps) => {
  const isActive = pointOfSale.isActive;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="storefront-outline"
          size={25}
          color={isActive ? COLORS.primary : COLORS.Gray}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.name, !isActive && styles.inactiveName]}
            numberOfLines={1}
          >
            {pointOfSale.name}
          </Text>

          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={COLORS.Gray}
          />
        </View>

        <View style={styles.codeContainer}>
          <MaterialCommunityIcons
            name="tag-outline"
            size={15}
            color={COLORS.Gray}
          />

          <Text style={styles.code}>{pointOfSale.code}</Text>
        </View>

        <View style={styles.footer}>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isActive ? styles.activeDot : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                isActive ? styles.activeText : styles.inactiveText,
              ]}
            >
              {isActive ? "Actif" : "Inactif"}
            </Text>
          </View>

          {pointOfSale.telephone && (
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={14}
                color={COLORS.Gray}
              />

              <Text style={styles.infoText} numberOfLines={1}>
                {pointOfSale.telephone}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default PointOfSaleCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#F1F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  content: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },

  inactiveName: {
    color: COLORS.darkGray,
  },

  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
  },

  code: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: COLORS.Gray,
    letterSpacing: 0.4,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
    gap: 12,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  activeBadge: {
    backgroundColor: "#EAF6EA",
  },

  inactiveBadge: {
    backgroundColor: "#F1F1F1",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.Gray,
  },

  statusText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.Gray,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 4,
  },

  infoText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },
});
