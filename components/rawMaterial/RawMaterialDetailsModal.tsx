import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRawMaterialStore } from "@/store/rawMaterialStore";
import type {
  RawMaterialUnit,
  RawMaterialWithStock,
} from "@/types/rawMaterial";
import { COLORS, fontSizes, fonts } from "@/utils/styles";

type RawMaterialDetailsModalProps = {
  visible: boolean;
  rawMaterial: RawMaterialWithStock | null;
  stockQuantity: number;
  onClose: () => void;
  onEdit: (rawMaterial: RawMaterialWithStock) => void;
};

const UNIT_LABELS: Record<RawMaterialUnit, string> = {
  PIECE: "Pièce(s)",
  GRAM: "Gramme(s)",
  KILOGRAM: "Kilogramme(s)",
  MILLILITER: "Millilitre(s)",
  LITER: "Litre(s)",
};

const UNIT_SHORT_LABELS: Record<RawMaterialUnit, string> = {
  PIECE: "pièce(s)",
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "L",
};

const formatQuantity = (quantity: number | null | undefined): string => {
  const value = Number(quantity ?? 0);

  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
};

const RawMaterialDetailsModal = ({
  visible,
  rawMaterial,
  stockQuantity,
  onClose,
  onEdit,
}: RawMaterialDetailsModalProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const updateRawMaterial = useRawMaterialStore(
    (state) => state.updateRawMaterial,
  );

  if (!rawMaterial) {
    return null;
  }

  const unitLabel = UNIT_LABELS[rawMaterial.unit];
  const unitShortLabel = UNIT_SHORT_LABELS[rawMaterial.unit];

  const isLowStock =
    rawMaterial.minStock !== null &&
    stockQuantity <= Number(rawMaterial.minStock);

  const handleToggleStatus = async () => {
    if (isUpdatingStatus) {
      return;
    }

    try {
      setIsUpdatingStatus(true);

      await updateRawMaterial(rawMaterial.id, {
        isActive: !rawMaterial.isActive,
      });
    } catch {
      // L'erreur est déjà gérée par le store.
    } finally {
      setIsUpdatingStatus(false);
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
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="leaf-outline"
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {rawMaterial.name}
                </Text>

                <Text style={styles.subtitle}>
                  Détails de la matière première
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={22} color={COLORS.darkGray} />
            </Pressable>
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            {/* Statut */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  rawMaterial.isActive
                    ? styles.activeBadge
                    : styles.inactiveBadge,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    rawMaterial.isActive
                      ? styles.activeDot
                      : styles.inactiveDot,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    rawMaterial.isActive
                      ? styles.activeText
                      : styles.inactiveText,
                  ]}
                >
                  {rawMaterial.isActive ? "Matière active" : "Matière inactive"}
                </Text>
              </View>
            </View>

            {/* Stock */}
            <View style={[styles.stockCard, isLowStock && styles.stockCardLow]}>
              <View style={styles.stockIconContainer}>
                <Ionicons
                  name={isLowStock ? "warning-outline" : "cube-outline"}
                  size={24}
                  color={isLowStock ? COLORS.error : COLORS.primary}
                />
              </View>

              <View style={styles.stockInfo}>
                <Text style={styles.stockLabel}>Stock actuel</Text>

                <View style={styles.stockValueRow}>
                  <Text
                    style={[
                      styles.stockValue,
                      isLowStock && styles.stockValueLow,
                    ]}
                  >
                    {formatQuantity(stockQuantity)}
                  </Text>

                  <Text
                    style={[
                      styles.stockUnit,
                      isLowStock && styles.stockValueLow,
                    ]}
                  >
                    {unitShortLabel}
                  </Text>
                </View>
              </View>

              {isLowStock && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningText}>Stock faible</Text>
                </View>
              )}
            </View>

            {/* Informations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations</Text>

              <View style={styles.infoCard}>
                {/* Nom */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="text-outline"
                      size={18}
                      color={COLORS.Gray}
                    />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Nom</Text>

                    <Text style={styles.infoValue}>{rawMaterial.name}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                {/* Unité */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="scale-outline"
                      size={18}
                      color={COLORS.Gray}
                    />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Unité de mesure</Text>

                    <Text style={styles.infoValue}>{unitLabel}</Text>
                  </View>
                </View>

                <View style={styles.separator} />

                {/* Seuil minimum */}
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color={COLORS.Gray}
                    />
                  </View>

                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Seuil minimum</Text>

                    <Text style={styles.infoValue}>
                      {rawMaterial.minStock !== null
                        ? `${formatQuantity(
                            rawMaterial.minStock,
                          )} ${unitShortLabel}`
                        : "Non défini"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Modifier */}
              <Pressable
                onPress={() => onEdit(rawMaterial)}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={19}
                  color={COLORS.white}
                />

                <Text style={styles.editButtonText}>Modifier</Text>
              </Pressable>

              {/* Activer / Désactiver */}
              <Pressable
                onPress={handleToggleStatus}
                disabled={isUpdatingStatus}
                style={({ pressed }) => [
                  styles.statusButton,
                  rawMaterial.isActive
                    ? styles.deactivateButton
                    : styles.activateButton,
                  pressed && styles.buttonPressed,
                  isUpdatingStatus && styles.disabledButton,
                ]}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons
                    name={
                      rawMaterial.isActive
                        ? "pause-circle-outline"
                        : "checkmark-circle-outline"
                    }
                    size={19}
                    color={COLORS.white}
                  />
                )}

                <Text style={styles.statusButtonText}>
                  {rawMaterial.isActive ? "Désactiver" : "Activer"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RawMaterialDetailsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
    maxHeight: "90%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EAF3E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.large,
    color: COLORS.text,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    marginTop: 2,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.7,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  statusRow: {
    marginBottom: 16,
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  activeBadge: {
    backgroundColor: "#EAF6EA",
  },

  inactiveBadge: {
    backgroundColor: "#F1F1F1",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.Gray,
  },

  statusText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.darkGray,
  },

  stockCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F3F8F1",
    borderWidth: 1,
    borderColor: "#DCEAD8",
    marginBottom: 22,
  },

  stockCardLow: {
    backgroundColor: "#FFF5F5",
    borderColor: "#F5D5D5",
  },

  stockIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  stockInfo: {
    flex: 1,
  },

  stockLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    marginBottom: 2,
  },

  stockValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  stockValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xlarge,
    color: COLORS.primary,
  },

  stockUnit: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.primary,
    marginLeft: 5,
  },

  stockValueLow: {
    color: COLORS.error,
  },

  warningBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FDECEC",
  },

  warningText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.error,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
    marginBottom: 2,
  },

  infoValue: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.lightGray,
  },

  actions: {
    gap: 10,
  },

  editButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.white,
  },

  statusButton: {
    height: 48,
    borderRadius: 14,
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
    fontSize: fontSizes.medium,
    color: COLORS.white,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
