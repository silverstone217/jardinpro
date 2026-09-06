import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, fontSizes, fonts } from "@/utils/styles";

import type {
  RawMaterialUnit,
  RawMaterialWithStock,
} from "@/types/rawMaterial";

type RawMaterialCardProps = {
  rawMaterial: RawMaterialWithStock;
  onPress: () => void;
  onManageStock: () => void;
  stockQuantity: number;
};

const UNIT_LABELS: Record<RawMaterialUnit, string> = {
  PIECE: "pièce(s)",
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "L",
};

const formatQuantity = (quantity: number | null | undefined): string => {
  const value = Number(quantity ?? 0);

  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
};

const RawMaterialCard = ({
  rawMaterial,
  onPress,
  onManageStock,
  stockQuantity,
}: RawMaterialCardProps) => {
  const unitLabel = UNIT_LABELS[rawMaterial.unit];

  const isLowStock =
    rawMaterial.minStock !== null && stockQuantity <= rawMaterial.minStock;

  return (
    <View style={styles.card}>
      {/* Zone principale */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.mainContent, pressed && styles.pressed]}
      >
        {/* Icône */}
        <View style={styles.iconContainer}>
          <Ionicons name="leaf-outline" size={24} color={COLORS.primary} />
        </View>

        {/* Informations */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {rawMaterial.name}
            </Text>

            {!rawMaterial.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactive</Text>
              </View>
            )}
          </View>

          <Text style={styles.unit}>Unité : {unitLabel}</Text>

          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockIndicator,
                isLowStock && styles.stockIndicatorLow,
              ]}
            />

            <Text style={[styles.stockText, isLowStock && styles.stockTextLow]}>
              {formatQuantity(stockQuantity)} {unitLabel}
            </Text>

            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <Ionicons
                  name="warning-outline"
                  size={13}
                  color={COLORS.error}
                />

                <Text style={styles.lowStockText}>Stock faible</Text>
              </View>
            )}
          </View>

          {rawMaterial.minStock !== null && (
            <Text style={styles.minStock}>
              Seuil minimum : {formatQuantity(rawMaterial.minStock)} {unitLabel}
            </Text>
          )}
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={COLORS.Gray} />
      </Pressable>

      {/* Gestion du stock */}
      <View style={styles.footer}>
        <Pressable
          onPress={onManageStock}
          style={({ pressed }) => [
            styles.stockButton,
            pressed && styles.stockButtonPressed,
          ]}
        >
          <Ionicons name="cube-outline" size={18} color={COLORS.white} />

          <Text style={styles.stockButtonText}>Gérer le stock</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RawMaterialCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  pressed: {
    opacity: 0.7,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EAF3E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContainer: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  name: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  unit: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    marginBottom: 8,
  },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },

  stockIndicatorLow: {
    backgroundColor: COLORS.error,
  },

  stockText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.success,
  },

  stockTextLow: {
    color: COLORS.error,
  },

  lowStockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#FDECEC",
  },

  lowStockText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.error,
  },

  minStock: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
    marginTop: 4,
  },

  inactiveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#F1F1F1",
  },

  inactiveBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.darkGray,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  stockButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  stockButtonPressed: {
    opacity: 0.8,
  },

  stockButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },
});
