/**
 * @file menu.js
 * @description Skrypt obsługujący interfejs menu gry, w tym wybór poziomu trudności, tworzenie i dołączanie do pokojów, wylogowanie, wyświetlanie wyników i historii gier.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module MenuClient
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
 */
(async () => {
  const res = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
  const data = await res.json();
  csrfToken = data.csrfToken;
})();

/**
 * Inicjalizuje interfejs menu po załadowaniu strony.
 * @function
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', async function() {
  // Ukryj overlay i historię na start
  document.getElementById('history-overlay').style.display = 'none';
  document.getElementById('history-container').style.display = 'none';

  /**
     * Wyświetla historię gier po kliknięciu przycisku.
     * @function
     * @listens click
     */
  document.getElementById('show-history').addEventListener('click', () => {
    document.getElementById('history-overlay').style.display = 'block';
    document.getElementById('history-container').style.display = 'block';
    // Jeśli chcesz ukryć ostatnią grę:
    // document.querySelector('.last-game').style.display = 'none';
  });

  /**
     * Ukrywa historię gier i wraca do widoku ostatniej gry.
     * @function
     * @listens click
     */
  document.getElementById('back-to-last').addEventListener('click', () => {
    document.getElementById('history-overlay').style.display = 'none';
    document.getElementById('history-container').style.display = 'none';
    // Jeśli chcesz pokazać ostatnią grę:
    // document.querySelector('.last-game').style.display = '';
  });

  /**
     * Pobiera i wyświetla najlepsze wyniki z rankingu.
     * @async
     */
  try {
    const res = await fetch('/leaderboard');
    const data = await res.json();
    const tbody = document.querySelector('#leaderboard tbody');
    tbody.innerHTML = '';

    const difficultyMap = {
      easy: 'Łatwy',
      medium: 'Średni',
      hard: 'Trudny'
    };

    data.forEach(row => {
      const tr = document.createElement('tr');
      const difficultyPL = difficultyMap[row.difficulty] || row.difficulty;
      tr.innerHTML = `<td>${row.player}</td><td>${difficultyPL}</td><td>${row.points}</td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    const tbody = document.querySelector('#leaderboard tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="2">Brak danych</td></tr>';
  }
});

document.getElementById('history-container').style.display = 'none'; // Ukryj historię na początku

    const difficulties = ['Łatwy (3 pary)', 'Średni (6 par)', 'Trudny (12 par)'];
    const difficultyValues = ['easy', 'medium', 'hard'];
    let currentIndex = 1; // Start na "Średni"

    const label = document.getElementById('difficulty-label');
    const prevBtn = document.getElementById('prev-difficulty');
    const nextBtn = document.getElementById('next-difficulty');

     /**
     * Aktualizuje wyświetlany poziom trudności.
     * @function
     */
    function updateDifficulty() {
      label.textContent = difficulties[currentIndex];
      label.setAttribute('value', difficultyValues[currentIndex]);
      console.log('Wybrany poziom trudności:', difficultyValues[currentIndex]);
    }

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + difficulties.length) % difficulties.length;
      updateDifficulty();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % difficulties.length;
      updateDifficulty();
    });

    const status = document.getElementById('status');

     /**
     * Sprawdza, czy użytkownik jest zalogowany, i aktualizuje status.
     * @async
     */
    (async () => {
    const res = await fetch('/session/check');
    const data = await res.json();

    if (!data.loggedIn) {
      alert('Musisz być zalogowany!');
      window.location.href = '/index.html';
    } else {
      status.innerText = `Witaj ${data.username}`;
    }
    })();

    /**
     * Tworzy nowy pokój gry z wybranym poziomem trudności.
     * @function
     * @listens click
     */
    document.getElementById('create-room').addEventListener('click', async () => {
      const difficulty = document.getElementById('difficulty-label').value; // Pobierz wybrany poziom trudności
      const res = await fetch('/room/create', { method: 'POST', headers: { 'CSRF-Token': csrfToken },credentials: 'same-origin' });
      const data = await res.json();
      console.log(difficulty);

      if (data.success) {
        // Tu można przekierować do strony gry: np. /game.html?code=XYZ123
        window.location.href = `/game2.html?code=${data.code}&difficulty=${difficulty}`; // Dodaj poziom trudności do URL
      } else {
        status.innerText = 'Nie udało się utworzyć pokoju.';
      }
    });

    /**
     * Dołącza do istniejącego pokoju na podstawie kodu.
     * @function
     * @listens submit
     */
    document.getElementById('join-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await fetch('/room/join', {
        method: 'POST',
        headers: { 'CSRF-Token': csrfToken },
        credentials: 'same-origin',
        body: new URLSearchParams(formData)
      });

      const data = await res.json();

      if (data.success) {
        status.innerText = 'Dołączono do pokoju!';
        // Tu można przekierować do gry
        window.location.href = `/game2.html?code=${formData.get('code')}`;
      } else {
        status.innerText = 'Błąd: Nie udało się dołączyć do pokoju.';
      }
    });

     /**
     * Wylogowuje użytkownika i przekierowuje do strony logowania.
     * @function
     * @listens click
     */
    document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST', headers: { 'CSRF-Token': csrfToken },credentials: 'same-origin', });
    window.location.href = '/index.html';
    });

     /**
     * Oblicza punkty na podstawie liczby dopasowań i czasu gry.
     * @function
     * @param {number} matches - Liczba dopasowań.
     * @param {number} time_played - Czas gry w sekundach.
     * @returns {number} Obliczone punkty.
     */
function calculatePoints(matches, time_played) {
  return matches * (100-time_played) + matches; // Punkty = (matches * (100 - time_played)) + matches
}

/**
     * Pobiera i wyświetla dane ostatniej gry.
     * @async
     */
(async () => {
  const res = await fetch('/game/last-result');
  const data = await res.json();

  const table = document.getElementById('last-game-table');
  const noGame = document.getElementById('no-last-game');
  if (!data.found) {
    noGame.style.display = 'block';
    table.style.display = 'none';
    return;
  }

  const my = data.myResult;
  const opp = data.opponentResult;

  // Ustaw nazwy
  document.getElementById('my-name').innerText = my.player_name || 'Ty';
  document.getElementById('opponent-name').innerText = opp ? opp.player_name : 'Brak';

  // Oblicz punkty
  const myPoints = calculatePoints(my.matches, my.time_played);
  const oppPoints = opp ? calculatePoints(opp.matches, opp.time_played) : 0;

  document.getElementById('my-points').innerText = myPoints + ' pkt';
  document.getElementById('opponent-points').innerText = opp ? (oppPoints + ' pkt') : '-';

  // Ustal wynik
  let result = '';
  if (!opp) {
    result = 'Brak przeciwnika';
  } else if (
    myPoints === oppPoints &&
    my.matches === opp.matches &&
    my.time_played === opp.time_played
  ) {
    result = 'Remis';
  } else if (myPoints > oppPoints) {
    result = 'Wygrana';
  } else {
    result = 'Przegrana';
  }
  document.getElementById('last-game-result').innerText = result;

  table.style.display = '';
  noGame.style.display = 'none';
})();

 /**
     * Pobiera i wyświetla historię wszystkich gier użytkownika.
     * @function
     * @listens click
     */
document.getElementById('show-history').addEventListener('click', async () => {
  const historyDiv = document.getElementById('history-container');
  historyDiv.style.display = '';

  const res = await fetch('/game/history');
  const data = await res.json();

  const tbody = document.getElementById('history-table').querySelector('tbody');
  tbody.innerHTML = '';

  if (!data.found) {
    document.getElementById('no-history').style.display = '';
    document.getElementById('history-table').style.display = 'none';
    return;
  }

  document.getElementById('no-history').style.display = 'none';
  document.getElementById('history-table').style.display = '';

data.results.forEach(row => {
    const points = row.matches * (100 - row.time_played) + row.matches; // Oblicz punkty dla gracza
    const opponent = row.opponent_name || 'Brak';

  // Oblicz punkty przeciwnika tylko jeśli są dane
  const oppPoints = (row.opponent_matches != null && row.opponent_time_played != null)
    ? calculatePoints(row.opponent_matches, row.opponent_time_played)
    : null;

  // Ustal wynik
let result = '';
if (!row.opponent_name) {
  result = 'Brak przeciwnika';
} else if (
  points === oppPoints &&
  row.matches === row.opponent_matches &&
  row.time_played === row.opponent_time_played
) {
  result = 'Remis';
} else if (points > oppPoints) {
  result = 'Wygrana';
} else {
  result = 'Przegrana';
}
  const difficultyMap = {
      easy: 'Łatwy',
      medium: 'Średni',
      hard: 'Trudny'
    };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(row.end_time).toLocaleString()}</td>
      <td>${opponent}</td>
      <td>${difficultyMap[row.difficulty]}</td>
      <td>${row.matches}</td>
      <td>${row.flips}</td>
      <td>${row.time_played}</td>
      <td>${points}</td>
      <td>${result}</td>
    `;
    tbody.appendChild(tr);
  });
});

/**
     * Ukrywa historię gier po kliknięciu przycisku powrotu.
     * @function
     * @listens click
     */
document.getElementById('back-to-last').addEventListener('click', () => {
  document.getElementById('history-container').style.display = 'none';
  document.querySelector('.last-game').style.display = '';
});