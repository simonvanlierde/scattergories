#!/usr/bin/env bash

set -euo pipefail

readonly CADDY_IMAGE="caddy:2.11.2-alpine"

echo "Validating Docker Compose configuration..."
TUNNEL_TOKEN=dummy docker compose config >/dev/null
TUNNEL_TOKEN=dummy docker compose --profile tunnel config >/dev/null

echo "Validating Caddy configuration..."
docker run --rm \
  -v "$PWD/Caddyfile:/etc/caddy/Caddyfile:ro" \
  "$CADDY_IMAGE" \
  caddy validate --config /etc/caddy/Caddyfile

echo "Building runtime image..."
docker build --target runtime -t scattergories:infra-check .
