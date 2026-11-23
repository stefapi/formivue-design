#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# launch-demos.sh — démarre les démos formivue (fork v3)
#
# Usage :
#   ./scripts/launch-demos.sh              # playground Vite (défaut)
#   ./scripts/launch-demos.sh playground   # idem, explicite
#   ./scripts/launch-demos.sh docs         # site vitepress (@formivue/vue)
#   ./scripts/launch-demos.sh all          # les deux (ports distincts)
#
# Options d'environnement :
#   FORMIVUE_DEMO_PORT   port du playground (défaut 5174)
#   FORMIVUE_DOCS_PORT   port vitepress    (défaut 5175)
#   FORMIVUE_NO_BUILD=1  sauter le build des packages (déjà buildés)
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-playground}"
PORT_DEMO="${FORMIVUE_DEMO_PORT:-5174}"
PORT_DOCS="${FORMIVUE_DOCS_PORT:-5175}"

cd "$ROOT"

log() { printf '\033[1;36m[démos]\033[0m %s\n' "$*"; }

need_build() {
  for p in manager/{core,shared,reactive,validator,json-schema,path,grid,reactive-vue,vue} \
    design/{formivue-vue,vue-ui,vue,core,shared}; do
    if [ ! -e "$p/dist/index.mjs" ]; then
      return 0
    fi
  done
  return 1
}

build_if_needed() {
  if [ "${FORMIVUE_NO_BUILD:-0}" = "1" ]; then
    log "build des packages sauté (FORMIVUE_NO_BUILD=1)"
    return
  fi
  if need_build; then
    log "build des packages manquants…"
    pnpm -r build >/dev/null
  else
    log "packages déjà buildés (dist/ à jour) — passez FORMIVUE_NO_BUILD=1 pour forcer"
  fi
}

case "$TARGET" in
  playground | vite)
    build_if_needed
    log "playground Vite → http://localhost:$PORT_DEMO"
    log "  (Vue 3.5, TS strict, Tailwind 4, reka-ui — examples/vite-usage)"
    cd examples/vite-usage
    exec ./node_modules/.bin/vite --port "$PORT_DEMO" --host
    ;;

  docs | site)
    log "site vitepress → http://localhost:$PORT_DOCS"
    log "  (guide EN/FR + démos intégrées — manager/vue/docs)"
    cd manager/vue
    exec ./node_modules/.bin/vitepress dev docs --port "$PORT_DOCS" --host
    ;;

  all | both)
    build_if_needed
    log "les deux démos démarrent : playground :$PORT_DEMO, docs :$PORT_DOCS"
    log "Ctrl+C arrête tout"
    trap 'kill 0' EXIT INT TERM
    (cd examples/vite-usage && ./node_modules/.bin/vite --port "$PORT_DEMO" --host) &
    (cd manager/vue && ./node_modules/.bin/vitepress dev docs --port "$PORT_DOCS" --host) &
    wait
    ;;

  *)
    cat <<'EOF'
Usage: ./scripts/launch-demos.sh [cible]

Cibles :
  playground  Playground Vite (examples/vite-usage) — défaut
  docs        Site vitepress (manager/vue/docs)
  all         Les deux

Environnement :
  FORMIVUE_DEMO_PORT   port du playground (défaut 5174)
  FORMIVUE_DOCS_PORT   port vitepress    (défaut 5175)
  FORMIVUE_NO_BUILD=1  sauter le build des packages
EOF
    exit 1
    ;;
esac
