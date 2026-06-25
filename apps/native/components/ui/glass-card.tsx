import type { PropsWithChildren } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

type GlassCardProps = PropsWithChildren<{
	style?: ViewStyle;
	glow?: boolean;
	/** Elevated variant: slightly lighter surface, stronger border */
	elevated?: boolean;
	/** Yellow accent border on top edge */
	accent?: boolean;
}>;

export function GlassCard({
	children,
	style,
	glow = false,
	elevated = false,
	accent = false,
}: GlassCardProps) {
	const glowPulse = useSharedValue(glow ? 0.5 : 0);

	// Breathing glow when `glow` prop is true
	if (glow) {
		glowPulse.value = withTiming(0.7, { duration: 1800 });
	}

	const glowStyle = useAnimatedStyle(() => ({
		shadowOpacity: glowPulse.value,
	}));

	return (
		<Animated.View
			style={[
				styles.card,
				elevated && styles.cardElevated,
				glow && styles.glow,
				glow && glowStyle,
				style,
			]}
		>
			{accent && <View style={styles.accentLine} />}
			{children}
		</Animated.View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.glass,
		borderWidth: 1,
		borderColor: theme.colors.glassBorder,
		borderRadius: theme.borderRadius.lg,
		overflow: "hidden",
	},
	cardElevated: {
		backgroundColor: "rgba(255,255,255,0.10)",
		borderColor: "rgba(255,255,255,0.18)",
	},
	glow: {
		shadowColor: theme.colors.primary,
		shadowOffset: { width: 0, height: 0 },
		shadowRadius: 20,
		elevation: 8,
	},
	accentLine: {
		height: 2,
		backgroundColor: theme.colors.primary,
		marginBottom: 0,
	},
}));
