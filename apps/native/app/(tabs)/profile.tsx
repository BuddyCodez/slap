import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Screen } from "@/components/ui/screen";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";

function StatCard({
	label,
	value,
	accent,
	delay,
}: {
	label: string;
	value: string;
	accent: string;
	delay: number;
}) {
	const scale = useSharedValue(0.85);
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
		<Animated.View style={[styles.statCard, style]}>
			<View style={[styles.statAccentLine, { backgroundColor: accent }]} />
			<Text style={[styles.statValue, { color: accent }]}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</Animated.View>
	);
}

export default function ProfileScreen() {
	const { data: session } = authClient.useSession();
	const { theme } = useUnistyles();

	const BADGES = [
		{ icon: "⭐", label: "Early Slapper", color: theme.colors.primary },
		{ icon: "🔥", label: "Rising Creator", color: theme.colors.secondary },
	];

	const STAT_ITEMS = [
		{ label: "Uploads", value: "0", accent: theme.colors.primary },
		{ label: "Downloads", value: "0K", accent: theme.colors.accent },
		{ label: "Saves", value: "0", accent: theme.colors.secondary },
	];

	// Avatar entrance
	const avatarScale = useSharedValue(0.6);
	const avatarOpacity = useSharedValue(0);
	const nameOpacity = useSharedValue(0);

	useEffect(() => {
		avatarScale.value = withSpring(1, { damping: 10, stiffness: 180 });
		avatarOpacity.value = withTiming(1, { duration: 400 });
		nameOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
	}, [avatarOpacity, avatarScale, nameOpacity]);

	const avatarStyle = useAnimatedStyle(() => ({
		transform: [{ scale: avatarScale.value }],
		opacity: avatarOpacity.value,
	}));

	const nameStyle = useAnimatedStyle(() => ({
		opacity: nameOpacity.value,
	}));

	const handleSignOut = () => {
		void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
		authClient.signOut();
		queryClient.invalidateQueries();
	};

	return (
		<Screen contentContainerStyle={styles.content}>
			{/* Radial glow behind avatar */}
			<View
				style={[styles.avatarGlow, { backgroundColor: theme.colors.yellowGlow }]}
			/>

			{/* Avatar */}
			<Animated.View style={[styles.avatarWrap, avatarStyle]}>
				<View style={styles.avatar}>
					<Text style={styles.avatarEmoji}>😎</Text>
				</View>

				{/* Online indicator */}
				<View style={styles.onlineRing}>
					<View style={styles.onlineDot} />
				</View>
			</Animated.View>

			{/* Name & email */}
			<Animated.View style={[styles.nameBlock, nameStyle]}>
				<Text style={styles.name}>{session?.user.name ?? "Slapper"}</Text>
				<Text style={styles.email}>{session?.user.email ?? ""}</Text>
			</Animated.View>

			{/* Badges */}
			<View style={styles.badgesRow}>
				{BADGES.map((badge) => (
					<View
						key={badge.label}
						style={[styles.badge, { borderColor: badge.color + "33" }]}
					>
						<Text style={styles.badgeIcon}>{badge.icon}</Text>
						<Text style={[styles.badgeText, { color: badge.color }]}>
							{badge.label}
						</Text>
					</View>
				))}
			</View>

			{/* Stats */}
			<View style={styles.statsRow}>
				{STAT_ITEMS.map((s, i) => (
					<StatCard
						key={s.label}
						label={s.label}
						value={s.value}
						accent={s.accent}
						delay={i * 80}
					/>
				))}
			</View>

			{/* Activity section */}
			<View style={styles.activityCard}>
				<Text style={styles.activityTitle}>Your Activity</Text>
				<View style={styles.activityEmpty}>
					<Text style={styles.activityEmoji}>🎯</Text>
					<Text style={styles.activityText}>
						Start slapping packs to build your history!
					</Text>
				</View>
			</View>

			{/* Sign out */}
			<Pressable
				onPress={handleSignOut}
				style={({ pressed }) => [
					styles.signOutBtn,
					pressed && { opacity: 0.75 },
				]}
			>
				<Text style={styles.signOutText}>Sign Out</Text>
			</Pressable>
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	content: {
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing["3xl"],
		paddingBottom: theme.spacing["4xl"],
		alignItems: "center",
		gap: theme.spacing.lg,
		position: "relative",
	},
	avatarGlow: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 260,
		opacity: 0.15,
	},
	avatarWrap: {
		position: "relative",
		marginBottom: theme.spacing.sm,
	},
	avatar: {
		width: 104,
		height: 104,
		borderRadius: 52,
		backgroundColor: theme.colors.surfaceElevated,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1.5,
		borderColor: theme.colors.border,
	},
	avatarEmoji: {
		fontSize: 48,
	},
	onlineRing: {
		position: "absolute",
		bottom: 4,
		right: 4,
		width: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
	onlineDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: theme.colors.accent,
	},
	nameBlock: {
		alignItems: "center",
		gap: theme.spacing.xs,
	},
	name: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize["2xl"],
		fontWeight: theme.fontWeight.bold,
		letterSpacing: -0.3,
	},
	email: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
	},
	badgesRow: {
		flexDirection: "row",
		gap: theme.spacing.sm,
		flexWrap: "wrap",
		justifyContent: "center",
	},
	badge: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.xs,
		borderWidth: 1,
		borderRadius: theme.borderRadius.xl,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.xs,
		backgroundColor: "rgba(255,255,255,0.02)",
	},
	badgeIcon: {
		fontSize: 13,
	},
	badgeText: {
		fontSize: theme.fontSize.sm,
		fontWeight: theme.fontWeight.bold,
	},
	statsRow: {
		flexDirection: "row",
		gap: theme.spacing.sm,
		width: "100%",
	},
	statCard: {
		flex: 1,
		backgroundColor: theme.colors.surface,
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.xl,
		paddingVertical: theme.spacing.lg,
		paddingHorizontal: theme.spacing.md,
		alignItems: "center",
		overflow: "hidden",
		position: "relative",
		gap: theme.spacing.xs,
	},
	statAccentLine: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 2,
	},
	statValue: {
		fontSize: theme.fontSize.xl,
		fontWeight: theme.fontWeight.bold,
		letterSpacing: -0.3,
	},
	statLabel: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.semibold,
		textAlign: "center",
	},
	activityCard: {
		width: "100%",
		backgroundColor: theme.colors.surface,
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.borderRadius.xl,
		padding: theme.spacing.lg,
		gap: theme.spacing.md,
	},
	activityTitle: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.bold,
	},
	activityEmpty: {
		alignItems: "center",
		paddingVertical: theme.spacing.xl,
		gap: theme.spacing.sm,
	},
	activityEmoji: {
		fontSize: 28,
	},
	activityText: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		textAlign: "center",
		lineHeight: 20,
	},
	signOutBtn: {
		paddingVertical: 12,
		paddingHorizontal: theme.spacing["2xl"],
		borderRadius: theme.borderRadius.xxl,
		borderWidth: 1,
		borderColor: "rgba(255,77,77,0.2)",
		backgroundColor: "rgba(255,77,77,0.06)",
	},
	signOutText: {
		color: "#FF4D4D",
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.bold,
	},
}));
