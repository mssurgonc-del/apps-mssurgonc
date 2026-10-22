# Formulario de carga de exámenes — Paso 1 y 2

Esta carpeta contiene el proyecto de Google Apps Script para el formulario
que los pacientes usan para subir sus exámenes antes de la consulta.

## Qué hace

- El paciente abre un enlace, escribe su nombre, la fecha de su cita, el
  tipo de examen, y sube una foto/PDF o pega un enlace (o ambos).
- El sistema busca una carpeta de paciente con un nombre parecido dentro
  de **"14) Examenes estudios y biopsias de pacientes"**. Si encuentra una
  coincidencia alta, el archivo cae ahí. Si no, cae en la bandeja
  **"13) Archivos sincronizados desde el Telefono"** con el prefijo
  `⚠️ SIN EMPAREJAR -`, y la tarea programada "Ordenar archivos de
  pacientes en Drive" lo abre, identifica al paciente y lo archiva.
- Cada envío queda registrado en una hoja de cálculo llamada
  **"Registro de cargas - Formulario de exámenes"**, que el script crea
  solo la primera vez que alguien envía el formulario.
- Las fotos se comprimen en el navegador del paciente antes de subirse
  (igual funciona con mala señal).

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
- el archivo aparece en Drive (en tu carpeta si tu nombre no coincide con
  ningún paciente, caerá en "13) Archivos sincronizados desde el
  Telefono" con el prefijo de
  "sin emparejar" — es lo esperado),
- se creó la hoja "Registro de cargas - Formulario de exámenes" en tu
  Drive con esa fila.

Avísame cuando lo hayas probado y seguimos con el Paso 3 (el panel con
semáforo).

## Actualizaciones futuras

Cuando necesite cambiar algo de este formulario, edito los archivos aquí
en el repositorio y te aviso qué archivo(s) volver a pegar en el proyecto
de Apps Script (pasos 3-6 de arriba, no hace falta repetir todo).
