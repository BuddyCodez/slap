import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { TrendingPackCard } from "@/components/ui/trending-pack-card";

type TrendingRowProps = {
	packs: any[];
	title?: string;
};

export function TrendingRow({
	packs,
	title = "Trending Packs",
}: TrendingRowProps) {
	if (packs.length === 0) return null;

	return (
		<View style={styles.wrap}>
			{/* Section header */}
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.seeAll}>SEE ALL</Text>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.row}
				decelerationRate="fast"
				snapToInterval={140 + 12} // card width (140) + gap (12)
				snapToAlignment="start"
			>
				{packs.map((pack) => (
					<TrendingPackCard key={pack.id} pack={pack} />
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	wrap: {
		marginBottom: theme.spacing.xl,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.md,
	},
	title: {
		color: theme.colors.foreground,
		fontSize: theme.fontSize.lg,
		fontWeight: "900", // Heavy block font weight
		letterSpacing: -0.3,
	},
	seeAll: {
		color: "#FFF500", // Cyber-Yellow see-all trigger
		fontSize: theme.fontSize.xs + 1,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	row: {
		paddingHorizontal: theme.spacing.lg,
		gap: 12,
		paddingBottom: 8, // padding for the card shadow offset
	},
}));

export type { TrendingRowProps };
