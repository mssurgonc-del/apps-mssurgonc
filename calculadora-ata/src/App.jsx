import React, { useState, useMemo } from 'react';

// --- ICONOS VECTORIALES INTEGRADOS (Cero dependencias externas) ---
const IconShield = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconActivity = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconScalpel = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const IconExcel = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconReset = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;

// --- DICCIONARIOS OMS 2022/2025 (Tabla 3 ATA 2025) ---
const HISTO_OPTIONS = [
  // PTC Bajo Grado
  { id: 'ptc_clasico', group: 'ptc_low', label: 'PTC Clásico', full: 'Carcinoma Papilar Clásico (o encapsulado clásico)' },
  { id: 'ptc_fol_inf', group: 'ptc_low', label: 'PTC Folicular Infiltrativo', full: 'Carcinoma Papilar subtipo Folicular Infiltrativo' },
  { id: 'ptc_warthin', group: 'ptc_low', label: 'PTC Warthin-like / Oncocítico', full: 'Carcinoma Papilar subtipo Warthin-like u Oncocítico' },
  // PTC Agresivos (Intermedio-Alto directo)
  { id: 'ptc_tall', group: 'ptc_agg', label: 'Células Altas (Tall Cell)', full: 'PTC Subtipo Agresivo: Células Altas (Tall Cell)' },
  { id: 'ptc_columnar', group: 'ptc_agg', label: 'Células Columnares', full: 'PTC Subtipo Agresivo: Células Columnares' },
  { id: 'ptc_hobnail', group: 'ptc_agg', label: 'Hobnail (Tachuela)', full: 'PTC Subtipo Agresivo: Hobnail (en tachuela)' },
  { id: 'ptc_sclerosing', group: 'ptc_agg', label: 'Esclerosante Difuso', full: 'PTC Subtipo Agresivo: Esclerosante Difuso' },
  { id: 'ptc_solid', group: 'ptc_agg', label: 'Sólido / Trabecular', full: 'PTC Subtipo Agresivo: Sólido / Trabecular' },
  // Espectro Folicular y Oncocítico (Vías separadas Fig. 2)
  { id: 'ftc', group: 'foll', label: 'FTC (Folicular)', full: 'Carcinoma Folicular de Tiroides (FTC)' },
  { id: 'iefvptc', group: 'foll', label: 'IEFVPTC (Folicular Encapsulado Invasivo)', full: 'Variante Folicular Encapsulada Invasiva de PTC (IEFVPTC)' },
  { id: 'otc', group: 'otc', label: 'OTC (Oncocítico / Hürthle)', full: 'Carcinoma Oncocítico de Tiroides (OTC, ≥75% células oncocíticas)' },
  // Alto Grado (Alto Riesgo directo)
  { id: 'dhgtc_pdtc', group: 'high_grade', label: 'Alto Grado (DHGTC / PDTC)', full: 'Carcinoma Diferenciado de Alto Grado (DHGTC) o Pobremente Diferenciado (PDTC - Turín)' },
  // Especiales / Síndromes / Bajo potencial maligno
  { id: 'cmtc', group: 'special', label: 'Cribriforme-Morular (CMTC)', full: 'Carcinoma Tiroides Cribriforme-Morular (Asociado a gen APC / Poliposis Familiar)' },
  { id: 'niftp', group: 'benign_pot', label: 'NIFTP / FT-UMP / HTT', full: 'Neoplasia Folicular No Invasiva (NIFTP) o Potencial Maligno Incierto (FT-UMP / HTT)' },
];

// Bethesda 2023 (3.ª ed.). Fuente: Suzuki A, Bychkov A. Bethesda system diagnostic categories. PathologyOutlines.com
// (act. 12-jun-2025), que resume Ali SZ, et al. Thyroid 2023;33:1039. ROM: «NIFTP = maligno» / «NIFTP ≠ maligno».
const BETHESDA = {
  none: { label: 'Sin citología' },
  '1': { label: 'I — No diagnóstica', rom: '10 – 13% de todos los nódulos; hasta 30% de los resecados', mgmt: 'Repetir PAAF, excepto quiste puro.' },
  '2': { label: 'II — Benigna', rom: '< 3%', mgmt: 'Seguimiento según el patrón ecográfico.' },
  '3n': { label: 'III — AUS con atipia nuclear', rom: '36 – 44% (AUS global: 13 – 30% con NIFTP = maligno; 6 – 20% con NIFTP ≠ maligno)', mgmt: 'Repetir PAAF o prueba molecular.' },
  '3o': { label: 'III — AUS, otra atipia', rom: '15 – 23% (AUS global: 13 – 30% con NIFTP = maligno; 6 – 20% con NIFTP ≠ maligno)', mgmt: 'Repetir PAAF o prueba molecular.' },
  '4': { label: 'IV — Neoplasia folicular', rom: '23 – 34% (NIFTP = maligno) o 23% (NIFTP ≠ maligno)', mgmt: 'Lobectomía diagnóstica o prueba molecular.' },
  '4o': { label: 'IV — Neoplasia folicular oncocítica', rom: '25 – 50%', mgmt: 'Lobectomía diagnóstica o prueba molecular.' },
  '5': { label: 'V — Sospechosa de malignidad', rom: '74% (NIFTP = maligno) o 65% (NIFTP ≠ maligno)', mgmt: 'Cirugía (habitualmente).' },
  '6': { label: 'VI — Maligna', rom: '97 – 100% (NIFTP = maligno) o 94% (NIFTP ≠ maligno)', mgmt: 'Cirugía (habitualmente). Para cáncer diferenciado, ver pestaña 3 (ATA 2025).' },
};

// --- ACR TI-RADS 2017 (Tessler FN, et al. J Am Coll Radiol 2017;14:587-595, Fig. 1) ---
const TIRADS_COMP = {
  cystic: { l: 'Quístico o casi quístico', pts: 0 },
  spongiform: { l: 'Espongiforme', pts: 0 },
  mixed: { l: 'Mixto quístico y sólido', pts: 1 },
  solid: { l: 'Sólido o casi sólido', pts: 2 },
  undet: { l: 'No determinable (calcificación)', pts: 2 },
};
const TIRADS_FOCI = [
  { k: 'macro', l: 'Macrocalcificaciones (sombra acústica)', pts: 1 },
  { k: 'rim', l: 'Calcificaciones periféricas (anillo)', pts: 2 },
  { k: 'punct', l: 'Focos ecogénicos puntiformes', pts: 3 },
];

