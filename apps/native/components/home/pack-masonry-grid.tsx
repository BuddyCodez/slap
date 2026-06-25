import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View, Image } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PackRowProps = {
	pack: any;
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
		scale.value = withSpring(0.98, { damping: 15, stiffness: 350 });
		opacity.value = withSpring(0.8, { damping: 15, stiffness: 350 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 12, stiffness: 280 });
		opacity.value = withSpring(1, { damping: 12, stiffness: 280 });
	};

	const imageUrl = pack.thumbnail || pack.stickers?.[0]?.url;

	return (
		<AnimatedPressable
			onPress={() => {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress?.();
			}}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[styles.row, animatedStyle]}
		>
			{/* Left Preview Image/Emoji Badge */}
			<View style={styles.emojiContainer}>
				{imageUrl ? (
					<Image source={{ uri: imageUrl }} style={styles.rowImage} resizeMode="contain" />
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
				</View>
			</View>

			{/* Right Action Trigger */}
			<View style={styles.actionContainer}>
				<View style={styles.getButton}>
					<Text style={styles.getButtonText}>GET</Text>
				</View>
			</View>

			{/* Apple-style thin divider line */}
			{!isLast && <View style={styles.divider} />}
		</AnimatedPressable>
	);
}

type PackMasonryGridProps = {
	packs: any[];
	title?: string;
};

export function PackMasonryGrid({
	packs,
	title = "All Packs",
}: PackMasonryGridProps) {
	if (packs.length === 0) {
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
		backgroundColor: "#1A1A1A", // Dark Brutalist surface
		borderRadius: 4, // Sharp corners
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
		borderRadius: 2,
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
		fontWeight: "900", // Heavy block font weight
		letterSpacing: -0.15,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	rowCreator: {
		color: "#FFF500", // Cyber-Yellow accent
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
	getButton: {
		backgroundColor: "#FFF500", // Cyber-Yellow button
		borderRadius: 4, // Sharp corners
		borderWidth: 2,
		borderColor: "#000000",
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 5,
		minWidth: 54,
		alignItems: "center",
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 2, height: 2 },
	},
	getButtonText: {
		color: "#000000",
		fontSize: 11,
		fontWeight: "900", // Extra heavy font weight
		letterSpacing: 0.2,
	},
	divider: {
		position: "absolute",
		bottom: 0,
		left: 44 + 16 + 16,
		right: 0,
		height: 2,
		backgroundColor: "#000000", // Strong black divider line
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
