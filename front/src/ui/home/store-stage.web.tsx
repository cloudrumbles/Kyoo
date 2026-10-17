import { useEffect, useRef, useState } from "react";
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

const CW = 1.44;
const CH = 2.16;
const CD = .16;
const STEP = 1.65;

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
	canvas.width = 320;
	canvas.height = 480;
	const g = canvas.getContext("2d", { alpha: false })!;
	const band = item.kind === "episode" ? "#967043" : item.kind === "film" ? "#546441" : "#2c659d";
	const paint = (image?: HTMLImageElement) => {
		g.fillStyle = "#071523";
		g.fillRect(0, 0, 320, 480);
		g.fillStyle = band;
		g.fillRect(0, 0, 320, 39);
		g.fillStyle = "#efe2cb";
		g.font = "700 17px Arial";
		g.fillText("KYOO", 16, 26);
		g.font = "12px Arial";
		g.fillText(item.kind === "episode" ? "EPISODE" : item.kind === "collection" ? "BOX SET" : item.kind === "film" ? "FILM" : "SERIES", 244, 25);
		g.fillStyle = "#24394d";
		g.fillRect(10, 47, 300, 329);
		if (image) {
			const ratio = 300 / 329;
			const srcRatio = image.naturalWidth / image.naturalHeight;
			let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
			if (srcRatio > ratio) { sw = image.naturalHeight * ratio; sx = (image.naturalWidth - sw) / 2; }
			else { sh = image.naturalWidth / ratio; sy = (image.naturalHeight - sh) / 2; }
			g.drawImage(image, sx, sy, sw, sh, 10, 47, 300, 329);
		} else {
			g.strokeStyle = "#48617a";
			g.lineWidth = 2;
			for (let j = 0; j < 4; j++) g.strokeRect(22 + j * 11, 66 + j * 11, 275 - j * 22, 278 - j * 22);
		}
		const glow = g.createLinearGradient(0, 263, 0, 376);
		glow.addColorStop(0, "rgba(10,22,36,0)");
		glow.addColorStop(1, "rgba(10,22,36,.54)");
		g.fillStyle = glow;
		g.fillRect(10, 263, 300, 113);
		g.fillStyle = "#eee6d6";
		g.fillRect(0, 379, 320, 101);
		g.fillStyle = "#17263a";
		g.font = '700 28px "Barlow Condensed", Arial';
		const end = wrap(g, item.title, 17, 410, 288, 27, 2);
		g.fillStyle = "#606b75";
		g.font = "12px Arial";
		wrap(g, item.subtitle || "From your library", 17, Math.min(456, end + 4), 288, 16, 1);
		if ((item.progress ?? 0) > 0) {
			g.fillStyle = "#bbb9b3";
			g.fillRect(0, 474, 320, 6);
			g.fillStyle = "#d9ad62";
			g.fillRect(0, 474, 320 * Math.min(item.progress!, 100) / 100, 6);
		}
		g.fillStyle = "rgba(255,255,255,.16)";
		g.fillRect(1, 0, 3, 480);
	};
	paint();
	return { canvas, paint };
}

