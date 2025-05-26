const status = document.getElementById('status');

// Pobierz token CSRF na początku
let csrfToken = '';
(async () => {
  const res = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
  const data = await res.json();
  csrfToken = data.csrfToken;
})();

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