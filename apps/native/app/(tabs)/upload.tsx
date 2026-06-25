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

const STEPS = [
	{ num: "1", label: "Upload", icon: "📤", done: false },
	{ num: "2", label: "Details", icon: "✏️", done: false },
	{ num: "3", label: "Processing", icon: "⚡", done: false },
	{ num: "4", label: "Live!", icon: "🎉", done: false },
];

function StepDot({
	step,
	delay,
	active,
}: {
	step: (typeof STEPS)[0];
	delay: number;
	active: boolean;
}) {
	const scale = useSharedValue(0.7);
	const opacity = useSharedValue(0);

	useEffect(() => {
		scale.value = withDelay(
			delay,
			withSpring(1, { damping: 10, stiffness: 200 }),
		);
		opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
	}, [delay, opacity, scale]);

	const style = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	return (
		<Animated.View style={[styles.step, style]}>
			<View style={[styles.stepDot, active && styles.stepDotActive]}>
				<Text style={styles.stepIcon}>{step.icon}</Text>
			</View>
			<Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
				{step.label}
			</Text>
		</Animated.View>
	);
}

export default function UploadScreen() {
	// Cooking animation — rocket orbiting
	const rotation = useSharedValue(0);
	const cookScale = useSharedValue(1);

	useEffect(() => {
		rotation.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
		cookScale.value = withRepeat(
			withSequence(
				withTiming(1.08, { duration: 600 }),
				withTiming(0.95, { duration: 500 }),
				withTiming(1, { duration: 400 }),
			),
			-1,
		);
	}, [cookScale, rotation]);

	const rocketStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	const potStyle = useAnimatedStyle(() => ({
		transform: [{ scale: cookScale.value }],
	}));

	return (
		<Screen contentContainerStyle={styles.content}>
			<LinearGradient
				colors={["rgba(255,214,10,0.1)", "transparent"]}
				style={styles.topGlow}
			/>

			{/* Header */}
			<View style={styles.header}>
				<Animated.Text style={[styles.cookIcon, potStyle]}>🍳</Animated.Text>
				<Animated.Text style={[styles.rocketIcon, rocketStyle]}>
					🚀
				</Animated.Text>
			</View>

			<View style={styles.titleBlock}>
				<Text style={styles.title}>Cook a Pack</Text>
				<Text style={styles.subtitle}>
					Upload your stickers.{"\n"}Share with the world.
				</Text>
			</View>

			{/* Step progress */}
			<View style={styles.stepsCard}>
				<Text style={styles.stepsLabel}>How it works</Text>
				<View style={styles.stepsRow}>
					{STEPS.map((step, i) => (
						<View key={step.num} style={styles.stepWrap}>
							<StepDot step={step} delay={i * 80} active={i === 0} />
							{i < STEPS.length - 1 && <View style={styles.stepLine} />}
						</View>
					))}
				</View>
			</View>

			{/* Cooking hint card */}
			<View style={styles.hintCard}>
				<View style={styles.hintRow}>
					<Text style={styles.hintEmoji}>✨</Text>
					<View style={styles.hintBody}>
						<Text style={styles.hintTitle}>Cooking your sticker pack...</Text>
						<Text style={styles.hintText}>
							Supported: PNG, GIF, WebP · Max 512KB per sticker · Up to 30
							stickers
						</Text>
					</View>
				</View>
				<View style={styles.processingBar}>
					<LinearGradient
						colors={[`${"#FFD60A"}`, "#FFF27A"]}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.processingFill}
					/>
				</View>
			</View>

			{/* CTA */}
			<View style={styles.comingSoon}>
				<Text style={styles.comingSoonEmoji}>⚡</Text>
				<Text style={styles.comingSoonTitle}>Upload dropping soon</Text>
				<Text style={styles.comingSoonText}>
					You'll be able to slap your own packs and go viral.
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
		height: 180,
	},
	header: {
		alignItems: "center",
		justifyContent: "center",
		height: 120,
		position: "relative",
	},
	cookIcon: {
		fontSize: 64,
	},
	rocketIcon: {
		position: "absolute",
		fontSize: 24,
		top: 10,
		right: "30%",
	},
	titleBlock: {
		alignItems: "center",
		gap: theme.spacing.sm,
	},
	title: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize["3xl"],
		fontWeight: theme.fontWeight.black,
		textAlign: "center",
		letterSpacing: -0.5,
	},
	subtitle: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.base,
		textAlign: "center",
		lineHeight: 22,
	},
	stepsCard: {
		backgroundColor: theme.colors.surface,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		borderRadius: theme.borderRadius.xl,
		padding: theme.spacing.lg,
		gap: theme.spacing.md,
	},
	stepsLabel: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.bold,
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	stepsRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	stepWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
	},
	step: {
		alignItems: "center",
		gap: 6,
	},
	stepDot: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		alignItems: "center",
		justifyContent: "center",
	},
	stepDotActive: {
		backgroundColor: "rgba(255,214,10,0.2)",
		borderColor: theme.colors.primary,
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.5,
		shadowRadius: 8,
		elevation: 6,
	},
	stepIcon: {
		fontSize: 18,
	},
	stepLabel: {
		color: theme.colors.muted,
		fontSize: 10,
		fontWeight: theme.fontWeight.semibold,
		textAlign: "center",
	},
	stepLabelActive: {
		color: theme.colors.primary,
	},
	stepLine: {
		flex: 1,
		height: 1,
		backgroundColor: theme.colors.glassBorder,
		marginHorizontal: 4,
		marginBottom: 16,
	},
	hintCard: {
		backgroundColor: theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: "rgba(255,214,10,0.25)",
		borderRadius: theme.borderRadius.xl,
		padding: theme.spacing.lg,
		gap: theme.spacing.md,
	},
	hintRow: {
		flexDirection: "row",
		gap: theme.spacing.md,
		alignItems: "flex-start",
	},
	hintEmoji: {
		fontSize: 22,
		marginTop: 2,
	},
	hintBody: {
		flex: 1,
		gap: theme.spacing.xs,
	},
	hintTitle: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.black,
	},
	hintText: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		lineHeight: 18,
	},
	processingBar: {
		height: 4,
		backgroundColor: theme.colors.glass,
		borderRadius: 2,
		overflow: "hidden",
	},
	processingFill: {
		height: "100%",
		width: "65%",
		borderRadius: 2,
	},
	comingSoon: {
		alignItems: "center",
		gap: theme.spacing.sm,
		padding: theme.spacing.xl,
		backgroundColor: theme.colors.glass,
		borderRadius: theme.borderRadius.xl,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
	},
	comingSoonEmoji: {
		fontSize: 32,
	},
	comingSoonTitle: {
		color: theme.colors.primary,
		fontSize: theme.fontSize.xl,
		fontWeight: theme.fontWeight.black,
		textAlign: "center",
	},
	comingSoonText: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		textAlign: "center",
		lineHeight: 20,
	},
}));
