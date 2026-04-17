# Default task lists available recipes
default:
    @just --list

#----------------------
# Frontend
#----------------------

# Install frontend dependencies (frozen lockfile)
install:
    pnpm install --frozen-lockfile

# Run the app verification pipeline (typecheck + spellcheck + lint + unit tests + build)
verify:
    pnpm run verify

# Run app, tools, and infrastructure validation
verify-full:
    pnpm run verify
    cd tools && just --justfile justfile check
    pnpm run infra:check

# Audit dependencies for known security and adverse-status issues
audit:
    pnpm audit

# Update root dependencies and refresh the lockfile
update:
    pnpm update --latest

# Run all dependency security audits
audit-all:
    just audit
    just tools-audit

# Run the full security audit suite
security:
    just audit-all

# Validate Docker/Compose/Caddy infrastructure locally
infra-check:
    pnpm run infra:check

# Start the dev server
dev:
    pnpm dev

# Build for production
build:
    pnpm build

# Run spellcheck across the full repo
spellcheck:
    pnpm run spellcheck

# Run spellcheck only on selected files
spellcheck-changed *files:
    pnpm run spellcheck-changed -- {{ files }}

# Typecheck, spellcheck, and lint
check:
    pnpm run check

# Fix lint issues and format source files
format:
    pnpm run lint:fix

# Run unit tests
test:
    pnpm test

# Run unit tests with coverage
test-coverage:
    pnpm run test:coverage

# Run end-to-end tests against the built app
test-e2e:
    pnpm run test:e2e

#----------------------
# Tools sub-repo
#----------------------
# Centralize tools recipes in `tools/justfile`. Some `just` versions
# have trouble with `include` paths containing slashes, so use safe
# wrappers that invoke the tools file explicitly with `-f`.

tools-list:
    @just -f tools/justfile --list

tools-install:
    @just -f tools/justfile install

tools-check:
    @just -f tools/justfile check

tools-doctor:
    @just -f tools/justfile doctor

tools-audit:
    @just -f tools/justfile audit

tools-update:
    @just -f tools/justfile update

tools-generate-weights:
    @just -f tools/justfile weights-sample-write

tools-weights-locales:
    @just -f tools/justfile weights-locales

tools-translate-categories *locales:
    @just -f tools/justfile translate-categories {{ locales }}

#----------------------
# Docker deployment
#----------------------

# Start the docker deployment in the background (rebuilds if needed)
up:
    docker compose up -d --build

# Start the docker deployment with the cloudflare tunnel profile
up-tunnel:
    docker compose --profile tunnel up -d --build

# Stop the docker deployment (and the tunnel, if running)
down:
    docker compose --profile tunnel down

# Tail the docker deployment logs
logs:
    docker compose logs -f
