// Genera los íconos PNG de cada app a partir de shared/iconos/*.svg (fuente única).
// Uso: NODE_PATH=<playwright-core> node scripts/iconos.cjs   (necesita Chromium; ver README de pruebas)
// Por app: icon-192.png e icon-512.png (esquinas redondeadas) e icon-maskable-512.png
// (fondo a sangre y el dibujo al 80 %, para Android, que recorta el ícono en círculo).
const {chromium} = require('playwright-core');
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const APPS = { 'constancias':'constancias', 'alta-quirurgica':'alta-quirurgica', 'arancel-redhsa':'arancel-redhsa',
               'calculadora-ata':'calculadora-ata/public', 'inicio':'.' };
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', ignoreDefaultArgs:['--headless=old'], args:['--no-sandbox','--headless=new']});
  const pg = await b.newPage();
  for (const [nombre, carpeta] of Object.entries(APPS)) {
    const svg = fs.readFileSync(path.join(RAIZ, 'shared/iconos', nombre + '.svg'), 'utf8');
    const pref = nombre === 'inicio' ? 'icon-inicio' : 'icon';
    const dibujo = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="512" height="512" rx="96"[^>]*\/>/, '');
    const masc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0f172a"/><g transform="translate(51.2 51.2) scale(.8)">${dibujo}</g></svg>`;
    for (const [archivo, fuente, lado] of [[pref+'-192.png', svg, 192], [pref+'-512.png', svg, 512], [pref+'-maskable-512.png', masc, 512]]) {
      await pg.setViewportSize({width:lado, height:lado});
      await pg.setContent(`<html><body style="margin:0;background:transparent">${fuente.replace('<svg ', `<svg width="${lado}" height="${lado}" `)}</body></html>`);
      await pg.screenshot({path: path.join(RAIZ, carpeta, archivo), omitBackground:true, clip:{x:0,y:0,width:lado,height:lado}});
    }
    if (nombre !== 'calculadora-ata' && nombre !== 'inicio') fs.copyFileSync(path.join(RAIZ, 'shared/iconos', nombre + '.svg'), path.join(RAIZ, carpeta, 'icon.svg'));
    if (nombre === 'inicio') fs.copyFileSync(path.join(RAIZ, 'shared/iconos/inicio.svg'), path.join(RAIZ, 'icon-inicio.svg'));
    console.log('listo:', nombre);
  }
  await b.close();
})();
