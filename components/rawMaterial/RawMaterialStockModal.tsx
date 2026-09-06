import { Ionicons } from "@expo/vector-icons";
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
import { COLORS, fontSizes, fonts } from "@/utils/styles";

import type {
  RawMaterialUnit,
  RawMaterialWithStock,
} from "@/types/rawMaterial";

type RawMaterialStockModalProps = {
  visible: boolean;
  rawMaterial: RawMaterialWithStock | null;
  onClose: () => void;
};

type Operation = "ADD" | "REMOVE" | "ADJUST";

const UNIT_LABELS: Record<RawMaterialUnit, string> = {
  PIECE: "pièce(s)",
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "L",
};

const OPERATION_OPTIONS: {
  value: Operation;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "ADD",
    label: "Ajouter",
    description: "Ajouter une quantité au stock",
    icon: "add-circle-outline",
  },
  {
    value: "REMOVE",
    label: "Retirer",
    description: "Retirer une quantité du stock",
    icon: "remove-circle-outline",
  },
  {
    value: "ADJUST",
    label: "Ajuster",
    description: "Définir une nouvelle quantité",
    icon: "sync-circle-outline",
  },
];

const formatQuantity = (
  quantity: number | string | null | undefined,
): string => {
  const value = Number(quantity ?? 0);

  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
};

