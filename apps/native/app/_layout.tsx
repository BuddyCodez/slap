import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native-unistyles";

if (typeof global.File === "undefined") {
	class File extends Blob {
		name: string;
		lastModified: number;
		constructor(parts: any[], filename: string, options?: any) {
			super(parts, options);
			this.name = filename;
			this.lastModified = options?.lastModified || Date.now();
		}
	}
	global.File = File as any;
}

import { queryClient } from "@/utils/orpc";

import "../unistyles";

export default function RootLayout() {
	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={styles.root}>
				<StatusBar hidden />
				<Stack screenOptions={{ headerShown: false, animation: "fade" }}>
					<Stack.Screen name="index" />
					<Stack.Screen name="(auth)" />
					<Stack.Screen name="(tabs)" />
				</Stack>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
}));
