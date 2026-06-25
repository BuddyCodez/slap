import * as Haptics from "expo-haptics";
import type { PropsWithChildren } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type PrimaryButtonProps = PropsWithChildren<{
	onPress?: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "default" | "secondary" | "discord";
}>;

export function PrimaryButton({
	children,
	onPress,
	loading = false,
	disabled = false,
	variant = "default",
}: PrimaryButtonProps) {
	const isDisabled = disabled || loading;

	const handlePress = () => {
		if (isDisabled) return;
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		onPress?.();
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.base,
				variant === "default" && styles.variantDefault,
				variant === "secondary" && styles.variantSecondary,
				variant === "discord" && styles.variantDiscord,
				isDisabled && styles.disabled,
				pressed && !isDisabled && styles.pressed,
			]}
			accessibilityRole="button"
		>
			{typeof children === "string" ? (
				<Text
					style={[
						styles.label,
						variant === "default" && styles.labelDefault,
						variant === "secondary" && styles.labelSecondary,
						variant === "discord" && styles.labelDiscord,
					]}
				>
					{children}
				</Text>
			) : (
				children
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	base: {
		borderRadius: theme.borderRadius.lg,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 50,
		paddingVertical: 14,
		paddingHorizontal: theme.spacing["2xl"],
	},
	variantDefault: {
		backgroundColor: theme.colors.primary,
	},
	variantSecondary: {
		backgroundColor: theme.colors.surfaceElevated,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	variantDiscord: {
		backgroundColor: "#5865F2",
	},
	label: {
		fontSize: theme.fontSize.base,
		fontWeight: theme.fontWeight.semibold,
	},
	labelDefault: {
		color: theme.colors.primaryForeground,
	},
	labelSecondary: {
		color: theme.colors.foreground,
	},
	labelDiscord: {
		color: "#FFFFFF",
	},
	disabled: {
		opacity: 0.4,
	},
	pressed: {
		opacity: 0.8,
	},
}));
