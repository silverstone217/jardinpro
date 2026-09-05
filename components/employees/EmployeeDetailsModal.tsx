import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEmployeeStore } from "@/store/employeeStore";
import { Employee } from "@/types/employees";
import { COLORS, fonts } from "@/utils/styles";

import EmployeeAssignmentModal from "./EmployeeAssignmentModal";
import EmployeeBanModal from "./EmployeeBanModal";

type EmployeeDetailsModalProps = {
  visible: boolean;
  employee: Employee | null;
  onClose: () => void;
  onProfilePress?: (employee: Employee) => void;
};

const EmployeeDetailsModal = ({
  visible,
  employee,
  onClose,
  onProfilePress,
}: EmployeeDetailsModalProps) => {
  const isBanning = useEmployeeStore((state) => state.isBanning);

  const [actionError, setActionError] = useState("");
  const [banModalVisible, setBanModalVisible] = useState(false);

  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);

  if (!employee) {
    return null;
  }

  /**
   * Fermer le modal principal.
   *
   * On réinitialise ici les états locaux afin que le modal
   * soit propre lors de sa prochaine ouverture.
   */
  const handleClose = () => {
    if (isBanning) {
      return;
    }

    Keyboard.dismiss();

    setActionError("");
    setBanModalVisible(false);

    onClose();
  };

  /**
   * Ouvrir le profil de l'employé.
   */
  const handleProfilePress = () => {
    if (isBanning) {
      return;
    }

    Keyboard.dismiss();

    setActionError("");

    onProfilePress?.(employee);
  };

  /**
   * Ouvrir le modal de bannissement/débannissement.
   */
  const handleBanToggle = () => {
    if (isBanning) {
      return;
    }

    setActionError("");
    setBanModalVisible(true);
  };

  /**
   * Fermer le modal de bannissement.
   */
  const handleBanModalClose = () => {
    if (isBanning) {
      return;
    }

    setBanModalVisible(false);
  };

  /**
   * Suppression volontairement désactivée.
   *
   * Cette fonctionnalité pourra être ajoutée plus tard
   * lorsque la logique métier de suppression sera définie.
   */
  const handleDeletePress = () => {
    // Désactivé volontairement.
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
        {/* OVERLAY */}
        <Pressable
          style={styles.overlay}
          onPress={handleClose}
          disabled={isBanning}
        />

        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrapper}>
                {employee.image ? (
                  <Image
                    source={{ uri: employee.image }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {employee.name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part.charAt(0).toUpperCase())
                        .join("")}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  {employee.name}
                </Text>

                <View style={styles.telephoneRow}>
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={12}
                    color={COLORS.Gray}
                  />

                  <Text style={styles.telephone}>{employee.telephone}</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={isBanning}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
                isBanning && styles.disabled,
              ]}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={COLORS.darkGray}
              />
            </Pressable>
          </View>

          {/* STATUS */}
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusBadge,
                employee.isBanned
                  ? styles.statusBadgeBanned
                  : styles.statusBadgeActive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: employee.isBanned
                      ? COLORS.error
                      : COLORS.success,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: employee.isBanned ? COLORS.error : COLORS.success,
                  },
                ]}
              >
                {employee.isBanned ? "Employé banni" : "Employé actif"}
              </Text>
            </View>
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            {/* PROFIL */}
            <Pressable
              onPress={handleProfilePress}
              disabled={isBanning}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed,
                isBanning && styles.disabled,
              ]}
            >
              <View style={[styles.actionIcon, styles.profileIcon]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={21}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Voir le profil</Text>

                <Text style={styles.actionDescription}>
                  Consulter les informations du personnel
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={COLORS.Gray}
              />
            </Pressable>

            {/* AFFECTATION */}
            <Pressable
              onPress={() => setAssignmentModalVisible(true)}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <MaterialCommunityIcons
                  name="map-marker-account-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Affectation</Text>

                <Text style={styles.actionDescription}>
                  Gérer le point de vente de cet employé
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={COLORS.Gray}
              />
            </Pressable>

            {/* BANNIR / DÉBANNIR */}
            <Pressable
              onPress={handleBanToggle}
              disabled={isBanning}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed,
                isBanning && styles.disabled,
              ]}
            >
              <View
                style={[
                  styles.actionIcon,
                  employee.isBanned ? styles.unbanIcon : styles.banIcon,
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

              <View style={styles.actionContent}>
                <Text
                  style={[
                    styles.actionTitle,
                    employee.isBanned && styles.unbanTitle,
                  ]}
                >
                  {employee.isBanned
                    ? "Débannir l'employé"
                    : "Bannir l'employé"}
                </Text>

                <Text style={styles.actionDescription}>
                  {employee.isBanned
                    ? "Autoriser à nouveau sa connexion"
                    : "Désactiver temporairement son accès"}
                </Text>
              </View>

              {isBanning ? (
                <ActivityIndicator
                  size="small"
                  color={employee.isBanned ? COLORS.success : COLORS.error}
                />
              ) : (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={21}
                  color={COLORS.Gray}
                />
              )}
            </Pressable>

            {/* SUPPRIMER */}
            <Pressable
              onPress={handleDeletePress}
              disabled
              style={[
                styles.actionButton,
                styles.deleteButton,
                styles.disabled,
              ]}
            >
              <View style={[styles.actionIcon, styles.deleteIcon]}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={21}
                  color={COLORS.Gray}
                />
              </View>

              <View style={styles.actionContent}>
                <View style={styles.deleteTitleRow}>
                  <Text style={styles.disabledTitle}>
                    Supprimer l&apos;employé
                  </Text>

                  <View style={styles.disabledBadge}>
                    <Text style={styles.disabledBadgeText}>Bientôt</Text>
                  </View>
                </View>

                <Text style={styles.disabledDescription}>
                  Cette action est actuellement désactivée
                </Text>
              </View>
            </Pressable>
          </View>

          {/* ERROR */}
          {actionError ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={17}
                color={COLORS.error}
              />

              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}

          <EmployeeAssignmentModal
            visible={assignmentModalVisible}
            employee={employee}
            onClose={() => setAssignmentModalVisible(false)}
          />

          <EmployeeBanModal
            visible={banModalVisible}
            employee={employee}
            onClose={handleBanModalClose}
          />

          {/* BAN MODAL */}
          <EmployeeBanModal
            visible={banModalVisible}
            employee={employee}
            onClose={handleBanModalClose}
          />

          {/* FOOTER */}
          <View style={styles.footer}>
            <MaterialCommunityIcons
              name="information-outline"
              size={15}
              color={COLORS.Gray}
            />

            <Text style={styles.footerText}>
              Le bannissement désactive également les affectations actives de
              cet employé.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EmployeeDetailsModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  modalContent: {
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    paddingBottom: 28,
  },

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
    minWidth: 0,
  },

  avatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 15,
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarImageText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.primary,
  },

  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2E5",
  },

  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: COLORS.primary,
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: COLORS.text,
  },

  telephoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  telephone: {
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: 10,
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
    opacity: 0.45,
  },

  statusSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },

  statusBadgeActive: {
    backgroundColor: "#EDF7EC",
  },

  statusBadgeBanned: {
    backgroundColor: "#FDECEC",
  },

  statusDot: {
    width: 7,
    height: 7,
    marginRight: 6,
    borderRadius: 4,
  },

  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },

  actions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 67,
    paddingHorizontal: 12,
    marginBottom: 9,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ECEDE9",
  },

  actionPressed: {
    opacity: 0.7,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  profileIcon: {
    backgroundColor: "#E8F2E5",
  },

  banIcon: {
    backgroundColor: "#FDECEC",
  },

  unbanIcon: {
    backgroundColor: "#EDF7EC",
  },

  deleteIcon: {
    backgroundColor: "#F2F2F0",
  },

  actionContent: {
    flex: 1,
    marginLeft: 11,
    minWidth: 0,
  },

  actionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: COLORS.text,
  },

  unbanTitle: {
    color: COLORS.success,
  },

  actionDescription: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    lineHeight: 14,
    color: COLORS.Gray,
  },

  deleteButton: {
    backgroundColor: "#F8F8F6",
  },

  disabledTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: COLORS.Gray,
  },

  disabledDescription: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: "#AAAAAA",
  },

  deleteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  disabledBadge: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#E9E9E6",
  },

  disabledBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 7.5,
    color: COLORS.Gray,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F8D4D4",
  },

  errorText: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.medium,
    fontSize: 9.5,
    lineHeight: 14,
    color: COLORS.error,
  },

  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginTop: 7,
    paddingHorizontal: 3,
  },

  footerText: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.regular,
    fontSize: 8.5,
    lineHeight: 13,
    color: COLORS.Gray,
  },
});
