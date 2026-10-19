import Download from "@material-symbols/svg-400/rounded/download.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, type PressableProps, View } from "react-native";
import { startVideoDownload } from "~/downloads";
import { Button, IconButton, P, Popup, tooltip } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";

type DownloadVideo = {
	slug: string;
	path?: string;
	version?: number;
	part?: number | null;
};

export const VideoDownload = ({
	videos,
	showLabel = false,
	className,
	iconClassName,
}: {
	videos: readonly DownloadVideo[];
	showLabel?: boolean;
	className?: string;
	iconClassName?: string;
}) => {
	const { t } = useTranslation();
	const { apiUrl } = useToken();
	const [selecting, setSelecting] = useState(false);

	if (Platform.OS !== "web" || videos.length === 0) return null;

	const label = t("home.episodeMore.download");
	const onPress: NonNullable<PressableProps["onPress"]> = (event) => {
		// Episode rows are playback links. Downloading must not start playback.
		event.preventDefault();
		event.stopPropagation();
		if (videos.length === 1) startVideoDownload(videos[0].slug, apiUrl);
		else setSelecting(true);
	};

	const buttonProps = {
		icon: Download,
		onPress,
		accessibilityRole: "button" as const,
		accessibilityLabel: label,
		className: cn("min-h-11 min-w-11 shrink-0", className),
		...tooltip(label),
	};

	return (
		<>
			{showLabel ? (
				<Button {...buttonProps} text={label} />
			) : (
				<IconButton {...buttonProps} iconClassName={iconClassName} />
			)}
			{selecting && (
				<Popup title={label} close={() => setSelecting(false)}>
					<P className="mb-4 text-kyoo-text-muted">
						Choose a file. Downloads keep the original video, audio and embedded
						subtitles.
					</P>
					<View className="gap-2">
						{videos.map((video) => (
							<Button
								key={video.slug}
								icon={Download}
								text={[
									video.path?.split(/[\\/]/).pop() ?? video.slug,
									video.version !== undefined
										? t("show.version", { number: video.version })
										: null,
									video.part != null
										? t("show.part", { number: video.part })
										: null,
								]
									.filter(Boolean)
									.join(" · ")}
								accessibilityRole="button"
								onPress={(event) => {
									event.preventDefault();
									event.stopPropagation();
									startVideoDownload(video.slug, apiUrl);
									setSelecting(false);
								}}
							/>
						))}
					</View>
				</Popup>
			)}
		</>
	);
};
