import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Entry, KImage } from "~/models";
import {
	Image,
	Link,
	P,
	rem,
	Skeleton,
	SubP,
	ThumbnailBackground,
} from "~/primitives";
import type { Layout } from "~/query";
import { cn } from "~/utils";
import { EntryContext } from "../items/context-menus";
import { ItemProgress } from "../items/item-grid";

export const EntryBox = ({
	kind,
	slug,
	serieSlug,
	name,
	description,
	thumbnail,
	href,
	watchedPercent,
	videos,
	onSelectVideos,
	className,
	...props
}: {
	kind: "movie" | "episode" | "special";
	slug: string;
	// if serie slug is null, disable "Go to serie" in the context menu
	serieSlug: string | null;
	name: string | null;
	description: string | null;
	href: string | null;
	thumbnail: KImage | null;
	watchedPercent: number;
	videos: Entry["videos"];
	onSelectVideos: () => void;
	className?: string;
}) => {
	const [moreOpened, setMoreOpened] = useState(false);
	const { t } = useTranslation();

	return (
		<Link
			href={moreOpened || videos.length > 1 ? undefined : href}
			onPress={videos.length > 1 ? onSelectVideos : undefined}
			onLongPress={() => setMoreOpened(true)}
			className={cn(
				"group w-65 items-start p-1 outline-0 sm:w-75",
				href === null && "opacity-50",
				className,
			)}
			{...props}
		>
			<ThumbnailBackground
				src={thumbnail}
				quality="low"
				alt=""
				className={cn(
					"video-case aspect-video w-full rounded-[2px]",
					"ring-accent group-highlighted:ring-3",
				)}
			>
				<ItemProgress watchPercent={watchedPercent} />
				<EntryContext
					kind={kind}
					slug={slug}
					serieSlug={serieSlug}
					videoSlug={videos.length === 1 ? videos[0].slug : null}
					isOpen={moreOpened}
					setOpen={setMoreOpened}
					className={cn(
						"absolute top-0 right-0 bg-gray-800/70 highlighted:bg-gray-800",
						"native:hidden opacity-0 focus-visible:opacity-100 group-highlighted:opacity-100",
						moreOpened && "opacity-100",
					)}
					iconClassName="fill-slate-200 dark:fill-slate-200"
				/>
			</ThumbnailBackground>
			<P numberOfLines={2} className="mt-3 w-full text-left text-sm font-semibold text-[#f5efe1] group-highlighted:text-accent">
				{name ?? t("show.episodeNoMetadata")}
			</P>
			<SubP numberOfLines={2} className="mt-0.5 w-full text-left text-xs text-[#9fb1c0]">
				{description}
			</SubP>
		</Link>
	);
};

EntryBox.Loader = (props: object) => {
	return (
		<View className={"h-full w-87.5 items-center p-1"} {...props}>
			<Image.Loader className="aspect-video w-full" />
			<Skeleton className="w-1/2" />
			<Skeleton className="h-3 w-4/5" />
		</View>
	);
};

EntryBox.layout = {
	size: rem(65),
	numColumns: { xs: 3, sm: 4, md: 5, lg: 6, xl: 8 },
	gap: { xs: rem(1), md: rem(2) },
	layout: "grid",
} satisfies Layout;