function evaluateTirads(n) {
  const notes = [];
  let pts;
  if (n.comp === 'spongiform') {
    // Fig. 1: «Do not add further points for other categories»
    pts = 0;
    notes.push('Espongiforme: no se suman puntos de otras categorías. No clasificar como espongiforme solo por algunos espacios quísticos dispersos en un nódulo sólido.');
  } else {
    const echo = n.echo === -1 ? 1 : n.echo;
    const margin = n.margin < 0 ? 0 : n.margin;
    const foci = TIRADS_FOCI.reduce((acc, f) => acc + (n.foci[f.k] ? f.pts : 0), 0);
    pts = TIRADS_COMP[n.comp].pts + echo + n.shape + margin + foci;
  }
  if (pts === 1) notes.push('1 punto no corresponde a ningún nivel: según el comité, todo nódulo que no sea TR1 suma al menos 2 puntos. Revise composición y ecogenicidad («anecoico» aplica a nódulos quísticos o casi quísticos).');
  if (n.comp !== 'spongiform' && n.margin === 3) notes.push('Extensión extratiroidea evidente = malignidad (Fig. 1). La ETE mínima debe reportarse con cautela.');

  let level, name, risk, thr = null, followUp = null;
  if (pts === 0) { level = 'TR1'; name = 'Benigno'; risk = '≤ 2%'; }
  else if (pts <= 2) { level = 'TR2'; name = 'No sospechoso'; risk = '≤ 2%'; }
  else if (pts === 3) { level = 'TR3'; name = 'Levemente sospechoso'; risk = '5%'; thr = [2.5, 1.5]; followUp = 'US de seguimiento a 1, 3 y 5 años; puede suspenderse a los 5 años si no hay cambio de tamaño.'; }
  else if (pts <= 6) { level = 'TR4'; name = 'Moderadamente sospechoso'; risk = '5 – 20%'; thr = [1.5, 1.0]; followUp = 'US de seguimiento a 1, 2, 3 y 5 años; puede suspenderse a los 5 años si no hay cambio de tamaño.'; }
  else { level = 'TR5'; name = 'Altamente sospechoso'; risk = '≥ 20%'; thr = [1.0, 0.5]; followUp = 'US de seguimiento anual hasta 5 años; puede suspenderse a los 5 años si no hay cambio de tamaño.'; }

  const size = parseFloat(n.sizeCm);
  let rec;
  if (!thr) { rec = 'No PAAF.'; }
  else if (isNaN(size)) { rec = 'Ingrese el diámetro máximo para definir conducta.'; followUp = null; }
  else if (size >= thr[0]) { rec = `PAAF (≥ ${thr[0]} cm).`; followUp = null; }
  else if (size >= thr[1]) { rec = `Seguimiento ecográfico (≥ ${thr[1]} cm y < ${thr[0]} cm).`; }
  else { rec = `Ni PAAF ni seguimiento (< ${thr[1]} cm).`; followUp = null; }

  if (level === 'TR5' && !isNaN(size) && size >= 0.5 && size < 1.0) {
    notes.push('TR5 de 5–9 mm: la biopsia puede ser apropiada en ciertas circunstancias (vigilancia activa, ablación o lobectomía de microcarcinoma); decisión compartida. Indicar si el nódulo se puede medir de forma reproducible y si está en localización subcapsular crítica.');
  }
  return { pts, level, name, risk, rec, followUp, notes };
}

const TIER_STYLES = {
  low: { badge: 'bg-emerald-700 text-white', card: 'bg-emerald-50/90 border-emerald-300', text: 'text-emerald-900', band: 'bg-emerald-600' },
  lowint: { badge: 'bg-amber-600 text-white', card: 'bg-amber-50/90 border-amber-300', text: 'text-amber-900', band: 'bg-amber-500' },
  highint: { badge: 'bg-orange-600 text-white', card: 'bg-orange-50/90 border-orange-300', text: 'text-orange-950', band: 'bg-orange-600' },
  high: { badge: 'bg-red-700 text-white', card: 'bg-red-50/90 border-red-300', text: 'text-red-950', band: 'bg-red-700' },
  none: { badge: 'bg-slate-500 text-white', card: 'bg-slate-50 border-slate-300', text: 'text-slate-700', band: 'bg-slate-400' },
};

