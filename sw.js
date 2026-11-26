/* Service worker Swim Academy — cache aset statis (bukan data API).
 * Naikkan VERSI bersamaan dengan ?v= di index.html setiap rilis. */
var VERSI = 'swimacademy-1.1.0';
var INTI = ['./', 'index.html', 'manifest.webmanifest', 'css/responsif.css?v=1.1.0', 'css/app.css?v=1.1.0',
  'js/config.js?v=1.1.0', 'js/inti.js?v=1.1.0', 'js/demo-env.js?v=1.1.0', 'js/demo-seed.js?v=1.1.0', 'js/responsif.js?v=1.1.0',
  'js/data.js?v=1.1.0', 'js/ui.js?v=1.1.0', 'js/app.js?v=1.1.0', 'js/hal-publik.js?v=1.1.0', 'js/hal-beranda.js?v=1.1.0', 'js/hal-siswa.js?v=1.1.0',
  'js/hal-operasional.js?v=1.1.0', 'js/hal-keuangan.js?v=1.1.0', 'js/hal-pengaturan.js?v=1.1.0', 'js/hal-portal.js?v=1.1.0',
  'assets/logo.svg', 'assets/favicon.svg', 'assets/ilustrasi/kosong.svg', 'assets/ilustrasi/masuk-1.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(INTI); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== VERSI; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;            // API GAS & font: langsung ke jaringan
  if (/config\/app-config\.json$/.test(u.pathname)) return;                            // snapshot publik selalu segar
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).catch(function () { return caches.match('index.html'); })); return; }
  e.respondWith(caches.match(e.request).then(function (r) {
    var jaringan = fetch(e.request).then(function (res) { if (res.ok) { var salin = res.clone(); caches.open(VERSI).then(function (c) { c.put(e.request, salin); }); } return res; });
    return r || jaringan;
  }));
});
