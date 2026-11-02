// Procedimientos fuera del arancel: agregar, guardar, buscar y borrar.
const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const num=s=>parseFloat(s.replace(/[^\d.]/g,'').replace(/^\./,''));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(process.env.BASE||'http://localhost:8768/'); await pg.waitForTimeout(500);
await pg.fill('#searchInput','tiroidectomia robotica'); await pg.waitForTimeout(250);
ok((await pg.textContent('#resultsList')).includes('Procedimiento que no está en el arancel'),'sin resultados: sugiere agregarlo');
await pg.click('#btnPropio'); ok(await pg.inputValue('#propioNombre')==='tiroidectomia robotica','el formulario toma lo que buscó');
await pg.fill('#propioNombre','Tiroidectomía robótica'); await pg.fill('#propioValor','30000');
await pg.click('#propioForm button[type=submit]'); await pg.waitForTimeout(200);
ok(await pg.isHidden('#propioForm'),'el formulario se cierra');
await pg.click('#cartTab'); await pg.waitForTimeout(200);
ok((await pg.textContent('#cartList')).includes('Tiroidectomía robótica') && num(await pg.textContent('#cirujanoSin'))===30000,'entra al presupuesto con su valor');
await pg.click('#btnCloseCart');
await pg.fill('#searchInput','robot'); await pg.waitForTimeout(250);
ok(await pg.isVisible('.result-row[data-codigo="P-1"] .badge-propio'),'se puede volver a buscar, con etiqueta "Propio"');
await pg.reload(); await pg.waitForTimeout(500); await pg.fill('#searchInput','robot'); await pg.waitForTimeout(250);
ok(await pg.isVisible('.result-row[data-codigo="P-1"]'),'se conserva al reabrir');
// sin guardar
await pg.click('#btnPropio'); await pg.fill('#propioNombre','Procedimiento de una vez'); await pg.uncheck('#propioGuardar'); await pg.click('#propioForm button[type=submit]'); await pg.waitForTimeout(200);
await pg.fill('#searchInput','de una vez'); await pg.waitForTimeout(250);
ok(!(await pg.isVisible('.result-row')),'sin marcar "Guardar" no queda en la búsqueda');
await pg.click('#cartTab'); await pg.waitForTimeout(200);
ok(await pg.isVisible('.manual-val'),'sin valor: pide escribirlo en el presupuesto');
await pg.click('#btnCloseCart');
// borrar desde Ajustes
await pg.click('#btnSettings'); await pg.waitForTimeout(200);
ok((await pg.textContent('#propiosLista')).includes('Tiroidectomía robótica'),'aparece en Ajustes');
await pg.click('#propiosLista button'); await pg.click('#propiosLista button'); await pg.waitForTimeout(200);
ok(!(await pg.textContent('#propiosLista')).includes('Tiroidectomía robótica'),'se puede borrar (dos toques)');
console.log('errors',errs); await b.close();})();
