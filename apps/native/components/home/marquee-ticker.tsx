import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function MarqueeTicker() {
	return (
		<View style={styles.strip}>
			<View style={styles.dotLeft} />
			<Text style={styles.text}>⚡ SLAP · SEND · REPEAT ⚡</Text>
			<View style={styles.dotRight} />
		</View>
	);
}

const styles = StyleSheet.create({
	strip: {
		backgroundColor: "#FFF500",
		paddingVertical: 6,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderTopWidth: 2,
		borderBottomWidth: 2,
		borderColor: "#000000",
	},
	text: {
		color: "#000000",
		fontSize: 10,
		fontWeight: "900",
		letterSpacing: 3,
	},
	dotLeft: {
		width: 4,
		height: 4,
		backgroundColor: "#000000",
	},
	dotRight: {
		width: 4,
		height: 4,
		backgroundColor: "#000000",
	},
});
