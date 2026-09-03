import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useEmployeeStore } from "@/store/employeeStore";
import { Employee } from "@/types/employees";
import { COLORS, fonts } from "@/utils/styles";

type EmployeeBanModalProps = {
  visible: boolean;
  employee: Employee | null;
  onClose: () => void;
};

const EmployeeBanModal = ({
  visible,
  employee,
  onClose,
}: EmployeeBanModalProps) => {
  const banEmployee = useEmployeeStore((state) => state.banEmployee);
  const unbanEmployee = useEmployeeStore((state) => state.unbanEmployee);
  const isBanning = useEmployeeStore((state) => state.isBanning);

  const [banReason, setBanReason] = useState("");

  const isBanned = employee?.isBanned ?? false;

  useEffect(() => {
    if (visible) {
      setBanReason(employee?.banReason ?? "");
    }
  }, [visible, employee]);

  if (!employee) {
    return null;
  }

  const handleBan = async () => {
    try {
      await banEmployee(employee.id, banReason.trim() || undefined);

      onClose();
    } catch (error) {
      console.error("Erreur lors du bannissement :", error);
    }
  };

  const handleUnban = async () => {
    try {
      await unbanEmployee(employee.id);

      onClose();
    } catch (error) {
      console.error("Erreur lors du débannissement :", error);
    }
  };

  const handleConfirm = () => {
    if (isBanned) {
      handleUnban();
    } else {
      handleBan();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <View style={styles.header}>
            <View
              style={[
                styles.headerIcon,
                isBanned ? styles.headerIconUnban : styles.headerIconBan,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  isBanned ? "account-check-outline" : "account-cancel-outline"
                }
                size={25}
                color={isBanned ? COLORS.success : COLORS.error}
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isBanned ? "Débannir l'employé" : "Bannir l'employé"}
              </Text>

              <Text style={styles.subtitle}>{employee.name}</Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isBanning}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closePressed,
              ]}
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={COLORS.darkGray}
              />
            </Pressable>
          </View>

          {/* ================================================== */}
          {/* CONTENT */}
          {/* ================================================== */}

          <View style={styles.content}>
            {isBanned ? (
              <>
                <View style={styles.statusBox}>
                  <View style={styles.statusIcon}>
                    <MaterialCommunityIcons
                      name="account-lock-outline"
                      size={22}
                      color={COLORS.error}
                    />
                  </View>

                  <View style={styles.statusContent}>
                    <Text style={styles.statusTitle}>
                      Compte actuellement banni
                    </Text>

                    <Text style={styles.statusDescription}>
                      Cet employé ne peut plus se connecter à
                      l&apos;application.
                    </Text>
                  </View>
                </View>

                {employee.banReason ? (
                  <View style={styles.reasonDisplay}>
                    <View style={styles.reasonHeader}>
                      <MaterialCommunityIcons
                        name="text-box-outline"
                        size={18}
                        color={COLORS.darkGray}
                      />

                      <Text style={styles.reasonLabel}>
                        Motif du bannissement
                      </Text>
                    </View>

                    <Text style={styles.reasonText}>{employee.banReason}</Text>
                  </View>
                ) : null}

                <View style={styles.infoBox}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={18}
                    color={COLORS.info}
                  />

                  <Text style={styles.infoText}>
                    Le débannissement permettra à nouveau à cet employé de se
                    connecter à son compte.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.warningBox}>
                  <View style={styles.warningIcon}>
                    <MaterialCommunityIcons
                      name="alert-outline"
                      size={22}
                      color={COLORS.error}
                    />
                  </View>

                  <View style={styles.warningContent}>
                    <Text style={styles.warningTitle}>
                      Désactiver l&apos;accès
                    </Text>

                    <Text style={styles.warningDescription}>
                      L&apos;employé ne pourra plus se connecter à
                      l&apos;application tant qu&apos;il sera banni.
                    </Text>
                  </View>
                </View>

                {/* ========================================== */}
                {/* BAN REASON */}
                {/* ========================================== */}

                <View style={styles.inputSection}>
                  <View style={styles.inputLabelRow}>
                    <MaterialCommunityIcons
                      name="text-box-outline"
                      size={18}
                      color={COLORS.darkGray}
                    />

                    <Text style={styles.inputLabel}>Motif du bannissement</Text>

                    <Text style={styles.optional}>Optionnel</Text>
                  </View>

                  <TextInput
                    value={banReason}
                    onChangeText={setBanReason}
                    placeholder="Ex. Absences répétées, comportement..."
                    placeholderTextColor={COLORS.Gray}
                    multiline
                    numberOfLines={4}
                    maxLength={255}
                    textAlignVertical="top"
                    editable={!isBanning}
                    style={[
                      styles.textInput,
                      isBanning && styles.disabledInput,
                    ]}
                  />

                  <Text style={styles.characterCount}>
                    {banReason.length}/255
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ================================================== */}
          {/* ACTIONS */}
          {/* ================================================== */}

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              disabled={isBanning}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelPressed,
                isBanning && styles.disabled,
              ]}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={isBanning}
              style={({ pressed }) => [
                styles.confirmButton,
                isBanned ? styles.unbanButton : styles.banButton,
                pressed && styles.confirmPressed,
                isBanning && styles.disabled,
              ]}
            >
              {isBanning ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <MaterialCommunityIcons
                  name={
                    isBanned
                      ? "account-check-outline"
                      : "account-cancel-outline"
                  }
                  size={19}
                  color={COLORS.white}
                />
              )}

              <Text style={styles.confirmText}>
                {isBanned ? "Débannir" : "Bannir l'employé"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EmployeeBanModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
  },

  container: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  headerIconBan: {
    backgroundColor: "rgba(244, 67, 54, 0.10)",
  },

  headerIconUnban: {
    backgroundColor: "rgba(76, 175, 80, 0.10)",
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: COLORS.Gray,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  closePressed: {
    opacity: 0.7,
  },

  // ============================================================
  // CONTENT
  // ============================================================

  content: {
    padding: 20,
  },

  warningBox: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(244, 67, 54, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.15)",
    marginBottom: 22,
  },

  warningIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 67, 54, 0.10)",
    marginRight: 12,
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 4,
  },

  warningDescription: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORS.darkGray,
  },

  statusBox: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(244, 67, 54, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.15)",
    marginBottom: 16,
  },

  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 67, 54, 0.10)",
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.error,
    marginBottom: 4,
  },

  statusDescription: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORS.darkGray,
  },

  // ============================================================
  // REASON
  // ============================================================

  inputSection: {
    marginTop: 2,
  },

  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  inputLabel: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: COLORS.text,
  },

  optional: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  textInput: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },

  disabledInput: {
    opacity: 0.6,
  },

  characterCount: {
    textAlign: "right",
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: COLORS.Gray,
  },

  reasonDisplay: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    marginBottom: 15,
  },

  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  reasonLabel: {
    marginLeft: 7,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.darkGray,
  },

  reasonText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.text,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(33, 150, 243, 0.07)",
  },

  infoText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 18,
    color: COLORS.darkGray,
  },

  // ============================================================
  // FOOTER
  // ============================================================

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  cancelPressed: {
    opacity: 0.7,
  },

  cancelText: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: COLORS.darkGray,
  },

  confirmButton: {
    flex: 1.25,
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  banButton: {
    backgroundColor: COLORS.error,
  },

  unbanButton: {
    backgroundColor: COLORS.success,
  },

  confirmPressed: {
    opacity: 0.82,
  },

  confirmText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: COLORS.white,
  },

  disabled: {
    opacity: 0.55,
  },
});
