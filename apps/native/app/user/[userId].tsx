import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	Dimensions,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatCount } from "@/utils/format";
import { orpc } from "@/utils/orpc";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_COLS = 2;
const GRID_GAP = 12;
const ITEM_WIDTH = (SCREEN_W - 32 - (GRID_COLS - 1) * GRID_GAP) / GRID_COLS;

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

// ─── Pack Grid Item ───────────────────────────────────────────────────────────

interface PackGridItemProps {
	pack: {
		id: string;
		name: string;
		thumbnail: string | null;
		previewSticker: { id: string; url: string } | null;
	};
	onPress: (packId: string) => void;
}

function PackGridItem({ pack, onPress }: PackGridItemProps) {
	const imageUrl = pack.previewSticker?.url || pack.thumbnail;

	return (
		<Pressable
			style={({ pressed }) => [
				styles.packCard,
				{ width: ITEM_WIDTH },
				pressed && { opacity: 0.8 },
			]}
			onPress={() => onPress(pack.id)}
		>
			<View style={styles.packImageContainer}>
				{imageUrl ? (
					<Image source={{ uri: imageUrl }} style={styles.packImage} />
				) : (
					<View style={[styles.packImage, styles.packImagePlaceholder]}>
						<Ionicons name="image-outline" size={32} color="#707070" />
					</View>
				)}
			</View>
			<Text style={styles.packName} numberOfLines={2}>
				{pack.name}
			</Text>
		</Pressable>
	);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreatorProfileScreen() {
	const { theme } = useUnistyles();
	const router = useRouter();
	const { userId } = useLocalSearchParams<{ userId: string }>();

	const {
		data: profile,
		isLoading: isLoadingProfile,
		error,
	} = useQuery(
		orpc.profile.get.queryOptions({
			input: { userId: userId || "" },
		}),
	);

	const displayName = profile?.name ?? "User";
	const displayUsername = profile?.username ?? "";
	const displayBio = profile?.bio ?? "";
	const userInitial = displayName[0]?.toUpperCase() ?? "U";

	const packs = profile?.packs || [];

	// Calculate stats from packs
	const totalDownloads = packs.reduce((sum, p) => sum + p.downloads, 0);
	const totalSaves = packs.reduce((sum, p) => sum + p.saves, 0);

	const handlePackPress = (packId: string) => {
		router.push(`/pack/${packId}`);
	};

	if (isLoadingProfile) {
		return (
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.loaderContainer}>
					<View
						style={{
							width: 48,
							height: 48,
							backgroundColor: "#e0e0e0",
							borderRadius: 4,
						}}
					/>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !profile) {
		return (
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle-outline" size={48} color="#ff3b30" />
					<Text style={styles.errorText}>Failed to load profile</Text>
					<Pressable style={styles.backBtn} onPress={() => router.back()}>
						<Text style={styles.backBtnText}>GO BACK</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View style={styles.root}>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<ScrollView
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					{/* Back button */}
					<Pressable
						style={({ pressed }) => [
							styles.backHeaderBtn,
							pressed && { opacity: 0.6 },
						]}
						onPress={() => router.back()}
					>
						<Ionicons name="chevron-back" size={24} color="#FFF500" />
					</Pressable>

					{/* Avatar */}
					<View style={styles.avatarSection}>
						{profile?.image ? (
							<Image
								source={{ uri: profile.image }}
								style={styles.avatarImage}
							/>
						) : (
							<View style={styles.avatarFallback}>
								<Text style={styles.avatarText}>{userInitial}</Text>
							</View>
						)}
					</View>

					{/* User info */}
					<View style={styles.userInfo}>
						<Text style={styles.userName}>{displayName}</Text>
						{displayUsername ? (
							<Text style={styles.userHandle}>@{displayUsername}</Text>
						) : null}
						{displayBio ? (
							<Text style={styles.userBio}>{displayBio}</Text>
						) : null}
					</View>

					{/* Stats row */}
					<View style={styles.statsRow}>
						<StatCard
							label="Packs"
							value={profile.packCount.toString()}
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

					{/* Packs section */}
					{packs.length > 0 ? (
						<View style={styles.packsSection}>
							<Text style={styles.packsTitle}>PACKS</Text>
							<View style={styles.packsGrid}>
								{packs.map((pack) => (
									<PackGridItem
										key={pack.id}
										pack={pack}
										onPress={handlePackPress}
									/>
								))}
							</View>
						</View>
					) : (
						<View style={styles.emptyState}>
							<Ionicons name="layers-outline" size={40} color="#707070" />
							<Text style={styles.emptyText}>NO PACKS YET</Text>
						</View>
					)}
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
		paddingTop: theme.spacing.lg,
		paddingBottom: theme.spacing["4xl"],
		alignItems: "center",
		gap: theme.spacing.lg,
	},
	loaderContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	errorContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: theme.spacing.lg,
	},
	errorText: {
		color: "#ff3b30",
		fontSize: theme.fontSize.lg,
		fontWeight: "700",
	},

	backHeaderBtn: {
		alignSelf: "flex-start",
		padding: 4,
		marginBottom: theme.spacing.md,
	},

	// Avatar
	avatarSection: {
		marginBottom: theme.spacing.sm,
	},
	avatarImage: {
		width: 104,
		height: 104,
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#FFF500",
		shadowColor: "#FFF500",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
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
	userBio: {
		color: "#AAAAAA",
		fontSize: theme.fontSize.sm,
		textAlign: "center",
		lineHeight: 20,
		marginTop: 4,
		maxWidth: 260,
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

	// Packs section
	packsSection: {
		width: "100%",
		gap: theme.spacing.md,
	},
	packsTitle: {
		color: "#FFF500",
		fontSize: theme.fontSize.lg,
		fontWeight: "900",
		letterSpacing: 1,
	},
	packsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GRID_GAP,
	},
	packCard: {
		gap: 8,
	},
	packImageContainer: {
		width: "100%",
		overflow: "hidden",
	},
	packImage: {
		width: "100%",
		aspectRatio: 1,
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
	},
	packImagePlaceholder: {
		backgroundColor: "#1A1A1A",
		alignItems: "center",
		justifyContent: "center",
	},
	packName: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.sm,
		fontWeight: "700",
		lineHeight: 16,
	},

	// Empty state
	emptyState: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.spacing["3xl"],
		gap: theme.spacing.md,
	},
	emptyText: {
		color: "#707070",
		fontSize: theme.fontSize.base,
		fontWeight: "700",
		letterSpacing: 0.5,
	},

	backBtn: {
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		marginTop: theme.spacing.lg,
	},
	backBtnText: {
		color: "#000000",
		fontWeight: "900",
		fontSize: theme.fontSize.base,
	},
}));
