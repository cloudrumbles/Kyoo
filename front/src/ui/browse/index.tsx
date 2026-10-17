import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { ItemGrid, itemMap } from "~/components/items";
import { Collection, Movie, Serie, Show } from "~/models";
import { H1, H2, Link, P, Poster, PressableFeedback, SubP } from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "~/query";
import { useQueryState } from "~/utils";
import { BrowseSettings } from "./header";
import type { SortBy, SortOrd } from "./types";

type ShelfCategory = "series" | "movies" | "collections";

const Shelf = ({
	title,
	items,
	loading,
	more,
	onMore,
	layout,
}: {
	title: string;
	items: Show[];
	loading: boolean;
	more: boolean;
	onMore: () => void;
	layout: "grid" | "list";
}) => {
	if (items.length === 0 && !loading) return null;
	return (
		<View className="mb-12">
			<View className="video-section-rule mb-5 flex-row items-end gap-3 pb-3">
				<H2 className="font-headers text-[31px] leading-8 font-bold text-[#f5efe1] sm:text-[36px]">
					{title}
				</H2>
				<P className="mb-0.5 text-xs font-medium text-[#8da3b5]">
					{items.length} {items.length === 1 ? "title" : "titles"}
				</P>
			</View>
			<View className={layout === "grid" ? "flex-row flex-wrap gap-x-4 gap-y-8" : "gap-3"}>
				{items.map((item) =>
					layout === "list" ? (
						<Link
							key={item.id}
							href={item.href}
							className="flex-row items-center gap-5 border-b border-[#344b62] p-2 highlighted:bg-[#1c324c]"
						>
							<Poster src={item.poster} quality="low" className="video-case w-18 rounded-[2px]" />
							<View className="flex-1">
								<H2 className="font-headers text-2xl font-bold text-[#f5efe1]">{item.name}</H2>
								<SubP className="mt-1 text-[#a9b8c7]">{item.kind === "serie" ? "Series" : item.kind === "movie" ? "Film" : "Collection"}</SubP>
								{item.description && <P numberOfLines={2} className="mt-2 text-xs leading-5 text-[#a9b8c7]">{item.description}</P>}
							</View>
						</Link>
					) : (
						<View key={item.id} className="w-[46%] sm:w-[30%] md:w-[22%] lg:w-[17%] xl:w-[14%]">
							<ItemGrid {...itemMap(item)} />
						</View>
					),
				)}
				{loading && !items.length
					? [...Array(3)].map((_, i) => (
							<View key={i} className="w-[46%] sm:w-[30%] md:w-[22%] lg:w-[17%] xl:w-[14%]">
								<ItemGrid.Loader />
							</View>
						))
					: null}
			</View>
			{more && (
				<PressableFeedback
					onPress={onMore}
					disabled={loading}
					className="mt-7 self-start rounded-sm border border-[#546b82] px-6 py-3 highlighted:border-accent"
				>
					<P className="font-semibold text-[#f0c875]">
						{loading ? "Loading…" : `More ${title.toLowerCase()}`}
					</P>
				</PressableFeedback>
			)}
		</View>
	);
};

