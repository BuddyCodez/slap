import { useQuery } from "@tanstack/react-query";
import { Folder } from "lucide-react-native";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { orpc } from "@/utils/orpc";

// Bypass incorrect web-type resolution of Lucide icons on React Native
const FolderIcon = Folder as any;

interface MyPacksListProps {
	onSelectPack: (packId: string) => void;
	onNavigateToCreate: () => void;
}

export function MyPacksList({
	onSelectPack,
	onNavigateToCreate,
}: MyPacksListProps) {
	const { data: myPacksData, isLoading: isLoadingMyPacks } = useQuery(
		orpc.packs.myPacks.queryOptions({
			input: { limit: 30, cursor: 0 },
		}),
	);

	return (
		<View style={styles.container}>
			<Text style={styles.sectionTitle}>MY UPLOADS</Text>

			{isLoadingMyPacks ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#FFF500" />
				</View>
			) : myPacksData?.items && myPacksData.items.length > 0 ? (
				<FlatList
					data={myPacksData.items}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContainer}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={styles.packCard}
							onPress={() => onSelectPack(item.id)}
						>
							<View style={styles.packCardLeft}>
								{item.thumbnail ? (
									<Image
										source={{ uri: item.thumbnail }}
										style={styles.packThumbnail}
									/>
								) : (
									<View style={styles.fallbackThumbnail}>
										<Text style={styles.fallbackText}>📦</Text>
									</View>
								)}
								<View style={styles.packCardInfo}>
									<Text style={styles.packName}>{item.name.toUpperCase()}</Text>
									<Text style={styles.packCategory}>
										{item.category?.toUpperCase() || "TRENDING"}
									</Text>
								</View>
							</View>

							<View style={styles.packCardRight}>
								<View
									style={[
										styles.statusBadge,
										item.status === "READY" && styles.statusReady,
										item.status === "PROCESSING" && styles.statusProcessing,
										item.status === "FAILED" && styles.statusFailed,
									]}
								>
									<Text
										style={[
											styles.statusText,
											item.status === "READY" && styles.statusReadyText,
											item.status === "PROCESSING" &&
												styles.statusProcessingText,
											item.status === "FAILED" && styles.statusFailedText,
										]}
									>
										{item.status}
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					)}
				/>
			) : (
				<View style={styles.emptyContainer}>
					<FolderIcon size={48} color="#707070" style={{ marginBottom: 12 }} />
					<Text style={styles.emptyText}>NO PACKS UPLOADED YET.</Text>
					<TouchableOpacity
						style={styles.emptyBtn}
						onPress={onNavigateToCreate}
					>
						<Text style={styles.emptyBtnText}>COOK YOUR FIRST PACK</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
	},
	sectionTitle: {
		color: "#ffffff",
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: 1.2,
		marginBottom: 16,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 200,
	},
	emptyContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
	},
	emptyText: {
		color: "#707070",
		fontWeight: "900",
		fontSize: 12,
		textAlign: "center",
	},
	emptyBtn: {
		marginTop: 16,
		backgroundColor: "#FFF500",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 4,
		paddingHorizontal: 16,
		paddingVertical: 10,
		shadowOffset: { width: 3, height: 3 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
	},
	emptyBtnText: {
		color: "#000000",
		fontSize: 11,
		fontWeight: "900",
	},
	listContainer: {
		gap: 12,
		paddingBottom: 24,
	},
	packCard: {
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 4,
		padding: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		shadowOffset: { width: 3, height: 3 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 3,
	},
	packCardLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flex: 1,
	},
	packThumbnail: {
		width: 48,
		height: 48,
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: "#000000",
		backgroundColor: "#262626",
	},
	fallbackThumbnail: {
		width: 48,
		height: 48,
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: "#000000",
		backgroundColor: "#262626",
		alignItems: "center",
		justifyContent: "center",
	},
	fallbackText: {
		fontSize: 20,
	},
	packCardInfo: {
		gap: 2,
		flex: 1,
	},
	packName: {
		color: "#ffffff",
		fontWeight: "900",
		fontSize: 13,
		letterSpacing: 0.5,
	},
	packCategory: {
		color: "#FFF500",
		fontWeight: "900",
		fontSize: 9,
	},
	packCardRight: {
		alignItems: "flex-end",
	},
	statusBadge: {
		borderWidth: 1.5,
		borderColor: "#000000",
		borderRadius: 3,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	statusText: {
		fontWeight: "900",
		fontSize: 9,
		letterSpacing: 0.5,
	},
	statusReady: {
		backgroundColor: "#34c759",
	},
	statusReadyText: {
		color: "#000000",
	},
	statusProcessing: {
		backgroundColor: "#ffcc00",
	},
	statusProcessingText: {
		color: "#000000",
	},
	statusFailed: {
		backgroundColor: "#ff3b30",
	},
	statusFailedText: {
		color: "#ffffff",
	},
}));
