import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const ROTATIONS = [
	"-2.5deg",
	"3deg",
	"-1.5deg",
	"2deg",
	"4deg",
	"-3deg",
	"1.5deg",
];
const BADGES = ["🔥 HOT", "💥 NEW DROP", "⭐ FIRE", "💎 RARE", "🔥 HOT"];

type Pack = {
	id: string;
	name: string;
	creator?: { name: string };
	thumbnail?: string;
	downloads: number;
	saves: number;
};

type TrendingRowProps = {
	packs: Pack[];
	onPackPress?: (id: string) => void;
};

export function TrendingRow({ packs, onPackPress }: TrendingRowProps) {
	if (packs.length === 0) return null;

	return (
		<View style={styles.section}>
			<Text style={styles.title}>🔥 HOT DROPS</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				{packs.map((pack, i) => (
					<Pressable
						key={pack.id}
						onPress={() => onPackPress?.(pack.id)}
						style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
					>
						<View
							style={[
								styles.cardWrap,
								{ transform: [{ rotate: ROTATIONS[i % ROTATIONS.length] }] },
							]}
						>
							<View style={styles.cardShadow} />
							<View style={styles.card}>
								{pack.thumbnail ? (
									<Image
										source={{ uri: pack.thumbnail }}
										style={styles.cardThumb}
										resizeMode="cover"
									/>
								) : (
									<View style={styles.cardThumbPlaceholder}>
										<Text style={styles.cardEmoji}>📦</Text>
									</View>
								)}
								<View style={styles.cardInfo}>
									<Text style={styles.cardName} numberOfLines={1}>
										{pack.name.toUpperCase()}
									</Text>
									<Text style={styles.cardCreator}>
										@{(pack.creator?.name || "unknown").toUpperCase()}
									</Text>
								</View>
								<View style={styles.badge}>
									<Text style={styles.badgeText}>
										{BADGES[i % BADGES.length]}
									</Text>
								</View>
							</View>
						</View>
					</Pressable>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	section: {
		paddingTop: theme.spacing.md,
		paddingBottom: theme.spacing.lg,
	},
	title: {
		color: "#FFF500",
		fontSize: 16,
		fontWeight: "900",
		letterSpacing: 1,
		paddingHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.md,
	},
	scroll: {
		paddingHorizontal: theme.spacing.lg,
		gap: 16,
		paddingBottom: 8,
	},
	cardWrap: {
		width: 160,
		height: 200,
		position: "relative",
	},
	cardShadow: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "#FFF500",
		borderRadius: 0,
		transform: [{ translateX: 4 }, { translateY: 4 }],
	},
	card: {
		flex: 1,
		backgroundColor: "#1A1A1A",
		borderWidth: 3,
		borderColor: "#000000",
		borderRadius: 0,
		overflow: "hidden",
	},
	cardThumb: {
		width: "100%",
		height: 110,
	},
	cardThumbPlaceholder: {
		width: "100%",
		height: 110,
		backgroundColor: "#0D0D0D",
		alignItems: "center",
		justifyContent: "center",
	},
	cardEmoji: {
		fontSize: 36,
	},
	cardInfo: {
		padding: 10,
		gap: 2,
	},
	cardName: {
		color: "#FFFFFF",
		fontSize: 13,
		fontWeight: "900",
		letterSpacing: -0.3,
	},
	cardCreator: {
		color: "#707070",
		fontSize: 9,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	badge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 0,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	badgeText: {
		color: "#000000",
		fontSize: 9,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
}));
