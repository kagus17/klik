/**
 * @file script.js
 * @description Główny skrypt gry pamięciowej w trybie jedno- i wieloosobowym. Odpowiada za pobieranie tokenu CSRF, zarządzanie dźwiękiem, logiką gry, komunikacją z serwerem przez Socket.IO oraz zapisywaniem wyników.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module GameClient
 * @requires socket.io-client
 */

/**
 * Globalny token CSRF używany do zabezpieczenia żądań HTTP.
 * @type {string}
 */
let csrfToken = '';

/**
 * Pobiera token CSRF z serwera przy starcie aplikacji.
 * @async
 * @function
 * @throws {Error} Jeśli nie uda się pobrać tokenu CSRF.
 */
(async () => {
    try {
        const res = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const data = await res.json();
        csrfToken = data.csrfToken;
    } catch (error) {
        console.error('Błąd podczas pobierania globalnego tokenu CSRF:', error);
    }
})();

/**
 * Klasa zarządzająca dźwiękami w grze.
 * @class
 */
class AudioController {
    /**
     * Inicjalizuje kontroler audio z dźwiękami gry.
     * @constructor
     */
    constructor() {
        /** @type {HTMLAudioElement} Muzyka w tle. */
        this.bgMusic = new Audio('Assets/Audio/ark.mp3');
        /** @type {HTMLAudioElement} Dźwięk odwracania karty. */
        this.flipSound = new Audio('Assets/Audio/flip.wav');
        /** @type {HTMLAudioElement} Dźwięk dopasowania kart. */
        this.matchSound = new Audio('Assets/Audio/match.wav');
        /** @type {HTMLAudioElement} Dźwięk zwycięstwa. */
        this.victorySound = new Audio('Assets/Audio/victory.wav');
        /** @type {HTMLAudioElement} Dźwięk przegranej. */
        this.gameOverSound = new Audio('Assets/Audio/gameOver.wav');
        this.bgMusic.volume = 0.1;
        this.bgMusic.loop = true;
    }
    /** Rozpoczyna odtwarzanie muzyki w tle. */
    startMusic() {
        this.bgMusic.play();
    }

    /** Zatrzymuje muzykę w tle i resetuje jej czas. */
    stopMusic() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    }

    /** Odtwarza dźwięk odwracania karty. */
    flip() {
        this.flipSound.play();
    }

    /** Odtwarza dźwięk dopasowania kart. */
    match() {
        this.matchSound.play();
    }

    /** Odtwarza dźwięk zwycięstwa i zatrzymuje muzykę w tle. */
    victory() {
        this.stopMusic();
        this.victorySound.play();
    }

    /** Odtwarza dźwięk przegranej i zatrzymuje muzykę w tle. */
    gameOver() {
        this.stopMusic();
        this.gameOverSound.play();
    }
}

/**
 * Połączenie Socket.IO z serwerem.
 * @constant {Object}
 */
const socket = io();

/**
 * Klasa zarządzająca logiką gry pamięciowej.
 * @class
 */
