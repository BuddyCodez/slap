import * as Haptics from "expo-haptics";
import { Image, Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TrendingPackCardProps = {
	pack: any;
	onPress?: () => void;
};

export function TrendingPackCard({ pack, onPress }: TrendingPackCardProps) {
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const imageUrl = pack.thumbnail || pack.stickers?.[0]?.url;

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
			accessibilityLabel={`${pack.name} by ${pack.creator?.name || "Unknown"}`}
		>
			{/* Sticker / Emoji Preview Box */}
			<View style={styles.thumb}>
				{imageUrl ? (
					<Image
						source={{ uri: imageUrl }}
						style={styles.previewImage}
						resizeMode="contain"
					/>
				) : (
					<Text style={styles.emoji}>{pack.emoji || "⚡"}</Text>
				)}
			</View>

			{/* Pack Name */}
			<Text style={styles.name} numberOfLines={1}>
				{pack.name}
			</Text>

			{/* Creator Handle */}
			<Text style={styles.creator} numberOfLines={1}>
				@{pack.creator?.name || "user"}
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
		backgroundColor: "#1A1A1A", // Dark Brutalist card background
		borderRadius: 4, // Sharp corners
		padding: theme.spacing.md,
		borderWidth: 2,
		borderColor: "#000000",
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 4, height: 4 },
		elevation: 4,
	},
	thumb: {
		height: 80,
		backgroundColor: "#000000",
		borderWidth: 1.5,
		borderColor: "#000000",
		borderRadius: 2,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.spacing.sm,
		overflow: "hidden",
	},
	previewImage: {
		width: 60,
		height: 60,
	},
	emoji: {
		fontSize: 34,
	},
	name: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.sm,
		fontWeight: "900",
		letterSpacing: -0.1,
	},
	creator: {
		color: "#FFF500", // Cyber-Yellow accent
		fontSize: theme.fontSize.xs,
		fontWeight: "700",
		marginTop: 2,
		marginBottom: theme.spacing.sm,
	},
	statsRow: {
		flexDirection: "row",
		gap: theme.spacing.sm,
		borderTopWidth: 1.5,
		borderColor: "#000000",
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
		fontWeight: "700",
	},
}));

export type { TrendingPackCardProps };
