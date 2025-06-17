/**
 * @file reset.js
 * @description Skrypt obsługujący formularz resetowania hasła, walidujący nowe hasło i wysyłający żądanie do serwera z tokenem resetowania.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module PasswordReset
 */
	
/**
 * Token resetowania hasła pobrany z parametrów URL.
 * @type {string|null}
 */
 
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    /**
 * Element wyświetlający status operacji.
 * @type {HTMLElement}
 */
    const status = document.getElementById('status');

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
  const res = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
  const data = await res.json();
  csrfToken = data.csrfToken;
})();

/**
 * Waliduje hasło pod kątem długości i zawartości.
 * @function
 * @param {string} password - Hasło do sprawdzenia.
 * @returns {boolean} Czy hasło spełnia wymagania (min. 8 znaków, mała i wielka litera, cyfra, znak specjalny).
 */
     function validatePassword(password) {
      // Minimum 8 znaków, przynajmniej jedna cyfra, mała i wielka litera, znak specjalny
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      return regex.test(password);
    }

    /**
 * Obsługuje wysyłanie formularza resetowania hasła.
 * @function
 * @listens submit
 * @param {Event} e - Zdarzenie submit formularza.
 * @description Waliduje nowe hasło i wysyła żądanie resetowania hasła z tokenem.
 */
    document.getElementById('reset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const newPassword = formData.get('newPassword');
      const confirmPassword = formData.get('ConfirmPassword');

      // Sprawdź czy oba pola są wypełnione
      if (!newPassword || !confirmPassword) {
        Toastify({
          text: 'Wpisz oba pola hasła!',
          duration: 4000,
          gravity: "top",
          position: "center",
          backgroundColor: "#ffd600", // żółty
          stopOnFocus: true,
          style: { color: "#222" }
        }).showToast();
        return;
      }

      // Sprawdź czy hasła się zgadzają
      if (newPassword !== confirmPassword) {
        Toastify({
          text: 'Hasła nie są takie same!',
          duration: 4000,
          gravity: "top",
          position: "center",
          backgroundColor: "#ffd600",
          stopOnFocus: true,
          style: { color: "#222" }
        }).showToast();
        return;
      }

      // Sprawdź siłę hasła
      if (!validatePassword(newPassword)) {
        Toastify({
          text: 'Hasło musi mieć co najmniej 8 znaków, zawierać małą i wielką literę, cyfrę oraz znak specjalny.',
          duration: 6000,
          gravity: "top",
          position: "center",
          backgroundColor: "#ffd600",
          stopOnFocus: true,
          style: { color: "#222" }
        }).showToast();
        return;
      }

      // Jeśli wszystko OK, wyślij żądanie resetu
      const res = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        credentials: 'same-origin',
        body: JSON.stringify({ token, newPassword })
      });

      if (res.ok) {
        Toastify({
          text: 'Hasło zostało zresetowane!',
          duration: 4000,
          gravity: "top",
          position: "center",
          backgroundColor: "#43a047", // zielony
          stopOnFocus: true
        }).showToast();
      } else {
        Toastify({
          text: 'Błąd resetu hasła.',
          duration: 4000,
          gravity: "top",
          position: "center",
          backgroundColor: "#d32f2f", // czerwony
          stopOnFocus: true
        }).showToast();
      }
    });