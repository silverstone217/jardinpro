import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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

import { useEmployeeStore } from "@/store/employeeStore";
import { COLORS, fonts, typography } from "@/utils/styles";

type ProfileField = "name" | "telephone" | "email";

const EmployeeProfileScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams<{
    id: string;
  }>();

  const employeeId = params.id;

  const employees = useEmployeeStore((state) => state.employees);

  const updateEmployee = useEmployeeStore((state) => state.updateEmployee);

  const updateEmployeePassword = useEmployeeStore(
    (state) => state.updateEmployeePassword,
  );

  const banEmployee = useEmployeeStore((state) => state.banEmployee);

  const unbanEmployee = useEmployeeStore((state) => state.unbanEmployee);

  const isUpdating = useEmployeeStore((state) => state.isUpdating);

  const isUpdatingPassword = useEmployeeStore(
    (state) => state.isUpdatingPassword,
  );

  const isBanning = useEmployeeStore((state) => state.isBanning);

  const employee = employees.find((item) => item.id === employeeId);

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [focusedField, setFocusedField] = useState<ProfileField | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  /*
   * ============================================================
   * INITIALISATION
   * ============================================================
   */

  useEffect(() => {
    if (!employee) return;

    setName(employee.name ?? "");
    setTelephone(employee.telephone ?? "");
    setEmail(employee.email ?? "");
  }, [employee]);

  /*
   * ============================================================
   * TELEPHONE
   * ============================================================
   */

  const handleTelephoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "");

    if (cleanedValue.length > 0 && cleanedValue[0] !== "0") {
      return;
    }

    const nextValue = cleanedValue.slice(0, 10);

    setTelephone(nextValue);
    setProfileError("");
  };

  /*
   * ============================================================
   * CHAMPS
   * ============================================================
   */

  const handleFieldChange = (field: ProfileField, value: string) => {
    if (field === "name") {
      setName(value);
    }

    if (field === "email") {
      setEmail(value);
    }

    setProfileError("");
  };

  /*
   * ============================================================
   * VALIDATION PROFIL
   * ============================================================
   */

  const validateProfile = () => {
    const cleanName = name.trim();
    const cleanTelephone = telephone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setProfileError("Veuillez entrer le nom de l'employé.");
      return false;
    }

    if (cleanName.length < 2) {
      setProfileError("Le nom doit contenir au moins 2 caractères.");
      return false;
    }

    if (!cleanTelephone) {
      setProfileError("Veuillez entrer le numéro de téléphone.");
      return false;
    }

    if (!/^0\d{9}$/.test(cleanTelephone)) {
      setProfileError(
        "Le numéro doit contenir exactement 10 chiffres et commencer par 0.",
      );
      return false;
    }

    if (!cleanEmail) {
      setProfileError("Veuillez entrer l'adresse email.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setProfileError("Veuillez entrer une adresse email valide.");
      return false;
    }

    return true;
  };

  /*
   * ============================================================
   * ENREGISTRER PROFIL
   * ============================================================
   */

  const handleSaveProfile = async () => {
    if (!employee || isUpdating || isBanning) return;

    setProfileError("");

    if (!validateProfile()) {
      return;
    }

    try {
      await updateEmployee(employee.id, {
        name: name.trim(),
        telephone: telephone.trim(),
        email: email.trim().toLowerCase(),
      });

      Alert.alert(
        "Profil mis à jour",
        "Les informations de l'employé ont été enregistrées.",
      );
    } catch (error: any) {
      console.error("Update employee profile error:", error);

      const message =
        error?.response?.data?.message ||
        "Impossible de modifier le profil de l'employé.";

      setProfileError(message);
    }
  };

  /*
   * ============================================================
   * CHANGER MOT DE PASSE
   * ============================================================
   */

  const handleChangePassword = async () => {
    if (!employee || isUpdatingPassword || isUpdating || isBanning) {
      return;
    }

    setPasswordError("");

    if (!password) {
      setPasswordError("Veuillez entrer un nouveau mot de passe.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password.length > 100) {
      setPasswordError("Le mot de passe ne peut pas dépasser 100 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      await updateEmployeePassword(employee.id, password);

      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Mot de passe modifié",
        "Le mot de passe de l'employé a été mis à jour avec succès.",
      );
    } catch (error: any) {
      console.error("Update employee password error:", error);

      const message =
        error?.response?.data?.message ||
        "Impossible de modifier le mot de passe.";

      setPasswordError(message);
    }
  };

  /*
   * ============================================================
   * BANNISSEMENT
   * ============================================================
   */

  const handleBanToggle = () => {
    if (!employee || isBanning || isUpdating) {
      return;
    }

    if (employee.isBanned) {
      Alert.alert(
        "Débannir l'employé",
        `Voulez-vous autoriser à nouveau ${employee.name} à accéder à son compte ?`,
        [
          {
            text: "Annuler",
            style: "cancel",
          },
          {
            text: "Débannir",
            onPress: async () => {
              try {
                await unbanEmployee(employee.id);

                Alert.alert(
                  "Employé débanni",
                  `${employee.name} peut maintenant accéder à son compte.`,
                );
              } catch (error: any) {
                console.error("Unban employee error:", error);

                Alert.alert(
                  "Erreur",
                  error?.response?.data?.message ||
                    "Impossible de débannir cet employé.",
                );
              }
            },
          },
        ],
      );

      return;
    }

    Alert.alert(
      "Bannir l'employé",
      `Voulez-vous vraiment bannir ${employee.name} ? Son accès sera désactivé et ses affectations actives seront arrêtées.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Bannir",
          style: "destructive",
          onPress: async () => {
            try {
              await banEmployee(employee.id);

              Alert.alert(
                "Employé banni",
                `${employee.name} n'a plus accès à son compte.`,
              );
            } catch (error: any) {
              console.error("Ban employee error:", error);

              Alert.alert(
                "Erreur",
                error?.response?.data?.message ||
                  "Impossible de bannir cet employé.",
              );
            }
          },
        },
      ],
    );
  };

  /*
   * ============================================================
   * ETAT DE CHARGEMENT / EMPLOYE INTROUVABLE
   * ============================================================
   */

  if (!employee) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="account-alert-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>Employé introuvable</Text>

            <Text style={styles.emptyText}>
              Les informations de cet employé ne sont pas disponibles.
            </Text>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.emptyButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.emptyButtonText}>Retour</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const busy = isUpdating || isUpdatingPassword || isBanning;

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
                disabled={busy}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
                  busy && styles.disabledButton,
                ]}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={21}
                  color={COLORS.text}
                />
              </Pressable>

              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Profil employé</Text>
              </View>

              <View
                style={[
                  styles.headerStatus,
                  employee.isBanned && styles.headerStatusBanned,
                ]}
              >
                <View
                  style={[
                    styles.headerStatusDot,
                    {
                      backgroundColor: employee.isBanned
                        ? COLORS.error
                        : COLORS.success,
                    },
                  ]}
                />
              </View>
            </View>

            {/* =====================================================
                TITLE
            ====================================================== */}

            <View style={styles.titleContainer}>
              <View style={styles.titleAccent} />

              <Text style={styles.title}>{employee.name}</Text>

              <Text style={styles.subtitle}>
                Gérez les informations, la sécurité et l&apos;accès de cet
                employé.
              </Text>
            </View>

            {/* =====================================================
                PROFILE CARD
            ====================================================== */}

            <View
              style={[
                styles.profileCard,
                employee.isBanned && styles.profileCardBanned,
              ]}
            >
              <View style={styles.profileTop}>
                <View style={styles.avatarWrapper}>
                  {employee.image ? (
                    <View style={styles.avatar}>
                      <Image
                        source={{ uri: employee.image }}
                        style={styles.avatarImage}
                      />
                    </View>
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarFallbackText}>
                        {getInitials(employee.name)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {employee.name}
                  </Text>

                  <Text style={styles.profileTelephone}>
                    {employee.telephone}
                  </Text>

                  <View
                    style={[
                      styles.roleBadge,
                      employee.isBanned && styles.roleBadgeBanned,
                    ]}
                  >
                    <View
                      style={[
                        styles.roleDot,
                        {
                          backgroundColor: employee.isBanned
                            ? COLORS.error
                            : COLORS.tertiary,
                        },
                      ]}
                    />

                    <Text style={styles.roleText}>EMPLOYÉ</Text>
                  </View>
                </View>
              </View>

              <View style={styles.profileStatus}>
                <MaterialCommunityIcons
                  name={
                    employee.isBanned
                      ? "account-cancel-outline"
                      : "account-check-outline"
                  }
                  size={16}
                  color={employee.isBanned ? COLORS.error : COLORS.success}
                />

                <Text
                  style={[
                    styles.profileStatusText,
                    {
                      color: employee.isBanned ? COLORS.error : COLORS.success,
                    },
                  ]}
                >
                  {employee.isBanned ? "Accès désactivé" : "Compte actif"}
                </Text>
              </View>
            </View>

            {/* =====================================================
                INFORMATIONS PERSONNELLES
            ====================================================== */}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardEyebrow}>INFORMATIONS</Text>

                  <Text style={styles.cardTitle}>
                    Informations personnelles
                  </Text>

                  <Text style={styles.cardDescription}>
                    Modifiez les informations utilisées pour identifier cet
                    employé.
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

              <EmployeeInput
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

              <EmployeeInput
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
                editable={!busy}
              />

              <EmployeeInput
                label="Adresse email"
                placeholder="employe@email.com"
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

              {profileError ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORS.error}
                  />

                  <Text style={styles.errorText}>{profileError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSaveProfile}
                disabled={busy}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && !busy && styles.pressed,
                  busy && styles.disabledButton,
                ]}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      Enregistrer les modifications
                    </Text>

                    <View style={styles.saveIcon}>
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>
                  </>
                )}
              </Pressable>
            </View>

            {/* =====================================================
                SECURITE
            ====================================================== */}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardEyebrow}>SÉCURITÉ</Text>

                  <Text style={styles.cardTitle}>Mot de passe</Text>

                  <Text style={styles.cardDescription}>
                    Définissez un nouveau mot de passe pour cet employé.
                  </Text>
                </View>

                <View style={[styles.cardIcon, styles.securityCardIcon]}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              <PasswordInput
                label="Nouveau mot de passe"
                placeholder="Minimum 6 caractères"
                value={password}
                visible={showPassword}
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordError("");
                }}
                onToggle={() => setShowPassword((value) => !value)}
                editable={!busy}
              />

              <PasswordInput
                label="Confirmer le mot de passe"
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                visible={showConfirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setPasswordError("");
                }}
                onToggle={() => setShowConfirmPassword((value) => !value)}
                editable={!busy}
              />

              {passwordError ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={18}
                    color={COLORS.error}
                  />

                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleChangePassword}
                disabled={busy}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !busy && styles.pressed,
                  busy && styles.disabledButton,
                ]}
              >
                {isUpdatingPassword ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="key-change"
                      size={19}
                      color={COLORS.primary}
                    />

                    <Text style={styles.secondaryButtonText}>
                      Modifier le mot de passe
                    </Text>
                  </>
                )}
              </Pressable>

              <View style={styles.securityInfo}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={15}
                  color={COLORS.success}
                />

                <Text style={styles.securityText}>
                  Le mot de passe actuel ne peut pas être affiché.
                </Text>
              </View>
            </View>

            {/* =====================================================
                AFFECTATION
            ====================================================== */}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardEyebrow}>ORGANISATION</Text>

                  <Text style={styles.cardTitle}>Affectation</Text>

                  <Text style={styles.cardDescription}>
                    Gérez le point de vente auquel cet employé est affecté.
                  </Text>
                </View>

                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name="map-marker-radius-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              <View style={styles.assignmentBox}>
                <View style={styles.assignmentIcon}>
                  <MaterialCommunityIcons
                    name="store-outline"
                    size={23}
                    color={COLORS.Gray}
                  />
                </View>

                <View style={styles.assignmentContent}>
                  <Text style={styles.assignmentTitle}>Point de vente</Text>

                  <Text style={styles.assignmentText}>
                    Aucun point de vente configuré
                  </Text>
                </View>

                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Bientôt</Text>
                </View>
              </View>

              <View style={styles.disabledInfo}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={14}
                  color={COLORS.Gray}
                />

                <Text style={styles.disabledInfoText}>
                  La gestion des points de vente sera disponible prochainement.
                </Text>
              </View>
            </View>

            {/* =====================================================
                ACCES / BANNISSEMENT
            ====================================================== */}

            <View
              style={[
                styles.dangerCard,
                employee.isBanned && styles.dangerCardBanned,
              ]}
            >
              <View style={styles.dangerHeader}>
                <View
                  style={[
                    styles.dangerIcon,
                    employee.isBanned && styles.dangerIconUnban,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      employee.isBanned
                        ? "account-check-outline"
                        : "account-cancel-outline"
                    }
                    size={21}
                    color={employee.isBanned ? COLORS.success : COLORS.error}
                  />
                </View>

                <View style={styles.dangerHeaderText}>
                  <Text style={styles.dangerEyebrow}>ACCÈS AU COMPTE</Text>

                  <Text
                    style={[
                      styles.dangerTitle,
                      employee.isBanned && styles.dangerTitleUnban,
                    ]}
                  >
                    {employee.isBanned ? "Employé banni" : "Bannir l'employé"}
                  </Text>
                </View>
              </View>

              <Text style={styles.dangerDescription}>
                {employee.isBanned
                  ? "Cet employé ne peut actuellement plus accéder à son compte. Vous pouvez rétablir son accès."
                  : "Le bannissement désactive l'accès de l'employé et arrête automatiquement ses affectations actives."}
              </Text>

              <Pressable
                onPress={handleBanToggle}
                disabled={busy}
                style={({ pressed }) => [
                  styles.banButton,
                  employee.isBanned && styles.unbanButton,
                  pressed && !busy && styles.pressed,
                  busy && styles.disabledButton,
                ]}
              >
                {isBanning ? (
                  <ActivityIndicator
                    size="small"
                    color={employee.isBanned ? COLORS.success : COLORS.white}
                  />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={
                        employee.isBanned
                          ? "account-check-outline"
                          : "account-cancel-outline"
                      }
                      size={19}
                      color={employee.isBanned ? COLORS.success : COLORS.white}
                    />

                    <Text
                      style={[
                        styles.banButtonText,
                        employee.isBanned && styles.unbanButtonText,
                      ]}
                    >
                      {employee.isBanned
                        ? "Débannir l'employé"
                        : "Bannir l'employé"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* =====================================================
                FOOTER
            ====================================================== */}

            <View style={styles.footer}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={16}
                color={COLORS.success}
              />

              <Text style={styles.footerText}>
                Les modifications sont enregistrées directement sur le compte de
                l&apos;employé.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

/*
 * ================================================================
 * EMPLOYEE INPUT
 * ================================================================
 */

interface EmployeeInputProps {
  label: string;
  placeholder: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "number-pad" | "email-address";
  autoCapitalize?: "none" | "sentences";
  maxLength?: number;
  counter?: boolean;
  editable?: boolean;
}

const EmployeeInput = ({
  label,
  placeholder,
  value,
  icon,
  focused,
  onFocus,
  onBlur,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  counter = false,
  editable = true,
}: EmployeeInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {counter && <Text style={styles.counter}>{value.length}/10</Text>}
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

/*
 * ================================================================
 * PASSWORD INPUT
 * ================================================================
 */

interface PasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggle: () => void;
  editable?: boolean;
}

const PasswordInput = ({
  label,
  placeholder,
  value,
  visible,
  onChangeText,
  onToggle,
  editable = true,
}: PasswordInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
        <View style={styles.inputIconContainer}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={19}
            color={COLORS.darkGray}
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
        />

        <Pressable
          onPress={onToggle}
          disabled={!editable}
          hitSlop={8}
          style={styles.passwordToggle}
        >
          <MaterialCommunityIcons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.Gray}
          />
        </Pressable>
      </View>
    </View>
  );
};

/*
 * ================================================================
 * INITIALS
 * ================================================================
 */

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export default EmployeeProfileScreen;

/*
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
    paddingBottom: 120,
  },

  /*
   * HEADER
   */

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

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.darkGray,
  },

  headerStatus: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E7F0E5",
    alignItems: "center",
    justifyContent: "center",
  },

  headerStatusBanned: {
    backgroundColor: "#FDECEC",
  },

  headerStatusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  /*
   * TITLE
   */

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
    fontSize: 29,
    lineHeight: 37,
    color: COLORS.text,
  },

  subtitle: {
    ...typography.body,
    color: COLORS.darkGray,
    marginTop: 9,
    lineHeight: 21,
  },

  /*
   * PROFILE CARD
   */

  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },

  profileCardBanned: {
    backgroundColor: "#6D3838",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    backgroundColor: COLORS.lightGray,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },

  avatarFallbackText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: COLORS.primary,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
  },

  profileName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: COLORS.white,
  },

  profileTelephone: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: "#DDE8DA",
  },

  roleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    height: 27,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  roleBadgeBanned: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  roleText: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: COLORS.white,
  },

  profileStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },

  profileStatusText: {
    marginLeft: 7,
    fontFamily: fonts.medium,
    fontSize: 10.5,
  },

  /*
   * CARD
   */

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
    fontSize: 9.5,
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
    fontSize: 11,
    lineHeight: 17,
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

  securityCardIcon: {
    backgroundColor: "#EDF2F8",
  },

  /*
   * INPUTS
   */

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
    fontSize: 11.5,
    color: COLORS.text,
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
    opacity: 0.55,
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
    fontSize: 13.5,
    color: COLORS.text,
  },

  passwordToggle: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * ERROR
   */

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 1,
    marginBottom: 14,
    paddingHorizontal: 3,
  },

  errorText: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.error,
  },

  /*
   * SAVE BUTTON
   */

  saveButton: {
    minHeight: 54,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  saveButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: COLORS.white,
  },

  saveIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 11,
  },

  /*
   * SECONDARY BUTTON
   */

  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#F1F6EF",
    borderWidth: 1,
    borderColor: "#DCE8D9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    marginLeft: 8,
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: COLORS.primary,
  },

  /*
   * SECURITY INFO
   */

  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },

  securityText: {
    marginLeft: 6,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: COLORS.darkGray,
  },

  /*
   * ASSIGNMENT
   */

  assignmentBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#F7F7F4",
    borderWidth: 1,
    borderColor: "#E9E9E5",
    opacity: 0.75,
  },

  assignmentIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#EDEDE9",
    alignItems: "center",
    justifyContent: "center",
  },

  assignmentContent: {
    flex: 1,
    marginLeft: 11,
  },

  assignmentTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: COLORS.darkGray,
  },

  assignmentText: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: COLORS.Gray,
  },

  comingSoonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#E8E8E4",
  },

  comingSoonText: {
    fontFamily: fonts.semibold,
    fontSize: 7.5,
    color: COLORS.Gray,
  },

  disabledInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 11,
    paddingHorizontal: 2,
  },

  disabledInfoText: {
    flex: 1,
    marginLeft: 6,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  /*
   * DANGER / BAN
   */

  dangerCard: {
    backgroundColor: "#FFF8F8",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F2DADA",
  },

  dangerCardBanned: {
    backgroundColor: "#F4FAF2",
    borderColor: "#DDEBD9",
  },

  dangerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  dangerIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },

  dangerIconUnban: {
    backgroundColor: "#E8F2E5",
  },

  dangerHeaderText: {
    flex: 1,
    marginLeft: 11,
  },

  dangerEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: COLORS.Gray,
  },

  dangerTitle: {
    marginTop: 3,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: COLORS.error,
  },

  dangerTitleUnban: {
    color: COLORS.success,
  },

  dangerDescription: {
    marginTop: 13,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.darkGray,
  },

  banButton: {
    minHeight: 50,
    marginTop: 15,
    borderRadius: 15,
    backgroundColor: COLORS.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  unbanButton: {
    backgroundColor: "#E8F2E5",
    borderWidth: 1,
    borderColor: "#D5E5D1",
  },

  banButtonText: {
    marginLeft: 8,
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: COLORS.white,
  },

  unbanButtonText: {
    color: COLORS.success,
  },

  /*
   * FOOTER
   */

  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginTop: 2,
  },

  footerText: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  /*
   * EMPTY
   */

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

  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.white,
  },

  /*
   * STATES
   */

  pressed: {
    opacity: 0.65,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
