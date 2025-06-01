# Wdrożenie aplikacji MyMemoryMatch na platformie Azure

## Spis treści
- [Wprowadzenie](#wprowadzenie)
- [Wymagania](#wymagania)
- [Konfiguracja zasobów](#konfiguracja-zasobów)
  - [Grupa zasobów (`klik-grupa`)](#grupa-zasobów-klik-grupa)
  - [App Service (`my-klik-app`)](#app-service-my-klik-app)
  - [Baza danych (`klik2-db`)](#baza-danych-klik2-db)
- [Zabezpieczenia](#zabezpieczenia)
- [CI/CD z GitHub Actions)
- [Monitorowanie i logi](#monitorowanie-i-logi)
- [Odzyskiwanie po awarii](#odzyskiwanie-po-awarii)
- [Opcje dodatkowe (Premium)](#opcje-dodatkowe-premium)

## Wprowadzenie
Niniejszy dokument opisuje wdrożenie aplikacji **MyMemoryMatch** (gra multiplayer oparta na Node.js, Express.js, Socket.IO i MySQL) na platformie Microsoft Azure w ramach subskrypcji **Azure for Students**. Aplikacja jest publicznie dostępna, hostowana w usłudze App Service (`my-klik-app`) z bazą danych w Azure Database for MySQL Flexible Server (`klik2-db`). Dokumentacja wyjaśnia konfigurację zasobów, zabezpieczenia, pipeline CI/CD oraz opcje dostępne w wyższych planach.

**Cel**: Zapewnienie bezpiecznego, skalowalnego i monitorowanego środowiska dla aplikacji przy minimalnych kosztach.

---

## Wymagania
- **Subskrypcja**: Azure for Students (kredyt 100 USD rocznie).
- **Konto GitHub**: Repozytorium z kodem źródłowym.
- **Pliki**:
  - `server.js`: Główny serwer aplikacji (Node.js, Express.js, Socket.IO).
  - `dbConfig.js`: Konfiguracja połączenia z MySQL (z SSL).
  - `main_my_klik_app.yml`: Pipeline CI/CD (GitHub Actions).
  - `DigiCertGlobalRootCA.crt.pem`: Certyfikat SSL dla połączeń z bazą.
  - `package.json`: Zależności (np. `express`, `mysql2/promise`, `express-rate-limit`).
- **Narzędzia**: Node.js (v22.x), npm, przeglądarka, Azure Portal (interfejs po polsku).

---

## Konfiguracja zasobów

### 1. Grupa zasobów (`klik-grupa`)
- **Utworzenie**: 
  - Azure Portal → „Grupy zasobów” → „Utwórz” → nazwa: `klik-grupa`.
  - **Cel**: Organizacja zasobów w logicznym kontenerze dla łatwego zarządzania i monitorowania.
- **Kontrola dostępu (IAM)**:
  - Ustawienia: „Kontrola dostępu (IAM)” → role: „Właściciel” dla administratora, „Współautor” dla deweloperów, „Czytelnik” dla audytorów.
  - **Cel**: Ograniczenie uprawnień, aby zapobiec przypadkowym zmianom (np. usunięciu zasobów).
- **Tagi**:
  - Ustawienia: „Tagi” → `Środowisko: Produkcja`, `Projekt: MyMemoryMatch`.
  - **Cel**: Ułatwienie identyfikacji zasobów i analizy kosztów.
- **Alerty**:
  - Problem: Brak sygnałów w grupie zasobów (ograniczenie Azure for Students). Alerty skonfigurowano w `my-klik-app` i „klik2-db”.
  - **Cel**: Monitorowanie na poziomie zasobów nadrzędnych (przeniesione do usług).

### 2. App Service (`my-klik-app`)
- **Plan**: 
  - Free (F1) – darmowy, publiczny dostęp, ograniczone zasoby (brak VNet, kopii zapasowych).
  - **Cel**: Minimalizacja kosztów przy hostowaniu aplikacji webowej.
- **HTTPS**:
  - Ustawienia: „Ustawienia TLS/SSL” → „Tylko HTTPS”, „Minimalna wersja TLS: 1.2”.
  - **Cel**: Szyfrowanie ruchu sieciowego, ochrona danych użytkowników (np. logowanie).
- **Zmienne środowiskowe**:
  - Ustawienia: „Konfiguracja” → „Ustawienia aplikacji”:
    - `DB_HOST`: `klik2-db.mysql.database.azure.com`.
    - `DB_USER`: `<db-user>@klik2-db`.
    - `DB_PASSWORD`: `<hasło>`.
    - `DB_NAME`: `myMemoryGame`.
    - `EMAIL_USER`, `EMAIL_PASS`: Dane do wysyłki e-maili.
  - **Cel**: Bezpieczne przechowywanie sekretów poza kodem, eliminacja pliku `.env`.
- **Tożsamość zarządzana**:
  - Ustawienia: „Tożsamość” → „Przypisana przez system: Włączone”.
  - **Cel**: Przygotowanie do bezpiecznego dostępu do bazy bez haseł (wymaga Entra ID, obecnie nieużywane z powodu uwierzytelniania MySQL).
- **Logi**:
  - Ustawienia: „Dzienniki usługi App Service” → „Rejestrowanie aplikacji (system plików)”, poziom „Informacje”, przechowywanie 7 dni.
  - **Cel**: Debugowanie błędów aplikacji (np. crash `server.js`, problemy z Socket.IO).
- **Rate-limiting**:
  - Kod w `server.js` (zgodny z `express-rate-limit` v7):
    - Globalny: 100 żądań/minutę na IP, odpowiedź JSON przy przekroczeniu (HTTP 429).
    - `/auth/register`: 5 prób/15 minut na IP, odpowiedź JSON przy przekroczeniu.
    - Komentarze JSDoc dla dokumentacji.
    - Logowanie przekroczeń limitu z IP i czasem (widoczne w „Strumień dziennika”).
  - **Cel**: Ochrona przed przeciążeniem serwera i atakami (np. DDoS, bruteforce).
- **Alerty**:
  - Ustawienia: „Monitorowanie” → „Alerty” → reguła „BledyHttpMyKlik” dla sygnału „Http Server Errors” (próg: >1, okres: 5 minut).
  - **Cel**: Powiadomienie e-mailem o błędach HTTP 5xx (np. crash serwera).

### 3. Baza danych (`klik2-db`)
- **Zasób**: 
  - Azure Database for MySQL Flexible Server, Standard_B1ms (1 vCPU, 2 GB RAM).
  - **Cel**: Stabilna baza dla małej aplikacji z umiarkowanym ruchem.
- **Firewall**:
  - Ustawienia: „Sieć” → „Reguły zapory”:
    - „Zezwalaj na dostęp publiczny z dowolnej usługi platformy Azure”.
    - IP wychodzące `my-klik-app` (z „Sieć” → „Wychodzące adresy IP”).
    - Lokalne IP klienta (dla developmentu).
  - **Cel**: Ograniczenie dostępu do bazy tylko do autoryzowanych źródeł, minimalizacja ryzyka ataków.
- **Szyfrowanie**:
  - Ustawienia: „Bezpieczeństwo” → „Szyfrowanie danych” → włączone domyślnie.
  - SSL w `dbConfig.js` z `DigiCertGlobalRootCA.crt.pem`.
  - **Cel**: Ochrona danych w spoczynku i w tranzycie.
- **Kopie zapasowe**:
  - Ustawienia: „Kopia zapasowa” → automatyczne, przechowywanie 7 dni.
  - **Cel**: Ochrona przed utratą danych (np. błąd w `INSERT` do `results`).
- **Audyty**:
  - Ustawienia: „Bezpieczeństwo” → „Dzienniki serwera” → włączone.
  - **Cel**: Śledzenie zapytań SQL i prób logowania, wykrywanie podejrzanych działań (np. nieudane logowania).
- **Uwierzytelnianie**:
  - MySQL (brak Entra ID).
  - Silne hasło w `DB_PASSWORD`.
  - **Cel**: Bezpieczny dostęp do bazy przy ograniczeniach planu B1ms.
- **Alerty**:
  - Ustawienia: „Monitorowanie” → „Alerty” → reguła „WysokieCPUKlik2DB” dla „Host CPU Percent” (próg: >80%, okres: 5 minut).
  - **Cel**: Powiadomienie o przeciążeniu bazy (np. nieoptymalne zapytania SQL).

---

## Zabezpieczenia
- **HTTPS i TLS 1.2**: Wymuszone w `my-klik-app` dla szyfrowania ruchu.
  - **Cel**: Ochrona danych użytkowników (np. hasła w `/auth/login`).
- **Firewall w `klik2-db`**: Ograniczenie IP do `my-klik-app` i lokalnego IP.
  - **Cel**: Zapobieganie nieautoryzowanemu dostępowi do bazy.
- **Rate-limiting w `server.js`**: Globalny limit (100 żądań/minutę) i dla `/auth/register` (5 prób/15 minut).
  - **Cel**: Ochrona przed atakami DDoS i bruteforce.
- **Zmienne środowiskowe**: Sekrety w „Ustawienia aplikacji” zamiast `.env`.
  - **Cel**: Minimalizacja ryzyka wycieku haseł.
- **Content-Security-Policy (CSP)**: Nagłówek w `server.js` ograniczający źródła zasobów.
  - **Cel**: Ochrona przed atakami XSS.
- **Logi i audyty**: Włączone w `my-klik-app` i `klik2-db`.
  - **Cel**: Monitorowanie błędów i podejrzanych działań.
- **Tożsamość zarządzana**: Włączona w `my-klik-app`, gotowa na Entra ID.
  - **Cel**: Przygotowanie do bezpiecznego dostępu w przyszłych planach.

---

## CI/CD z GitHub Actions
- **Plik**: `main_my-klik-app.yml`.
- **Sekrety**: GitHub → „Settings” → „Secrets and variables” → „Actions”:
  - `AZUREAPPSERVICE_CLIENTID`, `AZUREAPPSERVICE_TENANTID`, `AZUREAPPSERVICE_SUBSCRIPTIONID`.
  - **Cel**: Bezpieczne uwierzytelnianie podczas deploymentu.
- **Proces**:
  1. Build: Node.js 22.x, `npm install`, `npm run build` (jeśli dotyczy).
  2. Pakowanie: Archiwum ZIP.
  3. Deployment: Wdrożenie do `my-klik-app` przez Azure App Service.
  - **Cel**: Automatyzacja wdrożeń, minimalizacja błędów ręcznych.
- **Zabezpieczenia**:
  - Sekrety przechowywane w GitHub Secrets, brak hardcoded wartości w `main_my-klik-app.yml`.
  - Ograniczone uprawnienia GitHub Actions do deployu.
  - **Cel**: Ochrona poświadczeń i pipeline’u CI/CD.

---

## Monitorowanie i logi
- **my-klik-app**:
  - Logi: „Dzienniki usługi App Service” → „Strumień dziennika” dla `console.log`.
    - **Cel**: Debugowanie (np. błędy w Socket.IO).
  - Alert: „BledyHttpMyKlik” dla „Http Server Errors” (>1 błąd 5xx/5 minut).
    - **Cel**: Powiadomienie o awariach aplikacji.
- **klik2-db**:
  - Audyty: „Dzienniki serwera” dla zapytań SQL i logowań.
    - **Cel**: Wykrywanie problemów (np. nieudane logowania).
  - Alert: „WysokieCPUKlik2DB” dla „Host CPU Percent” (>80%/5 minut).
    - **Cel**: Powiadomienie o przeciążeniu bazy.
- **Koszty**:
  - Monitorowanie w ramach kredytów Azure for Students.
  - Sprawdzaj w „Subskrypcje” → „Koszty” → „Analiza kosztów”.

---

## Odzyskiwanie po awarii
- **my-klik-app**:
  - Brak kopii zapasowych w planie F1.
  - Odzyskiwanie: Ręczne wdrożenie z GitHuba (push kodu).
  - **Cel**: Przywrócenie aplikacji po błędzie (np. błędny deployment).
- **klik2-db**:
  - Kopie zapasowe: „Kopia zapasowa” → przywrócenie z ostatnich 7 dni.
  - **Cel**: Odzyskanie danych po utracie (np. błędne `DELETE`).
- **Zalecenie**:
  - Regularnie testuj kopie zapasowe `klik2-db`.
  - Przechowuj kod w GitHubie jako backup.

---

## Opcje dodatkowe (Premium)
Dostępne w wyższych planach (np. Standard S1, ~50 USD/mies.) lub z większym budżetem:
- **App Service**:
  - **Plan Standard S1**:
    - Kopie zapasowe: „Kopia zapasowa” w `my-klik-app`.
    - VNet Integration: Prywatny dostęp do `klik2-db`.
    - Skalowanie: „Skaluj w poziomie” dla większego ruchu.
    - **Cel**: Większa niezawodność i bezpieczeństwo.
  - **Application Insights**:
    - Zaawansowane monitorowanie (np. czas odpowiedzi, śledzenie użytkowników).
    - **Cel**: Analiza wydajności gry MyMemoryMatch.
  - **Azure Key Vault**:
    - Przechowywanie sekretów (`DB_PASSWORD`, `EMAIL_PASS`).
    - **Cel**: Lepsza ochrona haseł.
- **Baza danych**:
  - **Private Endpoint**:
    - Prywatny dostęp do `klik2-db` przez VNet.
    - **Cel**: Eliminacja publicznego dostępu.
  - **Microsoft Entra ID**:
    - Uwierzytelnianie bez haseł dla `my-klik-app`.
    - **Cel**: Bezpieczniejszy dostęp do bazy.
  - **Defender for Databases**:
    - Wykrywanie zagrożeń (np. SQL injection).
    - **Cel**: Dodatkowa ochrona.
- **Sieć i ochrona**:
  - **Azure Front Door z WAF**:
    - Ochrona przed atakami (XSS, DDoS).
    - **Cel**: Wzmacnianie bezpieczeństwa publicznego dostępu.
  - **Własna domena**:
    - Certyfikat SSL dla `mymemorymatch.com`.
    - **Cel**: Profesjonalny wygląd aplikacji.
- **Koszty**:
  - Standard S1: ~50 USD/mies.
  - Key Vault: ~0.03 USD/10 000 operacji.
  - Private Endpoint: ~0.01 USD/godz.
  - WAF: ~20 USD/mies.
