document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('#login-form button[type="submit"]');
  if (loginBtn && typeof lsRememberMe === 'function') {
    loginBtn.addEventListener('click', lsRememberMe);
  }
});

async function init() {
const status = document.getElementById('status');
    const csrfRes = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
    const { csrfToken } = await csrfRes.json();

    // Obsługa logowania
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
        const data = await res.json();
        status.innerText = data.error || 'Błąd logowania.';
      }
    }
    catch (error) {
      status.innerText = 'Błąd połączenia z serwerem.';
    }
    });

    // Funkcja walidacji hasła
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

    // Obsługa rejestracji
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const password = formData.get('password');

      if (!validatePassword(password)) {
        status.innerText = 'Hasło musi zawierać co najmniej 8 znaków, małe i duże litery, liczby oraz znaki specjalne.';
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
        status.innerText = 'Zarejestrowano! Możesz się zalogować.';
      } else {
        const data = await res.json();
        status.innerText = data.error || 'Błąd rejestracji.';
      }
    }
    catch (error) {
      status.innerText = 'Błąd połączenia z serwerem.';
    }
    });
}

init();
