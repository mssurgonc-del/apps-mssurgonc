import React, { useState, useMemo } from 'react';
import { RECS } from './recs.js';
import {
  HISTO_OPTIONS, BETHESDA, TIRADS_COMP, TIRADS_FOCI,
  evaluateTirads, evaluatePostop, evaluateDynamic,
  INITIAL_POSTOP, INITIAL_DYNAMIC, INITIAL_SURG, INITIAL_NODULE,
} from './logic.js';

// --- ICONOS VECTORIALES INTEGRADOS (Cero dependencias externas) ---
const IconShield = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconActivity = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconScalpel = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>;
const IconCells = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="9" r="4"/><circle cx="8" cy="9" r="1"/><circle cx="16.5" cy="15.5" r="4.5"/><circle cx="16.5" cy="15.5" r="1.2"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const IconExcel = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconReset = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;

// --- Aclaraciones de siglas ganglionares (AJCC 8.ª, Tabla 6 del artículo ATA 2025) ---
const TIP_N1A = 'N1a: metástasis en ganglios del nivel VI o VII (pretraqueales, paratraqueales, prelaríngeos/Delphian o del mediastino superior), uni o bilaterales. Prefijo «c» (clínico): evidentes en el examen clínico o la ecografía antes de la cirugía, o claramente sospechadas por el cirujano. Prefijo «p» (patológico): confirmadas en el estudio histopatológico de la pieza.';
const TIP_N1B = 'cN1b: metástasis en ganglios cervicales laterales (niveles I, II, III, IV o V), uni, bilaterales o contralaterales, o en ganglios retrofaríngeos, evidentes en el examen clínico o la ecografía antes de la cirugía, o claramente sospechadas por el cirujano.';

// --- Códigos de recomendación (R32A, R15C…): al tocarlos muestran el texto de la guía ---
function RecTip({ code }) {
  const rec = RECS[code] || RECS[code.replace(/[A-H]$/, '')];
  const [pos, setPos] = useState(null);
  const btnRef = React.useRef(null);
  const tipRef = React.useRef(null);
  const timer = React.useRef(null);
  const hoverable = () => window.matchMedia('(hover: hover)').matches;
  const show = () => {
    clearTimeout(timer.current);
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(360, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8));
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const placeBelow = below >= 220 || below >= above;
    const maxH = Math.max(140, Math.min(420, placeBelow ? below : above));
    setPos(placeBelow ? { top: r.bottom + 6, left, w, maxH } : { bottom: window.innerHeight - r.top + 6, left, w, maxH });
  };
  const hide = () => { clearTimeout(timer.current); setPos(null); };
  const hideSoon = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setPos(null), 250); };
  React.useEffect(() => {
    if (!pos) return;
    const inside = (t) => btnRef.current?.contains(t) || tipRef.current?.contains(t);
    const onDown = (e) => { if (!inside(e.target)) hide(); };
    const onScroll = (e) => { if (!tipRef.current?.contains(e.target)) hide(); };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('scroll', onScroll, true); };
  }, [pos]);
  if (!rec) return code;
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Ver recomendación ${code}`}
        aria-expanded={!!pos}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); pos ? hide() : show(); }}
        onMouseEnter={() => { if (hoverable()) show(); }}
        onMouseLeave={() => { if (hoverable()) hideSoon(); }}
        className="inline p-0 m-0 bg-transparent border-0 font-[inherit] text-[inherit] leading-[inherit] underline decoration-dotted decoration-2 underline-offset-2 decoration-teal-500 cursor-help hover:text-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm"
      >
        {code}
      </button>
      {pos && (
        <span
          ref={tipRef}
          role="tooltip"
          onMouseEnter={() => clearTimeout(timer.current)}
          onMouseLeave={() => { if (hoverable()) hideSoon(); }}
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.w, maxHeight: pos.maxH }}
          className="fixed z-50 block overflow-y-auto overscroll-contain bg-slate-900 text-white text-left font-sans text-[11.5px] font-normal normal-case tracking-normal leading-snug p-3 rounded-lg shadow-xl"
        >
          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 mb-1">Recomendación {code} · ATA 2025</span>
          <span className="block">{rec.es}</span>
          <span className="block mt-2 pt-2 border-t border-white/15 text-[10.5px] italic text-slate-300">Texto original: {rec.en}</span>
        </span>
      )}
    </>
  );
}

// Convierte los códigos R del texto en RecTip. No entra en botones, campos ni componentes.
const REC_RE = /R\d{1,2}(?:\.\d)?[A-H]?/g;
function splitRecs(str) {
  const out = [];
  let last = 0, m;
  REC_RE.lastIndex = 0;
  while ((m = REC_RE.exec(str))) {
    const code = m[0];
    const prev = str[m.index - 1] || '';
    const next = str[m.index + code.length] || '';
    if (/[A-Za-z0-9.]/.test(prev) || /[a-z0-9]/.test(next) || /^R[0-2]$/.test(code) || !(RECS[code] || RECS[code.replace(/[A-H]$/, '')])) continue;
    if (m.index > last) out.push(str.slice(last, m.index));
    out.push(<RecTip key={m.index} code={code} />);
    last = m.index + code.length;
  }
  if (!out.length) return str;
  if (last < str.length) out.push(str.slice(last));
  return out;
}
const SKIP_TAGS = new Set(['button', 'option', 'select', 'textarea', 'input']);
function linkRecs(node) {
  if (typeof node === 'string') return splitRecs(node);
  if (Array.isArray(node)) return node.map(linkRecs);
  if (!React.isValidElement(node)) return node;
  if (node.type === React.Fragment) return React.cloneElement(node, undefined, ...React.Children.toArray(node.props.children).map(linkRecs));
  if (typeof node.type !== 'string' || SKIP_TAGS.has(node.type) || node.props.children == null) return node;
  const kids = React.Children.toArray(node.props.children).map(linkRecs);
  return React.cloneElement(node, undefined, ...kids);
}

// --- Círculo «!» con la definición de siglas: toque en móvil, hover o foco en PC ---
function InfoTip({ text, label }) {
  const [pos, setPos] = useState(null);
  const btnRef = React.useRef(null);
  const show = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(288, window.innerWidth - 16);
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 8)), w });
  };
  const hide = () => setPos(null);
  React.useEffect(() => {
    if (!pos) return;
    const close = (e) => { if (e.type !== 'pointerdown' || !btnRef.current?.contains(e.target)) hide(); };
    window.addEventListener('scroll', close, true);
    window.addEventListener('pointerdown', close);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('pointerdown', close); };
  }, [pos]);
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Qué significa ${label}`}
        aria-expanded={!!pos}
        onClick={(e) => { e.stopPropagation(); pos ? hide() : show(); }}
        onMouseEnter={(e) => { if (window.matchMedia('(hover: hover)').matches) show(); }}
        onMouseLeave={(e) => { if (window.matchMedia('(hover: hover)').matches) hide(); }}
        onBlur={hide}
        className="shrink-0 w-[18px] h-[18px] rounded-full bg-slate-200 hover:bg-teal-600 hover:text-white text-slate-700 text-[11px] font-black leading-none flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        !
      </button>
      {pos && (
        <span
          role="tooltip"
          style={{ top: pos.top, left: pos.left, width: pos.w }}
          className="fixed z-50 bg-slate-900 text-white text-[11px] font-medium leading-snug p-2.5 rounded-lg shadow-lg"
        >
          {text}
        </span>
      )}
    </>
  );
}

const TIER_STYLES = {
  low: { badge: 'bg-emerald-700 text-white', card: 'bg-emerald-50/90 border-emerald-300', text: 'text-emerald-900', band: 'bg-emerald-600' },
  lowint: { badge: 'bg-amber-600 text-white', card: 'bg-amber-50/90 border-amber-300', text: 'text-amber-900', band: 'bg-amber-500' },
  highint: { badge: 'bg-orange-600 text-white', card: 'bg-orange-50/90 border-orange-300', text: 'text-orange-950', band: 'bg-orange-600' },
  high: { badge: 'bg-red-700 text-white', card: 'bg-red-50/90 border-red-300', text: 'text-red-950', band: 'bg-red-700' },
  none: { badge: 'bg-slate-500 text-white', card: 'bg-slate-50 border-slate-300', text: 'text-slate-700', band: 'bg-slate-400' },
};

