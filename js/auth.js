/* Nova Natie App — Gebruikersbeheer & login */

var USERS = {
  'pieter.geerardyn@nova.be': { naam: 'Pieter Geerardyn', voornaam: 'Pieter', rol: 'Directie' },
  'jonas.dieu@nova.be':       { naam: 'Jonas Dieu',       voornaam: 'Jonas',  rol: 'General Manager Operations' },
  'quinten.brosens@nova.be':  { naam: 'Quinten Brosens',  voornaam: 'Quinten',rol: 'QHSE' },
  'ruben.audenaert@nova.be':  { naam: 'Ruben Audenaert',  voornaam: 'Ruben',  rol: 'Medewerker' }
};

var currentUser = null;

async function doLogin() {
  var btn = document.getElementById('login-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Bezig met aanmelden…'; }
  try {
    var account = await graphLogin();
    var email = (account.username || '').toLowerCase();
    // Bekende gebruikers krijgen hun geconfigureerde rol; anderen vallen terug op "Medewerker"
    var info = USERS[email] || {
      naam: account.name || email,
      voornaam: (account.name || email).split(' ')[0],
      rol: 'Medewerker'
    };
    currentUser = Object.assign({ email: email }, info);
    if (!localStorage.getItem('nova_anchor_' + email)) {
      localStorage.setItem('nova_anchor_' + email, new Date().toISOString());
    }
    setUserUI();
    renderStats();
    go('s-dept');
  } catch (e) {
    console.warn('Login fout:', e);
    toast('Aanmelden mislukt of geannuleerd');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Aanmelden met Microsoft 365'; }
  }
}

function setUserUI() {
  document.getElementById('dept-name').textContent = currentUser.voornaam;
  document.getElementById('home-name').textContent = currentUser.voornaam;
  document.getElementById('m-name').value = currentUser.naam + ' — ' + currentUser.rol;
  var d = new Date();
  var dagen = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
  var maanden = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
  document.getElementById('home-date').textContent =
    dagen[d.getDay()] + ' ' + d.getDate() + ' ' + maanden[d.getMonth()] + ' ' + d.getFullYear() + ' · Nova Natie';
}
