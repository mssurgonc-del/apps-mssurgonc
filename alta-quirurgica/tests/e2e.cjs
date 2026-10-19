const {chromium}=require('playwright-core');
const BASE=process.env.BASE || 'http://localhost:8765/';
const assert=(c,m)=>{ if(!c){ console.log('FAIL:',m); process.exitCode=1; } else console.log('ok:',m); };
// ---- Google Drive simulado (compartido entre "dispositivos") ----
const drive={file:null, uploads:0};
const GIS_STUB=`window.google={accounts:{oauth2:{initTokenClient:(o)=>({requestAccessToken:()=>setTimeout(()=>o.callback({access_token:'tok',expires_in:3600}),10)}),revoke:()=>{}}}};`;
async function setupRoutes(ctx){
  await ctx.route('https://accounts.google.com/gsi/client', r=>r.fulfill({body:GIS_STUB, contentType:'text/javascript'}));
  await ctx.route('https://www.googleapis.com/**', async r=>{
    const u=new URL(r.request().url()), m=r.request().method();
    if(u.pathname==='/drive/v3/files' && m==='GET') return r.fulfill({json:{files: drive.file?[{id:'F1'}]:[]}});
    if(u.pathname==='/drive/v3/files/F1' && m==='GET') return r.fulfill({body:drive.file, contentType:'application/json'});
    if(u.pathname==='/upload/drive/v3/files' && m==='POST'){ const b=r.request().postData(); const parts=b.split(/--altaq\d+/); drive.file=parts[2].split('\r\n\r\n')[1].replace(/\r\n$/,''); drive.uploads++; return r.fulfill({json:{id:'F1'}}); }
    if(u.pathname==='/upload/drive/v3/files/F1' && m==='PATCH'){ drive.file=r.request().postData(); drive.uploads++; return r.fulfill({json:{id:'F1'}}); }
    r.fulfill({status:404});
  });
}
const errs=[];
async function newDevice(b){ const ctx=await b.newContext({viewport:{width:390,height:844}}); await setupRoutes(ctx); const pg=await ctx.newPage(); pg.on('pageerror',e=>errs.push(e.message)); pg.on('dialog',d=>d.accept()); return {ctx,pg}; }
const waitApp=pg=>pg.waitForFunction(()=>typeof window.historial!=='undefined' || (()=>{try{return Array.isArray(historial)}catch(e){return false}})(), null, {timeout:20000});
const hist=pg=>pg.evaluate(()=>historial.map(h=>h.paciente));
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
// ===== A: datos antiguos (v18, sin cifrar) =====
const A=await newDevice(b);
await A.pg.goto(BASE+'tests/legacy-v18.html');
await A.pg.evaluate(()=>{
  localStorage.setItem('altaApp_historialRecetas', JSON.stringify([{id:'rx_1700000000001',fecha:'2026-10-01',paciente:'Ana Pérez',edad:'45',sexo:'F',dx:'CPT',cirugia:'Tiroidectomía total',items:[],firmaTipo:'manual'}]));
  localStorage.setItem('altaApp_doctorConfig', JSON.stringify({nombre:'Dr. Prueba', firma:'data:image/png;base64,'+'A'.repeat(200000)}));
  localStorage.setItem('altaApp_pinHash','h123'); localStorage.setItem('altaApp_pinEnabled','true');
});
await A.pg.goto(BASE+'index.html');
await A.pg.waitForSelector('#vlSetup', {state:'visible'});
assert(await A.pg.isVisible('#vlLegacyNote'), 'aviso de migración visible');
await A.pg.fill('#vlNew1','12345'); await A.pg.fill('#vlNew2','12345'); await A.pg.click('#vlSetupBtn');
assert((await A.pg.textContent('#vlMsg')).includes('6'), 'PIN corto rechazado');
await A.pg.fill('#vlNew1','246810'); await A.pg.fill('#vlNew2','246810'); await A.pg.click('#vlSetupBtn');
await waitApp(A.pg);
assert(JSON.stringify(await hist(A.pg))==='["Ana Pérez"]', 'historial antiguo migrado');
const ls=await A.pg.evaluate(()=>Object.keys(localStorage).sort());
assert(!ls.includes('altaApp_historialRecetas') && !ls.includes('altaApp_pinHash') && ls.includes('altaApp_vault'), 'datos sin cifrar eliminados: '+ls.join(','));
const raw=await A.pg.evaluate(()=>localStorage.getItem('altaApp_vault'));
assert(!raw.includes('Ana Pérez') && !raw.includes('Dr. Prueba'), 'bóveda no contiene texto legible');
assert((await A.pg.evaluate(()=>doctorConfig.nombre))==='Dr. Prueba', 'perfil migrado');
// recarga en la misma sesión: sin PIN
await A.pg.reload(); await waitApp(A.pg);
assert(!(await A.pg.isVisible('#vaultLock')), 'recarga en sesión sin pedir PIN');
// ===== Ficha única =====
await A.pg.fill('#rxPacNombre','Luis Gómez'); await A.pg.fill('#rxPacEdad','61'); await A.pg.selectOption('#rxPacSexo','M'); await A.pg.fill('#rxPacDx','Bocio');
const f=await A.pg.evaluate(()=>['indPacNombre','labPacNombre','citPacNombre','indPacEdad','citPacSexo','labPacDx'].map(i=>document.getElementById(i).value));
assert(JSON.stringify(f)==='["Luis Gómez","Luis Gómez","Luis Gómez","61","M","Bocio"]', 'ficha copiada a las 4 pestañas '+f);
await A.pg.selectOption('#rxCirugia','Tiroidectomía total');
const c=await A.pg.evaluate(()=>({ind:document.getElementById('indCirugia').value, lab:document.getElementById('labCirugia').value, rx:currentRxItems.length, labs:currentLabItems.length}));
assert(c.ind==='Tiroidectomía total' && c.lab==='Tiroidectomía total' && c.rx>0 && c.labs>0, 'cirugía aplica plantillas en las 3 pestañas '+JSON.stringify(c));
await A.pg.evaluate(()=>switchView('indicaciones'));
assert((await A.pg.evaluate(()=>document.getElementById('view-indicaciones').innerText)).includes('Luis Gómez'), 'documento de indicaciones muestra paciente');
// guardar receta
await A.pg.evaluate(()=>saveToHistorial());
await A.pg.waitForTimeout(400);
// ===== bloqueo: PIN incorrecto / correcto =====
await A.pg.evaluate(()=>Vault.lock()); await A.pg.waitForSelector('#vlUnlock',{state:'visible'});
await A.pg.fill('#vlPin','000000'); await A.pg.press('#vlPin','Enter');
await A.pg.waitForFunction(()=>document.getElementById('vlMsg').textContent.includes('incorrecto'));
assert(true,'PIN incorrecto rechazado');
await A.pg.fill('#vlPin','246810'); await A.pg.press('#vlPin','Enter'); await waitApp(A.pg);
assert(JSON.stringify(await hist(A.pg))==='["Luis Gómez","Ana Pérez"]', 'receta nueva persistió cifrada');
// ===== Conectar Drive en A =====
await A.pg.evaluate(()=>{ openConfigModal(); switchConfigTab('seguridad'); });
await A.pg.click('text=Conectar Google Drive');
await A.pg.waitForFunction(()=>document.getElementById('syncChip').textContent.includes('✓'));
assert(drive.file && !drive.file.includes('Luis'), 'Drive recibió solo datos cifrados');
await A.pg.evaluate(()=>closeConfigModal());
// ===== B: dispositivo nuevo, restaurar desde Drive =====
const B=await newDevice(b);
await B.pg.goto(BASE+'index.html'); await B.pg.waitForSelector('#vlSetup',{state:'visible'});
await B.pg.waitForFunction(()=>!!window.google);
await B.pg.click('#vlRestoreBtn'); await B.pg.waitForSelector('#vaultAsk',{state:'visible'});
await B.pg.fill('#vaskPin','111111'); await B.pg.click('#vaskOk');
await B.pg.waitForFunction(()=>document.getElementById('vlMsg').textContent.includes('incorrecto'));
assert(true,'restaurar con PIN incorrecto rechazado');
await B.pg.click('#vlRestoreBtn'); await B.pg.waitForSelector('#vaultAsk',{state:'visible'});
await B.pg.fill('#vaskPin','246810'); await B.pg.click('#vaskOk'); await waitApp(B.pg);
assert(JSON.stringify(await hist(B.pg))==='["Luis Gómez","Ana Pérez"]', 'B recibe el historial de A');
assert((await B.pg.evaluate(()=>doctorConfig.nombre))==='Dr. Prueba', 'B recibe el perfil');
// B guarda una receta y borra la de Ana
await B.pg.fill('#rxPacNombre','Marta Ruiz');
await B.pg.evaluate(()=>{ currentRxItems=[{generico:'x',dosis:'1'}]; saveToHistorial(); });
await B.pg.evaluate(()=>{ historial=historial.filter(x=>x.paciente!=='Ana Pérez'); saveJSON(LS_KEYS.historial, historial); });
await B.pg.waitForTimeout(300);
await B.pg.evaluate(()=>Vault.syncTap()); await B.pg.waitForTimeout(800);
// A (sin escribir nada desde que abrió) vuelve a primer plano -> sincroniza y recarga
await A.pg.evaluate(()=>{ Object.defineProperty(document,'hidden',{value:false,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
await A.pg.waitForTimeout(1500); await waitApp(A.pg);
let hA=await hist(A.pg);
// A había escrito (ficha) => muestra barra en lugar de recargar
const bar=await A.pg.isVisible('#vaultUpdateBar');
if(bar){ await A.pg.click('#vaultUpdateBar button'); await A.pg.waitForTimeout(1500); await waitApp(A.pg); hA=await hist(A.pg); }

assert(JSON.stringify(hA)==='["Marta Ruiz","Luis Gómez"]', 'A recibe alta de B y el borrado de Ana: '+hA);
// A escribe con estado viejo no debe resucitar a Ana
await A.pg.evaluate(()=>{ currentRxItems=[{generico:'y',dosis:'1'}]; document.getElementById('rxPacNombre').value='Pedro Sol'; saveToHistorial(); });
await A.pg.waitForTimeout(300); await A.pg.evaluate(()=>Vault.syncTap()); await A.pg.waitForTimeout(800);
await B.pg.evaluate(()=>Vault.syncTap()); await B.pg.waitForTimeout(800);
await B.pg.evaluate(()=>Vault.reloadNow()); await B.pg.waitForTimeout(1200); await waitApp(B.pg);
assert(JSON.stringify(await hist(B.pg))==='["Pedro Sol","Marta Ruiz","Luis Gómez"]', 'B tiene todo, sin resucitar borrados: '+await hist(B.pg));
// ===== Cambio de PIN en A -> B pide el nuevo =====
await A.pg.evaluate(()=>{ openConfigModal(); switchConfigTab('seguridad'); });
await A.pg.fill('#cpCur','246810'); await A.pg.fill('#cpNew1','135791'); await A.pg.fill('#cpNew2','135791');
await A.pg.click('button:has-text("Cambiar PIN")'); await A.pg.waitForTimeout(3500);
console.log('A toast:', await A.pg.textContent('#toast'), 'chip', await A.pg.textContent('#syncChip'), 'driveSalt', JSON.parse(drive.file).salt, 'Asalt', JSON.parse(await A.pg.evaluate(()=>localStorage.getItem('altaApp_vault'))).salt);
await B.pg.reload(); await waitApp(B.pg); // recarga: sin PIN en memoria
console.log('B chip', await B.pg.textContent('#syncChip'));
await B.pg.evaluate(()=>{ Vault.syncTap(); });
await B.pg.waitForTimeout(1500); console.log('B chip2', await B.pg.textContent('#syncChip'), await B.pg.evaluate(()=>getComputedStyle(document.getElementById('vaultAsk')).display));
await B.pg.waitForSelector('#vaultAsk',{state:'visible'});
await B.pg.fill('#vaskPin','135791'); await B.pg.click('#vaskOk'); await B.pg.waitForTimeout(1500);
assert((await B.pg.textContent('#syncChip')).includes('✓'), 'B combina tras ingresar el PIN nuevo');
await B.pg.evaluate(()=>Vault.lock()); await B.pg.waitForSelector('#vlUnlock',{state:'visible'});
await B.pg.fill('#vlPin','135791'); await B.pg.press('#vlPin','Enter'); await waitApp(B.pg);
assert(true,'B ahora abre con el PIN nuevo');
await B.pg.screenshot({path:'/tmp/alta-e2e.png'});
// A está escribiendo cuando llegan datos de B -> barra, sin recargar
await A.pg.evaluate(()=>{ closeConfigModal(); switchView('citas'); }); await A.pg.fill('#citMotivo','control');
await B.pg.evaluate(()=>{ currentRxItems=[{generico:'z',dosis:'1'}]; document.getElementById('rxPacNombre').value='Rosa Paz'; saveToHistorial(); Vault.syncTap(); });
await B.pg.waitForTimeout(1200);
await A.pg.evaluate(()=>{ document.dispatchEvent(new Event('visibilitychange')); });
await A.pg.waitForTimeout(1500);
assert(await A.pg.isVisible('#vaultUpdateBar') && (await A.pg.inputValue('#citMotivo'))==='control', 'A con texto escrito: barra de aviso, no pierde lo escrito');
await A.pg.screenshot({path:'/tmp/alta-e2e.png'});
console.log('uploads',drive.uploads,'errors',errs);
await b.close();})().catch(e=>{console.error(e);console.log('errors',errs);process.exit(1)});
