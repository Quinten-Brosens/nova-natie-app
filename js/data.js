/* Nova Natie App — localStorage helpers & live tellers */

function storeKey() {
  return 'nova_items_' + (currentUser ? currentUser.email : 'anon');
}

function loadItems() {
  try { return JSON.parse(localStorage.getItem(storeKey()) || '[]'); } catch (e) { return []; }
}

function saveItems(arr) {
  localStorage.setItem(storeKey(), JSON.stringify(arr));
}

function addItem(it) {
  var arr = loadItems();
  it.id = 'it' + new Date().getTime() + Math.floor(Math.random() * 1000);
  it.datum = new Date().toISOString();
  it.status = 'open';
  arr.unshift(it);
  saveItems(arr);
  renderStats();
}

function closeItem(id, oplossing) {
  var arr = loadItems();
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].id === id) {
      arr[i].status = 'gesloten';
      arr[i].oplossing = oplossing;
      arr[i].geslotenDoor = currentUser.naam;
      arr[i].geslotenOp = new Date().toISOString();
    }
  }
  saveItems(arr);
  renderStats();
}

function renderStats() {
  var arr = loadItems();
  var open = arr.filter(function (x) { return x.status === 'open'; }).length;
  var weekAgo = new Date() - 7 * 86400 * 1000;
  var week = arr.filter(function (x) { return new Date(x.datum) >= weekAgo; }).length;
  var anchor = localStorage.getItem('nova_anchor_' + (currentUser ? currentUser.email : ''));
  var days = anchor ? Math.floor((new Date() - new Date(anchor)) / 86400000) : 0;
  document.getElementById('st-open').textContent = open;
  document.getElementById('st-week').textContent = week;
  document.getElementById('st-days').textContent = days;
  var b = document.getElementById('badge-open');
  if (open > 0) { b.style.display = 'inline-block'; b.textContent = open; } else { b.style.display = 'none'; }
}
