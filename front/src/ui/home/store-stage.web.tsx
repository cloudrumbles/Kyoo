import { useEffect, useRef, useState } from "react";
import { designTokens } from "../../../design/tokens";
import type { CanvasTexture, Group, MeshBasicMaterial, Object3D } from "three";

export type RentalCase = {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	artwork: string | null;
	kind: "episode" | "series" | "film" | "collection";
	href: string | null;
	playHref: string | null;
	progress?: number;
};

type StageProps = {
	items: RentalCase[];
	active: number;
	opened: boolean;
	flipped: boolean;
	onPick: (index: number) => void;
	onShift: (direction: -1 | 1) => void;
};

type Engine = {
	changeItems: (items: RentalCase[]) => void;
	aim: (index: number, opened: boolean, flipped: boolean) => void;
	destroy: () => void;
};
type CaseMesh = {
	group: Group;
	texture: CanvasTexture;
	material: MeshBasicMaterial;
	back: MeshBasicMaterial;
	backTexture: CanvasTexture | null;
	image: HTMLImageElement | null;
	artworkAttempted: boolean;
};

const C = designTokens.colors;
const S = designTokens.scene;
const CW = S.case.width;
const CH = S.case.height;
const CD = S.case.depth;
const STEP = CW + S.case.gap;

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, dy: number, limit: number) {
	let line = "";
	let count = 0;
	for (const word of text.split(/\s+/).filter(Boolean)) {
		const next = line ? line + " " + word : word;
		if (line && g.measureText(next).width > width) {
			g.fillText(line, x, y + count * dy);
			count++;
			line = word;
			if (count >= limit) return y + count * dy;
		} else line = next;
	}
	if (line && count < limit) { g.fillText(line, x, y + count * dy); count++; }
	return y + count * dy;
}

function paintSleeve(item: RentalCase) {
	const canvas = document.createElement("canvas");
	canvas.width = S.case.coverWidth;
	canvas.height = S.case.coverHeight;
	const g = canvas.getContext("2d", { alpha: false })!;
	g.scale(canvas.width / 320, canvas.height / 480);
	const band = item.kind === "episode" ? C.caseBandEpisode : item.kind === "film" ? C.caseBandFilm : C.caseBandSeries;
	const paint = (image?: HTMLImageElement) => {
		g.fillStyle = C.nightInk;
		g.fillRect(0, 0, 320, 480);
		g.fillStyle = band;
		g.fillRect(0, 0, 320, 39);
		g.fillStyle = C.textWarm;
		g.font = `700 ${designTokens.type.caseLabel} ${designTokens.fonts.caseBody}`;
		g.fillText("KYOO", 16, 26);
		g.font = `${designTokens.type.caseSmall} ${designTokens.fonts.caseBody}`;
		g.fillText(item.kind === "episode" ? "EPISODE" : item.kind === "collection" ? "BOX SET" : item.kind === "film" ? "FILM" : "SERIES", 244, 25);
		g.fillStyle = C.surfaceCase;
		g.fillRect(10, 47, 300, 329);
		if (image) {
			const ratio = 300 / 329;
			const srcRatio = image.naturalWidth / image.naturalHeight;
			let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
			if (srcRatio > ratio) { sw = image.naturalHeight * ratio; sx = (image.naturalWidth - sw) / 2; }
			else { sh = image.naturalWidth / ratio; sy = (image.naturalHeight - sh) / 2; }
			g.drawImage(image, sx, sy, sw, sh, 10, 47, 300, 329);
		} else {
			g.strokeStyle = C.caseEdge;
			g.lineWidth = 2;
			for (let j = 0; j < 4; j++) g.strokeRect(22 + j * 11, 66 + j * 11, 275 - j * 22, 278 - j * 22);
		}
		const glow = g.createLinearGradient(0, 263, 0, 376);
		glow.addColorStop(0, "rgba(10,22,36,0)");
		glow.addColorStop(1, "rgba(10,22,36,.54)");
		g.fillStyle = glow;
		g.fillRect(10, 263, 300, 113);
		g.fillStyle = C.paper;
		g.fillRect(0, 379, 320, 101);
		g.fillStyle = C.textOnLight;
		g.font = `700 ${designTokens.type.caseTitle} ${designTokens.fonts.caseTitle}`;
		const end = wrap(g, item.title, 17, 410, 288, 27, 2);
		g.fillStyle = C.textOnLightMuted;
		g.font = `${designTokens.type.caseSmall} ${designTokens.fonts.caseBody}`;
		wrap(g, item.subtitle || "From your library", 17, Math.min(456, end + 4), 288, 16, 1);
		if ((item.progress ?? 0) > 0) {
			g.fillStyle = C.caseProgressTrack;
			g.fillRect(0, 474, 320, 6);
			g.fillStyle = C.accent;
			g.fillRect(0, 474, 320 * Math.min(item.progress!, 100) / 100, 6);
		}
		g.fillStyle = C.casePaintGlare;
		g.fillRect(1, 0, 3, 480);
	};
	paint();
	return { canvas, paint };
}

