import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { MockPack } from "@/constants/mock-packs";
import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PackRowProps = {
	pack: MockPack;
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
			{/* Left Emoji Badge */}
			<View style={styles.emojiContainer}>
				<Text style={styles.rowEmoji}>{pack.emoji}</Text>
			</View>

			{/* Middle Text Info */}
			<View style={styles.infoContainer}>
				<Text style={styles.rowName} numberOfLines={1}>
					{pack.name}
				</Text>
				<View style={styles.metaRow}>
					<Text style={styles.rowCreator}>@{pack.creator.name}</Text>
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
	packs: MockPack[];
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

			{/* Apple Inset Grouped List Card */}
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
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		overflow: "hidden",
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
		borderRadius: 8,
		backgroundColor: "rgba(255,255,255,0.03)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: theme.spacing.md,
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
		color: theme.colors.foreground,
		fontSize: theme.fontSize.base - 1,
		fontWeight: theme.fontWeight.bold,
		letterSpacing: -0.15,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 2,
	},
	rowCreator: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
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
		backgroundColor: theme.colors.primary,
		borderRadius: 15,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: 5,
		minWidth: 54,
		alignItems: "center",
	},
	getButtonText: {
		color: theme.colors.primaryForeground,
		fontSize: 11,
		fontWeight: theme.fontWeight.black,
		letterSpacing: 0.2,
	},
	divider: {
		position: "absolute",
		bottom: 0,
		left: 44 + 16 + 16, // aligns with content text
		right: 0,
		height: StyleSheet.hairlineWidth,
		backgroundColor: theme.colors.glassBorder,
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
