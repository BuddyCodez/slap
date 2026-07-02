import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ButtonSkeleton } from "@/components/ui/button-skeleton";
import { Screen } from "@/components/ui/screen";
import { StickerActionSheet } from "@/components/ui/sticker-action-sheet";
import { downloadPackToGallery } from "@/utils/download";
import { formatCount } from "@/utils/format";
import { orpc, queryClient } from "@/utils/orpc";
import { addPackToWhatsApp } from "@/utils/whatsapp";
import {
	copyStickerToClipboard,
	downloadSingleSticker,
	shareStickerToWhatsApp,
} from "@/utils/sticker-actions";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

type Sticker = { id: string; url?: string };

export default function PackDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [isSaved, setIsSaved] = useState(false);
	const [downloadFeedback, setDownloadFeedback] = useState(false);
	const [whatsappFeedback, setWhatsappFeedback] = useState(false);
	const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null);
	const [actionSheetVisible, setActionSheetVisible] = useState(false);

	const { data: pack, isLoading } = useQuery({
		...orpc.packs.get.queryOptions({ input: { packId: id || "" } }),
		enabled: !!id,
	});

	const saveMutation = useMutation({
		...orpc.saves.save.mutationOptions(),
		onSuccess: () => {
			setIsSaved(true);
			queryClient.invalidateQueries({
				queryKey: orpc.saves.list.queryKey({ input: {} }),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.packs.get.queryKey({ input: { packId: id || "" } }),
			});
		},
	});

	const unsaveMutation = useMutation({
		...orpc.saves.unsave.mutationOptions(),
		onSuccess: () => {
			setIsSaved(false);
			queryClient.invalidateQueries({
				queryKey: orpc.saves.list.queryKey({ input: {} }),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.packs.get.queryKey({ input: { packId: id || "" } }),
			});
		},
	});

	const downloadMutation = useMutation({
		mutationFn: () => downloadPackToGallery(id || ""),
		onSuccess: () => {
			setDownloadFeedback(true);
			setTimeout(() => setDownloadFeedback(false), 2000);
		},
		onError: (error: unknown) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to download pack to gallery";
			Alert.alert("Download Error", errorMessage, [{ text: "OK" }]);
		},
	});

	const whatsappMutation = useMutation({
		mutationFn: () => addPackToWhatsApp(id || ""),
		onSuccess: () => {
			setWhatsappFeedback(true);
			setTimeout(() => setWhatsappFeedback(false), 2000);
		},
		onError: (error: unknown) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to export pack to WhatsApp";
			Alert.alert("WhatsApp Error", errorMessage, [{ text: "OK" }]);
		},
	});

	const copyStickerMutation = useMutation({
		mutationFn: () =>
			copyStickerToClipboard(
				selectedSticker?.url || "",
				selectedSticker?.id || "",
			),
		onSuccess: () => {
			Alert.alert("Success", "Sticker copied to clipboard!", [{ text: "OK" }]);
			setActionSheetVisible(false);
		},
		onError: (error: unknown) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to copy sticker";
			Alert.alert("Copy Error", errorMessage, [{ text: "OK" }]);
		},
	});

	const whatsappStickerMutation = useMutation({
		mutationFn: () =>
			shareStickerToWhatsApp(
				selectedSticker?.url || "",
				selectedSticker?.id || "",
				pack?.name,
			),
		onSuccess: () => {
			setActionSheetVisible(false);
		},
		onError: (error: unknown) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to share sticker to WhatsApp";
			Alert.alert("WhatsApp Error", errorMessage, [{ text: "OK" }]);
		},
	});

	const downloadStickerMutation = useMutation({
		mutationFn: () =>
			downloadSingleSticker(
				selectedSticker?.url || "",
				selectedSticker?.id || "",
				pack?.name,
			),
		onSuccess: () => {
			Alert.alert("Success", "Sticker saved to gallery!", [{ text: "OK" }]);
			setActionSheetVisible(false);
		},
		onError: (error: unknown) => {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to download sticker";
			Alert.alert("Download Error", errorMessage, [{ text: "OK" }]);
		},
	});

	useEffect(() => {
		if (pack) setIsSaved(pack.savedByUser || false);
	}, [pack]);

	const saveScale = useSharedValue(1);
	const downloadScale = useSharedValue(1);
	const whatsappScale = useSharedValue(1);
	const tickerTranslateX = useSharedValue(0);
	const backScale = useSharedValue(1);

	const saveAnimStyle = useAnimatedStyle(() => ({
		transform: [{ scale: saveScale.value }],
	}));
	const downloadAnimStyle = useAnimatedStyle(() => ({
		transform: [{ scale: downloadScale.value }],
	}));
	const whatsappAnimStyle = useAnimatedStyle(() => ({
		transform: [{ scale: whatsappScale.value }],
	}));
	const backAnimStyle = useAnimatedStyle(() => ({
		transform: [{ scale: backScale.value }],
	}));

	useEffect(() => {
		tickerTranslateX.value = withRepeat(
			withTiming(-1000, { duration: 8000 }),
			-1,
			true,
		);
	}, [tickerTranslateX]);

	const triggerMicroInteraction = (scaleValue: SharedValue<number>) => {
		scaleValue.value = withTiming(0.98, { duration: 40 }, () => {
			scaleValue.value = withTiming(1, { duration: 80 });
		});
	};

	const handleSaveToggle = () => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		triggerMicroInteraction(saveScale);
		if (isSaved) {
			unsaveMutation.mutate({ packId: id || "" });
		} else {
			saveMutation.mutate({ packId: id || "" });
		}
	};

	const handleDownload = () => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		triggerMicroInteraction(downloadScale);
		downloadMutation.mutate();
	};

	const handleWhatsApp = () => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		triggerMicroInteraction(whatsappScale);
		whatsappMutation.mutate();
	};

	const handleBack = () => {
		void Haptics.selectionAsync();
		backScale.value = withTiming(0.96, { duration: 50 }, () => {
			backScale.value = withTiming(1, { duration: 100 });
		});
		router.back();
	};

	const handleStickerLongPress = (sticker: Sticker) => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setSelectedSticker(sticker);
		setActionSheetVisible(true);
	};

	if (!pack) {
		return (
			<Screen scrollable={false}>
				<View style={styles.loaderWrap}>
					<Text style={styles.loaderText}>UFF SOMETHING WENT WRONG!</Text>
				</View>
			</Screen>
		);
	}

	const stickerPreview = pack.stickers.slice(0, 3);

	return (
		<Screen scrollable={false}>
			<SafeAreaProvider>
				<SafeAreaView>
					<AnimatedPressable
						onPress={handleBack}
						style={[styles.floatingBack, backAnimStyle]}
					>
						<Ionicons name="chevron-back" size={16} color="#FFFFFF" />
					</AnimatedPressable>

					<FlatList
						data={pack.stickers}
						keyExtractor={(item) => item.id}
						numColumns={3}
						columnWrapperStyle={styles.gridRow}
						contentContainerStyle={styles.gridContent}
						ListHeaderComponent={
							<View style={styles.header}>
								<View style={{ height: 56 }} />

								<View style={styles.heroCard}>
									<View style={styles.heroCardShadow} />
									<View style={styles.thumbWrap}>
										{pack.thumbnail ? (
											<Image
												source={{ uri: pack.previewSticker?.url || pack.thumbnail }}
												style={styles.thumbImg}
												resizeMode="cover"
												progressiveRenderingEnabled={true}
											/>
										) : (
											<View style={styles.thumbPlaceholder}>
												<Text style={styles.thumbEmoji}>📦</Text>
											</View>
										)}

										<View style={styles.stickerPreviews}>
											{stickerPreview.map((s, i) => (
												<View
													key={s.id}
													style={[styles.previewChip, { right: i * 28 }]}
												>
													<Image
														source={{ uri: s.url || undefined }}
														style={styles.previewImg}
														resizeMode="contain"
														progressiveRenderingEnabled={true}
													/>
												</View>
											))}
										</View>

										<View style={styles.countBadge}>
											<Text style={styles.countBadgeText}>
												{pack.stickers.length}
											</Text>
										</View>
									</View>

									<View style={styles.heroInfo}>
										<Text style={styles.packName}>
											{pack.name.toUpperCase()}
										</Text>
										<View style={styles.metaRow}>
											<Pressable
												onPress={() => router.push(`/user/${pack.creator.id}`)}
												hitSlop={8}
											>
												<Text style={styles.creatorName}>
													@{pack.creator.name.toUpperCase()}
												</Text>
											</Pressable>
											{pack.category && (
												<View style={styles.categoryPill}>
													<Text style={styles.categoryPillText}>
														{pack.category.toUpperCase()}
													</Text>
												</View>
											)}
										</View>
										{pack.description && (
											<Text style={styles.description} numberOfLines={3}>
												{pack.description}
											</Text>
										)}
									</View>
								</View>

								<View style={styles.statsStrip}>
									<View style={styles.statBlock}>
										<View style={styles.statShadow} />
										<Text style={styles.statBlockNum}>
											{formatCount(pack.downloads)}
										</Text>
										<Text style={styles.statBlockLabel}>DOWNLOADS</Text>
									</View>
									<View style={styles.statBlockDivider} />
									<View style={styles.statBlock}>
										<View style={styles.statShadow} />
										<Text style={styles.statBlockNum}>
											{formatCount(pack.saves)}
										</Text>
										<Text style={styles.statBlockLabel}>SAVES</Text>
									</View>
									<View style={styles.statBlockDivider} />
									<View style={styles.statBlock}>
										<View style={styles.statShadow} />
										<Text style={styles.statBlockNum}>
											{pack.stickers.length}
										</Text>
										<Text style={styles.statBlockLabel}>STICKERS</Text>
									</View>
								</View>

								<View style={styles.actions}>
									<AnimatedPressable
										onPress={handleDownload}
										disabled={downloadMutation.isPending}
										style={[styles.actionBtn, downloadAnimStyle]}
									>
										{downloadMutation.isPending ? (
											<ButtonSkeleton size="small" />
										) : (
											<>
												<Ionicons
													name={
														downloadFeedback ? "checkmark" : "download-outline"
													}
													size={18}
													color={downloadFeedback ? "#22c55e" : "#FFFFFF"}
												/>
												<Text
													style={[
														styles.actionBtnLabel,
														downloadFeedback && { color: "#22c55e" },
													]}
												>
													{downloadFeedback ? "DONE" : "DOWNLOAD"}
												</Text>
											</>
										)}
									</AnimatedPressable>

									<View style={styles.actionDivider} />

									<AnimatedPressable
										onPress={handleSaveToggle}
										disabled={
											saveMutation.isPending || unsaveMutation.isPending
										}
										style={[styles.actionBtn, saveAnimStyle]}
									>
										<Ionicons
											name={isSaved ? "heart" : "heart-outline"}
											size={18}
											color={isSaved ? "#FFF500" : "#FFFFFF"}
										/>
										<Text
											style={[
												styles.actionBtnLabel,
												isSaved && { color: "#FFF500" },
											]}
										>
											{isSaved ? "SAVED" : "SAVE"}
										</Text>
									</AnimatedPressable>

									<View style={styles.actionDivider} />

									<AnimatedPressable
										onPress={handleWhatsApp}
										disabled={whatsappMutation.isPending}
										style={[styles.actionBtn, whatsappAnimStyle]}
									>
										{whatsappMutation.isPending ? (
											<ButtonSkeleton size="small" />
										) : (
											<>
												<Ionicons
													name={
														whatsappFeedback ? "checkmark" : "logo-whatsapp"
													}
													size={18}
													color={whatsappFeedback ? "#22c55e" : "#FFFFFF"}
												/>
												<Text
													style={[
														styles.actionBtnLabel,
														whatsappFeedback && { color: "#22c55e" },
													]}
												>
													WHATSAPP
												</Text>
											</>
										)}
									</AnimatedPressable>
								</View>

								{pack.tags.length > 0 && (
									<View style={styles.tagsWrap}>
										{pack.tags.map((tag, idx) => (
											<View
												key={tag}
												style={[
													styles.tag,
													{
														transform: [
															{ rotate: idx % 2 === 0 ? "-1deg" : "1deg" },
														],
													},
												]}
											>
												<Text style={styles.tagText}>#{tag.toUpperCase()}</Text>
											</View>
										))}
									</View>
								)}

								<View style={styles.sectionHeader}>
									<View style={styles.sectionAccent} />
									<Text style={styles.sectionTitle}>ALL STICKERS</Text>
								</View>
								<Text style={styles.hintText}>
									HOLD STICKER TO COPY · WHATSAPP · SAVE
								</Text>
							</View>
						}
						renderItem={({ item }) => (
							<Pressable
								style={styles.stickerCell}
								onLongPress={() => handleStickerLongPress(item as any)}
							>
								<View style={styles.stickerCardShadow} />
								<View style={styles.stickerCard}>
									<Image
										source={{ uri: item.url || undefined }}
										style={styles.stickerImg}
										resizeMode="contain"
									/>
								</View>
							</Pressable>
						)}
					/>
					<StickerActionSheet
						visible={actionSheetVisible}
						onClose={() => setActionSheetVisible(false)}
						onCopyToClipboard={() => copyStickerMutation.mutateAsync()}
						onShareToWhatsApp={() => whatsappStickerMutation.mutateAsync()}
						onDownload={() => downloadStickerMutation.mutateAsync()}
						isLoading={
							copyStickerMutation.isPending ||
							whatsappStickerMutation.isPending ||
							downloadStickerMutation.isPending
						}
					/>
				</SafeAreaView>
			</SafeAreaProvider>
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	loaderWrap: {
		flex: 1,
		alignItems: "center",
		justify: "center",
		gap: 16,
	},
	loaderText: {
		color: "#707070",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1,
	},
	floatingBack: {
		position: "absolute",
		top: 16,
		left: 16,
		zIndex: 100,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#111111",
		borderWidth: 1,
		borderColor: "#222222",
		alignItems: "center",
		justifyContent: "center",
	},
	gridContent: {
		paddingBottom: theme.spacing["4xl"],
	},
	gridRow: {
		paddingHorizontal: theme.spacing.lg,
		gap: 8,
	},
	header: {
		gap: theme.spacing.lg,
		paddingBottom: theme.spacing.md,
	},
	heroCard: {
		marginHorizontal: theme.spacing.lg,
		backgroundColor: "#1A1A1A",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 0,
		overflow: "visible",
	},
	heroCardShadow: {
		position: "absolute",
		top: 3,
		left: 3,
		right: -3,
		bottom: -3,
		backgroundColor: "#000000",
		borderRadius: 0,
		zIndex: -1,
	},
	thumbWrap: {
		height: 340,
		backgroundColor: "#0D0D0D",
		position: "relative",
	},
	thumbImg: {
		width: "100%",
		height: "100%",
	},
	thumbPlaceholder: {
		flex: 1,
		alignItems: "center",
		justify: "center",
	},
	thumbEmoji: {
		fontSize: 48,
	},
	stickerPreviews: {
		position: "absolute",
		bottom: -16,
		right: 16,
		flexDirection: "row-reverse",
		height: 40,
	},
	previewChip: {
		position: "absolute",
		width: 36,
		height: 36,
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#FFF500",
		backgroundColor: "#1A1A1A",
		overflow: "hidden",
	},
	previewImg: {
		width: "100%",
		height: "100%",
	},
	countBadge: {
		position: "absolute",
		top: 12,
		right: 12,
		backgroundColor: "#000000",
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#FFF500",
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	countBadgeText: {
		color: "#FFF500",
		fontSize: 11,
		fontWeight: "900",
	},
	heroInfo: {
		padding: 16,
		paddingTop: 24,
		gap: 6,
	},
	packName: {
		color: "#FFFFFF",
		fontSize: 26,
		fontWeight: "900",
		letterSpacing: -0.5,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	creatorName: {
		color: "#FFF500",
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	categoryPill: {
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#FFF500",
		borderRadius: 0,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	categoryPillText: {
		color: "#000000",
		fontSize: 9,
		fontWeight: "900",
	},
	description: {
		color: "#888888",
		fontSize: 13,
		lineHeight: 18,
		marginTop: 4,
	},
	statsStrip: {
		flexDirection: "row",
		marginHorizontal: theme.spacing.lg,
		backgroundColor: "#FFFFFF",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 0,
		paddingHorizontal: 0,
		paddingVertical: 0,
	},
	statBlock: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 14,
		gap: 2,
		backgroundColor: "#FFF500",
		position: "relative",
	},
	statShadow: {
		position: "absolute",
		top: 3,
		left: 3,
		right: -3,
		bottom: -3,
		backgroundColor: "#000000",
		zIndex: -1,
	},
	statBlockNum: {
		color: "#000000",
		fontSize: 22,
		fontWeight: "900",
		letterSpacing: -0.5,
	},
	statBlockLabel: {
		color: "#707070",
		fontSize: 8,
		fontWeight: "900",
		letterSpacing: 1,
	},
	statBlockDivider: {
		width: 2,
		backgroundColor: "#000000",
		marginVertical: 0,
	},
	actions: {
		flexDirection: "row",
		marginHorizontal: theme.spacing.lg,
		backgroundColor: "#111111",
		borderWidth: 1,
		borderColor: "#222222",
		borderRadius: 4,
		alignItems: "center",
		paddingVertical: 4,
	},
	actionBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		height: 40,
	},
	actionBtnLabel: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 0.5,
	},
	actionDivider: {
		width: 1,
		height: 16,
		backgroundColor: "#222222",
	},
	tagsWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: theme.spacing.lg,
		gap: 6,
	},
	tag: {
		backgroundColor: "#000000",
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#FFF500",
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	tagText: {
		color: "#FFF500",
		fontSize: 10,
		fontWeight: "900",
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: theme.spacing.lg,
		marginTop: theme.spacing.sm,
	},
	sectionAccent: {
		width: 4,
		height: 18,
		backgroundColor: "#FFF500",
		borderRadius: 0,
	},
	sectionTitle: {
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "900",
		letterSpacing: 0.8,
	},
	hintText: {
		color: "#888888",
		fontSize: 11,
		fontWeight: "600",
		letterSpacing: 0.5,
		paddingHorizontal: theme.spacing.lg,
		marginTop: 8,
		marginBottom: 12,
	},
	stickerCell: {
		flex: 1 / 3,
		aspectRatio: 1,
		padding: 4,
	},
	stickerCardShadow: {
		position: "absolute",
		top: 3,
		left: 3,
		right: -3,
		bottom: -3,
		backgroundColor: "#FFF500",
		borderRadius: 0,
		zIndex: -1,
	},
	stickerCard: {
		flex: 1,
		backgroundColor: "#1A1A1A",
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#000000",
		padding: 8,
		alignItems: "center",
		justify: "center",
		position: "relative",
	},
	stickerImg: {
		width: "100%",
		height: "100%",
	},
}));
