import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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

import { useRawMaterialStore } from "@/store/rawMaterialStore";
import { COLORS, fontSizes, fonts } from "@/utils/styles";

import type {
  RawMaterialUnit,
  RawMaterialWithStock,
} from "@/types/rawMaterial";

type RawMaterialFormModalProps = {
  visible: boolean;
  rawMaterial: RawMaterialWithStock | null;
  onClose: () => void;
  onSuccess: (rawMaterial: RawMaterialWithStock) => void;
};

type FormErrors = {
  name?: string;
  unit?: string;
  minStock?: string;
};

const UNIT_OPTIONS: {
  value: RawMaterialUnit;
  label: string;
  shortLabel: string;
}[] = [
  {
    value: "PIECE",
    label: "Pièce(s)",
    shortLabel: "pièce(s)",
  },
  {
    value: "GRAM",
    label: "Gramme(s)",
    shortLabel: "g",
  },
  {
    value: "KILOGRAM",
    label: "Kilogramme(s)",
    shortLabel: "kg",
  },
  {
    value: "MILLILITER",
    label: "Millilitre(s)",
    shortLabel: "ml",
  },
  {
    value: "LITER",
    label: "Litre(s)",
    shortLabel: "L",
  },
];

const RawMaterialFormModal = ({
  visible,
  rawMaterial,
  onClose,
  onSuccess,
}: RawMaterialFormModalProps) => {
  const isEditing = rawMaterial !== null;

  const createRawMaterial = useRawMaterialStore(
    (state) => state.createRawMaterial,
  );

  const updateRawMaterial = useRawMaterialStore(
    (state) => state.updateRawMaterial,
  );

  const isCreating = useRawMaterialStore((state) => state.isCreating);

  const isUpdating = useRawMaterialStore((state) => state.isUpdating);

  const storeError = useRawMaterialStore((state) => state.error);

  const clearError = useRawMaterialStore((state) => state.clearError);

  const [name, setName] = useState(rawMaterial?.name ?? "");

  const [unit, setUnit] = useState<RawMaterialUnit>(
    rawMaterial?.unit ?? "KILOGRAM",
  );

  const [minStock, setMinStock] = useState(
    rawMaterial?.minStock !== null && rawMaterial?.minStock !== undefined
      ? String(rawMaterial.minStock)
      : "",
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [unitSelectorVisible, setUnitSelectorVisible] = useState(false);
  const isSubmitting = isCreating || isUpdating;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = "Le nom de la matière première est requis.";
    } else if (trimmedName.length > 100) {
      newErrors.name = "Le nom de la matière première est trop long.";
    }

    if (!unit) {
      newErrors.unit = "L'unité de mesure est requise.";
    }

    if (minStock.trim() !== "") {
      const parsedMinStock = Number(minStock.replace(",", "."));

      if (!Number.isFinite(parsedMinStock) || parsedMinStock < 0) {
        newErrors.minStock =
          "Le stock minimum doit être un nombre positif ou nul.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setUnitSelectorVisible(false);

    if (isSubmitting) return;

    if (!validate()) return;

    const normalizedName = name.trim();

    const parsedMinStock =
      minStock.trim() === "" ? undefined : Number(minStock.replace(",", "."));

    try {
      let result: RawMaterialWithStock;

      if (isEditing && rawMaterial) {
        result = await updateRawMaterial(rawMaterial.id, {
          name: normalizedName,
          unit,
          minStock: parsedMinStock === undefined ? null : parsedMinStock,
        });
      } else {
        result = await createRawMaterial({
          name: normalizedName,
          unit,
          ...(parsedMinStock !== undefined ? { minStock: parsedMinStock } : {}),
        });
      }

      onSuccess(result);
    } catch {
      // L'erreur serveur est conservée dans le store.
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    setUnitSelectorVisible(false);
    clearError();
    setErrors({});
    onClose();
  };

  const selectedUnit = UNIT_OPTIONS.find((option) => option.value === unit);

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
                      name={isEditing ? "create-outline" : "leaf-outline"}
                      size={24}
                      color={COLORS.primary}
                    />
                  </View>

                  <View>
                    <Text style={styles.title}>
                      {isEditing ? "Modifier la matière" : "Nouvelle matière"}
                    </Text>

                    <Text style={styles.subtitle}>
                      {isEditing
                        ? "Modifiez les informations"
                        : "Ajoutez une matière première"}
                    </Text>
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

              {/* Formulaire */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={Keyboard.dismiss}
              >
                {/* Erreur serveur */}
                {storeError && (
                  <View style={styles.errorBanner}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color={COLORS.error}
                    />

                    <Text style={styles.errorBannerText}>{storeError}</Text>
                  </View>
                )}

                {/* Nom */}
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Nom de la matière
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <View
                    style={[
                      styles.inputContainer,
                      errors.name && styles.inputContainerError,
                    ]}
                  >
                    <Ionicons
                      name="text-outline"
                      size={19}
                      color={errors.name ? COLORS.error : COLORS.Gray}
                    />

                    <TextInput
                      value={name}
                      onChangeText={(value) => {
                        setName(value);

                        if (errors.name) {
                          setErrors((current) => ({
                            ...current,
                            name: undefined,
                          }));
                        }

                        if (storeError) {
                          clearError();
                        }
                      }}
                      placeholder="Ex. Orange, Mangue, Sucre..."
                      placeholderTextColor={COLORS.Gray}
                      style={styles.input}
                      maxLength={100}
                      editable={!isSubmitting}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  {errors.name && (
                    <Text style={styles.fieldError}>{errors.name}</Text>
                  )}
                </View>

                {/* Unité */}
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Unité de mesure
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <Pressable
                    onPress={() => {
                      if (isSubmitting) return;

                      Keyboard.dismiss();
                      setUnitSelectorVisible((current) => !current);
                    }}
                    style={[
                      styles.selectContainer,
                      errors.unit && styles.inputContainerError,
                    ]}
                  >
                    <View style={styles.selectLeft}>
                      <Ionicons
                        name="scale-outline"
                        size={19}
                        color={errors.unit ? COLORS.error : COLORS.Gray}
                      />

                      <Text style={styles.selectText}>
                        {selectedUnit?.label}
                      </Text>
                    </View>

                    <Ionicons
                      name={unitSelectorVisible ? "chevron-up" : "chevron-down"}
                      size={19}
                      color={COLORS.Gray}
                    />
                  </Pressable>

                  {unitSelectorVisible && (
                    <View style={styles.unitOptions}>
                      {UNIT_OPTIONS.map((option) => {
                        const isSelected = option.value === unit;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setUnit(option.value);
                              setUnitSelectorVisible(false);

                              if (errors.unit) {
                                setErrors((current) => ({
                                  ...current,
                                  unit: undefined,
                                }));
                              }
                            }}
                            style={({ pressed }) => [
                              styles.unitOption,
                              isSelected && styles.unitOptionSelected,
                              pressed && styles.optionPressed,
                            ]}
                          >
                            <View>
                              <Text
                                style={[
                                  styles.unitOptionLabel,
                                  isSelected && styles.unitOptionLabelSelected,
                                ]}
                              >
                                {option.label}
                              </Text>

                              <Text style={styles.unitOptionShort}>
                                {option.shortLabel}
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
                  )}

                  {errors.unit && (
                    <Text style={styles.fieldError}>{errors.unit}</Text>
                  )}
                </View>

                {/* Stock minimum */}
                <View style={styles.field}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Stock minimum</Text>

                    <Text style={styles.optional}>Optionnel</Text>
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      errors.minStock && styles.inputContainerError,
                    ]}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color={errors.minStock ? COLORS.error : COLORS.Gray}
                    />

                    <TextInput
                      value={minStock}
                      onChangeText={(value) => {
                        setMinStock(value);

                        if (errors.minStock) {
                          setErrors((current) => ({
                            ...current,
                            minStock: undefined,
                          }));
                        }

                        if (storeError) {
                          clearError();
                        }
                      }}
                      placeholder="Ex. 10"
                      placeholderTextColor={COLORS.Gray}
                      style={styles.input}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />

                    {selectedUnit && (
                      <Text style={styles.inputSuffix}>
                        {selectedUnit.shortLabel}
                      </Text>
                    )}
                  </View>

                  {errors.minStock ? (
                    <Text style={styles.fieldError}>{errors.minStock}</Text>
                  ) : (
                    <Text style={styles.helperText}>
                      Une alerte sera affichée lorsque le stock atteindra ce
                      niveau.
                    </Text>
                  )}
                </View>

                {/* Aperçu */}
                <View style={styles.previewCard}>
                  <View style={styles.previewIcon}>
                    <Ionicons
                      name="information-circle-outline"
                      size={19}
                      color={COLORS.info}
                    />
                  </View>

                  <View style={styles.previewContent}>
                    <Text style={styles.previewTitle}>Gestion du stock</Text>

                    <Text style={styles.previewText}>
                      Le stock de cette matière première sera géré dans le stock
                      central de la boutique.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Actions */}
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
                  <Text style={styles.cancelButtonText}>Annuler</Text>
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
                      name={isEditing ? "checkmark-outline" : "add-outline"}
                      size={20}
                      color={COLORS.white}
                    />
                  )}

                  <Text style={styles.submitButtonText}>
                    {isEditing ? "Enregistrer" : "Ajouter"}
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

export default RawMaterialFormModal;

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
    paddingBottom: 10,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
    marginBottom: 18,
  },

  errorBannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.error,
    marginLeft: 8,
  },

  field: {
    marginBottom: 20,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
    marginBottom: 8,
  },

  required: {
    color: COLORS.error,
  },

  optional: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },

  inputContainerError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  inputSuffix: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    marginLeft: 8,
  },

  selectContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },

  selectLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  selectText: {
    marginLeft: 10,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  unitOptions: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.white,
  },

  unitOption: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  unitOptionSelected: {
    backgroundColor: "#F3F8F1",
  },

  unitOptionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  unitOptionLabelSelected: {
    fontFamily: fonts.semibold,
    color: COLORS.primary,
  },

  unitOptionShort: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
    marginTop: 2,
  },

  optionPressed: {
    opacity: 0.7,
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

  previewCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F1F7FF",
    borderWidth: 1,
    borderColor: "#DCEBFA",
    marginBottom: 10,
  },

  previewIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  previewContent: {
    flex: 1,
  },

  previewTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
    marginBottom: 2,
  },

  previewText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.darkGray,
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
