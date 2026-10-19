// Casos de referencia del motor clínico. Si una prueba falla, la app no se publica.
// Fuentes: ATA 2025 (Fig. 2, Fig. 6, Tablas 6, 9 y 10, R32, R48, R55A) y ACR TI-RADS 2017 (Fig. 1).
import { describe, it, expect } from 'vitest';
import {
  evaluatePostop, evaluateDynamic, evaluateTirads,
  INITIAL_POSTOP, INITIAL_DYNAMIC, INITIAL_NODULE,
} from './logic.js';

const post = (over) => evaluatePostop({ ...INITIAL_POSTOP, ...over });
const dyn = (over, initialTier = 'low') => evaluateDynamic({ ...INITIAL_DYNAMIC, ...over }, initialTier);
const tr = (over) => evaluateTirads({ ...INITIAL_NODULE, ...over, foci: { macro: false, rim: false, punct: false, ...(over?.foci || {}) } });

describe('Riesgo de recurrencia estructural — Fig. 2, columna PTC', () => {
  it('T1b intratiroideo, unifocal, N0, R0 → Bajo', () => {
    const r = post({});
    expect(r.tier).toBe('low');
    expect(r.pT).toBe('T1b');
  });
  it('ETE microscópica en T1–T2 → Bajo–Intermedio', () => expect(post({ ete: 'micro' }).tier).toBe('lowint'));
  it('T3a (>4 cm) intratiroideo → Bajo–Intermedio', () => {
    const r = post({ size: 'gt4' });
    expect(r.pT).toBe('T3a');
    expect(r.tier).toBe('lowint');
  });
  it('T3a + ETE microscópica → Alto', () => expect(post({ size: 'gt4', ete: 'micro' }).tier).toBe('high'));
  it('T3b (músculos pretiroideos) → Alto', () => {
    const r = post({ ete: 'strap' });
    expect(r.pT).toBe('T3b');
    expect(r.tier).toBe('high');
  });
  it('T4a y T4b → Alto', () => {
    expect(post({ ete: 't4a' }).tier).toBe('high');
    expect(post({ ete: 't4b' }).tier).toBe('high');
  });
  it('Multifocalidad unilateral → Bajo–Intermedio', () => expect(post({ focality: 'multi_uni' }).tier).toBe('lowint'));
  it('Multifocalidad bilateral >1 cm → Intermedio–Alto', () => expect(post({ focality: 'multi_bil_gt1' }).tier).toBe('highint'));
  it('cN1a o pN1a >2 mm / >5 ganglios → Bajo–Intermedio', () => expect(post({ nodes: 'n1a_mod' }).tier).toBe('lowint'));
  it('pN1a micrometástasis (≤5, ≤2 mm) → Bajo', () => expect(post({ nodes: 'n1a_micro' }).tier).toBe('low'));
  it('cN1b <3 cm → Intermedio–Alto', () => expect(post({ nodes: 'n1b_lat' }).tier).toBe('highint'));
  it('cN1 ≥3 cm y extensión extranodal → Alto', () => {
    expect(post({ nodes: 'big3cm' }).tier).toBe('high');
    expect(post({ nodes: 'ene' }).tier).toBe('high');
  });
  it('Margen R1 posterior → Bajo–Intermedio; R1 anterior → Bajo; R2 → Alto', () => {
    expect(post({ margins: 'r1_post' }).tier).toBe('lowint');
    expect(post({ margins: 'r1_ant' }).tier).toBe('low');
    expect(post({ margins: 'r2' }).tier).toBe('high');
  });
  it('Histología agresiva (células altas, hobnail) → Intermedio–Alto', () => {
    expect(post({ histo: 'ptc_tall' }).tier).toBe('highint');
    expect(post({ histo: 'ptc_hobnail' }).tier).toBe('highint');
  });
  it('Invasión vascular en PTC (cualquier número de vasos) → Intermedio–Alto', () => {
    expect(post({ vi: 'lim' }).tier).toBe('highint');
    expect(post({ vi: 'ext' }).tier).toBe('highint');
  });
  it('Alto grado (histología o rasgos) → Alto', () => {
    expect(post({ histo: 'dhgtc_pdtc' }).tier).toBe('high');
    expect(post({ highGradeFeatures: true }).tier).toBe('high');
  });
  it('M1 → Alto', () => expect(post({ metastasis: 'm1' }).tier).toBe('high'));
});

describe('Regla «2+ factores Bajo–Intermedio» (Fig. 2)', () => {
  it('T1–T2 con 2 factores → Intermedio–Alto', () => expect(post({ ete: 'micro', nodes: 'n1a_mod' }).tier).toBe('highint'));
  it('T3a + 1 factor → sigue Bajo–Intermedio (T3a no cuenta como factor)', () =>
    expect(post({ size: 'gt4', focality: 'multi_uni' }).tier).toBe('lowint'));
  it('T3a + 2 factores → Intermedio–Alto', () =>
    expect(post({ size: 'gt4', focality: 'multi_uni', nodes: 'n1a_mod' }).tier).toBe('highint'));
});

