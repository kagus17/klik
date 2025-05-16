const { JSDOM } = require('jsdom');
const { showResultsModal } = require('./script');

// filepath: c:\Users\aaa\Desktop\STUDIA\BUC\Klik\public\script.test.js

describe('showResultsModal', () => {
    let dom;
    let document;

    beforeEach(() => {
        // Create a mock DOM
        dom = new JSDOM(`
            <div id="results-modal" class="overlay-text hidden">
                <h2 id="results-title"></h2>
                <p id="results-flips"></p>
                <p id="results-time"></p>
                <p id="results-matches"></p>
            </div>
        `);
        document = dom.window.document;
        global.document = document;
    });

    afterEach(() => {
        // Clean up global DOM
        delete global.document;
    });

    test('displays "Zwycięstwo!" when the player wins', () => {
        showResultsModal('Player1', 10, 120, 6, true);

        const modal = document.getElementById('results-modal');
        const title = document.getElementById('results-title').innerText;
        const flips = document.getElementById('results-flips').innerText;
        const time = document.getElementById('results-time').innerText;
        const matches = document.getElementById('results-matches').innerText;

        expect(modal.classList.contains('visible')).toBe(true);
        expect(title).toBe('Zwycięstwo!');
        expect(flips).toBe('Liczba odwróceń: 10');
        expect(time).toBe('Czas gry: 120 sekund');
        expect(matches).toBe('Prawidłowe dopasowania: 6');
    });

    test('displays "Przegrana!" when the player loses', () => {
        showResultsModal('Player1', 15, 150, 4, false);

        const modal = document.getElementById('results-modal');
        const title = document.getElementById('results-title').innerText;
        const flips = document.getElementById('results-flips').innerText;
        const time = document.getElementById('results-time').innerText;
        const matches = document.getElementById('results-matches').innerText;

        expect(modal.classList.contains('visible')).toBe(true);
        expect(title).toBe('Przegrana!');
        expect(flips).toBe('Liczba odwróceń: 15');
        expect(time).toBe('Czas gry: 150 sekund');
        expect(matches).toBe('Prawidłowe dopasowania: 4');
    });

    test('displays "Remis!" when the game ends in a draw', () => {
        showResultsModal('Player1', 12, 130, 5, false, true);

        const modal = document.getElementById('results-modal');
        const title = document.getElementById('results-title').innerText;
        const flips = document.getElementById('results-flips').innerText;
        const time = document.getElementById('results-time').innerText;
        const matches = document.getElementById('results-matches').innerText;

        expect(modal.classList.contains('visible')).toBe(true);
        expect(title).toBe('Remis!');
        expect(flips).toBe('Liczba odwróceń: 12');
        expect(time).toBe('Czas gry: 130 sekund');
        expect(matches).toBe('Prawidłowe dopasowania: 5');
    });

    test('prevents multiple displays of the modal', () => {
        const modal = document.getElementById('results-modal');
        modal.classList.add('visible'); // Simulate modal already being visible

        showResultsModal('Player1', 10, 120, 6, true);

        const title = document.getElementById('results-title').innerText;

        expect(title).toBe(''); // Title should not change
    });
});