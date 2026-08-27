import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

const SecurityScreen = () => {
  const router = useRouter();

  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const updatePassword = useUserStore((state) => state.updatePassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [focusedField, setFocusedField] = useState<PasswordField | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  /**
   * ============================================================
   * VALIDATION
   * ============================================================
   */
  const validateForm = () => {
    if (!currentPassword.trim()) {
      setError("Veuillez entrer votre mot de passe actuel.");
      return false;
    }

    if (!newPassword.trim()) {
      setError("Veuillez entrer votre nouveau mot de passe.");
      return false;
    }

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    if (newPassword === currentPassword) {
      setError("Le nouveau mot de passe doit être différent de l'ancien.");
      return false;
    }

    if (!confirmPassword.trim()) {
      setError("Veuillez confirmer votre nouveau mot de passe.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux nouveaux mots de passe ne correspondent pas.");
      return false;
    }

    return true;
  };

  /**
   * ============================================================
   * MODIFIER LE MOT DE PASSE
   * ============================================================
   */
  const handleChangePassword = async () => {
    if (!user || isSaving || isLoading) return;

    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      await updatePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Mot de passe modifié",
        "Votre mot de passe a été mis à jour avec succès.",
      );
    } catch (error: any) {
      console.error("Update password error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Impossible de modifier votre mot de passe.";

      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isLoading;

  /**
   * ============================================================
   * EMPTY STATE
   * ============================================================
   */
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
                name="shield-lock-outline"
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
                  name="shield-lock-outline"
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

              <Text style={styles.title}>Compte & sécurité</Text>

              <Text style={styles.subtitle}>
                Protégez votre compte en mettant régulièrement à jour votre mot
                de passe.
              </Text>
            </View>

            {/* =====================================================
                SECURITY CARD
            ====================================================== */}

            <View style={styles.securityCard}>
              <View style={styles.securityIcon}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.securityCardContent}>
                <Text style={styles.securityCardTitle}>
                  Votre compte est protégé
                </Text>

                <Text style={styles.securityCardText}>
                  Choisissez un mot de passe suffisamment long et difficile à
                  deviner. Ne le partagez jamais avec quelqu&apos;un.
                </Text>
              </View>
            </View>

            {/* =====================================================
                PASSWORD CARD
            ====================================================== */}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardEyebrow}>SÉCURITÉ</Text>

                  <Text style={styles.cardTitle}>Modifier le mot de passe</Text>

                  <Text style={styles.cardDescription}>
                    Entrez votre mot de passe actuel puis choisissez un nouveau
                    mot de passe.
                  </Text>
                </View>

                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              {/* MOT DE PASSE ACTUEL */}

              <PasswordInput
                label="Mot de passe actuel"
                placeholder="Votre mot de passe actuel"
                value={currentPassword}
                icon="lock-outline"
                focused={focusedField === "currentPassword"}
                visible={showCurrentPassword}
                onFocus={() => setFocusedField("currentPassword")}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => {
                  setCurrentPassword(value);
                  if (error) setError("");
                }}
                onToggleVisibility={() =>
                  setShowCurrentPassword((value) => !value)
                }
                editable={!busy}
              />

              {/* NOUVEAU MOT DE PASSE */}

              <PasswordInput
                label="Nouveau mot de passe"
                placeholder="Au moins 6 caractères"
                value={newPassword}
                icon="lock-plus-outline"
                focused={focusedField === "newPassword"}
                visible={showNewPassword}
                onFocus={() => setFocusedField("newPassword")}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => {
                  setNewPassword(value);
                  if (error) setError("");
                }}
                onToggleVisibility={() => setShowNewPassword((value) => !value)}
                editable={!busy}
              />

              {/* CONFIRMATION */}

              <PasswordInput
                label="Confirmer le nouveau mot de passe"
                placeholder="Répétez le nouveau mot de passe"
                value={confirmPassword}
                icon="lock-check-outline"
                focused={focusedField === "confirmPassword"}
                visible={showConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  if (error) setError("");
                }}
                onToggleVisibility={() =>
                  setShowConfirmPassword((value) => !value)
                }
                editable={!busy}
              />
            </View>

            {/* =====================================================
                PASSWORD RULES
            ====================================================== */}

            <View style={styles.rulesCard}>
              <View style={styles.rulesIcon}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.rulesContent}>
                <Text style={styles.rulesTitle}>
                  Conseils pour votre mot de passe
                </Text>

                <PasswordRule
                  valid={newPassword.length >= 6}
                  text="Au moins 6 caractères"
                />

                <PasswordRule
                  valid={
                    newPassword.length > 0 && newPassword !== currentPassword
                  }
                  text="Différent de votre ancien mot de passe"
                />

                <PasswordRule
                  valid={
                    confirmPassword.length > 0 &&
                    newPassword === confirmPassword
                  }
                  text="Les deux mots de passe correspondent"
                />
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
                onPress={handleChangePassword}
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
                      Modifier le mot de passe
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
                  Votre mot de passe est protégé
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
 * PASSWORD INPUT
 * ================================================================
 */

interface PasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  focused: boolean;
  visible: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
  editable?: boolean;
}

const PasswordInput = ({
  label,
  placeholder,
  value,
  icon,
  focused,
  visible,
  onFocus,
  onBlur,
  onChangeText,
  onToggleVisibility,
  editable = true,
}: PasswordInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>

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
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          editable={editable}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        <Pressable
          onPress={onToggleVisibility}
          disabled={!editable}
          hitSlop={8}
          style={styles.visibilityButton}
        >
          <MaterialCommunityIcons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.darkGray}
          />
        </Pressable>
      </View>
    </View>
  );
};

/**
 * ================================================================
 * PASSWORD RULE
 * ================================================================
 */

interface PasswordRuleProps {
  valid: boolean;
  text: string;
}

const PasswordRule = ({ valid, text }: PasswordRuleProps) => {
  return (
    <View style={styles.rule}>
      <MaterialCommunityIcons
        name={valid ? "check-circle" : "circle-outline"}
        size={15}
        color={valid ? COLORS.success : COLORS.Gray}
      />

      <Text style={[styles.ruleText, valid && styles.ruleTextValid]}>
        {text}
      </Text>
    </View>
  );
};

export default SecurityScreen;

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
    marginBottom: 24,
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
  // SECURITY CARD
  // ============================================================

  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F8F1",
    borderRadius: 20,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2EBDD",
  },

  securityIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  securityCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  securityCardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.text,
  },

  securityCardText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.darkGray,
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

  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 7,
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

  visibilityButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // ============================================================
  // PASSWORD RULES
  // ============================================================

  rulesCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ECECE8",
  },

  rulesIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  rulesContent: {
    flex: 1,
    marginLeft: 11,
  },

  rulesTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 8,
  },

  rule: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  ruleText: {
    marginLeft: 7,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.darkGray,
  },

  ruleTextValid: {
    color: COLORS.success,
    fontFamily: fonts.medium,
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
