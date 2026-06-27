import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { orpc } from "@/utils/orpc";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CategoryFiltersProps = {
	activeId: string | null;
	onChange: (id: string | null) => void;
	isOpen: boolean;
	onToggle: () => void;
};

function CategoryChip({
	name,
	packCount,
	active,
	onPress,
}: {
	name: string;
	packCount: number;
	active: boolean;
	onPress: () => void;
}) {
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	return (
		<AnimatedPressable
			onPress={() => {
				void Haptics.selectionAsync();
				onPress();
			}}
			onPressIn={() => {
				scale.value = withSpring(0.96, { damping: 14, stiffness: 300 });
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 12, stiffness: 280 });
			}}
			style={[
				styles.chip,
				active ? styles.chipActive : styles.chipInactive,
				animatedStyle,
			]}
		>
			<Text
				style={[
					styles.label,
					active ? styles.labelActive : styles.labelInactive,
				]}
			>
				{name.toUpperCase()}
			</Text>
			<View style={styles.badge}>
				<Text
					style={[
						styles.badgeText,
						active ? styles.badgeTextActive : styles.badgeTextInactive,
					]}
				>
					{packCount}
				</Text>
			</View>
		</AnimatedPressable>
	);
}

export function CategoryFilters({
	activeId,
	onChange,
	isOpen,
	onToggle,
}: CategoryFiltersProps) {
	const { data: categories = [] } = useQuery(
		orpc.categories.list.queryOptions(),
	);

	return (
		<View style={styles.wrap}>
			{/* Header / Toggle */}
			<Pressable
				onPress={() => {
					void Haptics.selectionAsync();
					onToggle();
				}}
				style={styles.header}
			>
				<Text style={styles.headerText}>FILTERS</Text>
				<Ionicons
					name={isOpen ? "chevron-up" : "chevron-down"}
					size={18}
					color="#FFFFFF"
				/>
			</Pressable>

			{/* Collapsible Category List */}
			{isOpen && (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.row}
				>
					{categories.map((category) => (
						<CategoryChip
							key={category.id}
							name={category.name}
							packCount={category.packCount}
							active={activeId === category.name}
							onPress={() =>
								onChange(activeId === category.name ? null : category.name)
							}
						/>
					))}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	wrap: {
		backgroundColor: "#0A0A0A",
		borderBottomWidth: 2,
		borderBottomColor: "#000000",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: theme.spacing.lg,
		paddingVertical: theme.spacing.md,
	},
	headerText: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.sm,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	row: {
		paddingHorizontal: theme.spacing.lg,
		gap: theme.spacing.sm,
		paddingBottom: theme.spacing["2xl"],
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.spacing.xs,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: 0,
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
		backgroundColor: "#FFF500",
	},
	chipInactive: {
		backgroundColor: "#1A1A1A",
	},
	label: {
		fontSize: theme.fontSize.xs + 1,
		fontWeight: "900",
	},
	labelActive: {
		color: "#000000",
	},
	labelInactive: {
		color: "#FFFFFF",
	},
	badge: {
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 0,
		backgroundColor: "rgba(255, 245, 0, 0.15)",
	},
	badgeText: {
		fontSize: theme.fontSize.xs - 1,
		fontWeight: "700",
	},
	badgeTextActive: {
		color: "#000000",
	},
	badgeTextInactive: {
		color: "#FFF500",
	},
}));
