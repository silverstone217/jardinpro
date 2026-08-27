import { useUserStore } from "@/store/userStore";
// import { ENDPOINT_URL } from "@/utils/env.variables";
import { COLORS, fonts, typography } from "@/utils/styles";
import { isValidTelephone } from "@/utils/validation";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

const LoginScreen = () => {
  const router = useRouter();

  const login = useUserStore((state) => state.login);

  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [focusedField, setFocusedField] = useState<
    "telephone" | "password" | null
  >(null);

  // const [serverStatus, setServerStatus] = useState<
  //   "checking" | "online" | "offline"
  // >("checking");

  // useEffect(() => {
  //   const checkConnection = async () => {
  //     const connected = await checkServerConnection();

  //     setServerStatus(connected ? "online" : "offline");
  //   };

  //   checkConnection();
  // }, []);

  const handleTelephoneChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "");

    setTelephone(cleanedValue.slice(0, 10));

    if (error) {
      setError("");
    }
  };

  // VALIDATE FORM
  const validateForm = () => {
    if (!telephone) {
      setError("Veuillez entrer votre numéro de téléphone.");
      return false;
    }

    if (!isValidTelephone(telephone)) {
      setError("Le numéro doit contenir exactement 10 chiffres.");
      return false;
    }

    if (!password) {
      setError("Veuillez entrer votre mot de passe.");
      return false;
    }

    return true;
  };

  // SUBMIT LOGIN
  const handleLogin = async () => {
    if (loading) return;

    setError("");

    const isValid = validateForm();

    // console.log({ ENDPOINT_URL });

    if (!isValid) return;

    try {
      setLoading(true);

      await login({
        telephone,
        password,
      });

      // Le userStore est maintenant authentifié.
      // Le layout principal peut gérer la navigation.
      router.replace("/(main)");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Numéro de téléphone ou mot de passe incorrect.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* =========================
                HEADER
            ========================= */}

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

              <View style={styles.headerLogo}>
                <MaterialCommunityIcons
                  name="leaf"
                  size={17}
                  color={COLORS.primary}
                />
              </View>
            </View>

            {/* =========================
                TITLE
            ========================= */}

            <View style={styles.titleContainer}>
              <View style={styles.titleAccent} />

              <Text style={styles.title}>Bon retour 👋</Text>

              <Text style={styles.subtitle}>
                Connectez-vous à votre espace{" "}
                <Text style={styles.brandText}>Jardin Pro</Text>.
              </Text>
            </View>

            {/* =========================
                FORM
            ========================= */}

            <View style={styles.form}>
              {/* Telephone */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro de téléphone</Text>

                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "telephone" &&
                      styles.inputContainerFocused,
                    error && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={20}
                    color={
                      focusedField === "telephone"
                        ? COLORS.primary
                        : COLORS.darkGray
                    }
                  />

                  <TextInput
                    value={telephone}
                    onChangeText={handleTelephoneChange}
                    onFocus={() => setFocusedField("telephone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0812345678"
                    placeholderTextColor={COLORS.darkGray}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    style={styles.input}
                    editable={!loading}
                  />

                  {telephone.length > 0 && (
                    <Text style={styles.counter}>{telephone.length}/10</Text>
                  )}
                </View>
              </View>

              {/* Password */}

              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.label}>Mot de passe</Text>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "password" && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={
                      focusedField === "password"
                        ? COLORS.primary
                        : COLORS.darkGray
                    }
                  />

                  <TextInput
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);

                      if (error) {
                        setError("");
                      }
                    }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Votre mot de passe"
                    placeholderTextColor={COLORS.darkGray}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    editable={!loading}
                  />

                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={10}
                    style={styles.passwordButton}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={COLORS.darkGray}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Error */}

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

              {/* {serverStatus === "checking" && (
                <Text>Connexion au serveur...</Text>
              )}

              {serverStatus === "online" && <Text>Serveur connecté</Text>}

              {serverStatus === "offline" && <Text>Serveur inaccessible</Text>} */}

              {/* Forgot password */}

              <Pressable
                onPress={() => {
                  // TODO: écran mot de passe oublié
                }}
                style={({ pressed }) => ({
                  alignSelf: "flex-end",
                  marginTop: 2,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>

            {/* =========================
                LOGIN BUTTON
            ========================= */}

            <View style={styles.bottom}>
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginButton,
                  {
                    opacity: pressed || loading ? 0.85 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Se connecter</Text>

                    <View style={styles.loginIcon}>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>
                  </>
                )}
              </Pressable>

              {/* Security hint */}

              <View style={styles.securityInfo}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={16}
                  color={COLORS.success}
                />

                <Text style={styles.securityText}>Connexion sécurisée</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default LoginScreen;

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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // =========================
  // HEADER
  // =========================

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

  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#E7F0E5",
    alignItems: "center",
    justifyContent: "center",
  },

  // =========================
  // TITLE
  // =========================

  titleContainer: {
    marginTop: 34,
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
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.text,
  },

  subtitle: {
    ...typography.body,
    color: COLORS.darkGray,
    marginTop: 10,
    lineHeight: 22,
  },

  brandText: {
    fontFamily: fonts.semibold,
    color: COLORS.primary,
  },

  // =========================
  // FORM
  // =========================

  form: {
    marginTop: 38,
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    ...typography.caption,
    fontFamily: fonts.semibold,
    color: COLORS.text,
    marginBottom: 8,
  },

  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inputContainer: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
  },

  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  inputContainerError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    height: "100%",
    marginLeft: 11,

    fontFamily: fonts.medium,
    fontSize: 15,
    color: COLORS.text,
  },

  counter: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.darkGray,
  },

  passwordButton: {
    padding: 4,
  },

  // =========================
  // ERROR
  // =========================

  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",

    paddingHorizontal: 2,
    marginTop: -4,
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

  forgotPassword: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.primary,
  },

  // =========================
  // BOTTOM
  // =========================

  bottom: {
    marginTop: "auto",
    paddingTop: 40,
  },

  loginButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 8,
  },

  loginButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: COLORS.white,
  },

  loginIcon: {
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
    marginTop: 15,
  },

  securityText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.darkGray,
    marginLeft: 6,
  },
});
