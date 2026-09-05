import { useStaffAssignmentStore } from "@/store/staffAssignmentStore";
import { Employee } from "@/types/employees";
import { PointOfSaleWithAssignments } from "@/types/staffAssignment";
import { COLORS, fonts } from "@/utils/styles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type EmployeeAssignmentModalProps = {
  visible: boolean;
  employee: Employee | null;
  onClose: () => void;
};

const EmployeeAssignmentModal = ({
  visible,
  employee,
  onClose,
}: EmployeeAssignmentModalProps) => {
  const fetchStaffAssignments = useStaffAssignmentStore(
    (state) => state.fetchStaffAssignments,
  );

  const getEmployeeAssignment = useStaffAssignmentStore(
    (state) => state.getEmployeeAssignment,
  );

  const assignEmployee = useStaffAssignmentStore(
    (state) => state.assignEmployee,
  );

  const unassignEmployee = useStaffAssignmentStore(
    (state) => state.unassignEmployee,
  );

  const [assignment, setAssignment] =
    useState<Awaited<ReturnType<typeof getEmployeeAssignment>>>(null);

  const [availablePointsOfSale, setAvailablePointsOfSale] = useState<
    PointOfSaleWithAssignments[]
  >([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);

  const [showAvailablePoints, setShowAvailablePoints] = useState(false);
  const [error, setError] = useState("");

  if (!employee) {
    return null;
  }

  /**
   * Charge l'affectation actuelle de l'employé
   * ainsi que les points de vente libres.
   */
  const loadAssignmentData = async () => {
    if (!employee) return;

    setIsLoadingData(true);
    setError("");

    try {
      await fetchStaffAssignments();

      const currentAssignment = await getEmployeeAssignment(employee.id);

      setAssignment(currentAssignment);

      const pointsOfSale = useStaffAssignmentStore.getState().pointsOfSale;

      /**
       * Un POS est considéré comme libre lorsqu'il
       * n'a aucune affectation active.
       */
      const freePointsOfSale = pointsOfSale.filter(
        (pointOfSale) =>
          pointOfSale.isActive && pointOfSale.assignments.length === 0,
      );

      setAvailablePointsOfSale(freePointsOfSale);
    } catch (error) {
      console.error("Erreur lors du chargement de l'affectation :", error);

      setError("Impossible de charger les informations d'affectation.");
    } finally {
      setIsLoadingData(false);
    }
  };

  /**
   * Affecter l'employé à un point de vente.
   */
  const handleAssign = async (pointOfSale: PointOfSaleWithAssignments) => {
    if (isAssigning || isUnassigning) return;

    setIsAssigning(true);
    setError("");

    try {
      const newAssignment = await assignEmployee(employee.id, pointOfSale.id);

      setAssignment(newAssignment);

      /**
       * Le POS vient maintenant d'être occupé.
       * On le retire donc de la liste des POS disponibles.
       */
      setAvailablePointsOfSale((current) =>
        current.filter(
          (existingPointOfSale) => existingPointOfSale.id !== pointOfSale.id,
        ),
      );

      setShowAvailablePoints(false);
    } catch (error: any) {
      console.error("Erreur lors de l'affectation :", error);

      /**
       * 409 = l'employé possède déjà une affectation active.
       */
      if (error?.response?.status === 409 && assignment) {
        setError(
          `Ce personnel est déjà affecté à « ${assignment.pointOfSale.name} ». Désaffectez-le d'abord avant de l'affecter à un autre point de vente.`,
        );
        return;
      }

      /**
       * Pour les autres erreurs, on utilise le message
       * envoyé par le backend s'il existe.
       */
      setError(
        error?.response?.data?.message ??
          "Une erreur est survenue lors de l'affectation.",
      );
    } finally {
      setIsAssigning(false);
    }
  };

  /**
   * Retirer l'affectation actuelle.
   */
  const handleUnassign = async () => {
    if (isUnassigning || isAssigning) return;

    setIsUnassigning(true);
    setError("");

    try {
      await unassignEmployee(employee.id);

      setAssignment(null);

      /**
       * Recharge les POS afin que le POS
       * qui vient d'être libéré apparaisse.
       */
      await fetchStaffAssignments();

      const pointsOfSale = useStaffAssignmentStore.getState().pointsOfSale;

      const freePointsOfSale = pointsOfSale.filter(
        (pointOfSale) =>
          pointOfSale.isActive && pointOfSale.assignments.length === 0,
      );

      setAvailablePointsOfSale(freePointsOfSale);
    } catch (error: any) {
      console.error("Erreur lors du retrait de l'affectation :", error);

      if (error?.response?.data?.code === "ACTIVE_ASSIGNMENT_NOT_FOUND") {
        setAssignment(null);
        setError("Cet employé n'a actuellement aucune affectation.");
      } else {
        setError("Impossible de retirer l'affectation.");
      }
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleClose = () => {
    if (isAssigning || isUnassigning) return;

    setShowAvailablePoints(false);
    setError("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={loadAssignmentData}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.container}>
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons
                name="map-marker-account-outline"
                size={25}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>Affectation</Text>

              <Text style={styles.subtitle} numberOfLines={1}>
                {employee.name}
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={isAssigning || isUnassigning}
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {isLoadingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />

                <Text style={styles.loadingText}>
                  Chargement de l&apos;affectation...
                </Text>
              </View>
            ) : (
              <>
                {/* ========================================== */}
                {/* CURRENT ASSIGNMENT */}
                {/* ========================================== */}

                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={18}
                      color={COLORS.darkGray}
                    />

                    <Text style={styles.sectionTitle}>
                      Point de vente actuel
                    </Text>
                  </View>
                </View>

                {assignment ? (
                  <View style={styles.assignmentCard}>
                    <View style={styles.assignmentIcon}>
                      <MaterialCommunityIcons
                        name="store-marker-outline"
                        size={23}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.assignmentContent}>
                      <Text style={styles.assignmentName}>
                        {assignment.pointOfSale.name}
                      </Text>

                      <View style={styles.codeRow}>
                        <MaterialCommunityIcons
                          name="tag-outline"
                          size={13}
                          color={COLORS.Gray}
                        />

                        <Text style={styles.assignmentCode}>
                          {assignment.pointOfSale.code}
                        </Text>
                      </View>

                      <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />

                        <Text style={styles.activeBadgeText}>
                          Affectation active
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyAssignmentBox}>
                    <View style={styles.emptyIcon}>
                      <MaterialCommunityIcons
                        name="map-marker-off-outline"
                        size={23}
                        color={COLORS.Gray}
                      />
                    </View>

                    <View style={styles.emptyContent}>
                      <Text style={styles.emptyTitle}>Aucune affectation</Text>

                      <Text style={styles.emptyDescription}>
                        Cet employé n&apos;est actuellement affecté à aucun
                        point de vente.
                      </Text>
                    </View>
                  </View>
                )}

                {/* ========================================== */}
                {/* ACTION */}
                {/* ========================================== */}

                {assignment ? (
                  <>
                    <View style={styles.infoBox}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={18}
                        color={COLORS.info}
                      />

                      <Text style={styles.infoText}>
                        Un employé ne peut avoir qu&apos;une seule affectation
                        active à la fois.
                      </Text>
                    </View>

                    <Pressable
                      onPress={handleUnassign}
                      disabled={isAssigning || isUnassigning}
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && styles.removeButtonPressed,
                        (isAssigning || isUnassigning) && styles.disabled,
                      ]}
                    >
                      {isUnassigning ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                      ) : (
                        <MaterialCommunityIcons
                          name="map-marker-minus-outline"
                          size={19}
                          color={COLORS.error}
                        />
                      )}

                      <Text style={styles.removeButtonText}>
                        Retirer l&apos;affectation
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowAvailablePoints((value) => !value)}
                      disabled={isAssigning || isUnassigning}
                      style={({ pressed }) => [
                        styles.changeButton,
                        pressed && styles.changeButtonPressed,
                        (isAssigning || isUnassigning) && styles.disabled,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          showAvailablePoints ? "chevron-up" : "swap-horizontal"
                        }
                        size={19}
                        color={COLORS.primary}
                      />

                      <Text style={styles.changeButtonText}>
                        Changer de point de vente
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={() => setShowAvailablePoints((value) => !value)}
                    disabled={isAssigning}
                    style={({ pressed }) => [
                      styles.assignButton,
                      pressed && styles.assignButtonPressed,
                      isAssigning && styles.disabled,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="map-marker-plus-outline"
                      size={20}
                      color={COLORS.white}
                    />

                    <Text style={styles.assignButtonText}>
                      Affecter à un point de vente
                    </Text>
                  </Pressable>
                )}

                {/* ========================================== */}
                {/* AVAILABLE POS */}
                {/* ========================================== */}

                {showAvailablePoints && (
                  <View style={styles.availableSection}>
                    <View style={styles.availableHeader}>
                      <View>
                        <Text style={styles.availableTitle}>
                          Points de vente disponibles
                        </Text>

                        <Text style={styles.availableSubtitle}>
                          Sélectionnez un point de vente libre
                        </Text>
                      </View>

                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                          {availablePointsOfSale.length}
                        </Text>
                      </View>
                    </View>

                    {availablePointsOfSale.length === 0 ? (
                      <View style={styles.noAvailableBox}>
                        <MaterialCommunityIcons
                          name="store-off-outline"
                          size={24}
                          color={COLORS.Gray}
                        />

                        <Text style={styles.noAvailableTitle}>
                          Aucun point de vente libre
                        </Text>

                        <Text style={styles.noAvailableDescription}>
                          Tous les points de vente actifs sont actuellement
                          affectés.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pointsList}>
                        {availablePointsOfSale.map((pointOfSale) => (
                          <Pressable
                            key={pointOfSale.id}
                            onPress={() => handleAssign(pointOfSale)}
                            disabled={isAssigning}
                            style={({ pressed }) => [
                              styles.pointOfSaleItem,
                              pressed && styles.pointOfSaleItemPressed,
                              isAssigning && styles.disabled,
                            ]}
                          >
                            <View style={styles.pointOfSaleIcon}>
                              <MaterialCommunityIcons
                                name="store-outline"
                                size={21}
                                color={COLORS.primary}
                              />
                            </View>

                            <View style={styles.pointOfSaleContent}>
                              <Text
                                style={styles.pointOfSaleName}
                                numberOfLines={1}
                              >
                                {pointOfSale.name}
                              </Text>

                              <Text style={styles.pointOfSaleCode}>
                                {pointOfSale.code}
                              </Text>
                            </View>

                            {isAssigning ? (
                              <ActivityIndicator
                                size="small"
                                color={COLORS.primary}
                              />
                            ) : (
                              <MaterialCommunityIcons
                                name="chevron-right"
                                size={20}
                                color={COLORS.Gray}
                              />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* ========================================== */}
                {/* ERROR */}
                {/* ========================================== */}

                {error ? (
                  <View style={styles.errorBox}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={18}
                      color={COLORS.error}
                    />

                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          {/* ================================================== */}
          {/* FOOTER */}
          {/* ================================================== */}

          <View style={styles.footer}>
            <Pressable
              onPress={handleClose}
              disabled={isAssigning || isUnassigning}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelPressed,
                (isAssigning || isUnassigning) && styles.disabled,
              ]}
            >
              <Text style={styles.cancelText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EmployeeAssignmentModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
  },

  container: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "88%",
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
    backgroundColor: "rgba(45, 90, 39, 0.10)",
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

  scrollView: {
    flexGrow: 0,
  },

  content: {
    padding: 20,
  },

  loadingContainer: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: COLORS.Gray,
  },

  // ============================================================
  // SECTION
  // ============================================================

  sectionHeader: {
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    marginLeft: 7,
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: COLORS.text,
  },

  // ============================================================
  // CURRENT ASSIGNMENT
  // ============================================================

  assignmentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    backgroundColor: COLORS.neutral,
    borderWidth: 1,
    borderColor: "rgba(45, 90, 39, 0.18)",
  },

  assignmentIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45, 90, 39, 0.10)",
    marginRight: 12,
  },

  assignmentContent: {
    flex: 1,
  },

  assignmentName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: COLORS.text,
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  assignmentCode: {
    marginLeft: 4,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: COLORS.Gray,
  },

  activeBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(76, 175, 80, 0.10)",
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },

  activeBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: COLORS.success,
  },

  // ============================================================
  // EMPTY ASSIGNMENT
  // ============================================================

  emptyAssignmentBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
    marginRight: 12,
  },

  emptyContent: {
    flex: 1,
  },

  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: COLORS.darkGray,
  },

  emptyDescription: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: COLORS.Gray,
  },

  // ============================================================
  // INFO
  // ============================================================

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 15,
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
  // ACTIONS
  // ============================================================

  assignButton: {
    height: 48,
    marginTop: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  assignButtonPressed: {
    opacity: 0.82,
  },

  assignButtonText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: COLORS.white,
  },

  removeButton: {
    height: 46,
    marginTop: 15,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(244, 67, 54, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.16)",
  },

  removeButtonPressed: {
    opacity: 0.7,
  },

  removeButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: COLORS.error,
  },

  changeButton: {
    height: 46,
    marginTop: 10,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(45, 90, 39, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(45, 90, 39, 0.15)",
  },

  changeButtonPressed: {
    opacity: 0.7,
  },

  changeButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: COLORS.primary,
  },

  // ============================================================
  // AVAILABLE POINTS OF SALE
  // ============================================================

  availableSection: {
    marginTop: 20,
  },

  availableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  availableTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: COLORS.text,
  },

  availableSubtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45, 90, 39, 0.10)",
  },

  countBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: COLORS.primary,
  },

  pointsList: {
    gap: 8,
  },

  pointOfSaleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  pointOfSaleItemPressed: {
    opacity: 0.7,
  },

  pointOfSaleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45, 90, 39, 0.09)",
    marginRight: 10,
  },

  pointOfSaleContent: {
    flex: 1,
  },

  pointOfSaleName: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: COLORS.text,
  },

  pointOfSaleCode: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: COLORS.Gray,
  },

  noAvailableBox: {
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },

  noAvailableTitle: {
    marginTop: 9,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.darkGray,
  },

  noAvailableDescription: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.Gray,
  },

  // ============================================================
  // ERROR
  // ============================================================

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 15,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "rgba(244, 67, 54, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.15)",
  },

  errorText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 18,
    color: COLORS.error,
  },

  // ============================================================
  // FOOTER
  // ============================================================

  footer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },

  cancelButton: {
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

  disabled: {
    opacity: 0.55,
  },
});
