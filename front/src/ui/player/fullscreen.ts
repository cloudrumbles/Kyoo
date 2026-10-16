// On iPhone Safari, document fullscreen is unsupported; video fullscreen is not.
type SafariVideo = HTMLVideoElement & {
	webkitEnterFullscreen?: () => void;
	webkitExitFullscreen?: () => void;
	readonly webkitDisplayingFullscreen?: boolean;
};

const videoElement = (): SafariVideo | null =>
	document.querySelector<SafariVideo>("video");

export const isFullscreen = () =>
	Boolean(document.fullscreenElement || videoElement()?.webkitDisplayingFullscreen);

export const toggleFullscreen = async (set = !isFullscreen()) => {
	const video = videoElement();

	try {
		if (set) {
			// Must be called synchronously from the button press: iOS requires a
			// user gesture, and awaiting anything first would consume it.
			if (!document.body.requestFullscreen || document.fullscreenEnabled === false) {
				if (!video?.webkitEnterFullscreen)
					throw new Error("video fullscreen is not supported");
				video.webkitEnterFullscreen();
				return;
			}

			await document.body.requestFullscreen({ navigationUI: "hide" });
			// Orientation lock is optional (not implemented by all browsers).
			try {
				await screen.orientation?.lock?.("landscape");
			} catch {
				// Fullscreen still works when orientation locking is unavailable.
			}
		} else {
			if (video?.webkitDisplayingFullscreen) video.webkitExitFullscreen?.();
			if (document.fullscreenElement) await document.exitFullscreen();
			try {
				screen.orientation?.unlock?.();
			} catch {
				// Native video fullscreen does not use the orientation lock.
			}
		}
	} catch (e) {
		console.error("failed to toggle fullscreen", e);
	}
};
