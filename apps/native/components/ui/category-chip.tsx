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
		borderRadius: 4, // Sharp corners
		borderWidth: 2,
		borderColor: "#000000",
		minHeight: 38,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 3, height: 3 },
		elevation: 3,
	},
	chipActive: {
		backgroundColor: "#FFF500", // Cyber-Yellow for active state
	},
	chipInactive: {
		backgroundColor: "#1A1A1A", // Dark industrial background
	},
	emoji: {
		fontSize: theme.fontSize.sm,
		lineHeight: 18,
	},
	label: {
		fontSize: theme.fontSize.xs + 1,
		fontWeight: "900", // Blocky heavy text
	},
	labelActive: {
		color: "#000000",
	},
	labelInactive: {
		color: "#FFFFFF",
	},
}));

export type { CategoryChipProps };