describe('Fig. 2, columnas FTC/IEFVPTC y OTC', () => {
  it('FTC mínimamente invasivo → Bajo', () => expect(post({ histo: 'ftc', follPattern: 'mi' }).tier).toBe('low'));
  it('FTC con invasión vascular limitada (<4 vasos) → Bajo–Intermedio', () =>
    expect(post({ histo: 'ftc', follPattern: 'ea', vi: 'lim' }).tier).toBe('lowint'));
  it('FTC con invasión vascular extensa (≥4 vasos) → Alto', () =>
    expect(post({ histo: 'ftc', follPattern: 'ea', vi: 'ext' }).tier).toBe('high'));
  it('FTC ampliamente invasivo → Alto', () => expect(post({ histo: 'ftc', follPattern: 'wi' }).tier).toBe('high'));
  it('OTC e IEFVPTC con <4 vasos → Bajo–Intermedio', () => {
    expect(post({ histo: 'otc', follPattern: 'ea', vi: 'lim' }).tier).toBe('lowint');
    expect(post({ histo: 'iefvptc', follPattern: 'ea', vi: 'lim' }).tier).toBe('lowint');
  });
  it('Multifocalidad no cuenta en FTC (solo columna PTC)', () =>
    expect(post({ histo: 'ftc', follPattern: 'mi', focality: 'multi_uni' }).tier).toBe('low'));
});

describe('NIFTP y componentes coexistentes', () => {
  it('NIFTP → muy bajo potencial, sin I-131', () => {
    const r = post({ histo: 'niftp' });
    expect(r.isNIFTP).toBe(true);
    expect(r.tier).toBe('low');
  });
  it('Componentes coexistentes no modifican el riesgo', () => {
    expect(post({ coexist: ['ptc_tall'] }).tier).toBe('low');
    expect(post({ histo: 'ptc_hobnail', coexist: ['ptc_tall', 'ptc_clasico'] }).tier).toBe('highint');
  });
});

describe('Estadificación AJCC 8.ª (Tabla 6)', () => {
  it('<55 años: Estadio I sin M1, Estadio II con M1', () => {
    expect(post({ ete: 't4b' }).ajccStage).toMatch(/^Estadio I /);
    expect(post({ metastasis: 'm1' }).ajccStage).toMatch(/^Estadio II /);
  });
  it('≥55 años: I, II (N1 o T3), III (T4a), IVA (T4b), IVB (M1)', () => {
    const o = { ageGroup: '55to70' };
    expect(post(o).ajccStage).toMatch(/^Estadio I /);
    expect(post({ ...o, nodes: 'n1a_micro' }).ajccStage).toMatch(/^Estadio II /);
    expect(post({ ...o, size: 'gt4' }).ajccStage).toMatch(/^Estadio II /);
    expect(post({ ...o, ete: 't4a' }).ajccStage).toMatch(/^Estadio III /);
    expect(post({ ...o, ete: 't4b' }).ajccStage).toMatch(/^Estadio IVA /);
    expect(post({ ...o, metastasis: 'm1' }).ajccStage).toMatch(/^Estadio IVB /);
  });
});

describe('Yodo radiactivo (Tabla 10, R32, R55A)', () => {
  it('Bajo → no de rutina (R32A)', () => {
    const r = post({});
    expect(r.rai.ref).toContain('R32A');
    expect(r.rai.act).toContain('0 mCi');
  });
  it('Bajo–Intermedio e Intermedio–Alto → considerar, 30–100 mCi (R32B)', () => {
    expect(post({ ete: 'micro' }).rai.act).toContain('30 – 100 mCi');
    expect(post({ histo: 'ptc_tall' }).rai.ref).toContain('R32B');
  });
  it('Alto → de rutina, 100–150 mCi (R32C)', () => {
    const r = post({ nodes: 'ene' });
    expect(r.rai.ref).toContain('R32C');
    expect(r.rai.act).toContain('100 – 150 mCi');
  });
  it('M1 → tratamiento (R32D)', () => expect(post({ metastasis: 'm1' }).rai.ref).toContain('R32D'));
  it('>70 años con riesgo Alto → alerta de dosimetría (R55A)', () =>
    expect(post({ ageGroup: 'gt70', nodes: 'ene' }).warnings.join(' ')).toContain('R55A'));
});

