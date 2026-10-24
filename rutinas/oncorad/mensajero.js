// Mensajero de informes en línea (Oncorad / evacenter).
//
// Pide a la puerta de Apps Script los enlaces pendientes, abre cada uno en
// Chromium sin pantalla y guarda el PDF original del informe que descarga
// el visor. Si no aparece ningún PDF, entrega una captura JPG de la página.
// La puerta deja el archivo en la bandeja de entrada de Drive.
//
// Uso: PUERTA_URL=<url /exec> PUERTA_CLAVE=<clave> node mensajero.js

const { execFileSync, execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

// Chromium solo confía en la CA del proxy del entorno, por su huella SPKI.
function huellaCaProxy() {
  const ca = new crypto.X509Certificate(fs.readFileSync('/root/.ccr/agent-proxy-ca.crt'));
  const der = ca.publicKey.export({ type: 'spki', format: 'der' });
  return crypto.createHash('sha256').update(der).digest('base64');
}

// curl respeta el proxy y la CA del entorno; con -L sigue la redirección
// de Apps Script como GET, que es lo que Google espera.
function puerta(cuerpo) {
  const archivo = path.join(os.tmpdir(), 'puerta-' + process.pid + '.json');
  fs.writeFileSync(archivo, JSON.stringify({ clave: process.env.PUERTA_CLAVE, ...cuerpo }));
  try {
    const salida = execFileSync('curl', ['-sS', '-L', '--max-time', '120',
      '-H', 'Content-Type: application/json', '--data-binary', '@' + archivo,
      process.env.PUERTA_URL], { maxBuffer: 64 * 1024 * 1024 }).toString();
    try {
      return JSON.parse(salida);
    } catch (e) {
      throw new Error('la puerta no respondió JSON: ' + salida.slice(0, 120).replace(/\s+/g, ' '));
    }
  } finally {
    fs.unlinkSync(archivo);
  }
}

async function bajar(navegador, enlace) {
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 1800 } });
  const pdfs = new Map();
  pagina.on('response', async r => {
    if (r.url().includes('/report/pdf_files/') && r.status() === 200) {
      try {
        const cuerpo = await r.body();
        if (cuerpo.slice(0, 5).toString() === '%PDF-') pdfs.set(r.url().split('?')[0], cuerpo);
      } catch (e) {
        // respuesta descartada por el navegador; si era la única, cae a la captura
      }
    }
  });
  try {
    await pagina.goto(enlace, { waitUntil: 'networkidle', timeout: 90000 });
    await pagina.waitForTimeout(8000);
    if (pdfs.size) return [...pdfs.values()].map(cuerpo => ({ tipoMime: 'application/pdf', cuerpo }));
    // Sin PDF, la captura solo vale si la página muestra un informe y no la
    // pantalla de error del visor ("Something went wrong when loading the study").
    const texto = (await pagina.innerText('body').catch(() => '')).trim();
    if (/something went wrong|not found|no encontrado|error/i.test(texto) || texto.length < 200) {
      throw new Error('el visor no mostró el informe: "' + texto.slice(0, 80).replace(/\s+/g, ' ') + '"');
    }
    const captura = await pagina.screenshot({ fullPage: true, type: 'jpeg', quality: 85 });
    return [{ tipoMime: 'image/jpeg', cuerpo: captura }];
  } finally {
    await pagina.close();
  }
}

(async () => {
  const lista = puerta({ accion: 'pendientes' });
  if (!lista.ok) throw new Error('la puerta respondió: ' + lista.error);
  if (lista.pendientes.length === 0) {
    console.log('SIN PENDIENTES');
    return;
  }

  const navegador = await chromium.launch({
    channel: 'chromium',
    proxy: { server: process.env.HTTPS_PROXY },
    args: ['--ignore-certificate-errors-spki-list=' + huellaCaProxy()],
  });
  try {
    for (const p of lista.pendientes) {
      try {
        const archivos = await bajar(navegador, p.enlace);
        const entrega = puerta({
          accion: 'guardar', id: p.id,
          archivos: archivos.map(a => ({ tipoMime: a.tipoMime, base64: a.cuerpo.toString('base64') })),
        });
        if (!entrega.ok) throw new Error('la puerta no lo guardó: ' + entrega.error);
        console.log(`LISTO | ${p.nombre} | recibido ${p.recibido} | ${entrega.resultado || 'ya estaba guardado'}`);
      } catch (e) {
        const motivo = String(e.message).split('\n')[0].slice(0, 200);
        let estado = '';
        try {
          estado = puerta({ accion: 'fallo', id: p.id, motivo }).estado;
        } catch (e2) {
          // si la puerta tampoco responde, el enlace sigue pendiente
        }
        const siguiente = estado === 'falló' ? 'sin más intentos' : 'se reintenta en la próxima corrida';
        console.log(`FALLÓ | ${p.nombre} | recibido ${p.recibido} | ${motivo} | ${siguiente}`);
      }
    }
  } finally {
    await navegador.close();
  }
})().catch(e => {
  console.error('ERROR | ' + String(e.message).split('\n')[0]);
  process.exit(1);
});
