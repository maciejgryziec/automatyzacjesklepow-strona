# Automatyzacje Sklepów: przebudowa 11.10.2026

## Kierunek
Własny interfejs strony usługowej e-commerce, a nie kolejny szablon strony programisty. Ciemny nagłówek, zielono-limonkowy akcent, wiodący diagram przepływu danych (3 scenariusze), interaktywne karty usług, kategorie i portfolio.

## Inspiracje przeglądane jako odniesienia, bez kopiowania projektów
- [Awwwards, dark mode InfinityFX](https://www.awwwards.com/inspiration/dark-mode-infinityfx): ciemny podkład, kontrast i mocna typografia.
- [Awwwards, services layout WKNDHRS](https://www.awwwards.com/inspiration/services-layout-wkndhrs): siatka usług, subtelne ruchy.
- [Awwwards, interactive homepage RANGE RAK](https://www.awwwards.com/inspiration/interactive-homepage-range-rak): interaktywne sekcje i reakcje na kliknięcia.
- [Linear Integration Directory](https://linear.app/docs/integration-directory): układ integracji z jasnym podziałem na obszary i powiązane narzędzia.

Elementy wykonane od początku jako własny HTML, CSS, SVG i JS. Brak płatnych szablonów ani bibliotek animacyjnych. Zrezygnowano z ciężkiego WebGL i efektów, które przeszkadzają w czytaniu.

## Struktura
- Strona główna: komunikat oferty, trzy interaktywne scenariusze, sześć usług, proces, realizacje, partnerzy integracyjni jako przykładowe systemy, cennik, CTA.
- /uslugi-automatyzacji.html: osiem kategorii z linkami do szczegółów, uwzględnia SEO.
- /opisz-projekt.html: własny formularz z walidacją, zapisem szkicu, tokenem, limitem i bezpośrednim wysyłaniem.
- /realizacje.html: opis zakresu i ograniczone dane klientów; narzędzia RoofPVcalculator i Sprawdzarka, bez wymyślonych opinii czy statystyk.
- /cennik.html, /poradniki.html i pozostałe strony: nowa wspólna nawigacja, typografia, stopka i CTA z zachowaniem URL.
- /polityka-prywatnosci.html: uzupełniony przepływ danych formularza (serwer + e-mail), nie pozorujemy wysyłki poprzez mailto.

## Technologia i deployment
Repo: `maciejgryziec/automatyzacjesklepow-strona`, branch main, generator `narzedzia/buduj-nowa.py`.
47 stron HTML, stałe linki, canonical, sitemap, schema i feed.
Styling: `redesign.css` i `redesign.js`, wersjonowane przez hash w generatorze.
Formularz: osobna usługa `automatyzacjesklepow-contact` z własną bazą antyspamową i kluczem HMAC, nie ingeruje w `maciejgryziec-contact`. SMTP jest zweryfikowany i odbiera do `kontakt@maciejgryziec.pl`, a strona wyświetla kontakt marketingowy `kontakt@automatyzacjesklepow.pl` (MX: OVH).
W Nginx `deploy/nginx.conf`: proxy tylko `/api/contact` i `/api/contact/session`, prawdziwy IP tylko od zaufanego reverse proxy Coolify, reszta GET/HEAD, ścisłe CSP i brak publicznego dostępu do źródeł.
Production is managed by Coolify app UUID `vmoezvrbtdthw88n9zbpcr4n`. Do not replace app with a detached Docker container.

## Testy
- `python3 narzedzia/buduj-nowa.py`: 47 stron.
- `python3 narzedzia/audyt-strony.py`: 47/47; links, metadata, canonical, schema, sitemap.
- `python3 narzedzia/audyt-runtime.py`: 47/47, zero błędów.
- `python3 narzedzia/audyt-csp.py`: 47/47, zero naruszeń.
- `python3 narzedzia/audyt-assets.py`: budżety grafik OK.
- `python3 -m unittest discover -s deploy/contact -p 'test_*.py'`: 7/7.
- `python3 narzedzia/test_responsive.py` (wymaga Chrome CDP na localhost 9393): 21 widoków przy 320–1440 px bez poziomego przewijania.
- Staging VPS localhost `127.0.0.1:18183`: Nginx + odizolowany backend formularza, strony działają, niedozwolone API i żądania blokowane.

Nie wysyłano prawdziwych maili testowych. Serwis e-mailowy przeszedł testy z atrapą nadawcy, a aktualna konfiguracja OVH została sprawdzona przez healthcheck.

## Rollback
Backup stanu sprzed przebudowy:
`/Users/maciej/Documents/GitHub/automatyzacjesklepow-backup-20261011.tar.gz`
W Git bazowy commit `a9d78ac`; commit 3bfea37 zawiera przebudowę bez ostatnich poprawek mobilnych.
Po wdrożeniu w Coolify porównać SHA obrazu i commit. W przypadku poważnej regresji wrócić do poprzedniego deploymentu przez Coolify (w historii aplikacji), a nie przez nadpisywanie plików kontenera na produkcji.

## Uzupełnienie kontroli po publikacji (11.10.2026)
- Rzeczywisty test formularza z publicznej strony: jeden test techniczny wysłany na własny adres kontakt@maciejgryziec.pl. Formularz pokazał „Wysłano”, SMTP potwierdził przyjęcie, a wyszukanie konkretnej testowej wiadomości przez IMAP potwierdziło jej odbiór. Nie kontaktowano się z klientami.
- Sprawdzono publiczną stronę: 45/45 stron HTML, 200 OK, nowa wersja CSS/JS, przekierowania, sitemap i API.
- Testy interakcji w odizolowanym Chrome: mobilne menu i Escape, przełączanie trzech schematów, pola/ważność formularza, katalog ośmiu usług. Nie wysłano wiadomości przy testach interakcji.
- Nowy audyt kontrastu `narzedzia/audyt-kontrast-redesign.py` kontroluje 12 par kolorów tekstu nowego interfejsu, wszystkie >= 4.5:1. Poprawiono sześć drobnych etykiet o zbyt słabym kontraście.
- Adres e-mail kontakt@automatyzacjesklepow.pl przeszedł kontrolę akceptacji odbiorcy przez SMTP OVH (250), ale **nie potwierdza to odbioru wiadomości przez tę konkretną skrzynkę ani forwardu**. Formularz na pewno doręcza do zweryfikowanego kontakt@maciejgryziec.pl.
