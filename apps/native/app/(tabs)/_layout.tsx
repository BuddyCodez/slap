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
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#FFF500", // Cyber-Yellow active tab color
				tabBarInactiveTintColor: "#8E8E9F",
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
		backgroundColor: "#0A0A0A", // Dark industrial background
		borderTopColor: "#000000",
		borderTopWidth: 3, // Bold thick border at top of tab bar
		height: 84,
		paddingTop: theme.spacing.sm,
		paddingBottom: 24,
	},
	tabLabel: {
		fontSize: 10,
		fontWeight: "900", // Heavy block font weight
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
}));
