# KLIK - Gra Multiplayer 1v1 Online

KLIK to dynamiczna gra multiplayer typu "memory" (dopasowywanie kart) przeznaczona dla dwóch graczy (1v1), działająca w czasie rzeczywistym. Aplikacja umożliwia rywalizację online, śledzenie wyników, przeglądanie historii gier oraz ranking najlepszych graczy. Posiada system rejestracji i logowania użytkowników z możliwością odzyskiwania hasła.

## Funkcjonalności

* **System Użytkowników:**
    * Rejestracja nowych kont.
    * Logowanie do istniejących kont.
    * Bezpieczne przechowywanie haseł (hashowanie bcrypt).
    * Mechanizm odzyskiwania hasła poprzez e-mail.
* **Rozgrywka Multiplayer:**
    * Tworzenie prywatnych pokoi gier z wyborem poziomu trudności (łatwy, średni, trudny).
    * Dołączanie do istniejących pokoi za pomocą unikalnego kodu.
    * Rozgrywka w czasie rzeczywistym z wykorzystaniem technologii Socket.IO.
    * Interaktywne odwracanie kart i dopasowywanie par.
    * Śledzenie liczby odwróceń i czasu gry.
* **Wyniki i Statystyki:**
    * Automatyczny zapis wyników po zakończeniu każdej gry.
    * Wyświetlanie wyników na koniec rozgrywki.
    * Ranking najlepszych graczy (Leaderboard) z punktacją opartą na wynikach.
    * Dostęp do historii własnych gier z informacjami o przeciwnikach i wynikach.

## Technologie

* **Backend:**
    * Node.js
    * Express.js (framework webowy)
    * Socket.IO (komunikacja w czasie rzeczywistym)
* **Frontend:**
    * HTML5
    * CSS3
    * JavaScript (Vanilla JS, Socket.IO Client)
* **Baza Danych:**
    * Azure Database for MySQL Flexible Server
* **Platforma Hostingowa:**
    * Microsoft Azure (App Service for Linux)
* **Bezpieczeństwo:**
    * `bcrypt`: Hashowanie haseł.
    * `csurf`: Ochrona przed atakami CSRF.
    * `express-rate-limit`: Ograniczanie liczby żądań (ochrona przed atakami siłowymi).
    * `express-session`: Zarządzanie sesjami użytkowników.
    * SSL/TLS: Szyfrowanie komunikacji (HTTPS i połączenie z bazą danych).
    * Content Security Policy (CSP).
* **Inne:**
    * `nodemailer`: Wysyłanie e-maili (np. dla resetowania hasła).
    * `dotenv`: Zarządzanie zmiennymi środowiskowymi w środowisku deweloperskim.

## Struktura Projektu
.
├── certs/
│   └── DigiCertGlobalRootCA.crt.pem  # Certyfikat CA dla połączenia SSL z Azure MySQL
├── public/                           # Pliki statyczne serwowane przez Express
│   ├── Assets/                       # Zasoby (np. audio, obrazki - jeśli używane)
│   ├── *.html                        # Pliki HTML (index.html, menu.html, game2.html, etc.)
│   ├── *.css                         # Style CSS
│   ├── *.js                          # Skrypty JavaScript po stronie klienta
│   └── logo.png
├── db.js                             # Konfiguracja połączenia z bazą danych (pulą połączeń)
├── dbConfig.js                       # Parametry konfiguracyjne bazy danych (ładowane z .env)
├── package.json                      # Definicje projektu i zależności npm
├── package-lock.json                 # Zablokowane wersje zależności
├── server.js                         # Główny plik serwera aplikacji
├── template.json                     # Szablon ARM do wdrożenia infrastruktury Azure
├── parameters.json                   # Parametry dla szablonu ARM
└── README.md                         # Ten plik (README_KLIK.md)
*(Uwaga: Struktura katalogu `public/` może się różnić w zależności od faktycznej organizacji plików frontendowych. Powyżej przedstawiono ogólny zarys.)*

## Uruchomienie Lokalne (Development)

1.  **Wymagania:**
    * Node.js (zalecana wersja LTS) i npm.
    * Działająca lokalna lub zdalna instancja serwera MySQL.
    * Klient Git.
2.  **Klonowanie Repozytorium:**
    ```bash
    git clone <URL_repozytorium>
    cd <nazwa_katalogu_projektu>
    ```
3.  **Instalacja Zależności:**
    ```bash
    npm install
    ```
4.  **Konfiguracja Bazy Danych MySQL:**
    * Utwórz bazę danych (np. `gra1v1`).
    * Upewnij się, że masz użytkownika z odpowiednimi uprawnieniami do tej bazy.
    * W projekcie mogą znajdować się skrypty SQL do utworzenia tabel (jeśli nie, trzeba je utworzyć ręcznie na podstawie logiki aplikacji w `server.js`).
5.  **Utworzenie Pliku `.env`:**
    W głównym katalogu projektu utwórz plik `.env` i uzupełnij go wymaganymi zmiennymi środowiskowymi:
    ```env
    DB_HOST=localhost # lub adres twojego serwera MySQL
    DB_USER=root      # lub twój użytkownik MySQL
    DB_PASSWORD=twoje_haslo_mysql
    DB_NAME=gra1v1
    SESSION_SECRET=bardzo_tajny_sekret_sesji_lokalnej
    CSRF_SECRET=inny_bardzo_tajny_sekret_csrf_lokalny
    EMAIL_USER=twoj_email_gmail_do_testow@gmail.com
    EMAIL_PASS=twoje_haslo_aplikacji_gmail_do_testow
    NODE_ENV=development

    # Uwaga: Dla lokalnego MySQL bez SSL, możesz potrzebować zmodyfikować dbConfig.js,
    # aby nie wymagał SSL lub dostarczyć odpowiednie certyfikaty.
    # W przypadku Azure MySQL, SSL jest wymagany.
    ```
6.  **Uruchomienie Aplikacji:**
    ```bash
    npm start
    ```
    Aplikacja powinna być dostępna pod adresem `http://localhost:3000` (lub innym portem, jeśli zdefiniowano inaczej w `server.js` lub zmiennych środowiskowych `process.env.PORT`).

## Autorzy

* KL
* MF
* DA
* ŁW

*(Na podstawie komentarza w `server.js`)*

## Data

* Maj 2025

*(Na podstawie komentarza w `server.js`)*
