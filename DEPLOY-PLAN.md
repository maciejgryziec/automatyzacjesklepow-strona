# Plan wydania — automatyzacjesklepow.pl + sprawdzarka

Ten dokument opisuje **kolejność bezpiecznego wdrożenia** obecnych zmian. Samo posiadanie tego pliku nie wykonuje żadnej operacji na produkcji.

## Zasada najważniejsza

Wdrażamy w tej kolejności:

1. backup produkcyjnej bazy sprawdzarki,
2. sprawdzarka,
3. odbiór sprawdzarki,
4. dopiero potem główna strona,
5. konfiguracja nginx głównej strony,
6. odbiór całego serwisu.

Powód: polityka prywatności głównej strony opisuje już retencję 30 dni i brak pola e-mail. Najpierw produkcyjna sprawdzarka musi rzeczywiście zachowywać się w ten sposób.

---

# Etap A — preflight lokalny

## A1. Sprawdzarka

Repo:
`/Users/maciej/Documents/GitHub/demo/demo-1-sprawdzarka`

Uruchom:

```bash
./narzedzia/release-check.sh
```

Oczekiwane:
- **160 testów zielonych**,
- compile OK,
- `git diff --check` OK,
- `.dockerignore` OK.

## A2. Główna strona

Repo:
`/Users/maciej/Documents/GitHub/demo/strona`

Uruchom:

```bash
./narzedzia/release-check.sh
python3 narzedzia/audyt-chrome.py
python3 narzedzia/audyt-csp.py
python3 narzedzia/audyt-runtime.py
python3 narzedzia/audyt-performance.py
python3 narzedzia/audyt-linkow-zewnetrznych.py
```

Wszystkie muszą przejść.

---

# Etap B — backup sprawdzarki PRZED deployem

Pierwszy start nowej wersji automatycznie usuwa zadania/raporty starsze niż 30 dni.

**Nie wdrażaj sprawdzarki bez backupu.**

## B1. Znajdź aktywny kontener

W tej samej lokalnej sesji Terminala na Macu, z której wykonasz backup:

```bash
CID="$(ssh moj-vps 'sudo docker ps -q | while read c; do
  sudo docker inspect "$c" --format "{{json .Config.Labels}}" 2>/dev/null |
    grep -q "sprawdzarka.automatyzacjesklepow.pl" && { echo "$c"; break; }
done')"

printf 'CHECKER_CID=%s\n' "$CID"
test -n "$CID" || { echo "Nie znaleziono kontenera sprawdzarki" >&2; exit 1; }
```

Od tego miejsca **nie zamykaj tej sesji Terminala**, dopóki nie skończysz Etapu B — kolejne komendy korzystają z lokalnej zmiennej `$CID`.

## B2. Zanotuj obraz i jeden świeży raport do testu ciągłości

```bash
ssh moj-vps "sudo docker inspect '$CID' --format 'IMAGE={{.Config.Image}}'"

ssh moj-vps "sudo docker exec -i '$CID' python -" <<'PY'
import sqlite3
db=sqlite3.connect("/dane/sprawdzarka.db")
row=db.execute(
    "SELECT id, utworzono FROM zadania WHERE stan='gotowe' ORDER BY utworzono DESC LIMIT 1"
).fetchone()
print("RECENT_REPORT=", row or "BRAK")
PY
```

Nie kopiuj treści raportu — wystarczy ID + data do testu ciągłości.

## B3. Spójny backup SQLite

Z Maca, będąc w repo sprawdzarki:

```bash
TS="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="sprawdzarka-before-${TS}.db"

ssh moj-vps "sudo docker exec -i '$CID' python - /dane/sprawdzarka.db /tmp/$BACKUP"   < narzedzia/backup-bazy.py

ssh moj-vps "sudo mkdir -p /opt/backups/automatyzacjesklepow &&
  sudo docker cp '$CID:/tmp/$BACKUP' '/opt/backups/automatyzacjesklepow/$BACKUP' &&
  sudo chmod 600 '/opt/backups/automatyzacjesklepow/$BACKUP' &&
  sudo docker exec '$CID' rm -f '/tmp/$BACKUP' &&
  sudo sha256sum '/opt/backups/automatyzacjesklepow/$BACKUP'"
```

## B4. Druga kopia na Macu

