import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  ProductDetails,
  ProductImageInput,
  ProductVariant,
} from "@/types/product";

import { COLORS, fontSizes, fonts } from "@/utils/styles";

interface ProductDetailsModalProps {
  visible: boolean;
  product: ProductDetails | null;

  onClose: () => void;
  onEdit: (product: ProductDetails) => void;
  onToggleStatus: (product: ProductDetails) => void;
  onAddVariant: (product: ProductDetails) => void;
  onEditVariant: (product: ProductDetails, variant: ProductVariant) => void;
  onToggleVariantStatus: (
    product: ProductDetails,
    variant: ProductVariant,
  ) => void;

  /**
   * Ouvre le gestionnaire de recette du produit.
   * Le parent pourra ensuite afficher RecipeFormModal.
   */
  onManageRecipe: (product: ProductDetails) => void;

  /**
   * Gestion de l'image du produit.
   */
  onUpdateImage: (
    product: ProductDetails,
    image: ProductImageInput,
  ) => void | Promise<void>;

  onRemoveImage: (product: ProductDetails) => void | Promise<void>;

  /**
   * Indique si une opération d'image est en cours.
   */
  isImageSaving?: boolean;

  error?: string | null;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const formatPrice = (price: number): string => {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
};

const formatVolume = (volumeMl: number): string => {
  if (volumeMl >= 1000) {
    const liters = volumeMl / 1000;

    return Number.isInteger(liters) ? `${liters} L` : `${liters.toFixed(1)} L`;
  }

  return `${volumeMl} ml`;
};

const getSizeLabel = (size: ProductVariant["size"]): string => {
  switch (size) {
    case "ML_200":
      return "200 ml";

    case "ML_500":
      return "500 ml";

    default:
      return size;
  }
};

const getExtension = (mimeType: string): string => {
  switch (mimeType) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
};

const ProductDetailsModal = ({
  visible,
  product,
  onClose,
  onEdit,
  onToggleStatus,
  onAddVariant,
  onEditVariant,
  onToggleVariantStatus,
  onManageRecipe,
  onUpdateImage,
  onRemoveImage,
  isImageSaving = false,
  error = null,
}: ProductDetailsModalProps) => {
  const [isPickingImage, setIsPickingImage] = useState(false);

  const activeVariants = useMemo(
    () => product?.variants.filter((variant) => variant.isActive) ?? [],
    [product],
  );

  const inactiveVariants = useMemo(
    () => product?.variants.filter((variant) => !variant.isActive) ?? [],
    [product],
  );

  if (!product) {
    return null;
  }

  /**
   * ============================================================
   * IMAGE
   * ============================================================
   */

  const handlePickImage = async () => {
    if (isImageSaving || isPickingImage) {
      return;
    }

    try {
      setIsPickingImage(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Autorisation requise",
          "L'accès aux photos est nécessaire pour modifier l'image du produit.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      const mimeType = asset.mimeType?.toLowerCase() ?? "image/jpeg";

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(mimeType)) {
        Alert.alert(
          "Format non supporté",
          "Utilisez une image JPG, PNG ou WebP.",
        );

        return;
      }

      if (asset.fileSize !== undefined && asset.fileSize > MAX_IMAGE_SIZE) {
        Alert.alert(
          "Image trop volumineuse",
          "L'image ne doit pas dépasser 2 Mo.",
        );

        return;
      }

      const image: ProductImageInput = {
        uri: asset.uri,
        name:
          asset.fileName ?? `product-${Date.now()}.${getExtension(mimeType)}`,
        type: mimeType,
      };

      await onUpdateImage(product, image);
    } catch (error) {
      console.error("handlePickImage error:", error);

      Alert.alert("Erreur", "Impossible de sélectionner ou modifier l'image.");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (isImageSaving || isPickingImage || !product.image) {
      return;
    }

    Alert.alert(
      "Supprimer l'image",
      "Voulez-vous vraiment supprimer l'image de ce produit ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await onRemoveImage(product);
            } catch (error) {
              console.error("handleRemoveImage error:", error);
            }
          },
        },
      ],
    );
  };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Détails du produit</Text>

              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {product.name}
              </Text>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              disabled={isImageSaving || isPickingImage}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={COLORS.darkGray} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ==================================================
                ERROR
            ================================================== */}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={COLORS.error}
                />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ==================================================
                PRODUCT PRESENTATION
            ================================================== */}

            <View style={styles.productCard}>
              <View style={styles.productImageContainer}>
                {product.image ? (
                  <Image
                    source={{
                      uri: product.image,
                    }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons
                      name="cafe-outline"
                      size={38}
                      color={COLORS.primary}
                    />
                  </View>
                )}

                {isImageSaving || isPickingImage ? (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color={COLORS.white} />
                  </View>
                ) : null}
              </View>

              <View style={styles.productInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      product.isActive
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        product.isActive
                          ? styles.activeDot
                          : styles.inactiveDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        product.isActive
                          ? styles.activeText
                          : styles.inactiveText,
                      ]}
                    >
                      {product.isActive ? "Actif" : "Inactif"}
                    </Text>
                  </View>
                </View>

                {product.description ? (
                  <Text style={styles.description} numberOfLines={3}>
                    {product.description}
                  </Text>
                ) : (
                  <Text style={styles.noDescription}>Aucune description</Text>
                )}
              </View>
            </View>

            {/* ==================================================
                IMAGE ACTIONS
            ================================================== */}

            <View style={styles.imageActionsSection}>
              <View style={styles.imageActionsHeader}>
                <View style={styles.imageSectionTitleRow}>
                  <View style={styles.imageSectionIcon}>
                    <Ionicons
                      name="image-outline"
                      size={17}
                      color={COLORS.primary}
                    />
                  </View>

                  <View>
                    <Text style={styles.imageSectionTitle}>
                      Image du produit
                    </Text>

                    <Text style={styles.imageSectionSubtitle}>
                      Gérez la photo du produit
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.imageActionsRow}>
                <Pressable
                  style={[
                    styles.imageActionButton,
                    isImageSaving || isPickingImage
                      ? styles.actionDisabled
                      : null,
                  ]}
                  onPress={handlePickImage}
                  disabled={isImageSaving || isPickingImage}
                >
                  {isImageSaving || isPickingImage ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons
                      name="camera-outline"
                      size={19}
                      color={COLORS.primary}
                    />
                  )}

                  <Text style={styles.imageActionButtonText}>
                    {product.image ? "Modifier l'image" : "Ajouter une image"}
                  </Text>
                </Pressable>

                {product.image ? (
                  <Pressable
                    style={[
                      styles.removeImageButton,
                      isImageSaving || isPickingImage
                        ? styles.actionDisabled
                        : null,
                    ]}
                    onPress={handleRemoveImage}
                    disabled={isImageSaving || isPickingImage}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={COLORS.error}
                    />

                    <Text style={styles.removeImageButtonText}>Supprimer</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Résumé</Text>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {product.variants.length}
                  </Text>

                  <Text style={styles.summaryLabel}>
                    {product.variants.length > 1 ? "Variantes" : "Variante"}
                  </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <Text
                    style={[styles.summaryValue, styles.activeSummaryValue]}
                  >
                    {activeVariants.length}
                  </Text>

                  <Text style={styles.summaryLabel}>Actives</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryItem}>
                  <Text
                    style={[
                      styles.summaryValue,
                      inactiveVariants.length > 0 &&
                        styles.inactiveSummaryValue,
                    ]}
                  >
                    {inactiveVariants.length}
                  </Text>

                  <Text style={styles.summaryLabel}>Inactives</Text>
                </View>
              </View>
            </View>

            {/* ==================================================
                RECIPE
            ================================================== */}

            <View style={styles.recipeSection}>
              <View style={styles.recipeHeader}>
                <View style={styles.recipeHeaderLeft}>
                  <View style={styles.recipeIconContainer}>
                    <Ionicons
                      name="flask-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.recipeHeaderTexts}>
                    <Text style={styles.recipeTitle}>Recette</Text>

                    <Text style={styles.recipeSubtitle}>
                      {product.ingredients.length > 0
                        ? `${product.ingredients.length} ${
                            product.ingredients.length > 1
                              ? "ingrédients"
                              : "ingrédient"
                          }`
                        : "Aucun ingrédient configuré"}
                    </Text>
                  </View>
                </View>

                <View style={styles.recipeVolumeBadge}>
                  <Text style={styles.recipeVolumeValue}>
                    {formatVolume(product.recipeVolumeMl)}
                  </Text>
                </View>
              </View>

              <View style={styles.recipeInfo}>
                <View style={styles.recipeInfoIcon}>
                  <Ionicons
                    name="analytics-outline"
                    size={17}
                    color={COLORS.secondary}
                  />
                </View>

                <Text style={styles.recipeInfoText}>
                  Rendement d&apos;une recette de base
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.recipeButton,
                  pressed && styles.pressed,
                  (isImageSaving || isPickingImage) && styles.actionDisabled,
                ]}
                onPress={() => onManageRecipe(product)}
                disabled={isImageSaving || isPickingImage}
              >
                <Ionicons
                  name={
                    product.ingredients.length > 0
                      ? "create-outline"
                      : "add-circle-outline"
                  }
                  size={20}
                  color={COLORS.primary}
                />

                <Text style={styles.recipeButtonText}>
                  {product.ingredients.length > 0
                    ? "Modifier la recette"
                    : "Créer la recette"}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={COLORS.Gray}
                />
              </Pressable>
            </View>

            {/* ==================================================
                VARIANTS
            ================================================== */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Formats disponibles</Text>

                  <Text style={styles.sectionSubtitle}>
                    Prix et emballage par format
                  </Text>
                </View>

                <Pressable
                  style={styles.addVariantButton}
                  onPress={() => onAddVariant(product)}
                  disabled={isImageSaving || isPickingImage}
                >
                  <Ionicons name="add" size={17} color={COLORS.primary} />

                  <Text style={styles.addVariantButtonText}>Ajouter</Text>
                </Pressable>
              </View>

              {product.variants.length === 0 ? (
                <View style={styles.emptyVariants}>
                  <View style={styles.emptyVariantIconContainer}>
                    <Ionicons
                      name="layers-outline"
                      size={28}
                      color={COLORS.Gray}
                    />
                  </View>

                  <Text style={styles.emptyVariantTitle}>
                    Aucun format configuré
                  </Text>

                  <Text style={styles.emptyVariantText}>
                    Ajoutez un format 200 ml ou 500 ml pour pouvoir produire et
                    vendre ce produit.
                  </Text>

                  <Pressable
                    style={styles.emptyAddButton}
                    onPress={() => onAddVariant(product)}
                    disabled={isImageSaving || isPickingImage}
                  >
                    <Text style={styles.emptyAddButtonText}>
                      Ajouter un format
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.variantsList}>
                  {product.variants.map((variant) => (
                    <View
                      key={variant.id}
                      style={[
                        styles.variantCard,
                        !variant.isActive && styles.variantCardInactive,
                      ]}
                    >
                      <View style={styles.variantMain}>
                        <View style={styles.variantIconContainer}>
                          <Ionicons
                            name="water-outline"
                            size={22}
                            color={COLORS.secondary}
                          />
                        </View>

                        <View style={styles.variantInfo}>
                          <View style={styles.variantTitleRow}>
                            <Text style={styles.variantTitle}>
                              {getSizeLabel(variant.size)}
                            </Text>

                            <View
                              style={[
                                styles.variantStatusBadge,
                                variant.isActive
                                  ? styles.variantActiveBadge
                                  : styles.variantInactiveBadge,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.variantStatusText,
                                  variant.isActive
                                    ? styles.variantActiveText
                                    : styles.variantInactiveText,
                                ]}
                              >
                                {variant.isActive ? "Actif" : "Inactif"}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.packagingName} numberOfLines={1}>
                            {variant.packaging.name}
                          </Text>

                          <View style={styles.variantMeta}>
                            <Text style={styles.variantPrice}>
                              {formatPrice(variant.price)}
                            </Text>

                            <View style={styles.metaDot} />

                            <Text style={styles.volumeText}>
                              {formatVolume(variant.volumeMl)}
                            </Text>
                          </View>

                          {variant.sku ? (
                            <Text style={styles.skuText} numberOfLines={1}>
                              SKU : {variant.sku}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.variantActions}>
                        <Pressable
                          style={styles.variantActionButton}
                          onPress={() => onEditVariant(product, variant)}
                          disabled={isImageSaving || isPickingImage}
                        >
                          <Ionicons
                            name="create-outline"
                            size={15}
                            color={COLORS.darkGray}
                          />

                          <Text style={styles.variantActionText}>Modifier</Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.variantActionButton,
                            variant.isActive
                              ? styles.deactivateButton
                              : styles.activateButton,
                          ]}
                          onPress={() =>
                            onToggleVariantStatus(product, variant)
                          }
                          disabled={isImageSaving || isPickingImage}
                        >
                          <Ionicons
                            name={
                              variant.isActive
                                ? "remove-circle-outline"
                                : "checkmark-circle-outline"
                            }
                            size={15}
                            color={
                              variant.isActive ? COLORS.error : COLORS.success
                            }
                          />

                          <Text
                            style={[
                              styles.variantActionText,
                              variant.isActive
                                ? styles.deactivateText
                                : styles.activateText,
                            ]}
                          >
                            {variant.isActive ? "Désactiver" : "Activer"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ==================================================
                PRODUCT ACTIONS
            ================================================== */}

            <View style={styles.actionsSection}>
              <Pressable
                style={styles.editButton}
                onPress={() => onEdit(product)}
                disabled={isImageSaving || isPickingImage}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={COLORS.white}
                />

                <Text style={styles.editButtonText}>Modifier le produit</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.statusButton,
                  product.isActive
                    ? styles.disableProductButton
                    : styles.enableProductButton,
                ]}
                onPress={() => onToggleStatus(product)}
                disabled={isImageSaving || isPickingImage}
              >
                <Ionicons
                  name={
                    product.isActive
                      ? "remove-circle-outline"
                      : "checkmark-circle-outline"
                  }
                  size={18}
                  color={product.isActive ? COLORS.error : COLORS.success}
                />

                <Text
                  style={[
                    styles.statusButtonText,
                    product.isActive
                      ? styles.disableProductText
                      : styles.enableProductText,
                  ]}
                >
                  {product.isActive
                    ? "Désactiver le produit"
                    : "Activer le produit"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ProductDetailsModal;

/**
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    width: "100%",
    maxHeight: "94%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  headerTitleContainer: {
    flex: 1,
    paddingRight: 12,
  },

  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.Gray,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F3F3",
  },

  scrollView: {
    flexGrow: 0,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderRadius: 14,
    marginBottom: 14,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F6CACA",
  },

  errorText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    lineHeight: 18,
    color: COLORS.error,
  },

  // ==========================================================
  // PRODUCT
  // ==========================================================

  productCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  productImageContainer: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F6EF",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  productImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  imageLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },

  productInfo: {
    flex: 1,
    marginLeft: 13,
    justifyContent: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  productName: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.text,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#EAF6EC",
  },

  inactiveBadge: {
    backgroundColor: "#F1F1F1",
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

  description: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.darkGray,
  },

  noDescription: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.Gray,
    fontStyle: "italic",
  },

  // ==========================================================
  // IMAGE ACTIONS
  // ==========================================================

  imageActionsSection: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  imageActionsHeader: {
    marginBottom: 12,
  },

  imageSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  imageSectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3E8",
  },

  imageSectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 16,
    color: COLORS.text,
  },

  imageSectionSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  imageActionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  imageActionButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "#F1F6EF",
    borderWidth: 1,
    borderColor: "#DCE9D9",
  },

  imageActionButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.primary,
  },

  removeImageButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#F3D7D7",
  },

  removeImageButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.error,
  },

  actionDisabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
  },

  // ==========================================================
  // SECTIONS
  // ==========================================================

  section: {
    marginTop: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    lineHeight: 21,
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.Gray,
  },

  // ==========================================================
  // SUMMARY
  // ==========================================================

  summaryGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.text,
  },

  activeSummaryValue: {
    color: COLORS.success,
  },

  inactiveSummaryValue: {
    color: COLORS.error,
  },

  summaryLabel: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E8E8E8",
  },

  // ==========================================================
  // RECIPE
  // ==========================================================

  recipeSection: {
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8EDE6",
  },

  recipeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recipeHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  recipeIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3E8",
  },

  recipeHeaderTexts: {
    flex: 1,
    marginLeft: 11,
  },

  recipeTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    lineHeight: 21,
    color: COLORS.text,
  },

  recipeSubtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.Gray,
  },

  recipeVolumeBadge: {
    marginLeft: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#EAF3E8",
  },

  recipeVolumeValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: 16,
    color: COLORS.primary,
  },

  recipeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: "#FFF7E8",
  },

  recipeInfoIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0D2",
  },

  recipeInfoText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.darkGray,
  },

  recipeButton: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 13,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FBF6",
    borderWidth: 1,
    borderColor: "#DCEBD8",
  },

  recipeButtonText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.primary,
  },

  // ==========================================================
  // ADD VARIANT
  // ==========================================================

  addVariantButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F6EF",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  addVariantButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.primary,
  },

  // ==========================================================
  // EMPTY VARIANTS
  // ==========================================================

  emptyVariants: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  emptyVariantIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },

  emptyVariantTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    lineHeight: 21,
    color: COLORS.text,
  },

  emptyVariantText: {
    marginTop: 5,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.Gray,
  },

  emptyAddButton: {
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },

  emptyAddButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.white,
  },

  // ==========================================================
  // VARIANTS
  // ==========================================================

  variantsList: {
    gap: 10,
  },

  variantCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  variantCardInactive: {
    opacity: 0.72,
  },

  variantMain: {
    flexDirection: "row",
  },

  variantIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E2",
  },

  variantInfo: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  variantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  variantTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    lineHeight: 21,
    color: COLORS.text,
  },

  variantStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },

  variantActiveBadge: {
    backgroundColor: "#EAF6EC",
  },

  variantInactiveBadge: {
    backgroundColor: "#F1F1F1",
  },

  variantStatusText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    lineHeight: 12,
  },

  variantActiveText: {
    color: COLORS.success,
  },

  variantInactiveText: {
    color: COLORS.Gray,
  },

  packagingName: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.darkGray,
  },

  variantMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  variantPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: COLORS.primary,
  },

  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.Gray,
    marginHorizontal: 7,
  },

  volumeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.darkGray,
  },

  skuText: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 13,
    color: COLORS.Gray,
  },

  // ==========================================================
  // VARIANT ACTIONS
  // ==========================================================

  variantActions: {
    flexDirection: "row",
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 8,
  },

  variantActionButton: {
    flex: 1,
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 9,
    backgroundColor: "#F5F5F5",
  },

  variantActionText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.darkGray,
  },

  activateButton: {
    backgroundColor: "#EAF6EC",
  },

  deactivateButton: {
    backgroundColor: "#FFF1F1",
  },

  activateText: {
    color: COLORS.success,
  },

  deactivateText: {
    color: COLORS.error,
  },

  // ==========================================================
  // PRODUCT ACTIONS
  // ==========================================================

  actionsSection: {
    marginTop: 18,
    gap: 9,
  },

  editButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },

  editButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.white,
  },

  statusButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    borderWidth: 1,
  },

  disableProductButton: {
    backgroundColor: "#FFF5F5",
    borderColor: "#F3D7D7",
  },

  enableProductButton: {
    backgroundColor: "#F0F8F1",
    borderColor: "#D5E9D7",
  },

  statusButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 17,
  },

  disableProductText: {
    color: COLORS.error,
  },

  enableProductText: {
    color: COLORS.success,
  },
});
