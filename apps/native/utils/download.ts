import * as FileSystem from "expo-file-system/legacy";
import { client } from "./orpc";

/**
 * Download an entire sticker pack to the device's Pictures directory.
 * Stickers will appear in the Photos/Gallery app automatically.
 * Also tracks the download via the API.
 */
export async function downloadPackToGallery(packId: string): Promise<void> {
  try {
    // Fetch the sticker bundle data from the API
    const bundle = await client.download.getWhatsappBundle({ packId });

    if (!bundle || !bundle.stickers || bundle.stickers.length === 0) {
      throw new Error("Pack has no stickers or failed to fetch bundle");
    }

    // Create directory in Pictures folder for this pack
    // On Android, files in Pictures folder appear in Gallery/Photos app
    const picturesDir = `${FileSystem.documentDirectory}Pictures/slap_stickers/${packId}/`;
    await FileSystem.makeDirectoryAsync(picturesDir, { intermediates: true });

    // Download all sticker files to Pictures directory
    for (let i = 0; i < bundle.stickers.length; i++) {
      const sticker = bundle.stickers[i];
      if (!sticker.url) {
        throw new Error(`Sticker ${i} has no URL`);
      }

      const stickerPath = `${picturesDir}sticker_${i}.webp`;
      await FileSystem.downloadAsync(sticker.url, stickerPath);
    }

    // Track download via API
    await client.download.trackDownload({ packId });
  } catch (error) {
    throw error;
  }
}
