import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CategoryChipProps = {
	label: string;
	emoji: string;
	active?: boolean;
	onPress?: () => void;
};

export function CategoryChip({
	label,
	emoji,
	active = false,
	onPress,
}: CategoryChipProps) {
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handlePressIn = () => {
		scale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 12, stiffness: 280 });
	};

	const handlePress = () => {
		void Haptics.selectionAsync();
		onPress?.();
	};

	return (
		<AnimatedPressable
			onPress={handlePress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.chip,
				active ? styles.chipActive : styles.chipInactive,
				animatedStyle,
			]}
			accessibilityRole="button"
			accessibilityState={{ selected: active }}
		>
			<Text style={styles.emoji}>{emoji}</Text>
			<Text
				style={[
					styles.label,
					active ? styles.labelActive : styles.labelInactive,
				]}
			>
				{label}
			</Text>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.xs,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: 10, // iOS-style rounded-rect pills
		borderWidth: 1,
		minHeight: 36,
	},
	chipActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	chipInactive: {
		backgroundColor: theme.colors.surfaceElevated,
		borderColor: theme.colors.glassBorder,
	},
	emoji: {
		fontSize: theme.fontSize.sm,
		lineHeight: 18,
	},
	label: {
		fontSize: theme.fontSize.xs + 1,
		fontWeight: theme.fontWeight.bold,
	},
	labelActive: {
		color: theme.colors.primaryForeground,
	},
	labelInactive: {
		color: theme.colors.foreground,
	},
}));

export type { CategoryChipProps };
