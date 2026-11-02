#!/usr/bin/env bash
# Arma el sitio estático en site/ (lo usan Vercel y el workflow de GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."
(cd calculadora-ata && npm ci && npm test && npm run build)
rm -rf site
mkdir -p site/calculadora-ata site/alta-quirurgica site/arancel-redhsa
cp -r calculadora-ata/dist/. site/calculadora-ata/
cp alta-quirurgica/index.html site/alta-quirurgica/index.html
cp arancel-redhsa/index.html arancel-redhsa/manifest.webmanifest arancel-redhsa/sw.js arancel-redhsa/icon-*.png site/arancel-redhsa/
cp index.html site/index.html
