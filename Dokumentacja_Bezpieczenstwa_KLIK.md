# Dokumentacja Bezpieczeństwa aplikacji KLIK

## 1. Wprowadzenie

### 1.1. Cel Dokumentu
Niniejszy dokument opisuje środki bezpieczeństwa zaimplementowane w aplikacji KLIK oraz na platformie Azure, na której jest hostowana. Celem jest zapewnienie poufności, integralności i dostępności danych oraz usług aplikacji.

### 1.2. Podejście do Bezpieczeństwa
Zastosowano podejście warstwowe (defense-in-depth), obejmujące zabezpieczenia na poziomie danych, aplikacji, sieci, tożsamości oraz monitorowania.

## 2. Bezpieczeństwo Danych

### 2.1. Dane w Transmisji (Data in Transit)
* **HTTPS:**
    * Azure App Service domyślnie zapewnia certyfikat SSL/TLS dla domeny `*.azurewebsites.net`, szyfrując całą komunikację między klientem (przeglądarką) a serwerem aplikacji.
    * **Rekomendacja:** Dla środowisk produkcyjnych zaleca się skonfigurowanie własnej domeny (np. `klik-game.com`) i przypisanie jej dedykowanego certyfikatu SSL/TLS.
* **Połączenie z Bazą Danych:**
    * Połączenie między aplikacją Node.js a serwerem Azure Database for MySQL jest szyfrowane przy użyciu SSL. Konfiguracja w `dbConfig.js` (`ssl: { rejectUnauthorized: true, ca: fs.readFileSync(...) }`) wymusza weryfikację certyfikatu serwera CA, co chroni przed atakami typu Man-in-the-Middle (MITM). Plik `DigiCertGlobalRootCA.crt.pem` jest wymagany.

### 2.2. Dane w Spoczynku (Data at Rest)
* **Azure Database for MySQL:**
    * Usługa Azure Database for MySQL Flexible Server domyślnie szyfruje dane przechowywane na dyskach (encryption at rest) przy użyciu kluczy zarządzanych przez usługę.
* **Hasła Użytkowników:**
    * Hasła użytkowników są hashowane jednostronnie za pomocą algorytmu `bcrypt` (zgodnie z `package.json` i logiką w `server.js`) przed zapisaniem ich do bazy danych. Zapobiega to odczytaniu oryginalnych haseł nawet w przypadku uzyskania dostępu do bazy.
* **Sekrety Aplikacji:**
    * Klucze API, hasła do bazy danych, sekrety sesji i CSRF są zarządzane jako zmienne środowiskowe (Ustawienia Aplikacji w Azure App Service).
    * **Rekomendacja Kluczowa:** Wszystkie sekrety aplikacji powinny być przechowywane w **Azure Key Vault**. App Service może uzyskać do nich bezpieczny dostęp za pomocą skonfigurowanej Tożsamości Zarządzanej Przypisanej przez Użytkownika (`userAssignedIdentities_my_klik_app_id_a99e_name`), eliminując potrzebę przechowywania ich nawet w konfiguracji App Service.

## 3. Bezpieczeństwo Aplikacji

### 3.1. Uwierzytelnianie
* System logowania oparty na nazwie użytkownika i haśle.
* Mechanizm odzyskiwania/resetowania hasła realizowany poprzez wysłanie unikalnego, czasowego linku z tokenem na zarejestrowany adres e-mail użytkownika (z użyciem `nodemailer`). Tokeny resetowania powinny być jednorazowe i mieć krótki czas ważności.

### 3.2. Autoryzacja
* Dostęp do chronionych zasobów i funkcjonalności aplikacji (np. menu gry, historia gier, rozgrywka) jest ograniczony tylko do zalogowanych (uwierzytelnionych) użytkowników. Jest to realizowane poprzez middleware w Express.js, który weryfikuje obecność i ważność sesji użytkownika (`req.session.user`).

### 3.3. Zarządzanie Sesjami
* Wykorzystanie biblioteki `express-session` do obsługi sesji użytkowników.
* **Konfiguracja Ciasteczek Sesji:** (`server.js`)
    * `httpOnly: true`: Chroni ciasteczka przed dostępem przez skrypty JavaScript po stronie klienta (zabezpieczenie przed XSS).
    * `secure: process.env.NODE_ENV === 'production'`: Zapewnia, że ciasteczka są wysyłane tylko przez HTTPS w środowisku produkcyjnym.
    * `sameSite: 'lax'`: Zapewnia ochronę przed niektórymi typami ataków CSRF.
    * `maxAge`: Określa czas życia ciasteczka sesji.
