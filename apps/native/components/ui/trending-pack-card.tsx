import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import type { MockPack } from "@/constants/mock-packs";
import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TrendingPackCardProps = {
	pack: MockPack;
	onPress?: () => void;
};

export function TrendingPackCard({ pack, onPress }: TrendingPackCardProps) {
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<AnimatedPressable
			onPress={() => {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress?.();
			}}
			onPressIn={() => {
				scale.value = withSpring(0.97, { damping: 15, stiffness: 350 });
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 12, stiffness: 280 });
			}}
			style={[styles.card, animatedStyle]}
			accessibilityRole="button"
			accessibilityLabel={`${pack.name} by ${pack.creator.name}`}
		>
			{/* Sticker / Emoji Preview Box */}
			<View style={styles.thumb}>
				<Text style={styles.emoji}>{pack.emoji}</Text>
			</View>

			{/* Pack Name */}
			<Text style={styles.name} numberOfLines={1}>
				{pack.name}
			</Text>

			{/* Creator Handle */}
			<Text style={styles.creator} numberOfLines={1}>
				@{pack.creator.name}
			</Text>

			{/* Metadata & Downloads */}
			<View style={styles.statsRow}>
				<View style={styles.statItem}>
					<Text style={styles.statIcon}>↓</Text>
					<Text style={styles.statVal}>{formatCount(pack.downloads)}</Text>
				</View>
				<View style={styles.statItem}>
					<Text style={styles.statIcon}>♥</Text>
					<Text style={styles.statVal}>{formatCount(pack.saves)}</Text>
				</View>
			</View>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		width: 140,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: 12,
		padding: theme.spacing.md,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
	},
	thumb: {
		height: 80,
		backgroundColor: "rgba(255, 255, 255, 0.03)",
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.spacing.sm,
	},
	emoji: {
		fontSize: 36,
	},
	name: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.sm,
		fontWeight: theme.fontWeight.bold,
		letterSpacing: -0.1,
	},
	creator: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		marginTop: 2,
		marginBottom: theme.spacing.sm,
	},
	statsRow: {
		flexDirection: "row",
		gap: theme.spacing.sm,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: theme.colors.glassBorder,
		paddingTop: theme.spacing.xs,
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
	},
	statIcon: {
		color: theme.colors.muted,
		fontSize: 10,
	},
	statVal: {
		color: theme.colors.foreground,
		fontSize: 10,
		fontWeight: theme.fontWeight.semibold,
	},
}));

export type { TrendingPackCardProps };
