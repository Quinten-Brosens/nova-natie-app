/* Nova Natie App — Module: Open meldingen, detail & mijn meldingen */

var currentItemId = null;

function urgColor(u) {
  if (!u) return 'var(--accent2)';
  if (u.indexOf('Hoog') >= 0) return 'var(--nok)';
  if (u.indexOf('Gemiddeld') >= 0) return 'var(--accent2)';
  if (u.indexOf('tekortkoming') >= 0) return 'var(--nok)';
  return 'var(--ok)';
}

function openOpenList() { renderOpenList(); go('s-open'); }

function renderOpenList() {
  var arr = loadItems().filter(function (x) { return x.status === 'open'; });
  var c = document.getElementById('open-list'); c.innerHTML = '';
  if (arr.length === 0) {
    c.innerHTML = '<div class="empty">🎉 Geen open meldingen.<br>Alles is opgevolgd.</div>';
    return;
  }
  arr.forEach(function (m) {
    var col = urgColor(m.urgentie);
    var r = document.createElement('div'); r.className = 'list-row'; r.style.cursor = 'pointer';
    r.onclick = function () { openItem(m.id); };
    r.innerHTML = '<div class="dot" style="background:' + col + '"></div>' +
      '<div style="font-size:20px">' + (m.icon || '⚠️') + '</div>' +
      '<div class="tx"><b>' + escapeHtml(m.titel) + '</b><span>' + escapeHtml(m.urgentie) + ' · ' + relTime(m.datum) + '</span></div>' +
      '<div class="arrow" style="color:var(--muted);font-size:20px">›</div>';
    c.appendChild(r);
  });
}

function openItem(id) {
  currentItemId = id;
  var m = loadItems().filter(function (x) { return x.id === id; })[0];
  if (!m) { openOpenList(); return; }
  document.getElementById('item-title').textContent = m.type || 'Melding';
  var info = document.getElementById('item-info');
  info.innerHTML =
    '<div style="font-size:15px;color:var(--ink);font-weight:700;margin-bottom:8px">' + escapeHtml(m.titel) + '</div>' +
    row('Locatie', m.locatie) +
    row('Categorie', m.categorie) +
    row('Urgentie', m.urgentie) +
    row('Beschrijving', m.beschrijving) +
    row('Gemeld door', m.melder) +
    row('Datum', fmtDate(m.datum)) +
    (m.foto ? '<div style="margin-top:10px"><img src="' + m.foto + '" style="width:100%;border-radius:10px;border:1px solid var(--line)"></div>' : '');
  if (m.status === 'gesloten') {
    document.getElementById('item-solve').style.display = 'none';
    document.getElementById('item-cta').style.display = 'none';
    var cl = document.getElementById('item-closed');
    cl.style.display = 'block';
    cl.innerHTML = '<div class="ck-meta" style="margin:12px 0;border-left:4px solid var(--ok)">' +
      '<div style="color:var(--ok);font-weight:700;margin-bottom:6px">✓ Gesloten</div>' +
      row('Oplossing', m.oplossing) + row('Gesloten door', m.geslotenDoor) + row('Gesloten op', fmtDate(m.geslotenOp)) + '</div>';
  } else {
    document.getElementById('item-solve').style.display = 'block';
    document.getElementById('item-cta').style.display = 'block';
    document.getElementById('item-closed').style.display = 'none';
    document.getElementById('item-oplossing').value = '';
  }
  go('s-item');
}

function row(label, val) {
  return '<div style="margin:7px 0"><span style="color:var(--muted)">' + label + ':</span> <b style="color:var(--ink);font-weight:600">' + escapeHtml(val || '—') + '</b></div>';
}

function doCloseItem() {
  var opl = document.getElementById('item-oplossing').value.trim();
  if (!opl) { toast('Vul eerst een oplossing in'); return; }
  closeItem(currentItemId, opl);
  showSuccess('Melding gesloten',
    'De melding is afgehandeld en gemarkeerd als opgelost. Ze verschijnt nu onder "Mijn meldingen" als gesloten.',
    false, '', 's-open');
  nextAfterSuccess = 's-open';
}

function renderMine() {
  var arr = loadItems();
  var c = document.getElementById('mine-list'); c.innerHTML = '';
  if (arr.length === 0) { c.innerHTML = '<div class="empty">Nog geen meldingen.</div>'; return; }
  arr.forEach(function (m) {
    var open = m.status === 'open';
    var col = open ? urgColor(m.urgentie) : 'var(--ok)';
    var st = open ? 'Open' : 'Gesloten';
    var r = document.createElement('div'); r.className = 'list-row'; r.style.cursor = 'pointer';
    r.onclick = function () { openItem(m.id); };
    r.innerHTML = '<div style="font-size:20px">' + (m.icon || '⚠️') + '</div>' +
      '<div class="tx"><b>' + escapeHtml(m.titel) + '</b><span>' + relTime(m.datum) + '</span></div>' +
      '<span class="st" style="background:' + col + '22;color:' + col + '">' + st + '</span>';
    c.appendChild(r);
  });
}

/* Schermen verversen bij navigatie */
var _go = go;
go = function (id) {
  if (id === 's-mine') renderMine();
  if (id === 's-open') renderOpenList();
  if (id === 's-home') renderStats();
  _go(id);
};
