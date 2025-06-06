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

//
// Skrypt dla przycisku pokaż/ukryj hasło.
//
		document.addEventListener('DOMContentLoaded', function () {
			const pokazHaslo = document.querySelector('.input-space a');
			const haslo = document.getElementById("password");
			
			pokazHaslo.addEventListener('click', function(e) {
				e.preventDefault();
				if(haslo.type == 'password')
				{
					haslo.type = 'text';
					this.innerHTML = "<img src='showDark.png' title='Ukryj hasło'>";
				}
				else
				{
					haslo.type = 'password';
					this.innerHTML = "<img src='hideDark.png' title='Pokaż hasło'>";
				}
			});
		});
	
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

      if (!validatePassword(newPassword)) {
        status.innerText = 'Hasło musi mieć co najmniej 8 znaków, zawierać małą i wielką literę, cyfrę oraz znak specjalny.';
        return;
      }


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
        status.innerText = 'Hasło zostało zresetowane!';
      } else {
        status.innerText = 'Błąd resetu hasła.';
      }
    });