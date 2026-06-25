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

const MOCK_VAULT = [
	{ id: "1", emoji: "😼", name: "Chaos Cat", badge: "🔥", saves: 3200 },
	{ id: "2", emoji: "🇮🇳", name: "Desi Reacts", badge: "✨", saves: 2800 },
	{ id: "3", emoji: "💢", name: "Anime Rage", badge: "⭐", saves: 2100 },
	{ id: "4", emoji: "✨", name: "Main Character", badge: "🎯", saves: 1900 },
	{ id: "5", emoji: "😭", name: "Crying Laugh", badge: null, saves: 1200 },
	{ id: "6", emoji: "🗿", name: "Sigma Stare", badge: null, saves: 980 },
];

function VaultCard({
	emoji,
	name,
	badge,
	saves,
	delay,
}: {
	emoji: string;
	name: string;
	badge: string | null;
	saves: number;
	delay: number;
}) {
	const scale = useSharedValue(0.8);
	const opacity = useSharedValue(0);

	useEffect(() => {
		scale.value = withDelay(
			delay,
			withSpring(1, { damping: 12, stiffness: 200 }),
		);
		opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
	}, [delay, opacity, scale]);

	const style = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	return (
		<Animated.View style={[styles.vaultCard, style]}>
			{badge && (
				<View style={styles.rareBadge}>
					<Text style={styles.rareBadgeText}>{badge}</Text>
				</View>
			)}
			<View style={styles.vaultThumb}>
				<Text style={styles.vaultEmoji}>{emoji}</Text>
			</View>
			<Text style={styles.vaultName} numberOfLines={2}>
				{name}
			</Text>
			<Text style={styles.vaultSaves}>♥ {saves.toLocaleString()}</Text>
		</Animated.View>
	);
}

function ProgressRing({ progress }: { progress: number }) {
	const strokeWidth = 6;
	const radius = 36;
	const circumference = 2 * Math.PI * radius;
	const dash = useSharedValue(0);

	useEffect(() => {
		dash.value = withDelay(
			300,
			withTiming(progress * circumference, { duration: 1200 }),
		);
	}, [circumference, dash, progress]);

	return (
		<View style={styles.ringWrap}>
			<Text style={styles.ringPercent}>{Math.round(progress * 100)}%</Text>
			<Text style={styles.ringLabel}>complete</Text>
		</View>
	);
}

export default function SavedScreen() {
	const titleOpacity = useSharedValue(0);
	const titleY = useSharedValue(16);

	useEffect(() => {
		titleOpacity.value = withTiming(1, { duration: 500 });
		titleY.value = withSpring(0, { damping: 14, stiffness: 180 });
	}, [titleOpacity, titleY]);

	const titleStyle = useAnimatedStyle(() => ({
		opacity: titleOpacity.value,
		transform: [{ translateY: titleY.value }],
	}));

	// Pulse the vault icon
	const vaultScale = useSharedValue(1);
	useEffect(() => {
		vaultScale.value = withRepeat(
			withSequence(
				withTiming(1.06, { duration: 900 }),
				withTiming(0.96, { duration: 700 }),
				withTiming(1, { duration: 400 }),
			),
			-1,
		);
	}, [vaultScale]);
	const vaultStyle = useAnimatedStyle(() => ({
		transform: [{ scale: vaultScale.value }],
	}));

	return (
		<Screen contentContainerStyle={styles.content}>
			<LinearGradient
				colors={["rgba(255,214,10,0.12)", "transparent"]}
				style={styles.topGlow}
			/>

			<Animated.View style={titleStyle}>
				<View style={styles.titleWrap}>
					<Animated.Text style={[styles.vaultIcon, vaultStyle]}>
						🗃️
					</Animated.Text>
					<Text style={styles.title}>Your Slap Vault</Text>
					<Text style={styles.subtitle}>
						Saved packs • Rare badges • Your collection
					</Text>
				</View>
			</Animated.View>

			{/* Progress row */}
			<View style={styles.progressCard}>
				<ProgressRing progress={0.4} />
				<View style={styles.progressInfo}>
					<Text style={styles.progressTitle}>Collector Progress</Text>
					<Text style={styles.progressSub}>
						{MOCK_VAULT.length} of 15 packs saved
					</Text>
					<View style={styles.progressBar}>
						<View
							style={[
								styles.progressFill,
								{ width: `${(MOCK_VAULT.length / 15) * 100}%` },
							]}
						/>
					</View>
				</View>
			</View>

			{/* Recently saved label */}
			<View style={styles.sectionHeader}>
				<View style={styles.accentBar} />
				<Text style={styles.sectionTitle}>Recently Saved</Text>
			</View>

			{/* Grid */}
			<View style={styles.grid}>
				{MOCK_VAULT.map((item, i) => (
					<VaultCard
						key={item.id}
						emoji={item.emoji}
						name={item.name}
						badge={item.badge}
						saves={item.saves}
						delay={i * 60}
					/>
				))}
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
		height: 180,
	},
	titleWrap: {
		alignItems: "center",
		gap: theme.spacing.xs,
		paddingBottom: theme.spacing.md,
	},
	vaultIcon: {
		fontSize: 44,
		marginBottom: theme.spacing.sm,
	},
	title: {
		color: theme.colors.primary,
		fontSize: theme.fontSize["3xl"],
		fontWeight: theme.fontWeight.black,
		textAlign: "center",
		letterSpacing: -0.5,
	},
	subtitle: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		textAlign: "center",
	},
	progressCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		borderRadius: theme.borderRadius.xl,
		padding: theme.spacing.lg,
		gap: theme.spacing.lg,
	},
	ringWrap: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 6,
		borderColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(255,214,10,0.08)",
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.45,
		shadowRadius: 10,
		elevation: 6,
	},
	ringPercent: {
		color: theme.colors.primary,
		fontSize: theme.fontSize.xl,
		fontWeight: theme.fontWeight.black,
		lineHeight: 24,
	},
	ringLabel: {
		color: theme.colors.muted,
		fontSize: 9,
		fontWeight: theme.fontWeight.semibold,
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
	progressInfo: {
		flex: 1,
		gap: theme.spacing.xs,
	},
	progressTitle: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.black,
	},
	progressSub: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
	},
	progressBar: {
		height: 4,
		backgroundColor: theme.colors.surfaceElevated,
		borderRadius: 2,
		marginTop: theme.spacing.xs,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		backgroundColor: theme.colors.primary,
		borderRadius: 2,
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
		backgroundColor: theme.colors.primary,
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
	vaultCard: {
		width: "31%",
		backgroundColor: theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		borderRadius: theme.borderRadius.lg,
		padding: theme.spacing.md,
		position: "relative",
		overflow: "hidden",
		minHeight: 130,
		justifyContent: "space-between",
	},
	rareBadge: {
		position: "absolute",
		top: 6,
		right: 6,
		backgroundColor: "rgba(255,214,10,0.2)",
		borderRadius: theme.borderRadius.pill,
		padding: 3,
		zIndex: 1,
	},
	rareBadgeText: {
		fontSize: 10,
	},
	vaultThumb: {
		height: 56,
		alignItems: "center",
		justifyContent: "center",
	},
	vaultEmoji: {
		fontSize: 30,
	},
	vaultName: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.bold,
		lineHeight: 16,
		textAlign: "center",
	},
	vaultSaves: {
		color: theme.colors.muted,
		fontSize: 10,
		textAlign: "center",
		marginTop: 2,
	},
}));
