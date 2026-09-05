import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  View,
} from "react-native";

import { useEmployeeStore } from "@/store/employeeStore";
import { COLORS, fonts } from "@/utils/styles";

type EmployeeFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type FormErrors = {
  name?: string;
  telephone?: string;
  email?: string;
};

const EmployeeFormModal = ({
  visible,
  onClose,
  onSuccess,
}: EmployeeFormModalProps) => {
  const createEmployee = useEmployeeStore((state) => state.createEmployee);

  const isCreating = useEmployeeStore((state) => state.isCreating);

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");

  /**
   * Réinitialise complètement le formulaire.
   */
  const resetForm = () => {
    setName("");
    setTelephone("");
    setEmail("");
    setErrors({});
    setSubmitError("");
  };

  /**
   * Fermer le modal.
   */
  const handleClose = () => {
    if (isCreating) return;

    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  /**
   * Validation locale du formulaire.
   */
  const validate = () => {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();
    const trimmedTelephone = telephone.trim();
    const trimmedEmail = email.trim();

    // Nom
    if (!trimmedName) {
      newErrors.name = "Le nom est obligatoire.";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères.";
    } else if (trimmedName.length > 30) {
      newErrors.name = "Le nom ne peut pas dépasser 30 caractères.";
    }

    // Téléphone
    if (!trimmedTelephone) {
      newErrors.telephone = "Le numéro de téléphone est obligatoire.";
    } else if (!/^0\d{9}$/.test(trimmedTelephone)) {
      newErrors.telephone =
        "Le numéro doit contenir exactement 10 chiffres et commencer par 0.";
    }

    // Email
    if (!trimmedEmail) {
      newErrors.email = "L'adresse email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "L'adresse email est invalide.";
    } else if (trimmedEmail.length > 255) {
      newErrors.email = "L'adresse email est trop longue.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /**
   * Création de l'employé.
   *
   * Le mot de passe n'est volontairement pas envoyé.
   * Le backend lui attribue automatiquement "pers01".
   */
  const handleSubmit = async () => {
    Keyboard.dismiss();
    setSubmitError("");

    if (!validate()) return;

    try {
      await createEmployee({
        name: name.trim(),
        telephone: telephone.trim(),
        email: email.trim().toLowerCase(),
      });

      resetForm();
      onClose();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur création employé :", error);

      const message = error?.response?.data?.message;

      if (error?.response?.status === 409) {
        setSubmitError(
          message || "Un employé avec ces informations existe déjà.",
        );
      } else {
        setSubmitError(
          message || "Impossible de créer l'employé. Vérifiez votre connexion.",
        );
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={handleClose} />

        {/* Modal */}
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>Nouvel employé</Text>

                <Text style={styles.subtitle}>
                  Ajoutez un membre à votre équipe
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={isCreating}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
                isCreating && styles.disabled,
              ]}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={COLORS.darkGray}
              />
            </Pressable>
          </View>

          {/* Formulaire */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Informations personnelles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>

              <Text style={styles.sectionDescription}>
                Ces informations serviront à identifier l&apos;employé.
              </Text>
            </View>

            {/* Nom */}
            <View style={styles.field}>
              <Text style={styles.label}>Nom complet</Text>

              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);

                  if (errors.name) {
                    setErrors((prev) => ({
                      ...prev,
                      name: undefined,
                    }));
                  }
                }}
                placeholder="Ex. Jean Dupont"
                placeholderTextColor={COLORS.Gray}
                style={[styles.input, errors.name && styles.inputError]}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isCreating}
                returnKeyType="next"
              />

              {errors.name && <Text style={styles.error}>{errors.name}</Text>}
            </View>

            {/* Téléphone */}
            <View style={styles.field}>
              <Text style={styles.label}>Numéro de téléphone</Text>

              <TextInput
                value={telephone}
                onChangeText={(value) => {
                  // Autorise uniquement les chiffres
                  // et limite à 10 caractères.
                  const cleaned = value.replace(/\D/g, "").slice(0, 10);

                  setTelephone(cleaned);

                  if (errors.telephone) {
                    setErrors((prev) => ({
                      ...prev,
                      telephone: undefined,
                    }));
                  }
                }}
                placeholder="Ex. 0812345678"
                placeholderTextColor={COLORS.Gray}
                style={[styles.input, errors.telephone && styles.inputError]}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isCreating}
                returnKeyType="next"
              />

              {errors.telephone && (
                <Text style={styles.error}>{errors.telephone}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);

                  if (errors.email) {
                    setErrors((prev) => ({
                      ...prev,
                      email: undefined,
                    }));
                  }
                }}
                placeholder="Ex. jean@email.com"
                placeholderTextColor={COLORS.Gray}
                style={[styles.input, errors.email && styles.inputError]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isCreating}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </View>

            {/* Information mot de passe */}
            <View style={styles.infoBox}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons
                  name="key-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Mot de passe initial</Text>

                <Text style={styles.infoText}>
                  Le mot de passe initial de l&apos;employé est{" "}
                  <Text style={styles.infoPassword}>pers01</Text>. Il devra le
                  modifier après sa première connexion.
                </Text>
              </View>
            </View>

            {/* Erreur serveur */}
            {submitError ? (
              <View style={styles.serverError}>
                <View style={styles.serverErrorIcon}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={17}
                    color={COLORS.error}
                  />
                </View>

                <Text style={styles.serverErrorText}>{submitError}</Text>
              </View>
            ) : null}

            {/* Bouton */}
            <Pressable
              onPress={handleSubmit}
              disabled={isCreating}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isCreating && styles.submitButtonPressed,
                isCreating && styles.submitButtonDisabled,
              ]}
            >
              {isCreating ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.white} />

                  <Text style={styles.submitText}>Création en cours...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={19}
                    color={COLORS.white}
                  />

                  <Text style={styles.submitText}>Ajouter l&apos;employé</Text>
                </>
              )}
            </Pressable>

            {/* Note */}
            <View style={styles.noteBox}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={15}
                color={COLORS.primary}
              />

              <Text style={styles.noteText}>
                Pour des raisons de sécurité, l&apos;employé devra modifier son
                mot de passe après sa première connexion.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EmployeeFormModal;

