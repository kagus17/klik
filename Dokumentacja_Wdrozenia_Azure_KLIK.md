# Dokumentacja Wdrożenia aplikacji KLIK do Azure

## 1. Wprowadzenie

### 1.1. Cel Dokumentu
Niniejszy dokument opisuje proces wdrożenia aplikacji "KLIK" na platformę Microsoft Azure. Zawiera szczegółowe informacje dotyczące wymaganych zasobów Azure, kroków konfiguracyjnych oraz procesu wdrażania aplikacji.

### 1.2. Opis Aplikacji
KLIK to gra multiplayer typu "memory" (dopasowywanie kart) dla dwóch graczy (1v1), działająca w czasie rzeczywistym. Została zbudowana przy użyciu Node.js, frameworka Express.js oraz biblioteki Socket.IO do komunikacji real-time. Dane aplikacji, takie jak profile użytkowników, wyniki gier i historia rozgrywek, przechowywane są w bazie danych Azure Database for MySQL Flexible Server.

### 1.3. Architektura Ogólna na Azure
Aplikacja hostowana jest w usłudze Azure App Service (Web App for Containers/Linux) z wykorzystaniem Node.js. Baza danych Azure Database for MySQL przechowuje dane. Monitorowanie i logowanie realizowane jest przez Application Insights oraz Azure Monitor. Wdrożenie infrastruktury opiera się na szablonie ARM (Azure Resource Manager).

## 2. Zasoby Azure
Infrastruktura aplikacji KLIK w Azure jest definiowana za pomocą szablonu ARM (`template.json`). Główne zasoby to:

* **Grupa Zasobów:** Zaleca się utworzenie dedykowanej grupy zasobów (np. `klik-grupa`, jak sugerowano w powiązanym dokumencie PDF) w celu logicznego zgrupowania wszystkich zasobów aplikacji. Szablon ARM zakłada istnienie takiej grupy.
* **App Service (Web App):**
    * **Nazwa:** Konfigurowalna przez parametr `sites_my_klik_app_name` (domyślnie: `my-klik-app`).
    * **Plan App Service:** Konfigurowalny przez parametr `serverfarms_ASP_klikgrupa_b240_name` (domyślnie: `ASP-klikgrupa-b240`).
        * **SKU:** `Standard S1` (zgodnie z `template.json`).
        * **System operacyjny:** Linux.
        * **Stos środowiska uruchomieniowego:** Node.js (zalecana wersja LTS, np. 18.x, 20.x, zgodna z `package.json`).
    * **Przeznaczenie:** Hostowanie aplikacji backendowej Node.js oraz serwowanie plików statycznych frontendowych.
* **Azure Database for MySQL flexible server:**
    * **Nazwa:** Konfigurowalna przez parametr `flexibleServers_klik2_db_name` (domyślnie: `klik2-db`).
    * **Przeznaczenie:** Przechowywanie danych aplikacji, w tym informacji o użytkownikach, wynikach gier, historii.
    * **Wersja MySQL:** `8.0.35` (zgodnie z `template.json`).
    * **Dostęp publiczny:** `Enabled`. Szablon ARM konfiguruje regułę firewalla o nazwie `allow_azure` z zakresem IP `0.0.0.0` - `0.0.0.0`, co umożliwia dostęp usługom Azure.
* **Application Insights:**
    * **Nazwa:** Konfigurowalna przez parametr `components_my_klik_app_name` (domyślnie: `my-klik-app`).
    * **Przeznaczenie:** Zaawansowane monitorowanie wydajności aplikacji (APM), śledzenie błędów, analiza telemetryczna zachowań użytkowników.
* **Log Analytics Workspace:**
    * **Nazwa:** Generowana dynamicznie na podstawie parametru `workspaces_DefaultWorkspace_..._name`.
    * **Przeznaczenie:** Centralne miejsce gromadzenia logów i danych telemetrycznych z różnych zasobów Azure, w tym z Application Insights.
* **User Assigned Managed Identity:**
    * **Nazwa:** Konfigurowalna przez parametr `userAssignedIdentities_my_klik_app_id_a99e_name`.
    * **Przeznaczenie:** Zapewnienie tożsamości dla aplikacji KLIK, umożliwiając jej bezpieczny dostęp do innych zasobów Azure (np. Azure Key Vault) bez potrzeby przechowywania poświadczeń w kodzie aplikacji lub konfiguracji.
* **Alerty Metryk (Metric Alerts):**
    * `BledyHttpMyKlik` (parametr `metricAlerts_BledyHttpMyKlik_name`): Monitoruje błędy HTTP 5xx w App Service.
    * `WysokieCPUKlik2DB` (parametr `metricAlerts_WysokieCPUKlik2DB_name`): Monitoruje wysokie (>80%) użycie CPU przez serwer MySQL.
    * `Duzo_polaczen_z_baza_name` (parametr `metricAlerts_Duzo_polaczen_z_baza_name`): Monitoruje dużą liczbę (>100) aktywnych połączeń z bazą danych.
