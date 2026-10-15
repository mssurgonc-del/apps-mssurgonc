# apps-mssurgonc

Herramientas clínicas web de cirugía oncológica.

| App | Carpeta | Descripción |
|---|---|---|
| ThyroidScore Pro | `calculadora-ata/` | Estratificación de riesgo en cáncer diferenciado de tiroides: ATA 2025 (Fig. 2), AJCC 8.ª, respuesta dinámica (Tabla 9 / Fig. 6), cirugía (Tabla 5), nódulo por ACR TI-RADS 2017 (JACR 2017;14:587–595) y Bethesda 2023 (vía PathologyOutlines). Exporta nota para expediente y fila TSV para Excel. |

## Desarrollo local

```bash
cd calculadora-ata
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Publicación

`.github/workflows/deploy-pages.yml` construye y publica en GitHub Pages en cada push a `main`
(requiere *Settings → Pages → Source: GitHub Actions*). URL esperada:
`https://mssurgonc-del.github.io/apps-mssurgonc/calculadora-ata/`

La app es una PWA: desde el móvil, «Añadir a pantalla de inicio» la instala y funciona sin conexión.
No envía datos a ningún servidor; todo se calcula en el navegador.

> Herramienta de apoyo a la decisión. No sustituye el juicio clínico ni la lectura de la guía original
> (Ringel MD, Sosa JA, et al. Thyroid 2025;35(8):841–985; corrigendum Thyroid 2025;35(11):1350).
