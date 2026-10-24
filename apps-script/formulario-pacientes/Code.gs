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
 *
 * Los enlaces de Oncorad (evacenter) se anotan además en la hoja "Enlaces
 * pendientes" del mismo libro. La tarea "Mensajero de informes en línea"
 * los recoge por la puerta (doPost), baja el PDF original y lo entrega
 * aquí para que caiga en la bandeja.
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

// Enlaces cuyo informe el mensajero sabe bajar (Oncorad usa evacenter).
// Los demás enlaces solo se guardan en el .txt.
var HOSTS_DESCARGABLES = /(^|\.)evacenter\.com$/i;
var MAXIMO_BYTES_INFORME = 15 * 1024 * 1024;
var INTENTOS_MAXIMOS = 3;
var TIPOS_INFORME = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg' };

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
      try {
        agregarPendientes(nombre, ahora, estudio.enlaces);
      } catch (e) {
        // El .txt ya quedó guardado; sin la cola solo se pierde la descarga
        // automática del informe, no el envío del paciente.
        console.error('No se pudo anotar el enlace pendiente: ' + e);
      }
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
// PUERTA DEL MENSAJERO (llamada por la tarea programada "Mensajero de
// informes en línea" con una clave secreta)
//
// El mensajero pide los enlaces pendientes, baja cada informe con un
// navegador y lo entrega aquí. La puerta solo guarda en la bandeja de
// entrada, con el prefijo del formulario, para que la tarea "Ordenar
// archivos de pacientes en Drive" lo archive como cualquier otro envío.
// No puede leer, mover ni borrar nada.
// ---------------------------------------------------------------------

var ENCABEZADOS_PENDIENTES = ['ID', 'Recibido', 'Paciente (escrito)', 'Enlace', 'Estado', 'Intentos', 'Último resultado', 'Archivos en Drive'];

