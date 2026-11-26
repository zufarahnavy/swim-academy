/* =====================================================================
 * LAPISAN DATA — satu pintu ke backend (live: fetch ke GAS; demo: Inti lokal)
 * Kontrak modul-responsif: baca dari cache seketika (SWR), segarkan di latar
 * tanpa bilah progres, render ulang diam bila data berubah; tulis membuang
 * cache. Ditambah pola gas-scale-turbo: dedupe permintaan identik, epoch tulis,
 * prefetch saat idle.
 * ===================================================================== */
(function (W) {
  'use strict';
  var C = W.CONFIG, MODE = C.MODE === 'live' && !/GANTI/.test(C.GAS_API_URL) ? 'live' : 'demo';
  var K_SESI = C.APP_ID + '_sesi', K_DEMO = C.APP_ID + '_demo_v1', K_CACHE = C.APP_ID + '_cache';

  /* ---------- Sesi ---------- */
  var Sesi = W.Sesi = {
    token: '', me: null, izin: [], hakVersi: 0, kedaluwarsa: 0,
    muat: function () { try { var s = JSON.parse(localStorage.getItem(K_SESI) || 'null'); if (s && s.kedaluwarsa > Date.now()) Object.assign(Sesi, s); else localStorage.removeItem(K_SESI); } catch (e) { } return !!Sesi.token; },
    simpan: function (d) { Sesi.token = d.token || Sesi.token; Sesi.me = d.me || Sesi.me; Sesi.izin = d.izin || Sesi.izin; Sesi.hakVersi = d.hakVersi != null ? d.hakVersi : Sesi.hakVersi; Sesi.kedaluwarsa = d.kedaluwarsa || Sesi.kedaluwarsa;
      try { localStorage.setItem(K_SESI, JSON.stringify({ token: Sesi.token, me: Sesi.me, izin: Sesi.izin, hakVersi: Sesi.hakVersi, kedaluwarsa: Sesi.kedaluwarsa })); } catch (e) { } },
    hapus: function () { Sesi.token = ''; Sesi.me = null; Sesi.izin = []; try { localStorage.removeItem(K_SESI); sessionStorage.removeItem(K_CACHE); } catch (e) { } API.bersihkan(); },
    punya: function (izin) { if (!Sesi.me) return false; if (Sesi.me.peran === 'owner') return true; return [].concat(izin).some(function (i) { return Sesi.izin.indexOf(i) >= 0; }); },
    peran: function () { return Sesi.me ? Sesi.me.peran : ''; }
  };

  /* ---------- Mode demo: Inti + data contoh di localStorage ---------- */
  var demoEnv = null, tSimpan = null;
  function siapkanDemo() {
    if (demoEnv) return demoEnv;
    var hariIni = Inti.util.tglWIB(Date.now()), simpanan = null;
    try { simpanan = JSON.parse(localStorage.getItem(K_DEMO) || 'null'); } catch (e) { }
    var segar = !simpanan || simpanan.versi !== Inti.VERSI || simpanan.tanggal !== hariIni || !simpanan.t || !simpanan.t.Siswa;
    demoEnv = DemoEnv.buatEnv(Inti, { data: segar ? null : simpanan.t, rahasia: segar ? null : simpanan.r, berkas: segar ? {} : (simpanan.b || {}) });
    if (segar) { DemoSeed.seed(Inti, demoEnv); simpanDemo(true); }
    return demoEnv;
  }
  function simpanDemo(segera) {
    clearTimeout(tSimpan);
    var tulis = function () { try { var r = {}, b = {}, uk = 0; Object.keys(demoEnv.berkas).reverse().forEach(function (k) { var u = demoEnv.berkas[k].url.length; if (uk + u < 1500000) { b[k] = demoEnv.berkas[k]; uk += u; } }); localStorage.setItem(K_DEMO, JSON.stringify({ versi: Inti.VERSI, tanggal: Inti.util.tglWIB(Date.now()), t: demoEnv.db.t, r: r, b: b })); demoEnv.db.berubah = false; } catch (e) { } };
    if (segera) tulis(); else tSimpan = setTimeout(tulis, 300);
  }
  function lewatDemo(action, payload, tulis) {
    var env = siapkanDemo();
    return new Promise(function (ok) {
      setTimeout(function () {
        var r = Inti.jalankan(env, { action: action, payload: JSON.parse(JSON.stringify(payload || {})), token: Sesi.token });
        if (env.db.berubah) simpanDemo();
        ok(JSON.parse(JSON.stringify(r)));
      }, tulis ? 260 + Math.random() * 180 : 50 + Math.random() * 70);
    });
  }

  /* ---------- Mode live: fetch POST text/plain (tanpa preflight CORS) ---------- */
  function lewatLive(action, payload, ulang) {
    var ac = W.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ac) ac.abort(); }, 45000);
    return fetch(C.GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, payload: payload || {}, token: Sesi.token }), redirect: 'follow', signal: ac ? ac.signal : undefined })
      .then(function (r) { clearTimeout(t); return r.json(); })
      .catch(function (er) {
        clearTimeout(t);
        if (ulang) return new Promise(function (ok) { setTimeout(ok, 700); }).then(function () { return lewatLive(action, payload, false); });
        throw { message: navigator.onLine === false ? 'Tidak ada koneksi internet. Periksa jaringan Anda.' : 'Server tidak dapat dihubungi. Coba lagi sebentar lagi.', code: 'NETWORK' };
      });
  }

  /* ---------- Satu-satunya pintu ---------- */
  var BACA = /^(auth\.saya|pub\.|dash\.|analitik\.|daftar\.(link|masuk)List|siswa\.(list|detail)|jadwal\.list|absensi\.(hari|riwayat|bukaKunciList)|materi\.list|kas\.list|honor\.|tutup\.list|atur\.ambil|owner\.harga$|hak\.ambil|akun\.list|log\.|berkas\.)/;
  function panggil(action, payload, o) {
    o = o || {}; if (!o.diam && W.MR) MR.Muat.mulai();
    var tulis = !BACA.test(action), p = MODE === 'demo' ? lewatDemo(action, payload, tulis) : lewatLive(action, payload, !tulis);
    return p.then(function (res) {
      if (!o.diam && W.MR) MR.Muat.selesai();
      amati(res, action);
      if (!res.ok) { var e = res.error || {}; throw { message: e.message || 'Terjadi kesalahan.', code: e.code, fields: e.fields, data: e.data }; }
      return res.data;
    }, function (er) { if (!o.diam && W.MR) MR.Muat.selesai(); throw er; });
  }
  var tIzin = null;
  function amati(res, action) {
    if (res.error && res.error.code === 'AUTH' && Sesi.token && action !== 'auth.masuk') { Sesi.hapus(); if (W.App) App.keluar('Sesi Anda berakhir. Silakan masuk kembali.'); return; }
    if (res.hv != null && Sesi.me && res.hv !== Sesi.hakVersi) { clearTimeout(tIzin); tIzin = setTimeout(API.segarkanIzin, 50); }
  }

  /* ---------- Cache SWR + dedupe + epoch ---------- */
  var Cache = {}, Jalan = {}, epoch = 0, tCache = null, selisihServer = 0;
  try { var cs = JSON.parse(sessionStorage.getItem(K_CACHE) || 'null'); if (cs && cs.token) Cache = cs.c || {}; } catch (e) { }
  function simpanCache() { clearTimeout(tCache); tCache = setTimeout(function () { try { var o = {}; Object.keys(Cache).slice(-40).forEach(function (k) { o[k] = Cache[k]; }); sessionStorage.setItem(K_CACHE, JSON.stringify({ token: Sesi.token, c: o })); } catch (e) { } }, 500); }
  function kunci(action, payload) { return action + '|' + JSON.stringify(payload || {}); }
  function ambil(k, action, payload, o) {
    var ik = epoch + '|' + k;
    if (Jalan[ik]) return Jalan[ik];
    var p = panggil(action, payload, o).then(function (d) { Cache[k] = { d: d, t: Date.now(), h: JSON.stringify(d) }; simpanCache(); return d; });
    Jalan[ik] = p; var bersih = function () { delete Jalan[ik]; }; p.then(bersih, bersih);
    return p;
  }
  var API = W.API = {
    mode: MODE,
    panggil: panggil,
    Q: function (action, payload, o) {
      o = o || {}; var k = kunci(action, payload), c = Cache[k];
      if (c && !o.segar) {
        if (Date.now() - c.t > (o.umur || 30000)) ambil(k, action, payload, { diam: true }).then(function (d) { if (JSON.stringify(d) !== c.h && W.MR) MR.Router.segarkanDiam(); }).catch(function () { });
        return Promise.resolve(c.d);
      }
      return ambil(k, action, payload, o);
    },
    T: function (action, payload) { epoch++; return panggil(action, payload).then(function (d) { Cache = {}; simpanCache(); return d; }); },
    tersimpan: function (action, payload) { var c = Cache[kunci(action, payload)]; return c ? c.d : null; },
    bersihkan: function () { Cache = {}; epoch++; try { sessionStorage.removeItem(K_CACHE); } catch (e) { } },
    prefetch: function (daftar) {
      var jalan = function () { daftar.forEach(function (x, i) { setTimeout(function () { var k = kunci(x[0], x[1]); if (!Cache[k]) ambil(k, x[0], x[1], { diam: true }).catch(function () { }); }, i * 120); }); };
      if (W.requestIdleCallback) requestIdleCallback(jalan, { timeout: 1500 }); else setTimeout(jalan, 400);
    },
    segarkanIzin: function () {
      if (!Sesi.token) return;
      panggil('auth.saya', {}, { diam: true }).then(function (d) {
        var lama = Sesi.izin.join(',');
        Sesi.simpan({ me: d.me, izin: d.izin, hakVersi: d.hakVersi });
        if (lama !== d.izin.join(',') && W.App) { App.bangunMenu(); MR.UI.toast('Hak akses Anda diperbarui oleh Owner.', 'info'); MR.Router.tampilkan({ diam: true }); }
      }).catch(function () { });
    },
    berkas: function (url) {
      if (!url) return Promise.resolve('');
      if (url.indexOf('berkas:') !== 0) return Promise.resolve(url);
      return API.Q('berkas.ambil', { id: url.slice(7) }, { umur: 3600000 }).then(function (b) { return 'data:' + b.mime + ';base64,' + b.base64; });
    },
    resetDemo: function () { try { localStorage.removeItem(K_DEMO); } catch (e) { } demoEnv = null; API.bersihkan(); },
    jamServer: function () { return MODE === 'demo' && demoEnv ? demoEnv.sekarang() : Date.now() + selisihServer; },
    setJamServer: function (ms) { if (MODE === 'live' && ms) selisihServer = Number(ms) - Date.now(); }
  };
})(window);
