#!/usr/bin/env python3
"""Texto por capítulos de Dark Waves: The Synthesizer and the Dystopian Sound of Britain (Neil O’Connor, Rowman & Littlefield, 2023).

Uso: python3 -I tools/split.py <dir_xhtml> <dir_salida>

Lee directamente los XHTML del ePub, que traen la paginación impresa (<span aria-label="N" role="doc-pagebreak"/>).
Capítulo 1: el prólogo (Foreword) y la introducción; 2-12: los capítulos 1-11 del libro. Las cabeceras
(número, título, subtítulo y secciones) salen como «## …»; las llamadas y las notas al final del capítulo
(div.ch_notes, p.footnote) se descartan. Escribe <dir>/NN.txt (un párrafo por línea, «[pág. N]» con la
página impresa en que empieza) y <dir>/book.json (párrafos {ch, sec, segs: [[pág, texto]]}, el formato de
tools/refs.py y de pdfpages.py --impresas; sec es la última cabecera de sección).
"""
import html
import json
import re
import sys
from pathlib import Path

FILES = {1: ['Foreword', 'Introduction']} | {n + 1: [f'Chapter{n:02d}'] for n in range(1, 12)}
BREAK = re.compile(r'<span aria-label="([^"]+)"[^>]*role="doc-pagebreak"\s*/>')
PARA = re.compile(r'<(p|h[1-6])\b([^>]*)>(.*?)</\1>', re.S)
SKIP = ('class="footnote"',)


def clean(s):
    s = re.sub(r'<sup[^>]*>.*?</sup>', '', s, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def page_of(t):
    return int(t) if t.isdigit() else t


def main(src, out):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    paras = []
    for ch, names in FILES.items():
        page, sec, text = None, None, []
        for name in names:
            doc = (Path(src) / f'{name}.xhtml').read_text()
            body = doc[doc.index('<body'):]
            notes = body.find('class="ch_notes"')
            if notes > 0:
                body = body[:notes]
            pos = 0
            for m in PARA.finditer(body):
                for b in BREAK.findall(body[pos:m.start()]):
                    page = page_of(b)
                pos = m.end()
                tag, attrs, inner = m.groups()
                parts = BREAK.split(inner)          # [texto, pág, texto, pág, …]
                segs, cur = [], page
                for i, part in enumerate(parts):
                    if i % 2:
                        cur = page_of(part)
                        continue
                    t = clean(part)
                    if t:
                        segs.append([cur, t])
                page = cur
                if not segs or any(k in attrs for k in SKIP):
                    continue
                line = ' '.join(t for _, t in segs)
                if tag != 'p' or 'ch_subtitle' in attrs:
                    if tag not in ('h1', 'h2') or ch == 1:
                        sec = line
                    text.append(f'## {line}')
                    continue
                paras.append({'ch': ch, 'sec': sec, 'segs': segs})
                text.append(f'[pág. {segs[0][0]}] {line}')
        (out / f'{ch:02d}.txt').write_text('\n\n'.join(text) + '\n')
        n = sum(len(t.split()) for p in paras if p['ch'] == ch for _, t in p['segs'])
        print(f'cap. {ch}: {n} palabras, págs. {next((p["segs"][0][0] for p in paras if p["ch"] == ch), "?")}–{page}')
    (out / 'book.json').write_text(json.dumps(paras, ensure_ascii=False))


if __name__ == '__main__':
    main(*sys.argv[1:])