class MixOrMatch {
    /**
     * Inicjalizuje grę z podanymi parametrami.
     * @constructor
     * @param {string} difficulty - Poziom trudności ('easy', 'medium', 'hard').
     * @param {number} totalTime - Całkowity czas gry w sekundach.
     * @param {Array<HTMLElement>} cards - Lista elementów HTML kart.
     * @param {string} loggedInUsername - Nazwa zalogowanego użytkownika.
     */
    constructor(difficulty,totalTime, cards, loggedInUsername) {
        /** @type {string} Nazwa zalogowanego użytkownika. */
        this.loggedInUsername = loggedInUsername;
        /** @type {Array<HTMLElement>} Tablica kart w grze. */
        this.cardsArray = cards;
        /** @type {number} Całkowity czas gry w sekundach. */
        this.totalTime = totalTime;
        /** @type {number} Pozostały czas gry w sekundach. */
        this.timeRemaining = totalTime;
        /** @type {HTMLElement} Element wyświetlający pozostały czas. */
        this.timer = document.getElementById('time-remaining');
        /** @type {HTMLElement} Element wyświetlający liczbę odwróceń. */
        this.ticker = document.getElementById('flips');
        /** @type {HTMLElement} Element wyświetlający liczbę odwróceń przeciwnika. */
        this.opponentFlips = document.getElementById('opponent-flips');
        /** @type {HTMLElement} Element wyświetlający nazwę przeciwnika. */
        this.opponentNameDisplay = document.getElementById('opponent-name');
        /** @type {HTMLElement} Element wyświetlający poziom trudności. */
        this.difficultyDisplay = document.getElementById('difficulty-display');
        /** @type {AudioController} Kontroler audio gry. */
        this.audioController = new AudioController();
        /** @type {string|null} Kod pokoju dla gry wieloosobowej. */
        this.roomCode = new URLSearchParams(window.location.search).get('code');
        /** @type {string} Poziom trudności gry. */
        this.difficulty = difficulty || 'easy'; // Ustaw domyślny poziom trudności na 'easy'
        /** @type {boolean} Czy gra jest w trybie wieloosobowym. */
        this.isMultiplayer = !!this.roomCode;
        /** @type {boolean} Czy wyniki gry zostały wyświetlone. */
        this.resultsDisplayed = false; 
        
        /** @type {number} Całkowita liczba kliknięć (odwróceń). */
        this.totalClicks = 0;
        /** @type {HTMLElement|null} Karta do sprawdzenia przy dopasowaniu. */
        this.cardToCheck = null;
        /** @type {Array<HTMLElement>} Lista dopasowanych kart. */
        this.matchedCards = []; // DODAJ TĘ LINIĘ
        /** @type {boolean} Czy gra jest zajęta (np. podczas animacji). */
        this.busy = false;

        if (this.isMultiplayer) {
            // Wyświetl poziom trudności
            const difficultyNamesPL = {
                easy: 'Łatwy',
                medium: 'Średni',
                hard: 'Trudny'
            };
            this.difficultyDisplay.innerText = `Poziom trudności: ${difficultyNamesPL[this.difficulty] || this.difficulty}`;

            socket.on('time-update', ({ timeRemaining }) => {
                this.timeRemaining = timeRemaining;
                this.timer.innerText = this.timeRemaining;

                if (this.timeRemaining <= 0) {
                    this.gameOver();
                }
            });
            // Nasłuchuj nazwy przeciwnika i aktualizacji odwróceń
            socket.on('opponent-info', ({ opponentName }) => {
                this.opponentNameDisplay.innerText = opponentName;
            });
            // Dodaj nasłuchiwanie na zdarzenie 'opponent-clicked'
            socket.on('opponent-clicked', (clicks) => {
                this.opponentFlips.innerText = clicks;
            });
            
            socket.on('game-ended', () => {
            console.log('Gra zakończona. Użytkownik musi kliknąć, aby wrócić do menu.');
            });
            // Dodaj obsługę zdarzenia 'opponent-finished'
        socket.on('opponent-finished', ({ flips, timePlayed, matches }) => {
            console.log('Przeciwnik zakończył grę:', { flips, timePlayed, matches });
            });

            socket.on('your-results', ({ flips, timePlayed, matches, isWinner }) => {
    console.log('Twoje wyniki:', { flips, timePlayed, matches, isWinner });

    // Wyświetl wyniki gracza
    const modal = document.getElementById('results-modal');
    document.getElementById('results-title').innerText = isWinner ? 'Zwycięstwo!' : 'Przegrana';
    document.getElementById('results-flips').innerText = `Liczba odwróceń: ${flips}`;
    document.getElementById('results-time').innerText = `Czas gry: ${timePlayed} sekund`;
    document.getElementById('results-matches').innerText = `Prawidłowe dopasowania: ${matches}`;
    modal.classList.remove('hidden');
    modal.classList.add('visible');
});
socket.on('time-up-results', ({ status }) => {
    // Zaktualizuj nagłówek wyników
    const modal = document.getElementById('results-modal');
    const resultsTitle = document.getElementById('results-title');
    resultsTitle.innerText = status;
    modal.classList.remove('hidden');
    modal.classList.add('visible')
});

             // Dodaj obsługę zdarzenia 'game-results'
        socket.on('game-results', (results) => {
            console.log('Wyniki obu graczy:', results);
            results.forEach(result => {
            const isWinner = result.playerId === socket.id && result.matches === this.cardsArray.length / 2;
            if (result.playerId === socket.id) {
            // Wyświetl wyniki tylko dla aktualnego gracza
            showResultsModal('Ty', result.flips, result.timePlayed, result.matches, isWinner);
            }
            });
            });
        }
    }

