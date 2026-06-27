import { StyleSheet, View, type ViewStyle } from "react-native";

interface PackRowSkeletonProps {
	style?: ViewStyle;
}

/**
 * PackRowSkeleton - Static skeleton loader matching PackRow structure
 * Used during initial fetch and pagination on discover page
 * Creates placeholder blocks while content loads
 * Called by: apps/native/app/(tabs)/index.tsx
 */
export function PackRowSkeleton({ style }: PackRowSkeletonProps) {
	return (
		<View style={[styles.container, style]}>
			{/* Thumbnail placeholder */}
			<View style={styles.thumbnail} />

			{/* Content area with text placeholders */}
			<View style={styles.content}>
				{/* Pack name placeholder */}
				<View style={styles.textLine} />

				{/* Creator name placeholder */}
				<View style={[styles.textLine, styles.textLineSmall]} />

				{/* Stats row */}
				<View style={styles.statsRow}>
					<View style={[styles.statBadge, { width: 60 }]} />
					<View style={[styles.statBadge, { width: 60 }]} />
				</View>
			</View>

			{/* Action button placeholder */}
			<View style={styles.actionButton} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		paddingVertical: 12,
		paddingHorizontal: 16,
		backgroundColor: "#f5f5f5",
		borderRadius: 8,
		marginVertical: 6,
		marginHorizontal: 12,
		alignItems: "center",
		gap: 12,
	},
	thumbnail: {
		width: 56,
		height: 56,
		borderRadius: 6,
		backgroundColor: "#e0e0e0",
		flexShrink: 0,
	},
	content: {
		flex: 1,
		gap: 8,
	},
	textLine: {
		height: 16,
		backgroundColor: "#e0e0e0",
		borderRadius: 4,
		width: "85%",
	},
	textLineSmall: {
		width: "60%",
		height: 12,
	},
	statsRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 4,
	},
	statBadge: {
		height: 12,
		backgroundColor: "#e0e0e0",
		borderRadius: 3,
	},
	actionButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#e0e0e0",
		flexShrink: 0,
	},
});
