// Guía de uso: qué desea hacer el usuario, qué datos necesita tener a mano y cuáles faltan por confirmar.
// Un dato cuenta como confirmado cuando el usuario toca su sección (aunque deje el valor por defecto),
// porque los valores por defecto calculan un resultado que puede no corresponder al paciente.

import { HISTO_OPTIONS } from './logic.js';

export const TAREAS = [
  { tab: 'nodule', titulo: 'Tengo un nódulo en la ecografía', sub: 'TI-RADS: ¿punción o seguimiento?' },
  { tab: 'bethesda', titulo: 'Tengo el resultado de la PAAF', sub: 'Bethesda: riesgo de malignidad y conducta' },
  { tab: 'surgery', titulo: 'Voy a planear la cirugía', sub: 'Extensión de la tiroidectomía y del vaciamiento' },
  { tab: 'postop', titulo: 'Tengo el reporte de patología', sub: 'Riesgo de recurrencia ATA, AJCC y I-131' },
  { tab: 'dynamic', titulo: 'Control con Tg y ecografía', sub: 'Respuesta al tratamiento y plan de seguimiento' },
];

export const A_MANO = {
  nodule: 'Ecografía tiroidea del nódulo: composición, ecogenicidad, forma, margen, focos ecogénicos y diámetro máximo.',
  bethesda: 'Reporte de la PAAF con la categoría Bethesda.',
  surgery: 'Ecografía o TC preoperatoria: tamaño y extensión del tumor (cT), ganglios centrales o laterales (cN), metástasis a distancia (cM), nódulos contralaterales y relación con la cápsula posterior, la tráquea y el NLR.',
  postop: 'Edad del paciente y reporte de patología: subtipo histológico, tamaño, extensión extratiroidea, ganglios (cuántos, tamaño del foco mayor, extensión extranodal), invasión vascular (n.º de vasos), márgenes, focalidad, metástasis y estudio molecular si lo hay.',
  dynamic: 'Tratamiento inicial (tiroidectomía total con o sin I-131, o lobectomía), TSH, Tg no estimulada o estimulada, TgAb y su tendencia, y la imagen más reciente (US cervical, rastreo, TC o PET).',
};

const esFolicular = histo => ['foll', 'otc'].includes(HISTO_OPTIONS.find(h => h.id === histo)?.group);
const esNIFTP = histo => HISTO_OPTIONS.find(h => h.id === histo)?.group === 'benign_pot';
const lleno = v => String(v ?? '').trim() !== '';

// Campos que hay que confirmar en cada pestaña. «cuando» limita el campo a los casos en que aplica;
// «valor» indica que basta con que tenga un valor escrito (no hace falta tocarlo).
export const CAMPOS = {
  postop: [
    { k: 'ageGroup', l: 'Edad' },
    { k: 'histo', l: 'Subtipo histológico' },
    { k: 'follPattern', l: 'Patrón de invasión', cuando: s => esFolicular(s.postop.histo) },
    { k: 'size', l: 'Tamaño', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'ete', l: 'Extensión extratiroidea', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'nodes', l: 'Ganglios (N)', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'vi', l: 'Invasión vascular', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'margins', l: 'Márgenes', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'focality', l: 'Focalidad', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'metastasis', l: 'Metástasis (M)', cuando: s => !esNIFTP(s.postop.histo) },
    { k: 'mol', l: 'Molecular', cuando: s => !esNIFTP(s.postop.histo) },
  ],
  dynamic: [
    { k: 'surgeryType', l: 'Tratamiento inicial' },
    { k: 'hemiLobe', l: 'Lóbulo contralateral', cuando: s => s.dynamic.surgeryType === 'hemi' },
    { k: 'tg', l: 'Tiroglobulina', cuando: s => s.dynamic.surgeryType !== 'hemi', valor: s => lleno(s.dynamic.tgBasal) || lleno(s.dynamic.tgStim) },
    { k: 'tgAb', l: 'Tendencia de TgAb', cuando: s => s.dynamic.surgeryType !== 'hemi' },
    { k: 'imaging', l: 'Imagen' },
  ],
  surgery: [
    { k: 'cT', l: 'cT' },
    { k: 'cN', l: 'cN' },
    { k: 'cM', l: 'cM' },
    { k: 'laterality', l: 'Lateralidad' },
    { k: 'posteriorAbutment', l: 'Relación posterior', cuando: s => s.surg.cT === 't1a' && s.surg.cN === 'n0' && s.surg.cM === 'm0' && s.surg.laterality === 'uni' },
  ],
  nodule: [
    { k: 'comp', l: 'Composición' },
    { k: 'echo', l: 'Ecogenicidad', cuando: s => s.nodule.comp !== 'spongiform' },
    { k: 'shape', l: 'Forma', cuando: s => s.nodule.comp !== 'spongiform' },
    { k: 'margin', l: 'Margen', cuando: s => s.nodule.comp !== 'spongiform' },
    { k: 'foci', l: 'Focos ecogénicos', cuando: s => s.nodule.comp !== 'spongiform' },
    { k: 'sizeCm', l: 'Diámetro', valor: s => lleno(s.nodule.sizeCm), tocar: true },
  ],
  bethesda: [
    { k: 'bethesda', l: 'Categoría Bethesda', valor: s => s.nodule.bethesda !== 'none' },
  ],
};

// Devuelve los campos que aplican y todavía no están confirmados.
// estados: { postop, dynamic, surg, nodule }; hechos: { 'postop.size': true, ... }
export function faltantes(tab, estados, hechos) {
  return (CAMPOS[tab] || []).filter(c => {
    if (c.cuando && !c.cuando(estados)) return false;
    const tocado = !!hechos[`${tab}.${c.k}`];
    if (c.valor) return !c.valor(estados) || (c.tocar && !tocado);
    return !tocado;
  });
}
