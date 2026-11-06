/* Hoja membretada común a las apps que hacen documentos (Constancias y Alta Quirúrgica).
   Fuente única: shared/ms-membrete.js. scripts/sync-ui.py la copia dentro de cada app entre
   los marcadores MS-MEMBRETE:INICIO / MS-MEMBRETE:FIN.
   La imagen se guarda solo en el aparato (localStorage). Las apps están en la misma dirección web,
   así que la hoja que se carga en una sirve también para la otra. Nunca va en el código publicado. */
const MS_MEMB = { img:'ms_membrete', on:'ms_membrete_on', marg:'ms_membrete_margenes' };
const MS_MEMB_DPI = 150, MS_MEMB_W = 1275, MS_MEMB_H = 1650; // carta a 150 ppp

function msMembLeer(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function msMembEscribir(k, v){ try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; }catch(e){ return false; } }

/* Hoja guardada en este aparato (o null). */
function msMembreteGuardado(){
  const img = msMembLeer(MS_MEMB.img);
  if(!img) return null;
  let m = {};
  try{ m = JSON.parse(msMembLeer(MS_MEMB.marg) || '{}'); }catch(e){}
  return { img, top: m.top || 1.8, bottom: m.bottom || 1.4 };
}
/* Hoja que se debe usar en los documentos: solo si hay una guardada y está elegida. */
function msMembrete(){
  return msMembLeer(MS_MEMB.on) === '1' ? msMembreteGuardado() : null;
}

/* Calcula dónde termina el encabezado y dónde empieza el pie. Busca renglones con tinta oscura;
   el dibujo de fondo de color claro (marca de agua) no cuenta. Devuelve pulgadas de margen. */
function msMembreteDetectar(ctx, W, H){
  const datos = ctx.getImageData(0, 0, W, H).data;
  const oscuro = new Array(H).fill(false);
  for(let y = 0; y < H; y++){
    let n = 0;
    for(let x = 0; x < W; x++){
      const i = (y*W + x)*4;
      const lum = 0.299*datos[i] + 0.587*datos[i+1] + 0.114*datos[i+2];
      if(lum < 170 && ++n > 2){ oscuro[y] = true; break; }
    }
  }
  let finEnc = -1, iniPie = H;
  for(let y = 0; y < H*0.35; y++) if(oscuro[y]) finEnc = y;
  for(let y = H-1; y > H*0.65; y--) if(oscuro[y]) iniPie = y;
  const dpi = H/11;
  const top = finEnc < 0 ? 0.9 : Math.max(0.9, finEnc/dpi + 0.3);
  const bottom = iniPie >= H ? 0.8 : Math.max(0.8, (H - iniPie)/dpi + 0.25);
  return { top: Math.round(top*100)/100, bottom: Math.round(bottom*100)/100 };
}

