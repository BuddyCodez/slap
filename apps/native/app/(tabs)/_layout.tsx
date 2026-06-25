import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

function TabIcon({
	name,
	color,
	focused,
}: {
	name: keyof typeof Ionicons.glyphMap;
	color: ColorValue;
	focused: boolean;
}) {
	return <Ionicons name={name} size={focused ? 24 : 22} color={color} />;
}

export default function TabLayout() {
	const { theme } = useUnistyles();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.muted,
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: styles.tabLabel,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							name={focused ? "home" : "home-outline"}
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="discover"
				options={{
					title: "Discover",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							name={focused ? "compass" : "compass-outline"}
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="upload"
				options={{
					title: "Upload",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							name={focused ? "add-circle" : "add-circle-outline"}
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="saved"
				options={{
					title: "Vault",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							name={focused ? "albums" : "albums-outline"}
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, focused }) => (
						<TabIcon
							name={focused ? "person" : "person-outline"}
							color={color}
							focused={focused}
						/>
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create((theme) => ({
	tabBar: {
		backgroundColor: theme.colors.background,
		borderTopColor: theme.colors.glassBorder,
		borderTopWidth: 1,
		height: 88,
		paddingTop: theme.spacing.sm,
		paddingBottom: theme.spacing.lg,
	},
	tabLabel: {
		fontSize: theme.fontSize.xs,
		fontWeight: theme.fontWeight.bold,
		letterSpacing: 0.2,
	},
}));
