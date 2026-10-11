#!/usr/bin/env python3
"""Check public email links use verified destination and primary CTA uses the form."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
VERIFIED="kontakt@maciejgryziec.pl"
UNVERIFIED="kontakt@automatyzacjesklepow.pl"
pages=[p for p in ROOT.glob("*.html") if p.name not in ("404.html","50x.html")]
bad=[];cta=0;mail=0
for p in pages:
    t=p.read_text(encoding="utf-8")
    for addr in re.findall(r'href="mailto:([^"]+)"',t):
        mail+=1
        if not addr.startswith(VERIFIED): bad.append(f"{p.name}: unverified email destination: {addr[:80]}")
    if f"mailto:{UNVERIFIED}" in t or f">{UNVERIFIED}<" in t:
        bad.append(f"{p.name}: unverified branded mail still displayed")
    for attrs in re.findall(r'<a\b([^>]*class="[^"]*\bprzycisk\b[^"]*"[^>]*)>',t,re.I):
        match=re.search(r'href="([^"]*)"',attrs)
        href=match.group(1) if match else ""
        if href.startswith("mailto:"):
            bad.append(f"{p.name}: main CTA bypasses form")
        if href.startswith("opisz-projekt.html?zrodlo="):
            cta+=1
if cta<20:bad.append(f"Too few tracked form links: {cta}")
if "kontakt@maciejgryziec.pl" not in (ROOT/"redesign.js").read_text(encoding="utf-8"):
    bad.append("Client form error messages lack verified address")
if bad:
    for v in bad:print("FAIL",v)
    raise SystemExit("CONTACT_LINK_AUDIT_FAILED")
print(f"CONTACT_LINK_AUDIT_OK {len(pages)} pages, {mail} email links, {cta} form CTAs")
