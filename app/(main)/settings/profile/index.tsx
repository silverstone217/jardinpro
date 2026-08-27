import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { useUserStore } from "@/store/userStore";
import { COLORS, fonts, typography } from "@/utils/styles";
import { uploadProfileImage } from "@/utils/uploadProfileImage";

type ProfileField = "name" | "telephone" | "email";

const ProfileScreen = () => {
  const router = useRouter();

  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const updateProfileImage = useUserStore((state) => state.updateProfileImage);

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");

  const [focusedField, setFocusedField] = useState<ProfileField | null>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    setName(user.name ?? "");
    setTelephone(user.telephone ?? "");
    setEmail(user.email ?? "");
  }, [user]);

  /**
   * ============================================================
   * TELEPHONE
   * ============================================================
   *
   * - chiffres uniquement
   * - maximum 10 chiffres
   * - le premier chiffre doit être 0
   */
  const handleTelephoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "");

    // Si on commence par autre chose que 0,
    // on ignore la saisie.
    if (cleanedValue.length > 0 && cleanedValue[0] !== "0") {
      return;
    }

    const nextValue = cleanedValue.slice(0, 10);

    setTelephone(nextValue);

    if (error) {
      setError("");
    }
  };

  const handleFieldChange = (field: ProfileField, value: string) => {
    if (field === "name") {
      setName(value);
    }

    if (field === "email") {
      setEmail(value);
    }

    if (error) {
      setError("");
    }
  };

  /**
   * ============================================================
   * CHANGER LA PHOTO
   * ============================================================
   */
  const handleChangeImage = async () => {
    if (!user || isUploadingImage || isSaving) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission requise",
          "Autorisez l'accès à vos photos pour modifier votre photo de profil.",
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

      // Limite de 2 Mo
      if (asset.fileSize !== undefined && asset.fileSize > 2 * 1024 * 1024) {
        Alert.alert(
          "Image trop volumineuse",
          "La photo doit avoir une taille inférieure à 2 Mo.",
        );
        return;
      }

      setIsUploadingImage(true);

      const imageUrl = await uploadProfileImage(asset.uri, user.id);

      await updateProfileImage(imageUrl);

      Alert.alert("Photo modifiée", "Votre photo de profil a été mise à jour.");
    } catch (error: any) {
      console.error("Change profile image error:", error);

      const message =
        error?.response?.data?.message ||
        "Impossible de modifier votre photo de profil.";

      Alert.alert("Erreur", message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  /**
   * ============================================================
   * VALIDATION
   * ============================================================
   */
  const validateForm = () => {
    const cleanName = name.trim();
    const cleanTelephone = telephone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Veuillez entrer votre nom.");
      return false;
    }

    if (!cleanTelephone) {
      setError("Veuillez entrer votre numéro de téléphone.");
      return false;
    }

    if (!/^0\d{9}$/.test(cleanTelephone)) {
      setError(
        "Le numéro doit contenir exactement 10 chiffres et commencer par 0.",
      );
      return false;
    }

    if (!cleanEmail) {
      setError("Veuillez entrer votre adresse email.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Veuillez entrer une adresse email valide.");
      return false;
    }

    return true;
  };

  /**
   * ============================================================
   * ENREGISTRER
   * ============================================================
   */
  const handleSaveProfile = async () => {
    if (!user || isSaving || isLoading) return;

    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      await updateProfile({
        name: name.trim(),
        telephone: telephone.trim(),
        email: email.trim().toLowerCase(),
      });

      Alert.alert(
        "Profil mis à jour",
        "Vos informations personnelles ont été enregistrées.",
      );
    } catch (error: any) {
      console.error("Update profile error:", error);

      const message =
        error?.response?.data?.message ||
        "Impossible de modifier votre profil.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="account-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>Aucun utilisateur connecté</Text>

            <Text style={styles.emptyText}>
              Votre session utilisateur est introuvable.
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const busy = isSaving || isUploadingImage || isLoading;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

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
            {/* =====================================================
                HEADER
            ====================================================== */}

            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
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
                  name="account-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </View>
            </View>

            {/* =====================================================
                TITLE
            ====================================================== */}

            <View style={styles.titleContainer}>
              <View style={styles.titleAccent} />

              <Text style={styles.title}>Mon compte</Text>

              <Text style={styles.subtitle}>
                Gérez vos informations personnelles et votre identité sur Jardin
                Pro.
              </Text>
            </View>

            {/* =====================================================
                PROFILE CARD
            ====================================================== */}

            <View style={styles.profileCard}>
              <View style={styles.profileTop}>
                <View style={styles.avatarWrapper}>
                  {user.image ? (
                    <Image source={{ uri: user.image }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialCommunityIcons
                        name="account"
                        size={50}
                        color={COLORS.primary}
                      />
                    </View>
                  )}

                  <Pressable
                    onPress={handleChangeImage}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.cameraButton,
                      pressed && styles.pressed,
                      busy && styles.disabledButton,
                    ]}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <MaterialCommunityIcons
                        name="camera-outline"
                        size={18}
                        color={COLORS.white}
                      />
                    )}
                  </Pressable>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user.name}</Text>

                  <Text style={styles.profileTelephone}>{user.telephone}</Text>

                  <View style={styles.roleBadge}>
                    <View style={styles.roleDot} />

                    <Text style={styles.roleText}>{user.role}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.profileHint}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={15}
                  color={COLORS.darkGray}
                />

                <Text style={styles.profileHintText}>
                  Appuyez sur l&apos;appareil photo pour modifier votre photo.
                </Text>
              </View>
            </View>

            {/* =====================================================
                PERSONAL INFORMATION
            ====================================================== */}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardEyebrow}>INFORMATIONS</Text>

                  <Text style={styles.cardTitle}>
                    Informations personnelles
                  </Text>

                  <Text style={styles.cardDescription}>
                    Ces informations sont associées à votre compte utilisateur.
                  </Text>
                </View>

                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name="account-edit-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              {/* NOM */}

              <ProfileInput
                label="Nom complet"
                placeholder="Ex. Jean Dupont"
                value={name}
                icon="account-outline"
                focused={focusedField === "name"}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => handleFieldChange("name", value)}
                editable={!busy}
              />

              {/* TELEPHONE */}

              <ProfileInput
                label="Numéro de téléphone"
                placeholder="0812345678"
                value={telephone}
                icon="phone-outline"
                focused={focusedField === "telephone"}
                onFocus={() => setFocusedField("telephone")}
                onBlur={() => setFocusedField(null)}
                onChangeText={handleTelephoneChange}
                keyboardType="number-pad"
                maxLength={10}
                counter
                required
                editable={!busy}
              />

              {/* EMAIL */}

              <ProfileInput
                label="Adresse email"
                placeholder="contact@jardinpro.com"
                value={email}
                icon="email-outline"
                focused={focusedField === "email"}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => handleFieldChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!busy}
              />
            </View>

            {/* =====================================================
                ACCOUNT INFO
            ====================================================== */}

            <View style={styles.accountInfoCard}>
              <View style={styles.accountInfoIcon}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={20}
                  color={COLORS.success}
                />
              </View>

              <View style={styles.accountInfoContent}>
                <Text style={styles.accountInfoTitle}>Compte sécurisé</Text>

                <Text style={styles.accountInfoText}>
                  Vos informations personnelles sont protégées et accessibles
                  uniquement depuis votre compte.
                </Text>
              </View>
            </View>

            {/* =====================================================
                ERROR
            ====================================================== */}

            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={18}
                  color={COLORS.error}
                />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* =====================================================
                SAVE
            ====================================================== */}

            <View style={styles.bottomSection}>
              <Pressable
                onPress={handleSaveProfile}
                disabled={busy}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                  busy && styles.disabledButton,
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      Enregistrer les modifications
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
                  name="lock-outline"
                  size={14}
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
    </>
  );
};

