import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  Product,
  ProductDetails,
  ProductImageInput,
} from "@/types/product";

import { COLORS, fontSizes, fonts } from "@/utils/styles";

interface ProductFormModalProps {
  visible: boolean;
  product?: Product | ProductDetails | null;
  isSaving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    recipeVolumeMl: number;
    image?: ProductImageInput;
  }) => void | Promise<void>;
}

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function ProductFormModal({
  visible,
  product = null,
  isSaving = false,
  error = null,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");

  const [description, setDescription] = useState(product?.description ?? "");

  const [recipeVolumeMl, setRecipeVolumeMl] = useState(
    product?.recipeVolumeMl ? String(product.recipeVolumeMl) : "",
  );

  const [selectedImage, setSelectedImage] = useState<ProductImageInput | null>(
    null,
  );

  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.image ?? null,
  );

  const [nameError, setNameError] = useState("");
  const [recipeVolumeError, setRecipeVolumeError] = useState("");
  const [imageError, setImageError] = useState("");

  /**
   * ============================================================
   * IMAGE PICKER
   * ============================================================
   */

  const handlePickImage = async () => {
    if (isSaving || isEditing) {
      return;
    }

    setImageError("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setImageError(
        "L'autorisation d'accès aux photos est nécessaire pour choisir une image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset) {
      return;
    }

    /**
     * Vérification du type MIME.
     */
    const mimeType = asset.mimeType?.toLowerCase() ?? "image/jpeg";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(mimeType)) {
      setImageError(
        "Format non supporté. Utilisez une image JPG, PNG ou WebP.",
      );
      return;
    }

    /**
     * Vérification de la taille.
     */
    if (asset.fileSize !== undefined && asset.fileSize > MAX_IMAGE_SIZE) {
      setImageError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    const fileName =
      asset.fileName ?? `product-${Date.now()}.${getExtension(mimeType)}`;

    const image: ProductImageInput = {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    };

    setSelectedImage(image);
    setImagePreview(asset.uri);
  };

  /**
   * Retire l'image sélectionnée localement.
   *
   * Cette action concerne uniquement la création.
   */
  const handleRemoveSelectedImage = () => {
    if (isSaving || isEditing) {
      return;
    }

    setSelectedImage(null);
    setImagePreview(null);
    setImageError("");
  };

  /**
   * ============================================================
   * VALIDATION
   * ============================================================
   */

  const validate = () => {
    let isValid = true;

    setNameError("");
    setRecipeVolumeError("");
    setImageError("");

    /**
     * Nom
     */
    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError("Le nom du produit est requis");
      isValid = false;
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      setNameError(`Le nom ne doit pas dépasser ${MAX_NAME_LENGTH} caractères`);
      isValid = false;
    }

    /**
     * Rendement de la recette
     */
    const normalizedVolume = recipeVolumeMl.trim();

    if (!normalizedVolume) {
      setRecipeVolumeError("Le rendement de la recette est requis");
      isValid = false;
    } else {
      const parsedVolume = Number(normalizedVolume);

      if (!Number.isFinite(parsedVolume)) {
        setRecipeVolumeError("Le rendement doit être un nombre valide");
        isValid = false;
      } else if (!Number.isInteger(parsedVolume)) {
        setRecipeVolumeError("Le rendement doit être un nombre entier");
        isValid = false;
      } else if (parsedVolume <= 0) {
        setRecipeVolumeError("Le rendement doit être supérieur à 0");
        isValid = false;
      }
    }

    return isValid;
  };

  /**
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    if (!validate()) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const parsedRecipeVolumeMl = Number(recipeVolumeMl.trim());

    await onSubmit({
      name: trimmedName,

      ...(trimmedDescription
        ? {
            description: trimmedDescription,
          }
        : {}),

      recipeVolumeMl: parsedRecipeVolumeMl,

      /**
       * L'image est envoyée uniquement lors
       * de la création.
       *
       * En modification, la gestion de l'image
       * se fait séparément.
       */
      ...(!isEditing && selectedImage
        ? {
            image: selectedImage,
          }
        : {}),
    });
  };

  /**
   * ============================================================
   * CLOSE
   * ============================================================
   */

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    setNameError("");
    setRecipeVolumeError("");
    setImageError("");

    onClose();
  };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={styles.container}>
          {/* ==================================================
              HEADER
              ================================================== */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name={isEditing ? "create-outline" : "cube-outline"}
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.headerTexts}>
                <Text style={styles.title}>
                  {isEditing ? "Modifier le produit" : "Nouveau produit"}
                </Text>

                <Text style={styles.subtitle}>
                  {isEditing
                    ? "Modifiez les informations du produit"
                    : "Ajoutez un nouveau produit à votre catalogue"}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSaving}
              hitSlop={10}
            >
              <Ionicons name="close" size={23} color={COLORS.darkGray} />
            </Pressable>
          </View>

          {/* ==================================================
              CONTENT
              ================================================== */}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ==================================================
                GLOBAL ERROR
                ================================================== */}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={COLORS.error}
                />

                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ==================================================
                INFORMATIONS
                ================================================== */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={COLORS.primary}
                />

                <Text style={styles.sectionTitle}>Informations générales</Text>
              </View>

              {/* ==================================================
                  NOM
                  ================================================== */}

              <View style={styles.field}>
                <Text style={styles.label}>
                  Nom du produit <Text style={styles.required}>*</Text>
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    nameError && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={19}
                    color={nameError ? COLORS.error : COLORS.Gray}
                  />

                  <TextInput
                    value={name}
                    onChangeText={(value) => {
                      setName(value);

                      if (nameError) {
                        setNameError("");
                      }
                    }}
                    placeholder="Ex. Jus de mangue"
                    placeholderTextColor={COLORS.Gray}
                    style={styles.input}
                    maxLength={MAX_NAME_LENGTH}
                    editable={!isSaving}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.fieldFooter}>
                  {nameError ? (
                    <Text style={styles.fieldError}>{nameError}</Text>
                  ) : (
                    <View />
                  )}

                  <Text style={styles.counter}>
                    {name.length}/{MAX_NAME_LENGTH}
                  </Text>
                </View>
              </View>

              {/* ==================================================
                  DESCRIPTION
                  ================================================== */}

              <View style={styles.field}>
                <Text style={styles.label}>Description</Text>

                <View style={styles.textAreaContainer}>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Décrivez brièvement le produit..."
                    placeholderTextColor={COLORS.Gray}
                    style={styles.textArea}
                    multiline
                    textAlignVertical="top"
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    editable={!isSaving}
                  />
                </View>

                <Text style={styles.counter}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>

              {/* ==================================================
                  RENDEMENT RECETTE
                  ================================================== */}

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>
                    Rendement de la recette{" "}
                    <Text style={styles.required}>*</Text>
                  </Text>

                  <View style={styles.unitBadge}>
                    <Text style={styles.unitBadgeText}>ML</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    recipeVolumeError && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="flask-outline"
                    size={19}
                    color={recipeVolumeError ? COLORS.error : COLORS.Gray}
                  />

                  <TextInput
                    value={recipeVolumeMl}
                    onChangeText={(value) => {
                      /**
                       * On autorise uniquement les chiffres.
                       */
                      const sanitized = value.replace(/[^0-9]/g, "");

                      setRecipeVolumeMl(sanitized);

                      if (recipeVolumeError) {
                        setRecipeVolumeError("");
                      }
                    }}
                    placeholder="Ex. 2000"
                    placeholderTextColor={COLORS.Gray}
                    style={styles.input}
                    keyboardType="number-pad"
                    editable={!isSaving}
                    returnKeyType="done"
                  />

                  <Text style={styles.inputSuffix}>ml</Text>
                </View>

                {recipeVolumeError ? (
                  <Text style={styles.fieldError}>{recipeVolumeError}</Text>
                ) : (
                  <Text style={styles.helperTextSmall}>
                    Volume total obtenu pour une recette de base. Exemple : 2
                    000 ml = 2 L.
                  </Text>
                )}
              </View>
            </View>

            {/* ==================================================
                IMAGE
                ================================================== */}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="image-outline"
                  size={19}
                  color={COLORS.primary}
                />

                <Text style={styles.sectionTitle}>Image du produit</Text>
              </View>

              {isEditing ? (
                /**
                 * ------------------------------------------------
                 * MODE MODIFICATION
                 * ------------------------------------------------
                 *
                 * L'image n'est pas modifiée dans ce formulaire.
                 */
                <View style={styles.imageManagementBox}>
                  <View style={styles.imagePreviewContainer}>
                    {imagePreview ? (
                      <Image
                        source={{
                          uri: imagePreview,
                        }}
                        style={styles.imagePreview}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons
                          name="image-outline"
                          size={34}
                          color={COLORS.Gray}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.imageManagementContent}>
                    <Text style={styles.imageManagementTitle}>
                      Image gérée séparément
                    </Text>

                    <Text style={styles.imageManagementText}>
                      Pour modifier ou supprimer l&apos;image, utilisez
                      l&apos;action dédiée depuis les détails du produit.
                    </Text>
                  </View>
                </View>
              ) : (
                /**
                 * ------------------------------------------------
                 * MODE CREATION
                 * ------------------------------------------------
                 */

                <>
                  <Text style={styles.helperText}>
                    Ajoutez une photo du produit. Formats acceptés : JPG, PNG ou
                    WebP, 2 Mo maximum.
                  </Text>

                  {imagePreview ? (
                    <View style={styles.selectedImageWrapper}>
                      <Image
                        source={{
                          uri: imagePreview,
                        }}
                        style={styles.selectedImage}
                      />

                      <View style={styles.imageOverlay}>
                        <Pressable
                          style={styles.imageActionButton}
                          onPress={handlePickImage}
                          disabled={isSaving}
                        >
                          <Ionicons
                            name="camera-outline"
                            size={20}
                            color={COLORS.white}
                          />
                        </Pressable>

                        <Pressable
                          style={[
                            styles.imageActionButton,
                            styles.removeImageButton,
                          ]}
                          onPress={handleRemoveSelectedImage}
                          disabled={isSaving}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={COLORS.white}
                          />
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.imagePicker}
                      onPress={handlePickImage}
                      disabled={isSaving}
                    >
                      <View style={styles.imagePickerIcon}>
                        <Ionicons
                          name="camera-outline"
                          size={26}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.imagePickerTexts}>
                        <Text style={styles.imagePickerTitle}>
                          Ajouter une image
                        </Text>

                        <Text style={styles.imagePickerSubtitle}>
                          Appuyez pour choisir une photo
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.Gray}
                      />
                    </Pressable>
                  )}

                  {imageError ? (
                    <Text style={styles.fieldError}>{imageError}</Text>
                  ) : null}
                </>
              )}
            </View>

            {/* ==================================================
                INFO RECETTE / VARIANTES
                ================================================== */}

            <View style={styles.infoBox}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="layers-outline"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>
                  La recette et les formats sont séparés
                </Text>

                <Text style={styles.infoText}>
                  Le rendement indiqué correspond à la quantité produite par une
                  recette de base. Les variantes (200 ml, 500 ml) seront
                  configurées séparément avec leur emballage et leur prix.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ==================================================
              FOOTER
              ================================================== */}

          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelButton, isSaving && styles.disabledButton]}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitButton,
                isSaving && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons
                  name={isEditing ? "checkmark" : "add"}
                  size={20}
                  color={COLORS.white}
                />
              )}

              <Text style={styles.submitButtonText}>
                {isSaving
                  ? "Enregistrement..."
                  : isEditing
                    ? "Enregistrer"
                    : "Créer le produit"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
}