function paintBack(item: RentalCase) {
	const canvas = document.createElement("canvas");
	canvas.width = S.case.coverWidth;
	canvas.height = S.case.coverHeight;
	const g = canvas.getContext("2d", { alpha: false })!;
	g.scale(canvas.width / 320, canvas.height / 480);
	g.fillStyle = C.caseBack;
	g.fillRect(0, 0, 320, 480);
	g.fillStyle = C.caseBackBand;
	g.fillRect(0, 0, 320, 36);
	g.fillStyle = C.brass;
	g.fillRect(23, 65, 273, 2);
	g.fillStyle = C.textPrimary;
	g.font = `700 ${designTokens.type.caseBackTitle} ${designTokens.fonts.caseTitle}`;
	const y = wrap(g, item.title, 22, 108, 270, 36, 3);
	g.font = `700 ${designTokens.type.caseSmall} ${designTokens.fonts.caseBody}`;
	g.fillStyle = C.brass;
	g.fillText(item.kind.toUpperCase(), 22, Math.min(y + 17, 215));
	g.strokeStyle = C.caseBackStroke;
	g.strokeRect(22, 232, 275, 188);
	g.fillStyle = C.textPrimary;
	g.font = `${designTokens.type.caseBody} ${designTokens.fonts.caseBody}`;
	wrap(g, item.description || item.subtitle || "Visit this title for details.", 34, 259, 247, 24, 6);
	g.fillStyle = C.brass;
	g.fillRect(22, 451, 86, 5);
	g.font = `700 ${designTokens.type.caseSmall} ${designTokens.fonts.caseBody}`;
	g.fillText("KYOO VIDEO", 22, 443);
	return canvas;
}

