import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { useStockStore } from "@/store/stockStore";
import type { Packaging } from "@/types/packaging";
import { COLORS, fontSizes, fonts } from "@/utils/styles";

type StockOperation = "ADD" | "REMOVE" | "ADJUST";

type PackagingStockModalProps = {
  visible: boolean;
  packaging: Packaging | null;
  onClose: () => void;
};

export default function PackagingStockModal({
  visible,
  packaging,
  onClose,
}: PackagingStockModalProps) {
  const stocks = useStockStore((state) => state.stocks);
  const isAdding = useStockStore((state) => state.isAdding);
  const isRemoving = useStockStore((state) => state.isRemoving);
  const isAdjusting = useStockStore((state) => state.isAdjusting);
  const error = useStockStore((state) => state.error);

  const addStock = useStockStore((state) => state.addStock);
  const removeStock = useStockStore((state) => state.removeStock);
  const adjustStock = useStockStore((state) => state.adjustStock);
  const clearError = useStockStore((state) => state.clearError);

  const [operation, setOperation] = useState<StockOperation>("ADD");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const isSubmitting = isAdding || isRemoving || isAdjusting;

  /**
   * Stock central de cet emballage.
   */
  const currentStock = useMemo(() => {
    if (!packaging) {
      return null;
    }

    return (
      stocks.find(
        (stock) =>
          stock.packagingId === packaging.id && stock.pointOfSaleId === null,
      ) ?? null
    );
  }, [stocks, packaging]);

  const currentQuantity = currentStock?.quantity ?? 0;

  /**
   * Couleur de l'opération sélectionnée.
   */
  const operationColor = {
    ADD: COLORS.success,
    REMOVE: COLORS.error,
    ADJUST: COLORS.warning,
  }[operation];

  /**
   * Icône du bouton Enregistrer.
   */
  const operationIcon = {
    ADD: "plus-circle",
    REMOVE: "minus-circle",
    ADJUST: "pencil-circle",
  }[operation] as keyof typeof MaterialCommunityIcons.glyphMap;

  /**
   * Validation de la quantité.
   */
  const quantityError = useMemo(() => {
    if (!quantity.trim()) {
      return "La quantité est requise.";
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return "La quantité doit être supérieure à 0.";
    }

    if (operation === "REMOVE" && parsedQuantity > currentQuantity) {
      return `Stock insuffisant. Disponible : ${currentQuantity} pièce(s).`;
    }

    return null;
  }, [quantity, operation, currentQuantity]);

  /**
   * Peut-on enregistrer ?
   */
  const canSubmit =
    !!packaging &&
    !!quantity.trim() &&
    Number.isFinite(Number(quantity)) &&
    Number(quantity) > 0 &&
    !!reason.trim() &&
    !isSubmitting &&
    !(operation === "REMOVE" && Number(quantity) > currentQuantity);

  /**
   * Changement d'opération.
   */
  const handleOperationChange = (newOperation: StockOperation) => {
    if (isSubmitting) {
      return;
    }

    clearError();
    setOperation(newOperation);
    setQuantity("");
  };

  /**
   * Modification de la quantité.
   */
  const handleQuantityChange = (value: string) => {
    clearError();

    const sanitized = value.replace(",", ".").replace(/[^0-9.]/g, "");

    const parts = sanitized.split(".");

    if (parts.length > 2) {
      return;
    }

    setQuantity(sanitized);
  };

  /**
   * Modification du motif.
   */
  const handleReasonChange = (value: string) => {
    clearError();
    setReason(value);
  };

  /**
   * Enregistrement de l'opération.
   */
  const handleSubmit = async () => {
    if (!packaging || isSubmitting) {
      console.log("🔴 BLOQUÉ :", {
        packaging: !!packaging,
        isSubmitting,
      });
      return;
    }

    const parsedQuantity = Number(quantity);
    const trimmedReason = reason.trim();

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !trimmedReason
    ) {
      return;
    }

    if (operation === "REMOVE" && parsedQuantity > currentQuantity) {
      return;
    }

    try {
      if (operation === "ADD") {
        await addStock({
          packagingId: packaging.id,
          quantity: parsedQuantity,
          reason: trimmedReason,
        });
      }

      if (operation === "REMOVE") {
        await removeStock({
          packagingId: packaging.id,
          quantity: parsedQuantity,
          reason: trimmedReason,
        });
      }

      if (operation === "ADJUST") {
        await adjustStock({
          packagingId: packaging.id,
          quantity: parsedQuantity,
          reason: trimmedReason,
        });
      }

      setOperation("ADD");
      setQuantity("");
      setReason("");
      clearError();
      Keyboard.dismiss();
    } catch (error) {
      console.log("❌ ERREUR STOCK :", error);
    }
  };

  /**
   * Fermeture du modal.
   */
  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    Keyboard.dismiss();
    clearError();
    onClose();
  };

  if (!packaging) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* =========================
            BACKDROP
        ========================= */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* =========================
            MODAL
        ========================= */}
        <View style={styles.container}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            nestedScrollEnabled
          >
            <TouchableWithoutFeedback
              onPress={Keyboard.dismiss}
              accessible={false}
            >
              <View>
                {/* =========================
                    HEADER
                ========================= */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons
                        name="package-variant"
                        size={24}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.headerText}>
                      <Text style={styles.title}>Gestion du stock</Text>

                      <Text style={styles.subtitle} numberOfLines={1}>
                        {packaging.name}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleClose}
                    disabled={isSubmitting}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={22}
                      color={COLORS.darkGray}
                    />
                  </Pressable>
                </View>

                {/* =========================
                    STOCK ACTUEL
                ========================= */}
                <View style={styles.stockCard}>
                  <View style={styles.stockCardHeader}>
                    <View style={styles.stockLabelContainer}>
                      <MaterialCommunityIcons
                        name="package-variant-closed"
                        size={18}
                        color={COLORS.primary}
                      />

                      <Text style={styles.stockLabel}>Stock actuel</Text>
                    </View>

                    <View style={styles.centralBadge}>
                      <Text style={styles.centralBadgeText}>Stock central</Text>
                    </View>
                  </View>

                  <View style={styles.stockValueRow}>
                    <Text style={styles.stockValue}>{currentQuantity}</Text>

                    <Text style={styles.stockUnit}>
                      pièce
                      {currentQuantity > 1 ? "s" : ""}
                    </Text>
                  </View>

                  <Text style={styles.stockFormat}>
                    {packaging.name} •{" "}
                    {packaging.size === "ML_200" ? "200 ml" : "500 ml"}
                  </Text>
                </View>

                {/* =========================
                    ERREUR
                ========================= */}
                {error && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={19}
                      color={COLORS.error}
                    />

                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* =========================
                    OPÉRATION
                ========================= */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Opération</Text>

                  <View style={styles.operationContainer}>
                    <OperationButton
                      label="Ajouter"
                      icon="plus"
                      active={operation === "ADD"}
                      color={COLORS.success}
                      disabled={isSubmitting}
                      onPress={() => handleOperationChange("ADD")}
                    />

                    <OperationButton
                      label="Retirer"
                      icon="minus"
                      active={operation === "REMOVE"}
                      color={COLORS.error}
                      disabled={isSubmitting}
                      onPress={() => handleOperationChange("REMOVE")}
                    />

                    <OperationButton
                      label="Ajuster"
                      icon="pencil"
                      active={operation === "ADJUST"}
                      color={COLORS.warning}
                      disabled={isSubmitting}
                      onPress={() => handleOperationChange("ADJUST")}
                    />
                  </View>
                </View>

                {/* =========================
                    QUANTITÉ
                ========================= */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={styles.sectionLabel}>
                      {operation === "ADJUST"
                        ? "Nouvelle quantité"
                        : "Quantité"}
                    </Text>

                    <Text style={styles.unitHint}>pièces</Text>
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      quantity.length > 0 && quantityError && styles.inputError,
                    ]}
                  >
                    <TextInput
                      value={quantity}
                      onChangeText={handleQuantityChange}
                      placeholder="0"
                      placeholderTextColor={COLORS.Gray}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                      style={styles.quantityInput}
                      maxLength={12}
                      returnKeyType="next"
                    />

                    <Text style={styles.inputUnit}>pièces</Text>
                  </View>

                  {quantity.length > 0 && quantityError && (
                    <Text style={styles.fieldError}>{quantityError}</Text>
                  )}

                  {operation === "ADJUST" && (
                    <Text style={styles.helperText}>
                      Cette valeur remplacera directement le stock actuel.
                    </Text>
                  )}
                </View>

                {/* =========================
                    MOTIF
                ========================= */}
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={styles.sectionLabel}>Motif</Text>

                    <Text style={styles.required}>Requis</Text>
                  </View>

                  <TextInput
                    value={reason}
                    onChangeText={handleReasonChange}
                    placeholder={
                      operation === "ADD"
                        ? "Ex. Réception fournisseur"
                        : operation === "REMOVE"
                          ? "Ex. Utilisation en production"
                          : "Ex. Inventaire physique"
                    }
                    placeholderTextColor={COLORS.Gray}
                    editable={!isSubmitting}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={styles.reasonInput}
                    maxLength={255}
                  />
                </View>

                {/* =========================
                    ENREGISTRER
                ========================= */}
                <Pressable
                  style={({ pressed }) => [
                    styles.submitButton,
                    {
                      backgroundColor: canSubmit
                        ? operationColor
                        : COLORS.lightGray,
                    },
                    pressed && canSubmit && styles.submitPressed,
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={operationIcon}
                        size={21}
                        color={canSubmit ? COLORS.white : COLORS.Gray}
                      />

                      <Text
                        style={[
                          styles.submitText,
                          !canSubmit && styles.submitTextDisabled,
                        ]}
                      >
                        Enregistrer
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* =========================================================
   OPERATION BUTTON
========================================================= */

type OperationButtonProps = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
};

function OperationButton({
  label,
  icon,
  color,
  active,
  disabled,
  onPress,
}: OperationButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.operationButton,

        active && {
          borderColor: color,
          backgroundColor: `${color}12`,
        },

        pressed && !disabled && styles.pressed,

        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={active ? color : COLORS.darkGray}
      />

      <Text style={[styles.operationText, active && { color }]}>{label}</Text>
    </Pressable>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "92%",
  },

  scrollView: {
    flexGrow: 0,
  },

  scrollContent: {
    paddingBottom: Platform.OS === "ios" ? 20 : 16,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
    alignSelf: "center",
    marginBottom: 16,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2E5",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.text,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    marginTop: 2,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    marginLeft: 12,
  },

  /* =========================
     STOCK
  ========================= */

  stockCard: {
    backgroundColor: "#F5F8F3",
    borderRadius: 20,
    padding: 17,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E3EBDD",
  },

  stockCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stockLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  stockLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  centralBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },

  centralBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.primary,
  },

  stockValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },

  stockValue: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: COLORS.primary,
  },

  stockUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
    marginLeft: 7,
  },

  stockFormat: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    marginTop: 2,
  },

  /* =========================
     ERROR
  ========================= */

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FDECEC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },

  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    lineHeight: 18,
    color: COLORS.error,
  },

  /* =========================
     SECTIONS
  ========================= */

  section: {
    marginBottom: 16,
  },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
    marginBottom: 8,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  unitHint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  required: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.error,
  },

  /* =========================
     OPERATIONS
  ========================= */

  operationContainer: {
    flexDirection: "row",
    gap: 8,
  },

  operationButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  operationText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: COLORS.darkGray,
  },

  /* =========================
     QUANTITY
  ========================= */

  inputContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  quantityInput: {
    flex: 1,
    height: "100%",
    fontFamily: fonts.semibold,
    fontSize: fontSizes.large,
    color: COLORS.text,
  },

  inputUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  fieldError: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.error,
    marginTop: 5,
  },

  helperText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.Gray,
    marginTop: 5,
  },

  /* =========================
     MOTIF
  ========================= */

  reasonInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  /* =========================
     SUBMIT
  ========================= */

  submitButton: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },

  submitText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.white,
  },

  submitTextDisabled: {
    color: COLORS.Gray,
  },

  /* =========================
     STATES
  ========================= */

  pressed: {
    opacity: 0.7,
  },

  submitPressed: {
    opacity: 0.85,
  },

  disabled: {
    opacity: 0.5,
  },
});
