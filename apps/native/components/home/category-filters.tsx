import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { CategoryChip } from "@/components/ui/category-chip";
import { categories } from "@/constants/mock-packs";

type CategoryFiltersProps = {
	activeId: string | null;
	onChange: (id: string | null) => void;
};

export function CategoryFilters({ activeId, onChange }: CategoryFiltersProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.row}
		>
			{categories.map((category) => (
				<CategoryChip
					key={category.id}
					label={category.label}
					emoji={category.emoji}
					active={activeId === category.id}
					onPress={() =>
						onChange(activeId === category.id ? null : category.id)
					}
				/>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	row: {
		paddingHorizontal: theme.spacing.lg,
		gap: theme.spacing.sm,
		paddingBottom: theme.spacing["2xl"],
	},
}));
