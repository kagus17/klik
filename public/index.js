/**
 * @file index.js
 * @description Skrypt obsługujący logowanie i rejestrację użytkowników na stronie głównej aplikacji. Pobiera token CSRF, waliduje hasła i komunikuje się z serwerem.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module AuthClient
 */

/**
 * Inicjalizuje nasłuchiwanie zdarzenia kliknięcia przycisku logowania dla funkcji zapamiętywania sesji.
 * @function
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('#login-form button[type="submit"]');
  if (loginBtn && typeof lsRememberMe === 'function') {
    loginBtn.addEventListener('click', lsRememberMe);
  }
});

/**
 * Inicjalizuje obsługę logowania i rejestracji, pobierając token CSRF i ustawiając nasłuchiwacze formularzy.
 * @async
 * @function
 */
async function init() {
const status = document.getElementById('status');
    const csrfRes = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
    const { csrfToken } = await csrfRes.json();

 /**
     * Obsługuje wysyłanie formularza logowania.
     * @function
     * @listens submit
     * @param {Event} e - Zdarzenie submit formularza.
     */
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try{
        const csrfRes = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
        const { csrfToken } = await csrfRes.json();
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'CSRF-Token': csrfToken },
        credentials: 'same-origin',
        body: new URLSearchParams(formData)
      });

      if (res.ok) {
        window.location.href = '/menu.html'; // Przejście do strony z pokojami
      } else {
       const data = await res.json(); // <- NAJPIERW pobierz dane!
        Toastify({
          text: data.error || "Błąd logowania.",
          duration: 3000,
          gravity: "top",
          position: "center",
          backgroundColor: "#d32f2f",
          stopOnFocus: true
        }).showToast();
        status.innerText = data.error || 'Błąd logowania.';
        status.innerText = data.error || 'Błąd logowania.';
      }
    }
    catch (error) {
      status.innerText = 'Błąd połączenia z serwerem.';
    }
    });

   /**
     * Waliduje hasło pod kątem długości i zawartości.
     * @function
     * @param {string} password - Hasło do sprawdzenia.
     * @returns {boolean} Czy hasło spełnia wymagania.
     */
    function validatePassword(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar
      ) {
        return true;
      }
      return false;
    }

    /**
     * Obsługuje wysyłanie formularza rejestracji.
     * @function
     * @listens submit
     * @param {Event} e - Zdarzenie submit formularza.
     */
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const password = formData.get('password');

      if (!validatePassword(password)) {
        Toastify({
          text: 'Hasło musi zawierać co najmniej 8 znaków, małe i duże litery, liczby oraz znaki specjalne.',
          duration: 6000,
          gravity: "top",
          position: "center",
          backgroundColor: "#f5f577", // żółty
          stopOnFocus: true,
          style: { color: "#222" }
        }).showToast();
        return;
      }
      try{
        // Pobierz świeży token CSRF
    const csrfRes = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
    const { csrfToken } = await csrfRes.json();
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'CSRF-Token': csrfToken },
        credentials: 'same-origin',
        body: new URLSearchParams(formData)
      });

      if (res.ok) {
      Toastify({
        text: 'Zarejestrowano! Możesz się zalogować.',
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#43a047", // zielony
        stopOnFocus: true
      }).showToast();
      // Możesz tu wyczyścić formularz lub przełączyć na logowanie
      e.target.reset();
      } else {
      const data = await res.json();
      Toastify({
        text: data.error || 'Błąd rejestracji.',
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#d32f2f", // czerwony
        stopOnFocus: true
      }).showToast();
      status.innerText = data.error || 'Błąd rejestracji.';
      }
    }
    catch (error) {
      status.innerText = 'Błąd połączenia z serwerem.';
    }
    });
}

init();
