import type { PropsWithChildren } from "react";
import {
	ScrollView,
	type ScrollViewProps,
	View,
	type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

type ScreenProps = PropsWithChildren<{
	scrollable?: boolean;
	contentContainerStyle?: ViewStyle;
	scrollProps?: Omit<ScrollViewProps, "contentContainerStyle" | "children">;
	safeAreaEdges?: ("top" | "bottom" | "left" | "right")[];
}>;

export function Screen({
	children,
	scrollable = true,
	contentContainerStyle,
	scrollProps,
	safeAreaEdges = ["top"],
}: ScreenProps) {
	if (!scrollable) {
		return (
			<SafeAreaView style={styles.root} edges={safeAreaEdges}>
				{children}
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.root} edges={safeAreaEdges}>
			<ScrollView
				contentContainerStyle={[styles.content, contentContainerStyle]}
				showsVerticalScrollIndicator={false}
				{...scrollProps}
			>
				{children}
			</ScrollView>
		</SafeAreaView>
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
