/**
 * Formulario de carga de exámenes — Dr. Manuel Salinas
 *
 * El paciente abre el enlace, escribe su nombre, sube fotos o PDF y/o pega
 * el mensaje de WhatsApp del centro de imágenes, uno por estudio (hasta dos
 * cuadros). Cada estudio se guarda por separado para que se archive con su
 * propia fecha y tipo.
 *
 * Todo cae en la bandeja "13) Archivos sincronizados desde el Telefono".
 * La tarea programada "Ordenar archivos de pacientes en Drive" lo abre,
 * identifica al paciente, el tipo de estudio y su fecha leyendo el
 * documento, y lo archiva en la carpeta del paciente con el nombre
 * correcto. Por eso el formulario ya no le pide al paciente ni la fecha
 * de la cita ni el tipo de examen.
 *
 * Cada envío queda registrado en una hoja de cálculo ("Registro de cargas
 * - Formulario de exámenes") que este script crea la primera vez.
 */

// ---------------------------------------------------------------------
// CONFIGURACIÓN — IDs reales de Google Drive
// ---------------------------------------------------------------------

// "13) Archivos sincronizados desde el Telefono" — bandeja de entrada que
// la tarea programada revisa tres veces al día.
var BANDEJA_FOLDER_ID = '1_27Hmo5iySiEUz-UlhFIBoyQ5FysmG-Y';

// Prefijo con el que la tarea programada reconoce lo que viene del
// formulario. Si se cambia aquí, hay que cambiarlo también en la tarea.
var PREFIJO = 'EXAMEN DE PACIENTE - ';

var MAXIMO_ARCHIVOS = 8;
var MAXIMO_ESTUDIOS = 4;
var MAXIMO_ENLACES_POR_ESTUDIO = 5;

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

// ---------------------------------------------------------------------
// RECEPCIÓN DEL FORMULARIO (llamado desde el navegador vía
// google.script.run)
// ---------------------------------------------------------------------

/**
 * @param {Object} datos
 *   datos.nombrePaciente {string}  requerido
 *   datos.consentimiento {boolean} requerido, debe ser true
 *   datos.archivos       {Array}   opcional: [{base64, nombre, tipoMime}]
 *   datos.estudios       {Array}   opcional: [{texto, enlaces}], uno por
 *                                  cuadro de "estudio de imágenes" con texto
 */
function procesarEnvio(datos) {
  try {
    var nombre = datos && datos.nombrePaciente ? limpiarNombre(datos.nombrePaciente) : '';
    if (!nombre) {
      return { ok: false, mensaje: 'Por favor escriba el nombre completo del paciente.' };
    }
    if (!datos.consentimiento) {
      return { ok: false, mensaje: 'Debe aceptar el uso de su información para continuar.' };
    }
    var archivos = (datos.archivos || []).filter(function (a) { return a && a.base64; })
      .slice(0, MAXIMO_ARCHIVOS);
    var estudios = (datos.estudios || []).map(function (estudio) {
      return {
        texto: (estudio && estudio.texto ? String(estudio.texto) : '').slice(0, 5000),
        enlaces: ((estudio && estudio.enlaces) || []).filter(esEnlaceValido).slice(0, MAXIMO_ENLACES_POR_ESTUDIO)
      };
    }).filter(function (estudio) { return estudio.enlaces.length > 0; })
      .slice(0, MAXIMO_ESTUDIOS);
    if (archivos.length === 0 && estudios.length === 0) {
      return { ok: false, mensaje: 'Suba al menos un archivo o pegue el mensaje con el enlace.' };
    }

    var bandeja = DriveApp.getFolderById(BANDEJA_FOLDER_ID);
    var ahora = new Date();
    var zonaHoraria = Session.getScriptTimeZone();
    var marcaTiempo = Utilities.formatDate(ahora, zonaHoraria, 'yyyy-MM-dd HHmm');
    var base = PREFIJO + nombre + ' - ' + marcaTiempo;
    var enlacesCreados = [];

    archivos.forEach(function (archivoDatos, indice) {
      var bytes = Utilities.base64Decode(archivoDatos.base64);
      var tipoMime = archivoDatos.tipoMime || 'application/octet-stream';
      var blob = Utilities.newBlob(bytes, tipoMime, archivoDatos.nombre || 'archivo');
      var extension = obtenerExtension(archivoDatos.nombre, tipoMime);
      var sufijo = archivos.length > 1 ? ' (' + (indice + 1) + ' de ' + archivos.length + ')' : '';
      var archivo = bandeja.createFile(blob);
      archivo.setName(base + sufijo + '.' + extension);
      enlacesCreados.push(archivo.getUrl());
    });

    estudios.forEach(function (estudio, indice) {
      var contenido =
        'Paciente (escrito por quien envió): ' + nombre + '\n' +
        'Enviado el: ' + Utilities.formatDate(ahora, zonaHoraria, 'yyyy-MM-dd HH:mm') + '\n\n' +
        'Enlaces detectados:\n' + estudio.enlaces.map(function (e) { return '- ' + e; }).join('\n') + '\n\n' +
        'Mensaje tal como lo pegó el paciente:\n' + estudio.texto + '\n';
      var nombreTxt = base + ' - Estudio ' + (indice + 1) + ' - Enlaces.txt';
      var archivoTxt = bandeja.createFile(nombreTxt, contenido, MimeType.PLAIN_TEXT);
      enlacesCreados.push(archivoTxt.getUrl());
    });

    registrarEnBitacora([
      ahora, nombre, archivos.length, estudios.length, enlacesCreados.join(' | ')
    ]);

    return { ok: true, mensaje: '¡Gracias! Sus documentos fueron recibidos correctamente.' };
  } catch (err) {
    return {
      ok: false,
      mensaje: 'Ocurrió un error al recibir sus documentos. Por favor intente de nuevo o comuníquese al consultorio.',
      error: err.toString()
    };
  }
}

// El nombre va dentro del nombre del archivo: se quitan caracteres que
// Drive o la tarea programada podrían interpretar mal.
function limpiarNombre(texto) {
  return texto.toString().replace(/[\/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function esEnlaceValido(enlace) {
  return typeof enlace === 'string' && /^(https?:\/\/|www\.)\S+$/i.test(enlace) && enlace.length < 2000;
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
// BITÁCORA DE ENVÍOS (hoja de cálculo auto-creada la primera vez)
// ---------------------------------------------------------------------

function registrarEnBitacora(fila) {
  var props = PropertiesService.getScriptProperties();
  // Clave nueva porque las columnas cambiaron respecto a la primera versión.
  var idHoja = props.getProperty('BITACORA_SHEET_ID_V2');
  var hoja = null;

  if (idHoja) {
    try {
      hoja = SpreadsheetApp.openById(idHoja).getSheetByName('Registro');
    } catch (e) {
      hoja = null; // la hoja fue borrada o movida; se crea una nueva abajo
    }
  }

  if (!hoja) {
    var libro = SpreadsheetApp.create('Registro de cargas - Formulario de exámenes');
    hoja = libro.getSheets()[0];
    hoja.setName('Registro');
    hoja.appendRow(['Fecha/hora de envío', 'Nombre escrito', 'Archivos', 'Estudios con enlace', 'Archivos creados en Drive']);
    hoja.setFrozenRows(1);
    props.setProperty('BITACORA_SHEET_ID_V2', libro.getId());
  }

  hoja.appendRow(fila);
}
