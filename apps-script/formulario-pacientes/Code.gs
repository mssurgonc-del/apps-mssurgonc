/**
 * Formulario de carga de exámenes — Dr. Manuel Salinas
 *
 * Paso 1 (base del proyecto) + Paso 2 (formulario de carga) del plan de
 * construcción. El paciente abre el enlace, sube un archivo o pega un
 * enlace (ultrasonido/tomografía), y el archivo cae en su carpeta de
 * Drive si el nombre coincide, o en "14) Examenes.../00 Por identificar"
 * si no.
 *
 * Cada envío queda registrado en una hoja de cálculo ("Registro de cargas
 * - Formulario de exámenes") que este script crea solo la primera vez
 * que se usa.
 */

// ---------------------------------------------------------------------
// CONFIGURACIÓN — IDs reales de las carpetas de Manuel en Google Drive
// ---------------------------------------------------------------------

// "14) Examenes estudios y biopsias de pacientes" — raíz con una
// subcarpeta por paciente (ej. "Ordoñez Romero, María Leticia").
var ROOT_EXAMENES_FOLDER_ID = '1xJHfrtHYutOEf7JM9o7L0tpxvoA_RgWA';

// "14) Examenes.../00 Por identificar" — carpeta de respaldo para lo que
// no se pueda emparejar con ningún paciente. Es la misma que usa la rutina
// automática de organización, así que todo lo pendiente queda en un solo
// lugar. (Antes apuntaba a "(00) estudios por ver", que resultó ser una
// carpeta vieja de 2023-2025 que ya no se usa.)
var POR_REVISAR_FOLDER_ID = '1FlvoQ4z-PIOgkZTRRbwhzqGkH2zgtYPF';

var TIPOS_EXAMEN_VALIDOS = [
  'Laboratorio',
  'Ultrasonido',
  'Tomografía',
  'Valoración preoperatoria',
  'Otro'
];

// ---------------------------------------------------------------------
// PUNTO DE ENTRADA DE LA APLICACIÓN WEB
// ---------------------------------------------------------------------