     /**
     * Rozpoczyna grę, inicjalizując stan i tasując karty.
     */
    startGame() {
        this.totalClicks = 0;
        this.cardToCheck = null;
        this.matchedCards = [];
        this.busy = true;
        setTimeout(() => {
            this.audioController.startMusic();
            this.shuffleCards(this.cardsArray);
            this.busy = false;
        }, 500)
        this.hideCards();
        this.timer.innerText = this.timeRemaining;
        this.ticker.innerText = this.totalClicks;
    }
    startCountdown() {
        return /*setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;
            if(this.timeRemaining === 0)
                this.gameOver();
        }, 1000);*/
        null
    }

    /**
     * Ukrywa wszystkie karty.
     */
    hideCards() {
        this.cardsArray.forEach(card => {
            card.classList.remove('visible');
            card.classList.remove('matched');
        });
    }
    /**
     * Odwraca kartę i sprawdza dopasowanie.
     * @param {HTMLElement} card - Karta do odwrócenia.
     */
    flipCard(card) {
        if(this.canFlipCard(card)) {
            this.audioController.flip();
            this.totalClicks++;
            this.ticker.innerText = this.totalClicks;
            card.classList.add('visible');

            if (this.isMultiplayer) {
                socket.emit('click', { 
                    roomCode: this.roomCode, 
                    clicks: this.totalClicks 
                });
            }

            if(this.cardToCheck) {
                this.checkForCardMatch(card);
            } else {
                this.cardToCheck = card;
            }
        }
    }

    /**
     * Obsługuje zakończenie gry w przypadku przegranej.
     */
    gameOver() {
    if (this.resultsDisplayed) return; // Jeśli wyniki już zostały wyświetlone, zakończ
    this.resultsDisplayed = true;

    this.audioController.gameOver();
    

    if (this.isMultiplayer) {
        // Wyślij wynik gracza do serwera
        const timePlayed = this.totalTime - this.timeRemaining;
        const matches = this.matchedCards.length / 2;
        const startTime = new Date(Date.now() - timePlayed * 1000).toISOString(); // Oblicz czas rozpoczęcia
        const endTime = new Date().toISOString(); // Czas zakończenia

        socket.emit('player-finished', {
            roomCode: this.roomCode,
            playerId: socket.id,
            flips: this.totalClicks,
            timePlayed,
            matches
        });
        // Wyślij zdarzenie zakończenia gry do serwera
        socket.emit('game-over', {
            roomCode: this.roomCode,
            playerId: socket.id,
            flips: this.totalClicks,
            timePlayed,
            matches
        });
        // Zapisz wynik do bazy danych
    saveResult(
        this.loggedInUsername || 'Gracz', // Nazwa gracza
        this.roomCode || 'Brak kodu',                 // Kod pokoju
        this.totalClicks,                             // Liczba odwróceń
        timePlayed,                                   // Czas gry
        matches,                                      // Liczba dopasowań
        this.difficulty,                              // Poziom trudności
        startTime,                                    // Czas rozpoczęcia
        endTime                                       // Czas zakończenia
    );
    } else {
        document.getElementById('game-over-text').classList.add('visible');
    }
}

