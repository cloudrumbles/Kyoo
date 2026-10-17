import type { ReactNode } from "react";
import { View } from "react-native";
import { ItemGrid, itemMap } from "~/components/items";
import { type Genre, Show } from "~/models";
import { H3, Link, P } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";

export const Header = ({
	title,
	children,
	action,
	href,
}: {
	title: string;
	children?: ReactNode;
	action?: string;
	href?: string;
}) => {
	return (
		<View scrollSnapAlign="start">
			<View className="video-section-rule mb-4 flex-row items-end justify-between gap-3 pb-3">
				<H3 className="flex-1 font-headers text-[29px] leading-8 font-bold text-[#f5efe1] sm:text-[34px]">
					{title}
				</H3>
				{action && href ? (
					<Link href={href} className="rounded-sm px-1 py-2">
						<P className="text-xs font-semibold text-[#f0c875] sm:text-sm">
							{action}
						</P>
					</Link>
				) : null}
			</View>
			{children}
		</View>
	);
};

export const GenreGrid = ({ genre }: { genre: Genre }) => {
	const query = GenreGrid.query(genre);
	return (
		<Header title={genre}>
			<InfiniteFetch
				query={query}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				Render={({ item }) => <ItemGrid {...itemMap(item)} horizontal />}
				Loader={() => <ItemGrid.Loader horizontal />}
			/>
		</Header>
	);
};

GenreGrid.query = (genre: Genre): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		filter: `genres has ${genre}`,
		sort: "random",
		limit: 10,
	},
});