```bash
mkdir -p ~/Studio-Site-Backups
scp "moj-vps:/opt/backups/automatyzacjesklepow/$BACKUP"     "$HOME/Studio-Site-Backups/$BACKUP"
chmod 600 "$HOME/Studio-Site-Backups/$BACKUP"
shasum -a 256 "$HOME/Studio-Site-Backups/$BACKUP"
```

Hash na Macu ma być taki sam jak hash na VPS.

---

# Etap C — commit/push sprawdzarki

Dopiero po backupie.

```bash
cd /Users/maciej/Documents/GitHub/demo/demo-1-sprawdzarka
./narzedzia/release-check.sh
git status
git add -A
git status
git diff --cached --check
```

Commit/push dopiero po świadomej akceptacji zakresu.

---

# Etap D — deploy sprawdzarki w Coolify

Po pushu uruchom pełny redeploy aplikacji:
`sprawdzarka.automatyzacjesklepow.pl`.

Nowy obraz powinien:

- mieć ok. 60–70 MiB,
- działać jako UID/GID 10001,
- mieć Docker health = healthy,
- automatycznie przejąć właściciela starego wolumenu `/dane`,
- nie zawierać testów, `.github`, README ani narzędzi release.

## D1. Kontrola kontenera po deployu

```bash
CID="$(sudo docker ps -q | while read c; do
  sudo docker inspect "$c" --format '{{json .Config.Labels}}' 2>/dev/null |
    grep -q 'sprawdzarka.automatyzacjesklepow.pl' && { echo "$c"; break; }
done)"

sudo docker inspect "$CID" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}brak-healthcheck{{end}}'
sudo docker exec "$CID" sh -c "grep '^Uid:' /proc/1/status; grep '^Gid:' /proc/1/status"
sudo docker exec "$CID" sh -c "stat -c '%u:%g %a %n' /dane /dane/sprawdzarka.db"
```

Oczekiwane:
- `healthy`,
- UID/GID 10001,
- baza zapisywalna przez 10001.

## D2. Odbiór HTTP sprawdzarki

```bash
curl -I https://sprawdzarka.automatyzacjesklepow.pl/
curl -i https://sprawdzarka.automatyzacjesklepow.pl/healthz
curl -i https://sprawdzarka.automatyzacjesklepow.pl/.well-known/security.txt
curl -I https://sprawdzarka.automatyzacjesklepow.pl/docs
curl -I https://sprawdzarka.automatyzacjesklepow.pl/openapi.json
```

Oczekiwane:
- `HEAD /` → 200,
- `/healthz` → 200 + `{"status":"ok"}`,
- security.txt → 200,
- docs/openapi → 404,
- brak nagłówka `Server: uvicorn`,
- CSP/HSTS/nosniff obecne.

## D3. Odbiór funkcjonalny

Na stronie sprawdzarki:
- brak pola e-mail,
- komunikat o usuwaniu raportu po 30 dniach,
- Ceneo XML / Google Merchant jako opcja,
- nowy skan działa,
- wynik jest noindex/no-store,
- gotowy raport można otworzyć przez link,
- zapisany przed deployem świeży raport nadal działa, jeśli miał <30 dni,
- raport >30 dni może zostać celowo usunięty przez nową retencję.

---

# Etap E — rollback sprawdzarki

Jeżeli nowy kontener nie jest zdrowy:

1. nie wdrażaj jeszcze głównej strony,
2. w Coolify wróć do poprzedniego commita/obrazu,
3. stary obraz uruchamiany jako root nadal może czytać bazę, nawet jeśli nowy entrypoint zmienił właściciela pliku na UID 10001.

Jeżeli problem dotyczy danych / retencji i trzeba odzyskać starą bazę:

1. zatrzymaj zapis do sprawdzarki,
2. zachowaj kopię obecnego pliku,
3. przywróć backup utworzony w Etapie B.

Nie przywracaj bazy zwykłym `cp` do pliku używanego przez działający proces SQLite.

---

# Etap F — commit/push głównej strony

Dopiero gdy sprawdzarka przeszła Etap D.

```bash
cd /Users/maciej/Documents/GitHub/demo/strona
./narzedzia/release-check.sh
python3 narzedzia/audyt-chrome.py
python3 narzedzia/audyt-csp.py
python3 narzedzia/audyt-runtime.py
python3 narzedzia/audyt-performance.py
python3 narzedzia/audyt-linkow-zewnetrznych.py
git status
```

