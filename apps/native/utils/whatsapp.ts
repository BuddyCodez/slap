import * as FileSystem from "expo-file-system/legacy";
import { fetch } from "expo/fetch";
import { Platform } from "react-native";
import RNWhatsAppStickers from "react-native-wa-stickers-animated";
import { client } from "./orpc";

/**
 * Add an entire sticker pack to WhatsApp
 * Downloads all sticker files, creates a sticker pack, and adds it to WhatsApp
 * Uses the native react-native-wa-stickers-animated module for proper integration
 */
export async function addPackToWhatsApp(packId: string): Promise<void> {
  try {
    // Fetch the sticker bundle data from the API
    const bundle = await client.download.getWhatsappBundle({ packId });

    if (!bundle || !bundle.stickers || bundle.stickers.length === 0) {
      throw new Error("Pack has no stickers or failed to fetch bundle");
    }

    // Create directory for this pack's stickers in cache
    const packDir = `${FileSystem.cacheDirectory}whatsapp_packs/${packId}/`;
    await FileSystem.makeDirectoryAsync(packDir, { intermediates: true });

    // Download all sticker files locally
    for (let i = 0; i < bundle.stickers.length; i++) {
      const sticker = bundle.stickers[i];
      if (!sticker.url) {
        throw new Error(`Sticker ${i} has no URL`);
      }
      const stickerPath = `${packDir}sticker${i}.webp`;
      const response = await fetch(sticker.url);
      if (!response.ok) {
        throw new Error(`Failed to download sticker ${i}: ${response.statusText}`);
      }
      const bytes = await response.bytes();
      await FileSystem.writeAsStringAsync(stickerPath, bytes as any, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    // Download tray icon if available
    if (bundle.trayImageUrl) {
      try {
        const response = await fetch(bundle.trayImageUrl);
        if (response.ok) {
          const bytes = await response.bytes();
          const trayPath = `${packDir}tray.webp`;
          await FileSystem.writeAsStringAsync(trayPath, bytes as any, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      } catch {
        // Tray icon is optional, continue if it fails
      }
    }

    // Add sticker pack using the react-native-whatsapp-stickers API
    try {
      // Step 1: Create the sticker pack
      await RNWhatsAppStickers.createStickerPack({
        identifier: packId,
        name: bundle.name || "Sticker Pack",
        publisher: "Slap",
        trayImageFileName: "tray.webp",
        publisherEmail: "contact@slap.app",
        publisherWebsite: "https://slap.app",
        privacyPolicyWebsite: "https://slap.app/privacy",
        licenseAgreementWebsite: "https://slap.app/license",
      });

      // Step 2: Add each sticker to the pack
      for (let i = 0; i < bundle.stickers.length; i++) {
        await RNWhatsAppStickers.addSticker(`sticker${i}.webp`, ["😂"]);
      }

      // Step 3: Send the pack to WhatsApp
      if (Platform.OS === "ios") {
        await RNWhatsAppStickers.send();
      } else {
        await RNWhatsAppStickers.send(packId, bundle.name || "Sticker Pack");
      }
    } catch (error) {
      throw new Error(
        `Failed to add sticker pack to WhatsApp: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Clean up temporary directory
    try {
      await FileSystem.deleteAsync(packDir);
    } catch {
      // Cleanup is best-effort
    }
  } catch (error) {
    throw error;
  }
}
