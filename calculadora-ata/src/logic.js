// Lógica clínica pura (sin interfaz): ATA 2025, AJCC 8.ª, ACR TI-RADS 2017 y Bethesda 2023.
// Cubierta por pruebas en src/logic.test.js

// --- DICCIONARIOS OMS 2022/2025 (Tabla 3 ATA 2025) ---
export const HISTO_OPTIONS = [
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
  { id: 'ftc', group: 'foll', label: 'FTC (Folicular)', full: 'Carcinoma Folicular de Tiroides (FTC)', info: 'FTC: carcinoma folicular de tiroides (follicular thyroid carcinoma).' },
  { id: 'iefvptc', group: 'foll', label: 'IEFVPTC (Folicular Encapsulado Invasivo)', full: 'Variante Folicular Encapsulada Invasiva de PTC (IEFVPTC)', info: 'IEFVPTC: variante folicular encapsulada invasiva del carcinoma papilar de tiroides (invasive encapsulated follicular variant of papillary thyroid carcinoma).' },
  { id: 'otc', group: 'otc', label: 'OTC (Oncocítico / Hürthle)', full: 'Carcinoma Oncocítico de Tiroides (OTC, ≥75% células oncocíticas)', info: 'OTC: carcinoma oncocítico de tiroides (oncocytic thyroid carcinoma), también llamado de células de Hürthle. Según la OMS, neoplasia compuesta por ≥75% de células oncocíticas.' },
  // Alto Grado (Alto Riesgo directo)
  { id: 'dhgtc_pdtc', group: 'high_grade', label: 'Alto Grado (DHGTC / PDTC)', full: 'Carcinoma Diferenciado de Alto Grado (DHGTC) o Pobremente Diferenciado (PDTC - Turín)', info: 'DHGTC: carcinoma de tiroides diferenciado de alto grado (differentiated high-grade thyroid carcinoma). PDTC: carcinoma de tiroides pobremente diferenciado (poorly differentiated thyroid carcinoma; criterios de Turín).' },
  // Especiales / Síndromes / Bajo potencial maligno
  { id: 'cmtc', group: 'special', label: 'Cribriforme-Morular (CMTC)', full: 'Carcinoma Tiroides Cribriforme-Morular (Asociado a gen APC / Poliposis Familiar)', info: 'CMTC: carcinoma de tiroides cribriforme-morular (cribriform-morular thyroid carcinoma).' },
  { id: 'niftp', group: 'benign_pot', label: 'NIFTP / FT-UMP / HTT', full: 'Neoplasia Folicular No Invasiva (NIFTP) o Potencial Maligno Incierto (FT-UMP / HTT)', info: 'NIFTP: neoplasia folicular no invasiva con rasgos nucleares de tipo papilar (noninvasive follicular thyroid neoplasm with papillary-like nuclear features). FT-UMP: tumor folicular de potencial maligno incierto (follicular tumor of uncertain malignant potential). HTT: tumor trabecular hialinizante (hyalinizing trabecular tumor).' },
];

// Bethesda 2023 (3.ª ed.). Fuente: Suzuki A, Bychkov A. Bethesda system diagnostic categories. PathologyOutlines.com
// (act. 12-jun-2025), que resume Ali SZ, et al. Thyroid 2023;33:1039. ROM: «NIFTP = maligno» / «NIFTP ≠ maligno».
export const BETHESDA = {
  none: { label: 'Sin citología' },
  '1': { label: 'I — No diagnóstica', rom: '10 – 13% de todos los nódulos; hasta 30% de los resecados', mgmt: 'Repetir PAAF, excepto quiste puro.' },
  '2': { label: 'II — Benigna', rom: '< 3%', mgmt: 'Seguimiento según el patrón ecográfico.' },
  '3n': { label: 'III — AUS con atipia nuclear', rom: '36 – 44% (AUS global: 13 – 30% con NIFTP = maligno; 6 – 20% con NIFTP ≠ maligno)', mgmt: 'Repetir PAAF o prueba molecular.' },
  '3o': { label: 'III — AUS, otra atipia', rom: '15 – 23% (AUS global: 13 – 30% con NIFTP = maligno; 6 – 20% con NIFTP ≠ maligno)', mgmt: 'Repetir PAAF o prueba molecular.' },
  '4': { label: 'IV — Neoplasia folicular', rom: '23 – 34% (NIFTP = maligno) o 23% (NIFTP ≠ maligno)', mgmt: 'Lobectomía diagnóstica o prueba molecular.' },
  '4o': { label: 'IV — Neoplasia folicular oncocítica', rom: '25 – 50%', mgmt: 'Lobectomía diagnóstica o prueba molecular.' },
  '5': { label: 'V — Sospechosa de malignidad', rom: '74% (NIFTP = maligno) o 65% (NIFTP ≠ maligno)', mgmt: 'Cirugía (habitualmente).' },
  '6': { label: 'VI — Maligna', rom: '97 – 100% (NIFTP = maligno) o 94% (NIFTP ≠ maligno)', mgmt: 'Cirugía (habitualmente). La categoría abarca desde PTC (lo más frecuente) hasta carcinoma medular, anaplásico o linfoma; la pestaña Cirugía (ATA 2025) aplica solo a cáncer diferenciado.' },
};

