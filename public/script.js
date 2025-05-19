class AudioController {
    constructor() {
        this.bgMusic = new Audio('Assets/Audio/ark.mp3');
        this.flipSound = new Audio('Assets/Audio/flip.wav');
        this.matchSound = new Audio('Assets/Audio/match.wav');
        this.victorySound = new Audio('Assets/Audio/victory.wav');
        this.gameOverSound = new Audio('Assets/Audio/gameOver.wav');
        this.bgMusic.volume = 0.1;
        this.bgMusic.loop = true;
    }
    startMusic() {
        this.bgMusic.play();
    }
    stopMusic() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
    }
    flip() {
        this.flipSound.play();
    }
    match() {
        this.matchSound.play();
    }
    victory() {
        this.stopMusic();
        this.victorySound.play();
    }
    gameOver() {
        this.stopMusic();
        this.gameOverSound.play();
    }
}

const socket = io();

class MixOrMatch {
    constructor(difficulty,totalTime, cards, loggedInUsername) {
        this.loggedInUsername = loggedInUsername;
        this.cardsArray = cards;
        this.totalTime = totalTime;
        this.timeRemaining = totalTime;
        this.timer = document.getElementById('time-remaining');
        this.ticker = document.getElementById('flips');
        this.opponentFlips = document.getElementById('opponent-flips');
        this.opponentNameDisplay = document.getElementById('opponent-name');
        this.difficultyDisplay = document.getElementById('difficulty-display');
        this.audioController = new AudioController();
        this.roomCode = new URLSearchParams(window.location.search).get('code');
        this.difficulty = difficulty || 'easy'; // Ustaw domyślny poziom trudności na 'easy'
        this.isMultiplayer = !!this.roomCode;
        this.resultsDisplayed = false; 
        
        // Inicjalizuj wszystkie wymagane właściwości
        this.totalClicks = 0;
        this.cardToCheck = null;
        this.matchedCards = []; // DODAJ TĘ LINIĘ
        this.busy = false;

        if (this.isMultiplayer) {
            // Wyświetl poziom trudności
            this.difficultyDisplay.innerText = `Poziom trudności: ${this.difficulty}`;

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
    modal.classList.add('visible');
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
    /*gameOver() {
        clearInterval(this.countdown);
        this.audioController.gameOver();
        document.getElementById('game-over-text').classList.add('visible');
    }
    victory() {
        clearInterval(this.countdown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible');
    }*/
    hideCards() {
        this.cardsArray.forEach(card => {
            card.classList.remove('visible');
            card.classList.remove('matched');
        });
    }
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


    checkForCardMatch(card) {
        if(this.getCardType(card) === this.getCardType(this.cardToCheck))
            this.cardMatch(card, this.cardToCheck);
        else 
            this.cardMismatch(card, this.cardToCheck);

        this.cardToCheck = null;
    }
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
    cardMismatch(card1, card2) {
        this.busy = true;
        setTimeout(() => {
            card1.classList.remove('visible');
            card2.classList.remove('visible');
            this.busy = false;
        }, 1000);
    }
    shuffleCards(cardsArray) { // Fisher-Yates Shuffle Algorithm.
        for (let i = cardsArray.length - 1; i > 0; i--) {
            let randIndex = Math.floor(Math.random() * (i + 1));
            cardsArray[randIndex].style.order = i;
            cardsArray[i].style.order = randIndex;
        }
    }
    getCardType(card) {
        return card.getElementsByClassName('card-value')[0].src;
    }
    canFlipCard(card) {
        return !this.busy && !this.matchedCards.includes(card) && card !== this.cardToCheck;
    }
}

if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

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

function saveResult(playerName, roomCode, flips, timePlayed, matches, difficulty, startTime, endTime) {
    fetch('/game/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode, flips, timePlayed, matches, difficulty, startTime, endTime })
    }).then(res => res.json())
      .then(data => {
          if (data.success) console.log('Wynik zapisany!');
          else console.error('Błąd zapisu wyniku:', data.error);
      });
}

function calculateScore(timePlayed, matches) {
    return matches * 100 - timePlayed * 2; // Każde dopasowanie daje 100 punktów, czas odejmuje 2 punkty za sekundę
}

function ready() {
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

        fetch('/session/check')
            .then(res => res.json())
            .then(data => {
            if (data.loggedIn) {
                loggedInUsername = data.username;
            }
        });

        // Wyświetl kod pokoju i poziom trudności
        roomCodeDisplay.textContent = `Kod pokoju: ${roomCode} | Poziom trudności: ${difficulty}`;
        
        // Wyślij dane do serwera
        socket.emit('join-room', { roomCode, difficulty });

        socket.on('room-created', ({ roomCode, difficulty }) => {
            roomCodeDisplay.textContent = `Kod pokoju: ${roomCode} | Poziom trudności: ${difficulty}`;
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
            const game = new MixOrMatch(difficulty,difficulty === 'hard' ? 60 : 100, cardsMulti, loggedInUsername);
            game.startGame();

            // Dodaj nasłuchiwanie na kliknięcia kart
            cardsMulti.forEach(card => {
            card.addEventListener('click', () => {
                game.flipCard(card);
                });
            });
        });

        socket.on('opponent-disconnected', () => {
            waitingMessage.textContent = 'Przeciwnik opuścił grę. Przekierowanie...';
            setTimeout(() => {
                window.location.href = '/menu.html';
            }, 3000);
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