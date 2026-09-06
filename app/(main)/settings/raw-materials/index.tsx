import { useCallback, useMemo, useState } from "react";

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

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { COLORS, fontSizes, fonts } from "@/utils/styles";

import { useRawMaterialStore } from "@/store/rawMaterialStore";
import { useStockStore } from "@/store/stockStore";

import type { RawMaterialWithStock } from "@/types/rawMaterial";

import RawMaterialCard from "@/components/rawMaterial/RawMaterialCard";
import RawMaterialDetailsModal from "@/components/rawMaterial/RawMaterialDetailsModal";
import RawMaterialFormModal from "@/components/rawMaterial/RawMaterialFormModal";
import RawMaterialStockModal from "@/components/rawMaterial/RawMaterialStockModal";
import { SafeAreaView } from "react-native-safe-area-context";

const RawMaterialScreen = () => {
  /*
   * --------------------------------------------------------------------------
   * STORES
   * --------------------------------------------------------------------------
   */

  const rawMaterials = useRawMaterialStore((state) => state.rawMaterials);

  const isLoading = useRawMaterialStore((state) => state.isLoading);

  const rawMaterialError = useRawMaterialStore((state) => state.error);

  const fetchRawMaterials = useRawMaterialStore(
    (state) => state.fetchRawMaterials,
  );

  const clearRawMaterialError = useRawMaterialStore(
    (state) => state.clearError,
  );

  const stocks = useStockStore((state) => state.stocks);

  const fetchStocks = useStockStore((state) => state.fetchStocks);

  /*
   * --------------------------------------------------------------------------
   * LOCAL STATE
   * --------------------------------------------------------------------------
   */

  const [search, setSearch] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [formVisible, setFormVisible] = useState(false);

  const [detailsVisible, setDetailsVisible] = useState(false);

  const [stockModalVisible, setStockModalVisible] = useState(false);

  const [selectedRawMaterial, setSelectedRawMaterial] =
    useState<RawMaterialWithStock | null>(null);

  /*
   * --------------------------------------------------------------------------
   * CHARGEMENT
   * --------------------------------------------------------------------------
   */

  useFocusEffect(
    useCallback(() => {
      fetchRawMaterials().catch(() => {});
      fetchStocks().catch(() => {});
    }, [fetchRawMaterials, fetchStocks]),
  );

  /*
   * --------------------------------------------------------------------------
   * REFRESH
   * --------------------------------------------------------------------------
   */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([fetchRawMaterials(), fetchStocks()]);
    } catch {
      // Les erreurs sont gérées par les stores.
    } finally {
      setRefreshing(false);
    }
  }, [fetchRawMaterials, fetchStocks]);

  /*
   * --------------------------------------------------------------------------
   * RECHERCHE
   * --------------------------------------------------------------------------
   */

  const filteredRawMaterials = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rawMaterials;
    }

    return rawMaterials.filter((rawMaterial) =>
      rawMaterial.name.toLowerCase().includes(normalizedSearch),
    );
  }, [rawMaterials, search]);

  /*
   * --------------------------------------------------------------------------
   * STOCK CENTRAL
   * --------------------------------------------------------------------------
   */

  const getRawMaterialStock = (rawMaterialId: string): number => {
    const stock = stocks.find(
      (item) =>
        item.rawMaterialId === rawMaterialId && item.pointOfSaleId === null,
    );

    return Number(stock?.quantity ?? 0);
  };

  /*
   * --------------------------------------------------------------------------
   * OUVERTURE DES MODALS
   * --------------------------------------------------------------------------
   */

  const handleOpenCreate = () => {
    clearRawMaterialError();

    setSelectedRawMaterial(null);
    setDetailsVisible(false);
    setStockModalVisible(false);
    setFormVisible(true);
  };

  const handleOpenDetails = (rawMaterial: RawMaterialWithStock) => {
    clearRawMaterialError();

    setFormVisible(false);
    setStockModalVisible(false);

    setSelectedRawMaterial(rawMaterial);
    setDetailsVisible(true);
  };

  const handleOpenStock = (rawMaterial: RawMaterialWithStock) => {
    clearRawMaterialError();

    setDetailsVisible(false);
    setFormVisible(false);

    setSelectedRawMaterial(rawMaterial);
    setStockModalVisible(true);
  };

  const handleOpenEdit = (rawMaterial: RawMaterialWithStock) => {
    clearRawMaterialError();

    setDetailsVisible(false);
    setStockModalVisible(false);

    setSelectedRawMaterial(rawMaterial);
    setFormVisible(true);
  };

  /*
   * --------------------------------------------------------------------------
   * FERMETURE DES MODALS
   * --------------------------------------------------------------------------
   */

  const handleCloseForm = () => {
    const isCreating = useRawMaterialStore.getState().isCreating;

    const isUpdating = useRawMaterialStore.getState().isUpdating;

    if (isCreating || isUpdating) {
      return;
    }

    setFormVisible(false);
    setSelectedRawMaterial(null);
  };

  const handleCloseDetails = () => {
    const isUpdating = useRawMaterialStore.getState().isUpdating;

    if (isUpdating) {
      return;
    }

    setDetailsVisible(false);
    setSelectedRawMaterial(null);
  };

  const handleCloseStock = () => {
    const stockState = useStockStore.getState();

    if (
      stockState.isAdding ||
      stockState.isRemoving ||
      stockState.isAdjusting
    ) {
      return;
    }

    setStockModalVisible(false);
    setSelectedRawMaterial(null);
  };

  /*
   * --------------------------------------------------------------------------
   * SUCCÈS FORMULAIRE
   * --------------------------------------------------------------------------
   */

  const handleFormSuccess = (rawMaterial: RawMaterialWithStock) => {
    setFormVisible(false);

    setSelectedRawMaterial(rawMaterial);

    // On garde la matière sélectionnée afin que
    // les autres actions puissent être effectuées
    // directement après l'enregistrement.
  };

  /*
   * --------------------------------------------------------------------------
   * EMPTY STATE
   * --------------------------------------------------------------------------
   */

  const renderEmptyState = () => {
    const hasSearch = search.trim().length > 0;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name={hasSearch ? "search-outline" : "leaf-outline"}
            size={30}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          {hasSearch ? "Aucune matière trouvée" : "Aucune matière première"}
        </Text>

        <Text style={styles.emptyText}>
          {hasSearch
            ? "Aucune matière ne correspond à votre recherche."
            : "Ajoutez vos matières premières pour commencer à gérer votre stock."}
        </Text>

        {!hasSearch && (
          <Pressable
            onPress={handleOpenCreate}
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="add-outline" size={19} color={COLORS.white} />

            <Text style={styles.emptyButtonText}>Ajouter une matière</Text>
          </Pressable>
        )}
      </View>
    );
  };

  /*
   * --------------------------------------------------------------------------
   * ERREUR
   * --------------------------------------------------------------------------
   */

  const renderError = () => {
    if (!rawMaterialError) {
      return null;
    }

    return (
      <View style={styles.errorBanner}>
        <View style={styles.errorIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={COLORS.error}
          />
        </View>

        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Une erreur est survenue</Text>

          <Text style={styles.errorText}>{rawMaterialError}</Text>
        </View>

        <Pressable
          onPress={clearRawMaterialError}
          style={({ pressed }) => [
            styles.errorClose,
            pressed && styles.buttonPressed,
          ]}
        >
          <Ionicons name="close" size={19} color={COLORS.darkGray} />
        </Pressable>
      </View>
    );
  };

  /*
   * --------------------------------------------------------------------------
   * ITEM
   * --------------------------------------------------------------------------
   */

  const renderItem = ({ item }: { item: RawMaterialWithStock }) => {
    return (
      <RawMaterialCard
        rawMaterial={item}
        stockQuantity={getRawMaterialStock(item.id)}
        onPress={() => handleOpenDetails(item)}
        onManageStock={() => handleOpenStock(item)}
      />
    );
  };

  /*
   * --------------------------------------------------------------------------
   * HEADER
   * --------------------------------------------------------------------------
   */

  const renderHeader = () => {
    return (
      <>
        <View style={styles.topSection}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIcon}>
              <Ionicons name="leaf-outline" size={22} color={COLORS.primary} />
            </View>

            <View style={styles.titleTextContainer}>
              <Text style={styles.screenTitle}>Matières premières</Text>

              <Text style={styles.screenSubtitle}>
                Gérez les matières utilisées pour vos productions
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleOpenCreate}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="add" size={22} color={COLORS.white} />
          </Pressable>
        </View>

        {renderError()}

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.Gray} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une matière..."
            placeholderTextColor={COLORS.Gray}
            style={styles.searchInput}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              style={({ pressed }) => [
                styles.clearSearchButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="close-circle" size={19} color={COLORS.Gray} />
            </Pressable>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{rawMaterials.length}</Text>

            <Text style={styles.summaryLabel}>
              {rawMaterials.length <= 1 ? "matière" : "matières"}
            </Text>
          </View>

          <View style={styles.summarySeparator} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {rawMaterials.filter((item) => item.isActive).length}
            </Text>

            <Text style={styles.summaryLabel}>actives</Text>
          </View>

          <View style={styles.summarySeparator} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {
                rawMaterials.filter((item) => {
                  if (item.minStock === null) {
                    return false;
                  }

                  return getRawMaterialStock(item.id) <= item.minStock;
                }).length
              }
            </Text>

            <Text style={styles.summaryLabel}>stock faible</Text>
          </View>
        </View>

        {filteredRawMaterials.length > 0 && (
          <Text style={styles.resultCount}>
            {filteredRawMaterials.length} résultat
            {filteredRawMaterials.length > 1 ? "s" : ""}
          </Text>
        )}
      </>
    );
  };

  /*
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredRawMaterials}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={isLoading ? null : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={
          filteredRawMaterials.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {isLoading && rawMaterials.length === 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />

            <Text style={styles.loadingText}>Chargement des matières...</Text>
          </View>
        </View>
      )}

      {detailsVisible && selectedRawMaterial && (
        <RawMaterialDetailsModal
          key={selectedRawMaterial.id}
          visible={detailsVisible}
          rawMaterial={selectedRawMaterial}
          stockQuantity={getRawMaterialStock(selectedRawMaterial.id)}
          onClose={handleCloseDetails}
          onEdit={handleOpenEdit}
        />
      )}

      {stockModalVisible && (
        <RawMaterialStockModal
          key={selectedRawMaterial?.id ?? "stock"}
          visible={stockModalVisible}
          rawMaterial={selectedRawMaterial}
          onClose={handleCloseStock}
        />
      )}

      {formVisible && (
        <RawMaterialFormModal
          key={selectedRawMaterial?.id ?? "create"}
          visible={formVisible}
          rawMaterial={selectedRawMaterial}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </SafeAreaView>
  );
};

export default RawMaterialScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  titleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EAF3E7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  titleTextContainer: {
    flex: 1,
  },

  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.text,
  },

  screenSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.Gray,
    marginTop: 2,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  searchContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 11,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  clearSearchButton: {
    padding: 3,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginBottom: 14,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.primary,
  },

  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: COLORS.Gray,
    marginTop: 1,
  },

  summarySeparator: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.lightGray,
  },

  resultCount: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.Gray,
    marginBottom: 10,
    marginLeft: 2,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FDECEC",
    marginBottom: 14,
  },

  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  errorContent: {
    flex: 1,
  },

  errorTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: COLORS.text,
    marginBottom: 2,
  },

  errorText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.error,
  },

  errorClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 70,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EAF3E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
    textAlign: "center",
  },

  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.Gray,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 310,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    marginTop: 18,
    gap: 6,
  },

  emptyButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: COLORS.white,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 245, 245, 0.65)",
  },

  loadingCard: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },

  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: COLORS.darkGray,
    marginTop: 10,
  },

  buttonPressed: {
    opacity: 0.75,
  },
});
