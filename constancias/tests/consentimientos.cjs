// Servir constancias/ (python3 -m http.server 8771) y correr con NODE_PATH=<playwright-core> BASE=http://localhost:8771/
// JSPDF=<ruta a jspdf.umd.min.js 2.5.1> (el navegador de prueba no llega a cdnjs).
const BASE=process.env.BASE||'http://localhost:8771/';
const {chromium}=require('playwright-core');
const OUT=(process.env.OUT||'/tmp')+'/';
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true}); await ctx.route('**/jspdf.umd.min.js', r=>r.fulfill({path:process.env.JSPDF, contentType:'application/javascript'})); await ctx.route(/accounts\.google\.com|apis\.google\.com/, r=>r.abort());
  const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(BASE); await pg.waitForTimeout(1500);
ok(await pg.evaluate(()=>!!window.jspdf),'jsPDF cargado');
async function hacer(tpl, fill, file){
  await pg.goto(BASE); await pg.waitForTimeout(800);
  await pg.click(`.card[data-tpl="${tpl}"]`); await pg.waitForTimeout(200);
  await pg.click('#btnNewPatient'); await pg.waitForTimeout(200);
  for (const [k,v] of Object.entries(fill)) {
    const el=pg.locator(`[data-key="${k}"]`);
    if (await el.evaluate(e=>e.tagName)==='SELECT') await el.selectOption(v); else await el.fill(v);
    await el.dispatchEvent('change');
  }
  await pg.click('#btnPreview'); await pg.waitForTimeout(300);
  const txt=await pg.textContent('body');
  const btn=await pg.$$eval('button',b=>b.map(x=>x.id).filter(Boolean));
  const gen=btn.find(x=>/pdf/i.test(x));
  const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:8000}), pg.click('#'+gen)]);
  await dl.saveAs(OUT+file);
  return txt;
}
let t=await hacer('consent_tiroides',{nombre:'Paciente Prueba',documentoIdentidad:'0801-1990-00001',edad:'45',sexo:'Femenino',diagnostico:'Carcinoma papilar de tiroides',procedimiento:'Tiroidectomía total',transfusion:'Acepto'},'tiroides.pdf');
ok(t.includes('Dr./Dra. Manuel Salinas') && t.includes('Carcinoma papilar de tiroides') && t.includes('(X) Acepto | (  ) Rechazo'),'tiroides: médico, diagnóstico y transfusión en el texto');
ok(t.includes('Doc. Ref: CI-TIROIDES-V2.4'),'tiroides: referencia del documento');
t=await hacer('consent_mama',{nombre:'Paciente Dos',documentoIdentidad:'',edad:'',sexo:'Femenino'},'mama.pdf');
ok(t.includes('(  ) Acepto | (  ) Rechazo') && t.includes('______________________________________________'),'mama sin datos: casillas y líneas en blanco para llenar a mano');
t=await hacer('consent_imagen',{nombre:'Paciente Tres',autorizaImagen:'No autorizo'},'imagen.pdf');
ok(t.includes('(  ) SÍ AUTORIZO') && t.includes('(X) NO AUTORIZO'),'anexo de imagen: marca la decisión');
await pg.goto(BASE); await pg.waitForTimeout(600);
await pg.click('.card[data-tpl="consent_revocacion"]'); await pg.click('#btnNewPatient');
await pg.fill('[data-key="nombre"]','Paciente Cuatro'); await pg.dispatchEvent('[data-key="nombre"]','change');
await pg.check('input[data-checkgroup="opciones"][value^="Opción A"]');
await pg.fill('[data-key="motivo"]','Segunda opinión'); await pg.dispatchEvent('[data-key="motivo"]','change');
await pg.click('#btnPreview'); await pg.waitForTimeout(300); t=await pg.textContent('body');
ok(t.includes('[X] OPCIÓN A') && t.includes('[  ] OPCIÓN B') && t.includes('Segunda opinión'),'revocación: opción A marcada y motivo');
console.log('errors',errs); await b.close();})();
