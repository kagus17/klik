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