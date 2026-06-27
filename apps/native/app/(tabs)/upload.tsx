import { Folder, Plus } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Screen } from "@/components/ui/screen";
import { CreatePackForm } from "@/components/upload/CreatePackForm";
import { MyPacksList } from "@/components/upload/MyPacksList";
import { PackDetailView } from "@/components/upload/PackDetailView";
import { TagsSheet } from "@/components/upload/TagsSheet";

// Bypass incorrect web-type resolution of Lucide icons on React Native
const PlusIcon = Plus as any;
const FolderIcon = Folder as any;

export default function UploadScreen() {
	const [activeTab, setActiveTab] = useState<"create" | "my-packs">("create");
	const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [tagsSheetVisible, setTagsSheetVisible] = useState(false);

	return (
		<View style={styles.root}>
			<Screen scrollable={false}>
				<View style={styles.container}>
					{/* Header Tabs */}
					<View style={styles.header}>
						<Text style={styles.headerTitle}>CREATOR VAULT ⚡</Text>
						<View style={styles.tabsContainer}>
							<TouchableOpacity
								style={[
									styles.tabButton,
									activeTab === "create" && styles.activeTabButton,
								]}
								onPress={() => {
									setActiveTab("create");
									setSelectedPackId(null);
								}}
							>
								<PlusIcon
									size={16}
									color={activeTab === "create" ? "#000000" : "#707070"}
								/>
								<Text
									style={[
										styles.tabText,
										activeTab === "create" && styles.activeTabText,
									]}
								>
									CREATE
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.tabButton,
									activeTab === "my-packs" && styles.activeTabButton,
								]}
								onPress={() => {
									setActiveTab("my-packs");
									setSelectedPackId(null);
								}}
							>
								<FolderIcon
									size={16}
									color={activeTab === "my-packs" ? "#000000" : "#707070"}
								/>
								<Text
									style={[
										styles.tabText,
										activeTab === "my-packs" && styles.activeTabText,
									]}
								>
									MY UPLOADS
								</Text>
							</TouchableOpacity>
						</View>
					</View>

					{/* Tab content areas */}
					<View style={styles.content}>
						{activeTab === "create" && (
							<CreatePackForm
								onSuccess={() => setActiveTab("my-packs")}
								tags={tags}
								onTagsChange={setTags}
								onOpenTagsSheet={() => setTagsSheetVisible(true)}
							/>
						)}

						{activeTab === "my-packs" &&
							(selectedPackId ? (
								<PackDetailView
									packId={selectedPackId}
									onBack={() => setSelectedPackId(null)}
									onDeleteSuccess={() => setSelectedPackId(null)}
								/>
							) : (
								<MyPacksList
									onSelectPack={(id) => setSelectedPackId(id)}
									onNavigateToCreate={() => setActiveTab("create")}
								/>
							))}
					</View>
				</View>
			</Screen>
			<TagsSheet
				visible={tagsSheetVisible}
				tags={tags}
				onClose={() => setTagsSheetVisible(false)}
				onChange={setTags}
			/>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
	},
	container: {
		flex: 1,
		backgroundColor: "#000000",
		paddingTop: 16,
	},
	header: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		borderBottomWidth: 3,
		borderColor: "#000000",
		backgroundColor: "#0A0A0A",
	},
	headerTitle: {
		color: "#FFF500",
		fontSize: 22,
		fontWeight: "900",
		fontFamily: "System",
		marginBottom: 12,
		letterSpacing: 1.5,
	},
	tabsContainer: {
		flexDirection: "row",
		gap: 12,
	},
	tabButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		backgroundColor: "#1A1A1A",
		borderWidth: 2,
		borderColor: "#000000",
		borderRadius: 4,
		paddingVertical: 10,
		shadowOffset: { width: 3, height: 3 },
		shadowColor: "#000000",
		shadowOpacity: 1,
		shadowRadius: 0,
		elevation: 3,
	},
	activeTabButton: {
		backgroundColor: "#FFF500",
		borderColor: "#000000",
	},
	tabText: {
		color: "#707070",
		fontSize: 12,
		fontWeight: "900",
	},
	activeTabText: {
		color: "#000000",
	},
	content: {
		flex: 1,
		padding: 16,
	},
}));
