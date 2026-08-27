import { File } from "expo-file-system";

import { supabase } from "@/lib/supabase";

export const uploadProfileImage = async (
  uri: string,
  userId: string,
): Promise<string> => {
  try {
    // ============================================================
    // 1. Instancier le fichier
    // ============================================================

    const file = new File(uri);

    // ============================================================
    // 2. Lire le fichier sous forme de ArrayBuffer
    // ============================================================

    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("IMAGE_READ_FAILED");
    }

    // ============================================================
    // 3. Chemin de l'image dans Supabase Storage
    // ============================================================

    const filePath = `profile/image/${userId}.jpg`;

    // ============================================================
    // 4. Upload
    // ============================================================

    const { error: uploadError } = await supabase.storage
      .from("jardinPro")
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase profile image upload error:", uploadError);
      throw uploadError;
    }

    // ============================================================
    // 5. Récupérer l'URL publique
    // ============================================================

    const { data } = supabase.storage.from("jardinPro").getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("PROFILE_IMAGE_URL_NOT_FOUND");
    }

    // Cache busting :
    // permet au téléphone de ne pas conserver l'ancienne image
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("Profile image upload error:", error);

    throw new Error("PROFILE_IMAGE_UPLOAD_FAILED");
  }
};
