import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { Screen } from "@/components/ui/screen";
import { SearchBar } from "@/components/ui/search-bar";

const FEATURED = [
	{ emoji: "🔥", label: "Memes", count: "2.4k packs", color: "#FF4FA3" },
	{ emoji: "🎌", label: "Anime", count: "1.8k packs", color: "#7DFF74" },
	{ emoji: "😂", label: "Reactions", count: "3.1k packs", color: "#FFD60A" },
	{ emoji: "🇮🇳", label: "Desi", count: "890 packs", color: "#FF9500" },
	{ emoji: "🐱", label: "Animals", count: "650 packs", color: "#64DCFF" },
	{ emoji: "✨", label: "Aesthetic", count: "1.2k packs", color: "#C896FF" },
];

function CategoryTile({
	emoji,
	label,
	count,
	color,
	delay,
}: {
	emoji: string;
	label: string;
	count: string;
	color: string;
	delay: number;
}) {
	const scale = useSharedValue(0.88);
	const opacity = useSharedValue(0);

	useEffect(() => {
		scale.value = withDelay(
			delay,
			withSpring(1, { damping: 12, stiffness: 200 }),
		);
		opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
	}, [delay, opacity, scale]);

	const style = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	return (
		<Animated.View style={[styles.tile, style]}>
			<LinearGradient
				colors={[`${color}28`, `${color}08`]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.tileFill}
			>
				<Text style={styles.tileEmoji}>{emoji}</Text>
				<Text style={styles.tileLabel}>{label}</Text>
				<Text style={[styles.tileCount, { color }]}>{count}</Text>
			</LinearGradient>
		</Animated.View>
	);
}

export default function DiscoverScreen() {
	// Compass rotation animation
	const rotation = useSharedValue(0);
	useEffect(() => {
		rotation.value = withRepeat(
			withSequence(
				withTiming(12, { duration: 1200 }),
				withTiming(-12, { duration: 1200 }),
				withTiming(0, { duration: 600 }),
			),
			-1,
		);
	}, [rotation]);

	const compassStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	return (
		<Screen contentContainerStyle={styles.content}>
			<LinearGradient
				colors={["rgba(125,255,116,0.08)", "transparent"]}
				style={styles.topGlow}
			/>

			<View style={styles.header}>
				<Animated.Text style={[styles.icon, compassStyle]}>🔎</Animated.Text>
				<View>
					<Text style={styles.title}>Discover</Text>
					<Text style={styles.subtitle}>Find your next obsession</Text>
				</View>
			</View>

			{/* Search bar inline */}
			<SearchBar
				value=""
				onChangeText={() => {}}
				placeholder="Search across all packs..."
			/>

			{/* Section */}
			<View style={styles.sectionHeader}>
				<View style={[styles.accentBar, { backgroundColor: "#7DFF74" }]} />
				<Text style={styles.sectionTitle}>Browse by Category</Text>
			</View>

			<View style={styles.grid}>
				{FEATURED.map((cat, i) => (
					<CategoryTile
						key={cat.label}
						emoji={cat.emoji}
						label={cat.label}
						count={cat.count}
						color={cat.color}
						delay={i * 55}
					/>
				))}
			</View>

			{/* Coming soon hint */}
			<View style={styles.comingSoon}>
				<Text style={styles.comingSoonText}>
					🚀 Full search & filters — coming next drop
				</Text>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	content: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing["3xl"],
		paddingBottom: theme.spacing["4xl"],
		gap: theme.spacing.lg,
	},
	topGlow: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 160,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.md,
		marginBottom: theme.spacing.sm,
	},
	icon: {
		fontSize: 42,
	},
	title: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize["3xl"],
		fontWeight: theme.fontWeight.black,
		letterSpacing: -0.5,
	},
	subtitle: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.sm,
		marginTop: theme.spacing.sm,
	},
	accentBar: {
		width: 3,
		height: 18,
		borderRadius: 2,
	},
	sectionTitle: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.xl,
		fontWeight: theme.fontWeight.black,
		letterSpacing: -0.3,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.spacing.sm,
	},
	tile: {
		width: "48%",
		borderRadius: theme.borderRadius.xl,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
	},
	tileFill: {
		padding: theme.spacing.lg,
		gap: theme.spacing.xs,
		minHeight: 100,
		justifyContent: "center",
	},
	tileEmoji: {
		fontSize: 28,
		marginBottom: theme.spacing.xs,
	},
	tileLabel: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.black,
	},
	tileCount: {
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.bold,
	},
	comingSoon: {
		backgroundColor: theme.colors.glass,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.lg,
		alignItems: "center",
		marginTop: theme.spacing.md,
	},
	comingSoonText: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		fontWeight: theme.fontWeight.medium,
		textAlign: "center",
	},
}));