* **Grupy Akcji (Action Groups):**
    * `PowiadomienieBledyHttp_name`, `PowiadomienieWysokieCPU_name`, `Application_Insights_Smart_Detection_name`: Definiują akcje (np. wysłanie e-maila na zdefiniowany adres) podejmowane w odpowiedzi na wyzwolenie alertów.

## 3. Wymagania Wstępne
Przed rozpoczęciem wdrożenia upewnij się, że posiadasz:
* Aktywną subskrypcję Microsoft Azure.
* Zainstalowane narzędzie Azure CLI ([Instrukcja instalacji](https://docs.microsoft.com/cli/azure/install-azure-cli)).
* Zainstalowany Node.js i npm ([Pobierz Node.js](https://nodejs.org/)) – do ewentualnego lokalnego budowania i testowania.
* Zainstalowanego klienta Git ([Pobierz Git](https://git-scm.com/downloads)).

## 4. Kroki Wdrożenia Infrastruktury (IaC)

1.  **Logowanie do Azure:**
    Otwórz terminal lub wiersz poleceń i zaloguj się do swojego konta Azure:
    ```bash
    az login
    ```
    Postępuj zgodnie z instrukcjami wyświetlanymi w przeglądarce.

2.  **Ustawienie Domyślnej Subskrypcji (jeśli masz ich wiele):**
    ```bash
    az account set --subscription "<Nazwa_Lub_ID_Subskrypcji>"
    ```

3.  **Tworzenie Grupy Zasobów:**
    Jeśli grupa zasobów (np. `klik-grupa`) jeszcze nie istnieje, utwórz ją:
    ```bash
    az group create --name "klik-grupa" --location "centralus"
    ```
    (Zaleca się użycie regionu `centralus` zgodnie z definicjami w `template.json` dla niektórych zasobów, lub dostosowanie regionu).

4.  **Wdrożenie Szablonu ARM:**
    Przejdź do katalogu zawierającego pliki `template.json` i `parameters.json`. Następnie wykonaj polecenie:
    ```bash
    az deployment group create \
        --resource-group "klik-grupa" \
        --template-file "template.json" \
        --parameters "parameters.json" \
        --parameters sites_my_klik_app_name="my-klik-app" \
                     flexibleServers_klik2_db_name="klik2-db" \
                     # Dodaj inne parametry, jeśli wartości domyślne z template.json nie są odpowiednie
                     # lub jeśli plik parameters.json nie zawiera wszystkich wymaganych wartości.
    ```
    Pamiętaj, że `parameters.json` w dostarczonej formie ma wartości `null`, co oznacza, że zostaną użyte wartości domyślne z `template.json`. Jeśli chcesz je nadpisać, zmodyfikuj `parameters.json` lub podaj je bezpośrednio w poleceniu.

## 5. Wdrożenie Aplikacji

### 5.1. Przygotowanie Kodu Aplikacji
1.  **Sklonuj Repozytorium:**
    ```bash
    git clone <URL_twojego_repozytorium_git>
    cd <nazwa_katalogu_repozytorium>
    ```
2.  **Instalacja Zależności:**
    ```bash
    npm install
    ```
3.  **Certyfikat SSL dla Bazy Danych:**
    Upewnij się, że plik certyfikatu `DigiCertGlobalRootCA.crt.pem` znajduje się w katalogu `certs/` (względnie do głównego katalogu projektu, zgodnie ze ścieżką `path.join(__dirname, 'certs', 'DigiCertGlobalRootCA.crt.pem')` w `dbConfig.js`). Katalog `certs` wraz z plikiem musi być wdrożony razem z aplikacją.

### 5.2. Konfiguracja Aplikacji w Azure App Service
Po pomyślnym wdrożeniu infrastruktury, skonfiguruj zmienne środowiskowe dla Twojej aplikacji App Service:

1.  Przejdź do Azure Portal (<https://portal.azure.com>).
2.  Odszukaj i wybierz swoją usługę App Service (np. `my-klik-app`).
3.  W menu po lewej stronie wybierz "Konfiguracja" (w sekcji "Ustawienia").
4.  Przejdź do zakładki "Ustawienia aplikacji".
5.  Dodaj następujące ustawienia aplikacji (zmienne środowiskowe). Pamiętaj, aby wartości oznaczone jako `<...>` zastąpić rzeczywistymi danymi:

    * `DB_HOST`: `klik2-db.mysql.database.azure.com` (lub nazwa Twojego serwera MySQL)
    * `DB_USER`: `<nazwa_użytkownika_admina_bazy_danych>@klik2-db` (np. `adminuser@klik2-db` - nazwa użytkownika podana podczas tworzenia serwera MySQL)
    * `DB_PASSWORD`: `<hasło_admina_bazy_danych>` (hasło podane podczas tworzenia serwera MySQL)
    * `DB_NAME`: `gra1v1`
    * `SESSION_SECRET`: `<wygenerowany_silny_losowy_ciąg_znaków>` (np. użyj generatora haseł)
    * `CSRF_SECRET`: `<wygenerowany_silny_losowy_ciąg_znaków>` (jw., używany przez `csurf`)
    * `EMAIL_USER`: `kliktester78@gmail.com` (Twój adres email do wysyłki)
    * `EMAIL_PASS`: `<hasło_aplikacji_gmail>` (Wygenerowane hasło aplikacji dla Gmaila)
    * `NODE_ENV`: `production` (Bardzo ważne dla włączenia optymalizacji i funkcji bezpieczeństwa, np. `secure cookies`)
    * `WEBSITE_NODE_DEFAULT_VERSION`: `~18` lub `~20` (aby określić wersję Node.js, jeśli jest inna niż domyślna w App Service)
    * `APPINSIGHTS_INSTRUMENTATIONKEY`: (Ta wartość jest zazwyczaj ustawiana automatycznie po połączeniu App Service z Application Insights przez ARM template. Jeśli nie, skopiuj klucz instrumentacji z zasobu Application Insights).

6.  Zapisz zmiany. Restart aplikacji może być wymagany.

### 5.3. Metody Wdrożenia Kodu Aplikacji
Możesz wdrożyć kod aplikacji do Azure App Service na kilka sposobów:

* **Zip Deploy (zalecane dla Node.js):**
    Spakuj zawartość katalogu aplikacji (bez katalogu `node_modules`, ale z `package.json`, `package-lock.json` i katalogiem `certs`) do pliku ZIP. Następnie użyj Azure CLI:
    ```bash
    az webapp deployment source config-zip \
        --resource-group "klik-grupa" \
        --name "my-klik-app" \
        --src "ścieżka/do/twojego/pliku.zip"
    ```
    App Service automatycznie uruchomi `npm install --production` na serwerze.

* **GitHub Actions (rekomendowane dla CI/CD):**
    Skonfiguruj przepływ pracy GitHub Actions do automatycznego budowania i wdrażania aplikacji po każdej zmianie w repozytorium. Azure Portal oferuje łatwą integrację z GitHub (Centrum Wdrożeń w App Service).

* **Local Git:**
    Skonfiguruj lokalne repozytorium Git do wypychania zmian bezpośrednio do App Service.

* **Inne metody:** Docker Hub, ACR, FTP/S (mniej zalecane dla aplikacji Node.js).

### 5.4. Uruchomienie Aplikacji
Azure App Service (dla Node.js) domyślnie próbuje uruchomić aplikację za pomocą polecenia zdefiniowanego w `scripts.start` w pliku `package.json` (w tym przypadku `node server.js`).

## 6. Konfiguracja Po Wdrożeniu

1.  **Weryfikacja Działania:**
    Otwórz adres URL swojej aplikacji (np. `https://my-klik-app.azurewebsites.net`) w przeglądarce i przetestuj wszystkie kluczowe funkcjonalności:
    * Rejestracja nowego użytkownika.
    * Logowanie.
    * Tworzenie/dołączanie do pokoju gry.
    * Przebieg rozgrywki.
    * Zapis wyników.
    * Odzyskiwanie hasła.

2.  **Sprawdzenie Logów:**
    * **Application Insights:** Przejdź do zasobu Application Insights w Azure Portal, aby przeglądać telemetrię, błędy i logi wydajności.
    * **Log Stream (Strumień dzienników) w App Service:** Monitoruj logi aplikacji w czasie rzeczywistym bezpośrednio z portalu Azure.

## 7. Dostęp do Bazy Danych
* Serwer Azure Database for MySQL Flexible Server (`klik2-db`) jest skonfigurowany z opcją `publicNetworkAccess: "Enabled"`.
* Reguła firewalla `allow_azure` (z zakresem `0.0.0.0` do `0.0.0.0`) zezwala na połączenia z innych usług Azure, w tym z Twojej App Service.
* Aby uzyskać dostęp do bazy danych z lokalnego komputera (np. za pomocą MySQL Workbench):
    1.  Przejdź do zasobu `klik2-db` w Azure Portal.
    2.  W sekcji "Sieć", dodaj nową regułę firewalla, podając publiczny adres IP swojego komputera.

## 8. Skalowanie Aplikacji

* **App Service:** Plan `Standard S1` umożliwia:
    * **Skalowanie w górę (Scale-up):** Zmiana na wyższy plan taryfowy (więcej CPU, RAM).
    * **Skalowanie w poziomie (Scale-out):** Zwiększenie liczby instancji aplikacji.
* **Azure Database for MySQL:** Możliwość skalowania zasobów (vCores, pojemność dyskowa, IOPS) w zależności od potrzeb.