    /**
     * Obsługuje zakończenie gry w przypadku zwycięstwa.
     */
    victory() {
        if (this.resultsDisplayed) return; // Jeśli wyniki już zostały wyświetlone, zakończ
        this.resultsDisplayed = true;

        this.audioController.victory();
        
        if (this.isMultiplayer) {
        // Wyślij wynik gracza do serwera
        const timePlayed = this.totalTime - this.timeRemaining;
        const matches = this.matchedCards.length / 2;
        const startTime = new Date(Date.now() - timePlayed * 1000).toISOString(); // Oblicz czas rozpoczęcia
        const endTime = new Date().toISOString(); // Czas zakończenia
        socket.emit('player-finished', {
            roomCode: this.roomCode,
            playerId: socket.id,
            flips: this.totalClicks,
            timePlayed,
            matches
        });
        // Zapisz wynik do bazy danych
    saveResult(
        this.loggedInUsername || 'Gracz', // Nazwa gracza
        this.roomCode || 'Brak kodu',                 // Kod pokoju
        this.totalClicks,                             // Liczba odwróceń
        timePlayed,                                   // Czas gry
        matches,                                      // Liczba dopasowań
        this.difficulty,                              // Poziom trudności
        startTime,                                    // Czas rozpoczęcia
        endTime                                       // Czas zakończenia
    );
    } else {
        document.getElementById('victory-text').classList.add('visible');
    }
    }

    /**
     * Sprawdza, czy dwie karty są dopasowane.
     * @param {HTMLElement} card - Druga karta do sprawdzenia.
     */
    checkForCardMatch(card) {
        if(this.getCardType(card) === this.getCardType(this.cardToCheck))
            this.cardMatch(card, this.cardToCheck);
        else 
            this.cardMismatch(card, this.cardToCheck);

        this.cardToCheck = null;
    }
    /**
     * Obsługuje dopasowanie dwóch kart.
     * @param {HTMLElement} card1 - Pierwsza karta.
     * @param {HTMLElement} card2 - Druga karta.
     */
    cardMatch(card1, card2) {
        if (!this.cardsArray || this.cardsArray.length === 0) {
            console.error('cardsArray is not initialized or empty.');
            return;
        }

        this.matchedCards.push(card1);
        this.matchedCards.push(card2);
        card1.classList.add('matched');
        card2.classList.add('matched');
        this.audioController.match();
        if(this.matchedCards.length === this.cardsArray.length)
            this.victory();
    }
    /**
     * Obsługuje niedopasowanie dwóch kart.
     * @param {HTMLElement} card1 - Pierwsza karta.
     * @param {HTMLElement} card2 - Druga karta.
     */
    cardMismatch(card1, card2) {
        this.busy = true;
        setTimeout(() => {
            card1.classList.remove('visible');
            card2.classList.remove('visible');
            this.busy = false;
        }, 1000);
    }
    /**
     * Tasuje karty za pomocą algorytmu Fisher-Yates.
     * @param {Array<HTMLElement>} cardsArray - Tablica kart do potasowania.
     */
    shuffleCards(cardsArray) { // Fisher-Yates Shuffle Algorithm.
        for (let i = cardsArray.length - 1; i > 0; i--) {
            let randIndex = Math.floor(Math.random() * (i + 1));
            cardsArray[randIndex].style.order = i;
            cardsArray[i].style.order = randIndex;
        }
    }
    /**
     * Pobiera typ karty na podstawie źródła obrazka.
     * @param {HTMLElement} card - Karta do sprawdzenia.
     * @returns {string} Źródło obrazka karty.
     */
    getCardType(card) {
        return card.getElementsByClassName('card-value')[0].src;
    }
    /**
     * Sprawdza, czy karta może być odwrócona.
     * @param {HTMLElement} card - Karta do sprawdzenia.
     * @returns {boolean} Czy karta może być odwrócona.
     */
    canFlipCard(card) {
        return !this.busy && !this.matchedCards.includes(card) && card !== this.cardToCheck;
    }
}

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

