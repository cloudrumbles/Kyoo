import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EntrySelect, type EntrySelectEntry } from "~/components/entries/select";
import { entryDisplayNumber } from "~/components/entries";
import { Collection, Entry, Movie, Serie } from "~/models";
import type { KImage } from "~/models";
import { useAccount, useToken } from "~/providers/account-context";
import { type QueryIdentifier, useInfiniteFetch } from "~/query";
import { StoreStage, type RentalCase } from "./store-stage.web";

type ShelfName = "continue" | "boxsets" | "arrivals";
type Shelf = {
	id: ShelfName;
	number: string;
	title: string;
	caption: string;
	cases: RentalCase[];
};

function initialsFor(item: Entry): string {
	if (item.kind === "episode") return entryDisplayNumber(item);
	return "";
}

export const HomePage = () => {
	const router = useRouter();
	const account = useAccount();
	const { apiUrl } = useToken();
	const continuing = useInfiniteFetch<Entry>({
		parser: Entry, infinite: true,
		path: ["api", "profiles", "me", "nextup"],
		params: { limit: 8, with: ["nextEntry"] },
		enabled: !!account,
	});
	const series = useInfiniteFetch<Serie>({
		parser: Serie, infinite: true,
		path: ["api", "series"],
		params: { limit: 12, sort: "name", with: ["firstEntry", "nextEntry"] },
	});
	const films = useInfiniteFetch<Movie>({
		parser: Movie, infinite: true,
		path: ["api", "movies"],
		params: { limit: 12, sort: "name" },
	});
	const collections = useInfiniteFetch<Collection>({
		parser: Collection, infinite: true,
		path: ["api", "collections"],
		params: { limit: 12, sort: "name" },
	});
	const newest = useInfiniteFetch<Entry>({
		parser: Entry, infinite: true,
		path: ["api", "news"],
		params: { limit: 12 },
	});

	const cover = useCallback((img: KImage | null | undefined) => {
		if (!img) return null;
		if (img.medium.startsWith("http")) return img.medium;
		return apiUrl + img.medium;
	}, [apiUrl]);

	const shelfData = useMemo<Shelf[]>(() => [
		{
			id: "continue",
			number: "01",
			title: "Continue watching",
			caption: "Resume an episode.",
			cases: (continuing.items ?? []).slice(0, 10).map(item => {
				const primary = item.show?.name ?? item.name ?? "Untitled";
				const episode = initialsFor(item);
				return {
					id: item.id,
					title: primary,
					subtitle: (episode ? episode + " / " : "") + (item.name ?? "Continue watching"),
					description: item.description || (item.show?.description ?? ""),
					artwork: cover(item.thumbnail ?? item.show?.poster ?? item.show?.thumbnail),
					kind: "episode",
					href: item.show?.href ?? item.href,
					playHref: item.href,
					progress: item.progress.percent,
				};
			}),
		},
		{
			id: "boxsets",
			number: "02",
			title: "The box sets",
			caption: "Series, films and collections.",
			cases: [
				...(series.items ?? []).map(item => ({
					id: item.id, title: item.name,
					subtitle: [item.startAir?.getFullYear(), item.endAir?.getFullYear()].filter(Boolean).join(" – ") || "Series",
					description: item.description ?? "",
					artwork: cover(item.poster ?? item.thumbnail),
					kind: "series" as const,
					href: item.href,
					playHref: item.playHref,
					progress: undefined,
				})),
				...(films.items ?? []).map(item => ({
					id: item.id, title: item.name,
					subtitle: item.airDate ? String(item.airDate.getFullYear()) : "Film",
					description: item.description ?? "",
					artwork: cover(item.poster ?? item.thumbnail),
					kind: "film" as const,
					href: item.href,
					playHref: item.isAvailable ? item.playHref : null,
					progress: item.watchStatus?.percent ?? undefined,
				})),
				...(collections.items ?? []).map(item => ({
					id: item.id, title: item.name,
					subtitle: "Collection",
					description: item.description ?? "",
					artwork: cover(item.poster ?? item.thumbnail),
					kind: "collection" as const,
					href: item.href,
					playHref: null,
					progress: undefined,
				})),
			].slice(0, 12),
		},
		{
			id: "arrivals",
			number: "03",
			title: "Fresh on the shelf",
			caption: "Recently added episodes.",
			cases: (newest.items ?? []).slice(0, 12).map(item => ({
				id: item.id,
				title: item.show?.name ?? item.name ?? "Untitled",
				subtitle: (initialsFor(item) ? initialsFor(item) + " / " : "") + (item.name ?? "Episode"),
				description: item.description ?? (item.show?.description ?? ""),
				artwork: cover(item.thumbnail ?? item.show?.thumbnail ?? item.show?.poster),
				kind: "episode" as const,
				href: item.show?.href ?? item.href,
				playHref: item.href,
				progress: item.progress.percent,
			})),
		},
	], [continuing.items, series.items, films.items, collections.items, newest.items, cover]);

	const [shelfId, setShelfId] = useState<ShelfName>("boxsets");
	const [active, setActive] = useState(0);
	const [opened, setOpened] = useState(false);
	const [flipped, setFlipped] = useState(false);
	const [videoSelection, setVideoSelection] = useState<EntrySelectEntry | null>(null);
	const shelf = shelfData.find(s => s.id === shelfId)!;
	const currentIndex = Math.min(active, Math.max(shelf.cases.length - 1, 0));
	const currentCase = shelf.cases[currentIndex];

	const visitShelf = useCallback((next: ShelfName) => {
		setShelfId(next);
		setActive(0);
		setOpened(false);
		setFlipped(false);
	}, []);
	const shift = useCallback((direction: -1 | 1) => {
		setActive(i => Math.max(0, Math.min(shelf.cases.length - 1, i + direction)));
		setOpened(false);
		setFlipped(false);
	}, [shelf.cases.length]);
	const pick = useCallback((index: number) => {
		setActive(index);
		setOpened(true);
		setFlipped(false);
	}, []);
	const putBack = useCallback(() => {
		setOpened(false);
		setFlipped(false);
	}, []);

	const openPlayback = useCallback(() => {
		if (!currentCase) return;
		if (!currentCase.playHref) {
			if (currentCase.href) router.push(currentCase.href);
			return;
		}
		const entry = shelfId === "continue"
			? (continuing.items ?? [])[currentIndex]
			: shelfId === "arrivals" ? (newest.items ?? [])[currentIndex] : undefined;
		if (entry && entry.videos.length > 1) {
			setVideoSelection({ displayNumber: initialsFor(entry), name: entry.name, videos: entry.videos });
		} else router.push(currentCase.playHref);
	}, [currentCase, shelfId, continuing.items, newest.items, currentIndex, router]);

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
			if (event.key === "ArrowRight") { event.preventDefault(); shift(1); }
			if (event.key === "ArrowLeft") { event.preventDefault(); shift(-1); }
			if (event.key === "Escape") putBack();
			if (event.key === "Enter" && document.activeElement?.tagName === "CANVAS") pick(currentIndex);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [shift, pick, putBack, currentIndex]);

	const loading = continuing.isFetching || series.isFetching || collections.isFetching || newest.isFetching || films.isFetching;

	return (
		<div className="store-page">
			<main className="store-shell">
				<div className="store-doorplate">
					<span className="store-doorplate-logo"><span className="store-brass-dot" /> KYOO VIDEO LIBRARY</span>
					<span className="store-doorplate-side">Personal collection</span>
				</div>
				<div className="store-intro">
					<h1>Pick something off the shelf.</h1>
					<p>Slide through the cases. Tap one to take a closer look.</p>
				</div>
				<section className="store-alcove" aria-label="Interactive video rental shelf">
					<div className={"store-alcove-sign" + (opened ? " store-alcove-inspecting" : "")}>
						<span className="store-aisle-marker">Shelf {shelf.number} / 03</span>
						<h2>{shelf.title}</h2>
						<small>{shelf.caption}</small>
					</div>
					<StoreStage items={shelf.cases} active={currentIndex} opened={opened} flipped={flipped} onPick={pick} onShift={shift} />
					<div className="store-case-strip">
						<button type="button" onClick={() => shift(-1)} disabled={currentIndex === 0} aria-label="Previous case" className="store-arrow">‹</button>
						<div className="store-case-caption" aria-live="polite">
							<span className="store-case-count">{shelf.cases.length ? String(currentIndex + 1).padStart(2, "0") + " / " + String(shelf.cases.length).padStart(2, "0") : "— / —"}</span>
							<strong>{currentCase?.title ?? (loading ? "Finding your titles…" : "The shelf is empty")}</strong>
							<span>{currentCase?.subtitle ?? "Visit another shelf."}</span>
						</div>
						<button type="button" onClick={() => shift(1)} disabled={currentIndex >= shelf.cases.length - 1} aria-label="Next case" className="store-arrow">›</button>
					</div>
				</section>
				<div className="store-inspector" aria-live="polite">
					<div className="store-inspector-info">
						<span className="store-inspector-label">{opened ? flipped ? "Back of the case" : "Case in hand" : "Looking at the shelf"}</span>
						<p>{opened && flipped ? (currentCase?.description || currentCase?.subtitle || "No overview available.") : opened ? "Turn it over to read more, or put it on." : "Tap a case to pick it up. Swipe to move along the shelf."}</p>
					</div>
					<div className="store-actions">
						{opened ? (
							<>
								<button type="button" className="store-control" onClick={() => setFlipped(!flipped)}>{flipped ? "Front cover" : "Turn over"}</button>
								<button type="button" className="store-control" onClick={putBack}>Put back</button>
							</>
						) : (
							<button type="button" className="store-control" onClick={() => currentCase && pick(currentIndex)} disabled={!currentCase}>Pick up case</button>
						)}
						{currentCase?.href && currentCase.playHref && <button type="button" className="store-control" onClick={() => router.push(currentCase.href!)}>Details</button>}
						<button type="button" className="store-control store-play" disabled={!currentCase?.playHref && !currentCase?.href} onClick={openPlayback}>
							<span aria-hidden="true">{currentCase?.playHref ? "▶" : "◉"}</span> {currentCase?.playHref ? "Play" : "Open case"}
						</button>
					</div>
				</div>
				<nav className="store-departments" aria-label="Select a video shelf">
					{shelfData.map(s => (
						<button key={s.id} type="button" aria-current={shelfId === s.id ? "page" : undefined}
							className={"store-department " + (shelfId === s.id ? "is-active" : "")}
							onClick={() => visitShelf(s.id)}>
							<span className="store-department-number">{s.number}</span>
							<span className="store-department-title">{s.title}</span>
							<span className="store-department-count">{s.cases.length}</span>
						</button>
					))}
				</nav>
				<div className="store-footer">
					<span>← → to browse · tap to inspect · turn a case over</span>
					<a href="/browse">Browse the full catalogue ↗</a>
				</div>
			</main>
			<EntrySelect entry={videoSelection} onClose={() => setVideoSelection(null)} />
		</div>
	);
};

// Exported for compatibility with the native counterpart, which uses refreshable queries.
HomePage.queries = (): QueryIdentifier<unknown>[] => [];
