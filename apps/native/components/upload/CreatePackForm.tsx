import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import {
	Check,
	ChevronRight,
	Image as ImageIcon,
	Plus,
	Tag,
	Upload,
	X,
} from "lucide-react-native";
import { useState } from "react";
import {
	Alert,
	Image,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ButtonSkeleton } from "@/components/ui/button-skeleton";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

// Bypass incorrect web-type resolution of Lucide icons on React Native
const PlusIcon = Plus as any;
const UploadIcon = Upload as any;
const CheckIcon = Check as any;
const XIcon = X as any;
const ImageIconComponent = ImageIcon as any;
const TagIcon = Tag as any;
const ChevronRightIcon = ChevronRight as any;

interface CreatePackFormProps {
	onSuccess: () => void;
	tags: string[];
	onTagsChange: (tags: string[]) => void;
	onOpenTagsSheet: () => void;
}

export function CreatePackForm({
	onSuccess,
	tags,
	onTagsChange,
	onOpenTagsSheet,
}: CreatePackFormProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("");
	const [categoryInput, setCategoryInput] = useState("");
	const [selectedImages, setSelectedImages] = useState<
		ImagePicker.ImagePickerAsset[]
	>([]);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);

	const queryClient = useQueryClient();

	const { data: categories = [] } = useQuery(
		orpc.categories.list.queryOptions(),
	);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const pickImages = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"PERMISSION DENIED",
				"We need library permissions to pick stickers!",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: true,
			selectionLimit: 30,
			quality: 0.8,
		});

		if (!result.canceled) {
			const validAssets = [];
			const invalidAssets: { fileName: string; reason: string }[] = [];

			for (const asset of result.assets) {
				const maxFileSize = 2 * 1024 * 1024; // 2MB
				const fileSize = asset.fileSize || 0;

				if (fileSize > maxFileSize && fileSize > 0) {
					invalidAssets.push({
						fileName: asset.fileName || "Unknown",
						reason: `File too large (${(fileSize / 1024 / 1024).toFixed(2)}MB, max 2MB)`,
					});
				} else {
					validAssets.push(asset);
				}
			}

			if (validAssets.length > 0) {
				setSelectedImages((prev) => [...prev, ...validAssets]);
			}

			if (invalidAssets.length > 0) {
				const invalidList = invalidAssets
					.map((a) => `• ${a.fileName}: ${a.reason}`)
					.join("\n");
				Alert.alert(
					`${invalidAssets.length} FILE${invalidAssets.length > 1 ? "S" : ""} REJECTED`,
					`${validAssets.length > 0 ? `${validAssets.length} file(s) added.\n\n` : ""}${invalidList}`,
				);
			}
		}
	};

	const handleCreatePack = async () => {
		if (!name.trim()) {
			setErrorMsg("Pack name is required!");
			return;
		}
		if (selectedImages.length === 0) {
			setErrorMsg("Add at least 1 sticker!");
			return;
		}

		setErrorMsg(null);
		setIsSubmitting(true);

		try {
			const formData = new FormData();
			formData.append("name", name);
			formData.append("description", description.trim() || "");
			formData.append("category", category || "");
			formData.append("tags", JSON.stringify(tags));

			// Add sticker files to FormData as base64 strings
			// React Native FormData doesn't support Blob/File objects
			const failedFiles: string[] = [];
			for (let i = 0; i < selectedImages.length; i++) {
				const asset = selectedImages[i];
				const filename =
					asset.fileName ||
					`sticker_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;

				try {
					// Read file as base64
					const base64 = await FileSystem.readAsStringAsync(asset.uri, {
						encoding: FileSystem.EncodingType.Base64,
					});

					// Append as JSON object with base64 data and metadata
					const fileData = JSON.stringify({
						data: base64,
						name: filename,
						type: asset.type || "image/png",
					});

					formData.append("stickers", fileData);
				} catch (readError: unknown) {
					const readErrorMsg =
						readError instanceof Error
							? readError.message
							: "Unknown error reading file";
					failedFiles.push(`${filename} (${readErrorMsg})`);
				}
			}

			if (failedFiles.length === selectedImages.length) {
				setErrorMsg("Failed to read all selected files!");
				return;
			}

			if (failedFiles.length > 0) {
				const failureMsg = failedFiles.join("\n");
				Alert.alert(
					`${failedFiles.length} FILE${failedFiles.length > 1 ? "S" : ""} FAILED TO READ`,
					`${selectedImages.length - failedFiles.length} file(s) will be uploaded.\n\nFailed:\n${failureMsg}`,
				);
			}

			const apiUrl =
				process.env.EXPO_PUBLIC_SERVER_URL || "http://192.168.1.14:3000";

			if (!apiUrl) {
				setErrorMsg("Server URL not configured!");
				return;
			}

			const uploadResponse = await fetch(
				`${apiUrl}/api/packs/create-formdata`,
				{
					method: "POST",
					headers: {
						...(authClient.getCookie()
							? { Cookie: authClient.getCookie() }
							: {}),
					},
					body: formData,
				},
			);

			if (!uploadResponse.ok) {
				let errorMessage = `Upload failed with status ${uploadResponse.status}`;
				try {
					const result = await uploadResponse.json();
					errorMessage = result.error || errorMessage;
				} catch {
					// If response is not JSON, use status-based message
				}
				throw new Error(errorMessage);
			}

			const result = await uploadResponse.json();
			setSuccessMsg("PACK CREATED! COOKING STARTED IN BACKGROUND ⚡");
			setName("");
			setDescription("");
			setCategory("");
			setCategoryInput("");
			onTagsChange([]);
			setSelectedImages([]);
			queryClient.invalidateQueries({ queryKey: orpc.packs.myPacks.key() });
			queryClient.invalidateQueries({ queryKey: orpc.packs.list.key() });
			queryClient.invalidateQueries({ queryKey: orpc.packs.trending.key() });
			queryClient.invalidateQueries({ queryKey: orpc.categories.list.key() });
			setTimeout(() => setSuccessMsg(null), 3000);
			onSuccess();
		} catch (e: unknown) {
			const errorMsg =
				e instanceof Error ? e.message : "Failed to prepare images for upload!";
			setErrorMsg(errorMsg);
			setTimeout(() => setErrorMsg(null), 5000);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View style={styles.container}>
			{errorMsg && (
				<View style={styles.errorBanner}>
					<XIcon size={16} color="#ffffff" />
					<Text style={styles.errorText}>{errorMsg.toUpperCase()}</Text>
				</View>
			)}
			{successMsg && (
				<View style={styles.successBanner}>
					<CheckIcon size={16} color="#000000" />
					<Text style={styles.successText}>{successMsg}</Text>
				</View>
			)}

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.sectionTitle}>COOK A NEW PACK</Text>

				{/* Pack Name */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>PACK NAME *</Text>
					<TextInput
						style={styles.textInput}
						placeholder="e.g. Brainrot Core"
						placeholderTextColor="#707070"
						value={name}
						onChangeText={setName}
					/>
				</View>

				{/* Description */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>DESCRIPTION</Text>
					<TextInput
						style={[styles.textInput, styles.textArea]}
						placeholder="What is this pack about?"
						placeholderTextColor="#707070"
						multiline
						numberOfLines={3}
						value={description}
						onChangeText={setDescription}
					/>
				</View>

				{/* Category */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>CATEGORY (OPTIONAL)</Text>
					<TextInput
						style={styles.textInput}
						placeholder="e.g. memes, anime, coding..."
						placeholderTextColor="#707070"
						value={categoryInput}
						onChangeText={(val) => {
							setCategoryInput(val);
							setCategory(val.toLowerCase().trim());
						}}
						autoCapitalize="none"
						autoCorrect={false}
					/>
					{categories.length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoryChipRow}
						>
							{categories.map((cat) => (
								<TouchableOpacity
									key={cat.id}
									style={[
										styles.categoryChip,
										category === cat.name && styles.activeCategoryChip,
									]}
									onPress={() => {
										const next = category === cat.name ? "" : cat.name;
										setCategory(next);
										setCategoryInput(next);
									}}
								>
									<Text
										style={[
											styles.categoryChipText,
											category === cat.name && styles.activeCategoryChipText,
										]}
									>
										{cat.name.toUpperCase()}
									</Text>
								</TouchableOpacity>
							))}
						</ScrollView>
					)}
				</View>

				{/* Tags */}
				<View style={styles.inputGroup}>
					<Text style={styles.label}>TAGS</Text>
					<TouchableOpacity style={styles.tagsBtn} onPress={onOpenTagsSheet}>
						<TagIcon size={16} color="#FFF500" />
						<Text style={styles.tagsBtnText}>
							{tags.length > 0
								? `${tags.length} TAG${tags.length > 1 ? "S" : ""}`
								: "ADD TAGS..."}
						</Text>
						<ChevronRightIcon size={16} color="#707070" />
					</TouchableOpacity>
				</View>

				{/* Selected Stickers Preview */}
				<View style={styles.inputGroup}>
					<View style={styles.stickerHeaderRow}>
						<Text style={styles.label}>
							STICKERS ({selectedImages.length}/30) *
						</Text>
						{selectedImages.length > 0 && (
							<TouchableOpacity onPress={() => setSelectedImages([])}>
								<Text style={styles.clearText}>CLEAR ALL</Text>
							</TouchableOpacity>
						)}
					</View>

					{selectedImages.length > 0 ? (
						<View style={styles.selectedGrid}>
							{selectedImages.map((img, idx) => (
								<View key={idx} style={styles.selectedImageContainer}>
									<Image
										source={{ uri: img.uri }}
										style={styles.selectedImage}
									/>
									<TouchableOpacity
										style={styles.deleteStickerBadge}
										onPress={() =>
											setSelectedImages((prev) =>
												prev.filter((_, i) => i !== idx),
											)
										}
									>
										<XIcon size={10} color="#ffffff" />
									</TouchableOpacity>
								</View>
							))}
							{selectedImages.length < 30 && (
								<TouchableOpacity
									style={styles.addStickerGridBtn}
									onPress={pickImages}
								>
									<PlusIcon size={24} color="#FFF500" />
								</TouchableOpacity>
							)}
						</View>
					) : (
						<TouchableOpacity style={styles.pickerArea} onPress={pickImages}>
							<ImageIconComponent size={32} color="#FFF500" />
							<Text style={styles.pickerTitle}>SELECT IMAGE FILES</Text>
							<Text style={styles.pickerSub}>
								WEBP, PNG, GIF · UP TO 30 STICKERS · 2MB EACH
							</Text>
						</TouchableOpacity>
					)}
				</View>

				{/* Submit button */}
				<TouchableOpacity
					style={[styles.submitButton, isSubmitting && styles.disabledButton]}
					onPress={handleCreatePack}
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<ButtonSkeleton size="medium" />
					) : (
						<>
							<Text style={styles.submitButtonText}>COOK STICKER PACK ⚡</Text>
							<UploadIcon size={18} color="#000000" />
						</>
					)}
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
	},
	errorBanner: {
		backgroundColor: "#ff3b30",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		padding: 12,
		marginHorizontal: 16,
		marginTop: 16,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
	},
	errorText: {
		color: "#ffffff",
		fontWeight: "bold",
		fontSize: 12,
		flex: 1,
	},
	successBanner: {
		backgroundColor: "#FFF500",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		padding: 12,
		marginHorizontal: 16,
		marginTop: 16,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
	},
	successText: {
		color: "#000000",
		fontWeight: "bold",
		fontSize: 12,
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 16,
	},
	sectionTitle: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: 1.2,
		marginBottom: 8,
	},
	inputGroup: {
		gap: 6,
	},
	label: {
		color: "#FFF500",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1,
	},
	textInput: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		padding: 12,
		color: "#ffffff",
		fontFamily: "System",
		fontSize: 14,
		shadowOffset: { width: 2, height: 2 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	categoryRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 4,
		marginBottom: 8,
	},
	categoryChipRow: {
		gap: 8,
		marginTop: 8,
	},
	categoryChip: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	activeCategoryChip: {
		backgroundColor: "#FFF500",
	},
	categoryChipText: {
		color: "#707070",
		fontSize: 10,
		fontWeight: "900",
	},
	activeCategoryChipText: {
		color: "#000000",
	},
	tagsBtn: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		padding: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	tagsBtnText: {
		flex: 1,
		color: "#ffffff",
		fontSize: 13,
		fontWeight: "700",
	},
	stickerHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	clearText: {
		color: "#ff3b30",
		fontSize: 10,
		fontWeight: "900",
	},
	pickerArea: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "#FFF500",
		borderRadius: 0,
		paddingVertical: 32,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	pickerTitle: {
		color: "#ffffff",
		fontWeight: "900",
		fontSize: 13,
	},
	pickerSub: {
		color: "#707070",
		fontSize: 10,
		fontWeight: "bold",
	},
	selectedGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		backgroundColor: "#1A1A1A",
		padding: 12,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
	},
	selectedImageContainer: {
		position: "relative",
		width: 60,
		height: 60,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		backgroundColor: "#262626",
	},
	selectedImage: {
		width: "100%",
		height: "100%",
		borderRadius: 0,
	},
	deleteStickerBadge: {
		position: "absolute",
		top: -6,
		right: -6,
		backgroundColor: "#ff3b30",
		borderWidth: 1.5,
		borderColor: "#000000",
		borderRadius: 0,
		width: 16,
		height: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	addStickerGridBtn: {
		width: 60,
		height: 60,
		backgroundColor: "#000000",
		borderWidth: 2,
		borderStyle: "dashed",
		borderColor: "#FFF500",
		borderRadius: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	submitButton: {
		backgroundColor: "#FFF500",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 0,
		paddingVertical: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		shadowOffset: { width: 4, height: 4 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 4,
		marginTop: 8,
	},
	disabledButton: {
		opacity: 0.5,
	},
	submitButtonText: {
		color: "#000000",
		fontWeight: "900",
		fontSize: 14,
	},
}));
