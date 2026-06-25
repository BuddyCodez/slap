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

import { authClient } from "@/lib/auth-client";
import { formatCount } from "@/utils/format";

type HeroSectionProps = {
	slapCount?: number;
};

export function HeroSection({ slapCount = 12_432 }: HeroSectionProps) {
	const scale = useSharedValue(0.97);
	const opacity = useSharedValue(0);

	const { data: session } = authClient.useSession();
	const name = session?.user?.name || "user";

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
					<Text style={styles.title}>HEY, @{name.toUpperCase()} ⚡</Text>
					<Text style={styles.subtitle}>
						YOUR STICKER ARCHIVE. EVERYWHERE.
					</Text>
				</View>
			</View>

			{/* Modern minimal metrics box (Brutalist style) */}
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
		fontWeight: "900", // Industrial block text
		letterSpacing: -0.8,
	},
	subtitle: {
		color: "#FFF500", // Cyber-Yellow subtitle accent
		fontSize: theme.fontSize.xs + 1,
		fontWeight: "900",
		marginTop: 4,
	},
	statsCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A1A1A",
		borderRadius: 4, // Sharp corners
		borderWidth: 2,
		borderColor: "#000000",
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
		gap: theme.spacing.md,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 3, height: 3 },
		elevation: 3,
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
		backgroundColor: "#FFF500", // Cyber-Yellow pulse dot
		zIndex: 2,
	},
	pulseRing: {
		position: "absolute",
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: "#FFF500",
		opacity: 0.25,
	},
	statsTextWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "baseline",
		gap: 6,
	},
	statsVal: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.lg,
		fontWeight: "900",
	},
	statsLabel: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: "700",
	},
}));