* **Sekret Sesji:** Klucz `SESSION_SECRET` używany do podpisywania ciasteczek sesji jest przechowywany jako zmienna środowiskowa i nie powinien być ujawniany.

### 3.4. Ochrona przed CSRF (Cross-Site Request Forgery)
* Zaimplementowana przy użyciu biblioteki `csurf`.
* Generowany jest unikalny token CSRF dla każdej sesji użytkownika.
* Token ten jest wymagany dla wszystkich żądań modyfikujących stan (POST, PUT, DELETE), wysyłanych np. przez formularze.
* Frontend pobiera token CSRF z dedykowanego endpointu (`/auth/csrf-token`) i dołącza go do nagłówka (`CSRF-Token`) lub ciała żądania.

### 3.5. Ochrona przed Atakami Siłowymi i DoS (Rate Limiting)
* Zaimplementowana przy użyciu biblioteki `express-rate-limit`.
* Ogranicza liczbę żądań, jakie dany adres IP może wysłać do serwera w określonym oknie czasowym, szczególnie dla endpointów krytycznych (np. logowanie, rejestracja, reset hasła). Pomaga to chronić przed atakami typu brute-force i prostymi atakami DoS.

### 3.6. Walidacja Danych Wejściowych
* **Po stronie klienta:** Skrypty JavaScript (`index.js`, `reset.js`) walidują dane wprowadzane przez użytkownika w formularzach (np. format e-maila, złożoność hasła). Jest to pierwszy poziom walidacji, poprawiający UX.
* **Po stronie serwera:** Jest to **krytyczny** element bezpieczeństwa. Wszystkie dane otrzymane od klienta muszą być rygorystycznie walidowane i sanityzowane po stronie serwera (`server.js`) przed ich przetworzeniem lub zapisem do bazy danych. Zapobiega to atakom takim jak:
    * **SQL Injection (SQLi):** Użycie zapytań parametryzowanych (prepared statements) przez bibliotekę `mysql2` (jak w `db.js`) jest podstawową i skuteczną ochroną przed SQLi.
    * **Cross-Site Scripting (XSS):** Należy odpowiednio enkodować dane wyjściowe przed wyświetleniem ich użytkownikowi. Użycie `Content-Security-Policy` również pomaga.

### 3.7. Bezpieczeństwo Nagłówków HTTP
* **Content-Security-Policy (CSP):** Zdefiniowany w `index.html`: `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';`. Należy go regularnie przeglądać i dostosowywać do aktualnych potrzeb, minimalizując użycie `'unsafe-inline'` tam, gdzie to możliwe.
* **Inne Nagłówki:** Rozważ dodanie innych nagłówków bezpieczeństwa, takich jak `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` lub `SAMEORIGIN`, `Strict-Transport-Security (HSTS)` (po skonfigurowaniu własnej domeny i SSL). Mogą być one ustawione w konfiguracji App Service lub poprzez middleware w Express.

### 3.8. Zarządzanie Zależnościami
* Należy regularnie skanować zależności projektu (zdefiniowane w `package.json`) pod kątem znanych podatności, używając narzędzi takich jak `npm audit`.
* Aktualizuj biblioteki do najnowszych stabilnych wersji, aby łatać wykryte luki bezpieczeństwa.

## 4. Bezpieczeństwo Sieci

* **Azure App Service:**
    * Wbudowane podstawowe mechanizmy ochrony.
    * Możliwość konfiguracji ograniczeń dostępu (Access Restrictions) np. na podstawie adresów IP lub znaczników usług.
* **Azure Database for MySQL Flexible Server:**
    * Dostęp publiczny jest włączony (`publicNetworkAccess: "Enabled"`), a firewall jest skonfigurowany tak, aby zezwalać na połączenia z usług Azure (reguła `allow_azure` z zakresem `0.0.0.0` - `0.0.0.0`). Umożliwia to aplikacji App Service łączenie się z bazą.
    * **Rekomendacja (zgodnie z PDF i najlepszymi praktykami):** W celu maksymalizacji bezpieczeństwa, zaleca się wyłączenie publicznego dostępu do serwera MySQL i skonfigurowanie **prywatnego punktu końcowego (Private Endpoint)**. Następnie należy zintegrować App Service z **siecią wirtualną (VNet Integration)**, która ma dostęp do tego prywatnego punktu końcowego. To izoluje ruch do bazy danych od publicznego internetu.