Po świadomej akceptacji zakresu:
- stage,
- `git diff --cached --check`,
- commit,
- push.

---

# Etap G — Coolify / nginx głównej strony

W aplikacji `automatyzacjesklepow.pl`:

1. `Configuration → General → Nginx Configuration`,
2. wklej **dokładnie** zawartość `deploy/nginx.conf`,
3. zapisz,
4. wykonaj pełny redeploy.

Konfiguracja została przetestowana przez prawdziwy `nginx -t` w tym samym typie obrazu nginx używanym obecnie przez Coolify.

Po deployu:
- `www → apex`,
- `/index.html → /`,
- extensionless → kanoniczne `.html`,
- HSTS/CSP/nosniff/Referrer-Policy/Permissions-Policy,
- źródła/dev pliki 404,
- własne 404 i 50x,
- gzip,
- cache assetów,
- `/healthz` → 200 `ok`.

W Coolify ustaw healthcheck głównej strony na `/healthz`.

---

# Etap H — automatyczny odbiór całego live

Po deployu głównej strony:

```bash
cd /Users/maciej/Documents/GitHub/demo/strona
python3 narzedzia/sprawdz-live.py
```

Dopiero komunikat:

`PRODUKCJA OK`

oznacza zamknięcie wdrożenia.

---

# Etap I — manualny odbiór

Na telefonie i desktopie sprawdź:
- homepage,
- Realizacje,
- Cennik + kwalifikator,
- Poradniki + wyszukiwarka,
- Kalkulator kosztu ręcznej pracy,
- Opisz projekt,
- Sprawdzarka,
- jeden poradnik KSeF,
- jeden landing CRM/API.

Sprawdź:
- mobile menu,
- deep-linki,
- formularz briefu,
- autosave briefu,
- pobranie TXT,
- print/PDF cennika.

---

# Etap J — Search Console po stabilnym deployu

Po zielonym smoke teście:

1. otwórz Google Search Console,
2. prześlij ponownie `https://automatyzacjesklepow.pl/sitemap.xml`,
3. sprawdź indeksowanie głównych nowych landingów,
4. obserwuj query/CTR przez 2–4 tygodnie,
5. nie przebudowuj masowo tytułów po 1–2 dniach.

---

# Etap K — dopiero potem LinkedIn

Po poprawnym release:
- link w profilu → konkretna strona / `opisz-projekt.html`,
- posty case-study z UTM,
- Photonroof → `realizacje.html#photonroof`,
- wypożyczalnia → `realizacje.html#wypozyczalnia`,
- Excel/process automation → odpowiedni poradnik,
- każdy UTM trafia do first-touch attribution i dalej do briefu.

To jest właściwy moment na kolejny etap: content bot / LinkedIn.

---

# Etap L — osobny hardening / upgrade Umami po stabilnym release strony

Ten etap **nie jest częścią tego samego deployu**, co strona i sprawdzarka. Produkcja używa obecnie `ghcr.io/umami-software/umami:3.0.3`; przed zmianą wersji potrzebny jest osobny backup PostgreSQL i test migracji.

Po co: obecna instancja nie ma ustawionych jawnie `PRIVATE_MODE`, `DISABLE_TELEMETRY` ani `SALT_ROTATION`. Nowsza linia 3.x ma również nowsze zależności i dodatkowe funkcje bezpieczeństwa.

Plan:

1. backup bazy PostgreSQL Umami + checksum,
2. zanotowanie obecnego obrazu `3.0.3` i sposobu rollbacku,
3. osobny test obrazu `ghcr.io/umami-software/umami:3.4.0` na kopii bazy / stagingu,
4. po udanym teście aktualizacja obrazu do **dokładnego tagu 3.4.0**, nie `latest`,
5. w Coolify ustawić:
   - `PRIVATE_MODE=1`,
   - `DISABLE_TELEMETRY=1`,
   - `SALT_ROTATION=month`,
6. po aktualizacji sprawdzić tracker strony, eventy i panel logowania,
7. jeżeli ma być używane 2FA, najpierw skonfigurować wymagany klucz zgodnie z dokumentacją wersji, a dopiero potem włączyć TOTP dla konta administratora,
8. nie zmieniać deklarowanej retencji analityki na konkretny okres, dopóki nie istnieje realny mechanizm usuwania danych według wieku.

Obecna polityka prywatności mówi prawdę: self-hosted Umami przechowuje historię do ręcznego usunięcia/resetu.