function doPost(e) {
  var respuesta;
  try {
    var datos = JSON.parse(e.postData.contents);
    var clave = PropertiesService.getScriptProperties().getProperty('CLAVE_MENSAJERO');
    if (!clave || datos.clave !== clave) {
      respuesta = { ok: false, error: 'clave incorrecta' };
    } else if (datos.accion === 'pendientes') {
      respuesta = { ok: true, pendientes: listarPendientes() };
    } else if (datos.accion === 'guardar') {
      respuesta = guardarInforme(datos);
    } else if (datos.accion === 'fallo') {
      respuesta = registrarFallo(datos);
    } else if (datos.accion === 'agregar') {
      // Para encolar a mano un enlace que no vino por el formulario.
      respuesta = { ok: true, agregados: agregarPendientes(limpiarNombre(datos.nombre || 'Sin nombre'), new Date(), [datos.enlace]) };
    } else {
      respuesta = { ok: false, error: 'acción desconocida' };
    }
  } catch (err) {
    respuesta = { ok: false, error: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(respuesta)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Correr UNA VEZ desde el editor de Apps Script (menú de funciones →
 * crearClaveMensajero → Ejecutar). Muestra la clave en el registro de
 * ejecución; esa clave se le pasa a la tarea programada.
 */
function crearClaveMensajero() {
  var props = PropertiesService.getScriptProperties();
  var clave = props.getProperty('CLAVE_MENSAJERO');
  if (!clave) {
    clave = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
    props.setProperty('CLAVE_MENSAJERO', clave);
  }
  console.log('Clave del mensajero: ' + clave);
}

function esDescargable(enlace) {
  var host = enlace.replace(/^https?:\/\//i, '').split(/[\/?#:]/)[0];
  return HOSTS_DESCARGABLES.test(host);
}

function agregarPendientes(nombre, recibido, enlaces) {
  var descargables = (enlaces || []).map(function (e) {
    var texto = String(e || '').trim();
    return /^https?:\/\//i.test(texto) ? texto : 'https://' + texto;
  }).filter(function (e) { return esEnlaceValido(e) && esDescargable(e); });
  if (descargables.length === 0) return 0;
  var hoja = obtenerHoja('Enlaces pendientes', ENCABEZADOS_PENDIENTES);
  descargables.forEach(function (enlace) {
    hoja.appendRow([Utilities.getUuid().slice(0, 8), recibido, nombre, enlace, 'pendiente', 0, '', '']);
  });
  return descargables.length;
}

function listarPendientes() {
  var filas = obtenerHoja('Enlaces pendientes', ENCABEZADOS_PENDIENTES).getDataRange().getValues();
  var zonaHoraria = Session.getScriptTimeZone();
  return filas.slice(1).filter(function (f) { return f[4] === 'pendiente'; }).map(function (f) {
    return { id: f[0], recibido: Utilities.formatDate(new Date(f[1]), zonaHoraria, 'yyyy-MM-dd HH:mm'), nombre: f[2], enlace: f[3] };
  });
}

// Devuelve el número de fila (base 1) y sus valores, o null.
function buscarPendiente(hoja, id) {
  var filas = hoja.getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (filas[i][0] === id) return { numero: i + 1, valores: filas[i] };
  }
  return null;
}

function guardarInforme(datos) {
  var candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    var hoja = obtenerHoja('Enlaces pendientes', ENCABEZADOS_PENDIENTES);
    var fila = buscarPendiente(hoja, datos.id);
    if (!fila) return { ok: false, error: 'no existe el pendiente ' + datos.id };
    // Si el mensajero repite la entrega (por ejemplo, tras un corte), no se duplica.
    if (fila.valores[4] === 'listo') return { ok: true, repetido: true };

    var archivos = (datos.archivos || []).filter(function (a) { return a && a.base64 && TIPOS_INFORME[a.tipoMime]; });
    if (archivos.length === 0) return { ok: false, error: 'no llegó ningún PDF o JPG' };

    var blobs = archivos.map(function (a) {
      return Utilities.newBlob(Utilities.base64Decode(a.base64), a.tipoMime);
    });
    for (var i = 0; i < blobs.length; i++) {
      if (blobs[i].getBytes().length > MAXIMO_BYTES_INFORME) return { ok: false, error: 'archivo de más de 15 MB' };
    }

    var bandeja = DriveApp.getFolderById(BANDEJA_FOLDER_ID);
    var marcaTiempo = Utilities.formatDate(new Date(fila.valores[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
    var base = PREFIJO + fila.valores[2] + ' - ' + marcaTiempo + ' - Informe del enlace';
    var urls = blobs.map(function (blob, indice) {
      var sufijo = blobs.length > 1 ? ' (' + (indice + 1) + ' de ' + blobs.length + ')' : '';
      var archivo = bandeja.createFile(blob);
      archivo.setName(base + sufijo + '.' + TIPOS_INFORME[blob.getContentType()]);
      return archivo.getUrl();
    });

    var resultado = archivos.every(function (a) { return a.tipoMime === 'application/pdf'; }) ? 'PDF original' : 'Captura de pantalla';
    hoja.getRange(fila.numero, 5, 1, 4).setValues([['listo', Number(fila.valores[5]) + 1, resultado, urls.join(' | ')]]);
    return { ok: true, archivos: urls.length, resultado: resultado };
  } finally {
    candado.releaseLock();
  }
}

function registrarFallo(datos) {
  var candado = LockService.getScriptLock();
  candado.waitLock(20000);
  try {
    var hoja = obtenerHoja('Enlaces pendientes', ENCABEZADOS_PENDIENTES);
    var fila = buscarPendiente(hoja, datos.id);
    if (!fila) return { ok: false, error: 'no existe el pendiente ' + datos.id };
    var intentos = Number(fila.valores[5]) + 1;
    var estado = intentos >= INTENTOS_MAXIMOS ? 'falló' : 'pendiente';
    hoja.getRange(fila.numero, 5, 1, 3).setValues([[estado, intentos, String(datos.motivo || '').slice(0, 200)]]);
    return { ok: true, estado: estado, intentos: intentos };
  } finally {
    candado.releaseLock();
  }
}

// ---------------------------------------------------------------------
// BITÁCORA DE ENVÍOS (hoja de cálculo auto-creada la primera vez)
// ---------------------------------------------------------------------

function registrarEnBitacora(fila) {
  obtenerHoja('Registro', ['Fecha/hora de envío', 'Nombre escrito', 'Archivos', 'Estudios con enlace', 'Archivos creados en Drive'])
    .appendRow(fila);
}

function obtenerLibro() {
  var props = PropertiesService.getScriptProperties();
  // Clave nueva porque las columnas cambiaron respecto a la primera versión.
  var idLibro = props.getProperty('BITACORA_SHEET_ID_V2');
  if (idLibro) {
    try {
      return SpreadsheetApp.openById(idLibro);
    } catch (e) {
      // el libro fue borrado o movido; se crea uno nuevo abajo
    }
  }
  var libro = SpreadsheetApp.create('Registro de cargas - Formulario de exámenes');
  props.setProperty('BITACORA_SHEET_ID_V2', libro.getId());
  return libro;
}

// Devuelve la hoja con ese nombre, creándola con sus encabezados si falta.
function obtenerHoja(nombre, encabezados) {
  var libro = obtenerLibro();
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    // Un libro recién creado trae una hoja vacía: se reutiliza.
    var primera = libro.getSheets()[0];
    var reutilizable = libro.getSheets().length === 1 && primera.getLastRow() === 0;
    hoja = reutilizable ? primera.setName(nombre) : libro.insertSheet(nombre);
    hoja.appendRow(encabezados);
    hoja.setFrozenRows(1);
  }
  return hoja;
}
