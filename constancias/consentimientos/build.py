#!/usr/bin/env python3
"""Convierte los consentimientos (.md de Drive) en datos para constancias/index.html.

Uso: python3 constancias/consentimientos/build.py
Reemplaza el bloque entre /* CONSENTIMIENTOS:INICIO */ y /* CONSENTIMIENTOS:FIN */ del index.html.
El texto de cada documento se copia tal cual; solo se cambian los espacios en blanco (___) por
marcadores que la app llena con los datos del formulario.
"""
import json, re, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
INDEX = AQUI.parent / 'index.html'

# número del archivo → (id, n, título en la app)
DOCS = {
    1: ('consent_gi', 'C1', 'Consentimiento — Gastrointestinal, pélvica y retroperitoneal'),
    2: ('consent_tiroides', 'C2', 'Consentimiento — Tiroides, paratiroides y cuello'),
    3: ('consent_cabeza_cuello', 'C3', 'Consentimiento — Cabeza y cuello, parótida y disección cervical'),
    4: ('consent_mama', 'C4', 'Consentimiento — Mama, axila y reconstrucción'),
    5: ('consent_piel', 'C5', 'Consentimiento — Piel, ganglios y reconstrucción'),
    6: ('consent_sarcoma', 'C6', 'Consentimiento — Partes blandas, sarcomas y tumores óseos'),
    7: ('consent_gineco', 'C7', 'Consentimiento — Ginecológica y pélvica'),
    8: ('consent_uro', 'C8', 'Consentimiento — Urológica y retroperitoneal'),
    9: ('consent_adrenal', 'C9', 'Consentimiento — Suprarrenal (adrenalectomía)'),
    10: ('consent_imagen', 'C10', 'Anexo — Uso de imágenes con fines educativos'),
    11: ('consent_revocacion', 'C11', 'Revocación de consentimiento / desistimiento'),
}
CAMPOS_ENCABEZADO = {
    'fecha': 'fecha', 'historia clínica / expediente': 'expediente', 'hora': 'hora',
    'nombre completo del paciente': 'nombre', 'nombre completo de la paciente': 'nombre', 'nombre completo': 'nombre',
    'documento de identidad (dni)': 'dni', 'edad': 'edad', 'sexo': 'sexo',
}
BLANCO = r'(?:\\_){3,}'


def limpiar(t):
    t = re.sub(BLANCO, '___', t)
    t = t.replace('<br>', ' ').replace('&nbsp;', ' ')
    t = re.sub(r'\\(.)', r'\1', t)                      # escapes de Markdown
    t = t.replace('**', '')
    t = re.sub(r'(?<![\w*])\*(?!\s)([^*]+?)\*(?![\w*])', r'\1', t)   # cursivas
    return re.sub(r'[ \t]+', ' ', t).strip()


def encabezado(t):
    """'Fecha: ___ / ___ / ___ Historia Clínica / Expediente: ___' → texto con {{f:campo}}."""
    t = re.sub(r'___ / ___ / ___', '___', t)
    def rep(m):
        clave = CAMPOS_ENCABEZADO.get(m.group(1).strip().lower())
        return f'{m.group(1)}: {{{{f:{clave}}}}}   ' if clave else m.group(0)
    return re.sub(r'([^:]+?):\s*___\s*', rep, t).strip()


def convertir(num, ruta):
    crudo = ruta.read_text(encoding='utf-8').split('\n')
    lineas = [l.rstrip() for l in crudo]
    titulo = limpiar(lineas[0].lstrip('#').strip())
    ref = next((limpiar(l) for l in lineas if 'Doc. Ref' in l), '')
    bloques, seccion, previo = [], '', ''
    i = 1
    while i < len(lineas):
        l = lineas[i]; t = limpiar(l)
        i += 1
        if not t or t == '---' or 'Doc. Ref' in l:
            continue
        if t.startswith('| PACIENTE') or t.startswith('| TESTIGO') or t.startswith('|'):
            continue                                      # las firmas las pone la app
        if t == '___':
            while i < len(lineas) and limpiar(lineas[i]) in ('', '___'):
                i += 1
            ctx = previo.lower()
            campo = ('proc' if 'procedimiento quirúrgico propuesto' in ctx else
                     'dx' if 'diagnóstico de' in ctx else
                     'motivo' if 'MOTIVO' in seccion else
                     'dx' if 'DIAGNÓSTICO' in seccion else
                     'proc' if 'PROCEDIMIENTO' in seccion else None)
            if not campo:
                sys.exit(f'{ruta.name}: espacio en blanco sin campo (sección «{seccion}»)')
            bloques.append({'t': 'campo', 'v': campo})
            continue
        if re.match(r'^#{3,4} ', l):
            texto = t.lstrip('#').strip()
            m = re.match(r'^\[\s*\]\s*OPCIÓN ([AB])', texto)
            if m:
                bloques.append({'t': 'h3', 'v': f'{{{{op:{m.group(1)}}}}} ' + texto.split(']', 1)[1].strip()})
            else:
                seccion = texto
                bloques.append({'t': 'h2', 'v': texto})
            continue
        if re.match(r'^\s*\* ', l):
            item = re.sub(r'^\* ', '', t)
            while i < len(lineas) and re.match(r'^ {2,}\S', lineas[i]):      # continuación del punto
                item = (item + ' ' + limpiar(lineas[i])).strip(); i += 1
            if bloques and bloques[-1]['t'] == 'ul':
                bloques[-1]['v'].append(item)
            else:
                bloques.append({'t': 'ul', 'v': [item]})
            previo = item
            continue
        t = re.sub(r'^> ', '', t)
        t = t.replace('Dr./Dra. ___', 'Dr./Dra. {{f:medico}}')
        t = re.sub(r'\(\s*\) Acepto \| \(\s*\) Rechazo\.?', '{{transfusion}}', t)
        t = re.sub(r'\(\s*\) SÍ AUTORIZO (.+?) \| \(\s*\) NO AUTORIZO (.+?)\.?$', r'{{imagen}}', t)
        if '___' in t:
            t = encabezado(t)
        if '___' in t:
            sys.exit(f'{ruta.name}: espacio en blanco no reconocido: {t[:80]}')
        bloques.append({'t': 'p', 'v': t})
        previo = t
    tipo = 'revocacion' if num == 11 else 'imagen' if num == 10 else 'cirugia'
    ident, n, titulo_app = DOCS[num]
    return {'id': ident, 'n': n, 'title': titulo_app, 'docTitle': titulo, 'ref': ref, 'tipo': tipo, 'blocks': bloques}


def main():
    docs = []
    for ruta in sorted(AQUI.glob('*.md'), key=lambda p: int(p.name.split('_')[0])):
        docs.append(convertir(int(ruta.name.split('_')[0]), ruta))
    assert len(docs) == len(DOCS), f'se esperaban {len(DOCS)} documentos, hay {len(docs)}'
    datos = json.dumps(docs, ensure_ascii=False, indent=1)
    html = INDEX.read_text(encoding='utf-8')
    ini, fin = '/* CONSENTIMIENTOS:INICIO', '/* CONSENTIMIENTOS:FIN */'
    a, b = html.index(ini), html.index(fin)
    bloque = (f'{ini} — generado por consentimientos/build.py desde los .md; no editar a mano */\n'
              f'const CONSENT_DOCS = {datos};\n')
    INDEX.write_text(html[:a] + bloque + html[b:], encoding='utf-8')
    for d in docs:
        print(d['n'], d['id'], len(d['blocks']), 'bloques', d['ref'])


if __name__ == '__main__':
    main()