describe('Respuesta al tratamiento — Tabla 9', () => {
  it('Sin Tg → «Sin datos de Tg»', () => expect(dyn({}).cat).toBe('Sin datos de Tg'));
  it('TT + I-131: Tg basal <0.2 → Excelente', () => expect(dyn({ tgBasal: '0.1' }).cat).toBe('Respuesta Excelente'));
  it('TT + I-131: Tg basal 0.2–1 → Indeterminada', () => expect(dyn({ tgBasal: '0.5' }).cat).toBe('Respuesta Indeterminada'));
  it('TT + I-131: Tg basal >1 → Bioquímicamente incompleta', () => expect(dyn({ tgBasal: '1.5' }).cat).toBe('Respuesta Bioquímicamente Incompleta'));
  it('TT + I-131: Tg estimulada <1 → Excelente aunque basal 0.5 («o» literal)', () =>
    expect(dyn({ tgBasal: '0.5', tgStim: '0.8' }).cat).toBe('Respuesta Excelente'));
  it('TT + I-131: Tg estimulada >10 → Bioquímicamente incompleta', () =>
    expect(dyn({ tgStim: '12' }).cat).toBe('Respuesta Bioquímicamente Incompleta'));
  it('TgAb en ascenso con imagen negativa → Bioquímicamente incompleta', () =>
    expect(dyn({ tgBasal: '0.1', tgAb: 'rising' }).cat).toBe('Respuesta Bioquímicamente Incompleta'));
  it('TgAb estables → Indeterminada', () => expect(dyn({ tgBasal: '0.1', tgAb: 'stable' }).cat).toBe('Respuesta Indeterminada'));
  it('Enfermedad estructural → Estructuralmente incompleta, 100%', () => {
    const r = dyn({ tgBasal: '0.1', imaging: 'structural' });
    expect(r.cat).toBe('Respuesta Estructuralmente Incompleta');
    expect(r.residualRisk).toContain('100%');
  });
  it('TT sin I-131: <2.5 Excelente, 2.5–5 Indeterminada, >5 Bioquímica', () => {
    expect(dyn({ surgeryType: 'tt_norai', tgBasal: '2.0' }).cat).toBe('Respuesta Excelente (Sin RAI)');
    expect(dyn({ surgeryType: 'tt_norai', tgBasal: '3' }).cat).toBe('Respuesta Indeterminada (Sin RAI)');
    expect(dyn({ surgeryType: 'tt_norai', tgBasal: '6' }).cat).toBe('Respuesta Bioquímicamente Incompleta (Sin RAI)');
  });
  it('Lobectomía con lóbulo normal e imagen negativa → Excelente', () =>
    expect(dyn({ surgeryType: 'hemi', hemiLobe: 'normal' }).cat).toBe('Respuesta Excelente (Post-Lobectomía)'));
  it('Lobectomía con nódulo contralateral sospechoso → no Excelente, riesgo N/A', () => {
    const r = dyn({ surgeryType: 'hemi', hemiLobe: 'suspicious' });
    expect(r.cat).not.toMatch(/Excelente/);
    expect(r.residualRisk).toContain('N/A');
    expect(r.reason).toContain('R48.5');
  });
});

describe('Riesgo residual (Fig. 6) y desescalamiento (R48)', () => {
  it('Excelente con riesgo inicial Bajo → <2% y desescalamiento R48', () => {
    const r = dyn({ tgBasal: '0.1' }, 'low');
    expect(r.residualRisk).toContain('< 2%');
    expect(r.actionPlan).toContain('R48');
  });
  it('Excelente con riesgo inicial Alto → 3–15% y sin desescalamiento', () => {
    const r = dyn({ tgBasal: '0.1' }, 'high');
    expect(r.residualRisk).toContain('3 – 15%');
    expect(r.actionPlan).toContain('aplica solo a DTC de bajo riesgo');
  });
  it('Bioquímicamente incompleta (TT + I-131) → 20–53%', () => expect(dyn({ tgBasal: '2' }).residualRisk).toContain('20 – 53%'));
  it('Metas de TSH sin cifras numéricas (la Tabla 9 no las da)', () => {
    for (const t of ['0.1', '0.5', '2', '6']) expect(dyn({ tgBasal: t }).tshGoal).not.toMatch(/\d\.\d/);
  });
});

describe('ACR TI-RADS 2017 (Fig. 1)', () => {
  it('Sólido + hipoecoico = 4 puntos → TR4; 1.6 cm → PAAF', () => {
    const r = tr({ comp: 'solid', echo: 2, sizeCm: '1.6' });
    expect(r.pts).toBe(4);
    expect(r.level).toBe('TR4');
    expect(r.rec).toMatch(/^PAAF/);
  });
  it('Espongiforme → 0 puntos aunque tenga otros hallazgos', () => {
    const r = tr({ comp: 'spongiform', echo: 3, shape: 3, foci: { punct: true } });
    expect(r.pts).toBe(0);
    expect(r.level).toBe('TR1');
  });
  it('Focos ecogénicos se suman (macro 1 + puntiformes 3)', () =>
    expect(tr({ comp: 'solid', echo: 2, foci: { macro: true, punct: true } }).pts).toBe(8));
  it('TR3 de 2.0 cm → seguimiento, no PAAF', () => {
    const r = tr({ comp: 'solid', echo: 1, sizeCm: '2.0' });
    expect(r.level).toBe('TR3');
    expect(r.rec).toMatch(/^Seguimiento/);
  });
  it('TR5 de 0.7 cm → nota de microcarcinoma 5–9 mm', () => {
    const r = tr({ comp: 'solid', echo: 3, shape: 3, sizeCm: '0.7' });
    expect(r.level).toBe('TR5');
    expect(r.notes.join(' ')).toContain('5–9 mm');
  });
  it('1 punto → alerta (no corresponde a ningún nivel)', () =>
    expect(tr({ comp: 'cystic', echo: 1 }).notes.join(' ')).toContain('1 punto'));
});
