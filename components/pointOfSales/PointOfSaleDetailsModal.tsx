import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePointOfSaleStore } from "@/store/pointOfSaleStore";
import type { PointOfSale } from "@/types/pointOfSale";
import { COLORS, fonts } from "@/utils/styles";
import PointOfSaleAssignEmployeePopup from "./PointOfSaleAssignEmployeePopup";

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

  /**
   * Ferme le modal de détails.
   */
  const handleClose = () => {
    if (isUpdatingStatus) {
      return;
    }

    onClose();
  };

  /**
   * Modification du statut du point de vente.
   */
  const updateStatus = async (status: boolean) => {
    try {
      await updatePointOfSaleStatus(pointOfSale.id, status);
    } catch (error) {
      console.error("Erreur lors de la modification du statut :", error);
    }
  };

  /**
   * Active ou désactive le point de vente.
   */
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

  return (
    <>
      {/* =====================================================
          MODAL PRINCIPAL — DÉTAILS DU POINT DE VENTE
      ====================================================== */}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleClose} />

          <View style={styles.container}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* =================================================
                HEADER
            ================================================== */}

            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.headerContent}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {pointOfSale.name}
                </Text>

                <Text style={styles.headerSubtitle}>
                  Point de vente • {pointOfSale.code}
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={21}
                  color={COLORS.Gray}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* =================================================
                  STATUT
              ================================================== */}

              <View
                style={[
                  styles.statusBanner,
                  isActive
                    ? styles.statusBannerActive
                    : styles.statusBannerInactive,
                ]}
              >
                <View
                  style={[
                    styles.statusIcon,
                    isActive
                      ? styles.statusIconActive
                      : styles.statusIconInactive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      isActive ? "check-circle-outline" : "pause-circle-outline"
                    }
                    size={19}
                    color={isActive ? COLORS.primary : "#B45309"}
                  />
                </View>

                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>
                    {isActive
                      ? "Point de vente actif"
                      : "Point de vente inactif"}
                  </Text>

                  <Text style={styles.statusDescription}>
                    {isActive
                      ? "Ce point de vente est actuellement opérationnel."
                      : "Ce point de vente n'est actuellement pas opérationnel."}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  INFORMATIONS
              ================================================== */}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informations</Text>

                <View style={styles.infoCard}>
                  <InfoRow
                    icon="store-outline"
                    label="Nom"
                    value={pointOfSale.name}
                  />

                  <InfoRow
                    icon="identifier"
                    label="Code"
                    value={pointOfSale.code}
                  />

                  <InfoRow
                    icon="phone-outline"
                    label="Téléphone"
                    value={pointOfSale.telephone || "Non renseigné"}
                  />

                  <InfoRow
                    icon="map-marker-outline"
                    label="Adresse"
                    value={pointOfSale.address || "Non renseignée"}
                    isLast
                  />
                </View>
              </View>

              {/* =====================================================
                     PERSONNEL
                ====================================================== */}

              <PointOfSaleAssignEmployeePopup pointOfSale={pointOfSale} />

              {/* =================================================
                  ACTIONS
              ================================================== */}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => onEdit(pointOfSale)}
                  disabled={isUpdatingStatus}
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed && styles.pressed,
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
                    isActive
                      ? styles.statusButtonDanger
                      : styles.statusButtonSuccess,
                    pressed && styles.pressed,
                  ]}
                >
                  {isUpdatingStatus ? (
                    <ActivityIndicator
                      size="small"
                      color={isActive ? "#C0392B" : COLORS.primary}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={
                        isActive ? "store-off-outline" : "store-check-outline"
                      }
                      size={19}
                      color={isActive ? "#C0392B" : COLORS.primary}
                    />
                  )}

                  <Text
                    style={[
                      styles.statusButtonText,
                      isActive
                        ? styles.statusButtonDangerText
                        : styles.statusButtonSuccessText,
                    ]}
                  >
                    {isActive ? "Désactiver" : "Activer"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

type InfoRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
  isLast?: boolean;
};

const InfoRow = ({ icon, label, value, isLast = false }: InfoRowProps) => {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={19} color={COLORS.primary} />
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
    maxHeight: "90%",
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
    alignItems: "center",
    marginBottom: 20,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF4E7",
    marginRight: 12,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: COLORS.text,
  },

  headerSubtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.darkGray,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F3F3",
  },

  scrollContent: {
    paddingBottom: 4,
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    padding: 14,
    marginBottom: 22,
  },

  statusBannerActive: {
    backgroundColor: "#EDF7EA",
  },

  statusBannerInactive: {
    backgroundColor: "#FFF7E8",
  },

  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  statusIconActive: {
    backgroundColor: "#DCEFD7",
  },

  statusIconInactive: {
    backgroundColor: "#FDEBC8",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.text,
  },

  statusDescription: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.darkGray,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: COLORS.text,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionHeaderContent: {
    flex: 1,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.darkGray,
  },

  infoCard: {
    marginTop: 11,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 68,
    paddingVertical: 10,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF6EA",
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
    marginBottom: 3,
  },

  infoValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: COLORS.text,
  },

  staffSection: {
    marginBottom: 22,
  },

  emptyStaffCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  emptyStaffIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F3",
    marginBottom: 10,
  },

  emptyStaffTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
  },

  emptyStaffText: {
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.Gray,
    textAlign: "center",
  },

  addStaffButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 45,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    marginTop: 15,
    gap: 7,
  },

  addStaffButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: COLORS.white,
  },

  inactiveStaffText: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: "#B45309",
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
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
    fontFamily: fonts.bold,
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

  statusButtonDanger: {
    backgroundColor: "#FFF1EF",
    borderColor: "#F1D2CD",
  },

  statusButtonSuccess: {
    backgroundColor: "#EAF4E7",
    borderColor: "#D8E8D4",
  },

  statusButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  statusButtonDangerText: {
    color: "#C0392B",
  },

  statusButtonSuccessText: {
    color: COLORS.primary,
  },

  pressed: {
    opacity: 0.75,
  },
});

export default PointOfSaleDetailsModal;
