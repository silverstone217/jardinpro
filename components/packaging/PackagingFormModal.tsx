import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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

import { usePackagingStore } from "@/store/packagingStore";
import type { BottleSize, Packaging } from "@/types/packaging";
import { COLORS, fonts, fontSizes } from "@/utils/styles";

type PackagingFormModalProps = {
  visible: boolean;
  packaging: Packaging | null;
  onClose: () => void;
  onSuccess: (packaging: Packaging) => void;
};

const PackagingFormModal = ({
  visible,
  packaging,
  onClose,
  onSuccess,
}: PackagingFormModalProps) => {
  const isEditing = Boolean(packaging);

  const createPackaging = usePackagingStore((state) => state.createPackaging);

  const updatePackaging = usePackagingStore((state) => state.updatePackaging);

  const isCreating = usePackagingStore((state) => state.isCreating);

  const isUpdating = usePackagingStore((state) => state.isUpdating);

  const [name, setName] = useState(packaging?.name ?? "");

  const [size, setSize] = useState<BottleSize>(packaging?.size ?? "ML_200");

  const [nameError, setNameError] = useState("");

  const isSubmitting = isCreating || isUpdating;

  const validate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Le nom de l'emballage est requis.");
      return false;
    }

    if (trimmedName.length > 100) {
      setNameError("Le nom de l'emballage est trop long.");
      return false;
    }

    setNameError("");
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);

    if (nameError) {
      setNameError("");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    try {
      const trimmedName = name.trim();

      if (isEditing && packaging) {
        const updatedPackaging = await updatePackaging(packaging.id, {
          name: trimmedName,
          size,
        });

        onSuccess(updatedPackaging);
        return;
      }

      const newPackaging = await createPackaging({
        name: trimmedName,
        size,
        unit: "PIECE",
      });

      onSuccess(newPackaging);
    } catch {
      // L'erreur est déjà gérée par le store.
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isEditing ? "create-outline" : "cube-outline"}
                    size={22}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.headerText}>
                  <Text style={styles.title}>
                    {isEditing ? "Modifier l'emballage" : "Nouvel emballage"}
                  </Text>

                  <Text style={styles.subtitle}>
                    {isEditing
                      ? "Modifiez les informations"
                      : "Ajoutez un nouvel emballage"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                style={styles.closeButton}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={COLORS.darkGray} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Nom */}
              <View style={styles.field}>
                <Text style={styles.label}>Nom de l&apos;emballage</Text>

                <View
                  style={[
                    styles.inputContainer,
                    nameError && styles.inputContainerError,
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={19}
                    color={nameError ? COLORS.error : COLORS.Gray}
                  />

                  <TextInput
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="Ex. Bouteille transparente"
                    placeholderTextColor={COLORS.Gray}
                    style={styles.input}
                    editable={!isSubmitting}
                    maxLength={100}
                    autoCapitalize="sentences"
                    returnKeyType="next"
                  />
                </View>

                {nameError ? (
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={14}
                      color={COLORS.error}
                    />

                    <Text style={styles.errorText}>{nameError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Format */}
              <View style={styles.field}>
                <Text style={styles.label}>Format</Text>

                <Text style={styles.helperText}>
                  Choisissez la capacité de la bouteille.
                </Text>

                <View style={styles.sizeOptions}>
                  <SizeOption
                    size="ML_200"
                    label="200 ml"
                    icon="water-outline"
                    selected={size === "ML_200"}
                    disabled={isSubmitting}
                    onPress={() => setSize("ML_200")}
                  />

                  <SizeOption
                    size="ML_500"
                    label="500 ml"
                    icon="water"
                    selected={size === "ML_500"}
                    disabled={isSubmitting}
                    onPress={() => setSize("ML_500")}
                  />
                </View>
              </View>

              {/* Unité */}
              <View style={styles.field}>
                <Text style={styles.label}>Unité de gestion</Text>

                <View style={styles.unitCard}>
                  <View style={styles.unitIcon}>
                    <Ionicons
                      name="layers-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={styles.unitContent}>
                    <Text style={styles.unitTitle}>Pièce</Text>

                    <Text style={styles.unitDescription}>
                      Les emballages sont comptabilisés à l&apos;unité.
                    </Text>
                  </View>

                  <View style={styles.checkContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.success}
                    />
                  </View>
                </View>
              </View>

              {/* Information */}
              <View style={styles.infoBanner}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.infoText}>
                  L&apos;emballage sera disponible dans la gestion du stock et
                  pourra être utilisé lors de la production.
                </Text>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && !isSubmitting && styles.pressed,
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
                  pressed && !isSubmitting && styles.pressed,
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

type SizeOptionProps = {
  size: BottleSize;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

const SizeOption = ({
  label,
  icon,
  selected,
  disabled,
  onPress,
}: SizeOptionProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.sizeOption,
        selected && styles.sizeOptionSelected,
        pressed && !disabled && styles.pressed,
        disabled && styles.optionDisabled,
      ]}
    >
      <View style={[styles.sizeIcon, selected && styles.sizeIconSelected]}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? COLORS.primary : COLORS.Gray}
        />
      </View>

      <Text style={[styles.sizeLabel, selected && styles.sizeLabelSelected]}>
        {label}
      </Text>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  container: {
    maxHeight: "92%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

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
    marginRight: 12,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.darkGray,
  },

  subtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
  },

  scrollContent: {
    paddingBottom: 8,
  },

  field: {
    marginBottom: 20,
  },

  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
    marginBottom: 7,
  },

  helperText: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    color: COLORS.Gray,
    marginBottom: 10,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },

  inputContainerError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  errorText: {
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    color: COLORS.error,
  },

  sizeOptions: {
    gap: 10,
  },

  sizeOption: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },

  sizeOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F4F8F2",
  },

  sizeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.neutral,
    marginRight: 12,
  },

  sizeIconSelected: {
    backgroundColor: "#EAF2E8",
  },

  sizeLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  sizeLabelSelected: {
    fontFamily: fonts.semibold,
    color: COLORS.primary,
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: COLORS.primary,
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  optionDisabled: {
    opacity: 0.6,
  },

  unitCard: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: COLORS.neutral,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  unitIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginRight: 12,
  },

  unitContent: {
    flex: 1,
  },

  unitTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  unitDescription: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    color: COLORS.Gray,
  },

  checkContainer: {
    marginLeft: 8,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
    backgroundColor: "#F4F8F2",
    marginBottom: 8,
  },

  infoIcon: {
    marginTop: 1,
    marginRight: 8,
  },

  infoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    lineHeight: 18,
    color: COLORS.darkGray,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
  },

  cancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
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
    flex: 1.3,
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  submitButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },

  pressed: {
    opacity: 0.75,
  },

  disabledButton: {
    opacity: 0.6,
  },
});

export default PackagingFormModal;
