/* =====================================================================
 * Lingkungan DEMO — menjalankan Inti yang sama dengan server, tetapi data
 * disimpan di memori + localStorage. Dipakai saat CONFIG.MODE = 'demo'.
 * ===================================================================== */
(function (root) {
  'use strict';
  /* SHA-256 murni (sinkron) — setara Utilities.computeDigest di GAS */
  function sha256(teks) {
    var b = unescape(encodeURIComponent(String(teks))), K = sha256.K || (sha256.K = (function () {
      var k = [], n = 2, c = 0; function prima(x) { for (var i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; }
      while (c < 64) { if (prima(n)) { k.push((Math.pow(n, 1 / 3) % 1) * 4294967296 | 0); c++; } n++; } return k; })());
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19], l = b.length, w = [], i, j;
    var kata = []; for (i = 0; i < l; i++) kata[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
    kata[l >> 2] |= 0x80 << (24 - (l % 4) * 8); kata[((l + 8 >> 6) << 4) + 15] = l * 8;
    for (i = 0; i < kata.length; i += 16) {
      var a = H.slice();
      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = kata[i + j] | 0;
        else { var x = w[j - 15], y = w[j - 2]; w[j] = (((x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)) + w[j - 16] + ((y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ (y >>> 10)) + w[j - 7]) | 0; }
        var e = a[4], t1 = a[7] + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + ((e & a[5]) ^ (~e & a[6])) + K[j] + w[j];
        var aa = a[0], t2 = ((aa >>> 2 | aa << 30) ^ (aa >>> 13 | aa << 19) ^ (aa >>> 22 | aa << 10)) + ((aa & a[1]) ^ (aa & a[2]) ^ (a[1] & a[2]));
        a = [(t1 + t2) | 0].concat(a.slice(0, 7)); a[4] = (a[4] + t1) | 0;
      }
      for (j = 0; j < 8; j++) H[j] = (H[j] + a[j]) | 0;
    }
    return H.map(function (h) { return ('00000000' + (h >>> 0).toString(16)).slice(-8); }).join('');
  }
  var HURUF = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  function acak(n) {
    var o = '', buf = new Uint32Array(n);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(buf); else for (var i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 4294967296);
    for (var j = 0; j < n; j++) o += HURUF[buf[j] % HURUF.length];
    return o;
  }

  /* Basis data memori: perilaku sama dengan adaptor Sheets (angka → Number, lainnya → teks) */
  function MemDB(Inti, data) { this.Inti = Inti; this.t = data || {}; this.v = {}; this.berubah = false; }
  MemDB.prototype.norm = function (t, r) {
    var sk = this.Inti.SKEMA[t], o = {}, angka = sk.angka || [];
    sk.kolom.forEach(function (k) { if (r[k] === undefined) return; var v = r[k]; o[k] = angka.indexOf(k) >= 0 ? (v === '' || v == null ? 0 : Number(v) || 0) : (v == null ? '' : String(v)); });
    return o;
  };
  MemDB.prototype.semua = function (t, o) { var rows = this.t[t] || []; if (o && o.ekor) rows = rows.slice(-o.ekor); return rows.map(function (r) { return Object.assign({}, r); }); };
  MemDB.prototype._ubahVersi = function (t) { this.v[t] = (this.v[t] || 0) + 1; this.berubah = true; };
  MemDB.prototype.tambah = function (t, rows) {
    var self = this, sk = this.Inti.SKEMA[t], arr = this.t[t] = this.t[t] || [];
    rows.forEach(function (r) { var o = {}; sk.kolom.forEach(function (k) { o[k] = (sk.angka || []).indexOf(k) >= 0 ? 0 : ''; }); arr.push(Object.assign(o, self.norm(t, r))); });
    this._ubahVersi(t);
  };
  MemDB.prototype.ubah = function (t, rows) {
    var self = this, id = this.Inti.SKEMA[t].id, arr = this.t[t] = this.t[t] || [], idx = {};
    arr.forEach(function (r, i) { idx[r[id]] = i; });
    rows.forEach(function (r) { var i = idx[r[id]]; if (i === undefined) return; Object.assign(arr[i], self.norm(t, r)); });
    this._ubahVersi(t);
  };
  MemDB.prototype.ganti = function (t, rows) { this.t[t] = []; this.tambah(t, rows); };

  function buatEnv(Inti, o) {
    o = o || {};
    var db = new MemDB(Inti, o.data), cache = {}, rahasia = Object.assign({ PEPPER: 'demo-pepper', SYNC_SECRET: 'demo' }, o.rahasia || {}), berkas = o.berkas || {}, selisih = o.selisihMs || 0;
    var env = {
      mode: 'demo', db: db, berkas: berkas, rahasiaDemo: rahasia,
      sekarang: function () { return Date.now() + (env.selisihMs || 0); }, selisihMs: selisih,
      sha256: sha256, hmac: function (teks) { return sha256('hmac|' + rahasia.PEPPER + '|' + teks).slice(0, 43); },
      acak: acak, kunci: function (fn) { return fn(); },
      rahasia: function (k) { return rahasia[k] || ''; },
      cacheGet: function (k) { var c = cache[k]; if (!c || c.x < Date.now()) return null; return c.v; },
      cachePut: function (k, v, ttl) { cache[k] = { v: v, x: Date.now() + (ttl || 600) * 1000 }; },
      versiTabel: function (list) { return list.map(function (t) { return db.v[t] || 0; }).join('.'); },
      simpanBerkas: function (f) { var id = 'demo-' + acak(10); berkas[id] = { nama: f.nama, mime: f.mime, url: 'data:' + f.mime + ';base64,' + f.base64 }; return { id: id, url: berkas[id].url }; },
      urlBerkas: function (id) { return berkas[id] ? berkas[id].url : (/^assets\//.test(id) ? id : ''); },
      dispatchGitHub: function () { return { ok: true, langsung: true }; },
      emailKirim: function () { return { ok: true, respon: 'DEMO: email tidak benar-benar dikirim' }; },
      htmlKePdf: null
    };
    return env;
  }
  var api = { sha256: sha256, acak: acak, buatEnv: buatEnv, MemDB: MemDB };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DemoEnv = api;
})(typeof window !== 'undefined' ? window : globalThis);
