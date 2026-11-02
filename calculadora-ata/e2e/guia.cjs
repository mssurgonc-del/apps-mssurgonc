// Prueba en navegador de la guía (inicio, «Tenga a mano», «Falta llenar»). Sirva dist/ y corra:
// NODE_PATH=<playwright-core> BASE=http://localhost:8770/ node e2e/guia.cjs
const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const pg=await (await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto(process.env.BASE||'http://localhost:8770/'); await pg.waitForTimeout(600);
ok(await pg.isVisible('text=¿Qué desea hacer?'),'abre en «¿Qué desea hacer?»');
await pg.click('text=Tengo el reporte de patología'); await pg.waitForTimeout(200);
ok((await pg.textContent('[data-testid=guia]')).includes('Tenga a mano:'),'muestra qué tener a mano');
const n=async()=>pg.$$eval('[data-testid=faltan] button',e=>e.length).catch(()=>0);
ok(await n()===10,'patología: faltan 10 datos al inicio ('+await n()+')');
await pg.click('button:has-text("< 55 años")'); await pg.waitForTimeout(100);
ok(await n()===9,'tocar la edad la confirma');
await pg.click('button[aria-pressed]:has-text("Células Altas")').catch(()=>{});
await pg.locator('[data-campo="-"] button').first().click(); await pg.waitForTimeout(100);
ok(await n()===9,'componentes coexistentes (opcional) no confirman la histología');
await pg.locator('button[data-no-campo][aria-label^="Qué significa"]').first().click(); await pg.waitForTimeout(100);
ok(await n()===9,'abrir una explicación (i) no confirma nada');
await pg.click('button:has-text("PTC Clásico")'); await pg.waitForTimeout(100);
ok(await n()===8,'histología confirmada');
ok((await pg.textContent('[data-testid=barra-faltan]')).includes('Faltan 8 datos'),'la barra de resultado avisa que es provisional');
await pg.click('[data-testid=faltan] button:has-text("Ganglios (N)")'); await pg.waitForTimeout(300);
ok(await pg.$eval('[data-campo="nodes"]',e=>e.classList.contains('campo-resaltado')),'tocar un dato faltante lleva a él y lo resalta');
for (const k of ['size','ete','nodes','vi','margins','focality','metastasis','mol']) {
  await pg.locator(`[data-campo="${k}"]`).locator('xpath=following::button[not(@data-no-campo)][1]').click(); await pg.waitForTimeout(60);
}
ok(!(await pg.isVisible('[data-testid=barra-faltan]')),'sin faltantes la barra ya no avisa');
ok(await pg.isVisible('[data-testid=completo]'),'con todo tocado: «Datos completos» ('+await n()+' faltan)');
// Nódulo: el diámetro precargado no cuenta hasta tocarlo; «Ninguno» confirma focos
await pg.click('nav button:has-text("TI-RADS")'); await pg.waitForTimeout(150);
ok(await n()===6,'TI-RADS: faltan 6');
for (const k of ['comp','echo','shape','margin']) { await pg.locator(`[data-campo="${k}"] + select`).click(); await pg.keyboard.press('Escape'); }
await pg.click('button:has-text("Ninguno (o artefactos")'); await pg.fill('[data-campo="sizeCm"] + input','2.1'); await pg.waitForTimeout(150);
ok(await pg.isVisible('[data-testid=completo]'),'TI-RADS completo tras llenar ('+await pg.textContent('[data-testid=guia]').then(t=>t.slice(-80))+')');
await pg.click('[data-testid=guia] button:has-text("Cambiar")'); await pg.waitForTimeout(150);
ok(await pg.isVisible('text=¿Qué desea hacer?'),'«Cambiar» vuelve al inicio');
await pg.click('text=Tengo el reporte de patología'); await pg.waitForTimeout(150);
ok(await pg.isVisible('[data-testid=completo]'),'al volver conserva lo confirmado');
await pg.click('header button:has-text("Nuevo")'); await pg.waitForTimeout(200);
ok(await pg.isVisible('text=¿Qué desea hacer?'),'«Nuevo paciente» vuelve al inicio');
await pg.click('text=Tengo el reporte de patología'); await pg.waitForTimeout(150);
ok(await n()===10,'«Nuevo paciente» borra lo confirmado');
await pg.screenshot({path:process.env.SHOT||'/tmp/guia.png'});
console.log('errors',errs); await b.close();})();
