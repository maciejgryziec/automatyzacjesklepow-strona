# Checklist produkcyjny — automatyzacjesklepow.pl

Stan audytu: 2026-10-06.

## 1. Kod i build — gotowe lokalnie

- [x] generator jest przenośny i nie używa ścieżki konkretnego Maca,
- [x] build jest idempotentny,
- [x] 46 stron HTML; wszystkie pozostają dostępne dla użytkownika; sitemap zawiera 21 własnych, self-canonical URL-i,
- [x] statyczny audyt przechodzi,
- [x] lokalny audyt Chrome przechodzi (0 błędów),
- [x] zewnętrzne linki urzędowe przechodzą audyt,
- [x] mobile bez horizontal overflow,
- [x] 404 i 50x mają `noindex`,
- [x] sitemap wyklucza strony błędów,
- [x] 23 ogólne landingi mają canonical do maciejgryziec.pl i nie są duplikowane w sitemapie automatyzacjesklepow.pl,
- [x] homepage automatyzacjesklepow.pl jest pozycjonowany osobno pod integracje i automatyzacje e-commerce,
- [x] Open Graph / Twitter / JSON-LD / breadcrumbs,
- [x] responsive WebP + fallback JPG/PNG,
- [x] hashowane URL-e CSS/JS,
- [x] Atom feed i llms.txt,
- [x] automatyczne spisy treści dla długich poradników,
- [x] kalkulator kosztu ręcznej pracy + test matematyczny w Chrome,
- [x] kwalifikator pierwszego etapu projektu,
- [x] formularz briefu: mailto, kopiowanie, TXT, autosave w sessionStorage,
- [x] fallbacki bez JavaScriptu dla briefu, kalkulatora, kwalifikatora i poradników,
- [x] first-touch UTM + źródło wewnętrzne zachowywane do briefu,
- [x] polityka prywatności opisuje formularz, UTM i statystyki bez treści pól,
- [x] `.dockerignore` blokuje publikację `zrodla/`, `narzedzia/`, `deploy/` i repo metadata,
- [x] GitHub Actions odpala build + statyczny audyt i pilnuje wygenerowanych plików,
- [x] `deploy/nginx.conf` jest zsynchronizowany z README,
- [x] finalna konfiguracja nginx przeszła `nginx -t` w aktualnym obrazie nginx z Coolify.
- [x] symulacja release’u w tymczasowym klonie: artefakty przed i po commicie są identyczne.

## 2. Obecna produkcja — stan po wdrożeniu 2026-10-06

Wdrożony commit funkcjonalny: `a9d78ac` — `Separate ecommerce SEO from maciejgryziec.pl`.

- [x] `automatyzacjesklepow.pl` działa na nowej wersji,
- [x] homepage jest pozycjonowany pod e-commerce: BaseLinker, Shoper, Allegro, hurtownie, faktury i KSeF,
- [x] wszystkie 46 stron HTML nadal są dostępne dla użytkownika,
- [x] 23 ogólne landingi wskazują canonical na `maciejgryziec.pl`,
- [x] sitemap starej domeny zawiera 21 własnych, self-canonical URL-i,
- [x] pełny redeploy aplikacji Static w Coolify zakończony,
- [x] `/healthz` → 200,
- [x] `/.well-known/security.txt` → 200,
- [x] `/og-image.png`, `/feed.xml`, `/llms.txt`, `/sitemap.xml` → 200,
- [x] `/zrodla/index.html`, `/narzedzia/buduj-nowa.py`, pliki repo/docs/deploy → 404,
- [x] własny 404 zachowuje HTTP 404,
- [x] sprawdzarka subdomena → 200,
- [x] sprawdzarka ma retencję 30 dni i nie zbiera zbędnego e-maila,
- [x] sprawdzarka `/healthz` → 200 i `noindex`,
- [x] Swagger / Redoc / OpenAPI → 404,
- [x] `python3 narzedzia/sprawdz-live.py` → `PRODUKCJA OK`.

## 3. Nginx / Coolify — stan produkcyjny

- [x] `http://` → `https://`,
- [x] `www.automatyzacjesklepow.pl/*` → 301 do apex,
- [x] HSTS,
- [x] `X-Content-Type-Options: nosniff`,
- [x] `X-Frame-Options: DENY`,
- [x] `Cross-Origin-Opener-Policy: same-origin`,
- [x] `Referrer-Policy: strict-origin-when-cross-origin`,
- [x] `Permissions-Policy`,
- [x] Content-Security-Policy,
- [x] CSP pozwala na self-hosted Umami i formularz sprawdzarki,
- [x] gzip dla HTML/CSS/JS,
- [x] cache CSS/JS i obrazów,
- [x] HTML rewalidowany przez `no-cache`,
- [x] ETag,
- [x] blokady źródeł/dotfiles,
- [x] `index.html → /`,
- [x] extensionless → kanoniczne `.html`,
- [x] własne 404 / 50x.