async function start(canvas: HTMLCanvasElement, handlers: { pick: (i: number) => void; shift: (direction: -1 | 1) => void; fail: () => void }): Promise<Engine> {
	const THREE = await import("three");
	const context = canvas.getContext("webgl2", { alpha: false, antialias: false, stencil: false, powerPreference: "low-power" }) ??
		canvas.getContext("webgl", { alpha: false, antialias: false, stencil: false, powerPreference: "low-power" });
	if (!context) throw new Error("WebGL unavailable");
	const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: false, antialias: false, powerPreference: "low-power" });
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.shadowMap.enabled = false;
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(C.sceneBackground);
	const camera = new THREE.PerspectiveCamera(S.camera.fieldOfView, 1, S.camera.near, S.camera.far);
	camera.position.set(0, S.camera.y, S.camera.distance);
	camera.lookAt(0, S.camera.targetY, 0);
	scene.add(new THREE.HemisphereLight(S.lights.ambient.sky, S.lights.ambient.ground, S.lights.ambient.intensity));
	const light = new THREE.DirectionalLight(S.lights.key.color, S.lights.key.intensity);
	light.position.set(...S.lights.key.position);
	scene.add(light);
	const fill = new THREE.DirectionalLight(S.lights.fill.color, S.lights.fill.intensity);
	fill.position.set(...S.lights.fill.position);
	scene.add(fill);

	const wood = new THREE.MeshStandardMaterial({ color: C.walnut, roughness: S.materials.woodRoughness });
	const top = new THREE.MeshStandardMaterial({ color: C.woodTop, roughness: S.materials.shelfRoughness });
	const steel = new THREE.MeshStandardMaterial({ color: C.enamel, roughness: S.materials.steelRoughness, metalness: S.materials.steelMetalness });
	const gold = new THREE.MeshBasicMaterial({ color: C.sceneBrass });
	const shells = {
		episode: new THREE.MeshStandardMaterial({ color: C.caseShellEpisode, roughness: S.materials.shellRoughness }),
		series: new THREE.MeshStandardMaterial({ color: C.caseShellSeries, roughness: S.materials.shellRoughness, metalness: S.materials.shellMetalness }),
		film: new THREE.MeshStandardMaterial({ color: C.caseShellFilm, roughness: S.materials.shellRoughness }),
		collection: new THREE.MeshStandardMaterial({ color: C.caseShellSeries, roughness: S.materials.shellRoughness, metalness: S.materials.shellMetalness }),
	};
	const shadowMaterial = new THREE.MeshBasicMaterial({ color: C.caseShadowInk, transparent: true, opacity: S.materials.shadowOpacity, depthWrite: false });
	const spineMaterial = new THREE.MeshStandardMaterial({ color: C.caseSpine, metalness: S.materials.spineMetalness, roughness: S.materials.spineRoughness });
	const resources: Array<import("three").BufferGeometry> = [];
	const box = (rect: readonly number[], material: import("three").Material) => {
		const [w, h, d, x, y, z] = rect;
		const geo = new THREE.BoxGeometry(w, h, d);
		resources.push(geo);
		const mesh = new THREE.Mesh(geo, material);
		mesh.position.set(x, y, z);
		scene.add(mesh);
	};
	const architecture = S.architecture;
	box(architecture.shelfTop, top);
	box(architecture.shelfFront, wood);
	box(architecture.shelfTrim, gold);
	box(architecture.lowerShelf, wood);
	box(architecture.lowerTrim, gold);
	box(architecture.upperRail, steel);
	box(architecture.upperTrim, gold);
	for (const x of architecture.uprightPositions) {
		box([...architecture.upright, x, architecture.uprightY, architecture.uprightXZ[0]], steel);
	}
	const bgGeo = new THREE.PlaneGeometry(architecture.wall[0], architecture.wall[1]);
	resources.push(bgGeo);
	const bgMat = new THREE.MeshBasicMaterial({ color: C.sceneWall });
	const wall = new THREE.Mesh(bgGeo, bgMat);
	wall.position.z = architecture.wall[2];
	scene.add(wall);
	// Shared case geometry and case-shell materials keep GPU submissions small.
	const caseGeo = new THREE.BoxGeometry(CW, CH, CD);
	const faceGeo = new THREE.PlaneGeometry(CW - S.case.faceInsetWidth, CH - S.case.faceInsetHeight);
	const sideGeo = new THREE.PlaneGeometry(CD, CH - S.case.spineInsetHeight);
	const shadowGeo = new THREE.PlaneGeometry(CW + S.case.shadowExtraWidth, CH + S.case.shadowExtraHeight);
	resources.push(caseGeo, faceGeo, sideGeo, shadowGeo);

	let cards: CaseMesh[] = [];
	let currentItems: RentalCase[] = [];
	let selected = 0, opened = false, flipped = false, dead = false, raf = 0, frames = 0;
	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	function schedule() {
		if (!dead && !raf && !document.hidden) raf = requestAnimationFrame(render);
	}
	function render() {
		raf = 0;
		if (dead || document.hidden) return;
		let moving = false;
		const speed = reduce ? 1 : S.motion.easing;
		cards.forEach((c, i) => {
			const diff = i - selected;
			const focus = opened && diff === 0;
			const tx = diff * (opened ? STEP * S.case.focusSpacing : STEP);
			const ty = focus ? S.case.focusLift : S.case.idleY;
			const tz = focus ? S.case.focusDepth : -Math.min(Math.abs(diff) * S.case.adjacentDepth, S.case.maxAdjacentDepth);
			const tr = focus ? (flipped ? Math.PI : S.case.focusAngle) : diff === 0 ? S.case.restingAngle : Math.max(-S.case.maxAdjacentAngle, Math.min(S.case.maxAdjacentAngle, diff * -S.case.adjacentAngle));
			const ts = focus ? S.case.focusScale : 1;
			const d = Math.abs(tx - c.group.position.x) + Math.abs(ty - c.group.position.y) +
				Math.abs(tz - c.group.position.z) + Math.abs(tr - c.group.rotation.y) + Math.abs(ts - c.group.scale.x);
			if (d > S.motion.settleThreshold) moving = true;
			c.group.position.x += (tx - c.group.position.x) * speed;
			c.group.position.y += (ty - c.group.position.y) * speed;
			c.group.position.z += (tz - c.group.position.z) * speed;
			c.group.rotation.y += (tr - c.group.rotation.y) * speed;
			c.group.scale.setScalar(c.group.scale.x + (ts - c.group.scale.x) * speed);
		});
		renderer.render(scene, camera);
		frames++;
		canvas.dataset.drawCalls = String(renderer.info.render.calls);
		canvas.dataset.frameCount = String(frames);
		canvas.dataset.idle = moving ? "false" : "true";
		canvas.dataset.textures = String(renderer.info.memory.textures);
		if (moving && !reduce) schedule();
	}
	function resize() {
		const rect = canvas.getBoundingClientRect();
		const w = Math.max(1, Math.round(rect.width));
		const h = Math.max(1, Math.round(rect.height));
		const dpr = Math.min(window.devicePixelRatio || 1, w < S.performance.mobileBreakpointPx ? S.performance.dprMobile : S.performance.dprDesktop);
		renderer.setPixelRatio(dpr);
		renderer.setSize(w, h, false);
		canvas.dataset.pixelRatio = String(dpr);
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		schedule();
	}
	const observer = new ResizeObserver(resize);
	observer.observe(canvas);
	const onVisibility = () => {
		if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
		if (!document.hidden) schedule();
	};
	document.addEventListener("visibilitychange", onVisibility);
	const onLost = (e: Event) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; handlers.fail(); };
	canvas.addEventListener("webglcontextlost", onLost);
	const ray = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	let down: { x: number; y: number } | null = null;
	const pointerDown = (e: PointerEvent) => { if (e.button === 0) down = { x: e.clientX, y: e.clientY }; };
	const pointerUp = (e: PointerEvent) => {
		if (!down) return;
		const dx = e.clientX - down.x, dy = e.clientY - down.y;
		down = null;
		if (Math.abs(dx) > S.motion.swipeThresholdPx && Math.abs(dx) > Math.abs(dy) * 1.4) { handlers.shift(dx < 0 ? 1 : -1); return; }
		if (Math.abs(dy) > S.motion.tapTolerancePx) return;
		const rect = canvas.getBoundingClientRect();
		pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
		ray.setFromCamera(pointer, camera);
		const hit = ray.intersectObjects(cards.map(x => x.group), true)[0];
		if (!hit) return;
		let obj: Object3D | null = hit.object;
		while (obj && typeof obj.userData.caseIndex !== "number") obj = obj.parent;
		if (obj) handlers.pick(obj.userData.caseIndex);
	};
	canvas.addEventListener("pointerdown", pointerDown);
	canvas.addEventListener("pointerup", pointerUp);

	function clearCases() {
		cards.forEach(c => {
			if (c.image) { c.image.onload = null; c.image.onerror = null; }
			scene.remove(c.group);
			c.texture.dispose();
			c.material.dispose();
			c.backTexture?.dispose();
			c.back.dispose();
		});
		cards = [];
		painters.clear();
	}
	function loadNearbyArtwork() {
		cards.forEach((card, i) => {
			const art = currentItems[i]?.artwork;
			if (!art || card.artworkAttempted || Math.abs(i - selected) > S.performance.artworkRadius) return;
			card.artworkAttempted = true;
			const img = new Image();
			card.image = img;
			img.decoding = "async";
			img.onload = () => {
				if (dead || !cards.includes(card)) return;
				const painter = painters.get(card);
				if (!painter) return;
				painter(img);
				card.texture.needsUpdate = true;
				schedule();
			};
			img.onerror = () => { card.image = null; };
			img.src = art;
		});
	}
	const painters = new Map<CaseMesh, (image?: HTMLImageElement) => void>();
	function changeItems(items: RentalCase[]) {
		if (dead) return;
		clearCases();
		currentItems = items.slice(0, S.case.maxCount);
		selected = Math.min(selected, Math.max(currentItems.length - 1, 0));
		currentItems.forEach((item, i) => {
			const group = new THREE.Group();
			group.userData.caseIndex = i;
			const body = new THREE.Mesh(caseGeo, shells[item.kind]);
			group.add(body);
			const { canvas: sleeve, paint } = paintSleeve(item);
			const texture = new THREE.CanvasTexture(sleeve);
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.anisotropy = S.performance.textureAnisotropy;
			const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
			const front = new THREE.Mesh(faceGeo, material);
			front.position.z = CD / 2 + .004;
			group.add(front);
			const backMat = new THREE.MeshBasicMaterial({ color: C.caseBack, side: THREE.DoubleSide });
			const back = new THREE.Mesh(faceGeo, backMat);
			back.rotation.y = Math.PI;
			back.position.z = -CD / 2 - .005;
			group.add(back);
			const side = new THREE.Mesh(sideGeo, spineMaterial);
			side.position.x = -CW / 2 - .005;
			side.rotation.y = -Math.PI / 2;
			group.add(side);
			const shadow = new THREE.Mesh(shadowGeo, shadowMaterial);
			shadow.position.set(S.case.shadowOffsetX, S.case.shadowOffsetY, S.case.shadowOffsetZ);
			group.add(shadow);
			group.position.set((i - selected) * STEP, S.case.idleY, S.case.idleZ);
			scene.add(group);
			const card: CaseMesh = { group, texture, material, back: backMat, backTexture: null, image: null, artworkAttempted: false };
			cards.push(card);
			painters.set(card, paint);
		});
		loadNearbyArtwork();
		schedule();
	}
	function aim(index: number, isOpen: boolean, isFlipped: boolean) {
		selected = Math.min(Math.max(0, index), Math.max(currentItems.length - 1, 0));
		opened = isOpen;
		flipped = isFlipped;
		loadNearbyArtwork();
		cards.forEach((card, i) => {
			if (i !== selected || !opened || !flipped || card.backTexture) return;
			const backTexture = new THREE.CanvasTexture(paintBack(currentItems[i]!));
			backTexture.colorSpace = THREE.SRGBColorSpace;
			card.backTexture = backTexture;
			card.back.map = backTexture;
			card.back.color.set(C.white);
			card.back.needsUpdate = true;
		});
		schedule();
	}
	resize();
	return {
		changeItems, aim,
		destroy() {
			dead = true;
			if (raf) cancelAnimationFrame(raf);
			observer.disconnect();
			document.removeEventListener("visibilitychange", onVisibility);
			canvas.removeEventListener("webglcontextlost", onLost);
			canvas.removeEventListener("pointerdown", pointerDown);
			canvas.removeEventListener("pointerup", pointerUp);
			clearCases();
			resources.forEach(geo => geo.dispose());
			[wood, top, steel, gold, bgMat, shells.episode, shells.series, shells.film, shells.collection, shadowMaterial, spineMaterial].forEach(m => m.dispose());
			renderer.dispose();
		},
	};
}