// --- MOTOR POSOPERATORIO ATA 2025 (Fig. 2 + AJCC 8va Ed. Tabla 6) ---
function evaluatePostop(p) {
  const histObj = HISTO_OPTIONS.find(h => h.id === p.histo) || HISTO_OPTIONS[0];
  const isFoll = histObj.group === 'foll' || histObj.group === 'otc';
  const isOTC = histObj.group === 'otc';
  const isNIFTP = histObj.group === 'benign_pot';

  // Derivación automática del estadio pT (AJCC 8va edición, Tabla 6)
  let pT = 'T1a';
  if (p.ete === 't4b') pT = 'T4b';
  else if (p.ete === 't4a') pT = 'T4a';
  else if (p.ete === 'strap') pT = 'T3b';
  else if (p.size === 'gt4') pT = 'T3a';
  else if (p.size === '2to4') pT = 'T2';
  else if (p.size === '1to2') pT = 'T1b';
  else pT = 'T1a';

  if (isNIFTP) {
    return {
      isNIFTP: true,
      tier: 'low',
      label: 'MUY BAJO POTENCIAL MALIGNO',
      pct: 'Muy bajo',
      pT,
      ajccStage: 'No aplica (neoplasia de muy bajo potencial maligno, R1)',
      drivers: ['▽ R1 (GPS): NIFTP, FT-UMP y Tumor Trabecular Hialinizante tienen potencial maligno inferior al DTC de más bajo riesgo.'],
      rai: { rec: 'NO INDICADO', act: '0 mCi', goal: 'No requiere completamiento quirúrgico ni I-131 de rutina [R1].' },
      warnings: []
    };
  }

  const high = [];
  const intHigh = [];
  const lowInt = [];
  const warnings = [];

  // Validación de coherencia anatomopatológica en FTC / OTC
  if (isFoll) {
    if (p.follPattern === 'mi' && p.vi !== 'none') {
      warnings.push('Incoherencia patológica: «Mínimamente invasivo (solo invasión capsular)» excluye invasión vascular. Si hay vasos invadidos, el tumor es «Encapsulado angioinvasivo» (Fig. 2: «Minimally invasive: capsular only»).');
    }
    if (p.follPattern === 'ea' && p.vi === 'none') {
      warnings.push('Incoherencia patológica: «Encapsulado angioinvasivo» requiere especificar si la invasión vascular es limitada (<4 vasos → Bajo-Intermedio) o extensa (≥4 vasos → Alto Riesgo).');
    }
  }

  // 1. CRITERIOS DE ALTO RIESGO (>30% recurrencia estructural - Fig. 2)
  if (pT === 'T3b') high.push('pT3b: Extensión extratiroidea macroscópica a músculos pretiroideos (esternohioideo, esternotiroideo, tirohioideo u omohioideo)');
  if (pT === 'T4a') high.push('pT4a: Extensión extratiroidea macroscópica a tejidos blandos, laringe, tráquea, esófago o nervio laríngeo recurrente');
  if (pT === 'T4b') high.push('pT4b: Invasión macroscópica de fascia prevertebral o engloba carótida / vasos mediastinales');
  if (pT === 'T3a' && p.ete === 'micro') high.push('Combinación crítica Fig. 2: Tumor pT3a (>4 cm) + Extensión extratiroidea microscópica (48% riesgo de recurrencia, Chereau et al.)');
  if (histObj.group === 'high_grade' || p.highGradeFeatures) high.push('Histología de Alto Grado (PDTC criterios de Turín o DHGTC con ≥5 mitosis/2mm² o necrosis tumoral)');
  if (p.margins === 'r2') high.push('Márgenes R2: Resección macroscópicamente incompleta (texto: «residual gross disease (R2) are categorized as ATA high-risk»; Fig. 2 lo lista en la columna PTC)');
  if (p.nodes === 'big3cm') high.push('Metástasis ganglionar clínica (cN1) con cualquier ganglio ≥ 3 cm');
  if (p.nodes === 'ene') high.push('Extensión extranodal (ENE) del tumor metastásico (R27.1)');
  if (p.metastasis === 'm1') high.push('M1: Metástasis a distancia confirmada');
  if (isFoll && p.follPattern === 'wi') high.push(isOTC
    ? 'OTC ampliamente invasivo (≥4 vasos o ≥4 focos de invasión capsular con ETE mínima; sección OTC)'
    : `${histObj.label} ampliamente invasivo (invasión extensa del parénquima tiroideo)`);
  if (isFoll && p.vi === 'ext') high.push(`${histObj.label} encapsulado angioinvasivo con invasión vascular extensa (≥ 4 vasos)`);

  // 2. CRITERIOS DE RIESGO BAJO-INTERMEDIO (10-15% - Fig. 2)
  // Nota auditada Fig. 2: T3a (>4cm intratiroideo sin ETE micro) encabeza la banda Low-Intermediate
  if (pT === 'T3a' && p.ete === 'none') {
    lowInt.push('pT3a: Tumor > 4 cm confinado a la tiroides (factor calificante de banda Bajo-Intermedio en Fig. 2)');
  }
  if (p.ete === 'micro' && pT !== 'T3a') {
    lowInt.push('Extensión extratiroidea microscópica (en tumor T1 o T2)');
  }
  if (p.nodes === 'n1a_mod') {
    lowInt.push('Compromiso ganglionar central cN1a, o pN1a con foco > 2 mm o > 5 ganglios afectados');
  }
  if (p.margins === 'r1_post') {
    lowInt.push('Margen R1 microscópico positivo en cara POSTERIOR (factor independiente de enfermedad persistente/recurrente, HR 22.95; recurrencia 11.6% posterior vs 3.6% anterior)');
  }
  if (!isFoll && p.focality === 'multi_uni') {
    lowInt.push('Multifocalidad unilateral en PTC');
  }
  if (isFoll && p.vi === 'lim') {
    lowInt.push(`Invasión vascular limitada (< 4 vasos) en ${histObj.label}`);
  }

  // 3. CRITERIOS DE RIESGO INTERMEDIO-ALTO (≥16-30% - Fig. 2)
  if (p.nodes === 'n1b_lat') {
    intHigh.push('Metástasis ganglionares laterales clínicamente evidentes (cN1b) < 3 cm');
  }
  if (!isFoll) {
    if (histObj.group === 'ptc_agg') intHigh.push(`${histObj.full} (Subtipo agresivo de PTC)`);
    if (p.vi === 'lim' || p.vi === 'ext') intHigh.push('Invasión vascular presente en PTC (cualquier número de vasos clasifica en Intermedio-Alto según Fig. 2)');
    if (p.focality === 'multi_bil_gt1') intHigh.push('Multifocalidad bilateral con al menos un foco > 1 cm');
    if (p.focality === 'multi_bil_le1') warnings.push('Multifocalidad bilateral con todos los focos ≤1 cm: la Fig. 2 no la clasifica (Bajo exige «Unifocal»; Bajo-Int lista «Unilateral multifocality»; Int-Alto «Bilateral multifocality >1 cm»). No se sumó como factor: decidir con juicio clínico.');
  }

  // LNR elevado como modulador clínico (R16, R20, R28)
  if (p.lnrHigh) {
    warnings.push('Modulador ganglionar adicional (R16/R20/R28): Un Ratio Ganglionar (LNR = ganglios positivos / total disecados) elevado (>0.25–0.5 según estudio; >0.3 en la discusión de R16) se asocia a mayor riesgo de recurrencia.');
  }

  if (histObj.id === 'cmtc') {
    warnings.push('Alerta Genética (R2C, Tabla 4): El Carcinoma Cribriforme-Morular se asocia en ~40% a Poliposis Adenomatosa Familiar (gen APC) y puede preceder a los pólipos colónicos. Considerar pruebas genéticas/consejería (R2C) y evaluación de alto riesgo colorrectal según NCCN (Tabla 4).');
  }

  // Fig. 2: «T1, T2 o T3a con 2+ factores Bajo-Intermedio» → Int-Alto. El T3a por sí solo ubica en
  // Bajo-Intermedio pero no cuenta como uno de esos factores.
  const lowIntFactors = lowInt.length - (pT === 'T3a' && p.ete === 'none' ? 1 : 0);

  // DETERMINACIÓN DE LA CATEGORÍA FINAL ATA 2025 (Con regla aditiva 2+ factores Bajo-Intermedio)
  let tier = 'low';
  let label = 'BAJO';
  let pct = '< 10%';

  if (high.length > 0) {
    tier = 'high'; label = 'ALTO'; pct = '> 30%';
  } else if (intHigh.length > 0) {
    tier = 'highint'; label = 'INTERMEDIO–ALTO'; pct = '16 – 30%';
  } else if (lowIntFactors >= 2) {
    tier = 'highint'; label = 'INTERMEDIO–ALTO'; pct = '16 – 30%';
    intHigh.push(`Fig. 2: «2+ Low-intermediate risk factors» — coexistencia de ${lowIntFactors} factores Bajo-Intermedio${pT === 'T3a' ? ' en tumor T3a' : ''}`);
  } else if (lowInt.length >= 1) {
    tier = 'lowint'; label = 'BAJO–INTERMEDIO'; pct = '10 – 15%';
  } else {
    tier = 'low'; label = 'BAJO'; pct = '< 10%';
  }

  // Modulador Molecular Posoperatorio (R28B, Tabla 8)
  if (p.mol === 'tert_combo') {
    warnings.push('Alto Riesgo Molecular (R28B, Tabla 8): BRAF V600E + TERT → RR 15.09 de mortalidad específica; RAS + TERT → HR ~106 de recurrencia; BRAF V600E + TERT o TP53 se asocia a pérdida de avidez por yodo. Si se obtuvo, puede usarse para estimar mejor el riesgo derivado del sistema ATA 2025 (R28B).' + (isFoll && !isOTC ? ' En FTC/IEFVPTC usar la fila «Follicular Carcinoma and IEFVPTC» de la Tabla 8 (Corrigendum, Thyroid 2025;35(11):1350).' : ''));
  }

  // ESTADIFICACIÓN AJCC 8va EDICIÓN (Mortalidad Específica - Tabla 6)
  const isN1 = p.nodes !== 'n0'; // n1a_micro también es N1 en AJCC (Tabla 6)
  const isM1 = p.metastasis === 'm1';
  let ajccStage = 'Estadio I';

  if (p.ageGroup === 'lt55') {
    if (isM1) { ajccStage = 'Estadio II (<55 años con M1)'; }
    else { ajccStage = 'Estadio I (<55 años, cualquier T/N, M0)'; }
  } else {
    if (isM1) { ajccStage = 'Estadio IVB (≥55 años con M1)'; }
    else if (pT === 'T4b') { ajccStage = 'Estadio IVA (≥55 años, T4b, M0)'; }
    else if (pT === 'T4a') { ajccStage = 'Estadio III (≥55 años, T4a, M0)'; }
    else if (pT === 'T3a' || pT === 'T3b' || isN1) { ajccStage = 'Estadio II (≥55 años con T3a/T3b o N1, M0)'; }
    else { ajccStage = 'Estadio I (≥55 años, T1–T2, N0, M0)'; }
  }

  // RECOMENDACIÓN DE YODO RADIACTIVO (RAI - Tabla 10 y R32–R38, R55)
  let rai = {};
  if (isM1) {
    rai = {
      rec: 'SÍ — Recomendado de rutina (Tratamiento Terapéutico)',
      act: p.ageGroup === 'gt70' ? '100 – 150 mCi (3.7–5.55 GBq); dosimetría si se planean >150 mCi (R55A)' : '100 – 200 mCi (3.7–7.4 GBq) o guiado por Dosimetría',
      goal: 'Tratamiento de enfermedad metastásica conocida y ablación de remanente.',
      ref: 'R32D (Fuerte, certeza moderada) · Tabla 10 · R55A'
    };
  } else if (tier === 'high') {
    rai = {
      rec: 'SÍ — Recomendado de rutina (Adyuvancia)',
      act: '100 – 150 mCi (3.7–5.55 GBq)',
      goal: 'Ablación de remanente y terapia adyuvante para erradicar enfermedad microscópica sospechada.',
      ref: 'R32C (Fuerte, certeza moderada) · Tabla 10'
    };
  } else if (tier === 'highint') {
    rai = {
      rec: 'CONSIDERAR',
      act: '30 – 100 mCi (1.1–3.7 GBq)',
      goal: 'Ablación de remanente ± terapia adyuvante.',
      ref: 'R32B (Condicional, certeza baja) · Tabla 10'
    };
  } else if (tier === 'lowint') {
    rai = {
      rec: 'CONSIDERAR (Individualizar con Tg/US posoperatorios)',
      act: '30 – 100 mCi (1.1–3.7 GBq)',
      goal: 'Ablación de remanente ± terapia adyuvante. La Tg/US posoperatoria (R29) puede orientar a no administrar o a usar una actividad menor.',
      ref: 'R32B (Condicional, certeza baja) · R29 · Tabla 10'
    };
  } else {
    rai = {
      rec: 'NO RECOMENDADO DE RUTINA (Observación)',
      act: '0 mCi (Si excepcionalmente se ablaciona: 30–50 mCi / 1.1–1.85 GBq)',
      goal: 'Ninguno o ablación de remanente (Tabla 10). ESTIMABL2: no-inferioridad de omitir I-131 en bajo riesgo; HiLo: 30 mCi no inferior a 100 mCi para ablación.',
      ref: 'R32A (Fuerte, certeza alta) · Tabla 10'
    };
  }

  if (isOTC && tier !== 'low') {
    warnings.push('Particularidad en Carcinoma Oncocítico (R33): Los OTC suelen tener menor avidez por I-131. Si no se administra RAI empírico, considerar rastreo diagnóstico previo (DxWBS con I-123 o baja dosis de I-131) para confirmar avidez, y considerar 18FDG-PET/CT si Tg se eleva (R31G/R50A).');
  }
  if (p.ageGroup === 'gt70' && (tier === 'high' || isM1)) {
    warnings.push('Alerta de Seguridad Geriátrica (R55A - Fuerte): Evitar actividades empíricas de I-131 > 150 mCi (5.5 GBq) en mayores de 70 años o con insuficiencia renal sin dosimetría previa. 200 mCi excede la actividad máxima tolerada (200 cGy a sangre/médula) en 22–38% de los ≥70 años (250 mCi: ~50%).');
  }

  const drivers = [
    ...high.map(d => `▲ ALTO — ${d}`),
    ...intHigh.map(d => `▲ INT-ALTO — ${d}`),
    ...lowInt.map(d => `▲ BAJO-INT — ${d}`)
  ];
  if (drivers.length === 0) {
    drivers.push(`▽ BAJO — Tumor ${pT} intratiroideo, sin invasión vascular, ganglios negativos o ≤5 micrometástasis (≤2 mm), márgenes R0 o R1 anterior.`);
  }

  return {
    isNIFTP: false,
    histObj,
    tier,
    label,
    pct,
    pT,
    ajccStage,
    drivers,
    rai,
    warnings
  };
}