/* Carga una imagen (PNG o JPG), la lleva a tamaño carta, calcula los márgenes y la guarda. */
function msMembreteCargar(file){
  return new Promise((resolve, reject)=>{
    if(!file || !/^image\/(png|jpe?g)$/.test(file.type)){ reject(new Error('Use una imagen PNG o JPG. Si su hoja está en Word o PDF, conviértala primero a imagen.')); return; }
    const fr = new FileReader();
    fr.onerror = ()=>reject(new Error('No se pudo leer el archivo.'));
    fr.onload = ()=>{
      const img = new Image();
      img.onerror = ()=>reject(new Error('No se pudo abrir la imagen.'));
      img.onload = ()=>{
        const c = document.createElement('canvas'); c.width = MS_MEMB_W; c.height = MS_MEMB_H;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, MS_MEMB_W, MS_MEMB_H);
        ctx.drawImage(img, 0, 0, MS_MEMB_W, MS_MEMB_H);
        const m = msMembreteDetectar(ctx, MS_MEMB_W, MS_MEMB_H);
        const url = c.toDataURL('image/jpeg', 0.85);
        if(!msMembEscribir(MS_MEMB.img, url)){ reject(new Error('No hay espacio en este aparato para guardar la hoja. Pruebe con una imagen más liviana.')); return; }
        msMembEscribir(MS_MEMB.marg, JSON.stringify(m));
        msMembEscribir(MS_MEMB.on, '1');
        const proporcion = img.width / img.height, carta = 8.5/11;
        resolve({ margenes: m, aviso: Math.abs(proporcion - carta) > 0.04 ? 'La imagen no tiene la proporción de una hoja carta; se estiró para llenarla. Revise un documento antes de usarla.' : '' });
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function msMembreteRecalcular(){
  const g = msMembreteGuardado(); if(!g) return Promise.resolve(null);
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = ()=>{
      const c = document.createElement('canvas'); c.width = MS_MEMB_W; c.height = MS_MEMB_H;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, MS_MEMB_W, MS_MEMB_H);
      const m = msMembreteDetectar(ctx, MS_MEMB_W, MS_MEMB_H);
      msMembEscribir(MS_MEMB.marg, JSON.stringify(m)); resolve(m);
    };
    img.onerror = ()=>resolve(null);
    img.src = g.img;
  });
}

/* Panel de ajustes, igual en las dos apps. */
function msMembretePanelHTML(){
  const g = msMembreteGuardado(), usar = !!msMembrete();
  const cm = v => (Math.round(v*2.54*10)/10).toString();
  return `
  <div class="ms-memb">
    <div class="ms-label" style="font-size:14px;color:var(--ms-ink);margin-bottom:8px;">Qué usar como encabezado de los documentos</div>
    <div class="ms-seg" role="group" aria-label="Qué usar como encabezado">
      <button type="button" id="msMembDatos" aria-pressed="${!usar}">Datos del médico</button>
      <button type="button" id="msMembHoja" aria-pressed="${usar}">Hoja membretada</button>
    </div>
    ${g ? `
    <div class="ms-memb-fila">
      <div class="ms-memb-mini" aria-hidden="true">
        <img src="${g.img}" alt="">
        <span class="ms-memb-zona" style="top:0;height:${g.top/11*100}%"></span>
        <span class="ms-memb-zona" style="bottom:0;height:${g.bottom/11*100}%"></span>
      </div>
      <div class="ms-memb-campos">
        <div class="ms-memb-nota">El texto va en el espacio blanco del centro. Lo sombreado queda libre para su encabezado y su pie.</div>
        <label class="ms-label" for="msMembTop">Espacio para el encabezado (cm)</label>
        <input class="ms-input" type="number" id="msMembTop" min="1" max="10" step="0.1" inputmode="decimal" value="${cm(g.top)}">
        <label class="ms-label" for="msMembBot" style="margin-top:8px;">Espacio para el pie (cm)</label>
        <input class="ms-input" type="number" id="msMembBot" min="1" max="10" step="0.1" inputmode="decimal" value="${cm(g.bottom)}">
        <button type="button" class="ms-btn ms-btn-ghost" id="msMembAuto" style="min-height:36px;padding:0;margin-top:6px;">Calcular de nuevo</button>
      </div>
    </div>` : `
    <div class="ms-memb-nota" style="margin-top:10px;">Cargue su hoja membretada como imagen PNG o JPG de tamaño carta. La app calcula sola dónde termina el encabezado y dónde empieza el pie.</div>`}
    <div class="ms-memb-botones">
      <label class="ms-btn ms-btn-secondary" for="msMembFile" style="flex:1;">${g ? 'Cambiar hoja' : 'Cargar hoja'}</label>
      <input type="file" id="msMembFile" accept="image/png,image/jpeg" hidden>
      ${g ? `<button type="button" class="ms-btn ms-btn-danger" id="msMembQuitar" style="min-height:48px;">Quitar hoja</button>` : ''}
    </div>
    <div class="ms-memb-nota">Se guarda solo en este aparato y sirve para Constancias y Alta Quirúrgica. En otro teléfono o computadora hay que cargarla otra vez.</div>
    <div class="ms-memb-error" id="msMembMsg" role="status"></div>
  </div>`;
}
/* Conecta los botones del panel. alCambiar() vuelve a dibujar la pantalla de la app. */
function msMembreteConectar(alCambiar, avisar){
  const $ = id => document.getElementById(id);
  const msg = t => { const el = $('msMembMsg'); if(el) el.textContent = t || ''; };
  if(!$('msMembHoja')) return;
  $('msMembDatos').onclick = ()=>{ msMembEscribir(MS_MEMB.on, '0'); alCambiar(); };
  $('msMembHoja').onclick = ()=>{
    if(!msMembreteGuardado()){ $('msMembFile').click(); return; }
    msMembEscribir(MS_MEMB.on, '1'); alCambiar();
  };
  $('msMembFile').onchange = async e=>{
    const f = e.target.files && e.target.files[0]; if(!f) return;
    try{
      const r = await msMembreteCargar(f);
      alCambiar();
      if(avisar) avisar(r.aviso || 'Hoja membretada guardada');
    }catch(err){ msg(err.message); }
  };
  const guardarMargen = ()=>{
    const t = parseFloat($('msMembTop').value), b = parseFloat($('msMembBot').value);
    if(!(t >= 1 && t <= 10 && b >= 1 && b <= 10)){ msg('Use valores entre 1 y 10 cm.'); return; }
    msMembEscribir(MS_MEMB.marg, JSON.stringify({ top: Math.round(t/2.54*100)/100, bottom: Math.round(b/2.54*100)/100 }));
    alCambiar();
  };
  if($('msMembTop')){ $('msMembTop').onchange = guardarMargen; $('msMembBot').onchange = guardarMargen; }
  if($('msMembAuto')) $('msMembAuto').onclick = async ()=>{ await msMembreteRecalcular(); alCambiar(); };
  if($('msMembQuitar')) $('msMembQuitar').onclick = ()=>{
    const b = $('msMembQuitar');
    if(b.dataset.confirmar !== '1'){ b.dataset.confirmar = '1'; b.textContent = 'Toque otra vez para quitar'; return; }
    msMembEscribir(MS_MEMB.img, null); msMembEscribir(MS_MEMB.marg, null); msMembEscribir(MS_MEMB.on, '0');
    alCambiar(); if(avisar) avisar('Hoja membretada quitada');
  };
}
