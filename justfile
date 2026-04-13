# Default task lists available recipes
default:
    @just --list

#----------------------
# Development
#----------------------

# Install dependencies (frozen lockfile)
install:
    pnpm install --frozen-lockfile

# Run the full local CI pipeline (typecheck + lint + spellcheck + unit tests + build)
ci:
    pnpm ci

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
