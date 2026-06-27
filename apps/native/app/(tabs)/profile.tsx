import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Image,
	Keyboard,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Extrapolate,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ButtonSkeleton } from "@/components/ui/button-skeleton";

import { authClient } from "@/lib/auth-client";
import { formatCount } from "@/utils/format";
import { queryClient as globalQueryClient, orpc } from "@/utils/orpc";

const { height: SCREEN_H } = Dimensions.get("window");

// ─── Edit Profile Draggable Sheet ─────────────────────────────────────────────

interface EditSheetProps {
	visible: boolean;
	onClose: () => void;
	initialName: string;
	initialUsername: string;
	initialBio: string;
}

function EditProfileSheet({
	visible,
	onClose,
	initialName,
	initialUsername,
	initialBio,
}: EditSheetProps) {
	const [name, setName] = useState(initialName);
	const [username, setUsername] = useState(initialUsername);
	const [bio, setBio] = useState(initialBio);
	const [error, setError] = useState<string | null>(null);

	const localQC = useQueryClient();

	useEffect(() => {
		if (visible) {
			setName(initialName);
			setUsername(initialUsername);
			setBio(initialBio);
			setError(null);
		}
	}, [visible, initialName, initialUsername, initialBio]);

	const updateMutation = useMutation({
		...orpc.profile.update.mutationOptions(),
		onSuccess: () => {
			localQC.invalidateQueries({ queryKey: orpc.profile.me.queryKey() });
			onClose();
		},
		onError: (err: any) => {
			setError(err?.message || "Update failed. Try again.");
		},
	});

	const translateY = useSharedValue(SCREEN_H);

	useEffect(() => {
		if (visible) {
			translateY.value = withTiming(0, { duration: 300 });
		} else {
			Keyboard.dismiss();
			translateY.value = withTiming(SCREEN_H, { duration: 250 });
		}
	}, [visible, translateY]);

	const close = () => {
		Keyboard.dismiss();
		translateY.value = withTiming(SCREEN_H, { duration: 250 }, (finished) => {
			if (finished) runOnJS(onClose)();
		});
	};

	const panGesture = Gesture.Pan()
		.enabled(!error)
		.onChange((e) => {
			translateY.value = Math.max(0, e.translationY);
		})
		.onEnd((e) => {
			if (e.translationY > 150 || e.velocityY > 500) {
				translateY.value = withTiming(SCREEN_H, { duration: 220 }, (done) => {
					if (done) runOnJS(onClose)();
				});
			} else {
				translateY.value = withTiming(0, { duration: 200 });
			}
		});

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));
	const scrimStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			translateY.value,
			[0, SCREEN_H * 0.8],
			[1, 0],
			Extrapolate.CLAMP,
		),
	}));

	if (!visible && translateY.value >= SCREEN_H - 10) return null;

	return (
		<View style={sheet.portal} pointerEvents={visible ? "auto" : "none"}>
			<Animated.View style={[sheet.scrim, scrimStyle]}>
				<Pressable
					style={StyleSheet.absoluteFill}
					onPress={close}
					pointerEvents={error ? "none" : "auto"}
				/>
			</Animated.View>

			<GestureDetector gesture={panGesture}>
				<Animated.View style={[sheet.container, sheetStyle]}>
					{/* Handle */}
					<View style={sheet.handleWrap}>
						<View style={sheet.handle} />
					</View>

					{/* Header */}
					<View style={sheet.header}>
						<Text style={sheet.title}>EDIT PROFILE ✏️</Text>
						<Pressable
							onPress={close}
							style={sheet.closeBtn}
							hitSlop={12}
							disabled={!!error}
							opacity={error ? 0.5 : 1}
						>
							<Ionicons name="close" size={20} color={error ? "#666" : "#A3A3B3"} />
						</Pressable>
					</View>

					<Text style={sheet.subtitle}>Update your display info below.</Text>

					{error && (
						<Pressable
							style={sheet.errorBanner}
							onPress={() => setError(null)}
							hitSlop={8}
						>
							<Ionicons name="alert-circle" size={14} color="#fff" />
							<Text style={sheet.errorText}>{error}</Text>
							<Text style={sheet.errorDismiss}>✕</Text>
						</Pressable>
					)}

					<ScrollView
						keyboardShouldPersistTaps="handled"
						showsVerticalScrollIndicator={false}
						contentContainerStyle={sheet.scrollContent}
					>
						{/* Name */}
						<View style={sheet.fieldGroup}>
							<Text style={sheet.fieldLabel}>DISPLAY NAME</Text>
							<TextInput
								style={sheet.input}
								value={name}
								onChangeText={setName}
								placeholder="Your name..."
								placeholderTextColor="#555"
								autoCorrect={false}
							/>
						</View>

						{/* Username */}
						<View style={sheet.fieldGroup}>
							<Text style={sheet.fieldLabel}>USERNAME</Text>
							<View style={sheet.inputWithPrefix}>
								<Text style={sheet.prefix}>@</Text>
								<TextInput
									style={[sheet.input, sheet.inputFlex]}
									value={username}
									onChangeText={setUsername}
									placeholder="your_handle"
									placeholderTextColor="#555"
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>
						</View>

						{/* Bio */}
						<View style={sheet.fieldGroup}>
							<Text style={sheet.fieldLabel}>BIO</Text>
							<TextInput
								style={[sheet.input, sheet.inputMulti]}
								value={bio}
								onChangeText={setBio}
								placeholder="A little something about you..."
								placeholderTextColor="#555"
								multiline
								numberOfLines={3}
								textAlignVertical="top"
								autoCorrect={false}
							/>
						</View>

						{/* Save button */}
						<Pressable
							onPress={() => {
								const trimmedName = name.trim();
								const trimmedUsername = username.trim();
								const trimmedBio = bio.trim();

								// Validate name
								if (trimmedName && trimmedName.length < 2) {
									setError("Name must be at least 2 characters.");
									return;
								}
								if (trimmedName && trimmedName.length > 100) {
									setError("Name must be less than 100 characters.");
									return;
								}

								// Validate username
								if (trimmedUsername && trimmedUsername.length < 3) {
									setError("Username must be at least 3 characters.");
									return;
								}
								if (trimmedUsername && trimmedUsername.length > 50) {
									setError("Username must be less than 50 characters.");
									return;
								}
								if (
									trimmedUsername &&
									!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)
								) {
									setError(
										"Username can only contain letters, numbers, underscores, and hyphens.",
									);
									return;
								}

								// Validate bio
								if (trimmedBio && trimmedBio.length > 500) {
									setError("Bio must be less than 500 characters.");
									return;
								}

								setError(null);
								void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
								updateMutation.mutate({
									name: trimmedName || undefined,
									username: trimmedUsername || undefined,
									bio: trimmedBio || undefined,
								});
							}}
							disabled={updateMutation.isPending}
							style={({ pressed }) => [
								sheet.saveBtn,
								pressed && { opacity: 0.85 },
								updateMutation.isPending && { opacity: 0.5 },
							]}
						>
							<Text style={sheet.saveBtnText}>SAVE CHANGES ⚡</Text>
						</Pressable>
					</ScrollView>
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent: string;
}) {
	return (
		<View style={styles.statCard}>
			<View style={[styles.statAccentLine, { backgroundColor: accent }]} />
			<Text style={[styles.statValue, { color: accent }]}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
	const { data: session } = authClient.useSession();
	const { theme } = useUnistyles();
	const [editSheetVisible, setEditSheetVisible] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const { data: profile, isLoading: isLoadingProfile } = useQuery(
		orpc.profile.me.queryOptions(),
	);

	const { data: myPacksData, isLoading: isLoadingPacks } = useQuery(
		orpc.packs.myPacks.queryOptions({ input: { limit: 50 } }),
	);

	const packs = (myPacksData?.items || []) as Array<{
		id: string;
		name: string;
		downloads: number;
		saves: number;
		creator: { name: string };
	}>;

	const totalDownloads = packs.reduce((sum, p) => sum + p.downloads, 0);
	const totalSaves = packs.reduce((sum, p) => sum + p.saves, 0);

	const handleSignOut = () => {
		void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		authClient.signOut();
		globalQueryClient.invalidateQueries();
	};

	const handlePhotoSelect = async () => {
		try {
			setIsPickerOpen(true);
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: false,
				aspect: [1, 1],
				quality: 1,
			});

			if (result.canceled) {
				setIsPickerOpen(false);
				return;
			}

			const imageUri = result.assets[0]?.uri;
			if (!imageUri) {
				setUploadError("Failed to select image");
				setTimeout(() => setUploadError(null), 5000);
				setIsPickerOpen(false);
				return;
			}

			setIsUploading(true);
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Start);

			const base64 = await FileSystem.readAsStringAsync(imageUri, {
				encoding: FileSystem.EncodingType.Base64,
			});

			const mimeType = imageUri.endsWith(".png")
				? "image/png"
				: imageUri.endsWith(".gif")
					? "image/gif"
					: imageUri.endsWith(".webp")
						? "image/webp"
						: "image/jpeg";

			const formData = new FormData();
			formData.append(
				"photo",
				JSON.stringify({ data: base64, type: mimeType }),
			);

			const response = await fetch(
				`${orpc.getBaseURL()}/api/profile/upload-photo`,
				{
					method: "POST",
					body: formData,
					headers: {
						Accept: "application/json",
					},
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData?.error || `Upload failed with status ${response.status}`,
				);
			}

			void Haptics.notificationAsync(
				Haptics.NotificationFeedbackType.Success,
			);
			globalQueryClient.invalidateQueries({
				queryKey: orpc.profile.me.queryKey(),
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to upload photo";
			setUploadError(message);
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			setTimeout(() => setUploadError(null), 5000);
		} finally {
			setIsUploading(false);
			setIsPickerOpen(false);
		}
	};

	const isLoading = isLoadingProfile || isLoadingPacks;

	const displayName = profile?.name ?? session?.user.name ?? "User";
	const displayUsername = profile?.username ?? "";
	const displayEmail = profile?.email ?? session?.user.email ?? "";
	const displayBio = profile?.bio ?? "";
	const userInitial = displayName[0]?.toUpperCase() ?? "U";

	return (
		// Outer root view so the absolute-positioned sheet stays in the right layer
		<View style={styles.root}>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* Avatar */}
					<View style={styles.avatarSection}>
						<View style={styles.avatarWrap}>
							{profile?.image ? (
								<Image
									source={{ uri: profile.image }}
									style={styles.avatarFallback}
								/>
							) : (
								<View style={styles.avatarFallback}>
									<Text style={styles.avatarText}>{userInitial}</Text>
								</View>
							)}
							{isUploading && (
								<View style={styles.avatarUploading}>
									<ActivityIndicator color="#000000" />
								</View>
							)}
							{/* Edit badge */}
							<Pressable
								style={styles.avatarEditBadge}
								onPress={() => {
									void Haptics.selectionAsync();
									void handlePhotoSelect();
								}}
								disabled={isUploading}
								opacity={isUploading ? 0.5 : 1}
							>
								<Ionicons name="pencil" size={12} color="#000000" />
							</Pressable>
						</View>
					</View>

					{/* Upload Error Banner */}
					{uploadError && (
						<Pressable
							onPress={() => setUploadError(null)}
							style={styles.avatarError}
						>
							<Ionicons name="alert-circle" size={14} color="#fff" />
							<Text style={styles.avatarErrorText}>{uploadError}</Text>
							<Text style={styles.avatarErrorDismiss}>✕</Text>
						</Pressable>
					)}

					{/* User info */}
					<View style={styles.userInfo}>
						<Text style={styles.userName}>{displayName}</Text>
						{displayUsername ? (
							<Text style={styles.userHandle}>@{displayUsername}</Text>
						) : null}
						<Text style={styles.userEmail}>{displayEmail}</Text>
						{displayBio ? (
							<Text style={styles.userBio}>{displayBio}</Text>
						) : null}
					</View>

					{/* Edit Profile Button */}
					<Pressable
						onPress={() => {
							void Haptics.selectionAsync();
							setEditSheetVisible(true);
						}}
						style={({ pressed }) => [
							styles.editBtn,
							pressed && { opacity: 0.75 },
						]}
					>
						<Ionicons name="pencil-outline" size={14} color="#000000" />
						<Text style={styles.editBtnText}>EDIT PROFILE</Text>
					</Pressable>

					{/* Stats row */}
					<View style={styles.statsRow}>
						<StatCard
							label="Packs"
							value={packs.length.toString()}
							accent={theme.colors.primary}
						/>
						<StatCard
							label="Downloads"
							value={formatCount(totalDownloads)}
							accent={theme.colors.accent}
						/>
						<StatCard
							label="Saves"
							value={formatCount(totalSaves)}
							accent={theme.colors.secondary}
						/>
					</View>

					{/* Divider */}
					<View style={styles.divider} />

					{/* Sign Out */}
					<Pressable
						onPress={handleSignOut}
						style={({ pressed }) => [
							styles.signOutBtn,
							pressed && { opacity: 0.75 },
						]}
					>
						<Ionicons name="log-out-outline" size={18} color="#FF4D4D" />
						<Text style={styles.signOutText}>SIGN OUT</Text>
					</Pressable>
				</ScrollView>
			</SafeAreaView>

			{/* Edit sheet rendered at root level so absolute positioning works */}
			<EditProfileSheet
				visible={editSheetVisible}
				onClose={() => setEditSheetVisible(false)}
				initialName={displayName}
				initialUsername={displayUsername}
				initialBio={displayBio}
			/>
		</View>
	);
}

