#!/usr/bin/env bash
# Arma el sitio estático en site/ (lo usa Vercel, ver vercel.json).
set -euo pipefail
cd "$(dirname "$0")/.."
(cd calculadora-ata && npm ci && npm test && npm run build)
rm -rf site
mkdir -p site/calculadora-ata site/alta-quirurgica site/arancel-redhsa site/constancias
cp -r calculadora-ata/dist/. site/calculadora-ata/
cp alta-quirurgica/index.html site/alta-quirurgica/index.html
cp arancel-redhsa/index.html arancel-redhsa/manifest.webmanifest arancel-redhsa/sw.js arancel-redhsa/icon-*.png site/arancel-redhsa/
cp constancias/index.html site/constancias/index.html
cp index.html site/index.html
