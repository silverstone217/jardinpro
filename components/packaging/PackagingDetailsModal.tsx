import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePackagingStore } from "@/store/packagingStore";
import type { Packaging } from "@/types/packaging";
import { COLORS, fonts, fontSizes } from "@/utils/styles";

type PackagingDetailsModalProps = {
  visible: boolean;
  packaging: Packaging | null;
  onClose: () => void;
  onEdit: (packaging: Packaging) => void;
};

const PackagingDetailsModal = ({
  visible,
  packaging,
  onClose,
  onEdit,
}: PackagingDetailsModalProps) => {
  const activatePackaging = usePackagingStore(
    (state) => state.activatePackaging,
  );

  const deactivatePackaging = usePackagingStore(
    (state) => state.deactivatePackaging,
  );

  const isUpdating = usePackagingStore((state) => state.isUpdating);

  if (!packaging) {
    return null;
  }

  const sizeLabel =
    packaging.size === "ML_200"
      ? "200 ml"
      : packaging.size === "ML_500"
        ? "500 ml"
        : packaging.size;

  const unitLabel =
    packaging.unit === "PIECE"
      ? "Pièce"
      : packaging.unit === "GRAM"
        ? "Gramme"
        : packaging.unit === "KILOGRAM"
          ? "Kilogramme"
          : packaging.unit === "MILLILITER"
            ? "Millilitre"
            : packaging.unit === "LITER"
              ? "Litre"
              : packaging.unit;

  const handleToggleStatus = async () => {
    try {
      if (packaging.isActive) {
        await deactivatePackaging(packaging.id);
      } else {
        await activatePackaging(packaging.id);
      }

      onClose();
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
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* =========================
              HEADER
          ========================= */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="cube-outline"
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  {packaging.name}
                </Text>

                <Text style={styles.subtitle}>Détails de l&apos;emballage</Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              hitSlop={10}
              disabled={isUpdating}
            >
              <Ionicons name="close" size={22} color={COLORS.darkGray} />
            </Pressable>
          </View>

          {/* =========================
              STATUT
          ========================= */}
          <View
            style={[
              styles.statusBanner,
              packaging.isActive ? styles.activeBanner : styles.inactiveBanner,
            ]}
          >
            <Ionicons
              name={packaging.isActive ? "checkmark-circle" : "close-circle"}
              size={20}
              color={packaging.isActive ? COLORS.success : COLORS.error}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: packaging.isActive ? COLORS.success : COLORS.error,
                },
              ]}
            >
              {packaging.isActive ? "Emballage actif" : "Emballage inactif"}
            </Text>
          </View>

          {/* =========================
              INFORMATIONS
          ========================= */}
          <View style={styles.infoCard}>
            <InfoRow
              icon="pricetag-outline"
              label="Nom"
              value={packaging.name}
            />

            <View style={styles.separator} />

            <InfoRow icon="resize-outline" label="Format" value={sizeLabel} />

            <View style={styles.separator} />

            <InfoRow icon="layers-outline" label="Unité" value={unitLabel} />
          </View>

          {/* =========================
              ACTIONS
          ========================= */}
          <View style={styles.actions}>
            {/* Modifier */}
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
                isUpdating && styles.disabledButton,
              ]}
              onPress={() => onEdit(packaging)}
              disabled={isUpdating}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color={COLORS.primary}
              />

              <Text style={styles.secondaryButtonText}>Modifier</Text>
            </Pressable>

            {/* Activer / Désactiver */}
            <Pressable
              style={({ pressed }) => [
                styles.statusButton,
                packaging.isActive
                  ? styles.deactivateButton
                  : styles.activateButton,
                pressed && styles.pressed,
                isUpdating && styles.disabledButton,
              ]}
              onPress={handleToggleStatus}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons
                  name={
                    packaging.isActive
                      ? "pause-circle-outline"
                      : "checkmark-circle-outline"
                  }
                  size={19}
                  color={COLORS.white}
                />
              )}

              <Text style={styles.statusButtonText}>
                {packaging.isActive ? "Désactiver" : "Activer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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

  /* =========================
     STATUT
  ========================= */

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },

  activeBanner: {
    backgroundColor: "#EAF6EC",
  },

  inactiveBanner: {
    backgroundColor: "#FDECEC",
  },

  statusText: {
    marginLeft: 9,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
  },

  /* =========================
     INFORMATIONS
  ========================= */

  infoCard: {
    borderRadius: 18,
    backgroundColor: COLORS.neutral,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    color: COLORS.Gray,
    marginBottom: 3,
  },

  infoValue: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.lightGray,
  },

  /* =========================
     ACTIONS
  ========================= */

  actions: {
    gap: 10,
  },

  secondaryButton: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.primary,
  },

  statusButton: {
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  activateButton: {
    backgroundColor: COLORS.success,
  },

  deactivateButton: {
    backgroundColor: COLORS.error,
  },

  statusButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },

  /* =========================
     STATES
  ========================= */

  pressed: {
    opacity: 0.75,
  },

  disabledButton: {
    opacity: 0.6,
  },
});

export default PackagingDetailsModal;
