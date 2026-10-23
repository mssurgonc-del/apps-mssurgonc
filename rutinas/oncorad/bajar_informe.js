// Abre el enlace de Oncorad (visor Eden/evacenter), espera a que la página
// pida el PDF del informe y lo guarda tal cual. Si no aparece un PDF, toma
// capturas JPG de la pestaña "Reporte" como respaldo.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, salida] = process.argv.slice(2);
  const browser = await chromium.launch({
    channel: 'chromium',
    proxy: { server: process.env.HTTPS_PROXY },
    // Confía solo en la CA del proxy del entorno (la misma que usa curl).
    args: ['--ignore-certificate-errors-spki-list=' + process.env.PROXY_CA_SPKI]
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1800 } });
  const pdfs = [];
  page.on('response', async r => {
    if (r.url().includes('/report/pdf_files/') && r.status() === 200) {
      try { pdfs.push({ url: r.url(), body: await r.body() }); } catch (e) {}
    }
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(8000);
  if (pdfs.length) {
    pdfs.forEach((p, i) => {
      const nombre = decodeURIComponent(p.url.split('/').pop().split('?')[0]) || ('informe_' + i + '.pdf');
      fs.writeFileSync(salida + '/' + nombre, p.body);
      console.log('PDF', nombre, p.body.length, 'bytes', p.body.slice(0, 5).toString());
    });
  } else {
    await page.screenshot({ path: salida + '/captura.jpg', fullPage: true, type: 'jpeg', quality: 90 });
    console.log('SIN_PDF captura.jpg');
  }
  await browser.close();
})().catch(e => { console.error('ERROR', e.message.split('\n')[0]); process.exit(1); });
