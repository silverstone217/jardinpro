import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import PackagingCard from "@/components/packaging/PackagingCard";
import PackagingDetailsModal from "@/components/packaging/PackagingDetailsModal";
import PackagingFormModal from "@/components/packaging/PackagingFormModal";
import PackagingStockModal from "@/components/packaging/PackagingStockModal";
import { usePackagingStore } from "@/store/packagingStore";
import { useStockStore } from "@/store/stockStore";
import type { Packaging } from "@/types/packaging";
import { COLORS, fonts, fontSizes } from "@/utils/styles";
import { SafeAreaView } from "react-native-safe-area-context";

const PackagingScreen = () => {
  const packagings = usePackagingStore((state) => state.packagings);
  const stocks = useStockStore((state) => state.stocks);

  const isLoading = usePackagingStore((state) => state.isLoading);
  const error = usePackagingStore((state) => state.error);

  const fetchPackagings = usePackagingStore((state) => state.fetchPackagings);
  const clearError = usePackagingStore((state) => state.clearError);

  const [search, setSearch] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedPackaging, setSelectedPackaging] = useState<Packaging | null>(
    null,
  );

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchPackagings().catch(() => {});
    }, [fetchPackagings]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchPackagings();
    } catch {
      // L'erreur est déjà gérée par le store.
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenCreate = () => {
    clearError();
    setSelectedPackaging(null);
    setFormVisible(true);
  };

  const handleOpenDetails = (packaging: Packaging) => {
    clearError();
    setStockModalVisible(false);
    setSelectedPackaging(packaging);
    setDetailsVisible(true);
  };

  const handleOpenStock = (packaging: Packaging) => {
    setDetailsVisible(false);
    setFormVisible(false);
    setSelectedPackaging(packaging);
    setStockModalVisible(true);
  };

  const handleOpenEdit = (packaging: Packaging) => {
    clearError();
    setDetailsVisible(false);
    setStockModalVisible(false);
    setSelectedPackaging(packaging);
    setFormVisible(true);
  };

  const getPackagingStock = (packagingId: string) => {
    return (
      stocks.find(
        (stock) =>
          stock.packagingId === packagingId && stock.pointOfSaleId === null,
      )?.quantity ?? 0
    );
  };

  const handleCloseForm = () => {
    if (usePackagingStore.getState().isCreating) {
      return;
    }

    if (usePackagingStore.getState().isUpdating) {
      return;
    }

    setFormVisible(false);
    setSelectedPackaging(null);
  };

  const handleCloseDetails = () => {
    if (usePackagingStore.getState().isUpdating) {
      return;
    }

    setDetailsVisible(false);
    setSelectedPackaging(null);
  };

  const handleFormSuccess = (packaging: Packaging) => {
    setFormVisible(false);
    setSelectedPackaging(packaging);
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredPackagings =
    normalizedSearch.length === 0
      ? packagings
      : packagings.filter((packaging) => {
          const nameMatch = packaging.name
            .toLowerCase()
            .includes(normalizedSearch);

          const sizeLabel =
            packaging.size === "ML_200"
              ? "200 ml"
              : packaging.size === "ML_500"
                ? "500 ml"
                : packaging.size;

          const sizeMatch = sizeLabel.toLowerCase().includes(normalizedSearch);

          return nameMatch || sizeMatch;
        });

  const activeCount = packagings.filter(
    (packaging) => packaging.isActive,
  ).length;

  const inactiveCount = packagings.length - activeCount;

  const renderPackaging = ({ item }: { item: Packaging }) => {
    const sizeLabel =
      item.size === "ML_200"
        ? "200 ml"
        : item.size === "ML_500"
          ? "500 ml"
          : item.size;

    return (
      <PackagingCard
        packaging={item}
        sizeLabel={sizeLabel}
        onPress={() => handleOpenDetails(item)}
        onManageStock={() => handleOpenStock(item)}
        stockQuantity={getPackagingStock(item.id)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Emballages</Text>

          <Text style={styles.subtitle}>
            Gérez les bouteilles utilisées pour vos produits.
          </Text>
        </View>

        <Pressable
          onPress={handleOpenCreate}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={23} color={COLORS.white} />
        </Pressable>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <StatCard icon="cube-outline" value={packagings.length} label="Total" />

        <StatCard
          icon="checkmark-circle-outline"
          value={activeCount}
          label="Actifs"
        />

        <StatCard
          icon="pause-circle-outline"
          value={inactiveCount}
          label="Inactifs"
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={19} color={COLORS.Gray} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un emballage..."
          placeholderTextColor={COLORS.Gray}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="never"
        />

        {search.length > 0 ? (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={19} color={COLORS.Gray} />
          </Pressable>
        ) : null}
      </View>

      {/* Error */}
      {error ? (
        <Pressable onPress={clearError} style={styles.errorBanner}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="alert-circle-outline"
              size={19}
              color={COLORS.error}
            />
          </View>

          <Text style={styles.errorText}>{error}</Text>

          <Ionicons name="close" size={18} color={COLORS.error} />
        </Pressable>
      ) : null}

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {normalizedSearch ? "Résultats" : "Tous les emballages"}
        </Text>

        <Text style={styles.resultCount}>{filteredPackagings.length}</Text>
      </View>

      {/* List */}
      {isLoading && packagings.length === 0 ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.stateText}>Chargement des emballages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPackagings}
          keyExtractor={(item) => item.id}
          renderItem={renderPackaging}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredPackagings.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              hasSearch={normalizedSearch.length > 0}
              onCreate={handleOpenCreate}
              onClearSearch={() => setSearch("")}
            />
          }
        />
      )}

      {/* Details modal */}
      {detailsVisible && (
        <PackagingDetailsModal
          key={selectedPackaging?.id ?? "details"}
          visible={detailsVisible}
          packaging={selectedPackaging}
          onClose={handleCloseDetails}
          onEdit={handleOpenEdit}
        />
      )}

      {/* Stock modal */}
      {/* Stock modal */}
      {stockModalVisible && (
        <PackagingStockModal
          key={selectedPackaging?.id ?? "stock"}
          visible={stockModalVisible}
          packaging={selectedPackaging}
          onClose={() => {
            setStockModalVisible(false);
            setSelectedPackaging(null);
          }}
        />
      )}

      {/* Form modal */}
      {formVisible && (
        <PackagingFormModal
          key={selectedPackaging?.id ?? "create"}
          visible={formVisible}
          packaging={selectedPackaging}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </SafeAreaView>
  );
};

type StatCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
};

