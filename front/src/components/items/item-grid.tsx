import { useState } from "react";
import { View } from "react-native";
import type { KImage, WatchStatusV } from "~/models";
import {
	Link,
	P,
	Poster,
	PosterBackground,
	rem,
	Skeleton,
	SubP,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn } from "~/utils";
import { ShowContext } from "./context-menus";
import { ItemWatchStatus } from "./item-helpers";

export const ItemProgress = ({ watchPercent }: { watchPercent: number }) => {
	if (!watchPercent) return null;
	return (
		<>
			<View className="absolute bottom-0 h-1 w-full bg-slate-400" />
			<View
				className="absolute bottom-0 h-1 bg-accent"
				style={{ width: `${watchPercent}%` }}
			/>
		</>
	);
};

export const ItemGrid = ({
	href,
	slug,
	name,
	kind,
	subtitle,
	poster,
	watchStatus,
	watchPercent,
	availableCount,
	seenCount,
	videoSlug,
	horizontal = false,
	className,
	...props
}: {
	href: string;
	slug: string;
	name: string;
	subtitle: string | null;
	poster: KImage | null;
	watchStatus: WatchStatusV | null;
	watchPercent: number | null;
	kind: "movie" | "serie" | "collection";
	availableCount?: number | null;
	seenCount?: number | null;
	videoSlug: string | null;
	horizontal?: boolean;
	className?: string;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);

	return (
		<Link
			href={moreOpened ? undefined : href}
			onLongPress={() => setMoreOpened(true)}
			className={cn(
				"group items-start p-1 outline-0",
				horizontal && "h-full w-43 sm:w-47",
				className,
			)}
			{...props}
		>
			<PosterBackground
				src={poster}
				quality="low"
				className="video-case w-full rounded-[2px] ring-accent group-highlighted:ring-2"
			>
				<ItemWatchStatus
					watchStatus={watchStatus}
					availableCount={availableCount}
					seenCount={seenCount}
				/>
				{kind === "movie" && !!watchPercent && (
					<ItemProgress watchPercent={watchPercent} />
				)}
				<ShowContext
					kind={kind}
					slug={slug}
					name={name}
					videoSlug={videoSlug}
					status={watchStatus}
					isOpen={moreOpened}
					setOpen={setMoreOpened}
					className={cn(
						"absolute top-0 right-0 bg-gray-800/70 highlighted:bg-gray-800",
						"native:hidden opacity-0 focus-visible:opacity-100 group-highlighted:opacity-100",
						moreOpened && "opacity-100",
					)}
					iconClassName="fill-slate-200 dark:fill-slate-200"
				/>
			</PosterBackground>
			<P
				numberOfLines={2}
				className="mt-3 w-full text-left text-[13px] leading-5 font-semibold text-kyoo-text-primary group-highlighted:text-accent sm:text-sm"
			>
				{name}
			</P>
			{subtitle && <SubP numberOfLines={1} className="w-full text-left text-xs text-kyoo-text-muted">{subtitle}</SubP>}
		</Link>
	);
};

ItemGrid.Loader = ({
	horizontal = false,
	...props
}: {
	horizontal?: boolean;
}) => {
	return (
		<View
			className={cn("w-full items-start p-1", horizontal && "h-full w-43 sm:w-47")}
			{...props}
		>
			<Poster.Loader className="w-full" />
			<Skeleton />
			<Skeleton className="w-1/2" />
		</View>
	);
};

ItemGrid.layout = {
	size: rem(54),
	numColumns: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
	gap: { xs: rem(3), md: rem(4) },
	layout: "grid",
} satisfies Layout;