// --- ACR TI-RADS 2017 (Tessler FN, et al. J Am Coll Radiol 2017;14:587-595, Fig. 1) ---
export const TIRADS_COMP = {
  cystic: { l: 'Quístico o casi quístico', pts: 0 },
  spongiform: { l: 'Espongiforme', pts: 0 },
  mixed: { l: 'Mixto quístico y sólido', pts: 1 },
  solid: { l: 'Sólido o casi sólido', pts: 2 },
  undet: { l: 'No determinable (calcificación)', pts: 2 },
};
export const TIRADS_FOCI = [
  { k: 'macro', l: 'Macrocalcificaciones (sombra acústica)', pts: 1 },
  { k: 'rim', l: 'Calcificaciones periféricas (anillo)', pts: 2 },
  { k: 'punct', l: 'Focos ecogénicos puntiformes', pts: 3 },
];

export function evaluateTirads(n) {
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
  if (n.comp !== 'spongiform' && n.margin === 3) notes.push('Extensión extratiroidea evidente = malignidad. La ETE mínima debe reportarse con cautela.');

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


// --- MOTOR POSOPERATORIO ATA 2025 (Fig. 2 + AJCC 8va Ed. Tabla 6) ---
export function evaluatePostop(p) {
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
      warnings.push('Incoherencia patológica: «Mínimamente invasivo (solo invasión capsular)» excluye invasión vascular. Si hay vasos invadidos, el tumor es «Encapsulado angioinvasivo» (guía: «Minimally invasive: capsular only»).');
    }
    if (p.follPattern === 'ea' && p.vi === 'none') {
      warnings.push('Incoherencia patológica: «Encapsulado angioinvasivo» requiere especificar si la invasión vascular es limitada (<4 vasos → Bajo-Intermedio) o extensa (≥4 vasos → Alto Riesgo).');
    }
  }

  // 1. CRITERIOS DE ALTO RIESGO (>30% recurrencia estructural - Fig. 2)
  if (pT === 'T3b') high.push('pT3b: Extensión extratiroidea macroscópica a músculos pretiroideos (esternohioideo, esternotiroideo, tirohioideo u omohioideo)');
  if (pT === 'T4a') high.push('pT4a: Extensión extratiroidea macroscópica a tejidos blandos, laringe, tráquea, esófago o nervio laríngeo recurrente');
  if (pT === 'T4b') high.push('pT4b: Invasión macroscópica de fascia prevertebral o engloba carótida / vasos mediastinales');
  if (pT === 'T3a' && p.ete === 'micro') high.push('Combinación crítica: Tumor pT3a (>4 cm) + Extensión extratiroidea microscópica (48% riesgo de recurrencia, Chereau et al.)');
  if (histObj.group === 'high_grade' || p.highGradeFeatures) high.push('Histología de Alto Grado (PDTC criterios de Turín o DHGTC con ≥5 mitosis/2mm² o necrosis tumoral)');
  if (p.margins === 'r2') high.push('Márgenes R2: Resección macroscópicamente incompleta (texto: «residual gross disease (R2) are categorized as ATA high-risk»)');
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
    lowInt.push('pT3a: Tumor > 4 cm confinado a la tiroides (factor calificante de banda Bajo-Intermedio)');
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
    if (p.vi === 'lim' || p.vi === 'ext') intHigh.push('Invasión vascular presente en PTC (cualquier número de vasos clasifica en Intermedio-Alto)');
    if (p.focality === 'multi_bil_gt1') intHigh.push('Multifocalidad bilateral con al menos un foco > 1 cm');
    if (p.focality === 'multi_bil_le1') warnings.push('Multifocalidad bilateral con todos los focos ≤1 cm: la guía no la clasifica (Bajo exige «Unifocal»; Bajo-Int lista «Unilateral multifocality»; Int-Alto «Bilateral multifocality >1 cm»). No se sumó como factor: decidir con juicio clínico.');
  }

  // LNR elevado como modulador clínico (R16, R20, R28)
  if (p.lnrHigh) {
    warnings.push('Modulador ganglionar adicional (R16/R20/R28): Un Ratio Ganglionar (LNR = ganglios positivos / total disecados) elevado (>0.25–0.5 según estudio; >0.3 en la discusión de R16) se asocia a mayor riesgo de recurrencia.');
  }

  if (histObj.id === 'cmtc') {
    warnings.push('Alerta Genética (R2C): El Carcinoma Cribriforme-Morular se asocia en ~40% a Poliposis Adenomatosa Familiar (gen APC) y puede preceder a los pólipos colónicos. Considerar pruebas genéticas/consejería (R2C) y evaluación de alto riesgo colorrectal según NCCN.');
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
    intHigh.push(`Regla de 2+ factores Bajo-Intermedio: coexistencia de ${lowIntFactors} factores Bajo-Intermedio${pT === 'T3a' ? ' en tumor T3a' : ''}`);
  } else if (lowInt.length >= 1) {
    tier = 'lowint'; label = 'BAJO–INTERMEDIO'; pct = '10 – 15%';
  } else {
    tier = 'low'; label = 'BAJO'; pct = '< 10%';
  }

  // Modulador Molecular Posoperatorio (R28B, Tabla 8)
  if (p.mol === 'tert_combo') {
    warnings.push('Alto Riesgo Molecular (R28B): BRAF V600E + TERT → RR 15.09 de mortalidad específica; RAS + TERT → HR ~106 de recurrencia; BRAF V600E + TERT o TP53 se asocia a pérdida de avidez por yodo. Si se obtuvo, puede usarse para estimar mejor el riesgo derivado del sistema ATA 2025 (R28B).' + (isFoll && !isOTC ? ' En FTC/IEFVPTC aplica la categoría «Follicular Carcinoma and IEFVPTC» (corrigendum 2025).' : ''));
  }

  // ESTADIFICACIÓN AJCC 8va EDICIÓN (Mortalidad Específica - Tabla 6)
  const isN1 = p.nodes !== 'n0'; // n1a_micro también es N1 en AJCC
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
      ref: 'R32D (Fuerte, certeza moderada) · R55A'
    };
  } else if (tier === 'high') {
    rai = {
      rec: 'SÍ — Recomendado de rutina (Adyuvancia)',
      act: '100 – 150 mCi (3.7–5.55 GBq)',
      goal: 'Ablación de remanente y terapia adyuvante para erradicar enfermedad microscópica sospechada.',
      ref: 'R32C (Fuerte, certeza moderada)'
    };
  } else if (tier === 'highint') {
    rai = {
      rec: 'CONSIDERAR',
      act: '30 – 100 mCi (1.1–3.7 GBq)',
      goal: 'Ablación de remanente ± terapia adyuvante.',
      ref: 'R32B (Condicional, certeza baja)'
    };
  } else if (tier === 'lowint') {
    rai = {
      rec: 'CONSIDERAR (Individualizar con Tg/US posoperatorios)',
      act: '30 – 100 mCi (1.1–3.7 GBq)',
      goal: 'Ablación de remanente ± terapia adyuvante. La Tg/US posoperatoria (R29) puede orientar a no administrar o a usar una actividad menor.',
      ref: 'R32B (Condicional, certeza baja) · R29'
    };
  } else {
    rai = {
      rec: 'NO RECOMENDADO DE RUTINA (Observación)',
      act: '0 mCi (Si excepcionalmente se ablaciona: 30–50 mCi / 1.1–1.85 GBq)',
      goal: 'Ninguno o ablación de remanente. ESTIMABL2: no-inferioridad de omitir I-131 en bajo riesgo; HiLo: 30 mCi no inferior a 100 mCi para ablación.',
      ref: 'R32A (Fuerte, certeza alta)'
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
export function evaluateDynamic(d, initialTier) {
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
      reason = 'Lóbulo contralateral normal (o nódulos benignos/bajo riesgo) sin ganglios anormales en ultrasonido.';
    } else {
      cat = 'Hallazgos Inespecíficos / Indeterminados Post-Lobectomía';
      tier = 'lowint';
      reason = d.hemiLobe === 'suspicious'
        ? 'Nódulo sospechoso en el lóbulo contralateral: no cumple el criterio de respuesta excelente post-lobectomía. Evaluarlo como nódulo (TI-RADS / PAAF) según las guías ATA de nódulo (R48.5).'
        : 'En lobectomía la guía solo formaliza Respuesta Excelente y Estructuralmente Incompleta; vigilar nódulos contralaterales o tendencia de TgAb.';
    }
  } else if (d.surgeryType !== 'hemi' && !hasBasal && !hasStim && d.tgAb !== 'rising') {
    cat = 'Sin datos de Tg';
    tier = 'none';
    reason = 'Ingrese la Tg (no estimulada y/o estimulada) para clasificar la respuesta según la guía.';
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
      reason = 'Tg no estimulada > 5.0 ng/mL o TgAb en ascenso progresivo con imagen negativa (umbral específico sin ablación previa).';
    } else if (excellent) {
      cat = 'Respuesta Excelente (Sin RAI)';
      tier = 'low';
      reason = 'Tg no estimulada < 2.5 ng/mL con TgAb negativos e imagen negativa (umbral de la guía; discusión R30: «serum Tg levels up to 1–2.5 ng/mL while on LT4 therapy generally identify patients at low risk»).';
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
    residualRisk = '— (N/A en hemitiroidectomía)';
  } else if (cat.includes('Excelente') && noRAI) {
    residualRisk = '0 – 1.6% (lobectomía o TT sin RAI; Lee et al.: 7.4%)';
  } else if (cat.includes('Excelente')) {
    if (initialTier === 'low') residualRisk = '< 2% (0.2 – 2%)';
    else if (initialTier === 'lowint' || initialTier === 'highint') residualRisk = '< 12% (1 – 12%)';
    else residualRisk = '3 – 15% (Era Alto Riesgo inicial: mantener vigilancia estrecha pese a excelente respuesta)';
  } else if (cat.includes('Indeterminada')) {
    residualRisk = noRAI ? '0 – 5.6% (sin RAI)' : '5 – 20%';
  } else if (cat.includes('Bioquímicamente')) {
    residualRisk = noRAI ? '0 – 31.6% (sin RAI)' : '20 – 53% (tasa de recurrencia)';
  } else if (cat.includes('Estructuralmente')) {
    residualRisk = '100% (enfermedad persistente presente)';
  }

  // Meta de TSH y Plan de Vigilancia (Tabla 9, R31, R45–R50, R58)
  let tshGoal = 'Dentro del rango normal de referencia [R46A]';
  let actionPlan = '';

  if (tier === 'none') {
    tshGoal = '—';
    actionPlan = 'Complete los valores de laboratorio para obtener el plan de vigilancia.';
  } else if (tier === 'high') {
    tshGoal = 'Por debajo del rango normal de referencia; individualizar (FA, osteoporosis). Datos sobre la meta óptima no concluyentes [R45]';
    actionPlan = 'Ganglios sospechosos ≥ 8–10 mm (eje corto): realizar PAAF con lavado de Tg (R31E). Si son < 8–10 mm sin amenazar estructuras vitales, pueden vigilarse (R31D). Para reoperar, la guía sugiere que el umbral previo de 8 mm podría elevarse a ≥15 mm en el compartimento central; alternativas: cirugía compartimental, ablación con etanol/RFA (R52) o I-131 si es ávido. Si es refractario a yodo (RAIR): biomarcadores y lenvatinib/sorafenib (R61–R62); terapias dirigidas según alteración NTRK, RET, ALK, BRAF (R67–R70).';
  } else if (tier === 'highint') {
    tshGoal = 'Por debajo del rango normal de referencia, sopesando comorbilidades. Datos sobre la meta óptima no concluyentes [R45]';
    actionPlan = 'Tg/TgAb cada 6–12 meses, con mayor frecuencia en riesgo intermedio-alto/alto (R47C), y US cervical. Si Tg o TgAb suben y el US de cuello es negativo, considerar TC de tórax/hueso (R31F); en OTC/PDTC con Tg/TgAb en ascenso y US negativo, 18FDG-PET/CT (R31G); en alto riesgo con Tg elevada (generalmente >10 ng/mL), sobre todo OTC/histología agresiva o rastreo negativo, 18FDG-PET/CT (R50A). Considerar I-131 empírico (100–200 mCi) solo si Tg está francamente elevada/en rápido ascenso y la imagen no muestra foco operable (R58B).';
  } else if (tier === 'lowint' && d.surgeryType === 'hemi') {
    tshGoal = 'Dentro del rango normal de referencia';
    actionPlan = 'Nódulos del lóbulo residual: vigilar según las guías ATA de nódulo (R48.5); US cervical cada 1–3 años por 5–8 años. No se recomienda Tg de rutina tras lobectomía (R48.6).';
  } else if (tier === 'lowint') {
    tshGoal = 'Dentro del rango normal de referencia';
    actionPlan = 'Con Tg estimulada < 10 ng/mL (tras suspensión LT4) o < 5 ng/mL (con rhTSH), mantener solo hormona tiroidea y seguimiento seriado cada 6–12 meses sin I-131 empírico (R58A). La mayoría de estos pacientes tiene una buena respuesta clínica, especialmente si su riesgo inicial es bajo.';
  } else if (initialTier !== 'low') {
    tshGoal = 'Dentro del rango normal de referencia [R46A]';
    actionPlan = 'Respuesta excelente con riesgo inicial no bajo: el desescalamiento de R48 aplica solo a DTC de bajo riesgo. Mantener vigilancia según el riesgo inicial (recurrencia pese a respuesta excelente: hasta 12% en intermedio y 3–15% en alto riesgo): Tg/TgAb cada 6–12 meses y US cervical periódico.';
  } else {
    tshGoal = 'Dentro del rango normal de referencia [R46A]';
    if (d.surgeryType === 'hemi') {
      actionPlan = 'Desescalamiento (R48.5 y R48.6): US cervical cada 1–3 años durante 5–8 años. No se recomienda medir Tg sérica de rutina en el seguimiento tras lobectomía.';
    } else {
      actionPlan = 'Desescalamiento (R48.1–4): US cervical cada 1–3 años. Si mantiene Respuesta Excelente sostenida por 5–8 años, SUSPENDER ecografía de rutina y seguir solo con Tg/TgAb cada 1–2 años. A los 10–15 años de respuesta excelente sostenida, se declara REMISIÓN COMPLETA y se suspende el monitoreo bioquímico.';
    }
  }

  return { cat, tier, reason, residualRisk, tshGoal, actionPlan };
}

// --- Estados iniciales (también usados por «Nuevo paciente») ---
export const INITIAL_POSTOP = {
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
    coexist: [], // subtipos de PTC coexistentes: solo documentación, no entra al cálculo
  };
export const INITIAL_DYNAMIC = {
    surgeryType: 'tt_rai', // 'tt_rai' | 'tt_norai' | 'hemi'
    tshExact: '',
    tgBasal: '',
    tgStim: '',
    tgAbExact: '',
    tgAb: 'neg', // 'neg' | 'stable' | 'rising'
    imaging: 'neg', // 'neg' | 'nonspec' | 'structural'
    hemiLobe: 'normal', // 'normal' | 'suspicious'
  };
export const INITIAL_SURG = {
    cT: 't1a',
    laterality: 'uni',
    cN: 'n0',
    cM: 'm0',
    posteriorAbutment: 'no',
  };
export const INITIAL_NODULE = {
    comp: 'solid', echo: 2, shape: 0, margin: 0, foci: { macro: false, rim: false, punct: false }, sizeCm: '1.6', bethesda: 'none'
  };