const StatCard = ({ icon, value, label }: StatCardProps) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

type EmptyStateProps = {
  hasSearch: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
};

const EmptyState = ({
  hasSearch,
  onCreate,
  onClearSearch,
}: EmptyStateProps) => {
  if (hasSearch) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="search-outline" size={30} color={COLORS.Gray} />
        </View>

        <Text style={styles.emptyTitle}>Aucun résultat</Text>

        <Text style={styles.emptyDescription}>
          Aucun emballage ne correspond à votre recherche.
        </Text>

        <Pressable
          onPress={onClearSearch}
          style={({ pressed }) => [
            styles.emptySecondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.emptySecondaryButtonText}>
            Effacer la recherche
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cube-outline" size={30} color={COLORS.primary} />
      </View>

      <Text style={styles.emptyTitle}>Aucun emballage</Text>

      <Text style={styles.emptyDescription}>
        Commencez par ajouter votre premier emballage.
      </Text>

      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [
          styles.emptyPrimaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="add" size={19} color={COLORS.white} />

        <Text style={styles.emptyPrimaryButtonText}>Ajouter un emballage</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
    marginRight: 14,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xlarge,
    color: COLORS.darkGray,
  },

  subtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: COLORS.Gray,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 17,
    backgroundColor: COLORS.neutral,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  statIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginBottom: 6,
  },

  statValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.darkGray,
  },

  statLabel: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    color: COLORS.Gray,
  },

  searchContainer: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    marginLeft: 9,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
  },

  errorBanner: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  errorIcon: {
    marginRight: 8,
  },

  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small - 2,
    lineHeight: 17,
    color: COLORS.error,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
  },

  resultCount: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    textAlign: "center",
    textAlignVertical: "center",
    marginLeft: 8,
    paddingHorizontal: 7,
    overflow: "hidden",
    backgroundColor: COLORS.neutral,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small - 2,
    color: COLORS.primary,
  },

  listContent: {
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  card: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 10,
  },

  cardPressed: {
    opacity: 0.75,
  },

  cardIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  cardTitle: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.darkGray,
    marginRight: 8,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  activeBadge: {
    backgroundColor: "#EAF6EC",
  },

  inactiveBadge: {
    backgroundColor: "#FDECEC",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  activeDot: {
    backgroundColor: COLORS.success,
  },

  inactiveDot: {
    backgroundColor: COLORS.error,
  },

  statusText: {
    fontFamily: fonts.medium,
    fontSize: 10,
  },

  activeText: {
    color: COLORS.success,
  },

  inactiveText: {
    color: COLORS.error,
  },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  metaText: {
    marginLeft: 5,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small - 2,
    color: COLORS.Gray,
  },

  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 9,
  },

  arrowContainer: {
    marginLeft: 7,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  stateText: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF2E8",
    marginBottom: 14,
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: COLORS.Gray,
    textAlign: "center",
  },

  emptyPrimaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 18,
    gap: 7,
  },

  emptyPrimaryButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.white,
  },

  emptySecondaryButton: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },

  emptySecondaryButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small - 2,
    color: COLORS.primary,
  },

  pressed: {
    opacity: 0.75,
  },
});

export default PackagingScreen;
