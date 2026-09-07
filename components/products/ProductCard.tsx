import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, fontSizes, fonts } from "@/utils/styles";

import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const formatSize = (volumeMl: number): string => {
  if (volumeMl >= 1000) {
    const liters = volumeMl / 1000;

    return Number.isInteger(liters) ? `${liters} L` : `${liters.toFixed(1)} L`;
  }

  return `${volumeMl} ml`;
};

const ProductCard = ({ product, onPress }: ProductCardProps) => {
  const activeVariants = product.variants.filter((variant) => variant.isActive);

  const variantVolumes = activeVariants
    .map((variant) => variant.volumeMl)
    .sort((a, b) => a - b);

  const displayedVolumes = variantVolumes.slice(0, 3).map(formatSize);

  const remainingVariants =
    variantVolumes.length > 3 ? variantVolumes.length - 3 : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(product)}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🧃</Text>
          </View>
        )}

        {/* Status */}
        <View
          style={[
            styles.statusBadge,
            product.isActive ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              product.isActive ? styles.activeDot : styles.inactiveDot,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              product.isActive ? styles.activeText : styles.inactiveText,
            ]}
          >
            {product.isActive ? "Actif" : "Inactif"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>

            {product.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {product.description}
              </Text>
            ) : (
              <Text style={styles.noDescription} numberOfLines={1}>
                Aucune description
              </Text>
            )}
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>

        {/* Variants */}
        <View style={styles.footer}>
          <View style={styles.variantInfo}>
            <View style={styles.variantIconContainer}>
              <Text style={styles.variantIcon}>◉</Text>
            </View>

            <Text style={styles.variantCount}>
              {activeVariants.length}{" "}
              {activeVariants.length > 1 ? "formats" : "format"}
            </Text>
          </View>

          {displayedVolumes.length > 0 && (
            <View style={styles.volumesContainer}>
              {displayedVolumes.map((volume, index) => (
                <View key={`${volume}-${index}`} style={styles.volumeBadge}>
                  <Text style={styles.volumeText}>{volume}</Text>
                </View>
              ))}

              {remainingVariants > 0 && (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreText}>+{remainingVariants}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  // ============================================================
  // IMAGE
  // ============================================================

  imageContainer: {
    width: 105,
    height: 135,
    position: "relative",
    backgroundColor: COLORS.neutral,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F6EF",
  },

  placeholderIcon: {
    fontSize: 34,
  },

  // ============================================================
  // STATUS
  // ============================================================

  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#EAF6EC",
  },

  inactiveBadge: {
    backgroundColor: "#F4F4F4",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.Gray,
  },

  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.darkGray,
  },

  // ============================================================
  // CONTENT
  // ============================================================

  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },

  name: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    lineHeight: 21,
    color: COLORS.text,
    marginBottom: 4,
  },

  description: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.darkGray,
  },

  noDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.Gray,
    fontStyle: "italic",
  },

  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },

  arrow: {
    fontFamily: fonts.medium,
    fontSize: 24,
    lineHeight: 25,
    color: COLORS.darkGray,
    marginTop: -2,
  },

  // ============================================================
  // FOOTER
  // ============================================================

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },

  variantInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },

  variantIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E2",
    marginRight: 6,
  },

  variantIcon: {
    fontSize: 12,
    color: COLORS.secondary,
  },

  variantCount: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.darkGray,
  },

  volumesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },

  volumeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#F1F6EF",
  },

  volumeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.primary,
  },

  moreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#F2F2F2",
  },

  moreText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.darkGray,
  },
});
