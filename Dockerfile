# ---- Build stage ----
FROM node:25-alpine AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
ARG PNPM_VERSION=10.33.0
RUN npm install -g pnpm@${PNPM_VERSION}

COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --link . .
RUN pnpm build

# ---- Runtime stage ----
FROM caddy:2-alpine AS runtime

COPY --link Caddyfile /etc/caddy/Caddyfile
COPY --link --from=build /app/dist /usr/share/caddy

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
