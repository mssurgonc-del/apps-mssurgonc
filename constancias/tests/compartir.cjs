// Servir constancias/ (python3 -m http.server 8771) y correr con NODE_PATH=<playwright-core> BASE=http://localhost:8771/
// JSPDF=<ruta a jspdf.umd.min.js 2.5.1> (el navegador de prueba no llega a cdnjs). LOGO=<archivo con un data URL PNG>.
const BASE=process.env.BASE||'http://localhost:8771/';
const fs=require('fs'); const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const OUT=(process.env.OUT||'/tmp')+'/';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});
await ctx.route('**/jspdf.umd.min.js', r=>r.fulfill({path:process.env.JSPDF, contentType:'application/javascript'})); await ctx.route(/google\.com/, r=>r.abort());
const logo=fs.readFileSync(process.env.LOGO,'utf8').trim();
await ctx.addInitScript(l=>{ localStorage.setItem('doctor_logo', l); localStorage.setItem('doctor_logo_aspect','3');
  window.__compartido=null;
  navigator.canShare=()=>true;
  navigator.share=async (data)=>{ const f=data.files[0]; const u=new Uint8Array(await f.arrayBuffer()); let s=''; u.forEach(x=>s+=String.fromCharCode(x)); window.__compartido={name:f.name,type:f.type,size:f.size,text:data.text,b64:btoa(s)}; };
}, logo);
const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(BASE); await pg.waitForTimeout(800);
await pg.click('.card[data-tpl="consulta"]'); await pg.click('#btnNewPatient');
for (const el of await pg.$$('input[data-key]:not([readonly])')) { const k=await el.getAttribute('data-key'); if(k==='__fecha') continue; const t=await el.getAttribute('type'); await el.fill(t==='number'?'30':t==='time'?'10:00':'Paciente Prueba'); await el.dispatchEvent('change'); }
await pg.click('#btnPreview'); await pg.waitForTimeout(300);
ok(await pg.$eval('.paper-preview img', i=>getComputedStyle(i.parentElement).textAlign==='center'),'vista previa: logo centrado');
await pg.click('#btnWhatsApp'); await pg.waitForTimeout(500);
const c=await pg.evaluate(()=>window.__compartido);
ok(c && c.type==='application/pdf' && c.size>1000 && /\.pdf$/.test(c.name),'Compartir PDF entrega el archivo PDF al menú de compartir ('+(c&&c.name)+')');
ok(c && c.text.includes('Le adjunto el documento'),'con el mensaje para el paciente');
if(c) fs.writeFileSync(OUT+'compartido.pdf', Buffer.from(c.b64,'base64'));
// sin soporte de archivos: descarga + WhatsApp con texto
await pg.evaluate(()=>{ navigator.canShare=()=>false; window.open=(u)=>{ window.__abierto=u; }; });
const [dl]=await Promise.all([pg.waitForEvent('download',{timeout:8000}), pg.click('#btnWhatsApp')]);
ok(!!dl && (await pg.evaluate(()=>window.__abierto||'')).startsWith('https://wa.me/?text='),'sin soporte: descarga el PDF y abre WhatsApp con el texto');
console.log('errors',errs); await b.close();})();
