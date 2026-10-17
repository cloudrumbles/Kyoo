import { type ComponentProps, useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import type { Entry, Serie } from "~/models";
import { Container, FocusGroup, H2, Svg } from "~/primitives";
import { Fetch } from "~/query";
import { SearchBar } from "~/ui/navbar";
import { useQueryState } from "~/utils";
import { useHeroHeight } from "../hero";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { EntryList } from "./season";
import { InfoShelf } from "./shelf";
import { Staff } from "./staff";

export const SvgWave = (_props: ComponentProps<typeof Svg>) => (
	<View className="h-1 w-full bg-[#344b62]" />
);

export const NextUp = ({
	entry,
	onSelectVideos,
}: {
	entry: Entry;
	onSelectVideos?: (entry: {
		displayNumber: string;
		name: string | null;
		videos: Entry["videos"];
	}) => void;
}) => {
	const { t } = useTranslation();
	const displayNumber = entryDisplayNumber(entry);

	return (
		<View className="m-4 flex-1">
			<Container className="overflow-hidden rounded-sm border border-[#344b62] bg-card py-4">
				<H2 className="mb-4 ml-2">{t("show.nextUp")}</H2>
				<EntryLine
					{...entry}
					serieSlug={null}
					videos={entry.videos}
					watchedPercent={entry.progress.percent}
					displayNumber={displayNumber}
					onSelectVideos={() =>
						onSelectVideos?.({
							displayNumber,
							name: entry.name,
							videos: entry.videos,
						})
					}
				/>
			</Container>
		</View>
	);
};

NextUp.Loader = () => {
	const { t } = useTranslation();

	return (
		<View className="m-4 flex-1">
			<Container className="overflow-hidden rounded-sm border border-[#344b62] bg-card py-4">
				<H2 className="ml-4">{t("show.nextUp")}</H2>
				<EntryLine.Loader />
			</Container>
		</View>
	);
};

const SerieHeader = ({
	slug,
	onSelectVideos,
	openInfo,
}: {
	slug: string;
	openInfo?: () => void;
	onSelectVideos?: (entry: {
		displayNumber: string;
		name: string | null;
		videos: Entry["videos"];
	}) => void;
}) => {
	const [_, setSearch] = useQueryState("search", "");
	// Defer the cast grid & next-up block to a low-priority render: the hero
	// commits (and paints) first, then the below-the-fold subtree mounts,
	// instead of everything landing in the same synchronous commit.
	const belowFold = useDeferredValue(true, false);

	return (
		<View className="bg-background">
			<Header kind="serie" slug={slug} openInfo={openInfo} />
			{belowFold && (
				<>
					<Fetch
						// Use the same fetch query as header
						query={Header.query("serie", slug)}
						Render={(serie) => {
							const nextEntry = (serie as Serie).nextEntry;
							return nextEntry ? (
								<NextUp entry={nextEntry} onSelectVideos={onSelectVideos} />
							) : null;
						}}
						Loader={NextUp.Loader}
					/>
					{!Platform.isTV && (
						<Container className="mb-4">
							<Staff kind="serie" slug={slug} layout={Staff.layout} />
						</Container>
					)}
				</>
			)}
			<SvgWave className="flex-1 shrink-0 fill-card" />
			<View className="bg-card pb-4 pl-[10%]">
				{!Platform.isTV && (
					<View className="-mt-4 lg:-mt-12 xl:-mt-24">
						<SearchBar
							onChangeText={(q) => setSearch(q)}
							forceExpand
							containerClassName="w-2/5 max-w-90"
						/>
					</View>
				)}
			</View>
		</View>
	);
};

export const SerieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const [season] = useQueryState("season", undefined!);
	const [search] = useQueryState("search", "");
	const insets = useSafeAreaInsets();
	const { scrollHandler, headerProps, headerHeight } = useScrollNavbar({
		imageHeight: useHeroHeight(),
	});
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);
	const [info, setInfo] = useState(false);

	return (
		<View className="flex-1 bg-card">
			<HeaderBackground {...headerProps} />
			<FocusGroup autoFocus focusable={!info} className="flex-1">
				<EntryList
					slug={slug}
					season={season}
					search={search}
					onSelectVideos={setSelected}
					Header={() => (
						<SerieHeader
							slug={slug}
							onSelectVideos={setSelected}
							openInfo={Platform.isTV ? () => setInfo(true) : undefined}
						/>
					)}
					contentContainerStyle={{ paddingBottom: insets.bottom }}
					withContainer
					onScroll={scrollHandler}
					scrollEventThrottle={16}
					stickyHeaderConfig={{ offset: headerHeight }}
				/>
			</FocusGroup>
			{Platform.isTV && (
				<InfoShelf
					kind="serie"
					slug={slug}
					isOpen={info}
					close={() => setInfo(false)}
				/>
			)}
			<EntrySelect entry={selected} onClose={() => setSelected(null)} />
		</View>
	);
};
