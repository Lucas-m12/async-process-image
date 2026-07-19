#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAYER_DIR="$ROOT_DIR/layers/sharp/nodejs"

echo "Cleaning the workspace"
rm -rf "$ROOT_DIR/layers/sharp"

echo "Creating sharp directory"
mkdir -p "$LAYER_DIR"

SHARP_VERSION=$(node -e "console.log(require('$ROOT_DIR/package.json').dependencies.sharp)")

echo "Installing sharp@$SHARP_VERSION for linux/arm64"
cd "$LAYER_DIR"

cat > package.json <<'EOF'
{
  "name": "sharp-layer",
  "version": "1.0.0",
  "private": true
}
EOF

export NODE_ENV=production

npm install \
  --os=linux \
  --cpu=arm64 \
  --libc=glibc \
  --include=optional \
  sharp@"$SHARP_VERSION"

rm -rf package.json package-lock.json
