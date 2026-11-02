import { describe, it, expect } from 'vitest';
import { faltantes, CAMPOS, TAREAS, A_MANO } from './guia.js';
import { INITIAL_POSTOP, INITIAL_DYNAMIC, INITIAL_SURG, INITIAL_NODULE } from './logic.js';

const base = { postop: INITIAL_POSTOP, dynamic: INITIAL_DYNAMIC, surg: INITIAL_SURG, nodule: INITIAL_NODULE };
const todos = (tab) => Object.fromEntries(CAMPOS[tab].map(c => [`${tab}.${c.k}`, true]));
const ks = (tab, est = base, h = {}) => faltantes(tab, est, h).map(c => c.k);

describe('guía: datos que faltan', () => {
  it('cada tarea tiene su lista de qué tener a mano', () => {
    TAREAS.forEach(t => expect(A_MANO[t.tab]).toBeTruthy());
  });
  it('patología: sin tocar nada faltan todos (PTC clásico, sin patrón folicular)', () => {
    expect(ks('postop')).toEqual(['ageGroup', 'histo', 'size', 'ete', 'nodes', 'vi', 'margins', 'focality', 'metastasis', 'mol']);
    expect(ks('postop', base, todos('postop'))).toEqual([]);
  });
  it('patología: FTC pide patrón de invasión; NIFTP solo edad e histología', () => {
    expect(ks('postop', { ...base, postop: { ...INITIAL_POSTOP, histo: 'ftc' } })).toContain('follPattern');
    expect(ks('postop', { ...base, postop: { ...INITIAL_POSTOP, histo: 'niftp' } })).toEqual(['ageGroup', 'histo']);
  });
  it('patología: con componente agresivo coexistente pide su %', () => {
    const p = { ...INITIAL_POSTOP, coexist: ['ptc_hobnail'] };
    expect(ks('postop', { ...base, postop: p })).toContain('aggPct');
    expect(ks('postop', { ...base, postop: { ...p, coexist: ['ptc_warthin'] } })).not.toContain('aggPct');
  });
  it('seguimiento: la Tg cuenta por valor; lobectomía pide lóbulo y no Tg ni TgAb', () => {
    const h = { 'dynamic.surgeryType': true, 'dynamic.tgAb': true, 'dynamic.imaging': true };
    expect(ks('dynamic', base, h)).toEqual(['tg']);
    expect(ks('dynamic', { ...base, dynamic: { ...INITIAL_DYNAMIC, tgBasal: '0.1' } }, h)).toEqual([]);
    expect(ks('dynamic', { ...base, dynamic: { ...INITIAL_DYNAMIC, surgeryType: 'hemi' } }, h)).toEqual(['hemiLobe']);
  });
  it('nódulo: el diámetro precargado no cuenta hasta tocarlo; espongiforme omite el resto', () => {
    expect(ks('nodule')).toContain('sizeCm');
    expect(ks('nodule', { ...base, nodule: { ...INITIAL_NODULE, comp: 'spongiform' } })).toEqual(['comp', 'sizeCm']);
    expect(ks('nodule', base, todos('nodule'))).toEqual([]);
    expect(ks('nodule', { ...base, nodule: { ...INITIAL_NODULE, sizeCm: '' } }, todos('nodule'))).toEqual(['sizeCm']);
  });
  it('cirugía: la relación posterior solo aplica a cT1a N0 M0 unilateral', () => {
    expect(ks('surgery')).toContain('posteriorAbutment');
    expect(ks('surgery', { ...base, surg: { ...INITIAL_SURG, cT: 't2' } })).not.toContain('posteriorAbutment');
  });
  it('Bethesda: basta con elegir la categoría', () => {
    expect(ks('bethesda')).toEqual(['bethesda']);
    expect(ks('bethesda', { ...base, nodule: { ...INITIAL_NODULE, bethesda: '4' } })).toEqual([]);
  });
});