const styles = StyleSheet.create({
  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modalContent: {
    maxHeight: "92%",
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },

  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 17,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEDE9",
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2E5",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  closeButton: {
    width: 38,
    height: 38,
    marginLeft: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  pressed: {
    opacity: 0.6,
  },

  disabled: {
    opacity: 0.4,
  },

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  scrollView: {
    flexGrow: 0,
  },

  form: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
  },

  // --------------------------------------------------
  // SECTIONS
  // --------------------------------------------------

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.text,
  },

  sectionDescription: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.Gray,
  },

  // --------------------------------------------------
  // INPUTS
  // --------------------------------------------------

  field: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 7,
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: COLORS.text,
  },

  input: {
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#DDDED9",
    borderRadius: 14,
    backgroundColor: COLORS.white,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: COLORS.text,
  },

  inputError: {
    borderColor: COLORS.error,
    backgroundColor: "#FFF9F9",
  },

  error: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.error,
  },

  // --------------------------------------------------
  // PASSWORD INFO
  // --------------------------------------------------

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 16,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#F1F6EF",
    borderWidth: 1,
    borderColor: "#E1EBDD",
  },

  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2EEDF",
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.text,
  },

  infoText: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    lineHeight: 14,
    color: COLORS.darkGray,
  },

  infoPassword: {
    fontFamily: fonts.bold,
    color: COLORS.primary,
  },

  // --------------------------------------------------
  // SERVER ERROR
  // --------------------------------------------------

  serverError: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 16,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F8D4D4",
  },

  serverErrorIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9DADA",
  },

  serverErrorText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 16,
    color: COLORS.error,
  },

  // --------------------------------------------------
  // BUTTON
  // --------------------------------------------------

  submitButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
  },

  submitButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitText: {
    marginLeft: 8,
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: COLORS.white,
  },

  // --------------------------------------------------
  // NOTE
  // --------------------------------------------------

  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8F8F5",
  },

  noteText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    lineHeight: 14,
    color: COLORS.darkGray,
  },
});
