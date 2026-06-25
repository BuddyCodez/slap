import { useMemo, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { CategoryFilters } from "@/components/home/category-filters";
import { HeroSection } from "@/components/home/hero-section";
import { PackMasonryGrid } from "@/components/home/pack-masonry-grid";
import { TrendingRow } from "@/components/home/trending-row";
import { Screen } from "@/components/ui/screen";
import { SearchBar } from "@/components/ui/search-bar";
import { gridPacks, trendingPacks } from "@/constants/mock-packs";

export default function HomeScreen() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const filteredGrid = useMemo(() => {
		const normalized = query.trim().toLowerCase();

		return gridPacks.filter((pack) => {
			const matchesCategory = activeCategory
				? pack.category === activeCategory
				: true;
			const matchesQuery =
				normalized.length === 0 ||
				pack.name.toLowerCase().includes(normalized) ||
				pack.creator.name.toLowerCase().includes(normalized);

			return matchesCategory && matchesQuery;
		});
	}, [activeCategory, query]);

	const filteredTrending = useMemo(() => {
		const normalized = query.trim().toLowerCase();

		return trendingPacks.filter((pack) => {
			const matchesCategory = activeCategory
				? pack.category === activeCategory
				: true;
			const matchesQuery =
				normalized.length === 0 ||
				pack.name.toLowerCase().includes(normalized) ||
				pack.creator.name.toLowerCase().includes(normalized);

			return matchesCategory && matchesQuery;
		});
	}, [activeCategory, query]);

	return (
		<Screen>
			<HeroSection />
			<View style={styles.searchWrap}>
				<SearchBar value={query} onChangeText={setQuery} />
			</View>
			<CategoryFilters activeId={activeCategory} onChange={setActiveCategory} />
			<TrendingRow packs={filteredTrending} />
			<PackMasonryGrid packs={filteredGrid} />
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	searchWrap: {
		paddingHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.lg,
	},
}));
