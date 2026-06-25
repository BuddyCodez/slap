import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import type { MockPack } from "@/constants/mock-packs";
import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Subtle gradient per category for the card background
const CATEGORY_ACCENTS: Record<string, string> = {
	reactions: "rgba(255,214,10,0.12)",
	memes: "rgba(255,79,163,0.12)",
	anime: "rgba(125,255,116,0.12)",
	desi: "rgba(255,165,0,0.12)",
	animals: "rgba(100,220,255,0.12)",
	aesthetic: "rgba(200,150,255,0.12)",
};

type PackGridCardProps = {
	pack: MockPack;
	onPress?: () => void;
};

export function PackGridCard({ pack, onPress }: PackGridCardProps) {
	const scale = useSharedValue(1);
	const elevation = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }, { rotate: `${pack.rotation}deg` }],
		shadowOpacity: elevation.value,
	}));

	const accent = CATEGORY_ACCENTS[pack.category] ?? "rgba(255,214,10,0.10)";

	return (
		<AnimatedPressable
			onPress={() => {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress?.();
			}}
			onPressIn={() => {
				scale.value = withSpring(0.94, { damping: 12, stiffness: 360 });
				elevation.value = withTiming(0.6, { duration: 100 });
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 10, stiffness: 280 });
				elevation.value = withTiming(0, { duration: 200 });
			}}
			style={[styles.card, { minHeight: pack.height }, animatedStyle]}
			accessibilityRole="button"
			accessibilityLabel={`${pack.name} pack`}
		>
			{/* Category accent background strip */}
			<View style={[styles.accentTop, { backgroundColor: accent }]} />

			{/* Emoji hero */}
			<Text style={styles.emoji}>{pack.emoji}</Text>

			{/* Name */}
			<Text style={styles.name} numberOfLines={2}>
				{pack.name}
			</Text>

			{/* Footer: download badge */}
			<View style={styles.footer}>
				<LinearGradient
					colors={["rgba(255,214,10,0.18)", "rgba(255,214,10,0.06)"]}
					style={styles.downloadBadge}
				>
					<Text style={styles.downloadIcon}>↓</Text>
					<Text style={styles.downloadStat}>{formatCount(pack.downloads)}</Text>
				</LinearGradient>
			</View>

			{/* Tiny dot rank indicator */}
			<View style={styles.categoryDot}>
				<View
					style={[
						styles.dot,
						{ backgroundColor: accent.replace("0.12", "0.9") },
					]}
				/>
			</View>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		flex: 1,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: theme.borderRadius.lg,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		padding: theme.spacing.md,
		justifyContent: "space-between",
		overflow: "hidden",
		...theme.shadows.sticker,
	},
	accentTop: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 3,
		borderTopLeftRadius: theme.borderRadius.lg,
		borderTopRightRadius: theme.borderRadius.lg,
	},
	emoji: {
		fontSize: 32,
		marginTop: theme.spacing.sm,
		marginBottom: theme.spacing.sm,
	},
	name: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.sm,
		fontWeight: theme.fontWeight.bold,
		lineHeight: 18,
		letterSpacing: -0.1,
		flex: 1,
	},
	footer: {
		marginTop: theme.spacing.sm,
	},
	downloadBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		alignSelf: "flex-start",
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: 3,
		borderRadius: theme.borderRadius.pill,
	},
	downloadIcon: {
		color: theme.colors.primary,
		fontSize: 9,
		fontWeight: theme.fontWeight.black,
	},
	downloadStat: {
		color: theme.colors.primary,
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.bold,
	},
	categoryDot: {
		position: "absolute",
		top: theme.spacing.sm,
		right: theme.spacing.sm,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
}));
