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

import { COLORS, fontSizes, fonts } from "@/utils/styles";

import type { BottleSize, ProductVariant } from "@/types/product";

import type { Packaging } from "@/types/packaging";

interface ProductVariantFormModalProps {
  visible: boolean;
  variant?: ProductVariant | null;
  packagingOptions: Packaging[];
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: {
    packagingId: string;
    size: BottleSize;
    volumeMl: number;
    price: number;
    sku?: string;
  }) => void | Promise<void>;
}

const SIZE_OPTIONS: {
  value: BottleSize;
  label: string;
  volumeMl: number;
}[] = [
  {
    value: "ML_200",
    label: "200 ml",
    volumeMl: 200,
  },
  {
    value: "ML_500",
    label: "500 ml",
    volumeMl: 500,
  },
];

export default function ProductVariantFormModal({
  visible,
  variant,
  packagingOptions,
  isSaving = false,
  error = null,
  onClose,
  onSubmit,
}: ProductVariantFormModalProps) {
  const isEditing = Boolean(variant);

  const [size, setSize] = useState<BottleSize>(variant?.size ?? "ML_200");

  const [packagingId, setPackagingId] = useState(variant?.packagingId ?? "");

  const [price, setPrice] = useState(
    variant?.price !== undefined && variant?.price !== null
      ? String(variant.price)
      : "",
  );

  const [sku, setSku] = useState(variant?.sku ?? "");

  const [sizeError, setSizeError] = useState("");
  const [packagingError, setPackagingError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [skuError, setSkuError] = useState("");

  const filteredPackaging = useMemo(() => {
    return packagingOptions.filter(
      (packaging) => packaging.isActive && packaging.size === size,
    );
  }, [packagingOptions, size]);

  const selectedPackaging = useMemo(() => {
    return filteredPackaging.find((packaging) => packaging.id === packagingId);
  }, [filteredPackaging, packagingId]);

  const selectedSize = SIZE_OPTIONS.find((option) => option.value === size);

  const volumeMl = selectedSize?.volumeMl ?? 200;

  const handleSizeChange = (newSize: BottleSize) => {
    setSize(newSize);
    setSizeError("");

    const currentPackaging = packagingOptions.find(
      (packaging) => packaging.id === packagingId,
    );

    if (
      !currentPackaging ||
      currentPackaging.size !== newSize ||
      !currentPackaging.isActive
    ) {
      setPackagingId("");
    }

    setPackagingError("");
  };

  const handlePackagingChange = (id: string) => {
    setPackagingId(id);
    setPackagingError("");
  };

  const validate = () => {
    let isValid = true;

    setSizeError("");
    setPackagingError("");
    setPriceError("");
    setSkuError("");

    if (!size) {
      setSizeError("Le format est requis.");
      isValid = false;
    }

    if (!packagingId) {
      setPackagingError("Veuillez sélectionner un emballage.");
      isValid = false;
    } else if (!selectedPackaging) {
      setPackagingError("L'emballage sélectionné est invalide.");
      isValid = false;
    }

    const normalizedPrice = price.trim().replace(",", ".");
    const parsedPrice = Number(normalizedPrice);

    if (!price.trim()) {
      setPriceError("Le prix est requis.");
      isValid = false;
    } else if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setPriceError("Veuillez saisir un prix valide.");
      isValid = false;
    }

    const trimmedSku = sku.trim();

    if (trimmedSku.length > 50) {
      setSkuError("Le SKU ne peut pas dépasser 50 caractères.");
      isValid = false;
    }

    return {
      isValid,
      parsedPrice,
      trimmedSku,
    };
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    const { isValid, parsedPrice, trimmedSku } = validate();

    if (!isValid) {
      return;
    }

    await onSubmit({
      packagingId,
      size,
      volumeMl,
      price: parsedPrice,
      ...(trimmedSku
        ? {
            sku: trimmedSku,
          }
        : {}),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>
                {isEditing ? "Modifier la variante" : "Nouvelle variante"}
              </Text>

              <Text style={styles.subtitle}>
                Configurez le format, l&apos;emballage et le prix.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* FORMAT */}
            <View style={styles.section}>
              <Text style={styles.label}>Format</Text>

              <View style={styles.sizeRow}>
                {SIZE_OPTIONS.map((option) => {
                  const isSelected = size === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSizeChange(option.value)}
                      disabled={isSaving}
                      style={({ pressed }) => [
                        styles.sizeCard,
                        isSelected && styles.sizeCardSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.radio,
                          isSelected && styles.radioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>

                      <View>
                        <Text
                          style={[
                            styles.sizeLabel,
                            isSelected && styles.sizeLabelSelected,
                          ]}
                        >
                          {option.label}
                        </Text>

                        <Text style={styles.sizeVolume}>
                          {option.volumeMl} ml
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {sizeError ? (
                <Text style={styles.errorText}>{sizeError}</Text>
              ) : null}
            </View>

            {/* PACKAGING */}
            <View style={styles.section}>
              <Text style={styles.label}>Emballage</Text>

              {filteredPackaging.length === 0 ? (
                <View style={styles.emptyPackaging}>
                  <Text style={styles.emptyPackagingIcon}>📦</Text>

                  <Text style={styles.emptyPackagingTitle}>
                    Aucun emballage disponible
                  </Text>

                  <Text style={styles.emptyPackagingText}>
                    Ajoutez d&apos;abord un emballage actif de{" "}
                    {selectedSize?.label ?? "ce format"}.
                  </Text>
                </View>
              ) : (
                <View style={styles.packagingList}>
                  {filteredPackaging.map((packaging) => {
                    const isSelected = packaging.id === packagingId;

                    return (
                      <Pressable
                        key={packaging.id}
                        onPress={() => handlePackagingChange(packaging.id)}
                        disabled={isSaving}
                        style={({ pressed }) => [
                          styles.packagingCard,
                          isSelected && styles.packagingCardSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.packagingIcon,
                            isSelected && styles.packagingIconSelected,
                          ]}
                        >
                          <Text style={styles.packagingIconText}>📦</Text>
                        </View>

                        <View style={styles.packagingInfo}>
                          <Text
                            style={[
                              styles.packagingName,
                              isSelected && styles.packagingNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {packaging.name}
                          </Text>

                          <Text style={styles.packagingMeta}>
                            {packaging.size === "ML_200" ? "200 ml" : "500 ml"}
                            {" • "}
                            {packaging.unit}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.radio,
                            isSelected && styles.radioSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {packagingError ? (
                <Text style={styles.errorText}>{packagingError}</Text>
              ) : null}
            </View>

            {/* PRICE */}
            <View style={styles.section}>
              <Text style={styles.label}>Prix de vente</Text>

              <View
                style={[
                  styles.inputWrapper,
                  priceError && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  value={price}
                  onChangeText={(value) => {
                    setPrice(value);
                    setPriceError("");
                  }}
                  placeholder="Ex. 1500"
                  placeholderTextColor={COLORS.Gray}
                  keyboardType={
                    Platform.OS === "ios" ? "decimal-pad" : "numeric"
                  }
                  editable={!isSaving}
                  style={styles.input}
                />
              </View>

              {priceError ? (
                <Text style={styles.errorText}>{priceError}</Text>
              ) : null}
            </View>

            {/* SKU */}
            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>SKU</Text>

                <Text style={styles.optionalText}>Facultatif</Text>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  skuError && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  value={sku}
                  onChangeText={(value) => {
                    setSku(value);
                    setSkuError("");
                  }}
                  placeholder="Ex. MANG-200"
                  placeholderTextColor={COLORS.Gray}
                  autoCapitalize="characters"
                  maxLength={50}
                  editable={!isSaving}
                  style={styles.input}
                />
              </View>

              {skuError ? (
                <Text style={styles.errorText}>{skuError}</Text>
              ) : null}
            </View>

            {/* SUMMARY */}
            <View style={styles.summary}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Résumé</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Format</Text>

                <Text style={styles.summaryValue}>
                  {selectedSize?.label ?? "—"}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Volume</Text>

                <Text style={styles.summaryValue}>{volumeMl} ml</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Emballage</Text>

                <Text style={styles.summaryValue} numberOfLines={1}>
                  {selectedPackaging?.name ?? "—"}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prix</Text>

                <Text style={[styles.summaryValue, styles.summaryPrice]}>
                  {price.trim() ? price.replace(",", ".") : "—"}
                </Text>
              </View>
            </View>

            {/* SERVER ERROR */}
            {error ? (
              <View style={styles.serverError}>
                <Text style={styles.serverErrorIcon}>!</Text>

                <Text style={styles.serverErrorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.submitButton,
                isSaving && styles.submitButtonDisabled,
                pressed && !isSaving && styles.pressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? "Enregistrer" : "Créer la variante"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  container: {
    maxHeight: "94%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    lineHeight: 18,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  closeButtonText: {
    marginTop: -2,
    fontFamily: fonts.regular,
    fontSize: 28,
    lineHeight: 32,
    color: COLORS.darkGray,
  },

  content: {
    padding: 20,
    paddingBottom: 24,
  },

  section: {
    marginBottom: 22,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  label: {
    marginBottom: 9,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  optionalText: {
    marginBottom: 9,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  sizeRow: {
    flexDirection: "row",
    gap: 10,
  },

  sizeCard: {
    flex: 1,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },

  sizeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F2F7F1",
  },

  sizeLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  sizeLabelSelected: {
    color: COLORS.primary,
  },

  sizeVolume: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.Gray,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  radioSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  packagingList: {
    gap: 9,
  },

  packagingCard: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    borderRadius: 15,
    backgroundColor: COLORS.white,
  },

  packagingCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F2F7F1",
  },

  packagingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    backgroundColor: COLORS.background,
  },

  packagingIconSelected: {
    backgroundColor: "#E4F0E2",
  },

  packagingIconText: {
    fontSize: 20,
  },

  packagingInfo: {
    flex: 1,
    paddingRight: 8,
  },

  packagingName: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  packagingNameSelected: {
    color: COLORS.primary,
  },

  packagingMeta: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  emptyPackaging: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },

  emptyPackagingIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  emptyPackagingTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
    textAlign: "center",
  },

  emptyPackagingText: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.Gray,
    textAlign: "center",
  },

  inputWrapper: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },

  inputWrapperError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 15,
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  errorText: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.error,
  },

  summary: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F7F8F5",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  summaryHeader: {
    marginBottom: 10,
  },

  summaryTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  summaryRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  summaryValue: {
    flexShrink: 1,
    marginLeft: 20,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
    textAlign: "right",
  },

  summaryPrice: {
    color: COLORS.primary,
  },

  serverError: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#FFF1F0",
  },

  serverErrorIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 9,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: COLORS.white,
    backgroundColor: COLORS.error,
    overflow: "hidden",
  },

  serverErrorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.error,
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 26 : 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  cancelButton: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  submitButton: {
    flex: 1.35,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: COLORS.primary,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },

  pressed: {
    opacity: 0.75,
  },
});
