import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

function TabIcon({
	name,
	color,
	focused,
}: {
	name: keyof typeof Ionicons.glyphMap;
	color: ColorValue;
	focused: boolean;
}) {
	return (
		<View style={[tabIconStyles.wrap, focused && tabIconStyles.wrapActive]}>
			<Ionicons
				name={name}
				size={focused ? 20 : 19}
				color={color}
				style={{
					paddingBottom: 10,
				}}
			/>
		</View>
	);
}

const tabIconStyles = StyleSheet.create({
	wrap: {
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	wrapActive: {
		transform: [{ scale: 1.15 }],
	},
});

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#FFF500",
				tabBarInactiveTintColor: "#707070",
				tabBarStyle: styles.tabBar,
				tabBarLabelStyle: styles.tabLabel,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "DISCOVER",
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
					title: "UPLOAD",
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
					title: "VAULT",
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
					title: "PROFILE",
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
		backgroundColor: "#000000",
		borderTopColor: "#FFF500",
		borderTopWidth: 3,
		height: 80,
		paddingTop: theme.spacing.sm,
		paddingBottom: 20,
	},
	tabLabel: {
		fontSize: 9,
		fontWeight: "900",
		letterSpacing: 1,
	},
}));
