import { fetch } from "expo/fetch";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import RNWhatsAppStickers from "react-native-wa-stickers-animated";
import { client } from "./orpc";

/**
 * Add an entire sticker pack to WhatsApp
 * Downloads all sticker files, creates a sticker pack, and adds it to WhatsApp
 * Uses the native react-native-wa-stickers-animated module for proper integration
 *
 * NOTE: On Android, this requires the sticker pack to be pre-configured in contents.json
 * The send(identifier, name) method references pre-bundled packs, not runtime downloads.
 * For dynamic sticker packs on Android, the library's prepare() and addOne() methods
 * would be needed, which have complex native signatures.
 */
export async function addPackToWhatsApp(packId: string): Promise<void> {
	try {
		// Fetch the sticker bundle data from the API
		const bundle = await client.download.getWhatsappBundle({ packId });

		if (!bundle || !bundle.stickers || bundle.stickers.length === 0) {
			throw new Error("Pack has no stickers or failed to fetch bundle");
		}

		// Add sticker pack using the react-native-whatsapp-stickers API
		try {
			if (Platform.OS === "ios") {
				// iOS: Create pack, add stickers, then send
				// First create the pack metadata
				try {
					await RNWhatsAppStickers.createStickerPack({
						identifier: packId,
						name: bundle.name || "Sticker Pack",
						publisher: "Slap",
						trayImageFileName: bundle.trayImageUrl || "",
						publisherEmail: "contact@slap.app",
						publisherWebsite: "https://slap.app",
						privacyPolicyWebsite: "https://slap.app/privacy",
						licenseAgreementWebsite: "https://slap.app/license",
					});
				} catch (e) {
					throw new Error(
						`iOS createStickerPack failed: ${e instanceof Error ? e.message : String(e)}`,
					);
				}

				// Add each sticker from the API URLs
				for (let i = 0; i < bundle.stickers.length; i++) {
					const sticker = bundle.stickers[i];
					if (!sticker.url) {
						throw new Error(`Sticker ${i} has no URL`);
					}
					try {
						// Note: iOS implementation may need to handle URLs differently
						await RNWhatsAppStickers.addSticker(sticker.url, ["😂"]);
					} catch (e) {
						throw new Error(
							`iOS addSticker(${i}) failed: ${e instanceof Error ? e.message : String(e)}`,
						);
					}
				}

				try {
					await RNWhatsAppStickers.send();
				} catch (e) {
					throw new Error(
						`iOS send failed: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
			} else {
				// Android: Use prepare() to handle dynamic downloads
				// The native module will download stickers from the provided URLs
				const stickersWithValidUrls = bundle.stickers.filter((s) => s.url);
				if (stickersWithValidUrls.length === 0) {
					throw new Error("No stickers have valid URLs");
				}

				const prepareConfig = {
					identifier: packId.replace(/\./g, "_"), // Remove dots to avoid WhatsApp issues
					name: bundle.name || "Sticker Pack",
					publisher: "Slap",
					tray_image_file: bundle.trayImageUrl || "",
					publisher_email: "contact@slap.app",
					publisher_website: "https://slap.app",
					privacy_policy_website: "https://slap.app/privacy",
					license_agreement_website: "https://slap.app/license",
					image_data_version: "1",
					avoid_cache: false,
					animated_sticker_pack: false,
					stickers: stickersWithValidUrls.map((sticker) => ({
						image_file: sticker.url,
						emojis: ["😂"],
					})),
				};

				try {
					await RNWhatsAppStickers.prepare(JSON.stringify(prepareConfig));
				} catch (e) {
					throw new Error(
						`Android prepare failed: ${e instanceof Error ? e.message : String(e)}`,
					);
				}

				try {
					// After prepare() downloads the images, send the pack
					await RNWhatsAppStickers.send(
						packId.replace(/\./g, "_"),
						bundle.name || "Sticker Pack",
					);
				} catch (e) {
					throw new Error(
						`Android send failed: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
			}
		} catch (error) {
			throw new Error(
				`Failed to add sticker pack to WhatsApp: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	} catch (error) {
		throw error;
	}
}
