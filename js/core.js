/* Nova Natie App — Navigatie & gedeelde UI-helpers */

var current = 's-login';
var nextAfterSuccess = 's-home';

function go(id) {
  document.getElementById(current).classList.remove('active');
  document.getElementById(id).classList.add('active');
  current = id;
  document.querySelector('#' + id + ' .scroll')?.scrollTo(0, 0);
}

function soon(name) {
  toast(name + ' — module volgt in volgende fase');
}

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._tt);
  window._tt = setTimeout(function () { t.classList.remove('show'); }, 2200);
}

function pick(el, group) {
  var multi = (group === 'm-cat');
  if (!multi) {
    document.querySelectorAll('#' + group + ' .chip').forEach(c => c.classList.remove('sel'));
  }
  el.classList.toggle('sel');
}

function fmtDate(iso) {
  var d = new Date(iso);
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear() +
    ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}

function relTime(iso) {
  var diff = (new Date() - new Date(iso)) / 1000;
  if (diff < 60) return 'Zojuist';
  if (diff < 3600) return Math.floor(diff / 60) + ' min geleden';
  if (diff < 86400) return Math.floor(diff / 3600) + ' u geleden';
  return Math.floor(diff / 86400) + ' dag(en) geleden';
}

function showSuccess(title, text, showMail, mailto, next) {
  document.getElementById('suc-title').textContent = title;
  document.getElementById('suc-text').textContent = text;
  var mb = document.getElementById('suc-mail');
  if (showMail) {
    mb.style.display = 'block';
    document.getElementById('suc-mailto').innerHTML = mailto;
  } else {
    mb.style.display = 'none';
  }
  nextAfterSuccess = next;
  document.getElementById('success').classList.add('show');
}

function afterSuccess() {
  document.getElementById('success').classList.remove('show');
  go(nextAfterSuccess);
}
