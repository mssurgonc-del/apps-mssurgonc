#!/usr/bin/env bash
# Arma el sitio estático en site/ (lo usa Vercel, ver vercel.json).
set -euo pipefail
cd "$(dirname "$0")/.."
(cd calculadora-ata && npm ci && npm test && npm run build)
rm -rf site
mkdir -p site/calculadora-ata site/alta-quirurgica site/arancel-redhsa site/constancias
cp -r calculadora-ata/dist/. site/calculadora-ata/
cp alta-quirurgica/index.html alta-quirurgica/manifest.webmanifest alta-quirurgica/icon.svg alta-quirurgica/icon-*.png site/alta-quirurgica/
cp arancel-redhsa/index.html arancel-redhsa/manifest.webmanifest arancel-redhsa/sw.js arancel-redhsa/icon.svg arancel-redhsa/icon-*.png site/arancel-redhsa/
cp constancias/index.html constancias/manifest.webmanifest constancias/icon.svg constancias/icon-*.png site/constancias/
cp index.html manifest.webmanifest icon-inicio.svg icon-inicio-*.png site/
