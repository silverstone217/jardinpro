import { useShopStore } from "@/store/shopStore";
import { DEFAULT_SHOP_LOGO } from "@/utils/env.variables";
import { COLORS, fonts, typography } from "@/utils/styles";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Currency = "CDF" | "USD" | "EUR";

interface ShopFormData {
  name: string;
  slogan: string;
  telephone: string;
  email: string;
  address: string;
  currency: Currency;
}

interface FormShopProps {
  shop: {
    id: string;
    name: string;
    slogan?: string | null;
    telephone: string;
    email?: string | null;
    address: string;
    currency: Currency;
    logo?: string | null;
  } | null;
}

const FormShop = ({ shop }: FormShopProps) => {
  const router = useRouter();

  const createShop = useShopStore((state) => state.createShop);
  const updateShop = useShopStore((state) => state.updateShop);
  const updateShopLogo = useShopStore((state) => state.updateShopLogo);
  const isLoading = useShopStore((state) => state.isLoading);

  const isEditing = !!shop;

  const [formData, setFormData] = useState<ShopFormData>(() => ({
    name: shop?.name ?? "",
    slogan: shop?.slogan ?? "",
    telephone: shop?.telephone ?? "",
    email: shop?.email ?? "",
    address: shop?.address ?? "",
    currency: shop?.currency ?? "CDF",
  }));

  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<keyof ShopFormData | null>(
    null,
  );
  const [isPickingLogo, setIsPickingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const displayedLogo = shop?.logo || DEFAULT_SHOP_LOGO;

  /**
   * TELEPHONE
   *
   * - uniquement chiffres
   * - maximum 10
   * - doit commencer par 0
   */
  const handleTelephoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "");

    if (cleanedValue.length > 0 && cleanedValue[0] !== "0") {
      return;
    }

    const telephone = cleanedValue.slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      telephone,
    }));

    if (error) {
      setError("");
    }
  };

  const updateField = (field: keyof ShopFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /**
   * VALIDATION
   */
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Veuillez entrer le nom de la boutique.");
      return false;
    }

    if (!formData.telephone) {
      setError("Veuillez entrer le numéro de téléphone.");
      return false;
    }

    if (!/^0\d{9}$/.test(formData.telephone)) {
      setError(
        "Le numéro doit contenir exactement 10 chiffres et commencer par 0.",
      );
      return false;
    }

    if (!formData.address.trim()) {
      setError("Veuillez entrer l'adresse de la boutique.");
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Veuillez entrer une adresse email valide.");
      return false;
    }

    return true;
  };

  /**
   * CREATE / UPDATE
   */
  const handleSave = async () => {
    if (isSaving) return;

    setError("");

    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const data = {
        name: formData.name.trim(),
        slogan: formData.slogan.trim() || undefined,
        telephone: formData.telephone,
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
        currency: formData.currency,
      };

      if (isEditing) {
        await updateShop(data);
      } else {
        await createShop(data);
      }

      Alert.alert(
        isEditing ? "Boutique modifiée" : "Boutique créée",
        isEditing
          ? "Les informations de votre boutique ont été mises à jour."
          : "Votre boutique a été créée avec succès.",
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Une erreur est survenue. Veuillez réessayer.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * LOGO
   */
  const MAX_LOGO_SIZE = 2 * 1024 * 1024;

  const handlePickLogo = async () => {
    if (!shop || isPickingLogo) return;

    try {
      setIsPickingLogo(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission requise",
          "Autorisez l'accès à vos photos pour modifier le logo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (asset.fileSize !== undefined && asset.fileSize > MAX_LOGO_SIZE) {
        Alert.alert(
          "Image trop volumineuse",
          "Le logo doit avoir une taille inférieure à 2 Mo.",
        );
        return;
      }

      await updateShopLogo(asset.uri);

      Alert.alert(
        "Logo modifié",
        "Le logo de votre boutique a été mis à jour.",
      );
    } catch (error: any) {
      console.error("Change shop logo error:", error);

      const message =
        error?.response?.data?.message || "Impossible de modifier le logo.";

      Alert.alert("Erreur", message);
    } finally {
      setIsPickingLogo(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  opacity: pressed ? 0.55 : 1,
                },
              ]}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={COLORS.text}
              />
            </Pressable>

            <View style={styles.headerRight}>
              <MaterialCommunityIcons
                name="store-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>
          </View>

          {/* TITLE */}

          <View style={styles.titleContainer}>
            <View style={styles.titleAccent} />

            <Text style={styles.title}>
              {isEditing ? "Ma boutique" : "Créer ma boutique"}
            </Text>

            <Text style={styles.subtitle}>
              {isEditing
                ? "Gérez les informations et l'identité de votre boutique."
                : "Configurez votre boutique pour commencer à gérer votre activité."}
            </Text>
          </View>

          {/* LOGO */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardEyebrow}>IDENTITÉ</Text>

                <Text style={styles.cardTitle}>Logo de la boutique</Text>

                <Text style={styles.cardDescription}>
                  Votre logo apparaîtra sur vos factures et dans les différents
                  espaces de l&apos;application.
                </Text>
              </View>

              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="image-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.logoSection}>
              <View style={styles.logoWrapper}>
                <Image source={{ uri: displayedLogo }} style={styles.logo} />

                {isPickingLogo && (
                  <View style={styles.logoOverlay}>
                    <ActivityIndicator size="small" color={COLORS.white} />
                  </View>
                )}
              </View>

              <View style={styles.logoContent}>
                <Text style={styles.logoTitle}>
                  {shop ? "Logo actuel" : "Logo par défaut"}
                </Text>

                <Text style={styles.logoDescription}>
                  {shop
                    ? "Utilisez une image carrée de bonne qualité."
                    : "Vous pourrez personnaliser le logo après la création."}
                </Text>

                {shop && (
                  <Pressable
                    onPress={handlePickLogo}
                    disabled={isPickingLogo}
                    style={({ pressed }) => [
                      styles.logoButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="camera-outline"
                      size={17}
                      color={COLORS.primary}
                    />

                    <Text style={styles.logoButtonText}>
                      {isPickingLogo ? "Envoi..." : "Changer le logo"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* INFORMATIONS */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardEyebrow}>INFORMATIONS</Text>

                <Text style={styles.cardTitle}>Informations générales</Text>
              </View>

              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="store-edit-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <ShopInput
              label="Nom de la boutique"
              placeholder="Ex. Jus Jardin"
              value={formData.name}
              icon="storefront-outline"
              focused={focusedField === "name"}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => updateField("name", value)}
              editable={!isSaving}
            />

            <ShopInput
              label="Slogan"
              placeholder="Le goût naturel dans chaque bouteille"
              value={formData.slogan}
              icon="abugida-thai"
              focused={focusedField === "slogan"}
              onFocus={() => setFocusedField("slogan")}
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => updateField("slogan", value)}
              editable={!isSaving}
            />

            <ShopInput
              label="Numéro de téléphone"
              placeholder="0812345678"
              value={formData.telephone}
              icon="phone-outline"
              focused={focusedField === "telephone"}
              onFocus={() => setFocusedField("telephone")}
              onBlur={() => setFocusedField(null)}
              onChangeText={handleTelephoneChange}
              keyboardType="number-pad"
              maxLength={10}
              counter
              required
              editable={!isSaving}
            />

            <ShopInput
              label="Adresse email"
              placeholder="contact@jardinpro.com"
              value={formData.email}
              icon="email-outline"
              focused={focusedField === "email"}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => updateField("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSaving}
            />

            <ShopInput
              label="Adresse"
              placeholder="Adresse de la boutique"
              value={formData.address}
              icon="map-marker-outline"
              focused={focusedField === "address"}
              onFocus={() => setFocusedField("address")}
              onBlur={() => setFocusedField(null)}
              onChangeText={(value) => updateField("address", value)}
              multiline
              required
              editable={!isSaving}
            />
          </View>

          {/* CURRENCY */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardEyebrow}>CONFIGURATION</Text>

                <Text style={styles.cardTitle}>Devise</Text>

                <Text style={styles.cardDescription}>
                  Cette devise sera utilisée pour les prix et les ventes.
                </Text>
              </View>

              <View style={styles.cardIcon}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.currencyContainer}>
              {(["CDF", "USD", "EUR"] as Currency[]).map((currency) => {
                const selected = formData.currency === currency;

                return (
                  <Pressable
                    key={currency}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        currency,
                      }))
                    }
                    style={[
                      styles.currencyButton,
                      selected && styles.currencyButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        selected && styles.currencyTextSelected,
                      ]}
                    >
                      {currency}
                    </Text>

                    {selected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={17}
                        color={COLORS.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ERROR */}

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={17}
                color={COLORS.error}
              />

              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* SAVE */}

          <View style={styles.bottomSection}>
            <Pressable
              onPress={handleSave}
              disabled={isSaving || isLoading}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
                (isSaving || isLoading) && styles.disabledButton,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>
                    {isEditing
                      ? "Enregistrer les modifications"
                      : "Créer la boutique"}
                  </Text>

                  <View style={styles.saveIcon}>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>
                </>
              )}
            </Pressable>

            <View style={styles.securityInfo}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={16}
                color={COLORS.success}
              />

              <Text style={styles.securityText}>
                Vos informations sont protégées
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface ShopInputProps {
  label: string;
  placeholder: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad" | "email-address";
  autoCapitalize?: "none" | "sentences";
  maxLength?: number;
  counter?: boolean;
  editable?: boolean;
}

const ShopInput = ({
  label,
  placeholder,
  value,
  icon,
  focused,
  onFocus,
  onBlur,
  onChangeText,
  required = false,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  counter = false,
  editable = true,
}: ShopInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>

        {counter && value.length > 0 && (
          <Text style={styles.counter}>{value.length}/10</Text>
        )}
      </View>

      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          focused && styles.inputContainerFocused,
          !editable && styles.inputDisabled,
        ]}
      >
        <View
          style={[
            styles.inputIconContainer,
            focused && styles.inputIconContainerFocused,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={19}
            color={focused ? COLORS.primary : COLORS.darkGray}
          />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.Gray}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          style={[styles.input, multiline && styles.inputMultiline]}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 145,
  },

  // HEADER

  header: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },

  headerRight: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E7F0E5",
    alignItems: "center",
    justifyContent: "center",
  },

  // TITLE

  titleContainer: {
    marginTop: 28,
    marginBottom: 28,
  },

  titleAccent: {
    width: 30,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginBottom: 14,
  },

  title: {
    ...typography.display,
    fontSize: 30,
    lineHeight: 38,
    color: COLORS.text,
  },

  subtitle: {
    ...typography.body,
    color: COLORS.darkGray,
    marginTop: 9,
    lineHeight: 22,
    paddingRight: 15,
  },

  // CARD

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ECECE8",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 15,
  },

  cardEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.secondary,
    marginBottom: 5,
  },

  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: COLORS.text,
  },

  cardDescription: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.darkGray,
  },

  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  // LOGO

  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoWrapper: {
    width: 92,
    height: 92,
    borderRadius: 24,
    padding: 4,
    backgroundColor: "#F3F6F1",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },

  logoOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    backgroundColor: "rgba(45,90,39,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  logoContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },

  logoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: COLORS.text,
  },

  logoDescription: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.darkGray,
  },

  logoButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#E8F2E5",
  },

  logoButtonText: {
    marginLeft: 6,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.primary,
  },

  // INPUTS

  inputGroup: {
    marginBottom: 17,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.text,
  },

  required: {
    color: COLORS.error,
  },

  counter: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.Gray,
  },

  inputContainer: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "#FCFCFA",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#FAFCF9",
  },

  inputContainerMultiline: {
    minHeight: 105,
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: 8,
  },

  inputDisabled: {
    opacity: 0.6,
  },

  inputIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  inputIconContainerFocused: {
    backgroundColor: "#E8F2E5",
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 54,
    paddingHorizontal: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: COLORS.text,
  },

  inputMultiline: {
    height: 89,
    paddingTop: 8,
  },

  // CURRENCY

  currencyContainer: {
    flexDirection: "row",
    gap: 8,
  },

  currencyButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: "#FCFCFA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  currencyButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#E8F2E5",
  },

  currencyText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.darkGray,
  },

  currencyTextSelected: {
    color: COLORS.primary,
  },

  // ERROR

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 3,
    marginTop: 2,
    marginBottom: 14,
  },

  errorText: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.error,
  },

  // BOTTOM

  bottomSection: {
    marginTop: 4,
    paddingTop: 4,
  },

  saveButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  saveButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: COLORS.white,
  },

  saveIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 8,
  },

  securityText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.darkGray,
    marginLeft: 6,
  },

  // STATES

  pressed: {
    opacity: 0.65,
  },

  disabledButton: {
    opacity: 0.7,
  },
});

export default FormShop;