## 4. TLS — stan dobry

- [x] apex: Let’s Encrypt,
- [x] www: Let’s Encrypt,
- [x] TLS 1.1 odrzucony,
- [x] TLS 1.2 działa,
- [x] TLS 1.3 działa.

Certyfikaty podczas audytu były ważne do 23.11.2026. Coolify/Let’s Encrypt powinien je odnawiać automatycznie — warto potwierdzić po kolejnym renewalu.

## 5. DNS / e-mail — nie zmieniać automatycznie

Obecny stan:
- [x] MX: OVH Mail,
- [x] SPF: `v=spf1 include:mx.ovh.com ~all`,
- [x] DMARC istnieje,
- [ ] DMARC ma `p=none` — tylko monitoring,
- [ ] DKIM nie został potwierdzony w tym audycie,
- [x] Google Search Console verification TXT istnieje,
- [ ] CAA brak — opcjonalne.

Przed zmianą DMARC/SPF:
1. potwierdzić w OVH, że DKIM jest aktywny dla domeny,
2. sprawdzić, czy z domeny wysyła tylko OVH czy także inne systemy,
3. sprawdzić raporty DMARC,
4. dopiero później rozważyć `p=quarantine`, a następnie `p=reject`,
5. `~all` → `-all` dopiero po potwierdzeniu wszystkich legalnych nadawców.

Nie zmieniać tych rekordów „dla lepszego wyniku” bez powyższej weryfikacji — można przypadkiem pogorszyć dostarczalność poczty.

## 6. Google Search Console

- [x] własność domenowa jest zweryfikowana,
- [x] `https://automatyzacjesklepow.pl/sitemap.xml` została ponownie przesłana 2026-10-06,
- [x] Search Console przyjęło sitemapę komunikatem „Mapa witryny została przesłana pomyślnie”,
- [x] status obecnego wpisu w Search Console: `Sukces`,
- [x] produkcyjna sitemap zawiera 21 własnych URL-i,
- [ ] Google pokazuje jeszcze 18 wykrytych stron z poprzedniego odczytu z 28.09.2026; poczekać na ponowny crawl po zgłoszeniu z 06.10.2026,
- [ ] po ponownym odczycie potwierdzić, że Search Console widzi nowe 21 URL-i,
- [ ] po 2–4 tygodniach sprawdzić zapytania, CTR i strony z wyświetleniami.

Nie dodawać ponownie ogólnych landingów do sitemap `automatyzacjesklepow.pl`; pozostają dostępne dla użytkownika, ale ich canonical prowadzi do `maciejgryziec.pl`.

## 7. Dane firmy / prawne — potrzebne dane właściciela

Nie wpisywałem danych, których nie mam lub nie mogę potwierdzić.

Przed traktowaniem strony jako finalnej strony działalności należy potwierdzić, czy trzeba pokazać m.in.:
- [ ] pełną nazwę podmiotu / firmy,
- [ ] adres działalności / dane rejestrowe,
- [ ] NIP / KRS — jeśli dotyczą,
- [ ] dane administratora danych w polityce prywatności,
- [ ] potwierdzić, że komunikat „ceny netto” używany na homepage i w cenniku jest właściwy dla sposobu rozliczania,
- [ ] zasady ofertowania / ewentualny regulamin, jeśli zacznie się sprzedaż usług bezpośrednio przez stronę.

Tych informacji nie wolno zgadywać.

## 8. LinkedIn — poza zakresem obecnych prac

Zgodnie z decyzją z 2026-10-06 nie prowadzimy teraz zmian profilu ani publikacji na LinkedIn. Priorytetem są obie strony i ich poprawne rozdzielenie SEO.

## Dane formalne do potwierdzenia przed publikacją

- [ ] potwierdzić, czy administratorem/usługodawcą ma być publicznie `Maciej Gryziec`, czy pełna zarejestrowana nazwa działalności; jeśli działalność ma obowiązkowe dane identyfikacyjne, uzupełnić je w polityce/footerze bez zgadywania,
- [x] Umami starej domeny pozostaje osobne: website ID `426e2d75-f696-4c0a-ab60-79e76cf1d73c`; nie mieszać z witryną `maciejgryziec.pl`.
