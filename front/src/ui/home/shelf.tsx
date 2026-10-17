import { ScrollView, View } from "react-native";
import { ItemGrid, itemMap } from "~/components/items";
import { Movie, Serie } from "~/models";
import { Link, P } from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "~/query";
import { Header } from "./genre";

export const ShelfList = () => {
	const series = useInfiniteFetch(ShelfList.seriesQuery());
	const movies = useInfiniteFetch(ShelfList.moviesQuery());
	const items = [
		...(series.items ?? []).map((item) => ({ ...item, kind: "serie" as const })),
		...(movies.items ?? []).map((item) => ({ ...item, kind: "movie" as const })),
	];

	if (!items.length && !series.isFetching && !movies.isFetching) return null;

	return (
		<View>
			<Header title="On the shelves" action="Browse all" href="/browse" />
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ gap: 16, padding: 8, paddingBottom: 18 }}
				className="video-shelf"
			>
				{items.map((item) => (
					<ItemGrid
						key={item.id}
						{...itemMap(item)}
						horizontal
						className="w-38 sm:w-45"
					/>
				))}
				{!items.length && (
					<P className="py-6 text-kyoo-text-muted">Checking the shelves…</P>
				)}
				{(series.hasNextPage || movies.hasNextPage) && (
					<Link href="/browse" className="w-36 justify-center rounded-sm border border-kyoo-border-strong px-5">
						<P className="text-center font-semibold text-accent">See more titles</P>
					</Link>
				)}
			</ScrollView>
		</View>
	);
};

ShelfList.seriesQuery = (): QueryIdentifier<Serie> => ({
	parser: Serie,
	infinite: true,
	path: ["api", "series"],
	params: { sort: "name", limit: 16 },
});
ShelfList.moviesQuery = (): QueryIdentifier<Movie> => ({
	parser: Movie,
	infinite: true,
	path: ["api", "movies"],
	params: { sort: "name", limit: 16 },
});