export const StoreStage = ({ items, active, opened, flipped, onPick, onShift }: StageProps) => {
	const canvas = useRef<HTMLCanvasElement>(null);
	const engine = useRef<Engine | null>(null);
	const callbacks = useRef({ onPick, onShift });
	const [failed, setFailed] = useState(false);
	callbacks.current = { onPick, onShift };

	useEffect(() => {
		const el = canvas.current;
		if (!el) return;
		let cancelled = false;
		start(el, {
			pick: i => callbacks.current.onPick(i),
			shift: direction => callbacks.current.onShift(direction),
			fail: () => setFailed(true),
		}).then(stage => {
			if (cancelled) { stage.destroy(); return; }
			engine.current = stage;
			stage.changeItems(items);
			stage.aim(active, opened, flipped);
		}).catch(error => {
			if (!cancelled) {
				console.warn("3D shelf unavailable", error);
				setFailed(true);
			}
		});
		return () => {
			cancelled = true;
			engine.current?.destroy();
			engine.current = null;
		};
		// A single WebGL context; other effects update its contents and animation.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => { engine.current?.changeItems(items); }, [items]);
	useEffect(() => { engine.current?.aim(active, opened, flipped); }, [active, opened, flipped]);

	return <div className="store-three-frame">
		<canvas ref={canvas} className="store-three-canvas" role="img" tabIndex={0}
			aria-label="3D video shelf. Swipe to browse cases and tap one to inspect."
			style={{ touchAction: "pan-y" }} />
		{failed && <div className="store-webgl-fallback" role="status">
			<p>3D isn't available on this device. Your collection is still accessible.</p>
			<a href="/browse">Browse the collection</a>
		</div>}
	</div>;
};
