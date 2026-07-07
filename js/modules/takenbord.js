/* Nova Natie App — Module: Takenbord
   Opslag is PER GEBRUIKER (nova_tasks_<email>) — elke gebruiker ziet enkel z'n eigen taken.
   De begindata (TB_INIT) hoort bij Quinten en wordt alleen voor hem geladen; andere
   gebruikers starten met een leeg bord. */

var TB_OWNER = 'quinten.brosens@nova.be';   // eigenaar van de begindata
var TB_LEGACY_KEY = 'nova_tasks_v4';         // oude gedeelde sleutel (eenmalige migratie voor eigenaar)

var TB_SECTIONS = ['Active', 'Waiting On', 'Someday', 'Done'];
var TB_LABELS = { 'Active': 'Actief', 'Waiting On': 'Wacht', 'Someday': 'Ooit', 'Done': 'Klaar' };
var TB_ICONS  = { 'Active': '✅', 'Waiting On': '⏳', 'Someday': '💡', 'Done': '☑️' };

// Begindata — nieuwe taken worden enkel toegevoegd als ze nog niet bestaan (merge via id)
var TB_INIT = {
  sections: TB_SECTIONS,
  tasks: {
    'Active': [
      {id:1,  title:'Prompt uit oude Claude account overnemen', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:2,  title:'Toolbox organiseren over het gebruik van radioposten', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:3,  title:'Fotoshoot Sioen voorbereiden', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:4,  title:'Feedback van Cepa verwerken over de analyse van projectlading', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:5,  title:'Feedback van Cepa verwerken over onze werkvoorbereidingen', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:7,  title:'Bespreking met CEPA (Katrien Sels) over onthaal', note:'', done:false, beschrijving:'', betrokkenen:['Katrien Sels'], bijlagen:[], source:'claude'},
      {id:8,  title:'Uitwerken plannerstool', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:9,  title:'Opmaken werkvoorbereidingen', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:10, title:'Updaten werkvoorbereidingen', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:11, title:'Opmaken maandverslag', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:12, title:'Updaten maandverslag', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'},
      {id:13, title:'Opmaken scheduled task: na einde werkdag door mailbox gaan om te bekijken welke zaken opgenomen kunnen worden in het maandverslag', note:'', done:false, beschrijving:'', betrokkenen:[], bijlagen:[], source:'claude'}
    ],
    'Waiting On': [
      {id:6, title:'Bekijken hoeveel radioposten we nu hebben', note:'since 2026-06-19', badge:'Nick Carreno', done:false, beschrijving:'', betrokkenen:['Nick Carreno'], bijlagen:[], source:'claude'}
    ],
    'Someday': [],
    'Done': []
  }
};

var tbData = null;
var tbLoadedFor = null;      // e-mail waarvoor tbData geladen is
var tbCurrentSection = 'Active';
var tbCurrentTaskId = null;
var tbNextId = 100;

/* ---- Laden & opslaan (per gebruiker) ---- */
function tbKey() {
  return 'nova_tasks_' + (currentUser ? currentUser.email : 'anon');
}

function tbEmptyBoard() {
  return { sections: TB_SECTIONS, tasks: { 'Active': [], 'Waiting On': [], 'Someday': [], 'Done': [] } };
}

function tbLoad() {
  var stored = null;
  try { var s = localStorage.getItem(tbKey()); if (s) stored = JSON.parse(s); } catch (e) {}

  if (stored) {
    tbData = stored;
  } else if (currentUser && currentUser.email === TB_OWNER) {
    // Eigenaar: eenmalige migratie van het oude gedeelde bord, anders de begindata
    var legacy = null;
    try { var l = localStorage.getItem(TB_LEGACY_KEY); if (l) legacy = JSON.parse(l); } catch (e) {}
    tbData = legacy || JSON.parse(JSON.stringify(TB_INIT));
  } else {
    // Andere gebruikers starten met een leeg bord
    tbData = tbEmptyBoard();
  }

  TB_SECTIONS.forEach(function(sec) { if (!tbData.tasks[sec]) tbData.tasks[sec] = []; });
  tbNextId = Math.max.apply(null, [99].concat(TB_SECTIONS.flatMap(function(sec) { return tbData.tasks[sec].map(function(t) { return t.id; }); }))) + 1;
  tbSave();
}

function tbEnsureLoaded() {
  var email = currentUser ? currentUser.email : null;
  if (tbData && tbLoadedFor === email) return;
  tbLoad();
  tbLoadedFor = email;
}

function tbSave() {
  try { localStorage.setItem(tbKey(), JSON.stringify(tbData)); } catch (e) { toast('⚠️ Opslag vol'); }
}

function tbFindTask(id) {
  for (var i = 0; i < TB_SECTIONS.length; i++) {
    var sec = TB_SECTIONS[i];
    var task = (tbData.tasks[sec] || []).find(function(t) { return t.id === id; });
    if (task) return { task: task, section: sec };
  }
  return null;
}

/* ---- Navigatie ---- */
function openTakenbord() {
  tbEnsureLoaded();
  tbCurrentSection = 'Active';
  tbRender();
  go('s-taken');
}

function tbUpdateHomeBadge() {
  if (!currentUser) return;
  tbEnsureLoaded();
  var act = (tbData.tasks['Active'] || []).filter(function(t) { return !t.done; }).length;
  var b = document.getElementById('tb-home-badge');
  if (b) {
    if (act > 0) { b.style.display = 'inline-block'; b.textContent = act; }
    else { b.style.display = 'none'; }
  }
  var pill = document.getElementById('tb-topbar-count');
  if (pill) pill.textContent = act + ' actief';
}

/* ---- Renderen ---- */
function tbRender() {
  tbRenderTabs();
  tbRenderList();
  tbUpdateHomeBadge();
}

function tbRenderTabs() {
  var c = document.getElementById('tb-tabs'); if (!c) return;
  c.innerHTML = '';
  TB_SECTIONS.forEach(function(sec) {
    var cnt = (tbData.tasks[sec] || []).length;
    var btn = document.createElement('button');
    btn.className = 'tb-tab' + (sec === tbCurrentSection ? ' active' : '');
    btn.innerHTML = TB_ICONS[sec] + ' ' + TB_LABELS[sec] + (cnt ? ' <span class="tb-count">' + cnt + '</span>' : '');
    btn.onclick = function() { tbCurrentSection = sec; tbRender(); };
    c.appendChild(btn);
  });
}

function tbRenderList() {
  var c = document.getElementById('tb-list'); if (!c) return;
  c.innerHTML = '';
  var tasks = tbData.tasks[tbCurrentSection] || [];
  if (!tasks.length) {
    c.innerHTML = '<div class="empty">Geen taken in deze kolom.</div>';
    return;
  }
  tasks.forEach(function(task) {
    var row = document.createElement('div');
    row.className = 'list-row' + (task.done ? ' tb-done' : '');

    var cb = document.createElement('div');
    cb.className = 'tb-cb' + (task.done ? ' chk' : '');
    cb.onclick = (function(t) { return function(e) { e.stopPropagation(); tbToggleDone(t); }; })(task);

    var tx = document.createElement('div');
    tx.className = 'tx';
    var meta = '';
    if (task.badge) meta += '<span class="tb-badge">' + escapeHtml(task.badge) + '</span> ';
    (task.betrokkenen || []).forEach(function(p) { meta += '<span class="tb-person">👤 ' + escapeHtml(p) + '</span> '; });
    var nBijl = (task.bijlagen || []).length;
    if (nBijl) meta += '<span class="tb-person">📎 ' + nBijl + '</span> ';
    tx.innerHTML =
      '<b style="' + (task.done ? 'text-decoration:line-through;color:var(--muted)' : '') + '">' + escapeHtml(task.title) + '</b>' +
      (task.note ? '<span>' + escapeHtml(task.note) + '</span>' : '') +
      (meta ? '<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">' + meta + '</div>' : '');

    var arr = document.createElement('div');
    arr.className = 'arrow'; arr.textContent = '›';

    row.onclick = (function(id) { return function() { tbOpenDetail(id); }; })(task.id);
    row.appendChild(cb); row.appendChild(tx); row.appendChild(arr);
    c.appendChild(row);
  });
}

/* ---- Detail ---- */
function tbOpenDetail(id) {
  var found = tbFindTask(id); if (!found) return;
  var task = found.task;
  tbCurrentTaskId = id;
  document.getElementById('tb-detail-title').textContent = task.title;
  document.getElementById('tb-d-title').value = task.title;
  document.getElementById('tb-d-desc').value = task.beschrijving || '';
  document.getElementById('tb-d-note').value = task.note || '';
  tbRefreshPersonTags(task.betrokkenen || []);
  tbRenderBijlagen(task.bijlagen || []);
  var moveRow = document.getElementById('tb-move-row');
  moveRow.innerHTML = '';
  TB_SECTIONS.forEach(function(sec) {
    var btn = document.createElement('button');
    btn.className = 'chip' + (sec === found.section ? ' sel' : '');
    btn.textContent = TB_LABELS[sec];
    btn.onclick = (function(s) { return function() { tbMoveTask(id, s); }; })(sec);
    moveRow.appendChild(btn);
  });
  go('s-taken-detail');
}

function tbRefreshPersonTags(people) {
  var c = document.getElementById('tb-person-tags'); if (!c) return;
  c.innerHTML = people.map(function(p, i) {
    return '<div style="display:flex;align-items:center;gap:4px;background:rgba(40,69,50,.1);color:var(--navy);border-radius:6px;padding:4px 10px;font-size:13px">' +
      escapeHtml(p) + ' <span style="cursor:pointer;color:var(--muted);margin-left:4px" onclick="tbRemovePerson(' + i + ')">×</span></div>';
  }).join('');
}

function tbAddPerson() {
  var inp = document.getElementById('tb-person-inp');
  var name = inp.value.trim(); if (!name) return;
  var found = tbFindTask(tbCurrentTaskId); if (!found) return;
  if (!found.task.betrokkenen) found.task.betrokkenen = [];
  if (!found.task.betrokkenen.includes(name)) { found.task.betrokkenen.push(name); tbSave(); tbRefreshPersonTags(found.task.betrokkenen); }
  inp.value = '';
}

function tbRemovePerson(idx) {
  var found = tbFindTask(tbCurrentTaskId); if (!found) return;
  found.task.betrokkenen.splice(idx, 1);
  tbSave();
  tbRefreshPersonTags(found.task.betrokkenen);
}

/* ---- Bijlagen ---- */
function tbFmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function tbRenderBijlagen(list) {
  var c = document.getElementById('tb-bijlagen'); if (!c) return;
  list = list || [];
  c.innerHTML = list.map(function(b, i) {
    var isImg = (b.type || '').indexOf('image') === 0;
    var thumb = isImg
      ? '<img src="' + b.data + '" style="width:34px;height:34px;object-fit:cover;border-radius:6px;flex-shrink:0">'
      : '<span style="font-size:22px;flex-shrink:0">📄</span>';
    return '<div class="tb-bijlage">' +
      '<div onclick="tbOpenBijlage(' + i + ')" style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;min-width:0">' +
        thumb +
        '<div style="min-width:0">' +
          '<b style="display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(b.name) + '</b>' +
          '<span style="font-size:11px;color:var(--muted)">' + tbFmtSize(b.size) + '</span>' +
        '</div>' +
      '</div>' +
      '<span onclick="tbRemoveBijlage(' + i + ')" style="cursor:pointer;color:var(--nok);padding:6px 10px;font-size:18px;flex-shrink:0">×</span>' +
    '</div>';
  }).join('');
}

function tbAddBijlage(e) {
  var files = Array.prototype.slice.call(e.target.files || []);
  var found = tbFindTask(tbCurrentTaskId); if (!found) return;
  if (!found.task.bijlagen) found.task.bijlagen = [];
  files.forEach(function(f) {
    if (f.size > 2 * 1024 * 1024) { toast('⚠️ "' + f.name + '" is te groot (max 2 MB)'); return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      found.task.bijlagen.push({ name: f.name, type: f.type, size: f.size, data: ev.target.result });
      try { tbSave(); } catch (err) { toast('⚠️ Opslag vol — bijlage niet bewaard'); found.task.bijlagen.pop(); }
      tbRenderBijlagen(found.task.bijlagen);
    };
    reader.readAsDataURL(f);
  });
  e.target.value = '';
}

function tbRemoveBijlage(idx) {
  var found = tbFindTask(tbCurrentTaskId); if (!found) return;
  found.task.bijlagen.splice(idx, 1);
  tbSave();
  tbRenderBijlagen(found.task.bijlagen);
}

function tbOpenBijlage(idx) {
  var found = tbFindTask(tbCurrentTaskId); if (!found) return;
  var b = found.task.bijlagen[idx]; if (!b) return;
  var w = window.open('', '_blank');
  if (w) {
    w.document.title = b.name;
    w.document.body.style.margin = '0';
    w.document.body.innerHTML = '<iframe src="' + b.data + '" style="border:0;width:100vw;height:100vh"></iframe>';
  } else {
    toast('Sta pop-ups toe om de bijlage te openen');
  }
}

function tbSaveDetail() {
  var found = tbFindTask(tbCurrentTaskId); if (!found) return;
  var task = found.task;
  task.title = document.getElementById('tb-d-title').value.trim() || task.title;
  task.beschrijving = document.getElementById('tb-d-desc').value || '';
  task.note = document.getElementById('tb-d-note').value.trim() || '';
  tbSave(); toast('✓ Opgeslagen'); tbRender(); go('s-taken');
}

function tbDeleteTask() {
  if (!confirm('Taak verwijderen?')) return;
  for (var i = 0; i < TB_SECTIONS.length; i++) {
    var sec = TB_SECTIONS[i];
    var idx = (tbData.tasks[sec] || []).findIndex(function(t) { return t.id === tbCurrentTaskId; });
    if (idx !== -1) { tbData.tasks[sec].splice(idx, 1); break; }
  }
  tbSave(); tbRender(); go('s-taken');
}

function tbToggleDone(task) {
  task.done = !task.done;
  var found = tbFindTask(task.id);
  if (found) {
    if (task.done && found.section !== 'Done') {
      // Afgevinkt → automatisch naar "Klaar"
      task._prevSection = found.section;
      tbData.tasks[found.section] = tbData.tasks[found.section].filter(function(t) { return t.id !== task.id; });
      (tbData.tasks['Done'] = tbData.tasks['Done'] || []).unshift(task);
    } else if (!task.done && found.section === 'Done') {
      // Weer open → terug naar vorige kolom (of Actief)
      var back = task._prevSection && found.section !== task._prevSection ? task._prevSection : 'Active';
      tbData.tasks['Done'] = tbData.tasks['Done'].filter(function(t) { return t.id !== task.id; });
      (tbData.tasks[back] = tbData.tasks[back] || []).unshift(task);
    }
  }
  tbSave();
  tbRender();
}

function tbMoveTask(taskId, toSection) {
  var found = tbFindTask(taskId); if (!found || found.section === toSection) return;
  tbData.tasks[found.section] = tbData.tasks[found.section].filter(function(t) { return t.id !== taskId; });
  (tbData.tasks[toSection] = tbData.tasks[toSection] || []).unshift(found.task);
  tbSave();
  document.querySelectorAll('#tb-move-row .chip').forEach(function(btn, i) {
    btn.classList.toggle('sel', TB_SECTIONS[i] === toSection);
  });
  toast('Verplaatst naar ' + TB_LABELS[toSection]);
}

/* ---- Taak toevoegen ---- */
function tbShowAdd() {
  var existing = document.getElementById('tb-add-row');
  if (existing) { existing.remove(); return; }
  var div = document.createElement('div');
  div.id = 'tb-add-row';
  div.className = 'list-row';
  div.style.gap = '10px';
  div.innerHTML =
    '<input id="tb-quick-inp" type="text" placeholder="Nieuwe taak…" ' +
    'style="flex:1;border:none;background:transparent;font-size:15px;font-family:inherit;color:var(--ink);outline:none">' +
    '<button onclick="tbConfirmAdd()" style="background:var(--navy);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap">Toevoegen</button>';
  var list = document.getElementById('tb-list');
  if (list) list.insertBefore(div, list.firstChild);
  var inp = document.getElementById('tb-quick-inp');
  if (inp) {
    inp.focus();
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') tbConfirmAdd();
      if (e.key === 'Escape') div.remove();
    });
  }
}