export const BrowsePage = () => {
	const [filter, setFilter] = useQueryState("filter", "");
	const [sort, setSort] = useQueryState("sort", "name");
	const [search] = useQueryState("q", "");
	const sortOrd = sort.startsWith("-") ? "desc" : "asc";
	const sortBy = (sort.startsWith("-") ? sort.substring(1) : sort) as SortBy;
	const [layout, setLayout] = useQueryState<"grid" | "list">("layout", "grid");
	const selectedKind = /kind eq (\w+)/.exec(filter)?.[1] ?? "all";
	const otherFilters = filter
		.split(" and ")
		.filter((part) => part && !part.startsWith("kind eq "))
		.join(" and ");
	const commonParams = useMemo(
		() => ({
			sort: `${sortOrd === "desc" ? "-" : ""}${sortBy === "rating" ? "rating:themoviedatabase" : sortBy}`,
			query: search,
			filter: otherFilters || undefined,
			limit: 36,
		}),
		[sortOrd, sortBy, search, otherFilters],
	);
	const series = useInfiniteFetch<Serie>({
		path: ["api", "series"],
		parser: Serie,
		infinite: true,
		params: commonParams,
		enabled: selectedKind === "all" || selectedKind === "serie",
	});
	const movies = useInfiniteFetch<Movie>({
		path: ["api", "movies"],
		parser: Movie,
		infinite: true,
		params: commonParams,
		enabled: selectedKind === "all" || selectedKind === "movie",
	});
	const collections = useInfiniteFetch<Collection>({
		path: ["api", "collections"],
		parser: Collection,
		infinite: true,
		params: commonParams,
		enabled: selectedKind === "all" || selectedKind === "collection",
	});
	const seriesShows: Show[] = (series.items ?? []).map((item) => ({ ...item, kind: "serie" as const }));
	const movieShows: Show[] = (movies.items ?? []).map((item) => ({ ...item, kind: "movie" as const }));
	const collectionShows: Show[] = (collections.items ?? []).map((item) => ({ ...item, kind: "collection" as const }));
	const total = seriesShows.length + movieShows.length + collectionShows.length;
	const isLoading = series.isFetching || movies.isFetching || collections.isFetching;

	return (
		<ScrollView
			className="flex-1 bg-background"
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingBottom: 90 }}
		>
			<View className="mx-3 mt-8 sm:mx-8 sm:mt-12 lg:mx-14">
				<View className="video-section-rule mb-5 pb-5">
					<H1 className="font-headers text-[48px] leading-[1.02] font-bold text-[#f5efe1] sm:text-[64px]">
						Browse the shelves
					</H1>
					<P className="mt-2 text-sm text-[#a9b8c7]">
						{search ? `Results for “${search}”` : "Your films, series and collections in one place."}
					</P>
				</View>
				<BrowseSettings
					sortBy={sortBy}
					sortOrd={sortOrd}
					setSort={(key, ord) => setSort(ord === "desc" ? `-${key}` : key)}
					filter={filter}
					setFilter={setFilter}
					layout={layout}
					setLayout={setLayout}
				/>
				<View className="mt-8">
					{(selectedKind === "all" || selectedKind === "serie") && (
						<Shelf title="Series" layout={layout} items={seriesShows} loading={series.isFetching} more={!!series.hasNextPage} onMore={() => series.fetchNextPage()} />
					)}
					{(selectedKind === "all" || selectedKind === "movie") && (
						<Shelf title="Films" layout={layout} items={movieShows} loading={movies.isFetching} more={!!movies.hasNextPage} onMore={() => movies.fetchNextPage()} />
					)}
					{(selectedKind === "all" || selectedKind === "collection") && (
						<Shelf title="Collections" layout={layout} items={collectionShows} loading={collections.isFetching} more={!!collections.hasNextPage} onMore={() => collections.fetchNextPage()} />
					)}
					{!total && !isLoading && (
						<View className="items-start border border-[#334c64] bg-[#182c44] p-7">
							<H2 className="font-headers text-3xl text-[#f5efe1]">Nothing on this shelf</H2>
							<P className="mt-2 text-sm text-[#a9b8c7]">Try another search or remove a filter.</P>
						</View>
					)}
				</View>
			</View>
		</ScrollView>
	);
};

// Retain the public query helper for callers that need the mixed top-level index.
BrowsePage.query = ({
	filter,
	sortBy,
	sortOrd,
	search,
}: {
	filter?: string;
	sortBy?: SortBy;
	sortOrd?: SortOrd;
	search?: string;
}): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		sort: sortBy
			? `${sortOrd === "desc" ? "-" : ""}${sortBy === "rating" ? "rating:themoviedatabase" : sortBy}`
			: "name",
		filter,
		query: search,
	},
});
