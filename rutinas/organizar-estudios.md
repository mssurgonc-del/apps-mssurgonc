# Organización automática de estudios

La organización de los archivos que llegan a Drive la hace una tarea
programada que ya existía en la cuenta del Dr. Salinas:

- **Nombre:** "Ordenar archivos de pacientes en Drive" (`trig_01HRxHiGVG44fV3cSQDj6Qdd`)
- **Horario:** todos los días a las 6:56, 11:56 y 18:56, hora de Honduras
  (`CRON_TZ=America/Tegucigalpa 56 6,11,18 * * *`). Antes corría a la 1:00
  y a las 13:00, porque su horario estaba en UTC.
- **Lee:** la bandeja "13) Archivos sincronizados desde el Telefono"
  (`1_27Hmo5iySiEUz-UlhFIBoyQ5FysmG-Y`) y su subcarpeta "Private"
  (`14jIlFJNmeUgBfg0Z_LSbuK_GWbVIl55G`), donde caen los documentos de
  WhatsApp. Procesa primero lo más reciente. No toca "Sent", "Videos" ni
  "fotos".
- **Archiva en:** "14) Examenes estudios y biopsias de pacientes"
  (`1xJHfrtHYutOEf7JM9o7L0tpxvoA_RgWA`), una carpeta por paciente. Lo dudoso
  va a su carpeta "Por organizar".

La corrida de las 18:56 queda antes de la tarea "Debriefing de la consulta
de mañana" (20:00), para que el debriefing vea lo archivado ese día.

El formulario de carga (`apps-script/formulario-pacientes`) deja en esa
misma bandeja lo que no puede emparejar por nombre.

Las instrucciones completas de la tarea viven en la propia tarea, no en
este repositorio.

## Nombres de estudios de imagen (desde el 22 de octubre de 2026)

El detalle de "Imagen" empieza siempre por la modalidad abreviada, de una
lista fija: `US`, `TC`, `RM`, `PET-CT`, `Rx`, `Mamografía`, `Gammagrafía`,
`Endoscopía`, `Biopsia guiada por US`, `Biopsia guiada por TC`. Luego la
región y, si se sabe, el centro entre paréntesis. Sin hallazgos en el nombre.

- `2026-10-15 Imagen — TC tórax-abdomen-pelvis (Oncorad).pdf`
- `2026-10-16 Imagen — enlace Rx tórax PA (Oncorad).txt`

## Informes de Oncorad (prueba del 23 de octubre de 2026)

El enlace de Oncorad abre un visor web (pacs.evacenter.com) que no deja
copiar texto. `oncorad/bajar_informe.js` abre ese visor en Chromium sin
pantalla y guarda el PDF original del informe, que el visor descarga de
`files.evacenter.com`. Si no aparece un PDF, guarda una captura JPG de la
página.

Probado con dos enlaces reales (TC tórax-abdomen-pelvis de 3 páginas con
imágenes y Rx tórax PA de 1 página): ambos bajaron completos, con texto
seleccionable.

Requisitos del entorno:

- Acceso de red a `pacs.evacenter.com`, `apps.evacenter.com`,
  `api.evacenter.com`, `cdn-assets.evacenter.com` y `files.evacenter.com`.
- Chromium confía solo en la CA del proxy del entorno, por su huella SPKI:

```sh
SPKI=$(openssl x509 -in /root/.ccr/agent-proxy-ca.crt -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64)
PROXY_CA_SPKI=$SPKI NODE_PATH=$(npm root -g) node rutinas/oncorad/bajar_informe.js '<enlace>' <carpeta de salida>
```

Si Oncorad cambia su visor, el script deja de encontrar el PDF y cae a la
captura.

## Pendiente

- Renombrar los archivos de imagen viejos al formato nuevo. Hay un
  recordatorio programado para el 30 de octubre de 2026; se hace solo con
  confirmación del Dr. Salinas.