/**
 * Wyświetla modal z wynikami gry.
 * @param {string} playerName - Nazwa gracza.
 * @param {number} flips - Liczba odwróceń.
 * @param {number} timePlayed - Czas gry w sekundach.
 * @param {number} matches - Liczba dopasowań.
 * @param {boolean} isWinner - Czy gracz wygrał.
 */
function showResultsModal(playerName, flips, timePlayed, matches, isWinner) {
    // Pobierz istniejący modal
    const modal = document.getElementById('results-modal');

    // Wypełnij dane w modalu
    document.getElementById('results-title').innerText = isWinner ? 'Zwycięstwo!' : 'Przegrana';
    document.getElementById('results-flips').innerText = `Liczba odwróceń: ${flips}`;
    document.getElementById('results-time').innerText = `Czas gry: ${timePlayed} sekund`;
    document.getElementById('results-matches').innerText = `Prawidłowe dopasowania: ${matches}`;

    // Wyświetl modal na pełnym ekranie
    modal.classList.remove('hidden');
    modal.classList.add('visible');
}

/**
 * Zapisuje wyniki gry na serwerze.
 * @param {string} playerName - Nazwa gracza.
 * @param {string} roomCode - Kod pokoju.
 * @param {number} flips - Liczba odwróceń.
 * @param {number} timePlayed - Czas gry w sekundach.
 * @param {number} matches - Liczba dopasowań.
 * @param {string} difficulty - Poziom trudności.
 * @param {string} startTime - Czas rozpoczęcia (ISO).
 * @param {string} endTime - Czas zakończenia (ISO).
 */
function saveResult(playerName, roomCode, flips, timePlayed, matches, difficulty, startTime, endTime) {
    fetch('/game/save-result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
        },
        credentials: 'same-origin',
        body: JSON.stringify({ playerName, roomCode, flips, timePlayed, matches, difficulty, startTime, endTime })
    }).then(res => res.json())
      .then(data => {
          if (data.success) console.log('Wynik zapisany!');
          else console.error('Błąd zapisu wyniku:', data.error);
      });
}

/**
 * Oblicza wynik gry na podstawie czasu i dopasowań.
 * @param {number} timePlayed - Czas gry w sekundach.
 * @param {number} matches - Liczba dopasowań.
 * @returns {number} Wynik gry.
 */
function calculateScore(timePlayed, matches) {
    return matches * 100 - timePlayed * 2; // Każde dopasowanie daje 100 punktów, czas odejmuje 2 punkty za sekundę
}

/**
 * Inicjalizuje grę po załadowaniu strony.
 * @async
 */
