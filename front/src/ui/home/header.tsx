import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";
import { useWindowDimensions, View } from "react-native";
import { Show } from "~/models";
import {
	H1,
	Icon,
	ImageBackground,
	Link,
	P,
	Skeleton,
} from "~/primitives";
import { type QueryIdentifier, useFetch } from "~/query";

export const Header = () => {
	const { width } = useWindowDimensions();
	const { data } = useFetch(Header.query());
	const compact = width < 640;
	const height = compact ? 400 : 436;
	const playHref = data && data.kind !== "collection" ? data.playHref : null;
	const detailsHref = data?.href ?? "/browse";

	return (
		<View className="video-feature mx-3 mt-3 overflow-hidden sm:mx-8 sm:mt-6 lg:mx-14">
			<ImageBackground
				src={data?.thumbnail ?? null}
				quality="high"
				alt=""
				className="w-full bg-kyoo-surface"
				style={{ height }}
			>
				<View className="absolute inset-0 bg-linear-to-r from-kyoo-background via-kyoo-surface-inset/90 to-kyoo-surface-deep/15 max-sm:bg-linear-to-t max-sm:from-kyoo-background max-sm:via-kyoo-background/94 max-sm:to-kyoo-background/15" />
				<View className="absolute inset-0 bg-linear-to-t from-kyoo-background/65 via-transparent to-transparent" />
				<View className="flex-1 justify-end px-6 pb-8 pt-15 sm:w-[67%] sm:justify-center sm:px-10 sm:py-10 lg:px-14">
					<View className="mb-2 flex-row items-center gap-2">
						<View className="h-2 w-2 rounded-full bg-kyoo-accent" />
						<P className="font-sans text-xs font-bold tracking-wide text-kyoo-accent">
							Tonight's feature
						</P>
					</View>
					{data ? (
						<H1
							numberOfLines={3}
							className="max-w-[640px] font-headers text-[47px] leading-[0.95] font-bold text-kyoo-text-primary sm:text-[70px] lg:text-[82px]"
						>
							{data.name}
						</H1>
					) : (
						<Skeleton className="h-25 w-4/5" />
					)}
					{data && data.kind !== "collection" && data.tagline ? (
						<P numberOfLines={2} className="mt-3 max-w-[440px] text-sm font-medium text-kyoo-text-body sm:text-base">
							{data.tagline}
						</P>
					) : null}
					{data?.description ? (
						<P
							numberOfLines={compact ? 2 : 3}
							className="mt-3 max-w-[430px] text-sm leading-6 text-kyoo-text-dim"
						>
							{data.description}
						</P>
					) : null}
					<View className="mt-6 flex-row flex-wrap items-center gap-3">
						{playHref ? (
							<Link
								href={playHref}
								accessibilityLabel="Play featured title"
								className="flex-row items-center gap-2 rounded-sm bg-accent px-5 py-3 outline-0 highlighted:bg-kyoo-accent-hover"
							>
								<Icon icon={PlayArrow} className="h-5 w-5 fill-kyoo-navigation-ink" />
								<P className="font-bold text-kyoo-navigation-ink">Play now</P>
							</Link>
						) : null}
						<Link
							href={detailsHref}
							accessibilityLabel="View featured title"
							className="flex-row items-center gap-2 rounded-sm border border-kyoo-border-focus bg-kyoo-background/55 px-5 py-3 outline-0 highlighted:border-accent"
						>
							<Icon icon={Info} className="h-5 w-5 fill-kyoo-text-primary" />
							<P className="font-semibold text-kyoo-text-primary">
								{data?.kind === "collection" ? "Explore collection" : "View case"}
							</P>
						</Link>
					</View>
				</View>
			</ImageBackground>
		</View>
	);
};

Header.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", "shows", "random"],
	params: { with: ["firstEntry"] },
});