const RawMaterialStockModal = ({
  visible,
  rawMaterial,
  onClose,
}: RawMaterialStockModalProps) => {
  const stocks = useStockStore((state) => state.stocks);

  const addStock = useStockStore((state) => state.addStock);
  const removeStock = useStockStore((state) => state.removeStock);
  const adjustStock = useStockStore((state) => state.adjustStock);

  const isAdding = useStockStore((state) => state.isAdding);
  const isRemoving = useStockStore((state) => state.isRemoving);
  const isAdjusting = useStockStore((state) => state.isAdjusting);

  const stockError = useStockStore((state) => state.error);
  const clearStockError = useStockStore((state) => state.clearError);

  const [operation, setOperation] = useState<Operation>("ADD");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const [localError, setLocalError] = useState<string | null>(null);

  const isSubmitting = isAdding || isRemoving || isAdjusting;

  const currentStock = useMemo(() => {
    if (!rawMaterial) {
      return null;
    }

    return (
      stocks.find(
        (stock) =>
          stock.rawMaterialId === rawMaterial.id &&
          stock.pointOfSaleId === null,
      ) ?? null
    );
  }, [stocks, rawMaterial]);

  const currentQuantity = Number(currentStock?.quantity ?? 0);

  const unitLabel = rawMaterial ? UNIT_LABELS[rawMaterial.unit] : "";

  const selectedOperation = OPERATION_OPTIONS.find(
    (item) => item.value === operation,
  );

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    Keyboard.dismiss();
    clearStockError();
    setLocalError(null);

    onClose();
  };

  const validate = (): number | null => {
    setLocalError(null);

    const normalizedQuantity = quantity.trim().replace(",", ".");

    if (!normalizedQuantity) {
      setLocalError("La quantité est requise.");
      return null;
    }

    const parsedQuantity = Number(normalizedQuantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setLocalError("La quantité doit être un nombre supérieur à 0.");

      return null;
    }

    if (operation === "REMOVE" && parsedQuantity > currentQuantity) {
      setLocalError(
        `Impossible de retirer ${formatQuantity(
          parsedQuantity,
        )} ${unitLabel}. Le stock disponible est de ${formatQuantity(
          currentQuantity,
        )} ${unitLabel}.`,
      );

      return null;
    }

    return parsedQuantity;
  };

  const handleSubmit = async () => {
    if (!rawMaterial || isSubmitting) {
      return;
    }

    Keyboard.dismiss();

    const parsedQuantity = validate();

    if (parsedQuantity === null) {
      return;
    }

    const trimmedReason = reason.trim();

    try {
      if (operation === "ADD") {
        await addStock({
          rawMaterialId: rawMaterial.id,
          quantity: parsedQuantity,
          reason: trimmedReason || undefined,
        });
      }

      if (operation === "REMOVE") {
        await removeStock({
          rawMaterialId: rawMaterial.id,
          quantity: parsedQuantity,
          reason: trimmedReason || undefined,
        });
      }

      if (operation === "ADJUST") {
        if (!trimmedReason) {
          setLocalError(
            "Le motif est obligatoire pour un ajustement de stock.",
          );
          return;
        }

        await adjustStock({
          rawMaterialId: rawMaterial.id,
          quantity: parsedQuantity,
          reason: trimmedReason,
        });
      }

      setQuantity("");
      setReason("");
      setOperation("ADD");
      setLocalError(null);
    } catch {
      // L'erreur est gérée par le store.
    }
  };

  if (!rawMaterial) {
    return null;
  }

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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlayContent}>
            <Pressable style={styles.backdrop} onPress={handleClose} />

            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="cube-outline"
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.headerText}>
                    <Text style={styles.title} numberOfLines={1}>
                      Stock — {rawMaterial.name}
                    </Text>

                    <Text style={styles.subtitle}>Stock central</Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleClose}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.pressed,
                    isSubmitting && styles.disabledButton,
                  ]}
                >
                  <Ionicons name="close" size={22} color={COLORS.darkGray} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={Keyboard.dismiss}
              >
                {/* Stock actuel */}
                <View style={styles.currentStockCard}>
                  <View style={styles.currentStockIcon}>
                    <Ionicons
                      name="layers-outline"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.currentStockInfo}>
                    <Text style={styles.currentStockLabel}>Stock actuel</Text>

                    <View style={styles.currentStockValueRow}>
                      <Text style={styles.currentStockValue}>
                        {formatQuantity(currentQuantity)}
                      </Text>

                      <Text style={styles.currentStockUnit}>{unitLabel}</Text>
                    </View>
                  </View>

                  {rawMaterial.minStock !== null && (
                    <View style={styles.minimumStock}>
                      <Text style={styles.minimumStockLabel}>Minimum</Text>

                      <Text style={styles.minimumStockValue}>
                        {formatQuantity(rawMaterial.minStock)} {unitLabel}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Opération */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Opération</Text>

                  <View style={styles.operationContainer}>
                    {OPERATION_OPTIONS.map((item) => {
                      const isSelected = operation === item.value;

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => {
                            if (isSubmitting) {
                              return;
                            }

                            setOperation(item.value);
                            setLocalError(null);
                            clearStockError();
                          }}
                          disabled={isSubmitting}
                          style={({ pressed }) => [
                            styles.operationOption,
                            isSelected && styles.operationSelected,
                            pressed && styles.operationPressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.operationIcon,
                              isSelected && styles.operationIconSelected,
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={21}
                              color={isSelected ? COLORS.primary : COLORS.Gray}
                            />
                          </View>

                          <View style={styles.operationContent}>
                            <Text
                              style={[
                                styles.operationLabel,
                                isSelected && styles.operationLabelSelected,
                              ]}
                            >
                              {item.label}
                            </Text>

                            <Text style={styles.operationDescription}>
                              {item.description}
                            </Text>
                          </View>

                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={COLORS.primary}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Quantité */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Quantité</Text>

                  <View
                    style={[
                      styles.quantityContainer,
                      localError && styles.quantityContainerError,
                    ]}
                  >
                    <Ionicons
                      name="calculator-outline"
                      size={20}
                      color={localError ? COLORS.error : COLORS.Gray}
                    />

                    <TextInput
                      value={quantity}
                      onChangeText={(value) => {
                        setQuantity(value);
                        setLocalError(null);
                        clearStockError();
                      }}
                      placeholder="Ex. 10"
                      placeholderTextColor={COLORS.Gray}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                      style={styles.quantityInput}
                      returnKeyType="next"
                    />

                    <Text style={styles.quantityUnit}>{unitLabel}</Text>
                  </View>

                  {localError && (
                    <Text style={styles.errorText}>{localError}</Text>
                  )}
                </View>

                {/* Motif */}
                <View style={styles.section}>
                  <View style={styles.reasonHeader}>
                    <Text style={styles.sectionTitle}>Motif</Text>

                    <Text style={styles.optional}>Optionnel</Text>
                  </View>

                  <View style={styles.reasonContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={19}
                      color={COLORS.Gray}
                    />

                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder={
                        selectedOperation?.value === "ADD"
                          ? "Ex. Réception de matières"
                          : selectedOperation?.value === "REMOVE"
                            ? "Ex. Utilisation en production"
                            : "Ex. Inventaire"
                      }
                      placeholderTextColor={COLORS.Gray}
                      multiline
                      editable={!isSubmitting}
                      style={styles.reasonInput}
                      maxLength={250}
                    />
                  </View>
                </View>

                {/* Information */}
                <View style={styles.infoCard}>
                  <Ionicons
                    name="information-circle-outline"
                    size={19}
                    color={COLORS.info}
                  />

                  <Text style={styles.infoText}>
                    {operation === "ADD" &&
                      "La quantité sera ajoutée au stock central actuel."}

                    {operation === "REMOVE" &&
                      "La quantité sera retirée du stock central actuel."}

                    {operation === "ADJUST" &&
                      "La quantité saisie remplacera le stock central actuel."}
                  </Text>
                </View>

                {stockError && (
                  <View style={styles.errorBanner}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color={COLORS.error}
                    />

                    <Text style={styles.errorBannerText}>{stockError}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <Pressable
                  onPress={handleClose}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                    isSubmitting && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.cancelButtonText}>Fermer</Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && styles.buttonPressed,
                    isSubmitting && styles.disabledButton,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name="checkmark-outline"
                      size={20}
                      color={COLORS.white}
                    />
                  )}

                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? "Traitement..." : "Valider"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RawMaterialStockModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },

  overlayContent: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  container: {
    maxHeight: "92%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
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

  headerText: {
    flex: 1,
  },

  title: {
    fontFamily: fonts.semibold,
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
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollView: {
    flexGrow: 0,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 12,
  },

  currentStockCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F3F8F1",
    borderWidth: 1,
    borderColor: "#DCEAD8",
    marginBottom: 22,
  },

  currentStockIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  currentStockInfo: {
    flex: 1,
  },

  currentStockLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  currentStockValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  currentStockValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xlarge,
    color: COLORS.primary,
  },

  currentStockUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.primary,
    marginLeft: 5,
  },

  minimumStock: {
    alignItems: "flex-end",
  },

  minimumStockLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
  },

  minimumStockValue: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.darkGray,
    marginTop: 2,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
    marginBottom: 9,
  },

  operationContainer: {
    gap: 8,
  },

  operationOption: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  operationSelected: {
    borderColor: "#BFD5B8",
    backgroundColor: "#F3F8F1",
  },

  operationPressed: {
    opacity: 0.7,
  },

  operationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  operationIconSelected: {
    backgroundColor: COLORS.white,
  },

  operationContent: {
    flex: 1,
  },

  operationLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  operationLabelSelected: {
    fontFamily: fonts.semibold,
    color: COLORS.primary,
  },

  operationDescription: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
    marginTop: 2,
  },

  quantityContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },

  quantityContainerError: {
    borderColor: COLORS.error,
  },

  quantityInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  quantityUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.error,
    marginTop: 5,
  },

  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optional: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
    marginBottom: 9,
  },

  reasonContainer: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 13,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },

  reasonInput: {
    flex: 1,
    minHeight: 55,
    marginLeft: 10,
    paddingTop: 0,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.text,
    textAlignVertical: "top",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#F1F7FF",
    borderWidth: 1,
    borderColor: "#DCEBFA",
    marginBottom: 12,
  },

  infoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.darkGray,
    marginLeft: 8,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
  },

  errorBannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.error,
    marginLeft: 8,
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  submitButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  submitButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },

  pressed: {
    opacity: 0.7,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