// --- MOTOR DE RESPUESTA DINÁMICA AL TRATAMIENTO (Tabla 9 + Fig. 6) ---
function evaluateDynamic(d, initialTier) {
  const tgBasal = parseFloat(d.tgBasal);
  const tgStim = parseFloat(d.tgStim);
  const hasBasal = !isNaN(tgBasal);
  const hasStim = !isNaN(tgStim);

  let cat = 'Respuesta Indeterminada';
  let tier = 'lowint';
  let reason = '';

  if (d.imaging === 'structural') {
    cat = 'Respuesta Estructuralmente Incompleta';
    tier = 'high';
    reason = 'Evidencia estructural en imagen (US cervical, TC, RM, PET/CT o rastreo) o confirmada por biopsia locorregional/a distancia.';
  } else if (d.surgeryType === 'hemi') {
    if (d.hemiLobe === 'normal' && d.imaging === 'neg') {
      cat = 'Respuesta Excelente (Post-Lobectomía)';
      tier = 'low';
      reason = 'Lóbulo contralateral normal (o nódulos benignos/bajo riesgo) sin ganglios anormales en ultrasonido (Tabla 9).';
    } else {
      cat = 'Hallazgos Inespecíficos / Indeterminados Post-Lobectomía';
      tier = 'lowint';
      reason = 'En lobectomía la Tabla 9 solo formaliza Respuesta Excelente y Estructuralmente Incompleta; vigilar nódulos contralaterales o tendencia de TgAb.';
    }
  } else if (d.surgeryType !== 'hemi' && !hasBasal && !hasStim && d.tgAb !== 'rising') {
    cat = 'Sin datos de Tg';
    tier = 'none';
    reason = 'Ingrese la Tg (no estimulada y/o estimulada) para clasificar la respuesta según la Tabla 9.';
  } else if (d.surgeryType === 'tt_rai') {
    // Tiroidectomía Total + RAI (Tabla 9, col 2)
    const biochemInc = (hasBasal && tgBasal > 1.0) || (hasStim && tgStim > 10.0) || d.tgAb === 'rising';
    // Tabla 9, literal: «Nonstimulated Tg <0.2 or stimulated Tg <1» con TgAb negativos e imagen negativa
    const excellent = ((hasBasal && tgBasal < 0.2) || (hasStim && tgStim < 1.0)) && d.tgAb === 'neg' && d.imaging === 'neg';

    if (biochemInc && d.imaging === 'neg') {
      cat = 'Respuesta Bioquímicamente Incompleta';
      tier = 'highint';
      reason = 'Tg basal > 1.0 ng/mL, o Tg estimulada > 10 ng/mL, o anticuerpos TgAb en ascenso progresivo con estudios de imagen negativos.';
    } else if (excellent) {
      cat = 'Respuesta Excelente';
      tier = 'low';
      reason = 'Tg basal < 0.2 ng/mL y/o Tg estimulada < 1.0 ng/mL, TgAb negativos y estudios de imagen negativos.';
    } else {
      cat = 'Respuesta Indeterminada';
      tier = 'lowint';
      reason = 'Tg basal 0.2 – 1.0 ng/mL, Tg estimulada 1.0 – 10.0 ng/mL, TgAb positivos estables/en descenso, o hallazgos inespecíficos en imagen.';
    }
  } else {
    // Tiroidectomía Total SIN RAI (Tabla 9, col 3)
    const biochemInc = (hasBasal && tgBasal > 5.0) || d.tgAb === 'rising';
    const excellent = hasBasal && tgBasal < 2.5 && d.tgAb === 'neg' && d.imaging === 'neg';

    if (biochemInc && d.imaging === 'neg') {
      cat = 'Respuesta Bioquímicamente Incompleta (Sin RAI)';
      tier = 'highint';
      reason = 'Tg no estimulada > 5.0 ng/mL o TgAb en ascenso progresivo con imagen negativa (umbral específico sin ablación previa, Tabla 9).';
    } else if (excellent) {
      cat = 'Respuesta Excelente (Sin RAI)';
      tier = 'low';
      reason = 'Tg no estimulada < 2.5 ng/mL con TgAb negativos e imagen negativa (umbral de la Tabla 9; discusión R30: «serum Tg levels up to 1–2.5 ng/mL while on LT4 therapy generally identify patients at low risk»).';
    } else {
      cat = 'Respuesta Indeterminada (Sin RAI)';
      tier = 'lowint';
      reason = 'Tg no estimulada entre 2.5 y 5.0 ng/mL, TgAb estables/en descenso o hallazgos inespecíficos en imagen.';
    }
  }

  // Riesgo Residual de Recurrencia Estructural según Figura 6 y texto de la sección de riesgo dinámico
  const noRAI = d.surgeryType !== 'tt_rai';
  let residualRisk = '5 – 20%';
  if (tier === 'none') {
    residualRisk = '—';
  } else if (d.surgeryType === 'hemi' && !cat.includes('Excelente') && !cat.includes('Estructuralmente')) {
    residualRisk = '— (Tabla 9: N/A en hemitiroidectomía)';
  } else if (cat.includes('Excelente') && noRAI) {
    residualRisk = '0 – 1.6% (lobectomía o TT sin RAI; Lee et al.: 7.4%; texto, no Fig. 6)';
  } else if (cat.includes('Excelente')) {
    if (initialTier === 'low') residualRisk = '< 2% (0.2 – 2%)';
    else if (initialTier === 'lowint' || initialTier === 'highint') residualRisk = '< 12% (1 – 12%)';
    else residualRisk = '3 – 15% (Era Alto Riesgo inicial: mantener vigilancia estrecha pese a excelente respuesta)';
  } else if (cat.includes('Indeterminada')) {
    residualRisk = noRAI ? '0 – 5.6% (sin RAI; texto, no Fig. 6)' : '5 – 20%';
  } else if (cat.includes('Bioquímicamente')) {
    residualRisk = noRAI ? '0 – 31.6% (sin RAI; texto, no Fig. 6)' : '20 – 53% (tasa de recurrencia)';
  } else if (cat.includes('Estructuralmente')) {
    residualRisk = '100% (enfermedad persistente presente)';
  }

  // Meta de TSH y Plan de Vigilancia (Tabla 9, R31, R45–R50, R58)
  let tshGoal = 'Dentro del rango normal de referencia [Tabla 9, R46A]';
  let actionPlan = '';

  if (tier === 'none') {
    tshGoal = '—';
    actionPlan = 'Complete los valores de laboratorio para obtener el plan de vigilancia.';
  } else if (tier === 'high') {
    tshGoal = 'Por debajo del rango normal de referencia; individualizar (FA, osteoporosis). Datos sobre la meta óptima no concluyentes [Tabla 9 nota c, R45]';
    actionPlan = 'Ganglios sospechosos ≥ 8–10 mm (eje corto): realizar PAAF con lavado de Tg (R31E). Si son < 8–10 mm sin amenazar estructuras vitales, pueden vigilarse (R31D). Para reoperar, la guía sugiere que el umbral previo de 8 mm podría elevarse a ≥15 mm en el compartimento central; alternativas: cirugía compartimental, ablación con etanol/RFA (R52) o I-131 si es ávido. Si es refractario a yodo (RAIR): biomarcadores y lenvatinib/sorafenib (R61–R62); terapias dirigidas según alteración NTRK, RET, ALK, BRAF (R67–R70).';
  } else if (tier === 'highint') {
    tshGoal = 'Por debajo del rango normal de referencia, sopesando comorbilidades. Datos sobre la meta óptima no concluyentes [Tabla 9 nota c, R45]';
    actionPlan = 'Tg/TgAb cada 6–12 meses, con mayor frecuencia en riesgo intermedio-alto/alto (R47C), y US cervical. Si Tg o TgAb suben y el US de cuello es negativo, considerar TC de tórax/hueso (R31F); en OTC/PDTC con Tg/TgAb en ascenso y US negativo, 18FDG-PET/CT (R31G); en alto riesgo con Tg elevada (generalmente >10 ng/mL), sobre todo OTC/histología agresiva o rastreo negativo, 18FDG-PET/CT (R50A). Considerar I-131 empírico (100–200 mCi) solo si Tg está francamente elevada/en rápido ascenso y la imagen no muestra foco operable (R58B).';
  } else if (tier === 'lowint' && d.surgeryType === 'hemi') {
    tshGoal = 'Dentro del rango normal de referencia [Tabla 9]';
    actionPlan = 'Nódulos del lóbulo residual: vigilar según las guías ATA de nódulo (R48.5); US cervical cada 1–3 años por 5–8 años (Tabla 11). No se recomienda Tg de rutina tras lobectomía (R48.6).';
  } else if (tier === 'lowint') {
    tshGoal = 'Dentro del rango normal de referencia [Tabla 9]';
    actionPlan = 'Con Tg estimulada < 10 ng/mL (tras suspensión LT4) o < 5 ng/mL (con rhTSH), mantener solo hormona tiroidea y seguimiento seriado cada 6–12 meses sin I-131 empírico (R58A). La mayoría de estos pacientes tiene una buena respuesta clínica, especialmente si su riesgo inicial es bajo (Tabla 9).';
  } else if (initialTier !== 'low') {
    tshGoal = 'Dentro del rango normal de referencia [Tabla 9, R46A]';
    actionPlan = 'Respuesta excelente con riesgo inicial no bajo: el desescalamiento de R48 (Tabla 11) aplica solo a DTC de bajo riesgo. Mantener vigilancia según el riesgo inicial (recurrencia pese a respuesta excelente: hasta 12% en intermedio y 3–15% en alto riesgo): Tg/TgAb cada 6–12 meses y US cervical periódico.';
  } else {
    tshGoal = 'Dentro del rango normal de referencia [Tabla 9, R46A]';
    if (d.surgeryType === 'hemi') {
      actionPlan = 'Desescalamiento (R48.5 y R48.6, Tabla 11): US cervical cada 1–3 años durante 5–8 años. No se recomienda medir Tg sérica de rutina en el seguimiento tras lobectomía.';
    } else {
      actionPlan = 'Desescalamiento (R48.1–4, Tabla 11): US cervical cada 1–3 años. Si mantiene Respuesta Excelente sostenida por 5–8 años, SUSPENDER ecografía de rutina y seguir solo con Tg/TgAb cada 1–2 años. A los 10–15 años de respuesta excelente sostenida, se declara REMISIÓN COMPLETA y se suspende el monitoreo bioquímico.';
    }
  }

  return { cat, tier, reason, residualRisk, tshGoal, actionPlan };
}

