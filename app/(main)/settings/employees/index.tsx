import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import EmployeeCard from "@/components/employees/EmployeeCard";
import EmployeeDetailsModal from "@/components/employees/EmployeeDetailsModal";
import EmployeeFormModal from "@/components/employees/EmployeeFormModal";
import { useEmployeeStore } from "@/store/employeeStore";
import { useUserStore } from "@/store/userStore";
import { Employee } from "@/types/employees";
import { COLORS, fonts, typography } from "@/utils/styles";

const BOTTOM_TAB_HEIGHT = 75;

const EmployeesScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * ============================================================
   * USER
   * ============================================================
   */

  const user = useUserStore((state) => state.user);

  /**
   * ============================================================
   * EMPLOYEE STORE
   * ============================================================
   */

  const employees = useEmployeeStore((state) => state.employees);

  const isLoading = useEmployeeStore((state) => state.isLoading);

  const fetchEmployees = useEmployeeStore((state) => state.fetchEmployees);

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

  /**
   * ============================================================
   * LOCAL STATE
   * ============================================================
   */

  const [search, setSearch] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

  const openEmployeeDetails = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailsModalVisible(true);
  }, []);

  const closeEmployeeDetails = useCallback(() => {
    setIsDetailsModalVisible(false);
    setSelectedEmployee(null);
  }, []);

  /**
   * ============================================================
   * LIST BOTTOM PADDING
   * ============================================================
   *
   * Espace nécessaire sous la liste afin que le dernier
   * employé puisse être remonté au-dessus du bottom tab.
   */

  const listBottomPadding = BOTTOM_TAB_HEIGHT + insets.bottom + 45;

  /**
   * ============================================================
   * LOAD EMPLOYEES
   * ============================================================
   */

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchEmployees().catch((error) => {
      console.error("Erreur lors du chargement des employés :", error);
    });
  }, [user, fetchEmployees]);

  /**
   * ============================================================
   * FILTRAGE
   * ============================================================
   */

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(query) ||
        employee.telephone.includes(query) ||
        employee.email.toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  /**
   * ============================================================
   * STATISTIQUES
   * ============================================================
   */

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => !employee.isBanned,
  ).length;

  const bannedEmployees = employees.filter(
    (employee) => employee.isBanned,
  ).length;

  /**
   * ============================================================
   * EMPLOYEE CARD
   * ============================================================
   */

  const renderEmployee = ({ item }: { item: Employee }) => {
    return (
      <EmployeeCard
        employee={item}
        onPress={openEmployeeDetails}
        onMorePress={openEmployeeDetails}
      />
    );
  };

  /**
   * ============================================================
   * EMPTY STATE
   * ============================================================
   */

  const renderEmpty = () => {
    /**
     * Chargement initial
     */
    if (isLoading && employees.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />

          <Text style={styles.emptyTitle}>Chargement de l&apos;équipe...</Text>
        </View>
      );
    }

    /**
     * Recherche sans résultat
     */
    if (search.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={38}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>Aucun employé trouvé</Text>

          <Text style={styles.emptyText}>
            Aucun employé ne correspond à votre recherche.
          </Text>
        </View>
      );
    }

    /**
     * Aucun employé
     */
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={40}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>Votre équipe est vide</Text>

        <Text style={styles.emptyText}>
          Ajoutez votre premier employé pour commencer à gérer votre équipe.
        </Text>

        <Pressable
          onPress={() => {
            Keyboard.dismiss();

            // Plus tard :
            // setShowAddEmployeeModal(true)
          }}
          style={({ pressed }) => [
            styles.emptyButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />

          <Text style={styles.emptyButtonText}>Ajouter un employé</Text>
        </Pressable>
      </View>
    );
  };

  /**
   * ============================================================
   * USER NON CONNECTÉ
   * ============================================================
   */

  if (!user) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="account-outline"
                size={42}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>Aucun utilisateur connecté</Text>

            <Text style={styles.emptyText}>
              Votre session utilisateur est introuvable.
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  /**
   * ============================================================
   * SCREEN
   * ============================================================
   */

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.container}>
          {/* ====================================================
              HEADER
              ==================================================== */}

          <View style={styles.header}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                router.back();
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={21}
                color={COLORS.text}
              />
            </Pressable>

            <View style={styles.headerRight}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
          </View>

          {/* ====================================================
              TITLE
              ==================================================== */}

          <View style={styles.titleContainer}>
            <View style={styles.titleAccent} />

            <Text style={styles.title}>Personnel</Text>

            <Text style={styles.subtitle}>
              Gérez votre équipe, leurs informations et leur statut sur Jardin
              Pro.
            </Text>
          </View>

          {/* ====================================================
              SEARCH
              ==================================================== */}

          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={COLORS.darkGray}
              />
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un employé..."
              placeholderTextColor={COLORS.Gray}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
            />

            {search.length > 0 && (
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setSearch("");
                }}
                hitSlop={8}
                style={styles.clearSearchButton}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={COLORS.Gray}
                />
              </Pressable>
            )}
          </View>

          {/* ====================================================
              STATISTICS
              ==================================================== */}

          <View style={styles.statsRow}>
            {/* Total */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, styles.statIconGreen]}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.statValue}>{totalEmployees}</Text>

              <Text style={styles.statLabel}>Employés</Text>
            </View>

            {/* Actifs */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, styles.statIconSuccess]}>
                <MaterialCommunityIcons
                  name="account-check-outline"
                  size={18}
                  color={COLORS.success}
                />
              </View>

              <Text style={styles.statValue}>{activeEmployees}</Text>

              <Text style={styles.statLabel}>Actifs</Text>
            </View>

            {/* Bannis */}
            <View style={styles.statCard}>
              <View style={[styles.statIcon, styles.statIconError]}>
                <MaterialCommunityIcons
                  name="account-off-outline"
                  size={18}
                  color={COLORS.error}
                />
              </View>

              <Text style={styles.statValue}>{bannedEmployees}</Text>

              <Text style={styles.statLabel}>Bannis</Text>
            </View>
          </View>

          {/* ====================================================
              SECTION HEADER
              ==================================================== */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>ÉQUIPE</Text>

              <Text style={styles.sectionTitle}>Vos employés</Text>
            </View>

            <View style={styles.sectionCountContainer}>
              <Text style={styles.sectionCount}>
                {filteredEmployees.length}
              </Text>
            </View>
          </View>

          {/* ====================================================
              EMPLOYEE LIST
              ==================================================== */}

          <FlatList
            data={filteredEmployees}
            keyExtractor={(item) => item.id}
            renderItem={renderEmployee}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            onScrollBeginDrag={Keyboard.dismiss}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingBottom: listBottomPadding,
              },
              filteredEmployees.length === 0 && styles.listEmptyContent,
            ]}
          />

          {/* EMPLOYEE MODAL */}
          <EmployeeDetailsModal
            visible={isDetailsModalVisible}
            employee={selectedEmployee}
            onClose={closeEmployeeDetails}
            onProfilePress={(employee) => {
              // Plus tard :
              closeEmployeeDetails();
              router.push(`/settings/employees/${employee.id}`);
              // console.log("Profil employé :", employee.id);
            }}
          />

          {/* ====================================================
              FLOATING ADD BUTTON
              ==================================================== */}

          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setShowAddEmployeeModal(true);
            }}
            style={({ pressed }) => [
              styles.floatingAddButton,
              {
                bottom: BOTTOM_TAB_HEIGHT + insets.bottom + 15,
              },
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={25}
              color={COLORS.white}
            />
          </Pressable>

          <EmployeeFormModal
            visible={showAddEmployeeModal}
            onClose={() => setShowAddEmployeeModal(false)}
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default EmployeesScreen;

/**
 * ================================================================
 * STYLES
 * ================================================================
 */

const styles = StyleSheet.create({
  /**
   * ============================================================
   * BASE
   * ============================================================
   */

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  /**
   * ============================================================
   * HEADER
   * ============================================================
   */

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
    borderColor: "#ECECE8",
    alignItems: "center",
    justifyContent: "center",
  },

  headerRight: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E7F0E5",
    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * ============================================================
   * TITLE
   * ============================================================
   */

  titleContainer: {
    marginTop: 28,
    marginBottom: 22,
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
    fontSize: 30,
    lineHeight: 38,
    color: COLORS.text,
  },

  subtitle: {
    ...typography.body,
    color: COLORS.darkGray,
    marginTop: 9,
    lineHeight: 22,
    paddingRight: 8,
  },

  /**
   * ============================================================
   * SEARCH
   * ============================================================
   */

  searchContainer: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 17,
    marginBottom: 16,
  },

  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  searchInput: {
    flex: 1,
    height: 54,
    paddingHorizontal: 11,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: COLORS.text,
  },

  clearSearchButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },

  statCard: {
    flex: 1,
    minHeight: 108,
    padding: 13,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ECECE8",
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  statIconGreen: {
    backgroundColor: "#E8F2E5",
  },

  statIconSuccess: {
    backgroundColor: "#EAF6EC",
  },

  statIconError: {
    backgroundColor: "#FDECEC",
  },

  statValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
  },

  /**
   * ============================================================
   * SECTION
   * ============================================================
   */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.secondary,
    marginBottom: 3,
  },

  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: COLORS.text,
  },

  sectionCountContainer: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionCount: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.primary,
  },

  /**
   * ============================================================
   * LIST
   * ============================================================
   */

  listContent: {
    paddingTop: 1,
  },

  listEmptyContent: {
    flexGrow: 1,
  },

  /**
   * ============================================================
   * EMPLOYEE CARD
   * ============================================================
   */

  employeeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECE8",
  },

  employeeCardBanned: {
    opacity: 0.72,
  },

  employeeTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 54,
    height: 54,
    borderRadius: 17,
    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E8F2E5",
  },

  avatarPlaceholder: {
    flex: 1,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: COLORS.primary,
  },

  employeeInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    paddingRight: 8,
  },

  employeeName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: COLORS.text,
  },

  telephoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  employeeTelephone: {
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },

  /**
   * ============================================================
   * EMPLOYEE META
   * ============================================================
   */

  employeeBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F0F0EC",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    height: 27,
    borderRadius: 9,
  },

  statusBadgeActive: {
    backgroundColor: "#EAF6EC",
  },

  statusBadgeBanned: {
    backgroundColor: "#FDECEC",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statusText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
  },

  assignmentPreview: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    minWidth: 0,
  },

  assignmentText: {
    flex: 1,
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
  },

  /**
   * ============================================================
   * EMPTY STATE
   * ============================================================
   */

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 50,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: "#E8F2E5",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 17,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: COLORS.text,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.darkGray,
    textAlign: "center",
  },

  emptyButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },

  emptyButtonText: {
    marginLeft: 7,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: COLORS.white,
  },

  /**
   * ============================================================
   * FLOATING ADD BUTTON
   * ============================================================
   */

  floatingAddButton: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },

  /**
   * ============================================================
   * STATES
   * ============================================================
   */

  pressed: {
    opacity: 0.65,
  },
});
