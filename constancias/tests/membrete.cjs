// Hoja membretada en los PDF. Servir constancias/ (python3 -m http.server 8771) y correr con
// NODE_PATH=<playwright-core> JSPDF=<jspdf.umd.min.js> MEMBRETE=<imagen carta PNG/JPG> [OUT=<carpeta>].
// La hoja del médico no va en el repositorio: se pasa por MEMBRETE. Requiere pdftotext, pdfimages y pdftoppm.
const BASE=process.env.BASE||'http://localhost:8771/';
const {chromium}=require('playwright-core'); const {execSync}=require('child_process');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const OUT=(process.env.OUT||'/tmp')+'/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});
await ctx.route('**/jspdf.umd.min.js', r=>r.fulfill({path:process.env.JSPDF, contentType:'application/javascript'})); await ctx.route(/google\.com/, r=>r.abort());
const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
const ajustes=async()=>{ await pg.goto(BASE); await pg.waitForTimeout(700); await pg.click('#tabAjustes'); await pg.click('#btnLogo'); await pg.waitForTimeout(150); };
async function hacer(tpl, fill, file){
  await pg.goto(BASE); await pg.waitForTimeout(700);
  await pg.click(`[data-tpl="${tpl}"]`); await pg.click('#btnNewPatient'); await pg.waitForTimeout(150);
  for (const [k,v] of Object.entries(fill)) { const el=pg.locator(`[data-key="${k}"]`);
    if (await el.evaluate(e=>e.tagName)==='SELECT') await el.selectOption(v); else await el.fill(v); await el.dispatchEvent('change'); }
  await pg.click('#btnPreview'); await pg.waitForTimeout(250);
  const gen=(await pg.$$eval('button',x=>x.map(y=>y.id))).find(x=>/pdf/i.test(x));
  const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:8000}), pg.click('#'+gen)]); await dl.saveAs(OUT+file);
  return { txt: execSync(`pdftotext -layout ${OUT}${file} -`).toString(), pags: +execSync(`pdfinfo ${OUT}${file}`).toString().match(/Pages:\s+(\d+)/)[1],
           imgs: execSync(`pdfimages -list ${OUT}${file}`).toString().trim().split('\n').slice(2) };
}
const consulta={nombre:'Paciente Prueba'};
await ajustes();
ok(await pg.isVisible('#msMembHoja') && (await pg.getAttribute('#msMembDatos','aria-pressed'))==='true','sin hoja: se usan los datos del médico');
let r=await hacer('consulta',consulta,'m-datos.pdf');
ok(r.txt.includes('Hospital CEMESA, Consultorio #42'),'datos del médico: el encabezado de texto sale');

await ajustes();
await pg.setInputFiles('#msMembFile', process.env.MEMBRETE); await pg.waitForTimeout(1200);
const m=await pg.evaluate(()=>msMembrete());
ok(m && m.top>1.4 && m.top<2.2 && m.bottom>1.1 && m.bottom<1.8,`calcula los espacios (encabezado ${m&&m.top} in, pie ${m&&m.bottom} in)`);
ok((await pg.getAttribute('#msMembHoja','aria-pressed'))==='true' && await pg.isVisible('.ms-memb-mini'),'queda elegida la hoja y se ve la miniatura');
await pg.screenshot({path:OUT+'m-ajustes.png'});

r=await hacer('consulta',consulta,'m-hoja.pdf');
ok(!r.txt.includes('Hospital CEMESA, Consultorio #42') && r.txt.includes('Paciente Prueba'),'con hoja: sin el encabezado de texto, con el contenido');
ok(r.imgs.length>=1,'con hoja: la imagen va de fondo');
execSync(`pdftoppm -r 60 -png -f 1 -l 1 ${OUT}m-hoja.pdf ${OUT}m-hoja`);

r=await hacer('consent_tiroides',{nombre:'Paciente Prueba',documentoIdentidad:'0801-1990-00001',edad:'45',sexo:'Femenino',diagnostico:'Carcinoma papilar de tiroides',procedimiento:'Tiroidectomía total',transfusion:'Acepto'},'m-tiroides.pdf');
const copias=(r.txt.match(/Copia para el (paciente|médico \(expediente\)) · Página \d+ de \d+/g)||[]).length;
ok(r.pags%2===0 && copias===r.pags,`consentimiento: ${r.pags} páginas, todas con su copia marcada`);
ok(r.imgs.filter(l=>/image/.test(l)).length>=1,'consentimiento: hoja de fondo');
execSync(`pdftoppm -r 60 -png -f 2 -l 2 ${OUT}m-tiroides.pdf ${OUT}m-tiroides`);
// Ningún texto en la zona del encabezado ni del pie de la hoja
const zonas=await pg.evaluate(()=>msMembrete());
for (const f of ['m-hoja.pdf','m-tiroides.pdf']) {
  const bbox=execSync(`pdftotext -bbox ${OUT}${f} -`).toString();
  const ys=[...bbox.matchAll(/yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)"/g)].map(x=>[+x[1]/72,+x[2]/72]);
  const fuera=ys.filter(([a,b])=>a<zonas.top-0.25 || b>11-zonas.bottom+0.3);
  ok(ys.length>20 && fuera.length===0, `${f}: ningún texto encima del encabezado ni del pie (${fuera.length} fuera)`);
}

await ajustes(); await pg.click('#msMembDatos'); await pg.waitForTimeout(150);
r=await hacer('consulta',consulta,'m-otra-vez.pdf');
ok(r.txt.includes('Hospital CEMESA, Consultorio #42'),'volver a datos del médico: el encabezado de texto vuelve');
await ajustes(); await pg.click('#msMembQuitar'); await pg.click('#msMembQuitar'); await pg.waitForTimeout(150);
ok(await pg.evaluate(()=>!msMembreteGuardado()),'quitar hoja (dos toques)');
console.log('errors',errs); await b.close();})();
