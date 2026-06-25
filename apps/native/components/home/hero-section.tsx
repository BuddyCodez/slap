import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { formatCount } from "@/utils/format";

type HeroSectionProps = {
	slapCount?: number;
};

export function HeroSection({ slapCount = 12_432 }: HeroSectionProps) {
	const scale = useSharedValue(0.97);
	const opacity = useSharedValue(0);

	useEffect(() => {
		scale.value = withDelay(
			100,
			withSpring(1, { damping: 15, stiffness: 200 }),
		);
		opacity.value = withDelay(100, withTiming(1, { duration: 300 }));
	}, [opacity, scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	return (
		<Animated.View style={[styles.wrap, animatedStyle]}>
			{/* Title Header */}
			<View style={styles.headerRow}>
				<View>
					<Text style={styles.title}>SLAP Sticker Hub</Text>
					<Text style={styles.subtitle}>
						Discover, share, and save premium stickers
					</Text>
				</View>
			</View>

			{/* Modern minimal metrics box (Apple Health / Activity style) */}
			<View style={styles.statsCard}>
				<View style={styles.pulseContainer}>
					<View style={styles.pulseDot} />
					<View style={styles.pulseRing} />
				</View>
				<View style={styles.statsTextWrap}>
					<Text style={styles.statsVal}>{formatCount(slapCount)}</Text>
					<Text style={styles.statsLabel}>stickers slapped today</Text>
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create((theme) => ({
	wrap: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing.xl,
		paddingBottom: theme.spacing.md,
	},
	headerRow: {
		marginBottom: theme.spacing.lg,
	},
	title: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize["2xl"] + 2,
		fontWeight: theme.fontWeight.black,
		letterSpacing: -0.6,
	},
	subtitle: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		marginTop: 4,
	},
	statsCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		gap: theme.spacing.md,
	},
	pulseContainer: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	pulseDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: theme.colors.primary,
		zIndex: 2,
	},
	pulseRing: {
		position: "absolute",
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: theme.colors.primary,
		opacity: 0.15,
	},
	statsTextWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "baseline",
		gap: 6,
	},
	statsVal: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.lg,
		fontWeight: theme.fontWeight.black,
	},
	statsLabel: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.medium,
	},
}));
