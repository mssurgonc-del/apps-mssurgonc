# Formulario de carga de exámenes — Paso 1 y 2

Esta carpeta contiene el proyecto de Google Apps Script para el formulario
que los pacientes usan para subir sus exámenes antes de la consulta.

## Qué hace

- El paciente abre un enlace y escribe solo su nombre. Luego sube fotos o
  PDF (hasta 8) y/o pega el mensaje de WhatsApp del centro de imágenes en
  uno de los dos cuadros de "estudio de imágenes" (uno por estudio). El
  formulario detecta el enlace solo y muestra "✓ Enlace detectado".
- Todo cae en la bandeja **"13) Archivos sincronizados desde el Telefono"**
  con el prefijo `EXAMEN DE PACIENTE - <nombre> - <fecha y hora>`. La tarea
  programada "Ordenar archivos de pacientes en Drive" lo abre, saca del
  documento el paciente, el tipo de estudio y la fecha, y lo archiva en la
  carpeta del paciente. Por eso no se le pide al paciente ni la fecha de
  la cita ni el tipo de examen.
- Cada estudio con enlace se guarda en su propio `.txt` junto con el
  mensaje que pegó el paciente, para que se archive con su fecha y tipo.
  Nadie abre los enlaces automáticamente.
- Cada envío queda registrado en una hoja de cálculo llamada
  **"Registro de cargas - Formulario de exámenes"**, que el script crea
  la primera vez que alguien envía el formulario.
- Las fotos se comprimen en el navegador del paciente antes de subirse
  (igual funciona con mala señal).
- Los enlaces de Oncorad (evacenter) además se anotan en la hoja
  **"Enlaces pendientes"** del mismo libro. La tarea programada "Mensajero de
  informes en línea" los recoge, baja el PDF original del informe y lo
  entrega por la "puerta" de este script (`doPost`), que lo deja en la
  bandeja como `EXAMEN DE PACIENTE - <nombre> - <fecha> - Informe del
  enlace.pdf`. La puerta pide una clave secreta, solo acepta PDF o JPG de
  hasta 15 MB y solo puede guardar en la bandeja: no lee, mueve ni borra
  nada. En la hoja se ve el estado de cada enlace (pendiente, listo o
  falló tras 3 intentos).

## Por qué no lo publiqué yo mismo

No tengo una conexión a la consola de Google Apps Script en esta sesión
(sí tengo acceso a tu Drive, pero Apps Script es un servicio aparte que
requiere su propio permiso). Por eso te dejo el código listo aquí y los
pasos exactos abajo — son 10 minutos, una sola vez.

## Cómo publicarlo (hazlo con tu cuenta de Gmail)

1. Ve a **[script.new](https://script.new)** (te abre un proyecto nuevo de
   Apps Script ya con tu cuenta).
2. Arriba a la izquierda, cambia el nombre del proyecto a algo como
   **"Formulario de exámenes - Consultorio"**.
3. Verás un archivo `Código.gs` (o `Code.gs`) ya abierto. Borra todo su
   contenido y pega el de **`Code.gs`** de esta carpeta.
4. En el menú de la izquierda, haz clic en el **+** junto a "Archivos" →
   **HTML**. Nómbralo exactamente **`Formulario`** (sin extensión, Apps
   Script le agrega `.html` solo). Pega ahí el contenido de
   **`Formulario.html`** de esta carpeta.
5. En el menú **Ver → Mostrar archivo de manifiesto "appsscript.json"**,
   reemplaza su contenido por el de **`appsscript.json`** de esta carpeta.
6. Guarda el proyecto (ícono de disquete o Ctrl/Cmd+S).
6b. **Crear la clave del mensajero (una sola vez).** Arriba, en la lista de
   funciones (al lado de "Depurar"), elige **`crearClaveMensajero`** y haz
   clic en **Ejecutar**. Google te pedirá autorizar (ver paso 8). Abajo se
   abre el "Registro de ejecución" con una línea
   `Clave del mensajero: …`. Copia esa clave: se la pasas a Claude para la
   tarea "Mensajero de informes en línea".
7. Arriba a la derecha, haz clic en **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo (tu correo)**.
   - Quién tiene acceso: **Cualquier usuario** (así cualquier paciente
     puede entrar sin iniciar sesión con Google).
   - Haz clic en **Implementar**.
8. Google te va a pedir autorizar permisos (acceso a tu Drive y a crear
   hojas de cálculo) — es tu propia cuenta autorizándose a sí misma, es
   normal que Google muestre una advertencia de "app no verificada" la
   primera vez porque es un proyecto personal tuyo, no público. Haz clic
   en **Configuración avanzada → Ir a (nombre del proyecto), no seguro**.
9. Copia la **URL de la aplicación web** que te da al final — esa es la
   que se pone en el mensaje de recordatorio de Confirmafy.

## Cómo probarlo

Abre tú mismo esa URL desde tu celular, llena el formulario con un caso
de prueba (puedes usar tu propio nombre) y confirma que:

- te aparece la pantalla de "¡Recibido, gracias!",
- el archivo aparece en "13) Archivos sincronizados desde el Telefono"
  con el prefijo `EXAMEN DE PACIENTE -`, y en la siguiente corrida de la tarea
  programada pasa a la carpeta del paciente (o a "Por organizar"),
- se creó la hoja "Registro de cargas - Formulario de exámenes" en tu
  Drive con esa fila.

Avísame cuando lo hayas probado y seguimos con el Paso 3 (el panel con
semáforo).

## Actualizaciones futuras

Cuando necesite cambiar algo de este formulario, edito los archivos aquí
en el repositorio y te aviso qué archivo(s) volver a pegar en el proyecto
de Apps Script (pasos 3-6 de arriba, no hace falta repetir todo).