// ─── Sheet Styles ─────────────────────────────────────────────────────────────

const sheet = StyleSheet.create((theme) => ({
	portal: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "flex-end",
		zIndex: 1000,
	},
	scrim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.92)",
	},
	container: {
		backgroundColor: "#0A0A0A",
		height: SCREEN_H - 120,
		width: "100%",
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 44,
		borderRadius: 10,
	},
	handleWrap: {
		alignItems: "center",
		marginBottom: 4,
	},
	handle: {
		width: 44,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#333333",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 16,
		marginBottom: 8,
	},
	title: {
		color: "#FFF500",
		fontSize: 24,
		fontWeight: "900",
		letterSpacing: -0.5,
	},
	closeBtn: {
		padding: 4,
	},
	subtitle: {
		color: "#A3A3B3",
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 20,
	},
	errorBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#ff3b30",
		padding: 10,
		borderWidth: 2,
		borderColor: "#000000",
		marginBottom: 16,
	},
	errorText: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: 12,
		flex: 1,
	},
	errorDismiss: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: 14,
	},
	scrollContent: {
		gap: 16,
		paddingBottom: 24,
	},
	fieldGroup: {
		gap: 6,
	},
	fieldLabel: {
		color: "#FFF500",
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 1,
	},
	inputWithPrefix: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		paddingHorizontal: 12,
		minHeight: 50,
		shadowOffset: { width: 2, height: 2 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
	},
	prefix: {
		color: "#FFF500",
		fontSize: 15,
		fontWeight: "900",
		marginRight: 4,
	},
	inputFlex: {
		flex: 1,
		borderWidth: 0,
		padding: 0,
		backgroundColor: "transparent",
		shadowOpacity: 0,
		minHeight: 0,
	},
	input: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		padding: 12,
		color: "#ffffff",
		fontSize: 14,
		fontWeight: "700",
		minHeight: 50,
		shadowOffset: { width: 2, height: 2 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
	},
	inputMulti: {
		minHeight: 90,
		textAlignVertical: "top",
	},
	photoBtn: {
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		paddingVertical: 12,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		shadowOffset: { width: 2, height: 2 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 2,
	},
	photoBtnText: {
		color: "#000000",
		fontWeight: "900",
		fontSize: 12,
		letterSpacing: 0.8,
	},
	saveBtn: {
		backgroundColor: "#FFF500",
		borderWidth: 3,
		borderColor: "#000000",
		paddingVertical: 16,
		alignItems: "center",
		justifyContent: "center",
		shadowOffset: { width: 4, height: 4 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 4,
		marginTop: 8,
	},
	saveBtnText: {
		color: "#000000",
		fontWeight: "900",
		fontSize: 14,
		letterSpacing: 1,
	},
}));

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	safeArea: {
		flex: 1,
	},
	content: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing["3xl"],
		paddingBottom: theme.spacing["4xl"],
		alignItems: "center",
		gap: theme.spacing.lg,
	},
	loaderContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	// Avatar
	avatarSection: {
		marginBottom: theme.spacing.sm,
	},
	avatarWrap: {
		position: "relative",
		width: 104,
		height: 104,
	},
	avatarFallback: {
		width: 104,
		height: 104,
		borderRadius: 0,
		backgroundColor: theme.colors.surfaceElevated,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#FFF500",
		shadowColor: "#FFF500",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	avatarText: {
		color: "#FFF500",
		fontSize: 44,
		fontWeight: "900",
	},
	avatarEditBadge: {
		position: "absolute",
		bottom: -6,
		right: -6,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarUploading: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(255,255,255,0.6)",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 0,
	},
	avatarError: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#ff3b30",
		padding: 10,
		borderWidth: 2,
		borderColor: "#000000",
		marginBottom: 16,
	},
	avatarErrorText: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: 12,
		flex: 1,
	},
	avatarErrorDismiss: {
		color: "#ffffff",
		fontWeight: "700",
		fontSize: 14,
	},

	// User info
	userInfo: {
		alignItems: "center",
		gap: 4,
	},
	userName: {
		color: "#FFFFFF",
		fontSize: theme.fontSize["2xl"],
		fontWeight: "900",
		letterSpacing: -0.3,
	},
	userHandle: {
		color: "#FFF500",
		fontSize: theme.fontSize.sm,
		fontWeight: "700",
	},
	userEmail: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
	},
	userBio: {
		color: "#AAAAAA",
		fontSize: theme.fontSize.sm,
		textAlign: "center",
		lineHeight: 20,
		marginTop: 4,
		maxWidth: 260,
	},

	// Edit button
	editBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		paddingHorizontal: 16,
		paddingVertical: 8,
		shadowOffset: { width: 2, height: 2 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 2,
	},
	editBtnText: {
		color: "#000000",
		fontWeight: "900",
		fontSize: 12,
		letterSpacing: 0.8,
	},

	// Stats
	statsRow: {
		flexDirection: "row",
		gap: theme.spacing.sm,
		width: "100%",
	},
	statCard: {
		flex: 1,
		backgroundColor: theme.colors.surface,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		paddingVertical: theme.spacing.lg,
		paddingHorizontal: theme.spacing.md,
		alignItems: "center",
		overflow: "hidden",
		position: "relative",
		gap: theme.spacing.xs,
	},
	statAccentLine: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 2,
	},
	statValue: {
		fontSize: theme.fontSize.lg,
		fontWeight: "900",
		letterSpacing: -0.3,
	},
	statLabel: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: "600",
		textTransform: "uppercase",
	},

	divider: {
		width: "100%",
		height: 2,
		backgroundColor: "#1A1A1A",
		marginVertical: theme.spacing.sm,
	},

	// Sign out
	signOutBtn: {
		width: "100%",
		paddingVertical: 14,
		paddingHorizontal: theme.spacing["2xl"],
		borderWidth: 2,
		borderColor: "#FF4D4D",
		backgroundColor: "rgba(255,77,77,0.08)",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},
	signOutText: {
		color: "#FF4D4D",
		fontSize: theme.fontSize.base,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
}));
