import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
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

import type {
  CreatePointOfSaleInput,
  PointOfSale,
  UpdatePointOfSaleInput,
} from "@/types/pointOfSale";

import { usePointOfSaleStore } from "@/store/pointOfSaleStore";
import { COLORS, fonts } from "@/utils/styles";

type PointOfSaleFormModalProps = {
  visible: boolean;
  pointOfSale?: PointOfSale | null;
  onClose: () => void;
  onSuccess?: (pointOfSale: PointOfSale) => void;
};

const PointOfSaleFormModal = ({
  visible,
  pointOfSale,
  onClose,
  onSuccess,
}: PointOfSaleFormModalProps) => {
  const isEditing = !!pointOfSale;

  const { createPointOfSale, updatePointOfSale, isCreating, isUpdating } =
    usePointOfSaleStore();

  const [name, setName] = useState(pointOfSale?.name ?? "");
  const [code, setCode] = useState(pointOfSale?.code ?? "");
  const [telephone, setTelephone] = useState(pointOfSale?.telephone ?? "");
  const [address, setAddress] = useState(pointOfSale?.address ?? "");

  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    telephone?: string;
    address?: string;
  }>({});

  const isSubmitting = isCreating || isUpdating;

  const validate = () => {
    const newErrors: typeof errors = {};

    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    const trimmedTelephone = telephone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      newErrors.name = "Le nom est obligatoire";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (trimmedName.length > 100) {
      newErrors.name = "Le nom ne peut pas dépasser 100 caractères";
    }

    if (!trimmedCode) {
      newErrors.code = "Le code est obligatoire";
    } else if (!/^[A-Z0-9_-]+$/.test(trimmedCode)) {
      newErrors.code =
        "Utilisez uniquement des lettres majuscules, chiffres, - et _";
    } else if (trimmedCode.length < 2 || trimmedCode.length > 30) {
      newErrors.code = "Le code doit contenir entre 2 et 30 caractères";
    }

    if (trimmedTelephone && !/^0\d{9}$/.test(trimmedTelephone)) {
      newErrors.telephone =
        "Le numéro doit contenir exactement 10 chiffres et commencer par 0";
    }

    if (trimmedAddress.length > 255) {
      newErrors.address = "L'adresse ne peut pas dépasser 255 caractères";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));

    if (errors.code) {
      setErrors((current) => ({
        ...current,
        code: undefined,
      }));
    }
  };

  const handleTelephoneChange = (value: string) => {
    setTelephone(value.replace(/\D/g, "").slice(0, 10));

    if (errors.telephone) {
      setErrors((current) => ({
        ...current,
        telephone: undefined,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      if (isEditing && pointOfSale) {
        const data: UpdatePointOfSaleInput = {
          name: name.trim(),
          code: code.trim(),
          telephone: telephone.trim(),
          address: address.trim(),
        };

        const updated = await updatePointOfSale(pointOfSale.id, data);

        onSuccess?.(updated);
      } else {
        const data: CreatePointOfSaleInput = {
          name: name.trim(),
          code: code.trim(),
          telephone: telephone.trim(),
          address: address.trim(),
        };

        const created = await createPointOfSale(data);

        onSuccess?.(created);
      }

      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message;

      if (message?.toLowerCase().includes("code")) {
        setErrors({
          code: message,
        });
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isEditing
                  ? "Modifier le point de vente"
                  : "Nouveau point de vente"}
              </Text>

              <Text style={styles.subtitle}>
                {isEditing
                  ? "Modifiez les informations du point de vente"
                  : "Ajoutez un nouveau point de vente"}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={10}
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={COLORS.darkGray}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <FormField
              label="Nom du point de vente"
              icon="storefront-outline"
              value={name}
              onChangeText={(value) => {
                setName(value);

                if (errors.name) {
                  setErrors((current) => ({
                    ...current,
                    name: undefined,
                  }));
                }
              }}
              placeholder="Ex. Boutique Gombe"
              error={errors.name}
              autoCapitalize="words"
            />

            <FormField
              label="Code"
              icon="tag-outline"
              value={code}
              onChangeText={handleCodeChange}
              placeholder="Ex. GOMBE-01"
              error={errors.code}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Text style={styles.helperText}>
              Le code doit être unique à la boutique.
            </Text>

            <FormField
              label="Téléphone"
              icon="phone-outline"
              value={telephone}
              onChangeText={handleTelephoneChange}
              placeholder="Ex. 0812345678"
              error={errors.telephone}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <FormField
              label="Adresse"
              icon="map-marker-outline"
              value={address}
              onChangeText={(value) => {
                setAddress(value);

                if (errors.address) {
                  setErrors((current) => ({
                    ...current,
                    address: undefined,
                  }));
                }
              }}
              placeholder="Adresse du point de vente"
              error={errors.address}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isSubmitting ? styles.submitPressed : undefined,
                isSubmitting && styles.submitDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={isEditing ? "check" : "plus"}
                    size={20}
                    color={COLORS.white}
                  />

                  <Text style={styles.submitText}>
                    {isEditing
                      ? "Enregistrer les modifications"
                      : "Créer le point de vente"}
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

type FormFieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  maxLength?: number;
};

const FormField = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  error,
  multiline,
  numberOfLines,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
}: FormFieldProps) => {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={19}
          color={error ? COLORS.error : COLORS.Gray}
          style={styles.inputIcon}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B2B2B2"
          style={[styles.input, multiline && styles.multilineText]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default PointOfSaleFormModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  container: {
    maxHeight: "92%",
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    marginTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: COLORS.text,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.Gray,
    marginTop: 4,
    maxWidth: 280,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 35,
  },

  fieldContainer: {
    marginBottom: 17,
  },

  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    paddingHorizontal: 14,
  },

  multilineInput: {
    alignItems: "flex-start",
    paddingVertical: 13,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },

  multilineText: {
    minHeight: 65,
    textAlignVertical: "top",
  },

  helperText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
    marginTop: -9,
    marginBottom: 16,
    marginLeft: 2,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.error,
    marginTop: 5,
    marginLeft: 2,
  },

  submitButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },

  submitPressed: {
    opacity: 0.8,
  },

  submitDisabled: {
    opacity: 0.55,
  },

  submitText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
});
