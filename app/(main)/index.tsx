import { useUserStore } from "@/store/userStore";
import { COLORS, fonts, fontSizes, typography } from "@/utils/styles";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();

  const logUser = useUserStore((s) => s.logout);

  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const firstName = user.name.trim().split(" ")[0];

  const handleLogout = async () => {
    try {
      setLoading(true);

      await logUser();

      // setTimeout(() => router.replace("/auth"), 2200);
    } catch (error) {
      Alert.alert("Oops! Erreur", "Impossible de vous deconnecter");
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* GREETINGS */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>

            <Text style={styles.subtitle}>
              Prête pour une nouvelle journée fruitée ?
            </Text>
          </View>

          {/* USER AVATAR */}
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/settings")}
          >
            {user.image ? (
              // Si tu as déjà un composant Avatar,

              // tu peux le remplacer ici.
              <View style={styles.avatarFallback}>
                <Image
                  source={{ uri: user.image }}
                  style={{ width: 46, height: 46, borderRadius: 23 }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <Text style={styles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            )}
          </Pressable>
        </View>

        {/* NEW BUTTON */}
        <Pressable
          onPress={handleLogout}
          style={{
            padding: 20,
            backgroundColor: COLORS.error,
            marginTop: 20,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
          }}
        >
          <Text
            style={[
              typography.bodyMedium,
              { fontSize: 14, color: COLORS.neutral },
            ]}
          >
            {loading ? "En cours..." : "Deconnexion"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // HEADER
  headerGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerSubGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // LOGO
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#E7F0E5",
    alignItems: "center",
    justifyContent: "center",
  },

  // GREETING
  /* HEADER */

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  greetingContainer: {
    flex: 1,
    gap: 4,
  },

  greeting: {
    marginTop: 20,
    fontFamily: fonts.light,
    fontSize: fontSizes.lessoverlarge,
    color: COLORS.text,
    textTransform: "capitalize",
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
    lineHeight: fontSizes.small * 1.4,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.background,
  },
});
