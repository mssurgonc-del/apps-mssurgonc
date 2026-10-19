# apps-mssurgonc

Herramientas clínicas web de cirugía oncológica.

| App | Carpeta | Descripción |
|---|---|---|
| ThyroidScore Pro | `calculadora-ata/` | Estratificación de riesgo en cáncer diferenciado de tiroides: ATA 2025 (Fig. 2), AJCC 8.ª, respuesta dinámica (Tabla 9 / Fig. 6), cirugía (Tabla 5), TI-RADS (ACR 2017, JACR 2017;14:587–595) y Bethesda 2023 (vía PathologyOutlines) en pestañas propias. Exporta nota para expediente y fila TSV para Excel. |
| Alta Quirúrgica | `alta-quirurgica/` | Receta, indicaciones de alta, órdenes de laboratorio y citas, con plantillas por cirugía y una sola ficha de paciente para las cuatro. Datos cifrados con PIN y sincronizados entre teléfono y PC vía Google Drive. |

## Desarrollo local

```bash
cd calculadora-ata
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm test         # 65 casos de referencia del motor clínico (src/logic.test.js)
```

La lógica clínica vive en `src/logic.js`, separada de la interfaz. Las pruebas corren en cada push
(`.github/workflows/tests.yml`) y el despliegue a Pages se detiene si alguna falla.

## Publicación

`.github/workflows/deploy-pages.yml` construye y publica en GitHub Pages en cada push a `main`
(requiere *Settings → Pages → Source: GitHub Actions*). URL esperada:
`https://mssurgonc-del.github.io/apps-mssurgonc/calculadora-ata/`

La app es una PWA: desde el móvil, «Añadir a pantalla de inicio» la instala y funciona sin conexión.
No envía datos a ningún servidor; todo se calcula en el navegador.

## Alta Quirúrgica: cifrado y sincronización

- Archivo único: `alta-quirurgica/index.html` (HTML + JS sin compilación).
- Todo lo guardado (historial, plantillas, perfil, firma) va en una bóveda cifrada con AES-GCM; la clave
  se deriva del PIN (PBKDF2-SHA256, 600 000 iteraciones). Sin el PIN los datos no se pueden recuperar.
- Al abrirla por primera vez migra los datos de la versión anterior (sin cifrar) y los borra tras verificar la bóveda.
- Sincronización opcional con Google Drive (`drive.appdata`, carpeta oculta de la app): solo se sube el archivo cifrado.
  Los historiales se combinan por id entre dispositivos y respetan los borrados.
- Requisito en Google Cloud Console (proyecto del ID de cliente OAuth): agregar
  `https://mssurgonc-del.github.io` como *Authorized JavaScript origin* y el permiso `.../auth/drive.appdata`.
- Prueba de extremo a extremo (Drive simulado): servir la carpeta con `python3 -m http.server 8765` dentro de
  `alta-quirurgica/` y correr `node tests/e2e.cjs` (requiere `playwright-core` y Chromium).

> Herramienta de apoyo a la decisión. No sustituye el juicio clínico ni la lectura de la guía original
> (Ringel MD, Sosa JA, et al. Thyroid 2025;35(8):841–985; corrigendum Thyroid 2025;35(11):1350).