async function ready() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('code');
    const difficulty = urlParams.get('difficulty'); // Pobierz poziom trudności z URL
    const waitingOverlay = document.getElementById('waiting-overlay');
    const roomCodeDisplay = document.getElementById('room-code-display')
    const waitingMessage = document.getElementById('waiting-message');
    const opponentInfo = document.getElementById('opponent-info');
    const cardContainer = document.getElementById('game-container');
    
    if (roomCode) {
        let loggedInUsername = 'Gracz'; // Domyślna wartość
        
     try {
            // Użyj istniejącego globalnego csrfToken lub pobierz go, jeśli jest to konieczne, ale generalnie wystarczy globalny
            // Upewnij się, że globalny csrfToken został pobrany przed wykonaniem tego bloku
            
            const sessionCheckRes = await fetch('/session/check', {
                method: 'GET', // Zmieniono na GET, aby pasowało do serwera
                headers: {
                    // Content-Type nie jest potrzebny dla GET bez body
                    'CSRF-Token': csrfToken // Użyj globalnego csrfToken
                },
                credentials: 'same-origin'
                // Usunięto body, ponieważ GET nie powinno mieć body
            });
            const sessionData = await sessionCheckRes.json();
            console.log('Użytkownik jest zalogowany:', sessionData.loggedIn);
            if (sessionData.loggedIn) {
                loggedInUsername = sessionData.username;
            }
        } catch (error) {
            console.error('Błąd podczas sprawdzania sesji użytkownika:', error);
        }

        const difficultyNamesPL = {
            easy: 'Łatwy',
            medium: 'Średni',
            hard: 'Trudny'
        };
        // Wyświetl kod pokoju i poziom trudności
        roomCodeDisplay.textContent = `Kod pokoju: ${roomCode} | Poziom trudności: ${difficultyNamesPL[difficulty] || difficulty}`;
        
        // Wyślij dane do serwera
        socket.emit('join-room', { roomCode, difficulty });

        socket.on('room-created', ({ roomCode, difficulty }) => {
            const difficultyNamesPL = {
            easy: 'Łatwy',
            medium: 'Średni',
            hard: 'Trudny'
        };
        // Wyświetl kod pokoju i poziom trudności
        roomCodeDisplay.textContent = `Kod pokoju: ${roomCode} | Poziom trudności: ${difficultyNamesPL[difficulty] || difficulty}`;
        });
        
        socket.on('game-start', ({ difficulty }) => {
            waitingOverlay.classList.remove('visible');
            opponentInfo.style.display = 'block';

            // Generowanie kart na podstawie poziomu trudności
    const cardImages = [
        'klawiatura.png', 'kamera.png', 'router.png',
        'drukarka.png', 'napedoptyczny.png', 'monitor.png',
        'myszka.png', 'projektor.png', 'laptop.png', 'pendrive.png',
        'glosnik.png', 'mikrofon.png'
    ];
    const cardPairsCount = {
        easy: 3,
        medium: 6,
        hard: 12
    }[difficulty];

    const card_columns = document.getElementById('game-container');
    let columns = 4;

    if (cardPairsCount === 3) columns = 3;
    else if (cardPairsCount === 6) columns = 4;
    else if (cardPairsCount === 12) columns = 6;
    
    cardContainer.style.display = 'grid';
    cardContainer.style.gridGap = '20px';
    cardContainer.style.gridTemplateColumns = `repeat(${columns}, auto)`;

    const selected = cardImages.slice(0, cardPairsCount);
    const allImages = [...selected, ...selected];

    // Tasowanie kart
    for (let i = allImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allImages[i], allImages[j]] = [allImages[j], allImages[i]];
    }

    // Generowanie kart w HTML
    cardContainer.innerHTML = '';
    allImages.forEach(image => {
        const cardHTML = `
        <div class="card">
            <div class="card-back card-face">
            </div>
            <div class="card-front card-face">
                <img class="card-value" src="Assets/Images/${image}">
            </div>
        </div>`;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
    
        let cardsMulti = Array.from(document.getElementsByClassName('card'));
        if (!cardsMulti || cardsMulti.length === 0) {
            console.error('No cards found for multiplayer in the DOM.');
            return;
        }
        console.log('CardsMulti:', cardsMulti);

            // Rozpocznij grę z odpowiednim poziomem trudności
            const game = new MixOrMatch(difficulty,100, cardsMulti, loggedInUsername);
            game.startGame();

            // Dodaj nasłuchiwanie na kliknięcia kart
            cardsMulti.forEach(card => {
            card.addEventListener('click', () => {
                game.flipCard(card);
                });
            });
        });

        socket.on('kicked', () => {
  alert('Nie możesz wrócić do tej gry po odświeżeniu strony.');
  window.location.href = '/menu.html';
});

        socket.on('opponent-disconnected', () => {
    const notification = document.getElementById('notification');
    notification.textContent = 'Przeciwnik opuścił grę.';
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000); // Powiadomienie znika po 5 sekundach
});
    }
    /*let overlays = Array.from(document.getElementsByClassName('overlay-text'));
    let cards = Array.from(document.getElementsByClassName('card'));
    let game = new MixOrMatch(100, cards);

    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            game.startGame();
        });
    });

    cards.forEach(card => {
        card.addEventListener('click', () => {
            game.flipCard(card);
        });
    });*/
}