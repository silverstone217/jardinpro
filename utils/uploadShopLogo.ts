import { supabase } from "@/lib/supabase";
import { File } from "expo-file-system";

export const uploadShopLogo = async (
  uri: string,
  shopId: string,
): Promise<string> => {
  try {
    // 1. Instancier le fichier avec la nouvelle API File
    const file = new File(uri);

    // 2. Récupérer les octets directement sous forme de Uint8Array / ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("IMAGE_READ_FAILED");
    }

    // 3. Chemin unique dans le bucket
    const filePath = `shops/${shopId}/logo.jpg`;

    // 4. Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("jardinPro")
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw uploadError;
    }

    // 5. Récupérer l'URL publique
    const { data } = supabase.storage.from("jardinPro").getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("LOGO_URL_NOT_FOUND");
    }

    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    console.error("Logo upload error:", error);
    throw new Error("LOGO_UPLOAD_FAILED");
  }
};
