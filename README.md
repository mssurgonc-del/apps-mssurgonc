# apps-mssurgonc

Herramientas clínicas web de cirugía oncológica.

| App | Carpeta | Descripción |
|---|---|---|
| ThyroidScore Pro | `calculadora-ata/` | Estratificación de riesgo en cáncer diferenciado de tiroides: ATA 2025 (Fig. 2), AJCC 8.ª, respuesta dinámica (Tabla 9 / Fig. 6), cirugía (Tabla 5), TI-RADS (ACR 2017, JACR 2017;14:587–595) y Bethesda 2023 (vía PathologyOutlines) en pestañas propias. Exporta nota para expediente y fila TSV para Excel. |
| Alta Quirúrgica | `alta-quirurgica/` | Receta, indicaciones de alta, órdenes de laboratorio y citas, con plantillas por cirugía y una sola ficha de paciente para las cuatro. Datos cifrados con PIN y sincronizados entre teléfono y PC vía Google Drive. |
| Arancel REDHSA | `arancel-redhsa/` | Honorarios médico-quirúrgicos REDHSA 2014 (5,203 procedimientos, verificados contra el PDF): búsqueda, favoritos, procedimientos múltiples al 100/50/25 %, ayudantes y anestesiólogo, copago según póliza y presupuesto para enviar al paciente. Instalable y sin conexión. |

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
- Abre sin PIN. Todo lo guardado (historial, plantillas, perfil, firma) va en una bóveda AES-GCM cuya clave
  queda en el propio dispositivo; la protección real del equipo es su bloqueo de pantalla.
- Al abrirla por primera vez migra los datos de la versión sin cifrar y los borra tras verificar la bóveda.
  Quien había creado un PIN en la v19 lo escribe una última vez.
- Sincronización opcional con Google Drive (`drive.appdata`, carpeta oculta de la app): se sube cifrada con una
  clave de sincronización (PBKDF2-SHA256, 600 000 iteraciones) que se escribe una vez por dispositivo.
  Los historiales se combinan por id entre dispositivos y respetan los borrados.
- Requisito en Google Cloud Console (proyecto del ID de cliente OAuth): agregar
  `https://mssurgonc-del.github.io` como *Authorized JavaScript origin* y el permiso `.../auth/drive.appdata`.
- Prueba de extremo a extremo (Drive simulado): servir la carpeta con `python3 -m http.server 8765` dentro de
  `alta-quirurgica/` y correr `node tests/e2e.cjs`, `node tests/templates-preview.cjs` y
  `node tests/nuevo-paciente-layout.cjs`, `node tests/catalogo.cjs` (requieren `playwright-core` y Chromium).
- Catálogo de presentaciones comerciales (645 productos de 86 genéricos, solo nombres; sin precios ni
  referencias a farmacias en la app): aparece al buscar un medicamento que no está en la base; «Importar»
  llena el formulario de «Agregar medicamento» para revisarlo.
- «＋ Nuevo» guarda en el Historial lo que haya en cada pestaña (sin duplicar) y deja todo en blanco; se puede deshacer 8 s.

> Herramienta de apoyo a la decisión. No sustituye el juicio clínico ni la lectura de la guía original
> (Ringel MD, Sosa JA, et al. Thyroid 2025;35(8):841–985; corrigendum Thyroid 2025;35(11):1350).
