import CastConnected from "@material-symbols/svg-400/rounded/cast_connected-fill.svg";
import Cast from "@material-symbols/svg-400/rounded/cast-fill.svg";
import FullscreenExit from "@material-symbols/svg-400/rounded/fullscreen_exit-fill.svg";
import Fullscreen from "@material-symbols/svg-400/rounded/fullscreen-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import VolumeDown from "@material-symbols/svg-400/rounded/volume_down-fill.svg";
import VolumeMute from "@material-symbols/svg-400/rounded/volume_mute-fill.svg";
import VolumeOff from "@material-symbols/svg-400/rounded/volume_off-fill.svg";
import VolumeUp from "@material-symbols/svg-400/rounded/volume_up-fill.svg";
import { type ComponentProps, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { usePlayer, usePlayerState } from "react-native-omni";
import { IconButton, Slider, Spinner, tooltip } from "~/primitives";
import { cn } from "~/utils";
import { isFullscreen, toggleFullscreen } from "../fullscreen";
import { setPlayerMuted, setPlayerVolume } from "../imperative";

export const PlayButton = (
	props: Partial<ComponentProps<typeof IconButton<PressableProps>>>,
) => {
	const { t } = useTranslation();

	const player = usePlayer();
	const playing = usePlayerState("isPlaying");

	return (
		<IconButton
			icon={playing ? Pause : PlayArrow}
			onPress={() => {
				if (playing) player.pause();
				else player.play();
			}}
			{...tooltip(playing ? t("player.pause") : t("player.play"), true)}
			{...props}
		/>
	);
};

export const CastButton = (
	props: Partial<ComponentProps<typeof IconButton<PressableProps>>>,
) => {
	const { t } = useTranslation();

	const player = usePlayer();
	const castStatus = usePlayerState("castStatus");

	if (
		!castStatus ||
		castStatus === "unavailable" ||
		castStatus === "unsupported"
	)
		return null;

	const active = castStatus === "connected" || castStatus === "connecting";
	return (
		<IconButton
			icon={active ? CastConnected : Cast}
			onPress={() => player.toggleCastStatus()}
			{...tooltip(active ? t("player.stop-cast") : t("player.cast"), true)}
			{...props}
		/>
	);
};

export const FullscreenButton = (
	props: Partial<ComponentProps<typeof IconButton<PressableProps>>>,
) => {
	// this is a web only component
	const { t } = useTranslation();

	const [fullscreen, setFullscreen] = useState(false);
	useEffect(() => {
		const update = () => setFullscreen(isFullscreen());
		update();
		document.addEventListener("fullscreenchange", update);
		// Safari dispatches these on the video, rather than on document.
		// Capture lets us handle them even if OmniView replaces its video.
		document.addEventListener("webkitbeginfullscreen", update, true);
		document.addEventListener("webkitendfullscreen", update, true);
		return () => {
			document.removeEventListener("fullscreenchange", update);
			document.removeEventListener("webkitbeginfullscreen", update, true);
			document.removeEventListener("webkitendfullscreen", update, true);
		};
	}, []);

	return (
		<IconButton
			icon={fullscreen ? FullscreenExit : Fullscreen}
			onPress={() => toggleFullscreen()}
			{...tooltip(t("player.fullscreen"), true)}
			{...props}
		/>
	);
};

export const VolumeSlider = ({
	className,
	iconClassName,
	...props
}: {
	className?: string;
	iconClassName?: string;
}) => {
	const { t } = useTranslation();

	const player = usePlayer();
	const volume = usePlayerState("volume");
	const muted = usePlayerState("muted");

	return (
		<View
			className={cn("flex-row items-center pr-2 max-sm:hidden", className)}
			{...props}
		>
			<IconButton
				icon={
					muted || volume === 0
						? VolumeOff
						: volume < 0.25
							? VolumeMute
							: volume < 0.65
								? VolumeDown
								: VolumeUp
				}
				onPress={() => {
					setPlayerMuted(player, !muted);
				}}
				iconClassName={iconClassName}
				{...tooltip(t("player.mute"), true)}
			/>
			<Slider
				progress={volume * 100}
				setProgress={(vol) => {
					setPlayerVolume(player, vol / 100);
				}}
				className="h-1 w-24"
				{...tooltip(t("player.volume"), true)}
			/>
		</View>
	);
};

export const LoadingIndicator = () => {
	const status = usePlayerState("status");
	const isLoading = status === "loading";

	if (!isLoading) return null;

	// Make the loader indicator be a border for the play button on touch devices (72px)
	return (
		<View className="pointer-events-none absolute inset-0 items-center justify-center">
			<Spinner size={72} />
		</View>
	);
};
