# Release scope — główna strona

Serwis **automatyzacjesklepow.pl** pozostaje kompletną stroną z pełną ofertą, ale jego główną rolą jest e-commerce: integracje sklepów, marketplace, BaseLinker, hurtownie, faktury, KSeF i Sprawdzarka. Ogólne aplikacje i systemy są nadal dostępne, natomiast ich wersją kanoniczną dla Google jest **maciejgryziec.pl**.

## Zakres funkcjonalny

- nowa architektura informacji i nawigacja mobile,
- rozbudowane landingi usługowe,
- poradniki i automatyczny spis treści,
- case studies Photonroof i panelu wypożyczalni,
- formularz „Opisz projekt” z autosave/TXT,
- kwalifikator pierwszego etapu,
- kalkulator kosztu ręcznej pracy,
- wyszukiwarka poradników,
- first-touch UTM + źródło wewnętrzne,
- spójny cennik,
- „Co dalej?” / linkowanie wewnętrzne,
- hub e-commerce,
- polityka prywatności i security.txt,
- własne 404 / 50x,
- feed.xml / llms.txt / sitemap + image sitemap,
- per-page social previews,
- JSON-LD / Service / Person / WebApplication / ItemList,
- no-JS fallbacks,
- print/PDF cennika,
- responsive WebP.

## Zakres jakości / SEO

- 46 wygenerowanych stron HTML,
- 21 własnych URL-i indeksowanych w sitemapie automatyzacjesklepow.pl,
- 14 obrazów w image sitemap,
- brak stron-sierot,
- maks. 3 kliknięcia od homepage,
- audyt kanibalizacji treści,
- audyt canonical / OG / schema,
- 23 ogólne landingi zachowane funkcjonalnie, ale z cross-domain canonical do maciejgryziec.pl,
- homepage automatyzacjesklepow.pl ma własne pozycjonowanie e-commerce,
- pełny Chrome runtime crawl wszystkich stron,
- budżet assetów w CI + lokalny performance gate,
- performance gate: cold 4G + 4×CPU, LCP ≤ 3,2 s, CLS ≤ 0,10, transfer ≤ 200 KB,
- Accessibility Tree wszystkich stron,
- external link audit,
- cache-busting CSS/JS po hashach.

## Zakres infrastruktury

- GitHub Actions build + audyt,
- `.dockerignore`,
- gotowy `deploy/nginx.conf`,
- CSP/HSTS/nosniff/Referrer-Policy/Permissions-Policy,
- gzip/cache,
- blokady plików źródłowych/dotfiles,
- `www → apex`,
- `index.html → /`,
- canonical redirect extensionless → `.html`,
- `/healthz`,
- custom 404/50x,
- smoke test produkcji.

## Pliki źródłowe i wygenerowane

Serwis celowo trzyma:
- źródła pod `zrodla/*.html`,
- generator `narzedzia/buduj-nowa.py`,
- **wygenerowane** HTML/CSS/JS/sitemap/feed w root repo.

Po zmianie źródeł uruchom:
`python3 narzedzia/buduj-nowa.py`

Wygenerowane artefakty muszą być commitowane razem ze źródłami. CI zatrzyma release, jeżeli build po checkout zmieni pliki.

## Pliki, których nie wolno commitować przypadkiem

- `_audit*`,
- lokalne `*.db`, `*.sqlite`,
- backupy `*.bak`, `*.old`,
- tymczasowe logi i screenshoty audytowe,
- pliki z sekretami / lokalnymi ścieżkami.

## Przed stagingiem

```bash
./narzedzia/release-check.sh
python3 narzedzia/audyt-chrome.py
python3 narzedzia/audyt-csp.py
python3 narzedzia/audyt-runtime.py
python3 narzedzia/audyt-performance.py
python3 narzedzia/audyt-linkow-zewnetrznych.py
./narzedzia/review-release.sh
```

Dopiero potem:
- `git add -A`,
- `git diff --cached --check`,
- przegląd `git status`,
- commit/push zgodnie z `DEPLOY-PLAN.md`.

## Stan produkcyjny po deployu 2026-10-06

- commit produkcyjny: `a9d78ac` — `Separate ecommerce SEO from maciejgryziec.pl`,
- pełny smoke-test live: `PRODUKCJA OK`,
- 46 stron HTML pozostaje dostępnych,
- sitemap indeksuje 21 własnych URL-i e-commerce / hub / kontakt / realizacje,
- 23 ogólne landingi mają cross-domain canonical do `maciejgryziec.pl`,
- homepage jest pozycjonowany osobno pod automatyzacje e-commerce,
- Search Console przyjęło nową sitemapę; status `Sukces`,
- aktualnie Google pokazuje jeszcze 18 wykrytych stron z poprzedniego odczytu 28.09.2026 — oczekiwany jest ponowny crawl po zgłoszeniu 06.10.2026,
- Umami starej domeny pozostaje osobne: `426e2d75-f696-4c0a-ab60-79e76cf1d73c`,
- LinkedIn jest poza zakresem obecnych prac.
