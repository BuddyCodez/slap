import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";
import { client } from "./orpc";

/**
 * Download an entire sticker pack to the device's real system Gallery app.
 * Automatically requests permissions and tracks the operation via the API.
 */
export function downloadPackToGallery(packId: string): Promise<void> {
	// 1. Request system gallery write permissions first
	return (
		MediaLibrary.requestPermissionsAsync()
			.then((permission) => {
				if (!permission.granted) {
					return Promise.reject(
						new Error(
							"Storage permission is required to save stickers to your gallery",
						),
					);
				}

				// 2. Fetch the sticker bundle metadata from your server API
				return client.download.getWhatsappBundle({ packId });
			})
			.then((bundle) => {
				if (!bundle || !bundle.stickers || bundle.stickers.length === 0) {
					return Promise.reject(
						new Error("Pack has no stickers or failed to fetch bundle"),
					);
				}

				const packName = bundle.name || "Slap Stickers";

				// 3. Process every sticker asset sequentially or in batch
				const downloadAndSavePromises = bundle.stickers.map((sticker, i) => {
					if (!sticker.url) {
						return Promise.reject(
							new Error(`Sticker ${i} has no valid remote URL`),
						);
					}

					// Save temporarily inside your app's internal cache folder
					const tempCacheUri = `${FileSystem.cacheDirectory}temp_sticker_${packId}_${i}.webp`;

					return FileSystem.downloadAsync(sticker.url, tempCacheUri).then(
						(downloadResult) => {
							// Save the asset out of the sandbox directly into the system Camera Roll/Gallery
							return MediaLibrary.createAssetAsync(downloadResult.uri);
						},
					);
				});

				return Promise.all(downloadAndSavePromises).then((assets) => {
					// 4. Create a dedicated album named after the sticker pack in the Gallery app
					return MediaLibrary.createAlbumAsync(packName, assets[0], false).then(
						(album) => {
							// If the album already exists, group the remaining assets into it smoothly
							if (assets.length > 1) {
								const remainingAssets = assets.slice(1);
								return MediaLibrary.addAssetsToAlbumAsync(
									remainingAssets,
									album,
									false,
								);
							}
						},
					);
				});
			})
			// 5. Track successful bundle analytics down your network pipeline
			.then(() => client.download.trackDownload({ packId }))
			.then(() =>
				console.log(
					"Sticker pack successfully exported into device gallery app",
				),
			)
	);
}
