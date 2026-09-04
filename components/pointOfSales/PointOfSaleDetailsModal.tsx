import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PointOfSale } from "@/types/pointOfSale";

import { usePointOfSaleStore } from "@/store/pointOfSaleStore";
import { COLORS, fonts } from "@/utils/styles";

type PointOfSaleDetailsModalProps = {
  visible: boolean;
  pointOfSale: PointOfSale | null;
  onClose: () => void;
  onEdit: (pointOfSale: PointOfSale) => void;
};

const PointOfSaleDetailsModal = ({
  visible,
  pointOfSale,
  onClose,
  onEdit,
}: PointOfSaleDetailsModalProps) => {
  const { updatePointOfSaleStatus, isUpdatingStatus } = usePointOfSaleStore();

  if (!pointOfSale) {
    return null;
  }

  const isActive = pointOfSale.isActive;

  //   const handleToggleStatus = async () => {
  //     try {
  //       await updatePointOfSaleStatus(pointOfSale.id, !isActive);
  //     } catch (error) {
  //       console.error("Erreur lors de la modification du statut :", error);
  //     }
  //   };

  const handleToggleStatus = () => {
    if (!isActive) {
      updateStatus(true);
      return;
    }

    Alert.alert(
      "Désactiver le point de vente ?",
      `Le point de vente « ${pointOfSale.name} » ne sera plus opérationnel. Vous pourrez le réactiver à tout moment.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: () => updateStatus(false),
        },
      ],
    );
  };

  const updateStatus = async (status: boolean) => {
    try {
      await updatePointOfSaleStatus(pointOfSale.id, status);
    } catch (error) {
      console.error("Erreur lors de la modification du statut :", error);
    }
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.titleSection}>
              <View
                style={[
                  styles.iconContainer,
                  !isActive && styles.inactiveIconContainer,
                ]}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={27}
                  color={isActive ? COLORS.primary : COLORS.Gray}
                />
              </View>

              <View style={styles.titleContent}>
                <Text style={styles.title} numberOfLines={2}>
                  {pointOfSale.name}
                </Text>

                <View style={styles.codeRow}>
                  <MaterialCommunityIcons
                    name="tag-outline"
                    size={14}
                    color={COLORS.Gray}
                  />

                  <Text style={styles.code}>{pointOfSale.code}</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={10}
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={COLORS.darkGray}
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.statusBanner,
              isActive ? styles.activeBanner : styles.inactiveBanner,
            ]}
          >
            <View
              style={[
                styles.statusIcon,
                isActive ? styles.activeStatusIcon : styles.inactiveStatusIcon,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  isActive ? "check-circle-outline" : "pause-circle-outline"
                }
                size={19}
                color={isActive ? COLORS.success : COLORS.Gray}
              />
            </View>

            <View style={styles.statusContent}>
              <Text
                style={[
                  styles.statusTitle,
                  isActive
                    ? styles.activeStatusText
                    : styles.inactiveStatusText,
                ]}
              >
                {isActive ? "Point de vente actif" : "Point de vente inactif"}
              </Text>

              <Text style={styles.statusDescription}>
                {isActive
                  ? "Ce point de vente est actuellement opérationnel."
                  : "Ce point de vente n'est actuellement pas opérationnel."}
              </Text>
            </View>
          </View>

          <View style={styles.informationSection}>
            <Text style={styles.sectionTitle}>Informations</Text>

            <InfoRow
              icon="store-outline"
              label="Nom"
              value={pointOfSale.name}
            />

            <InfoRow icon="tag-outline" label="Code" value={pointOfSale.code} />

            <InfoRow
              icon="phone-outline"
              label="Téléphone"
              value={pointOfSale.telephone ?? "Non renseigné"}
            />

            <InfoRow
              icon="map-marker-outline"
              label="Adresse"
              value={pointOfSale.address ?? "Non renseignée"}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => onEdit(pointOfSale)}
              disabled={isUpdatingStatus}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={19}
                color={COLORS.primary}
              />

              <Text style={styles.editButtonText}>Modifier</Text>
            </Pressable>

            <Pressable
              onPress={handleToggleStatus}
              disabled={isUpdatingStatus}
              style={({ pressed }) => [
                styles.statusButton,
                isActive ? styles.deactivateButton : styles.activateButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator
                  size="small"
                  color={isActive ? COLORS.error : COLORS.success}
                />
              ) : (
                <MaterialCommunityIcons
                  name={isActive ? "store-off-outline" : "store-check-outline"}
                  size={19}
                  color={isActive ? COLORS.error : COLORS.success}
                />
              )}

              <Text
                style={[
                  styles.statusButtonText,
                  isActive ? styles.deactivateText : styles.activateText,
                ]}
              >
                {isActive ? "Désactiver" : "Activer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

type InfoRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={COLORS.Gray} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
};

export default PointOfSaleDetailsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  container: {
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },

  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    marginBottom: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  titleSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: "#EAF4E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  inactiveIconContainer: {
    backgroundColor: "#EEEEEE",
  },

  titleContent: {
    flex: 1,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 19,
    color: COLORS.text,
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  code: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: COLORS.Gray,
    letterSpacing: 0.4,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 13,
    marginTop: 20,
  },

  activeBanner: {
    backgroundColor: "#EDF8ED",
  },

  inactiveBanner: {
    backgroundColor: "#F1F1F1",
  },

  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  activeStatusIcon: {
    backgroundColor: "#DDF0DD",
  },

  inactiveStatusIcon: {
    backgroundColor: "#E4E4E4",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },

  activeStatusText: {
    color: COLORS.success,
  },

  inactiveStatusText: {
    color: COLORS.darkGray,
  },

  statusDescription: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
    marginTop: 3,
    lineHeight: 16,
  },

  informationSection: {
    marginTop: 22,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 7,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
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
    fontSize: 10,
    color: COLORS.Gray,
  },

  infoValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  editButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#EAF4E7",
    borderWidth: 1,
    borderColor: "#D8E8D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  editButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.primary,
  },

  statusButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deactivateButton: {
    backgroundColor: "#FFF0F0",
    borderColor: "#F5D8D8",
  },

  activateButton: {
    backgroundColor: "#EDF8ED",
    borderColor: "#D8EAD8",
  },

  statusButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },

  deactivateText: {
    color: COLORS.error,
  },

  activateText: {
    color: COLORS.success,
  },

  buttonPressed: {
    opacity: 0.72,
  },
});
