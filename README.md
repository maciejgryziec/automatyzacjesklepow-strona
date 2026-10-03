# automatyzacjesklepow.pl

Statyczna strona „Automatyzacje dla firm”. Gotowe pliki produkcyjne są generowane do katalogu głównego repozytorium ze źródeł w `zrodla/`.

## Build

```bash
python3 narzedzia/buduj-nowa.py
```

Generator:
- buduje stronę główną i wszystkie podstrony,
- dodaje wspólną nawigację, footer, breadcrumbs i JSON-LD,
- uzupełnia wymiary obrazów,
- podaje WebP przez `<picture>` z fallbackiem JPG/PNG,
- generuje `sitemap.xml`,
- korzysta z dat Gita dla `lastmod`, gdy plik jest już śledzony.

Generator jest przenośny — nie zależy od ścieżki na konkretnym Macu.

## Audyt przed wdrożeniem

```bash
python3 narzedzia/audyt-strony.py
```

Audyt sprawdza m.in.:
- H1, title, description i canonical,
- Open Graph / Twitter,
- poprawność JSON-LD,
- duplikaty title/description,
- lokalne linki i kotwice,
- sitemapę,
- obrazy i WebP,
- manifest, robots.txt i security.txt,
- formularz „Opisz projekt”,
- noindex dla 404.

Ten sam audyt uruchamia GitHub Actions: `.github/workflows/site-audit.yml`.

## Deployment — Coolify

Domena działa na VPS 54.37.234.39 przez Coolify/Traefik. Coolify dla tej aplikacji buduje statyczny image nginx z warstwą:

```text
COPY . .
```

Dlatego **`.dockerignore` jest elementem bezpieczeństwa**, nie kosmetyką. Musi wykluczać co najmniej:

```text
.git
.github
zrodla
narzedzia
```

Dzięki temu źródła i skrypty buildowe nie trafiają do `/usr/share/nginx/html`.

## Kontrola po deployu

Po każdym wdrożeniu sprawdź:

```bash
curl -I https://automatyzacjesklepow.pl/
curl -I https://automatyzacjesklepow.pl/.well-known/security.txt
curl -I https://automatyzacjesklepow.pl/zrodla/index.html
curl -I https://automatyzacjesklepow.pl/narzedzia/buduj-nowa.py
```

Oczekiwany wynik:
- strona główna: `200`,
- `/.well-known/security.txt`: `200`,
- `/zrodla/index.html`: `404`,
- `/narzedzia/buduj-nowa.py`: `404`.

Jeżeli dwa ostatnie adresy zwracają `200`, nie traktuj wdrożenia jako poprawnego.

## Struktura

- `zrodla/` — źródłowe treści HTML,
- `narzedzia/buduj-nowa.py` — generator strony,
- `narzedzia/audyt-strony.py` — quality gate,
- `zdjecia/` — portfolio: oryginały i WebP,
- `.well-known/security.txt` — kontakt bezpieczeństwa,
- `site.webmanifest` — manifest serwisu,
- katalog główny — wynik produkcyjny dla nginx.

## Ważne

Nie edytuj ręcznie wygenerowanych podstron w katalogu głównym, jeżeli zmiana powinna przetrwać kolejny build. Zmieniaj odpowiedni plik w `zrodla/` albo generator, a następnie uruchom build i audyt.

## Zalecana konfiguracja Nginx w Coolify

Dla aplikacji typu **Static** Coolify pozwala edytować Nginx Configuration w `Configuration > General`. Po zapisaniu trzeba wykonać pełny redeploy, ponieważ konfiguracja jest kopiowana do obrazu podczas builda.

Poniższa konfiguracja zachowuje obecne routowanie statycznych plików, dodaje redirect `www → apex`, podstawowe nagłówki bezpieczeństwa oraz cache dla assetów:

