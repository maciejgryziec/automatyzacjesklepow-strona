#!/usr/bin/env python3
"""Test kontrastu nowej strony Automatyzacje Sklepów: małe teksty >= WCAG AA 4.5:1."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
CSS=(ROOT/'redesign.css').read_text(encoding='utf-8')
CASES=[
    ('etykiety sekcji', '.fh-eyebrow', '#536f7e', '#f6f8f9'),
    ('numery usług', '.fh-service-index', '#506f60', '#ffffff'),
    ('opisy usług', '.fh-service p', '#5c6d79', '#ffffff'),
    ('uwaga o realizacjach', '.fh-realizations-note', '#526773', '#eff3f3'),
    ('uwaga o integracjach', '.fh-disclaimer', '#536978', '#ffffff'),
    ('mała etykieta mini-podglądu', '.fh-mini-row span', '#4e6e62', '#e5f1e9'),
    ('tag realizacji na jasnej karcie', '.fh-case-light .fh-case-tag', '#316949', '#dce8e2'),
    ('opis cennika', '.fh-price p', '#60726a', '#ffffff'),
    ('tag cennika', '.fh-price-head', '#43805c', '#ffffff'),
    ('opis sekcji', '.fh-section-head p', '#5b6c79', '#f6f8f9'),
    ('tekst główny strony', 'body', '#a3b4c5', '#0a1018'),
    ('stopka', '.stopka a', '#bbcbd9', '#0a1018'),
]
def brightness(value):
    x=[int(value[i:i+2],16)/255 for i in (1,3,5)]
    x=[a/12.92 if a<=.04045 else ((a+.055)/1.055)**2.4 for a in x]
    return .2126*x[0]+.7152*x[1]+.0722*x[2]
def contrast(a,b):
    x,y=sorted((brightness(a),brightness(b)))
    return (y+.05)/(x+.05)
failed=0
for desc,selector,fore,back in CASES:
    if selector not in CSS:
        print('FAIL missing selector:',selector);failed+=1;continue
    n=contrast(fore,back)
    ok=n>=4.5
    print(('OK' if ok else 'FAIL'),f'{n:.2f}:1',desc)
    if not ok:failed+=1
if failed:
    raise SystemExit(f'CONTRAST_AUDIT_FAILED={failed}')
print('CONTRAST_AUDIT_OK',len(CASES))
