/* Nova Natie App — Module: Inspecties & checklists */

var INSP = {
  'Dagelijkse rondgang kaai': [
    'Vluchtwegen en nooduitgangen vrij',
    'Verkeerszones en markeringen zichtbaar',
    'Geen lekkages of gemorste producten',
    'Verlichting werkt correct',
    'Brandblussers aanwezig & gekeurd',
    'Stapeling stabiel en correct',
    'Afval gesorteerd en weggewerkt',
    'Geen beschadigd materiaal in gebruik'
  ],
  'PBM-controle ploeg': [
    'Veiligheidsschoenen gedragen',
    'Hi-vis kledij gedragen',
    'Helm waar verplicht',
    'Handschoenen aangepast aan taak',
    'Gehoorbescherming bij lawaai',
    'PBM in goede staat'
  ],
  'Heftruck pre-use check': [
    'Banden en vorken in orde',
    'Rem en claxon werken',
    'Verlichting & zwaailicht werken',
    'Hefmast & kettingen ok',
    'Geen lekken (olie/hydraulisch)',
    'Veiligheidsgordel aanwezig',
    'Vorige defecten opgelost'
  ],
  'ISPS toegangscontrole': [
    'Toegangspoort gesloten/bemand',
    'Badges gecontroleerd',
    'Bezoekers geregistreerd',
    'Camera’s operationeel',
    'Geen onbevoegden vastgesteld'
  ]
};

var inspState = [];
var inspName = '';

function openInsp(name) {
  inspName = name;
  document.getElementById('insp-title').textContent = name;
  document.getElementById('insp-user').textContent = currentUser ? currentUser.naam : '—';
  document.getElementById('insp-date').textContent = fmtDate(new Date().toISOString());
  var items = INSP[name] || [];
  inspState = items.map(function () { return null; });
  var c = document.getElementById('insp-items'); c.innerHTML = '';
  items.forEach(function (q, i) {
    var d = document.createElement('div'); d.className = 'ck-item';
    d.innerHTML = '<div class="q">' + (i + 1) + '. ' + q + '</div><div class="ck-opts">' +
      '<div class="ck-opt ok" onclick="setCk(' + i + ',\'ok\',this)">OK</div>' +
      '<div class="ck-opt nok" onclick="setCk(' + i + ',\'nok\',this)">NOK</div>' +
      '<div class="ck-opt na" onclick="setCk(' + i + ',\'na\',this)">N.v.t.</div></div>';
    c.appendChild(d);
  });
  updateInsp();
  go('s-insp');
}

function setCk(i, val, el) {
  inspState[i] = val;
  var p = el.parentElement;
  p.querySelectorAll('.ck-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  updateInsp();
}

function updateInsp() {
  var done = inspState.filter(x => x !== null).length;
  var nok = inspState.filter(x => x === 'nok').length;
  var pct = Math.round(done / inspState.length * 100);
  document.getElementById('insp-bar').style.width = pct + '%';
  document.getElementById('insp-prog').textContent = done + '/' + inspState.length;
  document.getElementById('insp-nok').textContent = nok;
}

function submitInsp() {
  var done = inspState.filter(x => x !== null).length;
  if (done < inspState.length) { toast('Beantwoord eerst alle punten'); return; }
  var nok = inspState.filter(x => x === 'nok').length;
  var melder = currentUser ? currentUser.naam + ' — ' + currentUser.rol : '—';
  if (nok > 0) {
    addItem({
      soort: 'inspectie', icon: '✅',
      type: 'Inspectie', titel: 'Inspectie — ' + inspName,
      locatie: inspName, categorie: 'Tekortkoming',
      urgentie: nok + ' tekortkoming(en)',
      beschrijving: 'Checklist "' + inspName + '" afgerond. ' + nok + ' punt(en) als NOK aangeduid.',
      melder: melder
    });
    emailjs.send('nova_natie', 'template_odoyxs2', {
      melding_type: 'Inspectie — ' + inspName,
      locatie: inspName,
      urgentie: nok + ' tekortkoming(en) vastgesteld',
      beschrijving: 'Checklist afgerond. ' + nok + ' punt(en) als NOK aangeduid.',
      melder: melder
    }).catch(function (e) { console.warn('EmailJS fout:', e); });
  }
  showSuccess('Inspectie afgerond',
    nok > 0
      ? ('Checklist opgeslagen. ' + nok + ' tekortkoming(en) vastgesteld — er is automatisch een actie aangemaakt en een e-mail verstuurd.')
      : 'Checklist opgeslagen. Geen tekortkomingen vastgesteld. Het rapport is gearchiveerd.',
    nok > 0,
    nok > 0 ? '<b>quinten.brosens@nova.be</b> (QHSE)<br><b>verantwoordelijke ploeg</b>' : '',
    's-insp-list');
}
