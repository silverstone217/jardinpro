import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useStaffAssignmentStore } from "@/store/staffAssignmentStore";
import type { PointOfSale } from "@/types/pointOfSale";
import { COLORS, fonts, fontSizes } from "@/utils/styles";

type Props = {
  pointOfSale: PointOfSale;
};

export default function PointOfSaleAssignEmployeePopup({ pointOfSale }: Props) {
  const { pointsOfSale, isLoading, fetchStaffAssignments, unassignEmployee } =
    useStaffAssignmentStore();

  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffAssignments().catch((error) => {
      console.error("Erreur lors du chargement des affectations :", error);

      setErrorMessage("Impossible de charger le personnel affecté.");
    });
  }, [fetchStaffAssignments]);

  const currentPointOfSale = pointsOfSale.find(
    (pos) => pos.id === pointOfSale.id,
  );

  const assignments =
    currentPointOfSale?.assignments?.filter(
      (assignment) => assignment.isActive,
    ) ?? [];

  const handleRemove = async (userId: string) => {
    setErrorMessage(null);
    setRemovingUserId(userId);

    try {
      await unassignEmployee(userId);
      await fetchStaffAssignments();
    } catch (error: any) {
      console.error("Erreur lors du retrait de l'affectation :", error);

      setErrorMessage(
        error?.response?.data?.message ||
          "Impossible de retirer l'affectation.",
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleGoToEmployees = () => {
    router.push("/settings/employees");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />

        <Text style={styles.loadingText}>Chargement du personnel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={21}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Personnel affecté</Text>

          <Text style={styles.subtitle}>
            Personnel responsable de ce point de vente
          </Text>
        </View>
      </View>

      {/* ERREUR */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color="#C0392B"
          />

          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* AUCUN PERSONNEL */}
      {assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="account-off-outline"
              size={27}
              color={COLORS.Gray}
            />
          </View>

          <Text style={styles.emptyTitle}>Aucun personnel affecté</Text>

          <Text style={styles.emptyText}>
            Aucun membre du personnel n&apos;est actuellement affecté à ce point
            de vente.
          </Text>

          <Pressable
            onPress={handleGoToEmployees}
            style={({ pressed }) => [
              styles.manageButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={19}
              color={COLORS.white}
            />

            <Text style={styles.manageButtonText}>Affecter un personnel</Text>

            <MaterialCommunityIcons
              name="arrow-right"
              size={18}
              color={COLORS.white}
            />
          </Pressable>
        </View>
      ) : (
        /* PERSONNELS AFFECTÉS */
        <View style={styles.staffList}>
          {assignments.map((assignment) => {
            const user = assignment.user;
            const isRemoving = removingUserId === user.id;

            return (
              <View key={assignment.id} style={styles.employeeCard}>
                {/* AVATAR */}
                <View style={styles.avatar}>
                  {user.image ? (
                    <Image
                      source={{ uri: user.image }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="account"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </View>

                {/* INFOS */}
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName} numberOfLines={1}>
                    {user.name}
                  </Text>

                  <Text style={styles.employeePhone}>{user.telephone}</Text>

                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />

                    <Text style={styles.activeBadgeText}>Affecté</Text>
                  </View>
                </View>

                {/* RETIRER */}
                <Pressable
                  onPress={() => handleRemove(user.id)}
                  disabled={isRemoving}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {isRemoving ? (
                    <ActivityIndicator size="small" color="#C0392B" />
                  ) : (
                    <MaterialCommunityIcons
                      name="account-minus-outline"
                      size={20}
                      color="#C0392B"
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 22,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 12,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EAF3E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
  },

  subtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  loadingContainer: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  staffList: {
    gap: 10,
  },

  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7EBE6",
    backgroundColor: COLORS.white,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EAF3E8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 11,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  employeeInfo: {
    flex: 1,
  },

  employeeName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
  },

  employeePhone: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 5,
  },

  activeBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.primary,
  },

  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    maxWidth: 310,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: COLORS.Gray,
    textAlign: "center",
  },

  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    marginTop: 15,
    gap: 7,
  },

  manageButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },

  errorText: {
    flex: 1,
    marginLeft: 7,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: "#C0392B",
  },

  pressed: {
    opacity: 0.7,
  },
});
