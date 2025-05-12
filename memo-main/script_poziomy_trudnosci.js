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

class MixOrMatch {
    constructor(totalTime, cards) {
        this.cardsArray = cards;
        this.totalTime = totalTime;
        this.timeRemaining = totalTime;
        this.timer = document.getElementById('time-remaining')
        this.ticker = document.getElementById('flips');
        this.audioController = new AudioController();
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

            if(this.cardToCheck) {
                this.checkForCardMatch(card);
            } else {
                this.cardToCheck = card;
            }
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
    const overlays = Array.from(document.getElementsByClassName('overlay-text'));
    const cardContainer = document.getElementById('game-container');
    const difficulty = localStorage.getItem('memoDifficulty') || 'medium';

    // Konfiguracja poziomów
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

    const selected = cardImages.slice(0, cardPairsCount);
    const allImages = [...selected, ...selected];
    shuffleArray(allImages);

    // Dopasuj układ siatki
    const columns = Math.min(cardPairsCount * 2, 6);
    cardContainer.style.gridTemplateColumns = `repeat(${columns}, auto)`;

    // Wygeneruj karty w HTML
    cardContainer.innerHTML = '';
    allImages.forEach(image => {
        const cardHTML = `
        <div class="card">
            <div class="card-back card-face">
                <img class="cob-web cob-web-top-left" src="Assets/Images/wisienka.png">
                <img class="cob-web cob-web-top-right" src="Assets/Images/wisienka.png">
                <img class="cob-web cob-web-bottom-left" src="Assets/Images/wisienka.png">
                <img class="cob-web cob-web-bottom-right" src="Assets/Images/wisienka.png">
                <img class="w" src="Assets/Images/w.png">
            </div>
            <div class="card-front card-face">
                <img class="cob-web cob-web-top-left" src="Assets/Images/wisienka.png">
                <img class="cob-web cob-web-top-right" src="Assets/Images/wisienka.png">
                <img class="cob-web cob-web-bottom-left" src="Assets/Images/wisienka.png">
                <img class="cob-web cob-web-bottom-right" src="Assets/Images/wisienka.png">
                <img class="card-value" src="Assets/Images/${image}">
            </div>
        </div>
        `;
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    const cards = Array.from(document.getElementsByClassName('card'));
    const game = new MixOrMatch(100, cards);

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
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
