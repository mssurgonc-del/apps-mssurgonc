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
