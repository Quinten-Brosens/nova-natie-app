/* Nova Natie App — Module: Onveilige situatie melden */

var currentPhotoData = null;

function openMelding() {
  currentPhotoData = null;
  document.getElementById('photo-in').value = '';
  document.getElementById('photo-cam').value = '';
  document.getElementById('photo-prev').style.display = 'none';
  document.getElementById('m-desc').value = '';
  document.querySelectorAll('#m-cat .chip,#m-urg .chip').forEach(c => c.classList.remove('sel'));
  go('s-melding');
}

function prevPhoto(e) {
  var f = e.target.files[0]; if (!f) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    var image = new Image();
    image.onload = function () {
      var max = 1000, w = image.width, h = image.height;
      if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
      else if (h >= w && h > max) { w = Math.round(w * max / h); h = max; }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(image, 0, 0, w, h);
      var BUDGET = 42000; // EmailJS-veldlimiet (~50KB) — marge houden
      var q = 0.7, data = canvas.toDataURL('image/jpeg', q);
      while (data.length > BUDGET && q > 0.3) { q -= 0.1; data = canvas.toDataURL('image/jpeg', q); }
      while (data.length > BUDGET && canvas.width > 400) {
        canvas.width = Math.round(canvas.width * 0.8);
        canvas.height = Math.round(canvas.height * 0.8);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        data = canvas.toDataURL('image/jpeg', 0.6);
      }
      currentPhotoData = data;
      var img = document.getElementById('photo-prev');
      img.src = currentPhotoData; img.style.display = 'block';
    };
    image.src = ev.target.result;
  };
  reader.readAsDataURL(f);
}

function submitMelding() {
  var desc = document.getElementById('m-desc').value.trim();
  var urg = document.querySelector('#m-urg .chip.sel');
  if (!desc) { toast('Vul een korte beschrijving in'); return; }
  if (!urg) { toast('Kies een urgentie'); return; }
  var loc = document.getElementById('m-loc').value;
  var melder = document.getElementById('m-name').value;
  var cat = document.querySelector('#m-cat .chip.sel');
  addItem({
    soort: 'melding', icon: '⚠️',
    type: 'Onveilige situatie', titel: 'Onveilige situatie — ' + loc,
    locatie: loc, categorie: cat ? cat.textContent : '—',
    urgentie: urg.textContent, beschrijving: desc, melder: melder,
    foto: currentPhotoData || ''
  });
  var catTxt = cat ? cat.textContent : '—';
  var recipients = ['quinten.brosens@nova.be'];
  if (urg.textContent === 'Hoog') recipients.push('jonas.dieu@nova.be');
  var htmlBody =
    '<div style="font-family:Arial,sans-serif;color:#284532">' +
    '<h2 style="color:#284532">⚠️ Onveilige situatie gemeld</h2>' +
    '<p><b>Categorie:</b> ' + escapeHtml(catTxt) + '<br>' +
    '<b>Locatie:</b> ' + escapeHtml(loc) + '<br>' +
    '<b>Urgentie:</b> ' + escapeHtml(urg.textContent) + '<br>' +
    '<b>Melder:</b> ' + escapeHtml(melder) + '</p>' +
    '<p><b>Beschrijving:</b><br>' + escapeHtml(desc).replace(/\n/g, '<br>') + '</p>' +
    '<hr><p style="font-size:12px;color:#88A595">Verzonden via de Nova Natie App</p></div>';
  sendGraphMail({
    to: recipients,
    subject: '[Nova HSEQ] Onveilige situatie — ' + loc + ' (' + urg.textContent + ')',
    html: htmlBody,
    photoDataUrl: currentPhotoData || ''
  }).catch(function (e) {
    console.warn('Graph mail fout:', e);
    toast('Mail versturen mislukt — melding is wel lokaal opgeslagen');
  });
  showSuccess('Melding verzonden',
    'Je melding is geregistreerd en doorgestuurd naar de QHSE-verantwoordelijke. Bij urgentie "Hoog" krijgt ook de leidinggevende meteen bericht.',
    true,
    '<b>quinten.brosens@nova.be</b> (QHSE)' + (urg.textContent === 'Hoog' ? '<br><b>jonas.dieu@nova.be</b> (General Manager Operations)' : ''),
    's-home');
}
