import { StyleSheet, View, type ViewStyle } from "react-native";

interface ButtonSkeletonProps {
	size?: "small" | "medium" | "large";
	style?: ViewStyle;
}

/**
 * ButtonSkeleton - Static skeleton loader for button loading states
 * Used when buttons are disabled during async operations (submit, download, etc.)
 * Creates a simple placeholder block matching button dimensions
 */
export function ButtonSkeleton({
	size = "medium",
	style,
}: ButtonSkeletonProps) {
	return <View style={[styles[size], style]} />;
}

const styles = StyleSheet.create({
	small: {
		height: 32,
		width: 32,
		borderRadius: 4,
		backgroundColor: "#e0e0e0",
	},
	medium: {
		height: 40,
		width: 40,
		borderRadius: 4,
		backgroundColor: "#e0e0e0",
	},
	large: {
		height: 48,
		width: "100%",
		borderRadius: 4,
		backgroundColor: "#e0e0e0",
	},
});