export default function App() {
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [activeTab, setActiveTab] = useState('postop'); // 'postop' | 'dynamic' | 'surgery' | 'nodule'
  const [undoSnap, setUndoSnap] = useState(null);
  const [showStudyGuide, setShowStudyGuide] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Estado Identificación / Fecha Investigación
  const [patientMeta, setPatientMeta] = useState({
    id: '',
    fecha: defaultDate,
  });

  // 1. Estado Posoperatorio (ATA 2025 Fig. 2 + AJCC 8)
  const [postop, setPostop] = useState(INITIAL_POSTOP);


  // 2. Estado Seguimiento Dinámico y Valores Bioquímicos Exactos (Tabla 9)
  const [dynamic, setDynamic] = useState(INITIAL_DYNAMIC);


  // 3. Estado Cirugía Preoperatoria (Tabla 5, R11-R25)
  const [surg, setSurg] = useState(INITIAL_SURG);


  // 4. Estado Nódulo (TI-RADS + Bethesda 2023)
  const [nodule, setNodule] = useState(INITIAL_NODULE);


  const resetAll = () => {
    setUndoSnap({ patientMeta, postop, dynamic, surg, nodule, activeTab });
    setPatientMeta({ id: '', fecha: defaultDate });
    setPostop(INITIAL_POSTOP);
    setDynamic(INITIAL_DYNAMIC);
    setSurg(INITIAL_SURG);
    setNodule(INITIAL_NODULE);
    setActiveTab('postop');
    window.scrollTo({ top: 0 });
    clearTimeout(window.__undoTimer);
    window.__undoTimer = setTimeout(() => setUndoSnap(null), 8000);
  };
  const undoReset = () => {
    if (!undoSnap) return;
    setPatientMeta(undoSnap.patientMeta); setPostop(undoSnap.postop); setDynamic(undoSnap.dynamic);
    setSurg(undoSnap.surg); setNodule(undoSnap.nodule); setActiveTab(undoSnap.activeTab);
    setUndoSnap(null);
  };

  const postopRes = useMemo(() => evaluatePostop(postop), [postop]);
  const dynRes = useMemo(() => evaluateDynamic(dynamic, postopRes.tier), [dynamic, postopRes.tier]);

  const copyTextSafe = (text, mode) => {
    const triggerSuccess = () => {
      setCopyFeedback(mode);
      setTimeout(() => setCopyFeedback(null), 2500);
    };

    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        triggerSuccess();
      } catch (e) {
        console.error('Error al copiar:', e);
      }
      document.body.removeChild(ta);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(triggerSuccess).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  };

  const handleExport = (mode) => {
    if (mode === 'emr') {
      let out = `📋 EVALUACIÓN CLÍNICA DE CÁNCER DE TIROIDES (GUÍAS ATA 2025)\n`;
      out += `📅 Fecha: ${patientMeta.fecha}${patientMeta.id ? ` | ID: ${patientMeta.id}` : ''}\n`;
      out += `──────────────────────────────────────────────────\n`;
      out += `1. ESTRATIFICACIÓN POSOPERATORIA INICIAL (ATA 2025 & AJCC 8.ª Ed.):\n`;
      out += `• Histotipo (OMS 5.ª ed.): ${postopRes.histObj?.full || 'NIFTP'}\n`;
      if (isPTCMain && coexistLabels.length) out += `• Componentes coexistentes (documentación; no modifican el riesgo calculado): ${coexistLabels.join(', ')}\n`;
      out += `• Estadio Anatómico T: p${postopRes.pT} | Mortalidad (AJCC 8.ª): ${postopRes.ajccStage}\n`;
      out += `• RIESGO DE RECURRENCIA ESTRUCTURAL ATA 2025: ${postopRes.label} (${postopRes.pct})\n`;
      out += `• Factores determinantes:\n  ${postopRes.drivers.join('\n  ')}\n\n`;
      out += `2. CONDUCTA DE YODO RADIACTIVO (I-131) [R32]:\n`;
      out += `• Indicación: ${postopRes.rai.rec}\n`;
      out += `• Actividad sugerida: ${postopRes.rai.act}\n`;
      out += `• Objetivo: ${postopRes.rai.goal}\n`;
      if (!postopRes.isNIFTP) out += `• Preparación y Rastreo: Estímulo preferido con rhTSH (meta TSH >30 µUI/mL, R34) y dieta baja en yodo por 1-2 semanas (R35). Realizar Rastreo Corporal Post-Terapia (RxWBS ± SPECT/CT) a los 2–10 días de la dosis (R37, R38).\n`;
      out += `\n`;
      out += `3. EVALUACIÓN DINÁMICA Y VIGILANCIA [R45–R48]:\n`;
      out += `• Laboratorios registrados: TSH: ${dynamic.tshExact || 'N/D'} µUI/mL | Tg basal: ${dynamic.tgBasal || 'N/D'} ng/mL | Tg estim: ${dynamic.tgStim || 'N/D'} ng/mL | TgAb: ${dynamic.tgAbExact || 'N/D'} UI/mL (${dynamic.tgAb})\n`;
      out += `• Categoría de Respuesta: ${dynRes.cat}\n`;
      out += `• Riesgo Residual Re-estimado: ${dynRes.residualRisk}\n`;
      out += `• Meta de TSH: ${dynRes.tshGoal}\n`;
      out += `• Plan de Seguimiento: ${dynRes.actionPlan}\n`;
      out += `──────────────────────────────────────────────────\n`;
      out += `Ref: Ringel MD, Sosa JA, et al. 2025 ATA Management Guidelines for Adult Patients with DTC. Thyroid 2025;35(8):841-985. Corrigendum: Thyroid 2025;35(11):1350 (doi: 10.1177/10507256251387671). Aplica a adultos con cáncer diferenciado de tiroides.`;
      copyTextSafe(out, 'emr');
    } else if (mode === 'excel') {
      const headers = [
        'Fecha', 'ID_Paciente', 'Grupo_Edad', 'Histologia_OMS2025', 'Patron_Folicular',
        'Tamano', 'ETE', 'Estadio_pT', 'Margenes', 'Invasion_Vascular', 'Focalidad',
        'Ganglios_N', 'LNR_Alto', 'Metastasis_M', 'Molecular', 'Componentes_Coexistentes', 'Riesgo_ATA2025',
        'Porcentaje_Recurrencia', 'Estadio_AJCC8', 'Ind_RAI', 'Dosis_RAI',
        'Tipo_Cirugia_Seg', 'TSH_Exacta_uUImL', 'Tg_Basal_ngmL', 'Tg_Estim_ngmL',
        'TgAb_Exacto_UImL', 'Tendencia_TgAb', 'Imagen_Seg', 'Respuesta_Dinamica_Tabla9',
        'Riesgo_Residual_Fig6'
      ];
      const row = [
        patientMeta.fecha,
        patientMeta.id || 'Anonimo',
        postop.ageGroup,
        postopRes.histObj?.label || 'NIFTP',
        postop.follPattern,
        postop.size,
        postop.ete,
        postopRes.pT,
        postop.margins,
        postop.vi,
        postop.focality,
        postop.nodes,
        postop.lnrHigh ? 'Si' : 'No',
        postop.metastasis,
        postop.mol,
        isPTCMain && coexistLabels.length ? coexistLabels.join(' + ') : 'Ninguno',
        postopRes.label,
        postopRes.pct,
        postopRes.ajccStage,
        postopRes.rai.rec,
        postopRes.rai.act,
        dynamic.surgeryType,
        dynamic.tshExact || 'ND',
        dynamic.tgBasal || 'ND',
        dynamic.tgStim || 'ND',
        dynamic.tgAbExact || 'ND',
        dynamic.tgAb,
        dynamic.imaging,
        dynRes.cat,
        dynRes.residualRisk
      ];
      copyTextSafe(headers.join('\t') + '\n' + row.join('\t'), 'excel');
    }
  };

  const coexistLabels = postop.coexist.map(id => HISTO_OPTIONS.find(h => h.id === id)?.label).filter(Boolean);
  const isPTCMain = ['ptc_low', 'ptc_agg'].includes(HISTO_OPTIONS.find(h => h.id === postop.histo)?.group);
  const curStyle = TIER_STYLES[postopRes.tier] || TIER_STYLES.low;
  const dynStyle = TIER_STYLES[dynRes.tier] || TIER_STYLES.low;
  const isFollSelected = postop.histo === 'ftc' || postop.histo === 'iefvptc' || postop.histo === 'otc';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-28 lg:pb-16">
      {/* ENCABEZADO COMPACTO */}
      <header className="bg-slate-900 text-white px-4 py-2 border-b-4 border-teal-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0 mr-auto">
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight leading-tight">ThyroidScore · ATA 2025</h1>
            <p className="hidden sm:block text-[11px] text-slate-400 leading-tight truncate">Ringel MD, Sosa JA, et al. Thyroid 2025;35(8):841–985 · Corrigendum 35(11):1350</p>
          </div>
          <div className="flex items-center gap-2 order-3 sm:order-none w-full sm:w-auto">
            <input
              type="date"
              aria-label="Fecha de evaluación"
              value={patientMeta.fecha}
              onChange={(e) => setPatientMeta({ ...patientMeta, fecha: e.target.value })}
              className="flex-1 sm:flex-none min-w-0 bg-slate-800 text-white text-xs font-mono px-2 py-1.5 rounded-lg border border-slate-600 focus:border-teal-400 focus:outline-none"
            />
            <input
              type="text"
              aria-label="ID o código del paciente (opcional)"
              placeholder="ID (opcional)"
              value={patientMeta.id}
              onChange={(e) => setPatientMeta({ ...patientMeta, id: e.target.value })}
              className="flex-1 sm:flex-none min-w-0 sm:w-32 bg-slate-800 text-white text-xs font-mono px-2 py-1.5 rounded-lg border border-slate-600 focus:border-teal-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowStudyGuide(!showStudyGuide)}
            aria-label="Guía de estudio ATA 2025"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${showStudyGuide ? 'bg-amber-300 text-amber-950 border-amber-300' : 'bg-transparent text-amber-200 border-amber-400/60 hover:bg-amber-400/10'}`}
          >
            <IconBook /> <span className="hidden sm:inline">Guía</span>
          </button>
          <button
            onClick={resetAll}
            aria-label="Nuevo paciente (borra todos los datos)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white"
          >
            <IconReset /> <span className="sm:hidden">Nuevo</span><span className="hidden sm:inline">Nuevo paciente</span>
          </button>
        </div>
      </header>

      {/* NAVEGACIÓN DE PESTAÑAS CLÍNICAS */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 grid grid-cols-5 gap-1 sm:gap-1.5">
          {[
            { id: 'nodule', icon: <IconSearch />, l: 'TI-RADS', s: 'Ecografía' },
            { id: 'bethesda', icon: <IconCells />, l: 'Bethesda', s: 'Citología' },
            { id: 'surgery', icon: <IconScalpel />, l: 'Cirugía', s: 'Preoperatoria' },
            { id: 'postop', icon: <IconShield />, l: 'Patología', s: 'Riesgo' },
            { id: 'dynamic', icon: <IconActivity />, l: 'Seguimiento', s: 'Respuesta' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); window.scrollTo({ top: 0 }); }}
              aria-current={activeTab === t.id ? 'page' : undefined}
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-1 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold transition-all ${
                activeTab === t.id ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.icon}
              <span className="flex flex-col items-center sm:items-start leading-tight">
                <span className="text-[10px] min-[400px]:text-[11px] sm:text-sm">{t.l}</span>
                <span className={`hidden md:block text-[10px] font-semibold ${activeTab === t.id ? 'text-teal-100' : 'text-slate-400'}`}>{t.s}</span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* AVISO DESHACER «NUEVO PACIENTE» */}
      {undoSnap && (
        <div className="fixed left-1/2 -translate-x-1/2 top-3 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          Datos borrados para el siguiente paciente.
          <button onClick={undoReset} className="font-black text-teal-300 underline">Deshacer</button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {linkRecs(<main className="max-w-7xl mx-auto px-4 pt-3">
        <p className="mb-3 text-[11px] leading-snug text-slate-600 bg-white/70 border border-slate-200 rounded-lg px-3 py-1.5">
          <b className="text-slate-800">Alcance:</b> adultos con cáncer diferenciado de tiroides (papilar, folicular/IEFVPTC, oncocítico). No aplica a carcinoma medular, anaplásico, linfoma ni a pacientes pediátricos.
        </p>
        
        {/* GUÍA DE ESTUDIO DESPLEGABLE */}
        {showStudyGuide && (
          <div className="mb-6 bg-white rounded-2xl border-2 border-teal-600 p-5 shadow-md">
            <h2 className="text-base font-black text-teal-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <IconBook /> Resumen de Aprendizaje Rápido — Cambios Clave ATA 2025
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 uppercase">1. Los 4 Niveles de Recurrencia Estructural (Fig. 2):</strong>
                <ul className="space-y-1.5 mt-1">
                  <li><span className="font-bold text-emerald-700">• Bajo (&lt;10%):</span> T1–T2 (≤4 cm) intratiroideo, unifocal, pN0 o ≤5 micrometástasis (todas ≤2 mm), márgenes R0 o R1 anterior. En FTC/OTC: mínimamente invasivo (solo cápsula).</li>
                  <li><span className="font-bold text-amber-700">• Bajo–Intermedio (10–15%):</span> Tumor T3a (&gt;4 cm intratiroideo), o T1–T2 con <b>1 solo factor</b>: ETE microscópica, cN1a o pN1a (&gt;2 mm o &gt;5 ganglios), margen R1 posterior, multifocalidad unilateral en PTC, o invasión vascular limitada (&lt;4 vasos) en FTC/OTC.</li>
                  <li><span className="font-bold text-orange-700">• Intermedio–Alto (≥16–30%):</span> cN1b lateral (&lt;3 cm), subtipo agresivo de PTC, invasión vascular en PTC, multifocalidad bilateral (&gt;1 cm), o <b>T1–T3a con ≥2 factores Bajo-Intermedio</b> (Fig. 2).</li>
                  <li><span className="font-bold text-red-700">• Alto (&gt;30%):</span> T3a + ETE microscópica, T3b (músculos pretiroideos), T4a/b, alto grado (PDTC/DHGTC), R2, cN1 ≥3 cm, extensión extranodal (ENE), M1, o FTC/OTC ampliamente invasivo o con ≥4 vasos.</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 uppercase">2. Puntos de Corte de Tiroglobulina y Desescalamiento (Tabla 9 y R48):</strong>
                <ul className="space-y-1.5 mt-1">
                  <li><span className="font-bold text-teal-800">• Tiroidectomía Total + RAI:</span> Excelente si Tg basal <b>&lt;0.2 ng/mL</b> (o estimulada &lt;1.0); Indeterminada <b>0.2–1.0</b> (estim. 1–10); Bioquímica Incompleta <b>&gt;1.0</b> (estim. &gt;10) o TgAb en ascenso.</li>
                  <li><span className="font-bold text-teal-800">• Tiroidectomía Total SIN RAI:</span> Excelente si Tg basal <b>&lt;2.5 ng/mL</b>; Indeterminada <b>2.5–5.0</b>; Bioquímica Incompleta <b>&gt;5.0 ng/mL</b>.</li>
                  <li><span className="font-bold text-teal-800">• Hemitiroidectomía (R30B / R48.6):</span> Una Tg única a las 6–12 semanas con TSH normal puede ser útil para asegurar que no esté inesperadamente elevada (punto de corte incierto), pero <b>no se recomienda medir Tg de rutina</b> en el seguimiento.</li>
                  <li><span className="font-bold text-teal-800">• Remisión Completa (R48):</span> En bajo riesgo tratado con tiroidectomía total (± RAI) con respuesta excelente sostenida, suspender US de cuello a los <b>5–8 años</b> y dar de alta del monitoreo bioquímico a los <b>10–15 años</b>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PESTAÑA 1 y 2: FLUJO POSOPERATORIO + DINÁMICO ==================== */}
        {(activeTab === 'postop' || activeTab === 'dynamic') && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA: ENTRADA DE DATOS RÁPIDA (7 COLUMNAS) */}
            <div className="lg:col-span-7 space-y-4">
              
              {activeTab === 'postop' ? (
                <>
                  {/* PASO 1: EDAD E HISTOLOGÍA CON BOTONES INDIVIDUALES */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                        1. Edad (Para AJCC 8.ª Ed. y Dosimetría R55)
                      </h3>
                      <button
                        onClick={() => setPostop(INITIAL_POSTOP)}
                        className="text-xs font-bold text-slate-500 hover:text-teal-700 flex items-center gap-1"
                      >
                        <IconReset /> Reiniciar
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[
                        { v: 'lt55', l: '< 55 años' },
                        { v: '55to70', l: '55 – 70 años' },
                        { v: 'gt70', l: '> 70 años (Alerta R55A)' }
                      ].map(o => (
                        <button
                          key={o.v}
                          onClick={() => setPostop({ ...postop, ageGroup: o.v })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            postop.ageGroup === o.v
                              ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>

                    <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      2. Subtipo Histológico Exacto (OMS 5.ª Ed.)
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase block mb-1">PTC — Subtipos No Agresivos</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => h.group === 'ptc_low').map(h => (
                            <span key={h.id} className="inline-flex items-center gap-1">
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id, coexist: postop.coexist.filter(c => c !== h.id) })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                            {h.info && <InfoTip text={h.info} label={h.label} />}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-orange-700 uppercase block mb-1">PTC — Subtipos Agresivos (Intermedio–Alto directo)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => h.group === 'ptc_agg').map(h => (
                            <span key={h.id} className="inline-flex items-center gap-1">
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id, coexist: postop.coexist.filter(c => c !== h.id) })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                            {h.info && <InfoTip text={h.info} label={h.label} />}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1">Espectro Folicular (FTC / IEFVPTC) y Oncocítico (OTC)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => h.group === 'foll' || h.group === 'otc').map(h => (
                            <span key={h.id} className="inline-flex items-center gap-1">
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id, coexist: postop.coexist.filter(c => c !== h.id) })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-blue-700 border-blue-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                            {h.info && <InfoTip text={h.info} label={h.label} />}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-red-700 uppercase block mb-1">Alto Grado / Especiales / Bajo Potencial (R1)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => ['high_grade', 'special', 'benign_pot'].includes(h.group)).map(h => (
                            <span key={h.id} className="inline-flex items-center gap-1">
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id, coexist: postop.coexist.filter(c => c !== h.id) })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                            {h.info && <InfoTip text={h.info} label={h.label} />}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {postop.histo !== 'dhgtc_pdtc' && postop.histo !== 'niftp' && (
                      <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postop.highGradeFeatures}
                          onChange={(e) => setPostop({ ...postop, highGradeFeatures: e.target.checked })}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>Rasgos de alto grado en el informe: ≥5 mitosis/2 mm² o necrosis tumoral (DHGTC) → Alto Riesgo</span>
                      </label>
                    )}

                    {isPTCMain && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[11px] font-black uppercase text-slate-600 block">Componentes coexistentes (opcional, solo documentación)</span>
                        <span className="text-[11px] text-slate-500 block mb-1.5 leading-snug">No modifica el riesgo calculado. Si el componente agresivo alcanza el criterio de subtipo en el informe, selecciónelo arriba como histología principal.</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => ['ptc_low', 'ptc_agg'].includes(h.group) && h.id !== postop.histo).map(h => {
                            const on = postop.coexist.includes(h.id);
                            return (
                              <button
                                key={h.id}
                                aria-pressed={on}
                                onClick={() => setPostop({ ...postop, coexist: on ? postop.coexist.filter(c => c !== h.id) : [...postop.coexist, h.id] })}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${on ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-300 border-dashed text-slate-600 hover:bg-slate-50'}`}
                              >
                                {on ? '✓ ' : '+ '}{h.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sub-selector exclusivo si elige FTC / IEFVPTC / OTC */}
                    {isFollSelected && (
                      <div className="mt-4 pt-3 border-t border-slate-200 bg-blue-50/60 p-3 rounded-xl">
                        <label className="block text-[11px] font-black uppercase text-blue-900 mb-2">
                          Patrón de Invasión Capsular/Parenquimatosa (FTC/OTC):
                        </label>
                        <div className="grid sm:grid-cols-3 gap-2">
                          {[
                            { v: 'mi', l: 'Mínimamente invasivo (Solo cápsula)' },
                            { v: 'ea', l: 'Encapsulado angioinvasivo' },
                            { v: 'wi', l: postop.histo === 'otc' ? 'Ampliamente invasivo (≥4 vasos o ≥4 focos capsulares con ETE mínima) (Alto Riesgo)' : 'Ampliamente invasivo (Alto Riesgo)' }
                          ].map(o => (
                            <button
                              key={o.v}
                              onClick={() => setPostop({ ...postop, follPattern: o.v })}
                              className={`p-2 rounded-lg text-xs font-bold border text-left transition-all ${
                                postop.follPattern === o.v ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-blue-200 text-slate-700'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PASO 2: TAMAÑO Y EXTENSIÓN EXTRATIROIDEA */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">3. Tamaño del Tumor Primario</h3>
                        <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Estadio derivado: p{postopRes.pT}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { v: 'lte1', l: '≤ 1 cm (T1a)' },
                          { v: '1to2', l: '> 1 – 2 cm (T1b)' },
                          { v: '2to4', l: '> 2 – 4 cm (T2)' },
                          { v: 'gt4', l: '> 4 cm (T3a)' }
                        ].map(o => (
                          <button
                            key={o.v}
                            onClick={() => setPostop({ ...postop, size: o.v })}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                              postop.size === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                        4. Extensión Extratiroidea (ETE)
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[
                          { v: 'none', l: 'Ausente (Intratiroideo)' },
                          { v: 'micro', l: 'Microscópica (Banda Bajo-Int; si es T3a sube a Alto)' },
                          { v: 'strap', l: 'Macroscópica a músculos pretiroideos (T3b → Alto)' },
                          { v: 't4a', l: 'Macroscópica a tráquea, laringe, esófago o NLR (T4a → Alto)' },
                          { v: 't4b', l: 'Macroscópica prevertebral / carótida / mediastino (T4b → Alto)' }
                        ].map(o => (
                          <button
                            key={o.v}
                            onClick={() => setPostop({ ...postop, ete: o.v })}
                            className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                              postop.ete === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PASO 3: GANGLIOS, INVASIÓN VASCULAR, MÁRGENES Y MULTIFOCALIDAD */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                        5. Estado Ganglionar Cervical (N)
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[
                          { v: 'n0', l: 'pN0 / cN0 [Bajo]' },
                          { v: 'n1a_micro', l: 'pN1a micrometástasis (≤ 5 ganglios, todos ≤ 2 mm) [Bajo; cuenta como N1 en AJCC]', tip: TIP_N1A, tl: 'pN1a' },
                          { v: 'n1a_mod', l: 'cN1a, o pN1a (> 5 ganglios o foco > 2 mm) [Bajo–Intermedio]', tip: TIP_N1A, tl: 'cN1a y pN1a' },
                          { v: 'n1b_lat', l: 'cN1b lateral clínicamente evidente (< 3 cm) [Intermedio–Alto]', tip: TIP_N1B, tl: 'cN1b' },
                          { v: 'big3cm', l: 'Cualquier ganglio metastásico ≥ 3 cm (cN1) [Alto Riesgo]' },
                          { v: 'ene', l: 'Extensión extranodal (ENE) del tumor metastásico [Alto Riesgo]' }
                        ].map(o => (
                          <div key={o.v} className="flex items-center gap-1">
                          <button
                            onClick={() => setPostop({ ...postop, nodes: o.v })}
                            className={`flex-1 h-full p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                              postop.nodes === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {o.l}
                          </button>
                          {o.tip ? <InfoTip text={o.tip} label={o.tl} /> : <span className="w-[18px] shrink-0" />}
                          </div>
                        ))}
                      </div>
                      <label className="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postop.lnrHigh}
                          onChange={(e) => setPostop({ ...postop, lnrHigh: e.target.checked })}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>Ratio Ganglionar (LNR = positivos/examinados) elevado, &gt; 0.25 – 0.5 (modulador, discusión R16/R28)</span>
                      </label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                          6. Invasión Vascular (Angioinvasión)
                        </h3>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { v: 'none', l: 'Ausente' },
                            { v: 'lim', l: isFollSelected ? 'Limitada (< 4 vasos → Bajo-Int)' : 'Focal (< 4 vasos → Int-Alto en PTC)' },
                            { v: 'ext', l: 'Extensa (≥ 4 vasos → Alto en FTC/OTC, Int-Alto en PTC)' }
                          ].map(o => (
                            <button
                              key={o.v}
                              onClick={() => setPostop({ ...postop, vi: o.v })}
                              className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                                postop.vi === o.v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                          7. Márgenes Quirúrgicos (Diferenciación Anterior/Posterior)
                        </h3>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { v: 'r0', l: 'R0 (Márgenes negativos)' },
                            { v: 'r1_ant', l: 'R1 microscópico solo ANTERIOR (Se mantiene Bajo Riesgo)' },
                            { v: 'r1_post', l: 'R1 microscópico POSTERIOR (Factor Bajo–Intermedio)' },
                            { v: 'r2', l: 'R2 (Enfermedad macroscópica residual → Alto Riesgo)' }
                          ].map(o => (
                            <button
                              key={o.v}
                              onClick={() => setPostop({ ...postop, margins: o.v })}
                              className={`p-2 rounded-xl text-xs font-bold border text-left transition-all ${
                                postop.margins === o.v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">8. Focalidad</h3>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { v: 'uni', l: 'Unifocal' },
                            { v: 'multi_uni', l: 'Multifocal unilateral (Bajo-Int)' },
                            { v: 'multi_bil_gt1', l: 'Multifocal bilateral >1cm (Int-Alto)' },
                            { v: 'multi_bil_le1', l: 'Multifocal bilateral, todos ≤1 cm (no definido en la guía)' }
                          ].map(o => (
                            <button
                              key={o.v}
                              onClick={() => setPostop({ ...postop, focality: o.v })}
                              className={`p-2 rounded-lg text-xs font-bold border text-left ${
                                postop.focality === o.v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">9. Metástasis (M)</h3>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { v: 'm0', l: 'M0 (Ausente)' },
                            { v: 'm1', l: 'M1 (Presente a distancia)' }
                          ].map(o => (
                            <button
                              key={o.v}
                              onClick={() => setPostop({ ...postop, metastasis: o.v })}
                              className={`p-2 rounded-lg text-xs font-bold border text-left ${
                                postop.metastasis === o.v ? 'bg-red-700 border-red-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">10. Molecular (R28B)</h3>
                        <div className="flex flex-col gap-1.5">
                          {[
                            { v: 'none', l: 'No realizado / Bajo riesgo' },
                            { v: 'braf', l: 'BRAF V600E aislado' },
                            { v: 'tert_combo', l: 'BRAF V600E/RAS + TERT prom. o TP53' }
                          ].map(o => (
                            <button
                              key={o.v}
                              onClick={() => setPostop({ ...postop, mol: o.v })}
                              className={`p-2 rounded-lg text-xs font-bold border text-left ${
                                postop.mol === o.v ? 'bg-teal-700 border-teal-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* ==================== FORMULARIO DE SEGUIMIENTO DINÁMICO Y LABS EXACTOS ==================== */
                <div className="space-y-4">
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                        1. Tratamiento inicial recibido (define los umbrales de respuesta)
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-2">
                        {[
                          { v: 'tt_rai', l: 'Tiroidectomía Total + Yodo (RAI)' },
                          { v: 'tt_norai', l: 'Tiroidectomía Total SIN Yodo' },
                          { v: 'hemi', l: 'Hemitiroidectomía / Lobectomía' }
                        ].map(o => (
                          <button
                            key={o.v}
                            onClick={() => setDynamic({ ...dynamic, surgeryType: o.v })}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                              dynamic.surgeryType === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {dynamic.surgeryType === 'hemi' && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Lóbulo contralateral en la ecografía</h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {[
                            { v: 'normal', l: 'Normal, o nódulos benignos / de bajo riesgo' },
                            { v: 'suspicious', l: 'Nódulo sospechoso' }
                          ].map(o => (
                            <button
                              key={o.v}
                              aria-pressed={dynamic.hemiLobe === o.v}
                              onClick={() => setDynamic({ ...dynamic, hemiLobe: o.v })}
                              className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                                dynamic.hemiLobe === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              {o.l}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-2xl border-2 border-teal-600 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-teal-900 mb-1">
                      2. Valores de laboratorio
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Clasifican la respuesta en tiempo real y se incluyen en la nota y en la fila de Excel.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* TSH */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <label className="block text-xs font-black text-slate-700 uppercase">TSH Sérica (µUI/mL = mUI/L)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="Ej: 0.15"
                          value={dynamic.tshExact}
                          onChange={(e) => setDynamic({ ...dynamic, tshExact: e.target.value })}
                          className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:border-teal-600 focus:outline-none"
                        />
                        <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 leading-snug">
                          <div><b>Meta de TSH según respuesta:</b></div>
                          <div><b>• Excelente / Indeterminada:</b> dentro del rango normal de referencia</div>
                          <div><b>• Bioquímica / Estructural incompleta:</b> por debajo del rango normal (individualizar; meta óptima no establecida)</div>
                        </div>
                      </div>

                      {/* Tg Basal */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <label className="block text-xs font-black text-slate-700 uppercase">Tiroglobulina (Tg) NO Estimulada (ng/mL)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="Ej: 0.08"
                          value={dynamic.tgBasal}
                          onChange={(e) => setDynamic({ ...dynamic, tgBasal: e.target.value })}
                          className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:border-teal-600 focus:outline-none"
                        />
                        <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 leading-snug">
                          <div><b>• TT + RAI:</b> Excelente &lt;0.2 | Indet. 0.2–1.0 | Incomp. &gt;1.0</div>
                          <div><b>• TT sin RAI:</b> Excelente &lt;2.5 | Indet. 2.5–5.0 | Incomp. &gt;5.0</div>
                          <div><b>• Estándar ensayo:</b> Calibrado BCR457 (R47A)</div>
                        </div>
                      </div>

                      {/* Tg Estimulada */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <label className="block text-xs font-black text-slate-700 uppercase">Tg Estimulada (rhTSH o Suspensión) (ng/mL)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          placeholder="Opcional — Ej: 0.8"
                          value={dynamic.tgStim}
                          onChange={(e) => setDynamic({ ...dynamic, tgStim: e.target.value })}
                          className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:border-teal-600 focus:outline-none"
                        />
                        <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 leading-snug">
                          <div><b>• TT + RAI:</b> Excelente &lt;1.0 | Indet. 1.0–10.0 | Incomp. &gt;10.0</div>
                          <div><b>• R58A (Sin foco en imagen):</b> Observar si &lt;10 (suspensión) o &lt;5 (rhTSH)</div>
                        </div>
                      </div>

                      {/* TgAb Exacto */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <label className="block text-xs font-black text-slate-700 uppercase">Anticuerpos Anti-Tg (TgAb) (UI/mL)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          placeholder="Ej: 12.0"
                          value={dynamic.tgAbExact}
                          onChange={(e) => setDynamic({ ...dynamic, tgAbExact: e.target.value })}
                          className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:border-teal-600 focus:outline-none"
                        />
                        <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 leading-snug">
                          <div><b>• Interpretación (R47E):</b> La tendencia de TgAb seriados con el mismo ensayo puede ser útil; los IMA/RIA de Tg suelen afectarse por TgAb; la imagen es la modalidad primaria de vigilancia en este grupo.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PARÁMETROS CLÍNICOS TABLA 9 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                        3. Tendencia de anticuerpos (TgAb)
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-2">
                        {[
                          { v: 'neg', l: 'Negativos (Ausentes)' },
                          { v: 'stable', l: 'Positivos pero Estables o en Descenso' },
                          { v: 'rising', l: 'Positivos en Ascenso Progresivo' }
                        ].map(o => (
                          <button
                            key={o.v}
                            onClick={() => setDynamic({ ...dynamic, tgAb: o.v })}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                              dynamic.tgAb === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                        4. Imagen (US cervical / rastreo / TC / PET)
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-2">
                        {[
                          { v: 'neg', l: 'Negativos (Sin evidencia de enfermedad)' },
                          { v: 'nonspec', l: 'Hallazgos inespecíficos (ej. lecho <6 mm o ganglio <8–10 mm, R31D)' },
                          { v: 'structural', l: 'Enfermedad Estructural Evidente / Biopsia (+)' }
                        ].map(o => (
                          <button
                            key={o.v}
                            onClick={() => setDynamic({ ...dynamic, imaging: o.v })}
                            className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                              dynamic.imaging === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: DASHBOARD CLÍNICO EN TIEMPO REAL (5 COLUMNAS) */}
            <div className="lg:col-span-5 scroll-mt-16" id="resultados">
              <div className="lg:sticky lg:top-16 space-y-4">
                
                {/* TARJETA DE RESULTADO POSOPERATORIO */}
                <div className={`rounded-2xl border-2 shadow-lg overflow-hidden transition-all ${curStyle.card}`}>
                  <div className={`h-2 w-full ${curStyle.band}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
                          Riesgo Estructural Inicial · ATA 2025
                        </span>
                        <div className={`text-2xl sm:text-3xl font-black tracking-tight mt-0.5 ${curStyle.text}`}>
                          {postopRes.label}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-black shadow-sm ${curStyle.badge}`}>
                        Rec: {postopRes.pct}
                      </span>
                    </div>

                    {/* BARRA PARALELA: AJCC 8va EDICIÓN (MORTALIDAD) */}
                    <div className="mt-3 bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-teal-300 block">
                          AJCC 8.ª Ed. (p{postopRes.pT}) · Mortalidad
                        </span>
                        <span className="text-sm font-black">{postopRes.ajccStage}</span>
                      </div>
                    </div>

                    {/* FACTORES DETERMINANTES */}
                    <div className="mt-4 bg-white/80 p-3 rounded-xl border border-black/5">
                      <span className="text-[10px] font-black uppercase text-slate-500 block mb-1.5">
                        Factores Clínico-Patológicos Activos:
                      </span>
                      <ul className="space-y-1 text-xs font-semibold text-slate-800">
                        {postopRes.drivers.map((d, i) => (
                          <li key={i} className="leading-snug">{d}</li>
                        ))}
                      </ul>
                      {isPTCMain && coexistLabels.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-snug">
                          <b>Componentes coexistentes (documentación, no modifican el riesgo):</b> {coexistLabels.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* ALERTAS DE COHERENCIA O GENÉTICA */}
                    {postopRes.warnings.map((w, idx) => (
                      <div key={idx} className="mt-3 bg-amber-100/90 border border-amber-400 text-amber-950 p-3 rounded-xl text-xs font-semibold leading-snug">
                        ⚠️ {w}
                      </div>
                    ))}

                    {/* CONDUCTA DE YODO RADIACTIVO (TABLA 10) */}
                    {!postopRes.isNIFTP && (
                      <div className="mt-4 pt-4 border-t border-black/10 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black uppercase text-slate-700">Terapia con Yodo (I-131):</span>
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-teal-900">
                            {postopRes.rai.ref}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-black/10">
                          <div className="font-black text-sm text-slate-900">{postopRes.rai.rec}</div>
                          <div className="text-teal-800 font-mono font-bold text-xs mt-0.5">
                            Dosis sugerida: {postopRes.rai.act}
                          </div>
                          <p className="text-slate-600 mt-1 leading-snug">{postopRes.rai.goal}</p>
                        </div>

                        <details className="bg-white/75 rounded-xl border border-black/5 text-[11px] leading-snug group">
                          <summary className="cursor-pointer select-none p-3 font-black text-slate-700 list-none flex items-center justify-between">
                            <span>Preparación, rastreo post-terapia y controles (R29–R38, R47C)</span>
                            <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                          </summary>
                          <div className="px-3 pb-3 space-y-1.5">
                          <div>
                            <strong className="text-slate-900">• Evaluación pre-RAI (R29, R30A, R31B):</strong> Medir Tg/TgAb a las <b>6–12 semanas</b> post-cirugía (mediana hasta el nadir de Tg: 12 semanas). Si Tg supera el rango excelente o hay TgAb, hacer US cervical antes del I-131.
                          </div>
                          <div>
                            <strong className="text-slate-900">• Rastreo Corporal Post-Terapia (R37, R38):</strong> Realizar rastreo corporal total (RxWBS) de rutina entre los <b>2 y 10 días posteriores</b> a la dosis de I-131, adicionando <b>SPECT/CT</b> si está disponible para localización anatómica.
                          </div>
                          <div>
                            <strong className="text-slate-900">• Intervalos de US y Labs (R31C, R47C):</strong> Primer US cervical a los <b>6–12 meses</b> de la terapia inicial. Medir Tg/TgAb (siempre juntos, ensayo BCR457) cada <b>6–12 meses</b> (con mayor frecuencia en riesgo Intermedio-Alto y Alto).
                          </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>

                {/* TARJETA DE RE-ESTRATIFICACIÓN DINÁMICA (SIEMPRE VISIBLE Y VINCULADA) */}
                <div className={`rounded-2xl border-2 shadow-md overflow-hidden transition-all ${dynStyle.card}`}>
                  <div className={`h-1.5 w-full ${dynStyle.band}`} />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                        Re-estratificación Dinámica
                      </span>
                      <button
                        onClick={() => setActiveTab(activeTab === 'dynamic' ? 'postop' : 'dynamic')}
                        className="text-[11px] font-bold text-teal-800 underline"
                      >
                        {activeTab === 'dynamic' ? '← Volver a Patología' : 'Ingresar Tg / US →'}
                      </button>
                    </div>
                    <div className={`text-lg font-black ${dynStyle.text}`}>{dynRes.cat}</div>
                    <p className="text-xs text-slate-700 mt-1 leading-snug">{dynRes.reason}</p>

                    <div className="mt-3 bg-white/85 p-3 rounded-xl border border-black/5 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-slate-500">Riesgo Residual:</span>
                        <span className="font-black text-slate-900 text-right">{dynRes.residualRisk}</span>
                      </div>
                      <div className="flex justify-between gap-2 border-t border-slate-100 pt-1.5">
                        <span className="font-bold text-slate-500">Meta de TSH:</span>
                        <span className="font-bold text-teal-900 text-right">{dynRes.tshGoal}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-1.5 text-[11px] text-slate-700 leading-snug">
                        <strong className="text-slate-900 block">Plan de Vigilancia Longitudinal:</strong>
                        {dynRes.actionPlan}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE EXPORTACIÓN CLÍNICA Y CIENTÍFICA */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExport('emr')}
                    className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all"
                  >
                    <IconCopy />
                    {copyFeedback === 'emr' ? '¡Copiado al Expediente!' : 'Copiar Expediente (EMR)'}
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all"
                  >
                    <IconExcel />
                    {copyFeedback === 'excel' ? '¡Fila TSV Copiada!' : 'Tabular Fila (Excel)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PESTAÑA 3: CIRUGÍA PREOPERATORIA (TABLA 5, R11-R25) ==================== */}
        {activeTab === 'surgery' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900">
                Planificación Quirúrgica Preoperatoria y Vigilancia Activa (R11–R25)
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Estadio Clínico cT</label>
                  <select
                    value={surg.cT}
                    onChange={(e) => setSurg({ ...surg, cT: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="t1a">cT1a (≤ 1 cm, intratiroideo)</option>
                    <option value="t1b">cT1b (&gt; 1 – 2 cm, intratiroideo)</option>
                    <option value="t2">cT2 (&gt; 2 – 4 cm, intratiroideo)</option>
                    <option value="t3a">cT3a (&gt; 4 cm, intratiroideo)</option>
                    <option value="t3b">cT3b (ETE macroscópica a músculos pretiroideos)</option>
                    <option value="t4">cT4 (ETE macroscópica a tráquea, laringe, NLR, etc.)</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="block text-xs font-bold uppercase text-slate-500">Ganglios Clínicos (cN)</label>
                    <InfoTip text={TIP_N1A + ' ' + TIP_N1B} label="cN1a y cN1b" />
                  </div>
                  <select
                    value={surg.cN}
                    onChange={(e) => setSurg({ ...surg, cN: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="n0">cN0 (Sin ganglios clínicos ni ecográficos)</option>
                    <option value="n1a">cN1a (Ganglios centrales VI/VII comprometidos)</option>
                    <option value="n1b">cN1b (ganglios laterales niveles I–V, uni/bilaterales o contralaterales, o retrofaríngeos)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Metástasis a Distancia (cM)</label>
                  <select
                    value={surg.cM}
                    onChange={(e) => setSurg({ ...surg, cM: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="m0">cM0 (Sin metástasis a distancia)</option>
                    <option value="m1">cM1 (Metástasis a distancia)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Lateralidad / Lóbulo Contralateral</label>
                  <select
                    value={surg.laterality}
                    onChange={(e) => setSurg({ ...surg, laterality: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="uni">Unilateral sin nódulos contralaterales sospechosos</option>
                    <option value="bil">Cáncer bilateral (multifocal, cT(m))</option>
                    <option value="nod">Nódulos contralaterales sospechosos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Relación con Cápsula Posterior / Tráquea</label>
                  <select
                    value={surg.posteriorAbutment}
                    onChange={(e) => setSurg({ ...surg, posteriorAbutment: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="no">Alejado de cápsula posterior, tráquea y surco traqueoesofágico</option>
                    <option value="yes">Adyacente a cápsula posterior / tráquea / área del NLR</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-teal-950 text-white p-5 rounded-2xl shadow-lg space-y-3 text-xs leading-relaxed">
              <div className="text-[10px] font-mono uppercase text-teal-300">Recomendación Quirúrgica · ATA 2025</div>
              <div className="text-xl font-black text-white">
                {(surg.cT === 't3a' || surg.cT === 't3b' || surg.cT === 't4' || surg.cN !== 'n0' || surg.cM === 'm1')
                  ? 'Tiroidectomía Total [R15C]'
                  : surg.laterality === 'bil'
                  ? 'Tiroidectomía Total (cáncer bilateral) [R15A]'
                  : surg.laterality === 'nod'
                  ? 'Lobectomía o Tiroidectomía Total (nodularidad contralateral sospechosa) [R15B; en cT1 «other indications», R15A]'
                  : surg.cT === 't2'
                  ? 'Lobectomía (Preferida por menor morbilidad) o Tiroidectomía Total [R15B]'
                  : 'Lobectomía Tiroidea (u Opciones No Quirúrgicas si es cT1a) [R15A / R11]'}
              </div>

              {surg.cM === 'm1' && (
                <div className="bg-red-900/60 p-3 rounded-xl border border-red-700">
                  <strong className="text-red-200 block mb-1">cM1 (R15C, R32D):</strong>
                  La cirugía inicial debe incluir tiroidectomía total para permitir I-131 terapéutico. No candidato a vigilancia activa ni ablación percutánea (R11 se limita a cT1aN0M0).
                </div>
              )}

              {surg.cT === 't1a' && surg.cN === 'n0' && surg.cM === 'm0' && surg.laterality === 'uni' && (
                <div className="bg-teal-900/80 p-3 rounded-xl border border-teal-700">
                  <strong className="text-teal-200 block mb-1">Alternativas No Quirúrgicas en cT1aN0M0 (R11–R14):</strong>
                  {surg.posteriorAbutment === 'yes'
                    ? '⚠️ La vigilancia activa de tumores de localización posterior puede ser inapropiada por riesgo de invasión de estructuras vitales; estos casos fueron excluidos de los estudios.'
                    : '• Vigilancia Activa (R11A) con US cada 6 meses por 1–2 años y luego anual (R12), sin medir Tg sérica (R13). Indicar cirugía si hay metástasis ganglionar nueva comprobada por biopsia, crecimiento ≥3 mm, metástasis a distancia, ETE, crecimiento posterior, ansiedad, imposibilidad de seguimiento o preferencia (R14). También puede considerarse Ablación Percutánea por RFA/MWA/LA (R11B).'}
                </div>
              )}

              <div className="bg-white/10 p-3 rounded-xl space-y-1.5">
                <div><b>• Manejo Ganglionar (R19, R20):</b> {
                  surg.cN === 'n1b' ? 'Disección terapéutica lateral compartimental (niveles IIa, III, IV y Vb) + disección central ipsilateral acompañante (R20B/C).' :
                  surg.cN === 'n1a' ? 'Disección central terapéutica (nivel VI y VII superior) acompañando a la tiroidectomía (R20A).' :
                  (surg.cT === 't1a' || surg.cT === 't1b' || surg.cT === 't2') ? 'NO realizar disección central profiláctica de rutina en cT1–T2 cN0 (R19A - Fuerte).' :
                  'En PTC cN0 con T3–T4, o si la información servirá para planear la terapia, puede considerarse disección central profiláctica, sopesando los riesgos según evolucionen durante la tiroidectomía (R19B).'
                }</div>
                <div><b>• Estándares Perioperatorios (R6, R8, R22–R25):</b> Referir a cirujano de alto volumen (&gt;25–50 tiroidectomías/año, R6). Solicitar TC con contraste IV si hay sospecha invasiva (el yodo se depura en 4–6 semanas, R8). Evaluar la voz en todos (R22A); laringoscopía si hay disfonía, cirugía cervical o torácica alta previa, ETE posterior o metástasis ganglionares centrales o yugulares extensas (R22B). Estimular vago/NLR antes de resecar el lóbulo contralateral para evitar parálisis bilateral (R23D). Suplementar calcio/vitamina D dirigido por PTH y evitar drenajes de rutina (R24B, R25).</div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PESTAÑA 4: NÓDULO (ACR TI-RADS 2017 — Tessler FN, et al. J Am Coll Radiol 2017;14:587-595) ==================== */}
        {activeTab === 'nodule' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-black text-slate-900">Evaluación de Nódulo (ACR TI-RADS 2017)</h2>
                <span className="text-[11px] font-mono bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-teal-900">TI-RADS: Tessler FN, et al. J Am Coll Radiol 2017;14:587–595 · Bethesda 2023 (vía PathologyOutlines)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Seleccione una opción en cada una de las primeras cuatro categorías y <b>todas las que apliquen</b> en focos ecogénicos; se suman los puntos.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">1. Composición</label>
                  <select value={nodule.comp} onChange={e => setNodule({ ...nodule, comp: e.target.value })} className="w-full p-2 border rounded-lg bg-slate-50 font-semibold">
                    {Object.entries(TIRADS_COMP).map(([k, o]) => <option key={k} value={k}>{o.l} ({o.pts} {o.pts === 1 ? 'pt' : 'pts'})</option>)}
                  </select>
                  <span className="text-[11px] text-slate-500 block mt-1">Espongiforme: &gt;50% de pequeños espacios quísticos. Mixto: puntuar el componente sólido predominante.</span>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">2. Ecogenicidad</label>
                  <select value={nodule.echo} onChange={e => setNodule({ ...nodule, echo: +e.target.value })} className="w-full p-2 border rounded-lg bg-slate-50 font-semibold" disabled={nodule.comp === 'spongiform'}>
                    <option value={0}>Anecoico (0 pts)</option>
                    <option value={1}>Hiper o isoecoico (1 pt)</option>
                    <option value={2}>Hipoecoico (2 pts)</option>
                    <option value={3}>Muy hipoecoico (3 pts)</option>
                    <option value={-1}>No determinable (1 pt)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 block mt-1">Anecoico: solo nódulos quísticos o casi quísticos. Muy hipoecoico: más que la musculatura pretiroidea.</span>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">3. Forma (imagen transversal)</label>
                  <select value={nodule.shape} onChange={e => setNodule({ ...nodule, shape: +e.target.value })} className="w-full p-2 border rounded-lg bg-slate-50 font-semibold" disabled={nodule.comp === 'spongiform'}>
                    <option value={0}>Más ancho que alto (0 pts)</option>
                    <option value={3}>Más alto que ancho (3 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">4. Margen</label>
                  <select value={nodule.margin} onChange={e => setNodule({ ...nodule, margin: +e.target.value })} className="w-full p-2 border rounded-lg bg-slate-50 font-semibold" disabled={nodule.comp === 'spongiform'}>
                    <option value={0}>Liso (0 pts)</option>
                    <option value={-1}>Mal definido (0 pts)</option>
                    <option value={2}>Lobulado o irregular (2 pts)</option>
                    <option value={3}>Extensión extratiroidea (3 pts)</option>
                    <option value={-2}>No determinable (0 pts)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-bold text-slate-600 block mb-1">5. Focos ecogénicos (todos los que apliquen)</span>
                  <div className="grid sm:grid-cols-3 gap-1.5">
                    {TIRADS_FOCI.map(f => (
                      <label key={f.k} className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer ${nodule.comp === 'spongiform' ? 'opacity-50' : ''} ${nodule.foci[f.k] ? 'bg-teal-50 border-teal-400' : 'bg-slate-50 border-slate-200'}`}>
                        <input
                          type="checkbox"
                          disabled={nodule.comp === 'spongiform'}
                          checked={nodule.foci[f.k]}
                          onChange={e => setNodule({ ...nodule, foci: { ...nodule.foci, [f.k]: e.target.checked } })}
                          className="mt-0.5 rounded text-teal-600"
                        />
                        <span className="font-semibold">{f.l} ({f.pts} {f.pts === 1 ? 'pt' : 'pts'})</span>
                      </label>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">Sin marcar = ninguno o artefactos en cola de cometa grandes (0 pts).</span>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Diámetro máximo (cm)</label>
                  <input
                    type="number" inputMode="decimal" step="0.1" min="0"
                    value={nodule.sizeCm}
                    onChange={e => setNodule({ ...nodule, sizeCm: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-semibold font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => { setActiveTab('bethesda'); window.scrollTo({ top: 0 }); }}
                    className="w-full p-2 rounded-lg border border-teal-300 bg-teal-50 text-teal-900 font-bold text-left hover:bg-teal-100"
                  >
                    {nodule.bethesda === 'none' ? 'Si se puncionó: registrar citología (Bethesda) →' : `Citología: ${BETHESDA[nodule.bethesda].label} →`}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              {(() => {
                const t = evaluateTirads(nodule);
                return (
                  <>
                    <div className="p-3.5 rounded-xl bg-slate-900 text-white">
                      <span className="text-[10px] font-mono uppercase text-teal-300 block">Puntaje ACR TI-RADS: {t.pts} puntos</span>
                      <div className="text-base font-black mt-0.5">{t.level} · {t.name}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">Riesgo de cáncer en la serie del comité: {t.risk}</div>
                      <div className="text-xs font-semibold text-teal-200 mt-1.5">{t.rec}</div>
                      {t.followUp && <div className="text-[11px] text-slate-200 mt-1">{t.followUp}</div>}
                    </div>
                    {t.notes.map((n, i) => (
                      <div key={i} className="bg-amber-100/90 border border-amber-400 text-amber-950 p-3 rounded-xl font-semibold leading-snug">⚠️ {n}</div>
                    ))}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] leading-snug text-slate-700">
                      <strong className="text-slate-900 block">Reglas del comité ACR TI-RADS:</strong>
                      <div>• Crecimiento significativo: aumento ≥20% en al menos dos dimensiones con un mínimo de 2 mm, o ≥50% en volumen.</div>
                      <div>• Si el nivel TI-RADS aumenta en el seguimiento, el siguiente US se hace en 1 año.</div>
                      <div>• Biopsiar como máximo los 2 nódulos con mayor puntaje que cumplan criterio de PAAF; seguir como máximo 4 bajo el umbral. El tamaño no es el criterio principal para elegir cuál biopsiar.</div>
                      <div>• PAAF de ganglios cervicales sospechosos, además de hasta 2 nódulos.</div>
                      <div>• Medir en tres ejes; el diámetro máximo define la conducta.</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        {/* ==================== PESTAÑA BETHESDA (citología) ==================== */}
        {activeTab === 'bethesda' && (() => {
          const bth = BETHESDA[nodule.bethesda];
          const groups = [
            { t: 'No diagnóstica / Benigna', ids: ['1', '2'] },
            { t: 'Indeterminadas', ids: ['3n', '3o', '4', '4o'] },
            { t: 'Sospechosa / Maligna', ids: ['5', '6'] },
          ];
          const tone = { none: 'bg-slate-50 border-slate-200', '1': 'bg-slate-50 border-slate-300', '2': 'bg-emerald-50 border-emerald-300', '3n': 'bg-amber-50 border-amber-300', '3o': 'bg-amber-50 border-amber-300', '4': 'bg-orange-50 border-orange-300', '4o': 'bg-orange-50 border-orange-300', '5': 'bg-red-50 border-red-300', '6': 'bg-red-50 border-red-400' }[nodule.bethesda];
          return (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-black text-slate-900">Citología de tiroides (Bethesda 2023)</h2>
                  <span className="text-[11px] font-mono bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-teal-900">Fuente: PathologyOutlines (resumen de Ali SZ, et al.)</span>
                </div>
                {groups.map(g => (
                  <div key={g.t}>
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-1.5">{g.t}</span>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {g.ids.map(id => (
                        <button
                          key={id}
                          aria-pressed={nodule.bethesda === id}
                          onClick={() => setNodule({ ...nodule, bethesda: nodule.bethesda === id ? 'none' : id })}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                            nodule.bethesda === id ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {BETHESDA[id].label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 leading-snug">Toque de nuevo la categoría elegida para quitarla. El riesgo de malignidad varía según se considere a NIFTP maligno o no; se recomienda calcular el ROM institucional.</p>
              </div>

              <div className="lg:col-span-5 space-y-3 text-xs">
                <div className={`p-4 rounded-2xl border-2 ${tone}`}>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">Bethesda 2023 · Riesgo de malignidad</span>
                  {bth.rom ? (
                    <>
                      <div className="text-lg font-black text-slate-900 mt-0.5 leading-tight">{bth.label}</div>
                      <div className="text-sm font-bold text-slate-800 mt-2">ROM: {bth.rom}</div>
                      <div className="text-xs text-slate-700 mt-1.5 leading-snug"><b>Manejo:</b> {bth.mgmt}</div>
                    </>
                  ) : (
                    <div className="text-sm font-bold text-slate-600 mt-1">Seleccione la categoría del informe de citología.</div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-3 leading-snug">Fuente secundaria: PathologyOutlines.com (Suzuki A, Bychkov A; act. 12-jun-2025), resumen de Ali SZ, et al. Thyroid 2023;33:1039.</div>
                </div>
                {(
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950">
                    <strong className="block mb-1">Nota de transición ATA 2025 (R9, R10):</strong>
                    Una vez confirmado el diagnóstico de cáncer diferenciado de tiroides (Bethesda VI o molecular positivo), <b>no se recomienda</b> medir Tg ni TgAb preoperatorias de rutina (R9) ni la evaluación genómica de rutina antes de la cirugía; si el perfil ya se conoce, puede considerarse para informar la extensión quirúrgica (R10).
                    {(nodule.bethesda === '5' || nodule.bethesda === '6') && <button onClick={() => { setActiveTab('surgery'); window.scrollTo({ top: 0 }); }} className="mt-2 block w-full text-center font-black bg-teal-700 hover:bg-teal-800 text-white rounded-lg py-2">Continuar en Cirugía →</button>}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        <footer className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <b>Fuentes verificadas:</b> Ringel MD, Sosa JA, et al. 2025 ATA Management Guidelines for Adult Patients with DTC. Thyroid 2025;35(8):841–985 (DOI: 10.1177/10507256251363120) + Corrigendum Thyroid 2025;35(11):1350 (Fig. 2, Fig. 6, Tablas 3, 4, 5, 6, 8, 9, 10 y 11) · Pestaña TI-RADS: ACR TI-RADS 2017 (Tessler FN, et al. JACR 2017;14:587–595) · Pestaña Bethesda: Bethesda 2023 (resumen PathologyOutlines de Ali SZ, et al. Thyroid 2023;33:1039). Alcance: adultos con cáncer diferenciado de tiroides; no aplica a medular, anaplásico, linfoma ni pediatría. Herramienta de apoyo; no sustituye el juicio clínico. Los datos no salen del dispositivo.
        </footer>
      </main>)}

      {/* BARRA DE RESULTADO FLOTANTE (solo móvil/tablet) */}
      {(activeTab === 'postop' || activeTab === 'dynamic') && (
        <button
          onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-left text-white shadow-[0_-4px_12px_rgba(0,0,0,0.15)] ${curStyle.band}`}
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-mono uppercase tracking-wider opacity-90">Riesgo ATA · p{postopRes.pT} · {dynRes.cat}</span>
            <span className="block text-sm font-black truncate">{postopRes.label} ({postopRes.pct})</span>
          </span>
          <span className="shrink-0 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg">Ver ↓</span>
        </button>
      )}
      {(activeTab === 'postop' || activeTab === 'dynamic') && (
        <button
          onClick={() => handleExport('emr')}
          className="lg:hidden fixed right-3 z-50 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] flex items-center gap-1.5 bg-slate-900 text-white text-xs font-black px-3.5 py-2.5 rounded-full shadow-lg"
        >
          <IconCopy /> {copyFeedback === 'emr' ? '¡Nota copiada!' : 'Copiar nota'}
        </button>
      )}
    </div>
  );
}