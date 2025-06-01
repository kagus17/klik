/**
 * @file recovery.js
 * @description Skrypt obsługujący formularz odzyskiwania hasła, wysyłający żądanie do serwera w celu wygenerowania instrukcji resetowania hasła.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module PasswordRecovery
 */

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
 * Obsługuje wysyłanie formularza odzyskiwania hasła.
 * @function
 * @listens submit
 * @param {Event} e - Zdarzenie submit formularza.
 * @description Wysyła żądanie do serwera z danymi formularza, informując użytkownika o wyniku operacji.
 */
    document.getElementById('recovery-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'CSRF-Token': csrfToken },
        credentials: 'same-origin',
        body: new URLSearchParams(formData)
      });

      if (res.ok) {
        status.innerText = 'Jeśli podany e-mail istnieje, wysłaliśmy instrukcje resetowania hasła.';
      } else {
        status.innerText = 'Błąd podczas wysyłania instrukcji resetowania hasła.';
      }
    });