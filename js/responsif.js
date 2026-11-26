/* berkas: js/responsif.js — mesin modul-responsif v1.0.0 (tidak diubah per app) */
/* =====================================================================
 * MODUL RESPONSIF — js/responsif.js (v1.0.0, dari Capten Care v2.1.0)
 * Mesin rasa instan: progres atas, toast, modal/laci, tombol kerja,
 * skeleton tertunda, router instan, shell HP/desktop, pintasan, grafik.
 * Tanpa framework & tanpa CDN. Muat dengan <script defer>.
 * Berkas ini TIDAK diubah per app; konfigurasi lewat MR.* di app.js.
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var MR = W.MR = W.MR || {};

  /* ===================== 1. UTILITAS ===================== */
  function qs(s, el) { return (el || D).querySelector(s); }
  function qsa(s, el) { return Array.prototype.slice.call((el || D).querySelectorAll(s)); }
  var U = {
    e: function (s) { return s == null ? '' : String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    debounce: function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; },
    gerakDikurangi: function () { return (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches) || D.documentElement.dataset.animasi === 'mati'; }
  };
  /* Preferensi per perangkat. GANTI awalan per app: banyak app di satu domain github.io berbagi localStorage. */
  var Pref = {
    awalan: 'mr_',
    ambil: function (k, d) { try { var v = localStorage.getItem(this.awalan + k); return v == null ? d : v; } catch (e) { return d; } },
    simpan: function (k, v) { try { localStorage.setItem(this.awalan + k, String(v)); } catch (e) { } }
  };

  /* ===================== 2. PROGRES ATAS ===================== */
  /* Menghitung panggilan bertumpuk agar tidak berkedip. [perbaikan] bergerak dengan transform, bukan width. */
  var Muat = {
    n: 0, el: null, t: null, p: 0,
    _set: function (p) { this.p = p; this.el.style.transform = 'translate3d(' + (p - 100) + '%,0,0)'; },
    mulai: function () {
      this.n++; if (this.n > 1) return;
      var el = this.el || (this.el = qs('#progres')); if (!el) return;
      clearTimeout(this.t); el.style.transition = 'none'; this._set(0); void el.offsetWidth; el.style.transition = '';
      el.classList.add('jalan'); this._set(18);
      var self = this;
      (function maju() { self.t = setTimeout(function () { if (self.n <= 0) return; self._set(Math.min(92, self.p + (92 - self.p) * .18)); maju(); }, 260); })();
    },
    selesai: function () {
      this.n = Math.max(0, this.n - 1); if (this.n) return;
      var el = this.el, self = this; if (!el) return;
      clearTimeout(this.t); this._set(100);
      this.t = setTimeout(function () { el.classList.remove('jalan'); self.t = setTimeout(function () { if (!self.n) { el.style.transition = 'none'; self._set(0); } }, 300); }, 220);
    }
  };

  /* ===================== 3. LAYAR PEMBUKA & PEMUAT ===================== */
  /* MR.logo = path logo app. MR.garisPemuat = path SVG garis denyut (panjang ±320); bawaan: garis EKG. */
  function htmlPemuat(teks, sub) {
    return '<div class="pemuat"><div class="orbit"><svg class="jejak" viewBox="0 0 74 74"><circle cx="37" cy="37" r="34"/></svg><svg class="cincin" viewBox="0 0 74 74"><circle cx="37" cy="37" r="34"/></svg><div class="inti"><img src="' + U.e(MR.logo || 'assets/logo.svg') + '" alt=""></div></div>' +
      '<svg class="ekg" viewBox="0 0 180 36"><path d="' + U.e(MR.garisPemuat || 'M0 18h52l6-10 8 22 7-28 7 24 5-8h95') + '"/></svg>' +
      (teks ? '<div class="teks-muat">' + U.e(teks) + (sub ? '<span>' + U.e(sub) + '</span>' : '') + '</div>' : '') + '</div>';
  }
  var Layar = {
    tampil: function (teks, sub) { var el = qs('#layar-awal'); if (!el) return; el.classList.remove('hilang'); el.innerHTML = htmlPemuat(teks, sub); },
    sembunyikan: function () { var el = qs('#layar-awal'); if (el && !el.classList.contains('hilang')) el.classList.add('hilang'); }
  };

  /* ===================== 4. KOMPONEN UMPAN BALIK ===================== */
  var tumpukan = [];   // modal/laci yang terbuka, teratas di akhir
  var UI = {
    /* GANTI dengan sprite ikon app, mis. function (n) { return '<svg class="ik"><use href="#i-' + n + '"/></svg>'; } */
    ikon: function () { return '<span class="ik-titik" aria-hidden="true"></span>'; },

    toast: function (pesan, jenis, o) {
      o = o || {}; var w = qs('#toast'); if (!w) return null; jenis = jenis || 'info';
      var nama = { ok: 'circle-check', bahaya: 'circle-x', warn: 'triangle-alert', info: 'info' }[jenis] || 'info';
      var dur = o.durasi || (jenis === 'bahaya' ? 6000 : 3600), t = null;
      var el = D.createElement('div'); el.className = 'toast ' + jenis; el.setAttribute('role', jenis === 'bahaya' ? 'alert' : 'status');
      el.innerHTML = UI.ikon(nama) + '<div class="tumbuh">' + (o.judul ? '<b>' + U.e(o.judul) + '</b>' : '') + U.e(pesan) + '</div>' +
        (o.aksi ? '<button type="button">' + U.e(o.aksi.label) + '</button>' : '') + '<i class="waktu" style="animation-duration:' + dur + 'ms"></i>';
      var garis = el.querySelector('.waktu');
      function hilang() { clearTimeout(t); if (el.classList.contains('keluar')) return; el.classList.add('keluar'); setTimeout(function () { el.remove(); }, 240); }
      if (o.aksi) el.querySelector('button').onclick = function () { o.aksi.fn(); hilang(); };
      el.onmouseenter = function () { clearTimeout(t); garis.style.animationPlayState = 'paused'; };
      el.onmouseleave = function () { garis.style.animationPlayState = 'running'; t = setTimeout(hilang, 1800); };
      w.appendChild(el);
      while (w.children.length > (W.innerWidth < 860 ? 2 : 4)) w.firstChild.remove();
      t = setTimeout(hilang, dur);
      return { tutup: hilang };
    },
    galat: function (er, judul) { var m = er && er.message ? er.message : String(er); UI.toast(m, er && er.code === 'VALIDATION' ? 'warn' : 'bahaya', { judul: judul }); },

    /* ----- lapisan: modal (tengah; di HP dari bawah) & laci (dari kanan) ----- */
    _lapis: function (jenis, o) {
      var lap = D.createElement('div'); lap.className = 'lapis';
      var el = D.createElement('div'); el.className = jenis + (o.lebar ? ' lebar' : '') + (o.sempit ? ' sempit' : '');
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); if (o.judul) el.setAttribute('aria-label', o.judul);
      el.innerHTML = '<div class="ov-kepala"><div class="tumpuk"><h2>' + U.e(o.judul || '') + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' +
        '<button type="button" class="btn ikon hantu kecil" data-tutup aria-label="Tutup">' + (MR.ikonTutup || '&times;') + '</button></div>' +
        '<div class="ov-isi">' + (o.isi || '') + '</div>' +
        (o.kaki !== false ? '<div class="ov-kaki">' + (o.kaki || '<button type="button" class="btn" data-tutup>Tutup</button>') + '</div>' : '');
      D.body.appendChild(lap); D.body.appendChild(el);
      /* frame berikutnya + paksa hitung tata letak → transisi buka pasti berjalan di semua browser */
      requestAnimationFrame(function () { void el.offsetWidth; lap.classList.add('buka'); el.classList.add('buka'); });
      var api = {
        el: el, isi: el.querySelector('.ov-isi'), kaki: el.querySelector('.ov-kaki'), tertutup: false,
        tutup: function (v) {
          if (api.tertutup) return; api.tertutup = true;
          lap.classList.remove('buka'); el.classList.remove('buka');
          setTimeout(function () { lap.remove(); el.remove(); }, 300);
          tumpukan = tumpukan.filter(function (x) { return x !== api; });
          if (!tumpukan.length) D.body.style.overflow = '';
          if (o.saatTutup) o.saatTutup(v);
          if (api._fokus && api._fokus.focus) try { api._fokus.focus({ preventScroll: true }); } catch (e) { }
        },
        on: function (ev, sel, fn) { el.addEventListener(ev, function (e) { var t = e.target.closest(sel); if (t && el.contains(t)) fn(t, e); }); return api; }
      };
      api._fokus = D.activeElement;
      lap.onclick = function () { if (!o.tanpaTutupLuar) api.tutup(); };
      el.addEventListener('click', function (e) { if (e.target.closest('[data-tutup]')) api.tutup(); });
      tumpukan.push(api); D.body.style.overflow = 'hidden';
      /* fokus otomatis hanya di layar lebar: di HP keyboard akan langsung menutupi layar */
      setTimeout(function () { var f = el.querySelector('[autofocus], .ov-isi input:not([type=hidden]):not([readonly]), .ov-isi select, .ov-isi textarea'); if (f && W.innerWidth > 860) f.focus(); }, 60);
      return api;
    },
    modal: function (o) { return UI._lapis('modal', o || {}); },
    laci: function (o) { return UI._lapis('laci', o || {}); },
    adaLapis: function () { return tumpukan.length > 0; },
    tutupAtas: function () { var a = tumpukan[tumpukan.length - 1]; if (a) { a.tutup(); return true; } return false; },
    tutupSemua: function () { tumpukan.slice().forEach(function (a) { a.tutup(); }); },
    konfirmasi: function (o) {
      return new Promise(function (ok) {
        var m = UI.modal({ judul: o.judul, sempit: true, isi: '<p class="redup">' + U.e(o.pesan || '') + '</p>',
          kaki: '<button type="button" class="btn" data-tutup>' + U.e(o.batal || 'Batal') + '</button><button type="button" class="btn ' + (o.bahaya ? 'bahaya' : 'primer') + '" data-ok>' + U.e(o.ok || 'Lanjutkan') + '</button>',
          saatTutup: function (v) { ok(v === true); } });
        m.el.querySelector('[data-ok]').onclick = function () { m.tutup(true); };
      });
    },

    /* ----- tombol kerja: berputar, cegah klik ganda, tampilkan galat ----- */
    kerja: function (tombol, fn, o) {
      o = o || {};
      /* klik/Enter kedua saat masih berputar diabaikan: janji tidak pernah selesai, jadi then/catch pemanggil tidak jalan */
      if (tombol && tombol.classList.contains('memuat')) return new Promise(function () { });
      if (tombol) tombol.classList.add('memuat');
      return Promise.resolve().then(fn).then(function (r) { if (tombol) tombol.classList.remove('memuat'); return r; }, function (er) {
        if (tombol) tombol.classList.remove('memuat');
        if (o.form && er && er.fields) UI.tandaiGalat(o.form, er.fields);
        UI.galat(er); throw er;   // galat SUDAH tampil; pemanggil cukup .catch(function () {})
      });
    },
    /* fields: { nama_kolom: 'pesan' } → .fld[data-k="nama_kolom"] ditandai */
    tandaiGalat: function (form, fields) {
      qsa('.fld.salah', form).forEach(function (f) { f.classList.remove('salah'); });
      var pertama = null;
      Object.keys(fields || {}).forEach(function (k) { var f = form.querySelector('.fld[data-k="' + k + '"]'); if (!f) return; f.classList.add('salah'); var g = f.querySelector('.galat'); if (g) g.textContent = fields[k]; if (!pertama) pertama = f; });
      if (pertama) { var i = pertama.querySelector('input,select,textarea'); if (i) try { i.focus({ preventScroll: true }); } catch (e) { } pertama.scrollIntoView({ block: 'center', behavior: U.gerakDikurangi() ? 'auto' : 'smooth' }); }
    },

    /* ----- skeleton, kosong, proses ----- */
    kerangka: function (jenis) {
      if (jenis === 'tabel') return '<div class="kartu pad">' + [1, 2, 3, 4, 5, 6].map(function (i) { return '<div class="kr-baris"><div class="kerangka bulat"></div><div class="tumbuh"><div class="kerangka teks" style="width:' + (40 + i * 7 % 40) + '%"></div><div class="kerangka teks" style="width:' + (20 + i * 11 % 30) + '%"></div></div><div class="kerangka teks" style="width:80px"></div></div>'; }).join('') + '</div>';
      return '<div class="kepala-hal"><div style="width:100%"><div class="kerangka judul"></div><div class="kerangka teks" style="width:28%"></div></div></div>' +
        '<div class="grid g4 kpi-baris">' + [1, 2, 3, 4].map(function () { return '<div class="kartu pad"><div class="kerangka teks" style="width:50%"></div><div class="kerangka" style="height:28px;width:60%;margin-top:10px"></div><div class="kerangka teks" style="width:40%;margin-top:10px"></div></div>'; }).join('') + '</div>' +
        '<div class="grid g-2-1" style="margin-top:16px"><div class="kerangka blok" style="height:280px"></div><div class="kerangka blok" style="height:280px"></div></div>';
    },
    kosong: function (judul, sub, aksi) { return '<div class="kosong">' + (MR.ilustrasiKosong ? '<img src="' + U.e(MR.ilustrasiKosong) + '" alt="" loading="lazy">' : '') + '<b>' + U.e(judul || 'Belum ada data') + '</b>' + (sub ? '<p>' + U.e(sub) + '</p>' : '') + (aksi || '') + '</div>'; },
    proses: function (judul, langkah) {
      var el = D.createElement('div'); el.className = 'proses-lapis';
      el.innerHTML = '<div class="proses-kartu">' + htmlPemuat(judul, 'Mohon tunggu, jangan tutup halaman ini') + (langkah ? '<ul class="langkah-proses">' + langkah.map(function (l) { return '<li><i></i>' + U.e(l) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      D.body.appendChild(el); var li = qsa('li', el);
      var api = {
        langkah: function (i) { li.forEach(function (x, j) { x.className = j < i ? 'selesai' : j === i ? 'jalan' : ''; }); },
        selesai: function () { li.forEach(function (x) { x.className = 'selesai'; }); setTimeout(function () { el.style.transition = 'opacity .25s'; el.style.opacity = 0; setTimeout(function () { el.remove(); }, 250); }, 260); },
        gagal: function () { el.remove(); }
      };
      api.langkah(0); return api;
    }
  };
  /* tanda galat hilang begitu kolom diperbaiki (berlaku untuk semua form) */
  ['input', 'change'].forEach(function (ev) { D.addEventListener(ev, function (e) { var f = e.target && e.target.closest && e.target.closest('.fld.salah'); if (f) { f.classList.remove('salah'); var g = f.querySelector('.galat'); if (g) g.textContent = ''; } }, true); });

  /* ===================== 5. ROUTER INSTAN ===================== */
  var Halaman = {}, HST = {};
  function gulirKe(y) { W.scrollTo(0, y); }   // [perbaikan] html tanpa smooth → lompat instan
  var Router = {
    awal: 'dashboard', sekarang: null, seq: 0, _ctx: null,
    penjaga: null,     // function (rute, def) → true bila ditolak (mis. belum login → Router.ke('masuk', true))
    saatAktif: null,   // function (rute, def) → sorot menu, isi breadcrumb
    daftar: function (id, def) { Halaman[id] = def; },
    ke: function (rute, ganti) { var h = '#/' + String(rute).replace(/^#?\/?/, ''); if (ganti) history.replaceState(null, '', h); else if (location.hash !== h) { location.hash = h; return; } this.tampilkan(); },
    parse: function () {
      var h = decodeURI(location.hash.replace(/^#\/?/, '')), p = h.split('?'), seg = p[0].split('/').filter(Boolean), q = {};
      (p[1] || '').split('&').forEach(function (x) { if (!x) return; var kv = x.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
      return { id: seg[0] || '', arg: seg.slice(1), q: q };
    },
    /* data latar berubah → render ulang diam (tanpa animasi, gulir tetap); ditunda bila ada modal/laci */
    segarkanDiam: U.debounce(function () { if (Router._ctx && !UI.adaLapis()) Router.tampilkan({ diam: true }); }, 120),
    /* setelah tulis → isi lama meredup sampai data baru siap */
    muatUlang: function () { Router.tampilkan({ diam: true, bingkai: true }); },
    lupakan: function () { Object.keys(HST).forEach(function (k) { delete HST[k]; }); },   // panggil saat ganti akun
    tampilkan: function (o) {
      o = o || {}; var r = this.parse(), self = this, isi = qs('#isi');
      if (!r.id) return this.ke(this.awal, true);
      var def = Halaman[r.id];
      if (this.penjaga && this.penjaga(r, def)) return;
      if (!isi) return;
      if (!def) { this.sekarang = r; isi.innerHTML = '<div class="kartu pad masuk">' + UI.kosong('Halaman tidak ditemukan', 'Alamat "' + r.id + '" tidak tersedia.') + '</div>'; return; }
      var pindah = !this.sekarang || this.sekarang.id !== r.id || this.sekarang.arg.join('/') !== r.arg.join('/');
      this.sekarang = r; if (this.saatAktif) this.saatAktif(r, def);
      var seq = ++this.seq, wadah = D.createElement('div'); wadah.className = 'isi-hal';
      var ctx = {
        id: r.id, arg: r.arg, q: r.q, st: (HST[r.id] = HST[r.id] || {}), el: wadah, seq: seq, _nanti: [], _ulang: [],
        basi: function () { return seq !== self.seq; },   // true → pengguna sudah pindah; hentikan render
        segar: function () { Router.muatUlang(); },
        on: function (ev, sel, fn) { wadah.addEventListener(ev, function (e) { var t = e.target.closest(sel); if (t && wadah.contains(t)) fn(t, e); }); },
        aksi: function (peta) { wadah.addEventListener('click', function (e) { var t = e.target.closest('[data-a]'); if (!t || !wadah.contains(t) || !peta[t.dataset.a]) return; e.preventDefault(); peta[t.dataset.a](t, e); }); },
        nanti: function (fn) { this._nanti.push(fn); },                         // jalan setelah wadah tampil
        grafik: function (fn) { this._nanti.push(fn); this._ulang.push(fn); }   // + diulang saat lebar berubah
      };
      this._ctx = ctx;
      var tSkel = null, gulir = W.scrollY;
      if (o.bingkai) isi.classList.add('memuat-ulang');
      else if (!o.diam) tSkel = setTimeout(function () { if (seq === self.seq) isi.innerHTML = '<div class="pudar">' + UI.kerangka(def.kerangka) + '</div>'; }, 90);
      var jalan; try { jalan = Promise.resolve(def.render(ctx)); } catch (er) { jalan = Promise.reject(er); }
      jalan.then(function () {
        clearTimeout(tSkel); if (seq !== self.seq) return;
        isi.classList.remove('memuat-ulang');
        if (!o.diam || o.bingkai) wadah.classList.add(o.bingkai ? 'pudar' : 'masuk');
        isi.innerHTML = ''; isi.appendChild(wadah);
        if (o.diam) gulirKe(gulir); else if (pindah) gulirKe(0);
        if (def.setelah) def.setelah(ctx);
        ctx._nanti.forEach(function (fn) { try { fn(); } catch (x) { if (W.console) console.error(x); } });
      }, function (er) {
        clearTimeout(tSkel); if (seq !== self.seq) return;
        isi.classList.remove('memuat-ulang');
        isi.innerHTML = '<div class="kartu pad masuk">' + UI.kosong('Gagal memuat data', er && er.message ? er.message : String(er), '<button type="button" class="btn primer kecil" data-ulang>Coba lagi</button>') + '</div>';
        var b = qs('[data-ulang]', isi); if (b) b.onclick = function () { Router.tampilkan(); };
        if (W.console) console.error(er);
      });
    }
  };
  W.addEventListener('hashchange', function () { Router.tampilkan(); });
  /* grafik digambar ulang hanya bila lebar berubah ≥ 30 px (keyboard HP tidak memicu) */
  var lebarAkhir = W.innerWidth;
  W.addEventListener('resize', U.debounce(function () { if (Math.abs(W.innerWidth - lebarAkhir) < 30) return; lebarAkhir = W.innerWidth; var c = Router._ctx; if (c) c._ulang.forEach(function (fn) { try { fn(); } catch (x) { } }); }, 200));

  /* ===================== 6. SHELL HP/DESKTOP ===================== */
  var Shell = {
    _terpasang: false,
    pasang: function () {
      if (this._terpasang) return; this._terpasang = true;
      var k = qs('#kerangka'); if (k && Pref.ambil('ciut') === '1') k.classList.add('ciut');
      D.addEventListener('click', function (e) {
        var k = qs('#kerangka'); if (!k) return;
        if (e.target.closest('[data-menu-hp]')) { k.classList.toggle('menu-buka'); return; }
        if (e.target.closest('[data-ciut]')) { k.classList.toggle('ciut'); Pref.simpan('ciut', k.classList.contains('ciut') ? '1' : '0'); return; }
        if (k.classList.contains('menu-buka') && !e.target.closest('.sidebar')) k.classList.remove('menu-buka');
      });
    },
    /* sorot menu aktif di sidebar & navigasi bawah, tutup sidebar HP */
    aktifkan: function (id) { qsa('[data-menu]').forEach(function (a) { a.classList.toggle('aktif', a.dataset.menu === id); }); var k = qs('#kerangka'); if (k) k.classList.remove('menu-buka'); }
  };

  /* ===================== 7. PINTASAN KEYBOARD ===================== */
  D.addEventListener('keydown', function (e) {
    var kunci = String(e.key || '').toLowerCase();   // e.key bisa kosong saat isi-otomatis browser
    var ketik = /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName) || (e.target && e.target.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && kunci === 'k' && MR.palet) { e.preventDefault(); MR.palet(); return; }
    if (kunci === 'escape') { if (UI.tutupAtas()) return; var k = qs('#kerangka'); if (k) k.classList.remove('menu-buka'); return; }
    if (!kunci || ketik || e.metaKey || e.ctrlKey || e.altKey || UI.adaLapis()) return;
    if (kunci === '/') { var c = qs('#isi [data-f=q]'); if (c) { e.preventDefault(); c.focus(); } return; }
    var b = qs('#isi [data-kunci="' + kunci.replace(/"/g, '') + '"]'); if (b && b.offsetParent) { e.preventDefault(); b.click(); }
  });

  /* ===================== 8. GERAK GRAFIK ===================== */
  /* Garis (path.garis-seri) "tergambar" 1 dtk saat wadah pertama kali digambar. Panggil SETELAH SVG ditulis ke wadah. */
  function animasiGaris(wadah) {
    if (!wadah || wadah.dataset.tergambar) return; wadah.dataset.tergambar = '1';
    qsa('path.garis-seri', wadah).forEach(function (p) {
      try {
        var L = p.getTotalLength(); if (!L) return;
        p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.transition = 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)'; p.style.strokeDashoffset = '0'; }); });
      } catch (x) { }
    });
  }
  /* Gauge: <svg viewBox="0 0 36 36"><circle class="jalur" cx="18" cy="18" r="15"/><circle class="busur" cx="18" cy="18" r="15"/></svg> */
  function isiGauge(busur, persen) {
    if (!busur) return; var v = Math.max(0, Math.min(100, Number(persen) || 0)), keliling = 2 * Math.PI * 15;
    requestAnimationFrame(function () { requestAnimationFrame(function () { busur.style.strokeDashoffset = String(keliling * (1 - v / 100)); }); });
  }

  /* ===================== 9. MULAI ===================== */
  function daftarSW() { if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return; navigator.serviceWorker.register('sw.js').catch(function () { }); }
  /* o.siapkan: fungsi (boleh Promise) sebelum halaman pertama, mis. memulihkan sesi. o.sw: false = tanpa service worker. */
  function mulai(o) {
    o = o || {};
    Shell.pasang();
    Promise.resolve().then(function () { return o.siapkan ? o.siapkan() : null; })
      .then(function () { Layar.sembunyikan(); Router.tampilkan(); }, function (er) { Layar.sembunyikan(); UI.galat(er); Router.tampilkan(); });
    if (o.sw !== false) { if (D.readyState === 'complete') daftarSW(); else W.addEventListener('load', daftarSW); }
  }

  MR.qs = qs; MR.qsa = qsa; MR.U = U; MR.Pref = Pref; MR.Muat = Muat; MR.Layar = Layar; MR.htmlPemuat = htmlPemuat;
  MR.UI = UI; MR.Router = Router; MR.Shell = Shell; MR.animasiGaris = animasiGaris; MR.isiGauge = isiGauge; MR.mulai = mulai;
})(window, document);