// --- Estados iniciales (también usados por «Nuevo paciente») ---
const INITIAL_POSTOP = {
    ageGroup: 'lt55', // 'lt55' | '55to70' | 'gt70'
    histo: 'ptc_clasico',
    highGradeFeatures: false,
    follPattern: 'mi', // 'mi' | 'ea' | 'wi'
    size: '1to2', // 'lte1' | '1to2' | '2to4' | 'gt4'
    ete: 'none', // 'none' | 'micro' | 'strap' | 't4a' | 't4b'
    margins: 'r0', // 'r0' | 'r1_ant' | 'r1_post' | 'r2'
    vi: 'none', // 'none' | 'lim' | 'ext'
    focality: 'uni', // 'uni' | 'multi_uni' | 'multi_bil_gt1'
    nodes: 'n0', // 'n0' | 'n1a_mod' | 'n1b_lat' | 'big3cm' | 'ene'
    lnrHigh: false,
    metastasis: 'm0', // 'm0' | 'm1'
    mol: 'none', // 'none' | 'braf' | 'tert_combo'
  };
const INITIAL_DYNAMIC = {
    surgeryType: 'tt_rai', // 'tt_rai' | 'tt_norai' | 'hemi'
    tshExact: '',
    tgBasal: '',
    tgStim: '',
    tgAbExact: '',
    tgAb: 'neg', // 'neg' | 'stable' | 'rising'
    imaging: 'neg', // 'neg' | 'nonspec' | 'structural'
    hemiLobe: 'normal', // 'normal' | 'suspicious'
  };
