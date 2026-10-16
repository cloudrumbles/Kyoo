import { afterEach, expect, mock, test } from "bun:test";
import { isFullscreen, toggleFullscreen } from "./fullscreen";

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
const originalScreen = Object.getOwnPropertyDescriptor(globalThis, "screen");

const setBrowser = (document: object, screen: object = {}) => {
	Object.defineProperty(globalThis, "document", { configurable: true, value: document });
	Object.defineProperty(globalThis, "screen", { configurable: true, value: screen });
};

afterEach(() => {
	if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
	else Reflect.deleteProperty(globalThis, "document");
	if (originalScreen) Object.defineProperty(globalThis, "screen", originalScreen);
	else Reflect.deleteProperty(globalThis, "screen");
});

test("iPhone Safari uses native video fullscreen and can leave it", async () => {
	let displaying = false;
	const video = {
		get webkitDisplayingFullscreen() {
			return displaying;
		},
		webkitEnterFullscreen: mock(() => { displaying = true; }),
		webkitExitFullscreen: mock(() => { displaying = false; }),
	};
	setBrowser({
		fullscreenEnabled: false,
		fullscreenElement: null,
		body: {},
		querySelector: () => video,
	});

	await toggleFullscreen();
	expect(video.webkitEnterFullscreen).toHaveBeenCalledTimes(1);
	expect(isFullscreen()).toBe(true);

	await toggleFullscreen();
	expect(video.webkitExitFullscreen).toHaveBeenCalledTimes(1);
	expect(isFullscreen()).toBe(false);
});

test("desktop keeps page fullscreen even without orientation lock support", async () => {
	const body = {
		requestFullscreen: mock(async () => { documentState.fullscreenElement = body; }),
	};
	const documentState = {
		fullscreenEnabled: true,
		fullscreenElement: null as object | null,
		body,
		querySelector: () => null,
		exitFullscreen: mock(async () => { documentState.fullscreenElement = null; }),
	};
	const orientation = {
		lock: mock(async () => { throw new Error("unsupported"); }),
		unlock: mock(() => {}),
	};
	setBrowser(documentState, { orientation });

	await toggleFullscreen();
	expect(body.requestFullscreen).toHaveBeenCalledWith({ navigationUI: "hide" });
	expect(isFullscreen()).toBe(true);
	await toggleFullscreen();
	expect(documentState.exitFullscreen).toHaveBeenCalledTimes(1);
	expect(orientation.unlock).toHaveBeenCalledTimes(1);
	expect(isFullscreen()).toBe(false);
});

test("iPhone calls video fullscreen rather than a disabled page fullscreen API", async () => {
	const enterVideo = mock(() => {});
	const enterPage = mock(async () => {});
	setBrowser({
		fullscreenEnabled: false,
		fullscreenElement: null,
		body: { requestFullscreen: enterPage },
		querySelector: () => ({ webkitEnterFullscreen: enterVideo }),
	});

	await toggleFullscreen(true);
	expect(enterVideo).toHaveBeenCalledTimes(1);
	expect(enterPage).not.toHaveBeenCalled();
});
