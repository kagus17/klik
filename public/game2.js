/**
 * @file game2.js
 * @description Skrypt obsługujący interakcje na stronie gry, w tym powrót do menu oraz kopiowanie kodu pokoju do schowka.
 * @author KL, MF, DA, ŁW
 * @version 1.0.0
 * @date 2025-05-31
 */

/**
 * @module GameUI
 */

/**
 * Przekierowuje użytkownika do strony menu po kliknięciu przycisku "Powrót do menu".
 * @function
 * @listens click
 */
    document.getElementById('return-to-menu').addEventListener('click', () => {
      window.location.href = '/menu.html';
    });

/**
 * Kopiuje kod pokoju do schowka po kliknięciu elementu wyświetlającego kod.
 * @function
 * @listens click
 * @description Po skopiowaniu wyświetla tymczasowe potwierdzenie, a po 1,5 sekundy przywraca oryginalny tekst.
 */
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