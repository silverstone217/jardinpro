import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ProductDetails, Unit } from "@/types/product";
import type { RawMaterialWithStock } from "@/types/rawMaterial";
import type { ProductRecipe, UpdateProductRecipeInput } from "@/types/recipe";
import { COLORS, fontSizes, fonts } from "@/utils/styles";

interface RecipeFormModalProps {
  visible: boolean;
  product: ProductDetails | null;
  recipe: ProductRecipe | null;
  rawMaterials: RawMaterialWithStock[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: UpdateProductRecipeInput) => Promise<void>;
}

interface RecipeIngredientForm {
  id: string;
  rawMaterialId: string;
  quantity: string;
  unit: Unit;
}

const UNIT_LABELS: Record<Unit, string> = {
  PIECE: "Pièce",
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "L",
};

const formatVolume = (volumeMl: number): string => {
  if (volumeMl >= 1000) {
    const liters = volumeMl / 1000;

    if (Number.isInteger(liters)) {
      return `${liters} L`;
    }

    return `${liters.toFixed(1)} L`;
  }

  return `${volumeMl} ml`;
};

const createIngredientId = () =>
  `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const RecipeFormModal = ({
  visible,
  product,
  recipe,
  rawMaterials,
  isLoading,
  isSaving,
  error,
  onClose,
  onSubmit,
}: RecipeFormModalProps) => {
  /*
   * ============================================================
   * INITIALISATION
   * ============================================================
   */

  const [ingredients, setIngredients] = useState<RecipeIngredientForm[]>(() => {
    if (!product) {
      return [];
    }

    const sourceIngredients = recipe?.ingredients ?? product.ingredients ?? [];

    return sourceIngredients.map((ingredient) => ({
      id: ingredient.id,
      rawMaterialId: ingredient.rawMaterialId,
      quantity: String(ingredient.quantity),
      unit: ingredient.unit,
    }));
  });

  const [openSelectorId, setOpenSelectorId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  /*
   * ============================================================
   * MATIÈRES PREMIÈRES ACTIVES
   * ============================================================
   */

  const activeRawMaterials = useMemo(
    () => rawMaterials.filter((rawMaterial) => rawMaterial.isActive),
    [rawMaterials],
  );

  /*
   * ============================================================
   * ERREUR
   * ============================================================
   */

  const displayedError = localError ?? error;

  /*
   * ============================================================
   * FERMETURE
   * ============================================================
   */

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setOpenSelectorId(null);
    setLocalError(null);

    onClose();
  };

  /*
   * ============================================================
   * AJOUTER UN INGRÉDIENT
   * ============================================================
   */

  const handleAddIngredient = () => {
    if (isSaving) {
      return;
    }

    setLocalError(null);

    const usedIds = new Set(
      ingredients.map((ingredient) => ingredient.rawMaterialId),
    );

    const availableRawMaterial = activeRawMaterials.find(
      (rawMaterial) => !usedIds.has(rawMaterial.id),
    );

    if (!availableRawMaterial) {
      setLocalError(
        activeRawMaterials.length === 0
          ? "Aucune matière première active n'est disponible."
          : "Toutes les matières premières disponibles sont déjà utilisées.",
      );

      return;
    }

    const newIngredientId = createIngredientId();

    setIngredients((current) => [
      ...current,
      {
        id: newIngredientId,
        rawMaterialId: availableRawMaterial.id,
        quantity: "",
        unit: availableRawMaterial.unit,
      },
    ]);

    /*
     * On ouvre directement le sélecteur du nouvel ingrédient.
     */
    setOpenSelectorId(newIngredientId);
  };

  /*
   * ============================================================
   * SUPPRIMER UN INGRÉDIENT
   * ============================================================
   */

  const handleRemoveIngredient = (ingredientId: string) => {
    if (isSaving) {
      return;
    }

    setLocalError(null);
    setOpenSelectorId(null);

    setIngredients((current) =>
      current.filter((ingredient) => ingredient.id !== ingredientId),
    );
  };

  /*
   * ============================================================
   * SÉLECTION MATIÈRE PREMIÈRE
   * ============================================================
   */

  const handleSelectRawMaterial = (
    ingredientId: string,
    rawMaterialId: string,
  ) => {
    if (isSaving) {
      return;
    }

    const alreadyUsed = ingredients.some(
      (ingredient) =>
        ingredient.id !== ingredientId &&
        ingredient.rawMaterialId === rawMaterialId,
    );

    if (alreadyUsed) {
      setLocalError(
        "Cette matière première est déjà utilisée dans la recette.",
      );

      setOpenSelectorId(null);

      return;
    }

    const rawMaterial = activeRawMaterials.find(
      (item) => item.id === rawMaterialId,
    );

    if (!rawMaterial) {
      return;
    }

    setIngredients((current) =>
      current.map((ingredient) => {
        if (ingredient.id !== ingredientId) {
          return ingredient;
        }

        return {
          ...ingredient,
          rawMaterialId,
          unit: rawMaterial.unit,
        };
      }),
    );

    setLocalError(null);
    setOpenSelectorId(null);
  };

  /*
   * ============================================================
   * QUANTITÉ
   * ============================================================
   */

  const handleQuantityChange = (ingredientId: string, value: string) => {
    if (isSaving) {
      return;
    }

    /*
     * Autorise :
     * 0
     * 1
     * 1.5
     * 1,5
     *
     * et supprime les caractères non numériques.
     */
    const sanitizedValue = value.replace(/[^0-9.,]/g, "");

    setLocalError(null);

    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === ingredientId
          ? {
              ...ingredient,
              quantity: sanitizedValue,
            }
          : ingredient,
      ),
    );
  };

  /*
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validateForm = (): boolean => {
    if (!product) {
      return false;
    }

    if (ingredients.length === 0) {
      setLocalError("La recette doit contenir au moins un ingrédient.");

      return false;
    }

    const rawMaterialIds = new Set<string>();

    for (const ingredient of ingredients) {
      /*
       * Matière première obligatoire
       */

      if (!ingredient.rawMaterialId) {
        setLocalError(
          "Sélectionnez une matière première pour chaque ingrédient.",
        );

        return false;
      }

      /*
       * Matière première unique
       */

      if (rawMaterialIds.has(ingredient.rawMaterialId)) {
        setLocalError(
          "Une matière première ne peut être ajoutée qu'une seule fois.",
        );

        return false;
      }

      rawMaterialIds.add(ingredient.rawMaterialId);

      /*
       * Quantité obligatoire et positive
       */

      const normalizedQuantity = ingredient.quantity.replace(",", ".").trim();

      const quantity = Number(normalizedQuantity);

      if (!normalizedQuantity || !Number.isFinite(quantity) || quantity <= 0) {
        setLocalError(
          "Chaque ingrédient doit avoir une quantité supérieure à 0.",
        );

        return false;
      }

      /*
       * Matière première toujours disponible
       */

      const rawMaterial = activeRawMaterials.find(
        (item) => item.id === ingredient.rawMaterialId,
      );

      if (!rawMaterial) {
        setLocalError(
          "Une des matières premières sélectionnées n'est plus disponible.",
        );

        return false;
      }

      /*
       * L'unité doit correspondre à celle de la matière première.
       */

      if (ingredient.unit !== rawMaterial.unit) {
        setLocalError(`L'unité de "${rawMaterial.name}" est invalide.`);

        return false;
      }
    }

    return true;
  };

  /*
   * ============================================================
   * ENREGISTREMENT
   * ============================================================
   */

  const handleSave = async () => {
    if (!product || isSaving || isLoading) {
      return;
    }

    setLocalError(null);
    setOpenSelectorId(null);

    if (!validateForm()) {
      return;
    }

    const recipeIngredients = ingredients.map((ingredient) => ({
      rawMaterialId: ingredient.rawMaterialId,
      quantity: Number(ingredient.quantity.replace(",", ".")),
      unit: ingredient.unit,
    }));

    try {
      await onSubmit({
        ingredients: recipeIngredients,
      });
    } catch (submitError) {
      /*
       * Le parent/store gère normalement l'erreur.
       *
       * On ne remplace pas ici le message retourné par le backend.
       */
      console.error("RecipeFormModal submit error:", submitError);
    }
  };

  /**
   * ============================================================
   * HAS CHANGED
   * ============================================================
   */
  const hasChanges = useMemo(() => {
    if (!recipe) return true;

    const serverIngredients = recipe.ingredients
      .map((ingredient) => ({
        rawMaterialId: ingredient.rawMaterialId,
        quantity: Number(ingredient.quantity),
        unit: ingredient.unit,
      }))
      .sort((a, b) => a.rawMaterialId.localeCompare(b.rawMaterialId));

    const currentIngredients = ingredients
      .map((ingredient) => ({
        rawMaterialId: ingredient.rawMaterialId,
        quantity: Number(ingredient.quantity.replace(",", ".")),
        unit: ingredient.unit,
      }))
      .sort((a, b) => a.rawMaterialId.localeCompare(b.rawMaterialId));

    return (
      JSON.stringify(serverIngredients) !== JSON.stringify(currentIngredients)
    );
  }, [recipe, ingredients]);

  /*
   * ============================================================
   * PRODUIT ABSENT
   * ============================================================
   */

  if (!product) {
    return null;
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modal}>
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Ionicons
                  name="flask-outline"
                  size={21}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.headerTexts}>
                <Text style={styles.headerTitle}>Recette</Text>

                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {product.name}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSaving}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={COLORS.darkGray} />
            </Pressable>
          </View>

          {/* ==================================================
              CONTENT
          ================================================== */}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ==================================================
                RENDEMENT
            ================================================== */}

            <View style={styles.volumeCard}>
              <View style={styles.volumeCardLeft}>
                <View style={styles.volumeIconContainer}>
                  <Ionicons
                    name="water-outline"
                    size={20}
                    color={COLORS.secondary}
                  />
                </View>

                <View style={styles.volumeTexts}>
                  <Text style={styles.volumeTitle}>
                    Rendement de la recette
                  </Text>

                  <Text style={styles.volumeSubtitle}>
                    Volume obtenu pour une recette de base
                  </Text>
                </View>
              </View>

              <View style={styles.volumeBadge}>
                <Text style={styles.volumeBadgeText}>
                  {formatVolume(product.recipeVolumeMl)}
                </Text>
              </View>
            </View>

            {/* ==================================================
                INFORMATION
            ================================================== */}

            <View style={styles.infoBox}>
              <View style={styles.infoIconContainer}>
                <Ionicons
                  name="information-outline"
                  size={17}
                  color={COLORS.secondary}
                />
              </View>

              <Text style={styles.infoText}>
                Les quantités indiquées correspondent aux matières premières
                nécessaires pour produire{" "}
                <Text style={styles.infoStrong}>
                  {formatVolume(product.recipeVolumeMl)}
                </Text>{" "}
                de ce jus.
              </Text>
            </View>

            {/* ==================================================
                ERROR
            ================================================== */}

            {displayedError ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color={COLORS.error}
                />

                <Text style={styles.errorText}>{displayedError}</Text>
              </View>
            ) : null}

            {/* ==================================================
                LOADING
            ================================================== */}

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />

                <Text style={styles.loadingText}>
                  Chargement des matières premières...
                </Text>
              </View>
            ) : (
              <>
                {/* ==============================================
                    SECTION HEADER
                ============================================== */}

                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Ingrédients</Text>

                    <Text style={styles.sectionSubtitle}>
                      Composition de la recette
                    </Text>
                  </View>

                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {ingredients.length}
                    </Text>
                  </View>
                </View>

                {/* ==============================================
                    EMPTY STATE
                ============================================== */}

                {ingredients.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                      <Ionicons
                        name="flask-outline"
                        size={28}
                        color={COLORS.Gray}
                      />
                    </View>

                    <Text style={styles.emptyTitle}>
                      Aucune recette configurée
                    </Text>

                    <Text style={styles.emptyText}>
                      Ajoutez les matières premières nécessaires pour préparer
                      ce produit.
                    </Text>

                    <Pressable
                      style={styles.emptyAddButton}
                      onPress={handleAddIngredient}
                      disabled={isSaving}
                    >
                      <Ionicons name="add" size={18} color={COLORS.white} />

                      <Text style={styles.emptyAddButtonText}>
                        Ajouter un ingrédient
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  /* ============================================
                     INGREDIENTS
                  ============================================ */

                  <View style={styles.ingredientsList}>
                    {ingredients.map((ingredient, index) => {
                      const rawMaterial = activeRawMaterials.find(
                        (item) => item.id === ingredient.rawMaterialId,
                      );

                      const isSelectorOpen = openSelectorId === ingredient.id;

                      return (
                        <View key={ingredient.id} style={styles.ingredientCard}>
                          {/* ==================================
                              INGREDIENT HEADER
                          ================================== */}

                          <View style={styles.ingredientHeader}>
                            <View style={styles.numberBadge}>
                              <Text style={styles.numberBadgeText}>
                                {index + 1}
                              </Text>
                            </View>

                            <Text style={styles.ingredientTitle}>
                              Ingrédient {index + 1}
                            </Text>

                            <Pressable
                              style={styles.deleteButton}
                              onPress={() =>
                                handleRemoveIngredient(ingredient.id)
                              }
                              disabled={isSaving}
                              hitSlop={6}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={17}
                                color={COLORS.error}
                              />
                            </Pressable>
                          </View>

                          {/* ==================================
                              RAW MATERIAL
                          ================================== */}

                          <Text style={styles.fieldLabel}>
                            Matière première
                          </Text>

                          <Pressable
                            style={[
                              styles.selectButton,
                              isSelectorOpen && styles.selectButtonOpen,
                            ]}
                            onPress={() =>
                              setOpenSelectorId(
                                isSelectorOpen ? null : ingredient.id,
                              )
                            }
                            disabled={isSaving}
                          >
                            <View style={styles.selectLeft}>
                              <View style={styles.selectIcon}>
                                <Ionicons
                                  name="leaf-outline"
                                  size={16}
                                  color={COLORS.primary}
                                />
                              </View>

                              <Text
                                style={[
                                  styles.selectText,
                                  !rawMaterial && styles.placeholderText,
                                ]}
                                numberOfLines={1}
                              >
                                {rawMaterial?.name ??
                                  "Sélectionner une matière première"}
                              </Text>
                            </View>

                            <Ionicons
                              name={
                                isSelectorOpen ? "chevron-up" : "chevron-down"
                              }
                              size={18}
                              color={COLORS.Gray}
                            />
                          </Pressable>

                          {/* ==================================
                              DROPDOWN
                          ================================== */}

                          {isSelectorOpen ? (
                            <View style={styles.dropdown}>
                              {activeRawMaterials.length === 0 ? (
                                <View style={styles.dropdownEmptyContainer}>
                                  <Ionicons
                                    name="leaf-outline"
                                    size={19}
                                    color={COLORS.Gray}
                                  />

                                  <Text style={styles.dropdownEmpty}>
                                    Aucune matière première active
                                  </Text>
                                </View>
                              ) : (
                                activeRawMaterials.map((item) => {
                                  const isUsed = ingredients.some(
                                    (current) =>
                                      current.id !== ingredient.id &&
                                      current.rawMaterialId === item.id,
                                  );

                                  const isSelected =
                                    item.id === ingredient.rawMaterialId;

                                  return (
                                    <Pressable
                                      key={item.id}
                                      style={[
                                        styles.dropdownItem,
                                        isSelected &&
                                          styles.dropdownItemSelected,
                                        isUsed && styles.dropdownItemDisabled,
                                      ]}
                                      onPress={() => {
                                        if (!isUsed) {
                                          handleSelectRawMaterial(
                                            ingredient.id,
                                            item.id,
                                          );
                                        }
                                      }}
                                      disabled={isUsed}
                                    >
                                      <View style={styles.dropdownItemLeft}>
                                        <Text
                                          style={[
                                            styles.dropdownItemName,
                                            isSelected &&
                                              styles.dropdownItemNameSelected,
                                          ]}
                                          numberOfLines={1}
                                        >
                                          {item.name}
                                        </Text>

                                        <Text style={styles.dropdownItemUnit}>
                                          {UNIT_LABELS[item.unit]}
                                        </Text>
                                      </View>

                                      {isSelected ? (
                                        <Ionicons
                                          name="checkmark-circle"
                                          size={19}
                                          color={COLORS.primary}
                                        />
                                      ) : isUsed ? (
                                        <Text style={styles.alreadyUsedText}>
                                          Déjà utilisée
                                        </Text>
                                      ) : null}
                                    </Pressable>
                                  );
                                })
                              )}
                            </View>
                          ) : null}

                          {/* ==================================
                              QUANTITY
                          ================================== */}

                          <Text
                            style={[styles.fieldLabel, styles.quantityLabel]}
                          >
                            Quantité
                          </Text>

                          <View style={styles.quantityRow}>
                            <View style={styles.quantityInputContainer}>
                              <TextInput
                                value={ingredient.quantity}
                                onChangeText={(value) =>
                                  handleQuantityChange(ingredient.id, value)
                                }
                                placeholder="0"
                                placeholderTextColor={COLORS.Gray}
                                keyboardType="decimal-pad"
                                style={styles.quantityInput}
                                editable={!isSaving}
                              />
                            </View>

                            <View style={styles.unitBadge}>
                              <Text style={styles.unitBadgeText}>
                                {UNIT_LABELS[ingredient.unit]}
                              </Text>
                            </View>
                          </View>

                          {/* ==================================
                              UNIT INFO
                          ================================== */}

                          {rawMaterial ? (
                            <View style={styles.unitInfo}>
                              <Ionicons
                                name="information-circle-outline"
                                size={13}
                                color={COLORS.Gray}
                              />

                              <Text style={styles.unitInfoText}>
                                Unité de la matière :{" "}
                                {UNIT_LABELS[rawMaterial.unit]}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ==============================================
                    ADD INGREDIENT
                ============================================== */}

                {ingredients.length > 0 ? (
                  <Pressable
                    style={styles.addIngredientButton}
                    onPress={handleAddIngredient}
                    disabled={isSaving}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={19}
                      color={COLORS.primary}
                    />

                    <Text style={styles.addIngredientText}>
                      Ajouter un ingrédient
                    </Text>
                  </Pressable>
                ) : null}

                {/* ==============================================
                    BOTTOM INFO
                ============================================== */}

                <View style={styles.bottomInfo}>
                  <Ionicons
                    name="calculator-outline"
                    size={18}
                    color={COLORS.secondary}
                  />

                  <Text style={styles.bottomInfoText}>
                    Cette recette définit les quantités nécessaires pour une
                    production de{" "}
                    <Text style={styles.bottomInfoStrong}>
                      {formatVolume(product.recipeVolumeMl)}
                    </Text>
                    .
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <View style={styles.footer}>
            <Pressable
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                (isSaving || isLoading) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving || isLoading || !hasChanges}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="checkmark" size={19} color={COLORS.white} />
              )}

              {isSaving ? (
                <>
                  <Text style={styles.saveButtonText}>Enregistrement...</Text>
                </>
              ) : hasChanges ? (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              ) : (
                <>
                  <Text style={styles.saveButtonText}>À jour</Text>
                </>
              )}

              {/* <Text style={styles.saveButtonText}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Text> */}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RecipeFormModal;

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modal: {
    width: "100%",
    maxHeight: "94%",
    overflow: "hidden",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  /*
   * HEADER
   */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#EAF3E8",
  },

  headerTexts: {
    flex: 1,
    marginLeft: 11,
  },

  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    lineHeight: 25,
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.Gray,
  },

  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#F3F3F3",
  },

  /*
   * SCROLL
   */

  scrollView: {
    flexGrow: 0,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 22,
  },

  /*
   * VOLUME
   */

  volumeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8EDE6",
  },

  volumeCardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  volumeIconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#FFF3E2",
  },

  volumeTexts: {
    flex: 1,
    marginLeft: 10,
  },

  volumeTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    lineHeight: 17,
    color: COLORS.text,
  },

  volumeSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  volumeBadge: {
    marginLeft: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#EAF3E8",
  },

  volumeBadgeText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    lineHeight: 16,
    color: COLORS.primary,
  },

  /*
   * INFO
   */

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#FFF7E8",
  },

  infoIconContainer: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#FFF0D2",
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.darkGray,
  },

  infoStrong: {
    fontFamily: fonts.semibold,
    color: COLORS.text,
  },

  /*
   * ERROR
   */

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F6CACA",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.error,
  },

  /*
   * LOADING
   */

  loadingContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  /*
   * SECTION
   */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
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
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#EAF3E8",
  },

  countBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: COLORS.primary,
  },

  /*
   * EMPTY
   */

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: COLORS.background,
  },

  emptyTitle: {
    marginTop: 10,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 5,
    maxWidth: 280,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.Gray,
  },

  emptyAddButton: {
    minHeight: 42,
    marginTop: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },

  emptyAddButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.white,
  },

  /*
   * INGREDIENTS
   */

  ingredientsList: {
    gap: 10,
  },

  ingredientCard: {
    padding: 13,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  ingredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  numberBadge: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#EAF3E8",
  },

  numberBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: COLORS.primary,
  },

  ingredientTitle: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.text,
  },

  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#FFF5F5",
  },

  /*
   * FORM
   */

  fieldLabel: {
    marginBottom: 6,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.darkGray,
  },

  selectButton: {
    minHeight: 46,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 11,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  selectButtonOpen: {
    borderColor: COLORS.primary,
    backgroundColor: "#F7FBF6",
  },

  selectLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  selectIcon: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#EAF3E8",
  },

  selectText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.text,
  },

  placeholderText: {
    color: COLORS.Gray,
  },

  /*
   * DROPDOWN
   */

  dropdown: {
    marginTop: 5,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E2E2E2",
  },

  dropdownItem: {
    minHeight: 45,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  dropdownItemSelected: {
    backgroundColor: "#F7FBF6",
  },

  dropdownItemDisabled: {
    opacity: 0.45,
  },

  dropdownItemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  dropdownItemName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.text,
  },

  dropdownItemNameSelected: {
    fontFamily: fonts.semibold,
    color: COLORS.primary,
  },

  dropdownItemUnit: {
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 9,
    color: COLORS.Gray,
  },

  alreadyUsedText: {
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 8,
    color: COLORS.Gray,
  },

  dropdownEmptyContainer: {
    minHeight: 50,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  dropdownEmpty: {
    marginLeft: 7,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
  },

  /*
   * QUANTITY
   */

  quantityLabel: {
    marginTop: 12,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  quantityInputContainer: {
    flex: 1,
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  quantityInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: COLORS.text,
  },

  unitBadge: {
    minWidth: 58,
    height: 44,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#FFF7E8",
    borderWidth: 1,
    borderColor: "#F3E1BD",
  },

  unitBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: COLORS.secondary,
  },

  unitInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  unitInfoText: {
    marginLeft: 4,
    fontFamily: fonts.regular,
    fontSize: 9,
    color: COLORS.Gray,
  },

  /*
   * ADD
   */

  addIngredientButton: {
    minHeight: 45,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#F1F6EF",
    borderWidth: 1,
    borderColor: "#DCE9D9",
  },

  addIngredientText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.primary,
  },

  /*
   * BOTTOM INFO
   */

  bottomInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "#FFF7E8",
  },

  bottomInfoText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.darkGray,
  },

  bottomInfoStrong: {
    fontFamily: fonts.semibold,
    color: COLORS.text,
  },

  /*
   * FOOTER
   */

  footer: {
    flexDirection: "row",
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },

  cancelButton: {
    minHeight: 48,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F3F3F3",
  },

  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.darkGray,
  },

  saveButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.white,
  },
});
