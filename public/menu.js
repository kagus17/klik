
    let csrfToken = '';
(async () => {
  const res = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
  const data = await res.json();
  csrfToken = data.csrfToken;
})();

    const difficulties = ['Łatwy (3 pary)', 'Średni (6 par)', 'Trudny (12 par)'];
    const difficultyValues = ['easy', 'medium', 'hard'];
    let currentIndex = 1; // Start na "Średni"

    const label = document.getElementById('difficulty-label');
    const prevBtn = document.getElementById('prev-difficulty');
    const nextBtn = document.getElementById('next-difficulty');

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

    // Sprawdź, czy użytkownik jest zalogowany
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

    document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST', headers: { 'CSRF-Token': csrfToken },credentials: 'same-origin', });
    window.location.href = '/index.html';
    });

    // Funkcja do obliczania punktów
function calculatePoints(matches, time_played) {
  return matches * (100-time_played);
}

// Pobierz i wyświetl ostatnią grę
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

document.getElementById('show-history').addEventListener('click', async () => {
  document.querySelector('.last-game').style.display = 'none';
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
    const points = row.matches * 100 - row.time_played * 2;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(row.end_time).toLocaleString()}</td>
      <td>${row.room_id}</td>
      <td>${row.difficulty}</td>
      <td>${row.matches}</td>
      <td>${row.flips}</td>
      <td>${row.time_played}</td>
      <td>${points}</td>
    `;
    tbody.appendChild(tr);
  });
});

document.getElementById('back-to-last').addEventListener('click', () => {
  document.getElementById('history-container').style.display = 'none';
  document.querySelector('.last-game').style.display = '';
});
