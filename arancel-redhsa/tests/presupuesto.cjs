const {chromium}=require('playwright-core');
const ok=(c,m)=>{console.log((c?'ok: ':'FAIL: ')+m); if(!c) process.exitCode=1;};
const num=s=>parseFloat(s.replace(/[^\d.]/g,'').replace(/^\./,''));
const F='';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',ignoreDefaultArgs:['--headless=old'],args:['--no-sandbox','--headless=new']});
const pg=await (await b.newContext({viewport:{width:390,height:844}})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.goto((process.env.BASE||'http://localhost:8768/')); await pg.waitForTimeout(500);
const add=async c=>{await pg.fill('#searchInput',c); await pg.waitForTimeout(250); await pg.click(`.result-row[data-codigo="${c}"]`);};
// anexo
await pg.fill('#searchInput','cesárea'); await pg.waitForTimeout(250);
ok(await pg.$$eval('.result-row',e=>e.some(x=>x.querySelector('.badge-anexo'))) && await pg.$$eval('.result-row',e=>e.some(x=>!x.querySelector('.badge-anexo'))),'filas del anexo con etiqueta, las demás sin ella');
// paciente privado: redondeo y 1er ayudante 33%
await add('60240'); await add('38724'); await pg.click('#cartTab'); await pg.waitForTimeout(200);
ok(await pg.inputValue('#ayudantePct')==='33' && !(await pg.isChecked('#seguroToggle')),'privado: 1er ayudante 33 %, sin seguro');
const cir=num(await pg.textContent('#segPacienteCirujano')), tot=num(await pg.textContent('#segTotalPaciente'));
ok(cir%10===0 && tot%10===0,'privado: montos redondeados a la decena ('+cir+', '+tot+')');
// seguro: 30% y exacto
await pg.check('#seguroToggle'); await pg.waitForTimeout(150);
ok(await pg.inputValue('#ayudantePct')==='30','con seguro: 1er ayudante pasa a 30 %');
const cs=await pg.textContent('#segPacienteCirujano'); ok(/\.\d\d$/.test(cs) && num(cs)===13791.25,'con seguro: valor exacto sin redondear ('+cs+')');
await pg.fill('#copagoPct','30'); await pg.waitForTimeout(150);
// validez en el texto
await pg.evaluate(()=>{ navigator.share=undefined; navigator.clipboard.writeText=async t=>{window.__t=t}; });
await pg.click('#btnSharePatient'); await pg.waitForTimeout(200);
ok((await pg.evaluate(()=>window.__t)).includes('Válido por 30 días (hasta el '),'presupuesto con validez');
// vaciar: vuelve a privado, copago 20, ayudante 33
await pg.click('#btnClearCart'); await pg.click('#btnClearCart'); await pg.waitForTimeout(200);
ok(!(await pg.isChecked('#seguroToggle')) && await pg.inputValue('#copagoPct')==='20' && await pg.inputValue('#ayudantePct')==='33','vaciar: sin seguro, copago 20 %, ayudante 33 %');
await pg.click('#btnCloseCart');
// sin precio: valor manual
await add('21089'); await add('60240'); await pg.click('#cartTab'); await pg.waitForTimeout(200);
ok(await pg.isVisible('.manual-val'),'"Sin precio" muestra campo para escribir el valor');
await pg.fill('.manual-val','20000'); await pg.dispatchEvent('.manual-val','change'); await pg.waitForTimeout(200);
const base=num(await pg.textContent('#cirujanoSin')); console.log('base',base);
ok(base===20000+16150*0.5,'valor manual entra al 100/50/25 % (L 28,075)');
await pg.reload(); await pg.waitForTimeout(500); await pg.click('#cartTab'); await pg.waitForTimeout(200);
ok(await pg.inputValue('.manual-val')==='20000','el valor escrito se conserva');
console.log('errors',errs); await b.close();})();
