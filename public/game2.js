    // Event listener for "Return to Menu" button
    document.getElementById('return-to-menu').addEventListener('click', () => {
      window.location.href = '/menu.html';
    });

    // Kopiowanie kodu pokoju do schowka po kliknięciu
  document.getElementById('room-code-display').addEventListener('click', function () {
    // Pobierz kod pokoju z tekstu (np. "Kod pokoju: ABC123")
    const codeText = this.textContent;
    const code = codeText.split(':')[1]?.trim();
    if (code && code !== 'Ładowanie...') {
      navigator.clipboard.writeText(code).then(() => {
        this.textContent = `Skopiowano: ${code}`;
        setTimeout(() => {
          this.textContent = codeText;
        }, 1500);
      });
    }
  });