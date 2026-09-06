import { Packaging } from "@/types/packaging";
import { COLORS, fonts, fontSizes } from "@/utils/styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PackagingCardProps = {
  packaging: Packaging;
  sizeLabel: string;
  stockQuantity: number;
  onPress: () => void;
  onManageStock: () => void;
};

const PackagingCard = ({
  packaging,
  sizeLabel,
  stockQuantity,
  onPress,
  onManageStock,
}: PackagingCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Partie supérieure */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons
            name="bottle-soda"
            size={38}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {packaging.name}
            </Text>

            <View
              style={[
                styles.statusBadge,
                packaging.isActive ? styles.activeBadge : styles.inactiveBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  packaging.isActive ? styles.activeDot : styles.inactiveDot,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  packaging.isActive ? styles.activeText : styles.inactiveText,
                ]}
              >
                {packaging.isActive ? "Actif" : "Inactif"}
              </Text>
            </View>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="water-outline" size={15} color={COLORS.Gray} />

              <Text style={styles.metaText}>{sizeLabel}</Text>
            </View>

            <View style={styles.metaSeparator} />

            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={15} color={COLORS.Gray} />

              <Text style={styles.metaText}>Pièce</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stock */}
      <View style={styles.stockSection}>
        <View style={styles.stockInfo}>
          <View style={styles.stockIcon}>
            <MaterialCommunityIcons
              name="package-variant"
              size={18}
              color={COLORS.primary}
            />
          </View>

          <View>
            <Text style={styles.stockLabel}>Stock disponible</Text>

            <Text style={styles.stockQuantity}>
              {stockQuantity}{" "}
              <Text style={styles.stockUnit}>
                pièce{stockQuantity > 1 ? "s" : ""}
              </Text>
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onManageStock}
          style={({ pressed }) => [
            styles.stockButton,
            pressed && styles.stockButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="package-variant-plus"
            size={18}
            color={COLORS.white}
          />

          <Text style={styles.stockButtonText}>Stock</Text>
        </Pressable>
      </View>

      {/* Indication détails */}
      <View style={styles.detailsHint}>
        <Text style={styles.detailsHintText}>Voir les détails</Text>

        <Ionicons name="chevron-forward" size={17} color={COLORS.Gray} />
      </View>
    </Pressable>
  );
};

export default PackagingCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },

  /* =========================
     HEADER
  ========================= */

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  cardIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginRight: 13,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  cardTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
  },

  /* =========================
     STATUT
  ========================= */

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },

  activeBadge: {
    backgroundColor: "#EAF6EC",
  },

  inactiveBadge: {
    backgroundColor: "#FDECEC",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.error,
  },

  statusText: {
    fontFamily: fonts.medium,
    fontSize: 10,
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.error,
  },

  /* =========================
     META
  ========================= */

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 9,
  },

  /* =========================
     STOCK
  ========================= */

  stockSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  stockIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F6EF",
    marginRight: 10,
  },

  stockLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
    marginBottom: 2,
  },

  stockQuantity: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.primary,
  },

  stockUnit: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.darkGray,
  },

  /* =========================
     BOUTON STOCK
  ========================= */

  stockButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  stockButtonPressed: {
    opacity: 0.75,
  },

  stockButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.white,
  },

  /* =========================
     DETAILS
  ========================= */

  detailsHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },

  detailsHintText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.Gray,
    marginRight: 3,
  },
});
