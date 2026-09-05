import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import PointOfSaleCard from "@/components/pointOfSales/PointOfSaleCard";
import PointOfSaleDetailsModal from "@/components/pointOfSales/PointOfSaleDetailsModal";
import PointOfSaleFormModal from "@/components/pointOfSales/PointOfSaleFormModal";
import { usePointOfSaleStore } from "@/store/pointOfSaleStore";
import type { PointOfSale } from "@/types/pointOfSale";
import { COLORS, fonts } from "@/utils/styles";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = "all" | "active" | "inactive";

const PointOfSalesScreen = () => {
  const { pointsOfSale, isLoading, fetchPointsOfSale } = usePointOfSaleStore();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [refreshing, setRefreshing] = useState(false);

  const [detailsVisible, setDetailsVisible] = useState(false);

  const [formVisible, setFormVisible] = useState(false);

  const [selectedPointOfSale, setSelectedPointOfSale] =
    useState<PointOfSale | null>(null);

  /**
   * Charger les points de vente lorsque
   * l'écran devient actif.
   */
  useFocusEffect(
    useCallback(() => {
      fetchPointsOfSale().catch((error) => {
        console.error("Erreur lors du chargement des points de vente :", error);
      });
    }, [fetchPointsOfSale]),
  );

  /**
   * Refresh manuel.
   */
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchPointsOfSale();
    } catch (error) {
      console.error(
        "Erreur lors du rafraîchissement des points de vente :",
        error,
      );
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Filtrage + recherche.
   */
  const filteredPointsOfSale = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return pointsOfSale.filter((pointOfSale) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && pointOfSale.isActive) ||
        (filter === "inactive" && !pointOfSale.isActive);

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        pointOfSale.name.toLowerCase().includes(normalizedSearch) ||
        pointOfSale.code.toLowerCase().includes(normalizedSearch) ||
        pointOfSale.telephone?.toLowerCase().includes(normalizedSearch) ||
        pointOfSale.address?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [pointsOfSale, search, filter]);

  const activeCount = useMemo(
    () => pointsOfSale.filter((pointOfSale) => pointOfSale.isActive).length,
    [pointsOfSale],
  );

  const inactiveCount = pointsOfSale.length - activeCount;

  /**
   * Ouvrir les détails.
   */
  const handlePointOfSalePress = (pointOfSale: PointOfSale) => {
    setSelectedPointOfSale(pointOfSale);
    setDetailsVisible(true);
  };

  /**
   * Fermer les détails.
   */
  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setSelectedPointOfSale(null);
  };

  /**
   * Ouvrir le formulaire de création.
   */
  const handleCreate = () => {
    setSelectedPointOfSale(null);
    setFormVisible(true);
  };

  /**
   * Ouvrir le formulaire de modification.
   */
  const handleEdit = (pointOfSale: PointOfSale) => {
    setDetailsVisible(false);
    setSelectedPointOfSale(pointOfSale);

    // Petit délai pour permettre au modal de détails
    // de terminer sa fermeture avant d'ouvrir le formulaire.
    setTimeout(() => {
      setFormVisible(true);
    }, 150);
  };

  /**
   * Après création/modification.
   */
  const handleFormSuccess = (pointOfSale: PointOfSale) => {
    setSelectedPointOfSale(pointOfSale);
  };

  /**
   * Rendu d'une carte.
   */
  const renderPointOfSale = ({ item }: { item: PointOfSale }) => (
    <PointOfSaleCard
      pointOfSale={item}
      onPress={() => handlePointOfSalePress(item)}
    />
  );

  /**
   * État vide.
   */
  const renderEmptyState = () => {
    const hasSearch = search.trim().length > 0;

    const hasFilter = filter !== "all";

    if (isLoading && pointsOfSale.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>
            Chargement des points de vente...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <MaterialCommunityIcons
            name={
              hasSearch || hasFilter
                ? "store-search-outline"
                : "storefront-outline"
            }
            size={38}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {hasSearch || hasFilter ? "Aucun résultat" : "Aucun point de vente"}
        </Text>

        <Text style={styles.emptyDescription}>
          {hasSearch || hasFilter
            ? "Aucun point de vente ne correspond à votre recherche."
            : "Commencez par créer votre premier point de vente."}
        </Text>

        {hasSearch || hasFilter ? (
          <Pressable
            onPress={() => {
              setSearch("");
              setFilter("all");
            }}
            style={styles.emptyAction}
          >
            <Text style={styles.emptyActionText}>
              Réinitialiser les filtres
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleCreate} style={styles.emptyAction}>
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={COLORS.white}
            />

            <Text style={styles.emptyActionText}>
              Ajouter un point de vente
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutral} />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={COLORS.text}
              />
            </Pressable>

            <View>
              <Text style={styles.title}>Points de vente</Text>

              <Text style={styles.subtitle}>
                Gérez vos différents points de vente
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleCreate}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={23}
              color={COLORS.white}
            />
          </Pressable>
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryNumber}>{pointsOfSale.length}</Text>

            <Text style={styles.summaryLabel}>
              {pointsOfSale.length > 1 ? "points de vente" : "point de vente"}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, styles.activeDot]} />

            <Text style={styles.summaryItemNumber}>{activeCount}</Text>

            <Text style={styles.summaryItemLabel}>actifs</Text>
          </View>

          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, styles.inactiveDot]} />

            <Text style={styles.summaryItemNumber}>{inactiveCount}</Text>

            <Text style={styles.summaryItemLabel}>inactifs</Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={21}
            color={COLORS.Gray}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un point de vente..."
            placeholderTextColor="#A8A8A8"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={19}
                color={COLORS.Gray}
              />
            </Pressable>
          )}
        </View>

        {/* FILTERS */}
        <View style={styles.filters}>
          <FilterButton
            label="Tous"
            count={pointsOfSale.length}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />

          <FilterButton
            label="Actifs"
            count={activeCount}
            active={filter === "active"}
            onPress={() => setFilter("active")}
          />

          <FilterButton
            label="Inactifs"
            count={inactiveCount}
            active={filter === "inactive"}
            onPress={() => setFilter("inactive")}
          />
        </View>

        {/* LIST */}
        <FlatList
          data={filteredPointsOfSale}
          keyExtractor={(item) => item.id}
          renderItem={renderPointOfSale}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredPointsOfSale.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* DETAILS MODAL */}
      <PointOfSaleDetailsModal
        visible={detailsVisible}
        pointOfSale={selectedPointOfSale}
        onClose={handleCloseDetails}
        onEdit={handleEdit}
      />

      {/* FORM MODAL */}
      <PointOfSaleFormModal
        visible={formVisible}
        pointOfSale={selectedPointOfSale}
        onClose={() => {
          setFormVisible(false);
          setSelectedPointOfSale(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </SafeAreaView>
  );
};

type FilterButtonProps = {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
};

const FilterButton = ({ label, count, active, onPress }: FilterButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.filterPressed,
      ]}
    >
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
        {label}
      </Text>

      <View style={[styles.filterCount, active && styles.filterCountActive]}>
        <Text
          style={[
            styles.filterCountText,
            active && styles.filterCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
};

export default PointOfSalesScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 17,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: COLORS.text,
  },

  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
    marginTop: 2,
  },

  addButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },

  summary: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  summaryMain: {
    flex: 1,
  },

  summaryNumber: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: COLORS.text,
  },

  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
    marginTop: 1,
  },

  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 12,
  },

  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.Gray,
  },

  summaryItemNumber: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: COLORS.text,
    marginRight: 3,
  },

  summaryItemLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 49,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },

  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 9,
    paddingVertical: 0,
  },

  filters: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 13,
    marginBottom: 11,
    gap: 8,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 37,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  filterButtonActive: {
    backgroundColor: "#EAF4E7",
    borderColor: "#D5E7D1",
  },

  filterPressed: {
    opacity: 0.7,
  },

  filterLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.darkGray,
  },

  filterLabelActive: {
    fontFamily: fonts.semibold,
    color: COLORS.primary,
  },

  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
    paddingHorizontal: 5,
  },

  filterCountActive: {
    backgroundColor: COLORS.primary,
  },

  filterCountText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: COLORS.Gray,
  },

  filterCountTextActive: {
    color: COLORS.white,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.Gray,
    marginTop: 12,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 70,
  },

  emptyIconContainer: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: "#EAF4E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: COLORS.text,
    textAlign: "center",
  },

  emptyDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.Gray,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 300,
  },

  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45,
    paddingHorizontal: 17,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    marginTop: 18,
    gap: 6,
  },

  emptyActionText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.white,
  },
});