* **Ochrona przed DDoS:** Azure zapewnia podstawową ochronę DDoS Infrastructure Protection bez dodatkowych kosztów. Dla zaawansowanej ochrony przed wolumetrycznymi i protokołowymi atakami DDoS, rozważ usługę Azure DDoS Protection Standard.
* **Web Application Firewall (WAF):**
    * **Rekomendacja (zgodnie z PDF):** Dla dodatkowej warstwy ochrony przed powszechnymi atakami na aplikacje webowe (takimi jak XSS, SQL Injection, itp.), zaleca się wdrożenie usługi Azure Front Door z WAF lub Azure Application Gateway z WAF przed aplikacją App Service.

## 5. Zarządzanie Tożsamością i Dostępem (IAM)

* **Zasada Najmniejszych Uprawnień (Principle of Least Privilege):**
    * Należy stosować minimalne niezbędne uprawnienia dla kont użytkowników i usług Azure podczas konfiguracji dostępu (RBAC - Role-Based Access Control).
* **Tożsamości Zarządzane (Managed Identities):**
    * Wdrożona została **Tożsamość Zarządzana Przypisana przez Użytkownika** (`userAssignedIdentities_my_klik_app_id_a99e_name`).
    * **Rekomendacja:** Wykorzystaj tę tożsamość, aby App Service mógł bezpiecznie uwierzytelniać się w Azure Key Vault (do pobierania sekretów) oraz, jeśli to możliwe i skonfigurowane, w Azure Database for MySQL przy użyciu uwierzytelniania Microsoft Entra ID (zamiast tradycyjnego loginu/hasła).

## 6. Monitorowanie i Rejestrowanie Zdarzeń (Logging & Monitoring)

* **Application Insights:**
    * Gromadzi szczegółowe dane telemetryczne, logi aplikacji, metryki wydajności.
    * Umożliwia wykrywanie anomalii, diagnozowanie błędów i analizę trendów użycia.
* **Azure Monitor:**
    * Skonfigurowane alerty dla krytycznych metryk (błędy HTTP 5xx, wysokie użycie CPU bazy danych, duża liczba połączeń z bazą) z powiadomieniami przez grupy akcji.
* **Logi App Service:**
    * Dostęp do logów serwera WWW oraz logów aplikacji (np. `console.log` z Node.js) poprzez Log stream (strumieniowanie na żywo) lub zapis do Azure Storage/Log Analytics.
* **Logi Bazy Danych:**
    * Możliwość włączenia logów diagnostycznych (np. wolne zapytania, błędy) dla Azure Database for MySQL i przesyłania ich do Log Analytics.
* **Regularny Przegląd Logów:** Jest kluczowym elementem proaktywnego wykrywania problemów i potencjalnych incydentów bezpieczeństwa.

## 7. Odzyskiwanie po Awarii (Disaster Recovery)

* **Azure App Service:**
    * Plan `Standard S1` oferuje funkcję tworzenia kopii zapasowych (automatycznych i manualnych) aplikacji i jej konfiguracji.
    * Możliwość przywrócenia aplikacji z kopii zapasowej.
* **Azure Database for MySQL Flexible Server:**
    * Usługa zapewnia automatyczne tworzenie kopii zapasowych.
    * Możliwość przywracania bazy danych do określonego punktu w czasie (Point-In-Time Restore - PITR).
    * Dla zwiększenia odporności, rozważ konfigurację replik do odczytu lub replikacji geograficznej (Geo-replication).
* **Infrastruktura jako Kod (IaC):**
    * Szablon ARM (`template.json`) umożliwia szybkie i spójne odtworzenie całej infrastruktury aplikacji w tym samym lub innym regionie Azure w przypadku poważnej awarii.

## 8. Bezpieczny Cykl Rozwoju Oprogramowania (Secure SDLC) - Rekomendacje

* **Przeglądy Kodu (Code Reviews):** Regularne przeglądy kodu, ze szczególnym uwzględnieniem aspektów bezpieczeństwa.
* **Szkolenia Deweloperów:** Zapewnienie, że deweloperzy są świadomi powszechnych zagrożeń i najlepszych praktyk bezpiecznego kodowania.
* **Testy Bezpieczeństwa:** Włączenie statycznych (SAST) i dynamicznych (DAST) testów bezpieczeństwa aplikacji do cyklu rozwoju.
* **Microsoft Defender for Cloud:**
    * Rozważ wykorzystanie Microsoft Defender for Cloud do oceny i wzmacniania stanu bezpieczeństwa zasobów Azure, w tym **Microsoft Defender for Databases** (wspomniany w PDF) dla serwera MySQL, który może pomóc w wykrywaniu nietypowych aktywności i potencjalnych zagrożeń dla bazy danych.