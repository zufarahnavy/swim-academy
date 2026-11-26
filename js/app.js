/* =====================================================================
 * APP SWIM ACADEMY — shell, menu per peran & izin, penjaga rute, tema,
 * palet perintah, notifikasi, profil, pengalih peran demo, mulai.
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, App = W.App = {};
  MR.logo = 'assets/logo.svg';
  MR.ilustrasiKosong = 'assets/ilustrasi/kosong.svg';
  MR.garisPemuat = 'M0 18c11 0 11-9 22-9s11 18 22 18 11-18 22-18 11 18 22 18 11-18 22-18 11 18 22 18 11-9 22-9h26';
  MR.Pref.awalan = 'swimacademy_';

  /* ---------- Menu per peran ---------- */
  var OA = ['owner', 'admin'];
  var MENU = [
    { grup: 'Utama', id: 'beranda', label: 'Beranda', ikon: 'grid', peran: OA },
    { id: 'analitik', label: 'Analitik', ikon: 'grafik', peran: OA, izin: ['analitik.lihat'] },
    { grup: 'Operasional', id: 'pendaftaran', label: 'Pendaftaran', ikon: 'tambahOrang', peran: OA, izin: ['pendaftaran.verifikasi', 'pendaftaran.link'], lencana: 'daftar' },
    { id: 'siswa', label: 'Siswa', ikon: 'orang2', peran: OA, izin: ['siswa.lihat'] },
    { id: 'jadwal', label: 'Jadwal Pelatih', ikon: 'kalender', peran: OA, izin: ['jadwal.lihat'] },
    { id: 'absensi', label: 'Absensi', ikon: 'absen', peran: OA, izin: ['absensi.riwayat', 'absensi.input'] },
    { id: 'materi', label: 'Materi Latihan', ikon: 'buku', peran: OA, izin: ['materi.lihat'] },
    { grup: 'Keuangan', id: 'kas', label: 'Arus Kas', ikon: 'dompet', peran: OA, izin: ['kas.lihat'] },
    { id: 'honor', label: 'Honor Pelatih', ikon: 'koin', peran: OA, izin: ['honor.rekap_lihat'] },
    { id: 'tutup-bulan', label: 'Tutup Bulan', ikon: 'gembok', peran: OA, izin: ['tutup_bulan'] },
    { grup: 'Pengaturan', id: 'pengaturan', label: 'Pengaturan', ikon: 'slider', peran: OA, izin: ['pengaturan.tampilan', 'pengaturan.master', 'pengaturan.form', 'pengaturan.sinkron', 'absensi.atur_batas'] },
    { id: 'harga', label: 'Harga, Tarif & Aturan', ikon: 'tag', peran: OA },
    { id: 'hak-akses', label: 'Hak Akses', ikon: 'tameng', peran: ['owner'] },
    { id: 'akun', label: 'Akun Pengguna', ikon: 'akun', peran: OA, izin: ['akun.kelola'] },
    { id: 'log', label: 'Log Audit', ikon: 'riwayat', peran: ['owner'] },
    { grup: 'Portal Pelatih', id: 'hari-ini', label: 'Hari Ini', ikon: 'peluit', peran: ['pelatih'], izin: ['absensi.input'] },
    { id: 'jadwal-saya', label: 'Jadwal Saya', ikon: 'kalender', peran: ['pelatih'], izin: ['jadwal.lihat'] },
    { id: 'materi', label: 'Materi Latihan', ikon: 'buku', peran: ['pelatih'], izin: ['materi.lihat'] },
    { id: 'rekap-saya', label: 'Rekap Saya', ikon: 'koin', peran: ['pelatih'], izin: ['honor.rekap_sendiri'] },
    { grup: 'Portal Orang Tua', id: 'anak', label: 'Anak Saya', ikon: 'renang', peran: ['ortu'] },
    { id: 'jadwal-anak', label: 'Jadwal', ikon: 'kalender', peran: ['ortu'], izin: ['jadwal.lihat'] },
    { id: 'riwayat', label: 'Riwayat Hadir', ikon: 'riwayat', peran: ['ortu'], izin: ['absensi.riwayat'] }
  ];
  var BAWAH = { owner: ['beranda', 'pendaftaran', 'siswa', 'absensi'], admin: ['beranda', 'pendaftaran', 'siswa', 'absensi'], pelatih: ['hari-ini', 'jadwal-saya', 'materi', 'rekap-saya'], ortu: ['anak', 'jadwal-anak', 'riwayat'] };
  var LABEL_BAWAH = { beranda: 'Beranda', pendaftaran: 'Daftar', siswa: 'Siswa', absensi: 'Absensi', 'hari-ini': 'Hari Ini', 'jadwal-saya': 'Jadwal', materi: 'Materi', 'rekap-saya': 'Rekap', anak: 'Anak', 'jadwal-anak': 'Jadwal', riwayat: 'Riwayat' };
  var BERANDA = { owner: 'beranda', admin: 'beranda', pelatih: 'hari-ini', ortu: 'anak' };
  var PUBLIK = { masuk: 1, daftar: 1 };
  App.MENU = MENU;

  function bolehMenu(m) {
    var me = Sesi.me; if (!me) return false;
    if (m.peran && m.peran.indexOf(me.peran) < 0) return false;
    if (m.izin && me.peran !== 'owner' && !Sesi.punya(m.izin)) return false;
    return true;
  }
  App.boleh = function (id) { var p = Sesi.peran(); return MENU.some(function (m) { return m.id === id && (!m.peran || m.peran.indexOf(p) >= 0) && bolehMenu(m); }); };
  App.beranda = function () { return BERANDA[Sesi.peran()] || 'masuk'; };

  /* ---------- Identitas & tema dari snapshot publik ---------- */
  var Publik = App.publik = { nama_app: 'Swim Academy', tagline: 'Sistem Terpadu Pelatihan & Absensi Renang', logo: '', tema: null };
  function hexKeRgb(h) { h = String(h || '').replace('#', ''); if (h.length !== 6) return null; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function campur(h, ke, p) { var a = hexKeRgb(h), b = hexKeRgb(ke); if (!a || !b) return h; return '#' + a.map(function (x, i) { return ('0' + Math.round(x + (b[i] - x) * p).toString(16)).slice(-2); }).join(''); }
  var FONT_DIMUAT = { 'Plus Jakarta Sans': 1, Inter: 1, Sistem: 1 };
  function muatFont(nama) {
    if (!nama || FONT_DIMUAT[nama]) return; FONT_DIMUAT[nama] = 1;
    var l = D.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(nama).replace(/%20/g, '+') + ':wght@400;500;600;700;800&display=swap'; D.head.appendChild(l);
  }
  function namaFont(n, cadangan) { return n === 'Sistem' ? 'system-ui, -apple-system, "Segoe UI", sans-serif' : '"' + n + '", ' + cadangan; }
  App.terapkanTema = function (tema, el) {
    if (!tema || !tema.warna) return; var w = tema.warna, s = (el || D.documentElement).style, rgb = hexKeRgb(w.primer);
    var peta = { '--merek': w.primer, '--merek-hover': w.aksen, '--aksen': w.aksen, '--merek-tua': campur(w.primer, '#000000', 0.18), '--merek-lembut': w.primer_muda, '--gelap': w.sidebar, '--gelap-2': campur(w.sidebar, '#000000', 0.12), '--gelap-3': campur(w.sidebar, '#FFFFFF', 0.08),
      '--menu': w.menu, '--banner': w.banner, '--latar': w.latar, '--kartu': w.permukaan, '--tinta': w.teks, '--tinta-2': w.teks2, '--redup': w.teks2, '--ok': w.sukses, '--warn': w.peringatan, '--bahaya': w.bahaya };
    Object.keys(peta).forEach(function (k) { if (peta[k]) s.setProperty(k, peta[k]); });
    if (rgb) s.setProperty('--merek-rgb', rgb.join(', '));
    if (tema.font_judul) { muatFont(tema.font_judul); s.setProperty('--f-judul', namaFont(tema.font_judul, 'system-ui, sans-serif')); }
    if (tema.font_isi) { muatFont(tema.font_isi); s.setProperty('--f-isi', namaFont(tema.font_isi, 'system-ui, sans-serif')); }
    if (!el && tema.animasi) D.documentElement.dataset.animasi = tema.animasi;
    if (!el) { var m = D.querySelector('meta[name=theme-color]'); if (m) m.content = w.sidebar; }
  };
  App.terapkanPublik = function (p) {
    if (!p) return; Object.assign(Publik, p);
    if (p.tema) App.terapkanTema(p.tema);
    var nama = p.nama_app || 'Swim Academy';
    MR.qsa('[data-nama-app]').forEach(function (x) { x.textContent = nama; });
    MR.qsa('[data-tagline]').forEach(function (x) { x.textContent = p.tagline || ''; });
    if (p.logo) { MR.logo = p.logo; MR.qsa('img[data-logo]').forEach(function (x) { x.src = p.logo; }); }
    if (p.favicon) { var f = D.querySelector('link[rel=icon]'); if (f) f.href = p.favicon; }
  };

  /* ---------- Shell ---------- */
  var elKerangka = function () { return D.getElementById('kerangka'); };
  App.bangunMenu = function () {
    var nav = D.getElementById('sb-nav'), bawah = D.getElementById('bawah-nav'), me = Sesi.me; if (!nav || !me) return;
    var html = '', grup = null, sudah = {};
    MENU.forEach(function (m) {
      if (m.grup) grup = m.grup;
      if (!bolehMenu(m) || sudah[m.id]) return; sudah[m.id] = 1;
      if (grup) { html += '<div class="sb-grup">' + e(grup) + '</div>'; grup = null; }
      html += '<a class="sb-item" href="#/' + m.id + '" data-menu="' + m.id + '" title="' + e(m.label) + '">' + ik(m.ikon) + '<span class="sb-lbl">' + e(m.label) + '</span>' + (m.lencana ? '<span class="sb-lencana" data-lencana="' + m.lencana + '" hidden></span>' : '') + '</a>';
    });
    /* Muat pertama: gulir menu selalu dari atas (Beranda, Pendaftaran, Siswa, Jadwal terlihat). Bangun ulang: posisi gulir dipertahankan. */
    var gulir = nav.dataset.siap ? nav.scrollTop : 0;
    nav.innerHTML = html; nav.scrollTop = gulir; nav.dataset.siap = '1';
    var sb = nav.closest('.sidebar'); if (sb && !nav.dataset.siap2) { sb.scrollTop = 0; nav.dataset.siap2 = '1'; }
    var ids = (BAWAH[me.peran] || []).filter(function (id) { return App.boleh(id); });
    bawah.innerHTML = ids.map(function (id) { var m = MENU.filter(function (x) { return x.id === id; })[0]; return '<a href="#/' + id + '" data-menu="' + id + '"><span class="ik-wadah">' + ik(m.ikon) + '</span>' + e(LABEL_BAWAH[id] || m.label) + '</a>'; }).join('') +
      (OA.indexOf(me.peran) >= 0 ? '<a href="javascript:void 0" data-menu-hp><span class="ik-wadah">' + ik('menu') + '</span>Menu</a>' : '<a href="javascript:void 0" data-a-profil><span class="ik-wadah">' + ik('orang') + '</span>Akun</a>');
    var p = D.getElementById('tb-profil');
    if (p) p.innerHTML = UI2.avatar(me.nama) + '<span class="tumpuk"><b>' + e(me.nama) + '</b><small>' + e(Inti.NAMA_PERAN[me.peran] || me.peran) + '</small></span>' + ik('bawah', 'k');
    var sr = MR.Router.sekarang; if (sr) MR.Shell.aktifkan(sr.id);
    App.perbaruiLencana();
  };
  App.perbaruiLencana = function () {
    if (OA.indexOf(Sesi.peran()) < 0) { tandaLonceng(0); return; }
    var d = API.tersimpan('dash.admin', {}); if (!d) return;
    var n = d.pendaftaran_baru || 0;
    MR.qsa('[data-lencana=daftar]').forEach(function (x) { x.hidden = !n; x.textContent = n; });
    tandaLonceng(n + (d.kpi ? d.kpi.habis_lama : 0));
  };
  function tandaLonceng(n) { var t = D.querySelector('#tb-lonceng .titik'); if (t) t.hidden = !n; }

  /* Jam server (WIB) di topbar — absensi memakai jam server, bukan jam perangkat */
  var tJam = null;
  function jalankanJam() {
    clearInterval(tJam);
    var el = D.getElementById('tb-jam'); if (!el) return;
    var tik = function () { var d = new Date(API.jamServer() + 7 * 3600e3); el.querySelector('span').textContent = ('0' + d.getUTCHours()).slice(-2) + ':' + ('0' + d.getUTCMinutes()).slice(-2) + ' WIB'; };
    tik(); tJam = setInterval(tik, 15000);
  }

  /* ---------- Penjaga rute ---------- */
  MR.Router.penjaga = function (r, def) {
    if (PUBLIK[r.id]) { if (r.id === 'masuk' && Sesi.token) { MR.Router.ke(App.beranda(), true); return true; } return false; }
    if (!Sesi.token) { MR.Router.ke('masuk', true); return true; }
    if (def && def.peran && def.peran.indexOf(Sesi.peran()) < 0) { MR.Router.ke(App.beranda(), true); return true; }
    if (def && !App.boleh(r.id) && MENU.some(function (m) { return m.id === r.id; })) { MR.UI.toast('Anda tidak memiliki izin untuk membuka menu ini.', 'warn'); MR.Router.ke(App.beranda(), true); return true; }
    return false;
  };
  MR.Router.saatAktif = function (r, def) {
    var k = elKerangka(), publik = !!PUBLIK[r.id];
    if (k) k.classList.toggle('tanpa-shell', publik);
    D.body.classList.toggle('mode-publik', publik);
    MR.Shell.aktifkan(r.id);
    var judul = def && def.judul ? (typeof def.judul === 'function' ? def.judul(r) : def.judul) : '';
    D.title = (judul ? judul + ' · ' : '') + (Publik.nama_app || 'Swim Academy');
    var t = D.getElementById('tb-judul'); if (t) t.textContent = judul;
  };

  /* ---------- Masuk & keluar ---------- */
  App.setelahMasuk = function (d) {
    Sesi.simpan(d); MR.Router.lupakan(); API.bersihkan();
    App.bangunMenu(); jalankanJam(); prefetch();
    MR.Router.awal = App.beranda();
    MR.Router.ke(App.beranda(), true);
    MR.UI.toast('Selamat datang, ' + d.me.nama + '.', 'ok');
  };
  App.keluar = function (pesan) {
    Sesi.hapus(); MR.UI.tutupSemua(); MR.Router.lupakan(); clearInterval(tJam); clearInterval(tOrtu);
    MR.Router.ke('masuk', true);
    if (pesan) MR.UI.toast(pesan, 'info');
  };
  function prefetch() {
    var p = Sesi.peran(), daftar = [];
    if (OA.indexOf(p) >= 0) {
      daftar.push(['dash.admin', {}]);
      if (Sesi.punya('siswa.lihat')) daftar.push(['siswa.list', {}]);
      if (Sesi.punya('pendaftaran.verifikasi')) daftar.push(['daftar.masukList', { status: 'Baru' }]);
      if (Sesi.punya('jadwal.lihat')) daftar.push(['jadwal.list', {}]);
      if (Sesi.punya(['absensi.riwayat', 'absensi.input'])) daftar.push(['absensi.hari', { tanggal: UI2.hariIni() }]);
      if (Sesi.punya('kas.lihat')) daftar.push(['kas.list', { bulan: UI2.bulanIni() }]);
      if (Sesi.punya('analitik.lihat')) daftar.push(['analitik.data', { bulan_ke: 6 }]);
    } else if (p === 'pelatih') { daftar.push(['dash.pelatih', {}], ['jadwal.list', {}], ['materi.list', {}]); }
    else if (p === 'ortu') { daftar.push(['dash.ortu', {}]); }
    API.prefetch(daftar);
    if (p === 'ortu') pantauOrtu();
  }
  /* Portal orang tua: cek versi data tiap 60 dtk (ringan), muat ulang diam bila berubah */
  var tOrtu = null, versiOrtu = null;
  function pantauOrtu() {
    clearInterval(tOrtu);
    tOrtu = setInterval(function () {
      if (D.visibilityState !== 'visible' || Sesi.peran() !== 'ortu') return;
      API.panggil('dash.ortuVersi', {}, { diam: true }).then(function (r) {
        if (versiOrtu && r.versi !== versiOrtu) API.Q('dash.ortu', {}, { segar: true, diam: true }).then(function () { MR.Router.segarkanDiam(); });
        versiOrtu = r.versi;
      }).catch(function () { });
    }, 60000);
  }

  /* ---------- Profil, ganti sandi ---------- */
  App.profil = function () {
    var me = Sesi.me; if (!me) return;
    var m = MR.UI.laci({ judul: 'Akun Saya', isi:
      '<div class="baris" style="gap:14px;margin-bottom:18px">' + UI2.avatar(me.nama, 'besar') + '<div class="tumpuk"><b style="font:700 18px var(--f-judul)">' + e(me.nama) + '</b><span class="redup">' + e(Inti.NAMA_PERAN[me.peran]) + (me.username && me.peran !== 'ortu' ? ' · @' + e(me.username) : '') + '</span></div></div>' +
      (API.mode === 'demo' ? '<div class="peringatan info mt8">' + ik('info') + '<div><b>Mode demo</b>Semua data tersimpan di browser ini dan dibuat ulang setiap hari. Gunakan "Ganti peran" untuk mencoba portal lain.</div></div>' : '') +
      '<div class="daftar-ikon mt16">' +
      (me.peran !== 'ortu' ? '<button type="button" class="item-ikon item-klik" data-x="sandi" style="border:0;width:100%;text-align:left"><span class="ubin">' + ik('kunci') + '</span><div class="tumbuh"><b>Ganti sandi</b><div class="kecil redup">Minimal 8 karakter berisi huruf dan angka</div></div>' + ik('kanan') + '</button>' : '<div class="item-ikon"><span class="ubin">' + ik('kunci') + '</span><div class="tumbuh"><b>PIN portal</b><div class="kecil redup">PIN diatur oleh Admin. Hubungi Admin bila lupa PIN.</div></div></div>') +
      (API.mode === 'demo' ? '<button type="button" class="item-ikon item-klik" data-x="peran" style="border:0;width:100%;text-align:left"><span class="ubin ungu">' + ik('orang2') + '</span><div class="tumbuh"><b>Ganti peran demo</b><div class="kecil redup">Owner, Admin, Pelatih, atau Orang Tua</div></div>' + ik('kanan') + '</button>' : '') +
      '<button type="button" class="item-ikon item-klik" data-x="keluar" style="border:0;width:100%;text-align:left"><span class="ubin merah">' + ik('keluar') + '</span><div class="tumbuh"><b>Keluar</b><div class="kecil redup">Akhiri sesi di perangkat ini</div></div></button></div>', kaki: false });
    m.on('click', '[data-x]', function (t) {
      var x = t.dataset.x; m.tutup();
      if (x === 'keluar') App.keluar('Anda telah keluar.');
      if (x === 'sandi') gantiSandi();
      if (x === 'peran') App.gantiPeranDemo();
    });
  };
  function gantiSandi() {
    var m = MR.UI.modal({ judul: 'Ganti sandi', sempit: true, isi: '<form class="form">' + UI2.fld({ k: 'lama', label: 'Sandi saat ini', tipe: 'password', wajib: true, attr: ' autocomplete="current-password"' }) + UI2.fld({ k: 'baru', label: 'Sandi baru', tipe: 'password', wajib: true, bantu: 'Minimal 8 karakter, kombinasi huruf dan angka.', attr: ' autocomplete="new-password"' }) + UI2.fld({ k: 'ulang', label: 'Ulangi sandi baru', tipe: 'password', wajib: true, attr: ' autocomplete="new-password"' }) + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan sandi</button>' });
    m.el.querySelector('[data-ok]').onclick = function () {
      var f = m.el.querySelector('form'), v = UI2.baca(f);
      if (v.baru !== v.ulang) return MR.UI.tandaiGalat(f, { ulang: 'Tidak sama dengan sandi baru' });
      MR.UI.kerja(this, function () { return API.T('auth.gantiSandi', { lama: v.lama, baru: v.baru }); }, { form: f }).then(function (d) { Sesi.simpan(d); m.tutup(); MR.UI.toast('Sandi berhasil diganti. Sesi di perangkat lain telah diakhiri.', 'ok'); }).catch(function () { });
    };
  }

  /* ---------- Mode demo: pengalih peran ---------- */
  var AKUN_DEMO = [
    { peran: 'owner', label: 'Owner', sub: 'Hendro Wijaya · akses penuh', ikon: 'tameng', masuk: { username: 'owner', sandi: 'demo1234' } },
    { peran: 'admin', label: 'Admin', sub: 'Dina Pratiwi · operasional', ikon: 'slider', masuk: { username: 'admin', sandi: 'demo1234' } },
    { peran: 'pelatih', label: 'Pelatih', sub: 'Coach Budi Santoso', ikon: 'peluit', masuk: { username: 'budi', sandi: 'demo1234' } },
    { peran: 'ortu', label: 'Orang Tua', sub: 'Maya Kartika · 2 anak', ikon: 'renang', ortu: { kode: 'SA-8829', pin: '123456' } }
  ];
  App.AKUN_DEMO = AKUN_DEMO;
  App.masukDemo = function (a, tombol) {
    return MR.UI.kerja(tombol, function () { return a.ortu ? API.T('auth.masukOrtu', a.ortu) : API.T('auth.masuk', a.masuk); }).then(App.setelahMasuk).catch(function () { });
  };
  App.gantiPeranDemo = function () {
    var m = MR.UI.modal({ judul: 'Coba sebagai peran lain', sub: 'Data demo tetap sama — setiap peran melihat menu & batas data yang berbeda.', isi: '<div class="pilihan-kartu">' + AKUN_DEMO.map(function (a, i) { return '<button type="button" class="pilih" data-i="' + i + '"><span class="ubin">' + ik(a.ikon) + '</span><span class="tumpuk"><b>' + e(a.label) + '</b><span class="kecil redup">' + e(a.sub) + '</span></span></button>'; }).join('') + '</div>', kaki: false });
    m.on('click', '[data-i]', function (t) { var a = AKUN_DEMO[t.dataset.i]; Sesi.hapus(); App.masukDemo(a, t).then(function () { m.tutup(); }); });
  };

  /* ---------- Lonceng: hal yang perlu perhatian ---------- */
  App.lonceng = function () {
    var p = Sesi.peran(), m = MR.UI.laci({ judul: 'Perlu perhatian', isi: UI2.muatSebaris('Memeriksa…'), kaki: false });
    var item = function (ubin, ikon, judul, sub, href) { return '<a class="item-ikon item-klik" href="' + href + '" style="color:inherit"><span class="ubin ' + ubin + '">' + ik(ikon) + '</span><div class="tumbuh"><b>' + e(judul) + '</b><div class="kecil redup">' + e(sub) + '</div></div>' + ik('kanan') + '</a>'; };
    var jalan = OA.indexOf(p) >= 0 ? API.Q('dash.admin').then(function (d) {
      var o = [];
      if (d.pendaftaran_baru) o.push(item('', 'tambahOrang', d.pendaftaran_baru + ' pendaftaran menunggu verifikasi', 'Periksa bukti transfer & aktifkan paket', '#/pendaftaran'));
      if (d.kpi.habis) o.push(item('merah', 'segitiga', d.kpi.habis + ' paket HABIS', d.kpi.habis_lama + ' di antaranya lebih dari 3 hari', '#/siswa?status=HABIS'));
      if (d.kpi.sisa1) o.push(item('oranye', 'jam', d.kpi.sisa1 + ' paket tersisa 1 sesi', 'Kirim link perpanjangan lebih awal', '#/siswa?status=Aktif'));
      if (d.kpi.sesi_belum) o.push(item('ungu', 'absen', d.kpi.sesi_belum + ' sesi hari ini belum diabsen', 'Batas ' + d.batas.jam_batas + ' WIB (jam server)', '#/absensi'));
      return o;
    }) : p === 'pelatih' ? API.Q('dash.pelatih').then(function (d) {
      var o = [], belum = d.sesi.filter(function (x) { return !x.absen; }).length;
      if (belum) o.push(item('ungu', 'absen', belum + ' sesi belum diabsen', 'Batas ' + d.batas.jam_batas + ' WIB hari ini', '#/hari-ini'));
      if (d.belum_kemarin.length) o.push(item('merah', 'gembok', d.belum_kemarin.length + ' sesi kemarin belum diabsen', 'Minta Admin membuka kunci bila sudah lewat batas', '#/hari-ini'));
      return o;
    }) : API.Q('dash.ortu').then(function (d) {
      return d.anak.filter(function (a) { return a.paket && (a.paket.status === 'HABIS' || a.paket.sisa === 1); }).map(function (a) { return item(a.paket.status === 'HABIS' ? 'merah' : 'oranye', 'segitiga', 'Paket ' + a.nama.split(' ')[0] + (a.paket.status === 'HABIS' ? ' sudah HABIS' : ' tersisa 1 sesi'), 'Hubungi Admin untuk perpanjangan', '#/anak'); });
    });
    jalan.then(function (o) { m.isi.innerHTML = o.length ? '<div class="daftar-ikon">' + o.join('') + '</div>' : MR.UI.kosong('Semua beres', 'Tidak ada hal mendesak saat ini.'); m.isi.onclick = function (ev) { if (ev.target.closest('a')) m.tutup(); }; })
      .catch(function (er) { m.isi.innerHTML = MR.UI.kosong('Gagal memuat', er.message); });
  };

  /* ---------- Palet perintah (Ctrl/⌘ K) ---------- */
  MR.palet = function () {
    if (!Sesi.me) return;
    var menu = MENU.filter(bolehMenu).filter(function (m, i, a) { return a.findIndex(function (x) { return x.id === m.id; }) === i; }).map(function (m) { return { label: m.label, sub: 'Menu', ikon: m.ikon, href: '#/' + m.id }; });
    var aksi = [];
    if (Sesi.punya('pendaftaran.link')) aksi.push({ label: 'Buat link pendaftaran', sub: 'Aksi', ikon: 'tautan', href: '#/pendaftaran?buat=1' });
    if (Sesi.punya('kas.input')) aksi.push({ label: 'Input transaksi kas', sub: 'Aksi', ikon: 'plus', href: '#/kas?input=1' });
    if (Sesi.punya('siswa.kelola')) aksi.push({ label: 'Tambah siswa', sub: 'Aksi', ikon: 'tambahOrang', href: '#/siswa?tambah=1' });
    var siswa = (API.tersimpan('siswa.list', {}) || { rows: [] }).rows.map(function (s) { return { label: s.nama, sub: (s.kode_akses || '') + ' · ' + s.status, ikon: 'orang', href: '#/siswa?id=' + s.siswa_id }; });
    var semuaItem = menu.concat(aksi);
    var m = MR.UI.modal({ judul: 'Cari cepat', isi: '<div class="inp-ikon">' + ik('cari') + '<input class="inp" id="palet-q" placeholder="Ketik nama menu, aksi, atau nama siswa…" autocomplete="off"></div><div class="palet-hasil" id="palet-h"></div>', kaki: false });
    var inp = m.el.querySelector('#palet-q'), h = m.el.querySelector('#palet-h'), sorot = 0, hasil = [];
    function gambar() {
      var q = inp.value.trim().toLowerCase();
      hasil = (q ? semuaItem.concat(siswa) : semuaItem).filter(function (x) { return !q || (x.label + ' ' + x.sub).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
      sorot = Math.min(sorot, Math.max(0, hasil.length - 1));
      h.innerHTML = hasil.length ? hasil.map(function (x, i) { return '<button type="button" data-i="' + i + '" class="' + (i === sorot ? 'sorot' : '') + '">' + ik(x.ikon) + '<span class="satu-baris">' + e(x.label) + '</span><small>' + e(x.sub) + '</small></button>'; }).join('') : '<div class="redup kecil" style="padding:12px">Tidak ada hasil untuk "' + e(q) + '".</div>';
    }
    function pilih(i) { var x = hasil[i]; if (!x) return; m.tutup(); location.hash = x.href; }
    inp.addEventListener('input', function () { sorot = 0; gambar(); });
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowDown') { sorot = Math.min(hasil.length - 1, sorot + 1); gambar(); ev.preventDefault(); } else if (ev.key === 'ArrowUp') { sorot = Math.max(0, sorot - 1); gambar(); ev.preventDefault(); } else if (ev.key === 'Enter') { pilih(sorot); ev.preventDefault(); } });
    m.on('click', '[data-i]', function (t) { pilih(Number(t.dataset.i)); });
    gambar(); setTimeout(function () { inp.focus(); }, 80);
  };

  /* ---------- Mulai ---------- */
  D.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-a-profil], #tb-profil'); if (t) { ev.preventDefault(); App.profil(); return; }
    if (ev.target.closest('#tb-lonceng')) { App.lonceng(); return; }
    if (ev.target.closest('#tb-cari')) { MR.palet(); return; }
    if (ev.target.closest('[data-demo-peran]')) { App.gantiPeranDemo(); return; }
    if (ev.target.closest('[data-demo-reset]')) { MR.UI.konfirmasi({ judul: 'Reset data demo?', pesan: 'Semua perubahan di browser ini akan dihapus dan data contoh dibuat ulang.', ok: 'Reset data', bahaya: true }).then(function (y) { if (!y) return; API.resetDemo(); Sesi.hapus(); location.hash = '#/masuk'; location.reload(); }); }
  });

  function muatKonfigPublik() {
    /* Snapshot publik: dari repo (config/app-config.json, hasil sinkron GitHub Actions) lalu backend */
    var dariRepo = fetch('config/app-config.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return dariRepo.then(function (cfg) {
      if (cfg && cfg.nama_app) App.terapkanPublik(cfg);
      if (API.mode === 'demo') return API.panggil('pub.config', {}, { diam: true }).then(App.terapkanPublik).catch(function () { });
    });
  }

  /* ---------- Pengaman loading: tidak ada indikator yang tertinggal saat jaringan putus / timeout ---------- */
  (function () {
    var mulaiAsli = MR.Muat.mulai, sejak = 0;
    MR.Muat.mulai = function () { if (!MR.Muat.n) sejak = Date.now(); return mulaiAsli.apply(MR.Muat, arguments); };
    setInterval(function () {
      if (MR.Muat.n > 0 && Date.now() - sejak > 100000) { MR.Muat.n = 1; MR.Muat.selesai(); }   // > batas waktu permintaan + 1x ulang
      MR.qsa('.btn.memuat').forEach(function (b) { var t = Number(b.dataset.memuatSejak || 0); if (!t) b.dataset.memuatSejak = Date.now(); else if (Date.now() - t > 100000) { b.classList.remove('memuat'); delete b.dataset.memuatSejak; } });
      MR.qsa('.btn:not(.memuat)[data-memuat-sejak]').forEach(function (b) { delete b.dataset.memuatSejak; });
    }, 5000);
    W.addEventListener('offline', function () { MR.UI.toast('Koneksi internet terputus. Data tersimpan tetap ditampilkan.', 'warn'); });
    W.addEventListener('online', function () { MR.UI.toast('Kembali online.', 'ok', { durasi: 2000 }); if (Sesi.token) MR.Router.segarkanDiam(); });
  })();

  /* ---------- Sentuhan: riak cahaya air pada tombol & menu (300 ms) ---------- */
  var SEL_RIAK = '.btn.primer, .btn.gelap, .btn.wa, .btn.lembut, .sb-item, .bawah-nav a, .seg button';
  D.addEventListener('pointerdown', function (ev) {
    if (ev.button > 0 || D.documentElement.dataset.animasi === 'mati') return;
    var b = ev.target.closest && ev.target.closest(SEL_RIAK); if (!b || b.disabled || b.classList.contains('memuat')) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = D.createElement('span');
    s.className = 'riak'; s.setAttribute('aria-hidden', 'true');
    s.style.width = s.style.height = d + 'px'; s.style.left = (ev.clientX - r.left - d / 2) + 'px'; s.style.top = (ev.clientY - r.top - d / 2) + 'px';
    b.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 380);
  }, { passive: true });

  /* ---------- Kaskade 40 ms: kartu muncul berurutan saat pindah halaman / ganti tab ---------- */
  var kaskadeBerikut = false;
  D.addEventListener('seg', function () { kaskadeBerikut = true; setTimeout(function () { kaskadeBerikut = false; }, 1500); });
  var SEL_KASKADE = '.kepala-hal, .banner, .peringatan, .judul-seksi, .kpi, .isi-hal > .kartu, .isi-hal > div > .kartu, .grid > .kartu, .gulir-x > *, .tabel-wadah, .kartu-paket';
  function pasangKaskade(hal) {
    var maks = W.innerHeight + 120, i = 0;
    MR.qsa(SEL_KASKADE, hal).forEach(function (el) {
      if (i >= 18 || el.parentNode.closest('.kaskade')) return;
      if (el.getBoundingClientRect().top > maks) return;
      el.style.setProperty('--d', (i++ * 40) + 'ms'); el.classList.add('kaskade');
    });
  }
  function amatiIsi() {
    var isi = D.getElementById('isi'); if (!isi || !W.MutationObserver) return;
    new MutationObserver(function (list) {
      list.forEach(function (m) { m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1 || !n.classList.contains('isi-hal')) return;
        if (n.classList.contains('masuk') || (n.classList.contains('pudar') && kaskadeBerikut)) { if (kaskadeBerikut) n.classList.add('kaskade-ya'); kaskadeBerikut = false; pasangKaskade(n); }
      }); });
    }).observe(isi, { childList: true });
  }

  App.mulai = function () {
    if (API.mode === 'demo') { var pita = D.getElementById('demo-pita'); if (pita) pita.hidden = false; }
    amatiIsi();
    Sesi.muat();
    MR.mulai({
      siapkan: function () {
        return muatKonfigPublik().then(function () {
          if (!Sesi.token) return;
          App.bangunMenu(); jalankanJam(); MR.Router.awal = App.beranda();
          return API.panggil('auth.saya', {}, { diam: true }).then(function (d) {
            Sesi.simpan({ me: d.me, izin: d.izin, hakVersi: d.hakVersi });
            if (API.mode === 'live' && d.publik) App.terapkanPublik(d.publik);
            App.bangunMenu(); prefetch();
          }).catch(function (er) { if (er && er.code === 'AUTH') Sesi.hapus(); });
        });
      }
    });
    D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'visible' && Sesi.token) jalankanJam(); });
    /* PWA: service worker hanya untuk aset statis; tidak dipasang di localhost agar pengembangan tidak tertahan cache */
    if ('serviceWorker' in navigator && location.protocol === 'https:' && !/^(localhost|127\.)/.test(location.hostname)) {
      W.addEventListener('load', function () { try { navigator.serviceWorker.register('sw.js').catch(function () { }); } catch (e) { } });
    }
  };
  if (D.readyState === 'complete') App.mulai(); else D.addEventListener('DOMContentLoaded', App.mulai);
})(window, document);
