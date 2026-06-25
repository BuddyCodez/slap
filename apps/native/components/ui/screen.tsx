import type { PropsWithChildren } from "react";
import {
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewStyle,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ScreenProps = PropsWithChildren<{
	scrollable?: boolean;
	contentContainerStyle?: ViewStyle;
	scrollProps?: Omit<ScrollViewProps, "contentContainerStyle" | "children">;
}>;

export function Screen({
	children,
	scrollable = true,
	contentContainerStyle,
	scrollProps,
}: ScreenProps) {
	if (!scrollable) {
		return <View style={styles.root}>{children}</View>;
	}

	return (
		<ScrollView
			style={styles.root}
			contentContainerStyle={[styles.content, contentContainerStyle]}
			contentInsetAdjustmentBehavior="automatic"
			showsVerticalScrollIndicator={false}
			{...scrollProps}
		>
			{children}
		</ScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		paddingBottom: theme.spacing["4xl"],
	},
}));