const INITIAL_SURG = {
    cT: 't1a',
    laterality: 'uni',
    cN: 'n0',
    cM: 'm0',
    posteriorAbutment: 'no',
  };
const INITIAL_NODULE = {
    comp: 'solid', echo: 2, shape: 0, margin: 0, foci: { macro: false, rim: false, punct: false }, sizeCm: '1.6', bethesda: 'none'
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
      out += `1. ESTRATIFICACIÓN POSOPERATORIA INICIAL (ATA 2025 Fig. 2 & AJCC 8.ª Ed.):\n`;
      out += `• Histotipo (OMS 5.ª ed.): ${postopRes.histObj?.full || 'NIFTP'}\n`;
      out += `• Estadio Anatómico T: p${postopRes.pT} | Mortalidad (AJCC 8.ª): ${postopRes.ajccStage}\n`;
      out += `• RIESGO DE RECURRENCIA ESTRUCTURAL ATA 2025: ${postopRes.label} (${postopRes.pct})\n`;
      out += `• Factores determinantes:\n  ${postopRes.drivers.join('\n  ')}\n\n`;
      out += `2. CONDUCTA DE YODO RADIACTIVO (I-131) [Tabla 10 / R32]:\n`;
      out += `• Indicación: ${postopRes.rai.rec}\n`;
      out += `• Actividad sugerida: ${postopRes.rai.act}\n`;
      out += `• Objetivo: ${postopRes.rai.goal}\n`;
      if (!postopRes.isNIFTP) out += `• Preparación y Rastreo: Estímulo preferido con rhTSH (meta TSH >30 mUI/L, R34) y dieta baja en yodo por 1-2 semanas (R35). Realizar Rastreo Corporal Post-Terapia (RxWBS ± SPECT/CT) a los 2–10 días de la dosis (R37, R38).\n`;
      out += `\n`;
      out += `3. EVALUACIÓN DINÁMICA Y VIGILANCIA [Tabla 9 / Fig. 6 / R45-R48]:\n`;
      out += `• Laboratorios registrados: TSH: ${dynamic.tshExact || 'N/D'} mUI/L | Tg basal: ${dynamic.tgBasal || 'N/D'} ng/mL | Tg estim: ${dynamic.tgStim || 'N/D'} ng/mL | TgAb: ${dynamic.tgAbExact || 'N/D'} UI/mL (${dynamic.tgAb})\n`;
      out += `• Categoría de Respuesta: ${dynRes.cat}\n`;
      out += `• Riesgo Residual Re-estimado (Fig. 6): ${dynRes.residualRisk}\n`;
      out += `• Meta de TSH: ${dynRes.tshGoal}\n`;
      out += `• Plan de Seguimiento: ${dynRes.actionPlan}\n`;
      out += `──────────────────────────────────────────────────\n`;
      out += `Ref: Ringel MD, Sosa JA, et al. 2025 ATA Management Guidelines for Adult Patients with DTC. Thyroid 2025;35(8):841-985. Corrigendum: Thyroid 2025;35(11):1350 (doi: 10.1177/10507256251387671).`;
      copyTextSafe(out, 'emr');
    } else if (mode === 'excel') {
      const headers = [
        'Fecha', 'ID_Paciente', 'Grupo_Edad', 'Histologia_OMS2025', 'Patron_Folicular',
        'Tamano', 'ETE', 'Estadio_pT', 'Margenes', 'Invasion_Vascular', 'Focalidad',
        'Ganglios_N', 'LNR_Alto', 'Metastasis_M', 'Molecular', 'Riesgo_ATA2025',
        'Porcentaje_Recurrencia', 'Estadio_AJCC8', 'Ind_RAI', 'Dosis_RAI',
        'Tipo_Cirugia_Seg', 'TSH_Exacta_mUIL', 'Tg_Basal_ngmL', 'Tg_Estim_ngmL',
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 grid grid-cols-4 gap-1 sm:gap-1.5">
          {[
            { id: 'postop', icon: <IconShield />, l: 'Patología', s: 'Riesgo · Fig. 2' },
            { id: 'dynamic', icon: <IconActivity />, l: 'Seguimiento', s: 'Respuesta · Tabla 9' },
            { id: 'surgery', icon: <IconScalpel />, l: 'Cirugía', s: 'Preoperatoria · Tabla 5' },
            { id: 'nodule', icon: <IconSearch />, l: 'Nódulo', s: 'TI-RADS · Bethesda' },
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
                <span className="text-[11px] sm:text-sm">{t.l}</span>
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
      <main className="max-w-7xl mx-auto px-4 pt-5">
        
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
                      2. Subtipo Histológico Exacto (OMS 5.ª Ed. / Tabla 3 ATA 2025)
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase block mb-1">PTC — Subtipos No Agresivos</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => h.group === 'ptc_low').map(h => (
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-orange-700 uppercase block mb-1">PTC — Subtipos Agresivos (Intermedio–Alto directo)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => h.group === 'ptc_agg').map(h => (
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1">Espectro Folicular (FTC / IEFVPTC) y Oncocítico (OTC)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => h.group === 'foll' || h.group === 'otc').map(h => (
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-blue-700 border-blue-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-red-700 uppercase block mb-1">Alto Grado / Especiales / Bajo Potencial (R1)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {HISTO_OPTIONS.filter(h => ['high_grade', 'special', 'benign_pot'].includes(h.group)).map(h => (
                            <button
                              key={h.id}
                              onClick={() => setPostop({ ...postop, histo: h.id })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                postop.histo === h.id ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {h.label}
                            </button>
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

                    {/* Sub-selector exclusivo si elige FTC / IEFVPTC / OTC */}
                    {isFollSelected && (
                      <div className="mt-4 pt-3 border-t border-slate-200 bg-blue-50/60 p-3 rounded-xl">
                        <label className="block text-[11px] font-black uppercase text-blue-900 mb-2">
                          Patrón de Invasión Capsular/Parenquimatosa (Eje FTC/OTC Fig. 2):
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
                        5. Estado Ganglionar Cervical (N) — Desglose Fig. 2
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[
                          { v: 'n0', l: 'pN0 / cN0 [Bajo]' },
                          { v: 'n1a_micro', l: 'pN1a micrometástasis (≤ 5 ganglios, todos ≤ 2 mm) [Bajo; cuenta como N1 en AJCC]' },
                          { v: 'n1a_mod', l: 'cN1a, o pN1a (> 5 ganglios o foco > 2 mm) [Bajo–Intermedio]' },
                          { v: 'n1b_lat', l: 'cN1b lateral clínicamente evidente (< 3 cm) [Intermedio–Alto]' },
                          { v: 'big3cm', l: 'Cualquier ganglio metastásico ≥ 3 cm (cN1) [Alto Riesgo]' },
                          { v: 'ene', l: 'Extensión extranodal (ENE) del tumor metastásico [Alto Riesgo]' }
                        ].map(o => (
                          <button
                            key={o.v}
                            onClick={() => setPostop({ ...postop, nodes: o.v })}
                            className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all ${
                              postop.nodes === o.v ? 'bg-teal-700 border-teal-700 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {o.l}
                          </button>
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
                            { v: 'multi_bil_le1', l: 'Multifocal bilateral, todos ≤1 cm (no definido en Fig. 2)' }
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
                        1. Tratamiento inicial recibido (define los umbrales de Tabla 9)
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

                  </div>

                  <div className="bg-white p-5 rounded-2xl border-2 border-teal-600 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-teal-900 mb-1">
                      2. Valores de laboratorio
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Clasifican la respuesta (Tabla 9) en tiempo real y se incluyen en la nota y en la fila de Excel.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* TSH */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <label className="block text-xs font-black text-slate-700 uppercase">TSH Sérica (mUI/L)</label>
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
                          <div><b>Meta de TSH según respuesta (Tabla 9):</b></div>
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
                          <div><b>• TT + RAI (Tabla 9):</b> Excelente &lt;1.0 | Indet. 1.0–10.0 | Incomp. &gt;10.0</div>
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
                          Riesgo Estructural Inicial · ATA 2025 (Fig. 2)
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
                            Preparación, rastreo post-terapia y controles (R29–R38, R47C)
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
                        Re-estratificación Dinámica · Tabla 9 & Fig. 6
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
                        <span className="font-bold text-slate-500">Riesgo Residual (Fig. 6):</span>
                        <span className="font-black text-slate-900 text-right">{dynRes.residualRisk}</span>
                      </div>
                      <div className="flex justify-between gap-2 border-t border-slate-100 pt-1.5">
                        <span className="font-bold text-slate-500">Meta de TSH (Tabla 9):</span>
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
                Planificación Quirúrgica Preoperatoria y Vigilancia Activa (Tabla 5, R11–R25)
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
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Ganglios Clínicos (cN)</label>
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
                  ? 'Tiroidectomía Total [Tabla 5 / R15C]'
                  : surg.laterality === 'bil'
                  ? 'Tiroidectomía Total (cáncer bilateral) [R15A / Tabla 5]'
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
                Seleccione una opción en cada una de las primeras cuatro categorías y <b>todas las que apliquen</b> en focos ecogénicos; se suman los puntos (Fig. 1).
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
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Citología Bethesda (si existe)</label>
                  <select value={nodule.bethesda} onChange={e => setNodule({ ...nodule, bethesda: e.target.value })} className="w-full p-2 border rounded-lg bg-slate-50 font-semibold">
                    {Object.entries(BETHESDA).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              {(() => {
                const t = evaluateTirads(nodule);
                const bth = BETHESDA[nodule.bethesda];
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
                    {bth.rom && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-mono uppercase text-slate-500 block">Bethesda 2023 · Riesgo de malignidad</span>
                        <div className="text-sm font-black text-slate-900 mt-0.5">{bth.label}</div>
                        <div className="text-xs font-semibold text-slate-800 mt-1">ROM: {bth.rom}</div>
                        <div className="text-xs text-slate-700 mt-1 leading-snug">Manejo: {bth.mgmt}</div>
                        <div className="text-[10px] text-slate-500 mt-1.5 leading-snug">Fuente secundaria: PathologyOutlines.com (Suzuki A, Bychkov A; act. 12-jun-2025), resumen de Ali SZ, et al. Thyroid 2023;33:1039. Se recomienda calcular el ROM institucional.</div>
                      </div>
                    )}
                    <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950">
                      <strong className="block mb-1">Nota de Transición ATA 2025 (R9, R10):</strong>
                      Una vez confirmado el diagnóstico de cáncer diferenciado de tiroides (Bethesda VI o molecular positivo), <b>no se recomienda</b> medir Tg ni TgAb preoperatorias de rutina (R9) ni la evaluación genómica de rutina antes de la cirugía; si el perfil ya se conoce, puede considerarse para informar la extensión quirúrgica (R10). Proceda a la pestaña <b>3. Cirugía Preoperatoria</b>.
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        <footer className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <b>Fuentes verificadas:</b> Ringel MD, Sosa JA, et al. 2025 ATA Management Guidelines for Adult Patients with DTC. Thyroid 2025;35(8):841–985 (DOI: 10.1177/10507256251363120) + Corrigendum Thyroid 2025;35(11):1350 (Fig. 2, Fig. 6, Tablas 3, 4, 5, 6, 8, 9, 10 y 11) · Pestaña Nódulo: ACR TI-RADS 2017 (Tessler FN, et al. JACR 2017;14:587–595) y Bethesda 2023 (resumen PathologyOutlines de Ali SZ, et al. Thyroid 2023;33:1039). Herramienta de apoyo; no sustituye el juicio clínico. Los datos no salen del dispositivo.
        </footer>
      </main>

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