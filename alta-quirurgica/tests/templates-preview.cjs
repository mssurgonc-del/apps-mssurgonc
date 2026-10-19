const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.route('https://accounts.google.com/**',r=>r.fulfill({body:''}));
const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(process.env.BASE || 'http://localhost:8765/');await pg.fill('#vlNew1','246810');await pg.fill('#vlNew2','246810');await pg.click('#vlSetupBtn');await pg.waitForTimeout(2500);
await pg.evaluate(()=>closeConfigModal());
const rx=()=>pg.evaluate(()=>currentRxItems.map(i=>i.generico+'|'+i.presentacion+' '+i.concentracion+'|'+i.via));
await pg.selectOption('#rxCirugia','Tiroidectomía total'); let r=await rx(); console.log(r);
ok(r.some(x=>x==='Ketorolaco trometamina|Tableta 10 mg|VO'),'ketorolaco tableta VO');
ok(r.some(x=>x.startsWith('Acetaminofén (Paracetamol)|Tableta')),'acetaminofén tableta');
await pg.selectOption('#rxCirugia','Gastrectomía'); r=await rx(); console.log(r);
ok(r.some(x=>x==='Tramadol clorhidrato|Cápsula 50 mg|VO'),'tramadol cápsula VO');
await pg.selectOption('#rxCirugia','Hemicolectomía'); r=await rx(); ok(r.some(x=>x==='Tramadol clorhidrato|Cápsula 50 mg|VO'),'tramadol hemicolectomía');
// guardar como plantilla con ampolla elegida a mano y re-aplicar -> respeta la ampolla
await pg.evaluate(()=>{ const amp=medsDB.find(m=>m.generico==='Ketorolaco trometamina'&&m.presentacion==='Ampolla'); currentRxItems=[{medId:amp.id,generico:amp.generico,comercial:amp.comercial,presentacion:amp.presentacion,concentracion:amp.concentracion,via:amp.via,dosis:'30 mg',frecuencia:'c/8h',duracion:'1 día',cantidad:'3'}]; document.getElementById('rxCirugia').value='Mastectomía'; combos['Mastectomía']=[]; saveCurrentAsTemplate(); currentRxItems=[]; applyCombo('Mastectomía'); });
r=await rx(); ok(r[0]==='Ketorolaco trometamina|Ampolla 30 mg/mL|IM/IV','plantilla guardada respeta la presentación elegida');
// vista previa
await pg.selectOption('#rxCirugia','Tiroidectomía total'); await pg.waitForTimeout(300);
const fit=await pg.evaluate(()=>{const p=document.getElementById('rxDocPage'),w=p.parentElement,r=p.getBoundingClientRect(),wr=w.getBoundingClientRect();return {fit:w.classList.contains('doc-fit'),pr:r.right,wr:wr.right,doc:document.documentElement.scrollWidth}});
console.log(fit); ok(fit.fit && fit.pr<=fit.wr+1 && fit.doc<=390,'vista previa cabe en 390 px sin desplazar');
ok(!(await pg.evaluate(()=>document.getElementById('rxDocPage').outerHTML)).includes('scale'),'la impresión no lleva la reducción');
for(const v of ['indicaciones','laboratorios','citas']){ await pg.evaluate(v=>switchView(v),v); await pg.waitForTimeout(250);
  const f=await pg.evaluate(v=>{const id={indicaciones:'indDocPage',laboratorios:'labDocPage',citas:'citDocPage'}[v];const p=document.getElementById(id);return p.getBoundingClientRect().right<=p.parentElement.getBoundingClientRect().right+1},v); ok(f,'vista previa cabe: '+v); }

// compartir alta completa con cita
await pg.fill('#citFecha','2026-10-29');
await pg.evaluate(()=>{ window.__files=null; navigator.canShare=()=>true; navigator.share=async d=>{window.__files=d.files.map(f=>f.name)}; });
await pg.evaluate(()=>shareAltaCompleta()); await pg.waitForTimeout(3000);
const files=await pg.evaluate(()=>window.__files); console.log(files);
ok(files && files.some(f=>f.startsWith('cita-')) && files.length===4,'alta completa incluye la cita');
console.log('errors',errs);await b.close();})();
