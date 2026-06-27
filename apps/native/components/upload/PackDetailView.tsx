import {
	Alert,
	Image,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
	Plus,
	Trash2,
	ChevronLeft,
} from "lucide-react-native";
import { StyleSheet } from "react-native-unistyles";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSequence,
	withSpring,
} from "react-native-reanimated";
import { Pressable } from "react-native";

import { DotMatrixLoader } from "@/components/ui/DotMatrixLoader";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const PlusIcon = Plus as any;
const TrashIcon = Trash2 as any;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PackDetailViewProps {
	packId: string;
	onBack: () => void;
	onDeleteSuccess: () => void;
}

export function PackDetailView({ packId, onBack, onDeleteSuccess }: PackDetailViewProps) {
	const queryClient = useQueryClient();
	const [isUploading, setIsUploading] = useState(false);
	const backScale = useSharedValue(1);

	const { data: activePackDetails, isLoading: isLoadingDetails, refetch: refetchDetails } =
		useQuery(
			orpc.packs.getStatus.queryOptions({
				input: { packId },
			})
		);

	const deletePackMutation = useMutation(
		orpc.packs.delete.mutationOptions({
			onSuccess: () => {
				Alert.alert("DELETED", "Sticker pack deleted successfully.");
				queryClient.invalidateQueries({ queryKey: orpc.packs.myPacks.key() });
				queryClient.invalidateQueries({ queryKey: orpc.packs.list.key() });
				queryClient.invalidateQueries({ queryKey: orpc.packs.trending.key() });
				onDeleteSuccess();
			},
			onError: (err: any) => {
				Alert.alert("ERROR", err.message || "Failed to delete pack.");
			},
		})
	);

	const deleteStickerMutation = useMutation(
		orpc.stickers.delete.mutationOptions({
			onSuccess: () => {
				Alert.alert("DELETED", "Sticker deleted.");
				refetchDetails();
				queryClient.invalidateQueries({ queryKey: orpc.packs.myPacks.key() });
			},
			onError: (err: any) => {
				Alert.alert("ERROR", err.message || "Failed to delete sticker.");
			},
		})
	);

	const handleAddSingleSticker = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: false,
			quality: 0.8,
		});

		if (result.canceled || !result.assets[0]) return;

		setIsUploading(true);
		try {
			const asset = result.assets[0];
			const formData = new FormData();
			formData.append("packId", packId);

			// Fetch the file from the URI and convert to blob
			const fileResponse = await fetch(asset.uri);
			const blob = await fileResponse.blob();
			const filename = asset.fileName || `sticker_${Date.now()}.png`;
			formData.append("sticker", blob, filename);

			const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
			const response = await fetch(`${apiUrl}/api/stickers/add-formdata`, {
				method: "POST",
				headers: {
					...(authClient.getCookie() ? { Cookie: authClient.getCookie() } : {}),
				},
				body: formData,
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to upload sticker");
			}

			Alert.alert("UPLOADED", "Sticker added successfully!");
			refetchDetails();
			queryClient.invalidateQueries({ queryKey: orpc.packs.myPacks.key() });
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Failed to upload sticker";
			Alert.alert("ERROR", msg);
		} finally {
			setIsUploading(false);
		}
	};

	const handleBack = () => {
		backScale.value = withSequence(
			withSpring(0.88, { damping: 10, stiffness: 400 }),
			withSpring(1, { damping: 8, stiffness: 280 }),
		);
		onBack();
	};

	const backAnimStyle = useAnimatedStyle(() => ({
		transform: [{ scale: backScale.value }],
	}));

	return (
		<View style={styles.container}>
			{/* Sticky ISO-style floating back button */}
			<AnimatedPressable style={[styles.floatingBack, backAnimStyle]} onPress={handleBack}>
				<ChevronLeft size={18} color="#FFF500" />
			</AnimatedPressable>

			{isLoadingDetails ? (
				<View style={styles.loadingContainer}>
					<DotMatrixLoader size={48} />
				</View>
			) : activePackDetails ? (
				<ScrollView contentContainerStyle={styles.detailScroll}>
					{/* Spacer for floating button */}
					<View style={{ height: 56 }} />

					<View style={styles.detailHeaderCard}>
						<View style={styles.detailHeaderInfo}>
							<Text style={styles.detailPackName}>{activePackDetails.name.toUpperCase()}</Text>
							<View style={[
								styles.statusBadge,
								activePackDetails.status === "READY" && styles.statusReady,
								activePackDetails.status === "PROCESSING" && styles.statusProcessing,
								activePackDetails.status === "FAILED" && styles.statusFailed,
								{ alignSelf: "flex-start", marginTop: 6 }
							]}>
								<Text style={[
									styles.statusText,
									activePackDetails.status === "READY" && styles.statusReadyText,
									activePackDetails.status === "PROCESSING" && styles.statusProcessingText,
									activePackDetails.status === "FAILED" && styles.statusFailedText
								]}>
									{activePackDetails.status}
								</Text>
							</View>
						</View>

						<TouchableOpacity
							style={styles.deletePackBtn}
							onPress={() => {
								Alert.alert(
									"DELETE PACK?",
									"Are you sure you want to delete this pack? This cannot be undone.",
									[
										{ text: "Cancel", style: "cancel" },
										{
											text: "DELETE",
											style: "destructive",
											onPress: () => deletePackMutation.mutate({ packId }),
										},
									]
								);
							}}
						>
							<TrashIcon size={16} color="#ffffff" />
						</TouchableOpacity>
					</View>

					<View style={styles.detailStickersSection}>
						<View style={styles.stickersSectionHeader}>
							<Text style={styles.sectionSubTitle}>STICKERS ({activePackDetails.stickers.length})</Text>
							<TouchableOpacity
								style={styles.addStickerActionBtn}
								onPress={handleAddSingleSticker}
								disabled={isUploading}
							>
								{isUploading ? (
									<DotMatrixLoader color="#000000" size={16} />
								) : (
									<>
										<PlusIcon size={14} color="#000000" />
										<Text style={styles.addStickerActionText}>ADD STICKER</Text>
									</>
								)}
							</TouchableOpacity>
						</View>

						<View style={styles.stickersGrid}>
							{activePackDetails.stickers.map((sticker: any) => (
								<View key={sticker.id} style={styles.stickerCard}>
									{sticker.url ? (
										<Image source={{ uri: sticker.url }} style={styles.stickerImage} />
									) : (
										<View style={styles.stickerProcessingPlaceholder}>
											<DotMatrixLoader size={20} />
											<Text style={styles.stickerProcessingText}>COOKING</Text>
										</View>
									)}

									<TouchableOpacity
										style={styles.deleteStickerBtn}
										onPress={() => {
											Alert.alert(
												"DELETE STICKER?",
												"Are you sure you want to delete this sticker?",
												[
													{ text: "Cancel", style: "cancel" },
													{
														text: "DELETE",
														style: "destructive",
														onPress: () => deleteStickerMutation.mutate({ stickerId: sticker.id }),
													},
												]
											);
										}}
									>
										<TrashIcon size={12} color="#ff3b30" />
									</TouchableOpacity>
								</View>
							))}
						</View>
					</View>
				</ScrollView>
			) : (
				<Text style={styles.emptyText}>FAILED TO LOAD PACK DETAILS.</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
	},
	// ─── Sticky ISO-style floating back ──────────────────────────────────────────
	floatingBack: {
		position: "absolute",
		top: 12,
		left: 8,
		zIndex: 100,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#111111",
		borderWidth: 1.5,
		borderColor: "#333333",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000000",
		shadowOpacity: 0.6,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 8,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 200,
	},
	emptyText: {
		color: "#707070",
		fontWeight: "900",
		fontSize: 12,
		textAlign: "center",
	},
	detailScroll: {
		gap: 16,
		paddingBottom: 32,
	},
	detailHeaderCard: {
		backgroundColor: "#1A1A1A",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 0,
		padding: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		shadowOffset: { width: 4, height: 4 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 4,
	},
	detailHeaderInfo: {
		flex: 1,
		gap: 2,
	},
	detailPackName: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: 0.8,
	},
	statusBadge: {
		borderWidth: 1.5,
		borderColor: "#000000",
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	statusText: {
		fontWeight: "900",
		fontSize: 9,
		letterSpacing: 0.5,
	},
	statusReady: {
		backgroundColor: "#34c759",
	},
	statusReadyText: {
		color: "#000000",
	},
	statusProcessing: {
		backgroundColor: "#ffcc00",
	},
	statusProcessingText: {
		color: "#000000",
	},
	statusFailed: {
		backgroundColor: "#ff3b30",
	},
	statusFailedText: {
		color: "#ffffff",
	},
	deletePackBtn: {
		backgroundColor: "#ff3b30",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		shadowOffset: { width: 2, height: 2 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 2,
	},
	detailStickersSection: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		padding: 16,
		gap: 12,
	},
	stickersSectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	sectionSubTitle: {
		color: "#ffffff",
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.8,
	},
	addStickerActionBtn: {
		backgroundColor: "#FFF500",
		borderWidth: 1.5,
		borderColor: "#000000",
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingVertical: 4,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	addStickerActionText: {
		color: "#000000",
		fontSize: 9,
		fontWeight: "900",
	},
	stickersGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	stickerCard: {
		position: "relative",
		width: "22%",
		aspectRatio: 1,
		backgroundColor: "#262626",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	stickerImage: {
		width: "100%",
		height: "100%",
		borderRadius: 0,
	},
	stickerProcessingPlaceholder: {
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	stickerProcessingText: {
		color: "#FFF500",
		fontSize: 7,
		fontWeight: "900",
	},
	deleteStickerBtn: {
		position: "absolute",
		bottom: 2,
		right: 2,
		backgroundColor: "#000000",
		borderWidth: 1,
		borderColor: "#ff3b30",
		borderRadius: 0,
		width: 18,
		height: 18,
		alignItems: "center",
		justifyContent: "center",
	},
}));
