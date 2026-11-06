#!/usr/bin/env python3
"""Copia shared/ms-ui.css dentro de cada app, entre /* MS-UI:INICIO */ y /* MS-UI:FIN */.

Uso: python3 scripts/sync-ui.py   (desde cualquier carpeta)
Cada app es un solo archivo HTML que funciona sin conexión, por eso el estilo común va copiado
dentro de ella en lugar de enlazado. Las apps que todavía no tienen los marcadores se saltan.
"""
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CSS = (RAIZ / 'shared' / 'ms-ui.css').read_text(encoding='utf-8').strip()
INI, FIN = '/* MS-UI:INICIO */', '/* MS-UI:FIN */'

for app in ['constancias/index.html', 'arancel-redhsa/index.html', 'alta-quirurgica/index.html']:
    ruta = RAIZ / app
    html = ruta.read_text(encoding='utf-8')
    if INI not in html:
        print('sin marcadores, se salta:', app)
        continue
    a, b = html.index(INI) + len(INI), html.index(FIN)
    nuevo = html[:a] + '\n' + CSS + '\n' + html[b:]
    if nuevo != html:
        ruta.write_text(nuevo, encoding='utf-8')
        print('actualizado:', app)
    else:
        print('sin cambios:', app)