function tbConfirmAdd() {
  var inp = document.getElementById('tb-quick-inp');
  if (!inp || !inp.value.trim()) return;
  var sec = tbCurrentSection === 'Done' ? 'Active' : tbCurrentSection;
  (tbData.tasks[sec] = tbData.tasks[sec] || []).push({
    id: tbNextId++, title: inp.value.trim(), note: '', done: false,
    beschrijving: '', betrokkenen: [], bijlagen: [], source: 'user'
  });
  tbSave(); toast('Taak toegevoegd');
  if (tbCurrentSection === 'Done') tbCurrentSection = 'Active';
  tbRender();
}

/* ---- Import / export (overzetten losstaand bord ↔ app, per gebruiker) ---- */
function tbExport() {
  tbEnsureLoaded();
  var naam = currentUser ? currentUser.email.split('@')[0] : 'takenbord';
  var blob = new Blob([JSON.stringify(tbData, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'takenbord-' + naam + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  toast('Takenbord geëxporteerd');
}

function tbImportPrompt() {
  document.getElementById('tb-import-in').click();
}

function tbImport(e) {
  var f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var incoming;
    try { incoming = JSON.parse(ev.target.result); } catch (err) { toast('⚠️ Ongeldig bestand'); return; }
    if (!incoming || !incoming.tasks) { toast('⚠️ Geen geldig takenbord'); return; }
    tbEnsureLoaded();
    var ids = new Set(TB_SECTIONS.flatMap(function(sec) { return tbData.tasks[sec].map(function(t) { return t.id; }); }));
    var added = 0;
    TB_SECTIONS.forEach(function(sec) {
      (incoming.tasks[sec] || []).forEach(function(t) {
        if (!ids.has(t.id)) { tbData.tasks[sec].push(t); ids.add(t.id); added++; }
      });
    });
    tbNextId = Math.max.apply(null, [tbNextId].concat(TB_SECTIONS.flatMap(function(sec) {
      return tbData.tasks[sec].map(function(t) { return typeof t.id === 'number' ? t.id : 0; });
    }))) + 1;
    tbSave();
    tbRender();
    toast(added ? (added + ' taak/taken geïmporteerd') : 'Alles was al aanwezig');
  };
  reader.readAsText(f);
}

/* ---- Hook in go() override ---- */
var _tbGo = go;
go = function(id) {
  if ((id === 's-dept' || id === 's-home') && currentUser) tbUpdateHomeBadge();
  if (id === 's-taken' && tbData) tbRender();
  _tbGo(id);
};
