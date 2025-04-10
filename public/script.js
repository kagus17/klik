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
    constructor(totalTime, cards) {
        this.cardsArray = cards;
        this.totalTime = totalTime;
        this.timeRemaining = totalTime;
        this.timer = document.getElementById('time-remaining');
        this.ticker = document.getElementById('flips');
        this.opponentFlips = document.getElementById('opponent-flips') || { innerText: '0' }; // Fallback
        this.audioController = new AudioController();
        this.roomCode = new URLSearchParams(window.location.search).get('code');
        this.isMultiplayer = !!this.roomCode;
        
        // Inicjalizuj wszystkie wymagane właściwości
        this.totalClicks = 0;
        this.cardToCheck = null;
        this.matchedCards = []; // DODAJ TĘ LINIĘ
        this.busy = false;

        if (this.isMultiplayer) {
            socket.emit('join-room', this.roomCode);
            
            socket.on('game-start', () => {
                document.querySelector('.overlay-text.visible').classList.remove('visible');
                this.startGame();
            });
            
            socket.on('opponent-clicked', (clicks) => {
                this.opponentFlips.innerText = clicks;
            });
            
            socket.on('game-ended', () => {
                setTimeout(() => {
                    window.location.href = '/menu.html';
                }, 5000);
            });
        }
    }

    startGame() {
        this.totalClicks = 0;
        this.timeRemaining = this.totalTime;
        this.cardToCheck = null;
        this.matchedCards = [];
        this.busy = true;
        setTimeout(() => {
            this.audioController.startMusic();
            this.shuffleCards(this.cardsArray);
            this.countdown = this.startCountdown();
            this.busy = false;
        }, 500)
        this.hideCards();
        this.timer.innerText = this.timeRemaining;
        this.ticker.innerText = this.totalClicks;
    }
    startCountdown() {
        return setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;
            if(this.timeRemaining === 0)
                this.gameOver();
        }, 1000);
    }
    gameOver() {
        clearInterval(this.countdown);
        this.audioController.gameOver();
        document.getElementById('game-over-text').classList.add('visible');
    }
    victory() {
        clearInterval(this.countdown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible');
    }
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
        clearInterval(this.countdown);
        this.audioController.gameOver();
        document.getElementById('game-over-text').classList.add('visible');
        
        if (this.isMultiplayer) {
            socket.emit('game-over', { roomCode: this.roomCode });
            setTimeout(() => {
                window.location.href = '/menu.html';
            }, 5000);
        }
    }

    victory() {
        clearInterval(this.countdown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible');
        
        if (this.isMultiplayer) {
            socket.emit('game-over', { roomCode: this.roomCode });
            setTimeout(() => {
                window.location.href = '/menu.html';
            }, 5000);
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

function ready() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('code');
    
    if (roomCode) {
        const waitingOverlay = document.getElementById('waiting-overlay');
        const roomCodeDisplay = document.getElementById('room-code-display');
        const waitingMessage = document.getElementById('waiting-message');
        const opponentInfo = document.getElementById('opponent-info');
        
        roomCodeDisplay.textContent = `Kod pokoju: ${roomCode}`;
        
        socket.on('room-created', (code) => {
            roomCodeDisplay.textContent = `Kod pokoju: ${code}`;
        });
        
        socket.on('game-start', () => {
            waitingOverlay.classList.remove('visible');
            opponentInfo.style.display = 'block';
        });
        
        socket.on('opponent-disconnected', () => {
            waitingMessage.textContent = 'Przeciwnik opuścił grę. Przekierowanie...';
            setTimeout(() => {
                window.location.href = '/menu.html';
            }, 3000);
        });
    }
    let overlays = Array.from(document.getElementsByClassName('overlay-text'));
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
    });
}