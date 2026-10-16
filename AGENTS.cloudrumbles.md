# kyoo on cloudrumbles-tools

This is the `cloudrumbles` branch of zoriya/Kyoo, cut from upstream `9e37786fdf` (2026-10-14), which is the commit the deployed edge images were built from. It runs at https://kyoo.cloudrumbles.tech for one user (shah).

## How a request flows

Cloudflare tunnel `cloudrumbles-web-ha` → Caddy (`/etc/caddy/conf.d/kyoo.caddy`, copy in `deploy/kyoo.caddy`) → `forward_auth` to the queue service's Google site-auth (`127.0.0.1:8787`, `/queue/api/site-auth/check`) → Caddy adds `Authorization: Bearer $KYOO_SHAH_TOKEN` → traefik on `127.0.0.1:8901` → kyoo services.

- Passing the Google gate is the only login. Kyoo itself never shows one. `KYOO_SHAH_TOKEN` is the session token of kyoo user `shah` (the admin). It lives in `/etc/caddy/kyoo.env` (root, 600) and is loaded by the drop-in `/etc/systemd/system/caddy.service.d/kyoo-token.conf`. Changing it needs `systemctl restart caddy`, not a reload.
- The front patch in `front/src/providers/account-provider.tsx` ("proxyMode") makes the web client fetch `/auth/users/me` when it has no stored account. Without it the UI shows Login and hides continue-watching even though the server already treats every request as shah.
- Only the PWA manifest and icons skip the gate, because iOS fetches them without cookies. `deploy/site.webmanifest` is served from `/etc/caddy/kyoo-sso/`.
- Port 8901 is bound to localhost only. Never publish it.

## Layout on the box

| path | what |
|---|---|
| `/srv/kyoo/src` | this repo |
| `/srv/kyoo/app` | live compose project: upstream `docker-compose.yml`, `docker-compose.override.yml` (copy in `deploy/`), `.env` (secrets, 600) |
| `/srv/kyoo` | separate 40GB Lightsail disk `kyoo-data`: docker data-root, containerd root, transcoder cache, swapfile |
| `/srv/media` | read-only mountpoint-s3 of `s3://cloudrumbles-kyoo-media/shows/` (`srv-media.service`, read-only key in `/etc/kyoo-s3/`) |

The box is shared with other production services (avvai, threadline, chirp, MCPs, queue). Keep the `mem_limit`s in the override. Build at low priority (`nice`). The root disk has about 13GB free, so don't put build artifacts or images there.

## Build and deploy

```sh
# frontend (the patched service)
cd /srv/kyoo/src && nice -n 15 sudo docker build -t kyoo_front:cloudrumbles front
cd /srv/kyoo/app && sudo docker compose up -d front
```

The other services (api, auth, scanner, transcoder) run upstream edge images pinned by digest in the override. To change one, build it from its folder here the same way, set `image:` in `/srv/kyoo/app/docker-compose.override.yml`, then `docker compose up -d <service>`. Keep `deploy/docker-compose.override.yml` in sync with the live file.

## Library

- Naming: `<Show>/Season N/<Show> SxxEyy - Title.mp4` with sidecar `.en.srt`. Extras go in `<Show>/Extras/<Book folder>/`.
- The S3 mount has no inotify. After uploading, trigger a scan: `PUT /scanner/scan` with the admin token (`sudo cat /srv/kyoo/app/sso/token`) against `http://127.0.0.1:8901`.
- The scanner never auto-detects extras (`extra_kind=None` in `scanner/scanner/identifiers/identify.py`). `deploy/add_extras.py` registers them through the api and re-seeds the series. Run it inside the scanner container with `PYTHONPATH=/app`, dry run first, then `--apply`.
- Danger: the scanner's startup scan runs with `remove_deleted=True`. A registered video whose path is hidden by `LIBRARY_IGNORE_PATTERN` gets deleted the next time the scanner restarts.
- The upload key (write-only to the bucket) is in `~/.aws/credentials`, profile `kyoo-upload`.

## Known issues worth improving

- iPhone Safari fullscreen uses native `video.webkitEnterFullscreen()` from the fullscreen button's user gesture (`front/src/ui/player/fullscreen.ts`); desktop continues to use document fullscreen. iPhone's native fullscreen displays Safari's own video UI rather than Kyoo's HTML overlays.
- Chromium on Linux can't decode the AC3 audio in these files. HLS mode (AAC transcode) works.
- The transcoder always downmixes to stereo (`-ac 2` in `transcoder/src/audiostream.go`), so 5.1 sources lose surround. A FLAC or multichannel Opus rendition would keep it.