/**
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  container: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: COLORS.neutral,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  /**
   * ==========================================================
   * HEADER
   * ==========================================================
   */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3E8",
  },

  headerTexts: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    lineHeight: 17,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  /**
   * ==========================================================
   * CONTENT
   * ==========================================================
   */

  scrollView: {
    flexGrow: 0,
  },

  content: {
    padding: 20,
    paddingBottom: 28,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderRadius: 14,
    marginBottom: 18,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F6CACA",
  },

  errorText: {
    flex: 1,
    marginLeft: 9,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.error,
    lineHeight: 18,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  field: {
    marginBottom: 18,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: {
    marginBottom: 8,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  required: {
    color: COLORS.error,
  },

  unitBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#EAF3E8",
  },

  unitBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: COLORS.primary,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  inputError: {
    borderColor: COLORS.error,
    backgroundColor: "#FFF9F9",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  inputSuffix: {
    marginLeft: 8,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  textAreaContainer: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  textArea: {
    minHeight: 118,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 13,
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: COLORS.text,
    lineHeight: 22,
  },

  fieldFooter: {
    minHeight: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 5,
  },

  fieldError: {
    marginTop: 7,
    fontFamily: fonts.medium,
    fontSize: fontSizes.small,
    color: COLORS.error,
  },

  counter: {
    alignSelf: "flex-end",
    marginTop: 5,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: COLORS.Gray,
  },

  helperText: {
    marginBottom: 10,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
    lineHeight: 17,
  },

  helperTextSmall: {
    marginTop: 7,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.Gray,
    lineHeight: 17,
  },

  /**
   * ==========================================================
   * IMAGE - CREATION
   * ==========================================================
   */

  imagePicker: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    backgroundColor: "#F7FBF6",
  },

  imagePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3E8",
  },

  imagePickerTexts: {
    flex: 1,
    marginLeft: 12,
  },

  imagePickerTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.text,
  },

  imagePickerSubtitle: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: fontSizes.small,
    color: COLORS.Gray,
  },

  selectedImageWrapper: {
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.background,
    position: "relative",
  },

  selectedImage: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 8,
  },

  imageActionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },

  removeImageButton: {
    backgroundColor: COLORS.error,
  },

  /**
   * ==========================================================
   * IMAGE - EDITION
   * ==========================================================
   */

  imageManagementBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  imagePreviewContainer: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.background,
  },

  imagePreview: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  imageManagementContent: {
    flex: 1,
    marginLeft: 12,
  },

  imageManagementTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  imageManagementText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.Gray,
    lineHeight: 17,
  },

  /**
   * ==========================================================
   * INFO
   * ==========================================================
   */

  infoBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFF7E8",
    borderWidth: 1,
    borderColor: "#F8DDA9",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0D2",
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.small,
    color: COLORS.text,
  },

  infoText: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 18,
  },

  /**
   * ==========================================================
   * FOOTER
   * ==========================================================
   */

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  cancelButton: {
    flex: 0.8,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },

  cancelButtonText: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.medium,
    color: COLORS.darkGray,
  },

  submitButton: {
    flex: 1.2,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.medium,
    color: COLORS.white,
  },

  disabledButton: {
    opacity: 0.5,
  },
});
