import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProductCard from "@/components/products/ProductCard";
import ProductDetailsModal from "@/components/products/ProductDetailsModal";
import ProductFormModal from "@/components/products/ProductFormModal";
import ProductVariantFormModal from "@/components/products/ProductVariantFormModal";
import RecipeFormModal from "@/components/products/RecipeFormModal";

import { usePackagingStore } from "@/store/packagingStore";
import { useRawMaterialStore } from "@/store/rawMaterialStore";
import { useProductStore } from "@/store/useProductStore";
import { useRecipeStore } from "@/store/useRecipeStore";

import type {
  Product,
  ProductDetails,
  ProductImageInput,
  ProductVariant,
} from "@/types/product";

import type { ProductRecipe, UpdateProductRecipeInput } from "@/types/recipe";

import { COLORS, fontSizes, fonts } from "@/utils/styles";

export default function ProductsScreen() {
  const {
    products,
    selectedProduct,
    isLoading,
    isRefreshing,
    isSaving,
    isSavingVariant,
    error,
    fetchProducts,
    refreshProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    updateProductStatus,
    updateProductImage,
    removeProductImage,
    fetchVariants,
    createVariant,
    updateVariant,
    updateVariantStatus,
    setSelectedProduct,
    setSelectedVariant,
    clearError,
  } = useProductStore();

  const {
    packagings,
    isLoading: isLoadingPackagings,
    fetchPackagings,
  } = usePackagingStore();

  const {
    rawMaterials,
    isLoading: isLoadingRawMaterials,
    fetchRawMaterials,
  } = useRawMaterialStore();

  const {
    recipe,
    isLoading: isLoadingRecipe,
    isSaving: isSavingRecipe,
    error: recipeError,
    getProductRecipe,
    saveProductRecipe,
    clearRecipe,
    clearError: clearRecipeError,
  } = useRecipeStore();

  const [search, setSearch] = useState("");

  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);

  const [editingProduct, setEditingProduct] = useState<ProductDetails | null>(
    null,
  );

  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null,
  );

  const [recipeProduct, setRecipeProduct] = useState<ProductDetails | null>(
    null,
  );

  const [isSavingImage, setIsSavingImage] = useState(false);

  // ============================================================
  // Chargement initial
  // ============================================================

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchProducts(), fetchPackagings()]);
      } catch {
        // Les stores gèrent déjà leurs erreurs.
      }
    };

    load();
  }, [fetchProducts, fetchPackagings]);

  // ============================================================
  // Recherche avec debounce léger
  // ============================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts({
        search: search.trim() || undefined,
      }).catch(() => {
        // Erreur déjà gérée par le store.
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, fetchProducts]);

  // ============================================================
  // Produits visibles
  // ============================================================

  const visibleProducts = useMemo(() => {
    return products;
  }, [products]);

  // ============================================================
  // Refresh
  // ============================================================

  const handleRefresh = useCallback(async () => {
    try {
      await refreshProducts();
    } catch {
      // Erreur gérée par le store.
    }
  }, [refreshProducts]);

  // ============================================================
  // Ouvrir les détails
  // ============================================================

  const handleOpenProduct = useCallback(
    async (product: Product) => {
      try {
        const details = await fetchProductById(product.id);

        setSelectedProduct(details);
        setShowProductDetails(true);

        await fetchVariants(product.id);
      } catch {
        // Erreur gérée par le store.
      }
    },
    [fetchProductById, fetchVariants, setSelectedProduct],
  );

  // ============================================================
  // Ouvrir création produit
  // ============================================================

  const handleOpenCreateProduct = useCallback(() => {
    clearError();

    setEditingProduct(null);
    setShowProductDetails(false);
    setShowProductForm(true);
  }, [clearError]);

  // ============================================================
  // Ouvrir modification produit
  // ============================================================

  const handleOpenEditProduct = useCallback(
    (product: ProductDetails) => {
      clearError();

      setEditingProduct(product);
      setShowProductDetails(false);
      setShowProductForm(true);
    },
    [clearError],
  );

  // ============================================================
  // Sauvegarde produit
  // ============================================================

  const handleSubmitProduct = useCallback(
    async (data: {
      name: string;
      description?: string;
      recipeVolumeMl: number;
      image?: ProductImageInput;
    }) => {
      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, {
            name: data.name,
            description: data.description,
            recipeVolumeMl: data.recipeVolumeMl,
          });

          const updatedProduct = await fetchProductById(editingProduct.id);

          setSelectedProduct(updatedProduct);
        } else {
          await createProduct(data);
        }

        setShowProductForm(false);
        setEditingProduct(null);
      } catch {
        // L'erreur est affichée dans la modale via le store.
      }
    },
    [
      editingProduct,
      updateProduct,
      createProduct,
      fetchProductById,
      setSelectedProduct,
    ],
  );

  // ============================================================
  // Modifier l'image du produit
  // ============================================================

  const handleChangeProductImage = useCallback(
    async (product: ProductDetails, image: ProductImageInput) => {
      if (isSavingImage) {
        return;
      }

      try {
        clearError();
        setIsSavingImage(true);

        const updatedProduct = await updateProductImage(product.id, image);

        setSelectedProduct({
          ...product,
          ...updatedProduct,
          variants: product.variants,
        });

        await fetchProducts({
          search: search.trim() || undefined,
        });
      } catch {
        // L'erreur est gérée par le store.
      } finally {
        setIsSavingImage(false);
      }
    },
    [
      isSavingImage,
      clearError,
      updateProductImage,
      setSelectedProduct,
      fetchProducts,
      search,
    ],
  );

  // ============================================================
  // Supprimer l'image du produit
  // ============================================================

  const handleRemoveProductImage = useCallback(
    async (product: ProductDetails) => {
      if (isSavingImage) {
        return;
      }

      try {
        clearError();
        setIsSavingImage(true);

        const updatedProduct = await removeProductImage(product.id);

        setSelectedProduct({
          ...product,
          ...updatedProduct,
        });

        await fetchProducts({
          search: search.trim() || undefined,
        });
      } catch {
        // L'erreur est gérée par le store.
      } finally {
        setIsSavingImage(false);
      }
    },
    [
      isSavingImage,
      clearError,
      removeProductImage,
      setSelectedProduct,
      fetchProducts,
      search,
    ],
  );

  // ============================================================
  // Activer / désactiver produit
  // ============================================================

  const handleToggleProductStatus = useCallback(
    async (product: ProductDetails) => {
      try {
        const updated = await updateProductStatus(
          product.id,
          !product.isActive,
        );

        setSelectedProduct({
          ...product,
          ...updated,
        });

        await fetchProducts({
          search: search.trim() || undefined,
        });
      } catch {
        // Erreur gérée par le store.
      }
    },
    [updateProductStatus, setSelectedProduct, fetchProducts, search],
  );

  // ============================================================
  // Ouvrir création variante
  // ============================================================

  const handleOpenAddVariant = useCallback(
    async (product: ProductDetails) => {
      clearError();

      setSelectedProduct(product);
      setSelectedVariant(null);
      setEditingVariant(null);
      setShowProductDetails(false);
      setShowVariantForm(true);

      try {
        await fetchVariants(product.id);
      } catch {
        // Erreur gérée par le store.
      }
    },
    [clearError, setSelectedProduct, setSelectedVariant, fetchVariants],
  );

  // ============================================================
  // Ouvrir modification variante
  // ============================================================

  const handleOpenEditVariant = useCallback(
    (product: ProductDetails, variant: ProductVariant) => {
      clearError();

      setSelectedProduct(product);
      setEditingVariant(variant);
      setShowProductDetails(false);
      setShowVariantForm(true);
    },
    [clearError, setSelectedProduct],
  );

  // ============================================================
  // Sauvegarde variante
  // ============================================================

  const handleSubmitVariant = useCallback(
    async (data: {
      packagingId: string;
      size: ProductVariant["size"];
      volumeMl: number;
      price: number;
      sku?: string;
    }) => {
      if (!selectedProduct) {
        return;
      }

      try {
        if (editingVariant) {
          await updateVariant(selectedProduct.id, editingVariant.id, data);
        } else {
          await createVariant(selectedProduct.id, data);
        }

        const updatedProduct = await fetchProductById(selectedProduct.id);

        await fetchVariants(selectedProduct.id);

        setSelectedProduct(updatedProduct);

        setShowVariantForm(false);
        setEditingVariant(null);
        setSelectedVariant(null);
        setShowProductDetails(true);
      } catch {
        // L'erreur est affichée dans la modale.
      }
    },
    [
      selectedProduct,
      editingVariant,
      updateVariant,
      createVariant,
      fetchProductById,
      fetchVariants,
      setSelectedProduct,
      setSelectedVariant,
    ],
  );

  // ============================================================
  // Activer / désactiver une variante
  // ============================================================

  const handleToggleVariantStatus = useCallback(
    async (product: ProductDetails, variant: ProductVariant) => {
      try {
        await updateVariantStatus(product.id, variant.id, !variant.isActive);

        const updatedProduct = await fetchProductById(product.id);

        await fetchVariants(product.id);

        setSelectedProduct(updatedProduct);
      } catch {
        // Erreur gérée par le store.
      }
    },
    [updateVariantStatus, fetchProductById, fetchVariants, setSelectedProduct],
  );

  // ============================================================
  // Ouvrir gestion de recette
  // ============================================================

  const handleOpenRecipe = useCallback(
    async (product: ProductDetails) => {
      try {
        clearRecipeError();
        clearRecipe();

        setRecipeProduct(product);
        setShowProductDetails(false);

        await Promise.all([
          getProductRecipe(product.id),
          fetchRawMaterials({
            isActive: true,
          }),
        ]);

        setShowRecipeForm(true);
      } catch {
        // Les stores gèrent déjà leurs erreurs.
      }
    },
    [clearRecipeError, clearRecipe, getProductRecipe, fetchRawMaterials],
  );

  // ============================================================
  // Fermer gestion de recette
  // ============================================================

  const handleCloseRecipe = useCallback(() => {
    if (isSavingRecipe) {
      return;
    }

    setShowRecipeForm(false);
    setRecipeProduct(null);

    clearRecipeError();
    clearRecipe();
  }, [isSavingRecipe, clearRecipeError, clearRecipe]);

  // ============================================================
  // Après sauvegarde recette
  // ============================================================

  const handleRecipeSaved = useCallback(
    async (_savedRecipe: ProductRecipe) => {
      if (!recipeProduct) {
        return;
      }

      try {
        const updatedProduct = await fetchProductById(recipeProduct.id);

        setSelectedProduct(updatedProduct);

        await fetchVariants(recipeProduct.id);

        setShowRecipeForm(false);
        setRecipeProduct(null);

        clearRecipeError();
        clearRecipe();

        setShowProductDetails(true);
      } catch {
        // Erreur gérée par le store produit.
      }
    },
    [
      recipeProduct,
      fetchProductById,
      setSelectedProduct,
      fetchVariants,
      clearRecipeError,
      clearRecipe,
    ],
  );

  // ============================================================
  // Sauvegarde recette
  // ============================================================

  const handleSubmitRecipe = useCallback(
    async (data: UpdateProductRecipeInput) => {
      if (!recipeProduct) {
        return;
      }

      try {
        const savedRecipe = await saveProductRecipe(recipeProduct.id, data);

        if (!savedRecipe) {
          return;
        }

        await handleRecipeSaved(savedRecipe);
      } catch {
        // L'erreur est affichée dans RecipeFormModal.
      }
    },
    [recipeProduct, saveProductRecipe, handleRecipeSaved],
  );

  // ============================================================
  // Fermer les détails
  // ============================================================

  const handleCloseDetails = useCallback(() => {
    if (isSavingImage) {
      return;
    }

    setShowProductDetails(false);
    setSelectedProduct(null);
  }, [isSavingImage, setSelectedProduct]);

  // ============================================================
  // Fermer formulaire produit
  // ============================================================

  const handleCloseProductForm = useCallback(() => {
    if (isSaving) {
      return;
    }

    setShowProductForm(false);
    setEditingProduct(null);
    clearError();
  }, [isSaving, clearError]);

  // ============================================================
  // Fermer formulaire variante
  // ============================================================

  const handleCloseVariantForm = useCallback(() => {
    if (isSavingVariant) {
      return;
    }

    setShowVariantForm(false);
    setEditingVariant(null);
    setSelectedVariant(null);
    clearError();
  }, [isSavingVariant, clearError, setSelectedVariant]);

  // ============================================================
  // Chargement initial
  // ============================================================

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="nutrition-outline" size={30} color={COLORS.primary} />
        </View>

        <ActivityIndicator size="small" color={COLORS.primary} />

        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={visibleProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handleOpenProduct} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            visibleProducts.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* HEADER */}

              <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>Produits</Text>

                  <Text style={styles.subtitle}>
                    Gérez vos jus et leurs formats
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleOpenCreateProduct}
                >
                  <Ionicons name="add" size={24} color={COLORS.white} />
                </Pressable>
              </View>

              {/* RECHERCHE */}

              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.Gray} />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un produit..."
                  placeholderTextColor={COLORS.Gray}
                  style={styles.searchInput}
                  returnKeyType="search"
                />

                {search.length > 0 && (
                  <Pressable onPress={() => setSearch("")} hitSlop={10}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={COLORS.Gray}
                    />
                  </Pressable>
                )}
              </View>

              {/* ERREUR */}

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={COLORS.error}
                  />

                  <Text style={styles.errorText}>{error}</Text>

                  <Pressable onPress={clearError} hitSlop={10}>
                    <Ionicons name="close" size={18} color={COLORS.error} />
                  </Pressable>
                </View>
              )}

              {/* RÉSUMÉ */}

              {visibleProducts.length > 0 && (
                <View style={styles.summary}>
                  <View style={styles.summaryHeader}>
                    <View style={styles.summaryIconContainer}>
                      <Ionicons
                        name="cube-outline"
                        size={19}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.summaryHeaderText}>
                      <Text style={styles.summaryTitle}>
                        Aperçu des produits
                      </Text>

                      <Text style={styles.summarySubtitle}>
                        État actuel de votre catalogue
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryStats}>
                    <View style={styles.summaryStat}>
                      <View style={styles.summaryValueRow}>
                        <Text style={styles.summaryValue}>
                          {visibleProducts.length}
                        </Text>

                        <View style={styles.summaryValueIcon}>
                          <Ionicons
                            name="cube-outline"
                            size={13}
                            color={COLORS.primary}
                          />
                        </View>
                      </View>

                      <Text style={styles.summaryLabel}>
                        {visibleProducts.length > 1 ? "Produits" : "Produit"}
                      </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryStat}>
                      <View style={styles.summaryValueRow}>
                        <Text style={styles.summaryValueActive}>
                          {
                            visibleProducts.filter(
                              (product) => product.isActive,
                            ).length
                          }
                        </Text>

                        <View style={styles.summaryActiveIcon}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={13}
                            color={COLORS.success}
                          />
                        </View>
                      </View>

                      <Text style={styles.summaryLabel}>Actifs</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryStat}>
                      <View style={styles.summaryValueRow}>
                        <Text style={styles.summaryValueInactive}>
                          {
                            visibleProducts.filter(
                              (product) => !product.isActive,
                            ).length
                          }
                        </Text>

                        <View style={styles.summaryInactiveIcon}>
                          <Ionicons
                            name="pause-circle-outline"
                            size={13}
                            color={COLORS.Gray}
                          />
                        </View>
                      </View>

                      <Text style={styles.summaryLabel}>Inactifs</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={search.trim() ? "search-outline" : "nutrition-outline"}
                  size={42}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {search.trim() ? "Aucun produit trouvé" : "Aucun produit"}
              </Text>

              <Text style={styles.emptyText}>
                {search.trim()
                  ? "Essayez avec un autre terme de recherche."
                  : "Commencez par créer votre premier produit."}
              </Text>

              {!search.trim() && (
                <Pressable
                  style={({ pressed }) => [
                    styles.emptyButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleOpenCreateProduct}
                >
                  <Ionicons name="add" size={20} color={COLORS.white} />

                  <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
                </Pressable>
              )}
            </View>
          }
        />

        {/* =======================================================
            MODALE DÉTAILS PRODUIT
        ======================================================= */}

        {showProductDetails && (
          <ProductDetailsModal
            key={selectedProduct?.id ?? "product-details"}
            visible
            product={selectedProduct}
            isImageSaving={isSavingImage}
            onClose={handleCloseDetails}
            onEdit={handleOpenEditProduct}
            onToggleStatus={handleToggleProductStatus}
            onUpdateImage={handleChangeProductImage}
            onRemoveImage={handleRemoveProductImage}
            onAddVariant={handleOpenAddVariant}
            onEditVariant={handleOpenEditVariant}
            onToggleVariantStatus={handleToggleVariantStatus}
            onManageRecipe={handleOpenRecipe}
          />
        )}

        {/* =======================================================
            MODALE PRODUIT
        ======================================================= */}

        {showProductForm && (
          <ProductFormModal
            key={editingProduct?.id ?? "create-product"}
            visible
            product={editingProduct}
            isSaving={isSaving}
            error={error}
            onClose={handleCloseProductForm}
            onSubmit={handleSubmitProduct}
          />
        )}

        {/* =======================================================
            MODALE VARIANTE
        ======================================================= */}

        {showVariantForm && (
          <ProductVariantFormModal
            key={editingVariant?.id ?? "create-variant"}
            visible
            variant={editingVariant}
            packagingOptions={packagings}
            isSaving={isSavingVariant}
            error={error}
            onClose={handleCloseVariantForm}
            onSubmit={handleSubmitVariant}
          />
        )}

        {/* =======================================================
            MODALE RECETTE
        ======================================================= */}

        {showRecipeForm && (
          <RecipeFormModal
            key={recipeProduct?.id ?? "recipe-form"}
            visible
            product={recipeProduct}
            recipe={recipe}
            rawMaterials={rawMaterials}
            isLoading={isLoadingRecipe || isLoadingRawMaterials}
            isSaving={isSavingRecipe}
            error={recipeError}
            onClose={handleCloseRecipe}
            onSubmit={handleSubmitRecipe}
          />
        )}

        {/* =======================================================
            CHARGEMENT EMBALLAGES
        ======================================================= */}

        {isLoadingPackagings && showVariantForm && (
          <View pointerEvents="none" style={styles.packagingLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ================================================================
// Styles
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxlarge,
    lineHeight: 35,
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.darkGray,
  },

  // ============================================================
  // ADD BUTTON
  // ============================================================

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },

  // ============================================================
  // SEARCH
  // ============================================================

  searchContainer: {
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    lineHeight: 20,
    color: COLORS.text,
    paddingVertical: 0,
  },

  // ============================================================
  // SUMMARY
  // ============================================================

  summary: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3E8",
  },

  summaryHeaderText: {
    flex: 1,
    marginLeft: 11,
  },

  summaryTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 16,
    color: COLORS.text,
  },

  summarySubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  summaryStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  summaryStat: {
    flex: 1,
    alignItems: "center",
  },

  summaryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.primary,
  },

  summaryValueActive: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.success,
  },

  summaryValueInactive: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.Gray,
  },

  summaryValueIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
    backgroundColor: "#EAF3E8",
  },

  summaryActiveIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
    backgroundColor: "#EAF6EC",
  },

  summaryInactiveIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
    backgroundColor: "#F2F2F2",
  },

  summaryLabel: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.darkGray,
  },

  summaryDivider: {
    width: 1,
    height: 35,
    marginHorizontal: 8,
    backgroundColor: "#EAEAEA",
  },

  // ============================================================
  // ERROR
  // ============================================================

  errorContainer: {
    minHeight: 48,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#FFD4D4",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    marginHorizontal: 9,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    lineHeight: 18,
    color: COLORS.error,
  },

  // ============================================================
  // EMPTY STATE
  // ============================================================

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 70,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: "#EAF3E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.text,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: COLORS.darkGray,
    textAlign: "center",
    maxWidth: 300,
  },

  emptyButton: {
    marginTop: 22,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  emptyButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.white,
  },

  // ============================================================
  // LOADING
  // ============================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#EAF3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.darkGray,
  },

  // ============================================================
  // PACKAGING LOADING
  // ============================================================

  packagingLoading: {
    position: "absolute",
    right: 25,
    bottom: 30,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },

  // ============================================================
  // PRESS
  // ============================================================

  pressed: {
    opacity: 0.75,
  },
});