function paintBack(item: RentalCase) {
	const canvas = document.createElement("canvas");
	canvas.width = 320;
	canvas.height = 480;
	const g = canvas.getContext("2d", { alpha: false })!;
	g.fillStyle = "#183555";
	g.fillRect(0, 0, 320, 480);
	g.fillStyle = "#29639a";
	g.fillRect(0, 0, 320, 36);
	g.fillStyle = "#d9ad62";
	g.fillRect(23, 65, 273, 2);
	g.fillStyle = "#f5eedd";
	g.font = '700 35px "Barlow Condensed", Arial';
	const y = wrap(g, item.title, 22, 108, 270, 36, 3);
	g.font = "700 12px Arial";
	g.fillStyle = "#d9ad62";
	g.fillText(item.kind.toUpperCase(), 22, Math.min(y + 17, 215));
	g.strokeStyle = "#6886a0";
	g.strokeRect(22, 232, 275, 188);
	g.fillStyle = "#f5eedd";
	g.font = "14px Arial";
	wrap(g, item.description || item.subtitle || "Visit this title for details.", 34, 259, 247, 24, 6);
	g.fillStyle = "#d9ad62";
	g.fillRect(22, 451, 86, 5);
	g.font = "700 12px Arial";
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
	scene.background = new THREE.Color("#101e2d");
	const camera = new THREE.PerspectiveCamera(42, 1, .1, 55);
	camera.position.set(0, .78, 5.0);
	camera.lookAt(0, .2, 0);
	scene.add(new THREE.HemisphereLight(0xfff2d8, 0x253e58, 1.8));
	const light = new THREE.DirectionalLight(0xffd6a5, 1.5);
	light.position.set(-3.5, 4, 4);
	scene.add(light);
	const fill = new THREE.DirectionalLight(0xbed5ed, .9);
	fill.position.set(3, 2, -1);
	scene.add(fill);

	const wood = new THREE.MeshStandardMaterial({ color: "#382d29", roughness: .95 });
	const top = new THREE.MeshStandardMaterial({ color: "#584539", roughness: .9 });
	const steel = new THREE.MeshStandardMaterial({ color: "#1c3a59", roughness: .65, metalness: .18 });
	const gold = new THREE.MeshBasicMaterial({ color: "#b69260" });
	const shells = {
		episode: new THREE.MeshStandardMaterial({ color: "#8a6547", roughness: .31 }),
		series: new THREE.MeshStandardMaterial({ color: "#285e95", roughness: .3, metalness: .12 }),
		film: new THREE.MeshStandardMaterial({ color: "#536744", roughness: .32 }),
		collection: new THREE.MeshStandardMaterial({ color: "#285e95", roughness: .3, metalness: .12 }),
	};
	const shadowMaterial = new THREE.MeshBasicMaterial({ color: "#0a1220", transparent: true, opacity: .43, depthWrite: false });
	const spineMaterial = new THREE.MeshStandardMaterial({ color: "#6c94b8", metalness: .08, roughness: .48 });
	const resources: Array<import("three").BufferGeometry> = [];
	const box = (w: number, h: number, d: number, m: import("three").Material, x: number, y: number, z: number) => {
		const geo = new THREE.BoxGeometry(w, h, d);
		resources.push(geo);
		const mesh = new THREE.Mesh(geo, m);
		mesh.position.set(x, y, z);
		scene.add(mesh);
	};
	box(32, .17, 1.8, top, 0, -1.22, -.05);
	box(32, .24, .14, wood, 0, -1.4, .8);
	box(32, .04, .06, gold, 0, -1.29, .89);
	box(32, .22, 1.5, wood, 0, -2.52, -.05);
	box(32, .045, .08, gold, 0, -2.37, .8);
	box(32, .12, .4, steel, 0, 2.15, -.5);
	box(32, .025, .04, gold, 0, 2.06, -.23);
	for (const x of [-9, -6, -3, 3, 6, 9]) box(.065, 7, .12, steel, x, -.2, -1.47);
	const bgGeo = new THREE.PlaneGeometry(45, 18);
	resources.push(bgGeo);
	const bgMat = new THREE.MeshBasicMaterial({ color: "#152a40" });
	const wall = new THREE.Mesh(bgGeo, bgMat);
	wall.position.z = -2.1;
	scene.add(wall);
	// Shared case geometry and case-shell materials keep GPU submissions small.
	const caseGeo = new THREE.BoxGeometry(CW, CH, CD);
	const faceGeo = new THREE.PlaneGeometry(CW - .07, CH - .05);
	const sideGeo = new THREE.PlaneGeometry(CD, CH - .06);
	const shadowGeo = new THREE.PlaneGeometry(CW + .12, CH + .1);
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
		const speed = reduce ? 1 : .24;
		cards.forEach((c, i) => {
			const diff = i - selected;
			const focus = opened && diff === 0;
			const tx = diff * (opened ? STEP * 1.2 : STEP);
			const ty = focus ? .38 : 0;
			const tz = focus ? .68 : -Math.min(Math.abs(diff) * .16, .6);
			const tr = focus ? (flipped ? Math.PI : .13) : diff === 0 ? .13 : Math.max(-.37, Math.min(.37, diff * -.19));
			const ts = focus ? 1.25 : 1;
			const d = Math.abs(tx - c.group.position.x) + Math.abs(ty - c.group.position.y) +
				Math.abs(tz - c.group.position.z) + Math.abs(tr - c.group.rotation.y) + Math.abs(ts - c.group.scale.x);
			if (d > .003) moving = true;
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
		const dpr = Math.min(window.devicePixelRatio || 1, w < 600 ? 1.25 : 1.5);
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
		if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.4) { handlers.shift(dx < 0 ? 1 : -1); return; }
		if (Math.abs(dy) > 24) return;
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
			if (!art || card.artworkAttempted || Math.abs(i - selected) > 3) return;
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
		currentItems = items.slice(0, 12);
		selected = Math.min(selected, Math.max(currentItems.length - 1, 0));
		currentItems.forEach((item, i) => {
			const group = new THREE.Group();
			group.userData.caseIndex = i;
			const body = new THREE.Mesh(caseGeo, shells[item.kind]);
			group.add(body);
			const { canvas: sleeve, paint } = paintSleeve(item);
			const texture = new THREE.CanvasTexture(sleeve);
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.anisotropy = 2;
			const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
			const front = new THREE.Mesh(faceGeo, material);
			front.position.z = CD / 2 + .004;
			group.add(front);
			const backMat = new THREE.MeshBasicMaterial({ color: "#173957", side: THREE.DoubleSide });
			const back = new THREE.Mesh(faceGeo, backMat);
			back.rotation.y = Math.PI;
			back.position.z = -CD / 2 - .005;
			group.add(back);
			const side = new THREE.Mesh(sideGeo, spineMaterial);
			side.position.x = -CW / 2 - .005;
			side.rotation.y = -Math.PI / 2;
			group.add(side);
			const shadow = new THREE.Mesh(shadowGeo, shadowMaterial);
			shadow.position.set(.10, -.12, -.23);
			group.add(shadow);
			group.position.set((i - selected) * STEP, 0, -.23);
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
			card.back.color.set("#ffffff");
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
