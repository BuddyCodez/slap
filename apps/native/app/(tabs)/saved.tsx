import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View, Image, FlatList } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Screen } from "@/components/ui/screen";
import { DotMatrixLoader } from "@/components/ui/DotMatrixLoader";
import { orpc } from "@/utils/orpc";
import { formatCount } from "@/utils/format";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Pack {
	id: string;
	name: string;
	thumbnail: string;
	downloads: number;
	saves: number;
	creator: { name: string };
	stickers: Array<{ url: string }>;
}

function SavedPackCard({ pack, onPress }: { pack: Pack; onPress: () => void }) {
	const { theme } = useUnistyles();
	const scale = useSharedValue(1);

	const handlePressIn = () => {
		scale.value = withSpring(0.96, { damping: 15, stiffness: 350 });
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, { damping: 12, stiffness: 280 });
	};

	const animStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const imageUrl = pack.thumbnail || pack.stickers?.[0]?.url;

	return (
		<AnimatedPressable
			onPress={() => {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress();
			}}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[styles.card, animStyle]}
		>
			{imageUrl && (
				<Image
					source={{ uri: imageUrl }}
					style={styles.thumbnail}
					resizeMode="cover"
				/>
			)}
			<View style={styles.cardContent}>
				<Text style={styles.packName} numberOfLines={2}>
					{pack.name}
				</Text>
				<Text style={styles.saves}>{formatCount(pack.saves)} saves</Text>
			</View>
		</AnimatedPressable>
	);
}

export default function SavedScreen() {
	const { theme } = useUnistyles();
	const router = useRouter();

	const { data: savesData, isLoading } = useQuery(
		orpc.saves.list.queryOptions({ input: { limit: 50 } })
	);

	const packs = (savesData?.items || []) as Pack[];

	const handlePackPress = (packId: string) => {
		router.push(`/pack/${packId}`);
	};

	if (isLoading) {
		return (
			<Screen scrollable={false}>
				<View style={styles.loaderContainer}>
					<DotMatrixLoader size={48} color="#FFF500" />
				</View>
			</Screen>
		);
	}

	if (packs.length === 0) {
		return (
			<Screen contentContainerStyle={styles.emptyContent}>
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>📭</Text>
					<Text style={styles.emptyTitle}>NO SAVED PACKS YET</Text>
					<Text style={styles.emptySubtitle}>
						Start exploring and save your favorite packs
					</Text>
				</View>
			</Screen>
		);
	}

	return (
		<Screen scrollable={false}>
			<FlatList
				data={packs}
				keyExtractor={(item) => item.id}
				numColumns={2}
				columnWrapperStyle={styles.columnWrapper}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text style={styles.title}>Saved Packs</Text>
						<Text style={styles.count}>{packs.length} saved</Text>
					</View>
				}
				renderItem={({ item }) => (
					<SavedPackCard
						pack={item}
						onPress={() => handlePackPress(item.id)}
					/>
				)}
				contentContainerStyle={styles.listContent}
				scrollIndicatorInsets={{ right: 1 }}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	loaderContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyContent: {
		flex: 1,
		paddingHorizontal: theme.spacing.lg,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyContainer: {
		alignItems: "center",
		gap: theme.spacing.lg,
	},
	emptyEmoji: {
		fontSize: 64,
	},
	emptyTitle: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.xl,
		fontWeight: "900",
		letterSpacing: -0.3,
		textAlign: "center",
	},
	emptySubtitle: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.sm,
		textAlign: "center",
		lineHeight: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: theme.spacing.lg,
		paddingTop: theme.spacing["2xl"],
		paddingBottom: theme.spacing.lg,
	},
	title: {
		color: "#FFFFFF",
		fontSize: theme.fontSize["2xl"],
		fontWeight: "900",
		letterSpacing: -0.5,
	},
	count: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: "600",
	},
	listContent: {
		paddingHorizontal: theme.spacing.lg,
		paddingBottom: theme.spacing["4xl"],
	},
	columnWrapper: {
		justifyContent: "space-between",
		gap: theme.spacing.md,
		marginBottom: theme.spacing.md,
	},
	card: {
		flex: 1 / 2,
		backgroundColor: "#1A1A1A",
		borderRadius: 0,
		borderWidth: 2,
		borderColor: "#000000",
		overflow: "hidden",
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		shadowOffset: { width: 2, height: 2 },
		elevation: 2,
	},
	thumbnail: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: "#0A0A0A",
	},
	cardContent: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md,
		gap: theme.spacing.xs,
	},
	packName: {
		color: "#FFFFFF",
		fontSize: theme.fontSize.sm,
		fontWeight: "900",
		letterSpacing: -0.2,
	},
	saves: {
		color: theme.colors.muted,
		fontSize: theme.fontSize.xs,
		fontWeight: "600",
	},
}));