/**
 * ================================================================
 * INPUT
 * ================================================================
 */

interface ProfileInputProps {
  label: string;
  placeholder: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  required?: boolean;
  keyboardType?: "default" | "number-pad" | "email-address";
  autoCapitalize?: "none" | "sentences";
  maxLength?: number;
  counter?: boolean;
  editable?: boolean;
}

const ProfileInput = ({
  label,
  placeholder,
  value,
  icon,
  focused,
  onFocus,
  onBlur,
  onChangeText,
  required = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  counter = false,
  editable = true,
}: ProfileInputProps) => {
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
          style={styles.input}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
};

export default ProfileScreen;

/**
 * ================================================================
 * STYLES
 * ================================================================
 */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  keyboardView: {
    flex: 1,
  },

  /*
   * IMPORTANT :
   * Le bottom tab est en position absolute.
   * On laisse donc suffisamment d'espace en bas.
   */
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 150,
  },

  // ============================================================
  // HEADER
  // ============================================================

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
    borderColor: "#ECECE8",
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

  // ============================================================
  // TITLE
  // ============================================================

  titleContainer: {
    marginTop: 28,
    marginBottom: 26,
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
    paddingRight: 10,
  },

  // ============================================================
  // PROFILE CARD
  // ============================================================

  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    overflow: "hidden",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },

  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButton: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: COLORS.secondary,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },

  profileName: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: COLORS.white,
  },

  profileTelephone: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#DDE8DA",
  },

  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.tertiary,
    marginRight: 6,
  },

  roleText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.white,
  },

  profileHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },

  profileHintText: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: "#DDE8DA",
  },

  // ============================================================
  // CARD
  // ============================================================

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
    marginBottom: 21,
  },

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 14,
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

  // ============================================================
  // INPUTS
  // ============================================================

  inputGroup: {
    marginBottom: 17,
  },

  inputGroupLast: {
    marginBottom: 0,
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

  // ============================================================
  // ACCOUNT INFO
  // ============================================================

  accountInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F8F1",
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4EDE1",
  },

  accountInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  accountInfoContent: {
    flex: 1,
    marginLeft: 12,
  },

  accountInfoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.text,
  },

  accountInfoText: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.darkGray,
  },

  // ============================================================
  // ERROR
  // ============================================================

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

  // ============================================================
  // SAVE
  // ============================================================

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

  // ============================================================
  // EMPTY
  // ============================================================

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 17,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.darkGray,
    textAlign: "center",
  },

  // ============================================================
  // STATES
  // ============================================================

  pressed: {
    opacity: 0.65,
  },

  disabledButton: {
    opacity: 0.7,
  },
});
