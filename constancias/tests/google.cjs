// Servir constancias/ (python3 -m http.server 8771) y correr con NODE_PATH=<playwright-core> BASE=http://localhost:8771/
// JSPDF=<ruta a jspdf.umd.min.js 2.5.1> (el navegador de prueba no llega a cdnjs).
const BASE=process.env.BASE||'http://localhost:8771/';
const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const ctx=await b.newContext({viewport:{width:390,height:844}}); await ctx.route(/accounts\.google\.com|apis\.google\.com|cdnjs/, r=>r.abort());
const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(BASE); await pg.waitForTimeout(600);
await pg.click('#tabAjustes'); await pg.click('#btnGoogleCfg'); await pg.waitForTimeout(200);
ok(await pg.isVisible('text=Conexión con Google') && await pg.isVisible('#apiKeyInput') && await pg.isVisible('#btnPickSheet'),'pantalla ⚙ Google con clave y selector');
await pg.fill('#apiKeyInput','AIzaPrueba'); await pg.dispatchEvent('#apiKeyInput','change');
ok(await pg.evaluate(()=>localStorage.getItem('google_api_key'))==='AIzaPrueba','la clave se guarda en el equipo');
await pg.click('#btnPickSheet'); await pg.waitForTimeout(200);
ok((await pg.textContent('body')).includes('Conecte Google primero'),'sin conectar, pide conectar Google');
// selección de pestaña del año
const r=await pg.evaluate(()=>[choosePatientsTab(['2025','2026','Historial Constancias'],'2025'), choosePatientsTab(['2025','Pacientes'],'Pacientes'), choosePatientsTab(['Hoja 1','Config'],null)]);
const y=String(new Date().getFullYear());
ok(r[0]===(y==='2026'?'2026':'2025') && r[1]==='Pacientes' && r[2]==='Hoja 1','pestaña: usa la del año en curso si existe; respeta la elegida si no es de un año ('+r+')');
ok(!(await pg.content()).includes('1-2LTIWdAxnKskG2Pl4V4I3JUX'),'el ID de la hoja ya no está en el código');
console.log('errors',errs); await b.close();})();
