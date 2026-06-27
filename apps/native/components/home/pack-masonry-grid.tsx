import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image, Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Pack = {
	id: string;
	name: string;
	creator?: { name: string };
	thumbnail?: string;
	downloads: number;
	saves: number;
	tags?: string[];
	stickers?: Array<{ url: string }>;
	category?: string;
	savedByUser?: boolean;
	emoji?: string;
};

type PackRowProps = {
	pack: Pack;
	isLast?: boolean;
	onPress?: () => void;
};

function PackRow({ pack, isLast = false, onPress }: PackRowProps) {
	const { theme } = useUnistyles();
	const scale = useSharedValue(1);
	const opacity = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	const handlePressIn = () => {
		scale.value = withSpring(0.99, { damping: 15, stiffness: 350 });
		opacity.value = withSpring(0.9, { damping: 15, stiffness: 350 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 12, stiffness: 280 });
		opacity.value = withSpring(1, { damping: 12, stiffness: 280 });
	};

	const imageUrl = pack.thumbnail || pack.stickers?.[0]?.url;

	return (
		<AnimatedPressable
			onPress={() => {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
				onPress?.();
			}}
			onPressIn={handlePressIn}
			style={[styles.row, animatedStyle]}
		>
			{/* Left Preview Image/Emoji Badge */}
			<View style={styles.emojiContainer}>
				{imageUrl ? (
					<Image
						source={{ uri: imageUrl }}
						style={styles.rowImage}
						resizeMode="contain"
					/>
				) : (
					<Text style={styles.rowEmoji}>{pack.emoji || "⚡"}</Text>
				)}
			</View>

			{/* Middle Text Info */}
			<View style={styles.infoContainer}>
				<Text style={styles.rowName} numberOfLines={1}>
					{pack.name}
				</Text>
				<View style={styles.metaRow}>
					<Text style={styles.rowCreator}>@{pack.creator?.name || "user"}</Text>
					<Text style={styles.dotSeparator}>•</Text>
					<Ionicons
						name="download-outline"
						size={12}
						color={theme.colors.muted}
					/>
					<Text style={styles.rowStats}>{formatCount(pack.downloads)}</Text>
					<Text style={styles.dotSeparator}>•</Text>
					<Ionicons name="heart-outline" size={12} color={theme.colors.muted} />
					<Text style={styles.rowStats}>{formatCount(pack.saves)}</Text>
				</View>
			</View>

			{/* Apple-style thin divider line */}
			{!isLast && <View style={styles.divider} />}
		</AnimatedPressable>
	);
}

type PackMasonryGridProps = {
	packs: Pack[];
	title?: string;
	onPackPress?: (packId: string) => void;
	hideSeparator?: boolean;
};

export function PackMasonryGrid({
	packs,
	title = "All Packs",
	onPackPress,
	hideSeparator = false,
}: PackMasonryGridProps) {
	if (packs.length === 0 && !hideSeparator) {
		return (
			<View style={styles.emptyState}>
				<Ionicons
					name="search-outline"
					size={32}
					color={styles.emptyTitle.color}
					style={styles.emptyIcon}
				/>
				<Text style={styles.emptyTitle}>No packs found</Text>
				<Text style={styles.emptyBody}>
					Try a different search query or filter
				</Text>
			</View>
		);
	}

	if (hideSeparator) {
		return packs.map((pack, index) => (
			<View key={pack.id} style={styles.singleRow}>
				<PackRow
					pack={pack}
					isLast={index === packs.length - 1}
					onPress={() => onPackPress?.(pack.id)}
				/>
			</View>
		));
	}

	return (
		<View style={styles.wrap}>
			{/* List Header */}
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.count}>{packs.length} items</Text>
			</View>

			{/* Neo-Brutalist Grouped List Card */}
			<View style={styles.listContainer}>
				{packs.map((pack, index) => (
					<PackRow
						key={pack.id}
						pack={pack}
						isLast={index === packs.length - 1}
						onPress={() => onPackPress?.(pack.id)}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	wrap: {
		paddingHorizontal: theme.spacing.lg,
		paddingBottom: theme.spacing["4xl"],
	},
	singleRow: {
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.sm,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.spacing.md,
	},
	title: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.lg,
		fontWeight: theme.fontWeight.black,
		letterSpacing: -0.3,
	},
	count: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.bold,
	},
	listContainer: {
		backgroundColor: "#1A1A1A",
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#000000",
		overflow: "hidden",
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 4, height: 4 },
		elevation: 4,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md - 2,
		position: "relative",
	},
	emojiContainer: {
		width: 44,
		height: 44,
		borderRadius: 0,
		borderWidth: 1.5,
		borderColor: "#000000",
		backgroundColor: "#000000",
		alignItems: "center",
		justifyContent: "center",
		marginRight: theme.spacing.md,
		overflow: "hidden",
	},
	rowImage: {
		width: 38,
		height: 38,
	},
	rowEmoji: {
		fontSize: 22,
	},
	infoContainer: {
		flex: 1,
		justifyContent: "center",
		marginRight: theme.spacing.md,
	},
	rowName: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.base - 1,
		fontWeight: "900",
		letterSpacing: -0.15,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	rowCreator: {
		color: "#FFF500",
		fontSize: theme.fontSize.xs,
		fontWeight: "700",
	},
	dotSeparator: {
		color: theme.colors.muted,
		fontSize: 8,
		marginHorizontal: 6,
	},
	rowStats: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		marginLeft: 3,
	},
	actionContainer: {
		justifyContent: "center",
	},
	statsCard: {
		backgroundColor: "#1A1A1A",
		borderRadius: 0,
		borderWidth: 1.5,
		borderColor: "#FFF500",
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 4,
		minWidth: 62,
		alignItems: "center",
		gap: 2,
	},
	statsCardLabel: {
		color: "#FFF500",
		fontSize: 9,
		fontWeight: "900",
		letterSpacing: 0.2,
	},
	statsCardValue: {
		color: "#FFFFFF",
		fontSize: 10,
		fontWeight: "700",
	},
	divider: {
		position: "absolute",
		bottom: 0,
		left: 44 + 16 + 16,
		right: 0,
		height: 2,
		backgroundColor: "#000000",
	},
	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.spacing["4xl"],
		gap: theme.spacing.xs,
	},
	emptyIcon: {
		marginBottom: theme.spacing.sm,
		opacity: 0.7,
	},
	emptyTitle: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.bold,
	},
	emptyBody: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		textAlign: "center",
	},
}));
