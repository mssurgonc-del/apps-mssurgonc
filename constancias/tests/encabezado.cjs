// Servir constancias/ (python3 -m http.server 8771) y correr con NODE_PATH=<playwright-core> BASE=http://localhost:8771/
// JSPDF=<ruta a jspdf.umd.min.js 2.5.1> (el navegador de prueba no llega a cdnjs). Requiere pdftotext.
const BASE=process.env.BASE||'http://localhost:8771/';
const {chromium}=require('playwright-core'); const {execSync}=require('child_process');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const OUT=(process.env.OUT||'/tmp')+'/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});
await ctx.route('**/jspdf.umd.min.js', r=>r.fulfill({path:process.env.JSPDF, contentType:'application/javascript'})); await ctx.route(/google\.com/, r=>r.abort());
const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(BASE); await pg.waitForTimeout(800);
await pg.click('#btnLogo'); await pg.waitForTimeout(200);
ok(await pg.isVisible('text=Encabezado de los documentos'),'pantalla 🖼 Encabezado');
ok((await pg.inputValue('#hdrTelefono'))==='9555-8959' && (await pg.inputValue('#hdrDireccion')).includes('Consultorio #42'),'trae los datos actuales');
await pg.fill('#hdrNombre','Dr. Manuel Salinas\nCirujano Oncólogo'); await pg.dispatchEvent('#hdrNombre','change');
await pg.fill('#hdrTelefono',''); await pg.dispatchEvent('#hdrTelefono','change');
await pg.reload(); await pg.waitForTimeout(600); await pg.click('#btnLogo'); await pg.waitForTimeout(150);
ok((await pg.inputValue('#hdrNombre')).startsWith('Dr. Manuel Salinas') && (await pg.inputValue('#hdrTelefono'))==='','se conserva al recargar');
await pg.click('#btnBack');
await pg.click('.card[data-tpl="consulta"]'); await pg.click('#btnNewPatient');
for (const el of await pg.$$('input[data-key]:not([readonly])')) { const k=await el.getAttribute('data-key'); if(k==='__fecha') continue; const t=await el.getAttribute('type'); await el.fill(t==='number'?'30':t==='time'?'10:00':'Paciente Prueba'); await el.dispatchEvent('change'); }
await pg.click('#btnPreview'); await pg.waitForTimeout(300);
const prev=await pg.textContent('.paper-preview');
ok(prev.includes('Cirujano Oncólogo') && !prev.includes('Tel:') && prev.includes('Email: manuelsalinascirujanooncologo@gmail.com'),'vista previa: nombre sí, teléfono vacío no sale');
const gen=(await pg.$$eval('button',x=>x.map(y=>y.id))).find(x=>/pdf/i.test(x));
const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:8000}), pg.click('#'+gen)]); await dl.saveAs(OUT+'encabezado.pdf');
const txt=execSync(`pdftotext ${OUT}encabezado.pdf -`).toString();
ok(txt.includes('Dr. Manuel Salinas') && txt.includes('Hospital CEMESA, Consultorio #42') && !txt.includes('Tel:'),'PDF: nombre y dirección, sin la línea de teléfono vacía');
// todo en blanco: sin encabezado de texto
await pg.goto(BASE); await pg.waitForTimeout(600); await pg.click('#btnLogo'); await pg.waitForTimeout(150);
for (const id of ['hdrNombre','hdrDireccion','hdrTelefono','hdrCorreo']) { await pg.fill('#'+id,''); await pg.dispatchEvent('#'+id,'change'); }
ok(await pg.evaluate(()=>headerLines().length===0),'todo en blanco: no imprime encabezado de texto');
console.log('errors',errs); await b.close();})();
