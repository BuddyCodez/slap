import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { authClient } from "@/lib/auth-client";

export default function Index() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (session) {
		return <Redirect href="/(tabs)" />;
	}

	return <Redirect href="/(auth)" />;
}

const styles = StyleSheet.create((theme) => ({
	loader: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
	},
}));
