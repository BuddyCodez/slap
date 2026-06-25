import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { TrendingPackCard } from "@/components/ui/trending-pack-card";
import type { MockPack } from "@/constants/mock-packs";

type TrendingRowProps = {
	packs: MockPack[];
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
				<Text style={styles.seeAll}>See All</Text>
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
		fontWeight: theme.fontWeight.black,
		letterSpacing: -0.3,
	},
	seeAll: {
		color: theme.colors.primary,
		fontSize: theme.fontSize.sm,
		fontWeight: theme.fontWeight.bold,
	},
	row: {
		paddingHorizontal: theme.spacing.lg,
		gap: 12,
	},
}));

export type { TrendingRowProps };