function doGet(e) {
  return HtmlService.createTemplateFromFile('Formulario')
    .evaluate()
    .setTitle('Suba sus exámenes - Dr. Manuel Salinas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Permite incluir Formulario.html como un único archivo autocontenido
// (no se usa por ahora porque todo vive en un solo archivo HTML, pero se
// deja disponible por si en el futuro se separa CSS/JS).
function include(nombreArchivo) {
  return HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();
}

// ---------------------------------------------------------------------
// RECEPCIÓN DEL FORMULARIO (llamado desde el navegador vía
// google.script.run)
// ---------------------------------------------------------------------

/**
 * @param {Object} datos
 *   datos.nombrePaciente   {string}  requerido
 *   datos.fechaCita        {string}  requerido, 'yyyy-mm-dd'
 *   datos.tipoExamen       {string}  requerido, uno de TIPOS_EXAMEN_VALIDOS
 *   datos.consentimiento   {boolean} requerido, debe ser true
 *   datos.enlace           {string}  opcional
 *   datos.archivos          {Array}   opcional, uno o varios archivos
 *     datos.archivos[i].base64   {string}
 *     datos.archivos[i].nombre   {string}
 *     datos.archivos[i].tipoMime {string}
 */
function procesarEnvio(datos) {
  try {
    if (!datos || !datos.nombrePaciente || !datos.fechaCita || !datos.tipoExamen) {
      return { ok: false, mensaje: 'Faltan datos obligatorios. Por favor complete el formulario de nuevo.' };
    }
    if (TIPOS_EXAMEN_VALIDOS.indexOf(datos.tipoExamen) === -1) {
      return { ok: false, mensaje: 'Tipo de examen no reconocido.' };
    }
    if (!datos.consentimiento) {
      return { ok: false, mensaje: 'Debe aceptar el uso de su información para continuar.' };
    }
    var tieneArchivos = datos.archivos && datos.archivos.length > 0;
    if (!tieneArchivos && !datos.enlace) {
      return { ok: false, mensaje: 'Debe subir al menos un archivo o pegar un enlace.' };
    }

    var carpeta = buscarCarpetaPaciente(datos.nombrePaciente);
    var emparejado = !!carpeta;
    if (!carpeta) {
      carpeta = DriveApp.getFolderById(POR_REVISAR_FOLDER_ID);
    }

    var ahora = new Date();
    var zonaHoraria = Session.getScriptTimeZone();
    var fechaISO = Utilities.formatDate(ahora, zonaHoraria, 'yyyy-MM-dd');
    var prefijoSinEmparejar = emparejado ? '' : '⚠️ SIN EMPAREJAR - ';
    var sufijoNombre = emparejado ? '' : (' - ' + datos.nombrePaciente);
    var enlacesCreados = [];

    if (tieneArchivos) {
      datos.archivos.forEach(function (archivoDatos, indice) {
        if (!archivoDatos || !archivoDatos.base64) return;
        var bytes = Utilities.base64Decode(archivoDatos.base64);
        var tipoMime = archivoDatos.tipoMime || 'application/octet-stream';
        var blob = Utilities.newBlob(bytes, tipoMime, archivoDatos.nombre || 'archivo');
        var extension = obtenerExtension(archivoDatos.nombre, tipoMime);
        // Solo se numeran los nombres cuando hay más de un archivo, para
        // no cambiar el patrón de nombre en el caso más común (uno solo).
        var sufijoIndice = datos.archivos.length > 1
          ? ' (' + (indice + 1) + ' de ' + datos.archivos.length + ')'
          : '';
        var nombreArchivo = prefijoSinEmparejar + fechaISO + ' - ' + datos.tipoExamen +
          sufijoNombre + ' (cita ' + datos.fechaCita + ')' + sufijoIndice + '.' + extension;
        var archivo = carpeta.createFile(blob);
        archivo.setName(nombreArchivo);
        enlacesCreados.push(archivo.getUrl());
      });
    }

    if (datos.enlace) {
      var contenidoTxt = 'Paciente: ' + datos.nombrePaciente + '\n' +
        'Fecha de cita: ' + datos.fechaCita + '\n' +
        'Tipo de examen: ' + datos.tipoExamen + '\n' +
        'Enlace: ' + datos.enlace + '\n' +
        'Enviado el: ' + Utilities.formatDate(ahora, zonaHoraria, 'yyyy-MM-dd HH:mm') + '\n';
      var nombreTxt = prefijoSinEmparejar + fechaISO + ' - Enlace ' + datos.tipoExamen +
        sufijoNombre + ' (cita ' + datos.fechaCita + ').txt';
      var archivoTxt = carpeta.createFile(nombreTxt, contenidoTxt, MimeType.PLAIN_TEXT);
      enlacesCreados.push(archivoTxt.getUrl());
    }

    registrarEnBitacora({
      fechaHoraEnvio: ahora,
      nombrePaciente: datos.nombrePaciente,
      fechaCita: datos.fechaCita,
      tipoExamen: datos.tipoExamen,
      metodo: construirEtiquetaMetodo(datos),
      carpetaDestino: carpeta.getName(),
      emparejado: emparejado ? 'Sí' : 'No',
      enlaces: enlacesCreados.join(' | ')
    });

    return { ok: true, mensaje: '¡Gracias! Sus documentos fueron recibidos correctamente.' };
  } catch (err) {
    return {
      ok: false,
      mensaje: 'Ocurrió un error al recibir sus documentos. Por favor intente de nuevo o comuníquese al consultorio.',
      error: err.toString()
    };
  }
}

function construirEtiquetaMetodo(datos) {
  var partes = [];
  if (datos.archivos && datos.archivos.length) {
    partes.push(datos.archivos.length + ' archivo' + (datos.archivos.length > 1 ? 's' : ''));
  }
  if (datos.enlace) partes.push('Enlace');
  return partes.join(' + ');
}

function obtenerExtension(nombreOriginal, tipoMime) {
  if (nombreOriginal && nombreOriginal.indexOf('.') !== -1) {
    return nombreOriginal.split('.').pop().toLowerCase();
  }
  if (tipoMime.indexOf('pdf') !== -1) return 'pdf';
  if (tipoMime.indexOf('png') !== -1) return 'png';
  return 'jpg';
}

// ---------------------------------------------------------------------
// EMPAREJAMIENTO DE NOMBRE DE PACIENTE CON SU CARPETA
// ---------------------------------------------------------------------

/**
 * Busca, entre las subcarpetas de ROOT_EXAMENES_FOLDER_ID, la que mejor
 * coincida con el nombre ingresado por el paciente. Es tolerante a
 * tildes, mayúsculas/minúsculas y a que el orden de nombre/apellido no
 * sea idéntico, pero exige una coincidencia alta (75% de las palabras,
 * mínimo 2 palabras) para evitar emparejamientos falsos. Si no está
 * segura, prefiere devolver null y dejar que el archivo caiga en
 * "Por revisar" — un archivo sin emparejar se nota y se corrige a mano;
 * un archivo mal emparejado en la carpeta de otro paciente es el error
 * que de verdad hay que evitar.
 */
function buscarCarpetaPaciente(nombreIngresado) {
  var raiz = DriveApp.getFolderById(ROOT_EXAMENES_FOLDER_ID);
  var carpetas = raiz.getFolders();
  var nombreNorm = normalizarTexto(nombreIngresado);
  var palabrasIngresadas = palabrasSignificativas(nombreNorm);

  if (palabrasIngresadas.length < 2) {
    return null; // nombre demasiado corto/ambiguo para emparejar con seguridad
  }

  var mejorCarpeta = null;
  var mejorPuntaje = 0;

  while (carpetas.hasNext()) {
    var carpeta = carpetas.next();
    if (carpeta.getId() === POR_REVISAR_FOLDER_ID) continue; // no es un paciente
    var tituloNorm = normalizarTexto(carpeta.getName());

    if (tituloNorm === nombreNorm) {
      return carpeta; // coincidencia exacta, no hace falta seguir buscando
    }

    var palabrasCarpeta = palabrasSignificativas(tituloNorm);
    var coincidencias = palabrasIngresadas.filter(function (palabra) {
      return palabrasCarpeta.indexOf(palabra) !== -1;
    }).length;
    var puntaje = coincidencias / palabrasIngresadas.length;

    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorCarpeta = carpeta;
    }
  }

  if (mejorCarpeta && mejorPuntaje >= 0.75) {
    return mejorCarpeta;
  }
  return null;
}

function normalizarTexto(texto) {
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')    // quita puntuación (comas, etc.)
    .replace(/\s+/g, ' ')
    .trim();
}

function palabrasSignificativas(textoNormalizado) {
  return textoNormalizado.split(' ').filter(function (palabra) {
    return palabra.length > 1; // descarta iniciales sueltas de una letra
  });
}

// ---------------------------------------------------------------------
// BITÁCORA DE ENVÍOS (hoja de cálculo auto-creada la primera vez)
// ---------------------------------------------------------------------

function registrarEnBitacora(fila) {
  var props = PropertiesService.getScriptProperties();
  var idHoja = props.getProperty('BITACORA_SHEET_ID');
  var hoja = null;

  if (idHoja) {
    try {
      hoja = SpreadsheetApp.openById(idHoja).getSheetByName('Registro');
    } catch (e) {
      hoja = null; // la hoja fue borrada o movida; se crea una nueva abajo
    }
  }

  if (!hoja) {
    var nuevoLibro = SpreadsheetApp.create('Registro de cargas - Formulario de exámenes');
    hoja = nuevoLibro.getSheets()[0];
    hoja.setName('Registro');
    hoja.appendRow([
      'Fecha/hora de envío', 'Nombre del paciente', 'Fecha de la cita',
      'Tipo de examen', 'Método', 'Carpeta destino', '¿Emparejado?', 'Enlaces'
    ]);
    hoja.setFrozenRows(1);
    props.setProperty('BITACORA_SHEET_ID', nuevoLibro.getId());
  }

  hoja.appendRow([
    fila.fechaHoraEnvio, fila.nombrePaciente, fila.fechaCita, fila.tipoExamen,
    fila.metodo, fila.carpetaDestino, fila.emparejado, fila.enlaces
  ]);
}
