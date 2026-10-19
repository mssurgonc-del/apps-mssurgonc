const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const BASE=process.env.BASE||'http://localhost:8765/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.route('https://accounts.google.com/**',r=>r.fulfill({body:''}));
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(BASE);await pg.fill('#vlNew1','246810');await pg.fill('#vlNew2','246810');await pg.click('#vlSetupBtn');await pg.waitForTimeout(2500);
await pg.evaluate(()=>closeConfigModal());
// paciente 1 completo
await pg.fill('#rxPacNombre','María López');await pg.fill('#rxPacEdad','52');await pg.fill('#rxPacDx','Ca papilar de tiroides');
await pg.selectOption('#rxCirugia','Tiroidectomía total');
await pg.evaluate(()=>switchView('indicaciones'));
ok((await pg.textContent('#indPacSummary')).includes('María López · 52 a · F · Ca papilar de tiroides'),'línea del paciente en Indicaciones');
ok(!(await pg.isVisible('#indPacNombre')),'campos del paciente ocultos en Indicaciones');
await pg.click('#indPacSummary'); ok(await pg.isVisible('#indPacNombre'),'tocar la línea abre los campos'); await pg.click('#indPacSummary');
ok(!(await pg.isVisible('text=Guardar como plantilla de cirugía')),'botones de plantilla ocultos');
await pg.click('#view-indicaciones details.tpl-opts >> nth=0 >> summary'); ok(await pg.isVisible('text=Guardar como plantilla de cirugía'),'Opciones de plantilla los muestra');
await pg.evaluate(()=>switchView('laboratorios'));
await pg.fill('#labTomar','2026-10-29');
ok((await pg.textContent('#labDocPage')).includes('Tomar el: jueves, 29 de octubre de 2026')||(await pg.textContent('#labDocPage')).includes('Tomar el: jueves 29 de octubre de 2026'),'orden muestra Tomar el: '+((await pg.textContent('#labDocPage')).match(/Tomar el:[^\n]{0,40}/)||[''])[0]);
await pg.evaluate(()=>switchView('citas')); await pg.fill('#citFecha','2026-10-30');
// duración con lista
await pg.evaluate(()=>switchView('receta'));
ok(await pg.evaluate(()=>document.querySelector('#recetaItems input[list=duracionOpts]')!==null && document.querySelectorAll('#duracionOpts option').length===10),'duración con lista de opciones');
await pg.evaluate(()=>{ const i=document.querySelector('#recetaItems input[list=duracionOpts]'); i.value='7 días'; i.dispatchEvent(new Event('change')); });
ok(await pg.evaluate(()=>currentRxItems[0].duracion==='7 días'),'duración elegida queda en la receta');
// guardar receta manualmente antes -> no debe duplicar
await pg.evaluate(()=>saveToHistorial());
// nuevo paciente
await pg.click('#newPacBtn'); await pg.waitForTimeout(300);
const h=await pg.evaluate(()=>({rx:historial.length,ind:historialIndicaciones.length,lab:historialLabs.length,cit:historialCitas.length,tomar:historialLabs[0]&&historialLabs[0].tomar}));
console.log(h); ok(h.rx===1&&h.ind===1&&h.lab===1&&h.cit===1&&h.tomar==='2026-10-29','guardó 4 documentos sin duplicar la receta ya guardada');
ok((await pg.textContent('#newPacMsg')).includes('receta, indicaciones, laboratorio, cita'),'mensaje: '+await pg.textContent('#newPacMsg'));
const clean=await pg.evaluate(()=>({n:['rxPacNombre','indPacNombre','labPacNombre','citPacNombre'].map(i=>document.getElementById(i).value).join(''),rx:currentRxItems.length,lab:currentLabItems.length,ind:document.getElementById('indCuidadosHerida').value,cit:document.getElementById('citFecha').value,tomar:document.getElementById('labTomar').value,cir:document.getElementById('rxCirugia').value}));
console.log(clean); ok(!clean.n&&!clean.rx&&!clean.lab&&!clean.ind&&!clean.cit&&!clean.tomar,'todo en blanco');
// deshacer
await pg.click('#newPacBar button'); await pg.waitForTimeout(200);
ok(await pg.evaluate(()=>document.getElementById('labPacNombre').value==='María López'&&currentRxItems.length===3&&document.getElementById('labTomar').value==='2026-10-29'),'Deshacer recupera al paciente');
// nuevo paciente otra vez -> no duplica
await pg.click('#newPacBtn'); await pg.waitForTimeout(200);
ok(await pg.evaluate(()=>historial.length===1&&historialLabs.length===1),'no duplica al repetir');
// recuperar desde historial y reenviar
await pg.evaluate(()=>loadLabFromHistorial(historialLabs[0].id));
ok(await pg.evaluate(()=>document.getElementById('labTomar').value==='2026-10-29' && document.getElementById('rxPacNombre').value==='María López'),'abrir del historial trae la orden con su fecha de toma');
// PC dos columnas
await pg.setViewportSize({width:1440,height:900}); await pg.evaluate(()=>switchView('receta')); await pg.waitForTimeout(300);
const lay=await pg.evaluate(()=>{const d=document.querySelector('#view-receta .doc-card').getBoundingClientRect(),f=document.querySelector('#view-receta .card').getBoundingClientRect();return {dl:d.left,fr:f.right,dt:d.top,sw:document.documentElement.scrollWidth}});
console.log(lay); ok(lay.dl>lay.fr && lay.dt<200 && lay.sw<=1440,'PC: documento a la derecha, arriba');
await pg.evaluate(()=>window.scrollTo(0,1200)); await pg.waitForTimeout(200);
ok(await pg.evaluate(()=>document.querySelector('#view-receta .doc-card').getBoundingClientRect().top<=20),'PC: documento se queda fijo al bajar');
await pg.setViewportSize({width:390,height:844}); await pg.evaluate(()=>{window.scrollTo(0,0);switchView('laboratorios')}); await pg.waitForTimeout(300);
console.log('errors',errs);await b.close();})();