```nginx
server {
    listen 80;
    server_name automatyzacjesklepow.pl www.automatyzacjesklepow.pl;

    if ($host = www.automatyzacjesklepow.pl) {
        return 301 https://automatyzacjesklepow.pl$request_uri;
    }

    root /usr/share/nginx/html;
    index index.html index.htm;
    autoindex off;
    server_tokens off;
    absolute_redirect off;
    etag on;
    if_modified_since exact;

    if ($request_method !~ ^(GET|HEAD)$) {
        return 405;
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 512;
    gzip_types text/plain text/css application/javascript application/json application/xml image/svg+xml;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'sha256-9h4+QNjOt3CgNFpdn6iqbeII0Hyi4PqjGT1QhTZFYlc=' https://statystyki.automatyzacjesklepow.pl; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://statystyki.automatyzacjesklepow.pl; font-src 'self' data:; manifest-src 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://sprawdzarka.automatyzacjesklepow.pl; upgrade-insecure-requests" always;

    # Defense in depth: repo/source files must never be public.
    location ^~ /zrodla/ { return 404; }
    location ^~ /narzedzia/ { return 404; }
    location ^~ /deploy/ { return 404; }
    location ^~ /.git/ { return 404; }
    location ^~ /.github/ { return 404; }
    location ~ /\.(?!well-known(?:/|$)) { return 404; }
    location ~* \.(?:py|sh|ya?ml|md|toml|ini|conf|lock|env|bak|old|orig|swp|tmp)$ { return 404; }

    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location = /index.html {
        return 301 /$is_args$args;
    }

    location / {
        # HTML i pliki techniczne są rewalidowane po deployu zamiast wisieć w cache.
        expires -1;

        # Jeśli istnieje odpowiednik .html, kieruj do kanonicznego adresu z rozszerzeniem.
        if (-f $document_root$uri.html) {
            return 301 $uri.html$is_args$args;
        }
        try_files $uri $uri/index.html $uri/index.htm $uri/ =404;
    }

    location ~* \.(?:css|js)$ {
        try_files $uri =404;
        expires 365d;
    }

    location ~* \.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$ {
        try_files $uri =404;
        expires 30d;
    }

    location = /404.html {
        internal;
    }

    location = /50x.html {
        internal;
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

Po wdrożeniu sprawdź dodatkowo:

```bash
curl -I https://www.automatyzacjesklepow.pl/
curl -I https://automatyzacjesklepow.pl/og-image.png
```

Oczekiwane:
- `www` → `301` do `https://automatyzacjesklepow.pl/...`,
- assety → `200` z `Cache-Control`,
- odpowiedzi HTTPS zawierają nagłówki bezpieczeństwa.

## Feed i indeks tekstowy

Build generuje `feed.xml` (Atom) dla stron poradnikowych. Każda strona ma link discovery `rel="alternate"` do feedu.

`llms.txt` zawiera zwięzły indeks głównych usług, zastosowań, branż i kontaktu. Jest dodatkiem informacyjnym — nie należy traktować go jako zamiennika sitemap.xml ani gwarancji widoczności w wyszukiwarkach/agentach AI.

## Smoke test produkcji

Po deployu uruchom:

```bash
python3 narzedzia/sprawdz-live.py
```

Skrypt tylko odczytuje publiczne URL-e i sprawdza m.in.:
- nową wersję strony i CTA,
- redirect `www → apex`,
- `security.txt`,
- brak publicznego dostępu do `zrodla/` i `narzedzia/`,
- OG image,
- nagłówki HSTS, nosniff, Referrer-Policy i Permissions-Policy.

Dopóki produkcja działa na starej wersji, ten test ma prawo zwracać FAIL — jego celem jest odbiór wdrożenia po redeployu.

## Lokalny audyt w prawdziwym Chrome

Po większych zmianach UX uruchom:

```bash
python3 narzedzia/audyt-chrome.py
```

Skrypt sam uruchamia tymczasowy serwer HTTP i sprawdza m.in.:
- overflow na mobile,
- uszkodzone obrazy,
- mobilne menu,
- wyszukiwarkę poradników,
- kwalifikator projektu,
- prefill formularza,
- brak autoplay karuzeli i prawidłowy tab-order.

Wymaga Google Chrome oraz lokalnego pakietu Python `websocket-client`. Nie jest częścią GitHub Actions — CI pozostaje bez zależności przeglądarkowych.

## Pliki release / deploy

- `deploy/nginx.conf` — gotowa konfiguracja do wklejenia w Coolify → Nginx Configuration.
- `narzedzia/release-check.sh` — pełny preflight przed commitem/pushem.
- `narzedzia/audyt-linkow-zewnetrznych.py` — ręczny audyt oficjalnych linków zewnętrznych; celowo poza CI.

Przed releasem:

```bash
./narzedzia/release-check.sh
python3 narzedzia/audyt-chrome.py
python3 narzedzia/audyt-csp.py
python3 narzedzia/audyt-runtime.py
python3 narzedzia/audyt-linkow-zewnetrznych.py
```

Po deployu:

```bash
python3 narzedzia/sprawdz-live.py
```

- `narzedzia/audyt-tresci.py` — kanibalizacja SEO, powtarzalność i zbyt krótkie źródła.
- `narzedzia/audyt-runtime.py` — pełny crawl wszystkich HTML-i w Chrome pod JS errors / obrazy / overflow.
- `narzedzia/audyt-csp.py` — pełny crawl wszystkich HTML-i pod produkcyjną Content-Security-Policy.

## Wdrożenie dwóch usług

Szczegółowa kolejność backup → sprawdzarka → odbiór → główna strona → nginx → smoke test → rollback znajduje się w `DEPLOY-PLAN.md`. Nie pomijaj backupu SQLite przed pierwszym wdrożeniem retencji 30 dni.

## CSP bez `unsafe-inline` w JavaScript

