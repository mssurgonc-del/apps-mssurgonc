// Prueba de extremo a extremo con Google Drive simulado: apertura sin PIN, migración de datos
// antiguos, PIN de la versión anterior pedido una sola vez, sincronización entre dos dispositivos.
const {chromium}=require('playwright-core');
const BASE=process.env.BASE || 'http://localhost:8765/';
const assert=(c,m)=>{ if(!c){ console.log('FAIL:',m); process.exitCode=1; } else console.log('ok:',m); };
const drive={file:null, uploads:0};
const GIS_STUB=`window.google={accounts:{oauth2:{initTokenClient:(o)=>({requestAccessToken:()=>setTimeout(()=>o.callback({access_token:'tok',expires_in:3600}),10)}),revoke:()=>{}}}};`;
async function setupRoutes(ctx){
  await ctx.route('https://accounts.google.com/gsi/client', r=>r.fulfill({body:GIS_STUB, contentType:'text/javascript'}));
  await ctx.route('https://www.googleapis.com/**', async r=>{
    const u=new URL(r.request().url()), m=r.request().method();
    if(u.pathname==='/drive/v3/files' && m==='GET') return r.fulfill({json:{files: drive.file?[{id:'F1'}]:[]}});
    if(u.pathname==='/drive/v3/files/F1' && m==='GET') return r.fulfill({body:drive.file, contentType:'application/json'});
    if(u.pathname==='/upload/drive/v3/files' && m==='POST'){ const parts=r.request().postData().split(/--altaq\d+/); drive.file=parts[2].split('\r\n\r\n')[1].replace(/\r\n$/,''); drive.uploads++; return r.fulfill({json:{id:'F1'}}); }
    if(u.pathname==='/upload/drive/v3/files/F1' && m==='PATCH'){ drive.file=r.request().postData(); drive.uploads++; return r.fulfill({json:{id:'F1'}}); }
    r.fulfill({status:404});
  });
}
const errs=[];
async function newDevice(b){ const ctx=await b.newContext({viewport:{width:390,height:844}}); await setupRoutes(ctx); const pg=await ctx.newPage(); pg.on('pageerror',e=>errs.push(e.message)); return {ctx,pg}; }
const waitApp=pg=>pg.waitForFunction(()=>{ try{ return Array.isArray(historial); }catch(e){ return false; } }, null, {timeout:20000});
const hist=pg=>pg.evaluate(()=>historial.map(h=>h.paciente));
const answer=async(pg,v)=>{ await pg.waitForSelector('#vaultAsk',{state:'visible'}); await pg.fill('#vaskPin',v); await pg.click('#vaskOk'); await pg.waitForTimeout(100); };
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
// ===== A: datos de la versión sin cifrar → abre directo, sin PIN =====
const A=await newDevice(b);
await A.pg.goto(BASE+'tests/legacy-v18.html');
await A.pg.evaluate(()=>{
  localStorage.setItem('altaApp_historialRecetas', JSON.stringify([{id:'rx_1700000000001',fecha:'2026-10-01',paciente:'Ana Pérez',edad:'45',sexo:'F',dx:'CPT',cirugia:'Tiroidectomía total',items:[],firmaTipo:'manual'}]));
  localStorage.setItem('altaApp_doctorConfig', JSON.stringify({nombre:'Dr. Prueba', firma:'data:image/png;base64,'+'A'.repeat(200000)}));
  localStorage.setItem('altaApp_medCombos', JSON.stringify({"Tiroidectomía total":[{generico:"Carbonato de calcio + Vitamina D",dosis:"1 tableta",frecuencia:"c/12h",duracion:"10 días (ajustar según calcio sérico)",cantidad:"20 tabletas"}]}));
  localStorage.setItem('altaApp_pinHash','h123'); localStorage.setItem('altaApp_pinEnabled','true');
});
await A.pg.goto(BASE); await waitApp(A.pg);
assert(!(await A.pg.isVisible('#vaultLock')), 'abre sin pedir PIN');
assert(JSON.stringify(await hist(A.pg))==='["Ana Pérez"]', 'historial antiguo migrado');
const ls=await A.pg.evaluate(()=>Object.keys(localStorage).sort());
assert(!ls.includes('altaApp_historialRecetas') && !ls.includes('altaApp_pinHash') && ls.includes('altaApp_vault') && ls.includes('altaApp_deviceKey'), 'datos sin cifrar eliminados: '+ls.join(','));
assert(!(await A.pg.evaluate(()=>localStorage.getItem('altaApp_vault'))).includes('Ana Pérez'), 'bóveda no contiene texto legible');
await A.pg.evaluate(()=>closeConfigModal());
await A.pg.selectOption('#rxCirugia','Tiroidectomía total');
const calc=await A.pg.evaluate(()=>currentRxItems.find(i=>i.generico.startsWith('Carbonato')));
assert(calc && !calc.frecuencia && !calc.duracion && !calc.cantidad && calc.dosis==='1 tableta', 'calcio sin frecuencia, cantidad ni duración: '+JSON.stringify(calc&&[calc.frecuencia,calc.duracion,calc.cantidad]));
await A.pg.evaluate(()=>{ document.getElementById('rxPacNombre').value='Luis Gómez'; saveToHistorial(); });
await A.pg.waitForTimeout(400);
await A.pg.reload(); await waitApp(A.pg);
assert(!(await A.pg.isVisible('#vaultLock')) && JSON.stringify(await hist(A.pg))==='["Luis Gómez","Ana Pérez"]', 'al volver a abrir: sin PIN y con los datos');
// ===== Bóveda con PIN de la versión anterior: se pide una sola vez =====
const O=await newDevice(b);
await O.pg.goto(BASE+'tests/legacy-v18.html');
await O.pg.evaluate(async()=>{
  const te=new TextEncoder(), b64=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
  const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  const base=await crypto.subtle.importKey('raw',te.encode('246810'),'PBKDF2',false,['deriveKey']);
  const k=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const payload={items:{altaApp_historialRecetas:{v:JSON.stringify([{id:'rx_1700000000009',paciente:'Pedro Viejo',items:[]}]),t:5}},tomb:{}};
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,te.encode(JSON.stringify(payload)));
  localStorage.setItem('altaApp_vault', JSON.stringify({v:1,kdf:'PBKDF2-SHA256',iter:600000,salt:b64(salt),iv:b64(iv),ct:b64(ct),savedAt:Date.now()}));
});
await O.pg.goto(BASE); await O.pg.waitForSelector('#vlUnlock',{state:'visible'});
assert((await O.pg.textContent('#vlUnlock')).includes('una última vez'), 'PIN anterior: aviso de última vez');
await O.pg.fill('#vlPin','000000'); await O.pg.press('#vlPin','Enter');
await O.pg.waitForFunction(()=>document.getElementById('vlMsg').textContent.includes('incorrecto')); assert(true,'PIN incorrecto rechazado');
await O.pg.fill('#vlPin','246810'); await O.pg.press('#vlPin','Enter'); await waitApp(O.pg);
assert(JSON.stringify(await hist(O.pg))==='["Pedro Viejo"]', 'abre con el PIN anterior');
await O.pg.reload(); await waitApp(O.pg);
assert(!(await O.pg.isVisible('#vaultLock')), 'después ya no pide PIN');
// ===== Conectar Drive en A: crea la clave de sincronización =====
await A.pg.evaluate(()=>{ openConfigModal(); switchConfigTab('seguridad'); });
await A.pg.click('text=Conectar Google Drive');
await answer(A.pg,'12345'); await A.pg.waitForTimeout(200);       // corta → se rechaza y vuelve a pedir
await answer(A.pg,'135791'); await answer(A.pg,'135790');          // no coinciden
await answer(A.pg,'135791'); await answer(A.pg,'135791');
await A.pg.waitForFunction(()=>document.getElementById('syncChip').textContent.includes('✓'), null, {timeout:20000});
assert(drive.file && !drive.file.includes('Luis'), 'Drive recibió solo datos cifrados');
await A.pg.evaluate(()=>closeConfigModal());
// ===== B: dispositivo nuevo; abre vacío, conecta y trae los datos =====
const B=await newDevice(b);
await B.pg.goto(BASE); await waitApp(B.pg);
assert(JSON.stringify(await hist(B.pg))==='[]', 'B abre directo, vacío');
await B.pg.waitForFunction(()=>!!window.google);
await B.pg.evaluate(()=>{ closeConfigModal(); openConfigModal(); switchConfigTab('seguridad'); });
await B.pg.click('text=Conectar Google Drive');
await answer(B.pg,'111111'); await answer(B.pg,'135791');
await B.pg.waitForTimeout(3000); await waitApp(B.pg);
assert(JSON.stringify(await hist(B.pg))==='["Luis Gómez","Ana Pérez"]', 'B recibe el historial de A: '+await hist(B.pg));
assert((await B.pg.evaluate(()=>doctorConfig.nombre))==='Dr. Prueba', 'B recibe el perfil');
await B.pg.reload(); await waitApp(B.pg);
assert(!(await B.pg.isVisible('#vaultLock')) && (await hist(B.pg)).length===2, 'B vuelve a abrir sin pedir nada');
// B guarda una receta y borra la de Ana
await B.pg.evaluate(()=>{ currentRxItems=[{generico:'x',dosis:'1'}]; document.getElementById('rxPacNombre').value='Marta Ruiz'; saveToHistorial(); });
await B.pg.evaluate(()=>{ historial=historial.filter(x=>x.paciente!=='Ana Pérez'); saveJSON(LS_KEYS.historial, historial); });
await B.pg.waitForTimeout(300); await B.pg.evaluate(()=>Vault.syncTap()); await B.pg.waitForTimeout(1000);
await A.pg.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
await A.pg.waitForTimeout(1500);
if(await A.pg.isVisible('#vaultUpdateBar')) await A.pg.click('#vaultUpdateBar button');
await A.pg.waitForTimeout(1500); await waitApp(A.pg);
assert(JSON.stringify(await hist(A.pg))==='["Marta Ruiz","Luis Gómez"]', 'A recibe lo de B y el borrado: '+await hist(A.pg));
await A.pg.evaluate(()=>{ currentRxItems=[{generico:'y',dosis:'1'}]; document.getElementById('rxPacNombre').value='Pedro Sol'; saveToHistorial(); });
await A.pg.waitForTimeout(300); await A.pg.evaluate(()=>Vault.syncTap()); await A.pg.waitForTimeout(1000);
await B.pg.evaluate(()=>Vault.syncTap()); await B.pg.waitForTimeout(1000);
await B.pg.evaluate(()=>Vault.reloadNow()); await B.pg.waitForTimeout(1500); await waitApp(B.pg);
assert(JSON.stringify(await hist(B.pg))==='["Pedro Sol","Marta Ruiz","Luis Gómez"]', 'B tiene todo, sin resucitar borrados: '+await hist(B.pg));
// ===== Cambio de clave en A → B la pide una vez =====
await A.pg.evaluate(()=>{ openConfigModal(); switchConfigTab('seguridad'); document.querySelector('#syncOnBox details').open=true; });
await A.pg.fill('#cpCur','135791'); await A.pg.fill('#cpNew1','975310'); await A.pg.fill('#cpNew2','975310');
await A.pg.click('button:has-text("Cambiar clave")'); await A.pg.waitForTimeout(4000);
assert(JSON.parse(drive.file).salt===JSON.parse(await A.pg.evaluate(()=>localStorage.getItem('altaApp_vault'))).salt, 'Drive quedó con la clave nueva');
await B.pg.reload(); await waitApp(B.pg);
await B.pg.evaluate(()=>{ Vault.syncTap(); });
await answer(B.pg,'975310'); await B.pg.waitForTimeout(2000);
assert((await B.pg.textContent('#syncChip')).includes('✓'), 'B combina tras ingresar la clave nueva');
await B.pg.reload(); await waitApp(B.pg);
assert(!(await B.pg.isVisible('#vaultLock')), 'B sigue abriendo sin pedir nada');
// ===== A escribiendo cuando llegan datos → aviso, no pierde lo escrito =====
await A.pg.evaluate(()=>{ closeConfigModal(); switchView('citas'); }); await A.pg.fill('#citMotivo','control');
await B.pg.evaluate(()=>{ currentRxItems=[{generico:'z',dosis:'1'}]; document.getElementById('rxPacNombre').value='Rosa Paz'; saveToHistorial(); Vault.syncTap(); });
await B.pg.waitForTimeout(1500);
await A.pg.evaluate(()=>document.dispatchEvent(new Event('visibilitychange'))); await A.pg.waitForTimeout(1500);
assert(await A.pg.isVisible('#vaultUpdateBar') && (await A.pg.inputValue('#citMotivo'))==='control', 'A con texto escrito: aviso, sin perder lo escrito');
console.log('uploads',drive.uploads,'errors',errs);
await b.close();})().catch(e=>{console.error(e);console.log('errors',errs);process.exit(1)});
