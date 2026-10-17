FROM --platform=$BUILDPLATFORM oven/bun AS builder
WORKDIR /app

# https://github.com/oven-sh/bun/issues/24538
# Remember to also remove `tsx` after this bug is fixed
RUN apt update && apt install -y nodejs && rm /usr/local/bun-node-fallback-bin/node

ENV NODE_ENV=production
COPY package.json bun.lock .
COPY patches patches
COPY scripts scripts
COPY public public
RUN bun install --production

COPY . .
RUN bun web

# TODO: replace this nginx with a SSR enabled server.
FROM nginx
EXPOSE 8901
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
  listen 8901;
  charset utf-8;

  # Large Three.js chunk is imported only when the shelf mounts.
  # Compress it over the wire, and cache content-hashed Expo assets.
  gzip on;
  gzip_vary on;
  gzip_comp_level 5;
  gzip_min_length 1024;
  gzip_types application/javascript text/javascript text/css application/json image/svg+xml;

  root /usr/share/nginx/html;
  index index.html;

  # jassub's wasm is multithreaded (SharedArrayBuffer) and needs the page to be
  # cross-origin isolated. `credentialless` keeps cross-origin video/subtitle
  # requests working without CORP headers on every remote asset.
  add_header Cross-Origin-Opener-Policy same-origin;
  add_header Cross-Origin-Embedder-Policy credentialless;

  location ^~ /_expo/static/ {
    expires 30d;
    try_files \$uri =404;
  }

  location / {
    try_files \$uri \$uri/ /index.html;
  }
}
EOF

COPY --from=builder /app/dist /usr/share/nginx/html
