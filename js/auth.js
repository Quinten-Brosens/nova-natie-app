/* Nova Natie App — Gebruikersbeheer & login */

var USERS = {
  'pieter.geerardyn@nova.be': { naam: 'Pieter Geerardyn', voornaam: 'Pieter', rol: 'Directie' },
  'jonas.dieu@nova.be':       { naam: 'Jonas Dieu',       voornaam: 'Jonas',  rol: 'General Manager Operations' },
  'quinten.brosens@nova.be':  { naam: 'Quinten Brosens',  voornaam: 'Quinten',rol: 'QHSE' },
  'ruben.audenaert@nova.be':  { naam: 'Ruben Audenaert',  voornaam: 'Ruben',  rol: 'Medewerker' }
};

var currentUser = null;

function doLogin() {
  var email = document.getElementById('u-select').value;
  if (!email) { toast('Kies je naam'); return; }
  currentUser = Object.assign({ email: email }, USERS[email]);
  if (!localStorage.getItem('nova_anchor_' + email)) {
    localStorage.setItem('nova_anchor_' + email, new Date().toISOString());
  }
  setUserUI();
  renderStats();
  go('s-dept');
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