Kod aplikacyjny strony jest ładowany z `list.js` oraz z self-hosted Umami. Jedyny wykonywalny skrypt inline to 97-bajtowy bootstrap `no-js → js`; CSP dopuszcza go wyłącznie przez dokładny hash SHA-256 `sha256-9h4+QNjOt3CgNFpdn6iqbeII0Hyi4PqjGT1QhTZFYlc=`. Dyrektywa `script-src` nie zawiera `unsafe-inline`. JSON-LD pozostaje blokiem danych strukturalnych.

## Cache produkcyjny

HTML i pliki techniczne obsługiwane przez `location /` używają `expires -1`, czyli `Cache-Control: no-cache` z walidacją przez ETag/Last-Modified. Po deployu przeglądarka pyta serwer, czy dokument się zmienił, zamiast trzymać starą wersję. CSS/JS pozostają cache'owane 365 dni, bo ich URL zawiera hash wersji; obrazy — 30 dni.

## Redirecty za reverse proxy

`absolute_redirect off` wymusza relatywne nagłówki `Location` dla redirectów typu `/index.html → /` i `/cennik → /cennik.html`. Dzięki temu nginx działający za Traefikiem nie generuje przypadkiem `http://...` tylko dlatego, że połączenie Traefik → kontener jest wewnętrznie HTTP. Przeglądarka zachowuje publiczny schemat HTTPS.

## Kompresja za Traefikiem

Nginx używa `gzip_proxied any` i poziomu kompresji 5. Dzięki temu zasoby tekstowe są kompresowane również wtedy, gdy ruch dociera przez reverse proxy i pojawia się nagłówek `Via`. `gzip_vary on` dodaje prawidłowe `Vary: Accept-Encoding`.

- `narzedzia/audyt-performance.py` — lokalny lab performance gate: mobile cold-start, emulowane 4G + 4×CPU; 2 zimne runy i ocena gorszego wyniku, z maks. 3 próbami technicznymi na run. Budżet: LCP ≤ 3,2 s, CLS ≤ 0,10 i transfer ≤ 200 KB. Gdy headless Chrome nie dostarczy wpisu LCP, gate używa konserwatywnego fallbacku max(FCP, responseEnd obrazów above-the-fold) i raportuje to jawnie.

## Budżet wydajności

`narzedzia/audyt-performance.py` wykonuje lokalny cold-start mobile przy 390×844 px, 100 ms RTT, ok. 1,6 Mb/s i CPU x4. Budżet regresji: LCP ≤ 3,2 s, CLS ≤ 0,10 i ≤ 200 KB transferu dla kluczowych stron. `realizacje.html` dodatkowo musi startować bez pobierania nieaktywnego screena wypożyczalni. Test jest lokalny, nie w CI, ponieważ timing zależy od wydajności hosta.

## Kompresja odpowiedzi

Nginx używa gzip poziom 5 dla HTML/CSS/JS/JSON/XML/SVG także za reverse proxy (`gzip_proxied any`). To rozsądny kompromis między rozmiarem odpowiedzi i kosztem CPU dla małej statycznej strony. `Cross-Origin-Opener-Policy: same-origin` dodatkowo izoluje kontekst strony od obcych okien.

### Pomiar gzip na aktualnym buildzie

W izolowanym nginx opartym o ten sam obraz co produkcja: `list.css` ~51,6 KB → ~12,8 KB gzip (ok. -75%), `list.js` ~23,1 KB → ~8,0 KB gzip (ok. -65%). Smoke test po deployu wymaga `Content-Encoding: gzip` oraz `Vary: Accept-Encoding` dla HTML/CSS/JS.

## Budżety wydajności

- `narzedzia/audyt-assets.py` działa w CI: CSS gzip ≤ 20 KB, JS gzip ≤ 15 KB, warianty `*-800.webp` ≤ 100 KB, pełne WebP ≤ 300 KB.
- `narzedzia/audyt-performance.py` jest celowo lokalny: cold-start mobile, 390×844, 100 ms RTT, ~1.6 Mb/s, CPU ×4. Limit regresji: LCP ≤ 3.2 s, CLS ≤ 0.10, transfer ≤ 200 KB; realizacje nie mogą pobierać nieaktywnej karty przed kliknięciem.


## Kontrast WCAG

`narzedzia/audyt-kontrast.py` działa lokalnie i w CI. Czyta faktyczne tokeny z wygenerowanego `list.css` i pilnuje minimum **4,5:1** dla zwykłego tekstu: tekst/szary/link na bieli, białe CTA oraz pomocnicze teksty na najjaśniejszych fragmentach ciemnych sekcji. Dzięki temu zmiana palety nie może po cichu obniżyć czytelności małego tekstu poniżej WCAG AA.

## Audyt wydruku/PDF cennika

`narzedzia/audyt-print.py` jest lokalnym testem prawdziwego wydruku z Chromium. Generuje PDF cennika, wymaga A4, sprawdza kluczowe pozycje/ceny, odrzuca webowe elementy nawigacyjne, renderuje wszystkie strony przez Poppler do PNG i blokuje puste strony. Nie działa w CI, bo wymaga lokalnego Chromium, `pypdf`, Pillow i `pdftoppm`.
