import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";
import { client } from "./orpc";

/**
 * Download a sticker image to a temporary cache location
 * @param stickerUrl The URL of the sticker to download
 * @param stickerId Unique identifier for the sticker
 * @returns The local file URI of the downloaded sticker
 */
async function downloadStickerToCache(
	stickerUrl: string,
	stickerId: string,
): Promise<string> {
	const tempUri = `${FileSystem.cacheDirectory}sticker_${stickerId}.webp`;

	const downloadResult = await FileSystem.downloadAsync(stickerUrl, tempUri);

	if (!downloadResult || !downloadResult.uri) {
		throw new Error("Failed to download sticker image");
	}

	return downloadResult.uri;
}

/**
 * Copy a single sticker image directly to the system clipboard.
 * Reads the downloaded WebP file as base64 and places it on the clipboard
 * so users can paste the image into any app.
 *
 * @param stickerUrl The URL of the sticker to copy
 * @param stickerId Unique identifier for the sticker
 */
export async function copyStickerToClipboard(
	stickerUrl: string,
	stickerId: string,
): Promise<void> {
	try {
		const localUri = await downloadStickerToCache(stickerUrl, stickerId);

		const base64 = await FileSystem.readAsStringAsync(localUri, {
			encoding: FileSystem.EncodingType.Base64,
		});

		await Clipboard.setImageAsync(base64);
	} catch (error) {
		throw new Error(
			`Failed to copy sticker: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Share a single sticker to WhatsApp
 * Opens the native share sheet which can be filtered to WhatsApp or used directly
 *
 * @param stickerUrl The URL of the sticker to share
 * @param stickerId Unique identifier for the sticker
 * @param stickerName Optional name for the sticker
 */
export async function shareStickerToWhatsApp(
	stickerUrl: string,
	stickerId: string,
	stickerName?: string,
): Promise<void> {
	try {
		const localUri = await downloadStickerToCache(stickerUrl, stickerId);

		// Check if WhatsApp is available for sharing
		const canShare = await Sharing.isAvailableAsync();
		if (!canShare) {
			throw new Error("Sharing is not available on this device");
		}

		// Use native sharing to open the share menu
		// User can then select WhatsApp from the available apps
		await Sharing.shareAsync(localUri, {
			mimeType: "image/webp",
			dialogTitle: stickerName || "Share Sticker",
		});
	} catch (error) {
		throw new Error(
			`Failed to share sticker: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * Download a single sticker to the device's photo gallery
 * Requests necessary permissions and saves the sticker as a media asset
 *
 * @param stickerUrl The URL of the sticker to download
 * @param stickerId Unique identifier for the sticker
 * @param stickerName Optional name for the sticker
 */
export async function downloadSingleSticker(
	stickerUrl: string,
	stickerId: string,
	stickerName?: string,
): Promise<void> {
	try {
		// Request storage permissions
		const permission = await MediaLibrary.requestPermissionsAsync();
		if (!permission.granted) {
			throw new Error("Storage permission is required to save stickers to your gallery");
		}

		// Download sticker to cache
		const localUri = await downloadStickerToCache(stickerUrl, stickerId);

		// Create asset in gallery
		const asset = await MediaLibrary.createAssetAsync(localUri);

		// Create or get the "Slap Stickers" album
		const albums = await MediaLibrary.getAlbumsAsync();
		let album = albums.find((a) => a.title === "Slap Stickers");

		if (!album) {
			album = await MediaLibrary.createAlbumAsync("Slap Stickers", asset, false);
		} else {
			await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
		}

		// Track the download
		await client.download.trackDownload({ packId: stickerId });
	} catch (error) {
		throw new Error(
			`Failed to download sticker: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
