import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { CategoryFilters } from "@/components/home/category-filters";
import { HeroSection } from "@/components/home/hero-section";
import { MarqueeTicker } from "@/components/home/marquee-ticker";
import { PackMasonryGrid } from "@/components/home/pack-masonry-grid";
import { TrendingRow } from "@/components/home/trending-row";
import { Screen } from "@/components/ui/screen";
import { SearchBar } from "@/components/ui/search-bar";
import { client, orpc } from "@/utils/orpc";

type Pack = {
	id: string;
	name: string;
	creator?: { name: string };
	thumbnail?: string;
	downloads: number;
	saves: number;
	tags?: string[];
	stickers?: Array<{ url: string }>;
	category?: string;
	savedByUser?: boolean;
	emoji?: string;
};

export default function HomeScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const { data: trendingData } = useQuery(orpc.packs.trending.queryOptions());

	// Fixed: explicit manual queryKey includes activeCategory so changing the filter triggers re-fetch
	const listQuery = useInfiniteQuery({
		queryKey: ["packs", "list", { category: activeCategory, sort: "new" }],
		queryFn: ({ pageParam = 0 }) =>
			client.packs.list({
				sort: "new",
				category: activeCategory ?? undefined,
				limit: 20,
				cursor: pageParam as number,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
	});

	// Search query — uses orpc pattern (enabled when query has content)
	const searchQuery = useInfiniteQuery({
		queryKey: ["packs", "search", { query: query.trim() }],
		queryFn: ({ pageParam = 0 }) =>
			client.packs.search({
				query: query.trim(),
				limit: 20,
				cursor: pageParam as number,
			}),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		enabled: query.trim().length > 0,
	});

	const trendingPacks = (trendingData || []) as Pack[];
	const allPacks = (
		query.trim().length > 0
			? (searchQuery.data?.pages.flatMap((p) => p.items) ?? [])
			: (listQuery.data?.pages.flatMap((p) => p.items) ?? [])
	) as Pack[];

	const isSearching = query.trim().length > 0;
	const shouldShowTrending = !isSearching && !activeCategory;
	const isInitialLoading = isSearching
		? searchQuery.isLoading
		: listQuery.isLoading;

	const handlePackPress = (packId: string) => {
		router.push(`/pack/${packId}`);
	};

	const handleRefresh = async () => {
		if (isSearching) {
			await queryClient.refetchQueries({
				queryKey: ["packs", "search", { query: query.trim() }],
			});
		} else {
			await queryClient.refetchQueries({
				queryKey: ["packs", "list", { category: activeCategory, sort: "new" }],
			});
		}
	};

	const handleLoadMore = () => {
		if (isSearching) {
			if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
				searchQuery.fetchNextPage();
			}
		} else {
			if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
				listQuery.fetchNextPage();
			}
		}
	};

	return (
		<Screen scrollable={false}>
			<FlatList
				data={allPacks}
				keyExtractor={(item) => item.id}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.3}
				refreshControl={
					<RefreshControl
						refreshing={isInitialLoading}
						onRefresh={handleRefresh}
						tintColor="#FFF500"
					/>
				}
				ListHeaderComponent={
					<View>
						<HeroSection />
						<View style={styles.searchWrap}>
							<SearchBar value={query} onChangeText={setQuery} />
						</View>
						{shouldShowTrending && (
							<>
								<MarqueeTicker />
								<TrendingRow
									packs={trendingPacks}
									onPackPress={handlePackPress}
								/>
								<MarqueeTicker />
							</>
						)}
						<CategoryFilters
							activeId={activeCategory}
							onChange={setActiveCategory}
							isOpen={filtersOpen}
							onToggle={() => setFiltersOpen(!filtersOpen)}
						/>
					</View>
				}
				renderItem={({ item }) => (
					<PackMasonryGrid
						packs={[item]}
						onPackPress={handlePackPress}
						hideSeparator
					/>
				)}
				ListFooterComponent={null}
				contentContainerStyle={styles.listContent}
			/>
		</Screen>
	);
}

const styles = StyleSheet.create((theme) => ({
	searchWrap: {
		paddingHorizontal: theme.spacing.lg,
		marginBottom: theme.spacing.md,
	},
	listContent: {
		flexGrow: 1,
	},
}));
