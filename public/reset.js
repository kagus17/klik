    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const status = document.getElementById('status');

    let csrfToken = '';
(async () => {
  const res = await fetch('/auth/csrf-token', { credentials: 'same-origin' });
  const data = await res.json();
  csrfToken = data.csrfToken;
})();

     function validatePassword(password) {
      // Minimum 8 znaków, przynajmniej jedna cyfra, mała i wielka litera, znak specjalny
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      return regex.test(password);
    }

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