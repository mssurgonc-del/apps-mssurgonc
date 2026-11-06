// Hoja membretada en la vista previa, la impresión y la imagen para WhatsApp.
// Servir alta-quirurgica/ (python3 -m http.server 8765) y correr con NODE_PATH=<playwright-core>
// MEMBRETE=<imagen carta PNG/JPG> [OUT=<carpeta>]. La hoja del médico no va en el repositorio.
// Requiere pdftotext.
const BASE=process.env.BASE||'http://localhost:8765/';
const {chromium}=require('playwright-core'); const {execSync}=require('child_process'); const fs=require('fs');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const OUT=(process.env.OUT||'/tmp')+'/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}); await ctx.route(/google\.com|googleapis|gstatic/, r=>r.abort());
const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(BASE); await pg.waitForTimeout(1200);
const c=pg.locator('.modal-overlay.show .modal-close').first(); if (await c.count() && await c.isVisible()) await c.click();
await pg.fill('#rxPacNombre','María Fernanda López'); await pg.dispatchEvent('#rxPacNombre','input');
ok(await pg.$eval('#rxDocPage .doc-membrete',e=>getComputedStyle(e).display!=='none'),'sin hoja: encabezado con los datos del médico');

await pg.click('#gearBtn'); await pg.waitForTimeout(200);
ok(await pg.isVisible('#msMembHoja'),'Ajustes › Perfil: opción de hoja membretada');
await pg.setInputFiles('#msMembFile', process.env.MEMBRETE); await pg.waitForTimeout(1200);
const m=await pg.evaluate(()=>msMembrete());
ok(m && m.top>1.4 && m.top<2.2 && m.bottom>1.1 && m.bottom<1.8,`calcula los espacios (encabezado ${m&&m.top} in, pie ${m&&m.bottom} in)`);
await pg.locator('#configModal .modal-close').click(); await pg.waitForTimeout(200);
ok(await pg.$eval('#rxDocPage',e=>e.classList.contains('con-membrete') && getComputedStyle(e.querySelector('.doc-membrete')).display==='none'),'vista previa: hoja de fondo, sin el encabezado de texto');
await pg.screenshot({path:OUT+'alta-memb-pc.png'});

// impresión de indicaciones largas: la hoja y los espacios se repiten en cada página
await pg.evaluate(()=>{ const t='Lavar la herida con agua y jabón dos veces al día, secar con gasa limpia y cubrir. '.repeat(14);
  ['indCuidadosHerida','indDieta','indActividad','indSignosAlarma'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=t; }); renderIndDoc(); });
const [pop]=await Promise.all([ctx.waitForEvent('page'), pg.evaluate(()=>printIndicaciones())]);
await pop.waitForLoadState('load'); await pop.evaluate(()=>{ window.print=()=>{}; });
await pop.pdf({path:OUT+'alta-ind.pdf', format:'Letter', printBackground:true, preferCSSPageSize:true});
const n=+execSync(`pdfinfo ${OUT}alta-ind.pdf`).toString().match(/Pages:\s+(\d+)/)[1];
const bbox=execSync(`pdftotext -bbox ${OUT}alta-ind.pdf -`).toString();
const pags=bbox.split('<page ').slice(1).map(p=>[...p.matchAll(/yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)"/g)].map(x=>[+x[1]/72,+x[2]/72]));
const fuera=pags.flat().filter(([a,bb])=>a<m.top-0.05 || bb>11-m.bottom+0.05);
ok(n>=2 && fuera.length===0, `impresión: ${n} páginas, ningún texto sobre el encabezado ni el pie (${fuera.length} fuera)`);
execSync(`pdftoppm -r 50 -png ${OUT}alta-ind.pdf ${OUT}alta-ind`);

// imagen para WhatsApp
const url=await pg.evaluate(async()=>{ const cv=await buildDocImageCanvas(buildRxImageSpec()); return cv.toDataURL('image/png'); });
fs.writeFileSync(OUT+'alta-rx-img.png', Buffer.from(url.split(',')[1],'base64'));
ok(url.length>200000,'imagen para compartir: con la hoja de fondo');

// volver a los datos del médico
await pg.click('#gearBtn'); await pg.waitForTimeout(200); await pg.click('#msMembDatos'); await pg.waitForTimeout(150);
ok(await pg.$eval('#rxDocPage',e=>!e.classList.contains('con-membrete') && !e.style.backgroundImage),'datos del médico: la vista previa vuelve al encabezado de texto');
console.log('errors',errs); await b.close();})();
