import { useState } from "react";
import {
	Dimensions,
	Keyboard,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Extrapolate,
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { X, Plus } from "lucide-react-native";
import { useEffect } from "react";

const XIcon = X as any;
const PlusIcon = Plus as any;

const { height: SCREEN_H } = Dimensions.get("window");

export interface TagsSheetProps {
	visible: boolean;
	tags: string[];
	onClose: () => void;
	onChange: (tags: string[]) => void;
}

export function TagsSheet({ visible, tags, onClose, onChange }: TagsSheetProps) {
	const [inputValue, setInputValue] = useState("");
	const translateY = useSharedValue(SCREEN_H);

	useEffect(() => {
		if (visible) {
			translateY.value = withTiming(0, { duration: 300 });
		} else {
			Keyboard.dismiss();
			translateY.value = withTiming(SCREEN_H, { duration: 250 });
		}
	}, [visible, translateY]);

	const close = () => {
		Keyboard.dismiss();
		translateY.value = withTiming(SCREEN_H, { duration: 250 }, (finished) => {
			if (finished) runOnJS(onClose)();
		});
	};

	const panGesture = Gesture.Pan()
		.onChange((event) => {
			translateY.value = Math.max(0, event.translationY);
		})
		.onEnd((event) => {
			if (event.translationY > 150 || event.velocityY > 500) {
				translateY.value = withTiming(SCREEN_H, { duration: 220 }, (finished) => {
					if (finished) runOnJS(onClose)();
				});
			} else {
				translateY.value = withTiming(0, { duration: 200 });
			}
		});

	const sheetStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	const scrimStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			translateY.value,
			[0, SCREEN_H * 0.8],
			[1, 0],
			Extrapolate.CLAMP,
		),
	}));

	const handleAdd = () => {
		const trimmed = inputValue.trim().toLowerCase();
		if (!trimmed || tags.includes(trimmed)) {
			setInputValue("");
			return;
		}
		onChange([...tags, trimmed]);
		setInputValue("");
	};

	const handleRemove = (tag: string) => onChange(tags.filter((t) => t !== tag));

	if (!visible && translateY.value >= SCREEN_H - 10) return null;

	return (
		<View style={styles.portal} pointerEvents={visible ? "auto" : "none"}>
			<Animated.View style={[styles.scrim, scrimStyle]}>
				<Pressable style={StyleSheet.absoluteFill} onPress={close} />
			</Animated.View>

			<GestureDetector gesture={panGesture}>
				<Animated.View style={[styles.sheet, sheetStyle]}>
					<View style={styles.handleWrap}>
						<View style={styles.handle} />
					</View>

					<View style={styles.header}>
						<Text style={styles.title}>ADD TAGS ⚡</Text>
						<Pressable onPress={close} style={styles.closeBtn} hitSlop={12}>
							<XIcon size={18} color="#A3A3B3" />
						</Pressable>
					</View>

					<Text style={styles.subtitle}>Type a tag and press ADD to include it.</Text>

					<View style={styles.inputRow}>
						<View style={styles.inputWrap}>
							<TextInput
								style={styles.input}
								placeholder="TYPE A TAG..."
								placeholderTextColor="#555555"
								value={inputValue}
								onChangeText={setInputValue}
								onSubmitEditing={handleAdd}
								returnKeyType="done"
								autoCapitalize="none"
								autoCorrect={false}
							/>
						</View>
						<Pressable style={styles.addBtn} onPress={handleAdd}>
							<PlusIcon size={16} color="#000000" />
							<Text style={styles.addBtnText}>ADD</Text>
						</Pressable>
					</View>

					{tags.length > 0 ? (
						<View style={styles.chipsWrap}>
							{tags.map((tag) => (
								<View key={tag} style={styles.chip}>
									<Text style={styles.chipText}>{tag.toUpperCase()}</Text>
									<Pressable onPress={() => handleRemove(tag)} hitSlop={8}>
										<XIcon size={12} color="#000000" />
									</Pressable>
								</View>
							))}
						</View>
					) : (
						<Text style={styles.emptyText}>NO TAGS YET — TYPE ONE ABOVE</Text>
					)}
				</Animated.View>
			</GestureDetector>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	portal: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "flex-end",
		zIndex: 1000,
	},
	scrim: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.92)",
	},
	sheet: {
		backgroundColor: "#0A0A0A",
		height: SCREEN_H - 200,
		width: "100%",
		paddingHorizontal: 24,
		paddingTop: 20,
    paddingBottom: 44,
    borderRadius: 10
	},
	handleWrap: {
		alignItems: "center",
		paddingVertical: 0,
		marginTop: 0,
	},
	handle: {
		width: 44,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#333333",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: theme.spacing?.lg ?? 16,
		marginBottom: 8,
	},
	title: {
		color: "#FFF500",
		fontSize: 24,
		fontWeight: "900",
		letterSpacing: -0.5,
	},
	closeBtn: {
		padding: 4,
	},
	subtitle: {
		color: "#A3A3B3",
		fontSize: 14,
		fontWeight: "900",
		marginBottom: 28,
	},
	inputRow: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 24,
	},
	inputWrap: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#1A1A1A",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4,
		paddingHorizontal: 14,
		minHeight: 52,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 3, height: 3 },
	},
	input: {
		flex: 1,
		color: "#FFFFFF",
		fontSize: 14,
		fontWeight: "900",
		paddingVertical: 14,
	},
	addBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFF500",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 4,
		paddingHorizontal: 16,
		minHeight: 52,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 3, height: 3 },
	},
	addBtnText: {
		color: "#000000",
		fontSize: 13,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	chipsWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 4,
		paddingHorizontal: 12,
		paddingVertical: 8,
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 2, height: 2 },
	},
	chipText: {
		fontSize: 11,
		color: "#000000",
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	emptyText: {
		fontSize: 13,
		color: "#555555",
		fontWeight: "900",
		textAlign: "center",
		paddingTop: 20,
	},
}));
