import asyncio
import os
import re
import sys
from hashlib import sha256

from scanner.client import KyooClient
from scanner.models.extra import Extra, ExtraKind
from scanner.models.videos import Guess, Video
from scanner.providers.composite import CompositeProvider
from scanner.providers.themoviedatabase import TheMovieDatabase
from scanner.providers.thetvdb import TVDB

APPLY = "--apply" in sys.argv
SHOWS = {
	"Avatar The Last Airbender": ("avatar-the-last-airbender", {"tvdb": "74852", "themoviedatabase": "246"}),
	"The Legend of Korra": ("the-legend-of-korra", {"tvdb": "251085", "themoviedatabase": "33880"}),
}
BTS = (
	"behind the scenes", "making of", "inside the", "creating the legend", "animatic",
	"pencil test", "essence of bending", "women of avatar", "featurette", "from real life",
	"untold story", "re-telling",
)


def kind_of(name: str) -> ExtraKind:
	n = name.lower()
	if "interview" in n or "comic-con" in n:
		return ExtraKind.INTERVIEW
	if any(k in n for k in BTS):
		return ExtraKind.BEHIND_THE_SCENE
	return ExtraKind.OTHER


def clean_name(file: str) -> str:
	n = os.path.splitext(file)[0]
	n = re.sub(r"\s*\((1080p|480p)\)$", "", n)
	n = re.sub(r"^Avatar \(TLoK\) - ", "", n)
	n = re.sub(r"\bSpirts\b", "Spirits", n)
	n = re.sub(r"\bSpirt\b", "Spirit", n)
	return n.replace("’", "'")


def slugify(s: str) -> str:
	return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


async def main():
	plan = {}
	for folder, (slug, _) in SHOWS.items():
		root = f"/video/{folder}/Extras"
		items = []
		for book in sorted(os.listdir(root)):
			m = re.match(r"Book (\d)", book)
			for f in sorted(os.listdir(f"{root}/{book}")):
				if not f.endswith(".mp4"):
					continue
				name = clean_name(f)
				items.append((f"{root}/{book}/{f}", name, kind_of(name), f"{slug}-extra-b{m.group(1)}-{slugify(name)}"))
		plan[folder] = items
		for path, name, kind, eslug in items:
			print(f"{kind.value:17} {eslug:75} {name}")
	all_slugs = [x[3] for v in plan.values() for x in v]
	assert len(all_slugs) == len(set(all_slugs)), "duplicate extra slugs"
	print(f"\n{len(all_slugs)} extras planned")

	async with KyooClient() as client, TVDB() as tvdb, TheMovieDatabase() as tmdb:
		provider = CompositeProvider(tvdb, tmdb)
		series = {}
		for folder, (slug, ext) in SHOWS.items():
			serie = await provider.get_serie(ext)
			assert serie is not None, f"provider returned nothing for {folder}"
			print(f"provider slug for {folder}: {serie.slug} (expected {slug}), {len(serie.entries)} entries")
			assert serie.slug == slug, "slug mismatch, refusing to seed"
			series[folder] = serie
		if not APPLY:
			print("dry run only")
			return

		for folder, items in plan.items():
			title = folder
			videos = [
				Video(
					path=path,
					rendering=sha256(path.encode()).hexdigest(),
					part=None,
					version=1,
					guess=Guess(
						title=title, kind="extra", extra_kind=kind, years=[], episodes=[],
						external_id={}, from_="manual-extras", raw={},
					),
					for_=[],
				)
				for path, _, kind, _ in items
			]
			created = await client.create_videos(videos)
			ids = {c.path: c.id for c in created}
			print(f"{folder}: registered {len(ids)} extra videos")
			serie = series[folder]
			serie.extras = [
				Extra(kind=kind, slug=eslug, name=name, runtime=None, thumbnail=None, video=ids[path])
				for path, name, kind, eslug in items
			]
			ret = await client.create_serie(serie)
			print(f"{folder}: seeded {ret.slug} with {len(serie.extras)} extras")


asyncio.run(main())
