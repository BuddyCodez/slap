import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type SearchBarProps = {
	value: string;
	onChangeText: (value: string) => void;
	placeholder?: string;
};

export function SearchBar({
	value,
	onChangeText,
	placeholder = "Search stickers...",
}: SearchBarProps) {
	const { theme } = useUnistyles();
	const [focused, setFocused] = useState(false);
	const scale = useSharedValue(1);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const handleFocus = () => {
		setFocused(true);
		scale.value = withSpring(0.99, { damping: 15, stiffness: 300 });
		void Haptics.selectionAsync();
	};

	const handleBlur = () => {
		setFocused(false);
		scale.value = withSpring(1, { damping: 15, stiffness: 300 });
	};

	return (
		<Animated.View style={[styles.container, animatedStyle]}>
			<View style={[styles.wrapper, focused && styles.wrapperFocused]}>
				<Ionicons
					name="search-outline"
					size={18}
					color={focused ? theme.colors.primary : theme.colors.muted}
					style={styles.icon}
				/>
				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={theme.colors.muted}
					style={styles.input}
					onFocus={handleFocus}
					onBlur={handleBlur}
					returnKeyType="search"
					autoCorrect={false}
					clearButtonMode="while-editing"
				/>
				{value.length > 0 ? (
					<Pressable
						onPress={() => {
							void Haptics.selectionAsync();
							onChangeText("");
						}}
						hitSlop={8}
						style={styles.clearBtn}
					>
						<Ionicons
							name="close-circle"
							size={16}
							color={theme.colors.muted}
						/>
					</Pressable>
				) : null}
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		width: "100%",
	},
	wrapper: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 4, // Sharp corners
		paddingHorizontal: theme.spacing.md,
		minHeight: 46,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 3, height: 3 },
		elevation: 3,
	},
	wrapperFocused: {
		backgroundColor: "#222222",
		borderColor: "#FFF500", // Yellow highlight when focused
	},
	icon: {
		marginRight: theme.spacing.sm - 2,
	},
	input: {
		flex: 1,
		color: theme.colors.foreground,
		fontSize: theme.fontSize.sm + 1,
		paddingVertical: 8,
		fontWeight: "700",
	},
	clearBtn: {
		marginLeft: theme.spacing.xs,
	},
}));

export type { SearchBarProps };
