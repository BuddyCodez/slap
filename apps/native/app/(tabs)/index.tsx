import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { CategoryFilters } from "@/components/home/category-filters";
import { HeroSection } from "@/components/home/hero-section";
import { PackMasonryGrid } from "@/components/home/pack-masonry-grid";
import { TrendingRow } from "@/components/home/trending-row";
import { Screen } from "@/components/ui/screen";
import { SearchBar } from "@/components/ui/search-bar";
import { orpc } from "@/utils/orpc";

export default function HomeScreen() {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	// Fetch real trending packs
	const { data: trendingData } = useQuery(
		orpc.packs.trending.queryOptions()
	);

	// Fetch real packs list filtered by activeCategory
	const { data: listData } = useQuery(
		orpc.packs.list.queryOptions({
			input: {
				sort: "new",
				category: activeCategory || undefined,
				limit: 30,
			}
		})
	);

	// Fetch real searched packs
	const { data: searchData } = useQuery({
		...orpc.packs.search.queryOptions({
			input: {
				query: query.trim(),
				limit: 30,
			}
		}),
		enabled: query.trim().length > 0
	});

	const trendingPacks = trendingData || [];
	const allPacks = query.trim().length > 0
		? (searchData?.items || [])
		: (listData?.items || []);

	return (
		<Screen>
			<HeroSection />
			<View style={styles.searchWrap}>
				<SearchBar value={query} onChangeText={setQuery} />
			</View>
			<CategoryFilters activeId={activeCategory} onChange={setActiveCategory} />
			<TrendingRow packs={trendingPacks} />
			<PackMasonryGrid packs={allPacks} />
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	searchWrap: {
		paddingHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.lg,
	},
}));
