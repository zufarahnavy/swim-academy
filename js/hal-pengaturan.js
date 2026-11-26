/* =====================================================================
 * PENGATURAN (identitas, tema, paket, master, form builder, absensi, sinkron),
 * HARGA·TARIF·ATURAN (Owner), HAK AKSES (Owner), AKUN, LOG AUDIT
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router, OA = ['owner', 'admin'];
  var LABEL_WARNA = { primer: 'Primer (tombol, menu aktif)', aksen: 'Aksen / hover', sidebar: 'Sidebar', menu: 'Teks menu sidebar', banner: 'Banner beranda', latar: 'Latar halaman', permukaan: 'Kartu / permukaan', primer_muda: 'Primer muda (latar lembut)', teks: 'Teks utama', teks2: 'Teks sekunder', sukses: 'Sukses', peringatan: 'Peringatan', bahaya: 'Bahaya' };
  var LABEL_TIPE = { teks: 'Teks singkat', angka: 'Angka', tanggal: 'Tanggal', pilihan: 'Pilihan', dropdown: 'Dropdown', berkas: 'Berkas', area: 'Teks panjang', blok_harga: 'Blok harga', blok_rekening: 'Blok rekening', blok_persetujuan: 'Blok persetujuan' };

  /* ================= Pengaturan ================= */
  R.daftar('pengaturan', {
    judul: 'Pengaturan', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st;
      return API.Q('atur.ambil').then(function (d) {
        if (ctx.basi()) return;
        var b = d.bisa, tabs = [];
        if (b.tampilan) tabs.push({ v: 'identitas', label: 'Identitas', ikon: 'gedung' }, { v: 'tema', label: 'Tampilan', ikon: 'palet' });
        if (b.master) tabs.push({ v: 'paket', label: 'Paket & kategori', ikon: 'tag' }, { v: 'master', label: 'Kolam & pelatih', ikon: 'data' });
        if (b.form) tabs.push({ v: 'form', label: 'Form pendaftaran', ikon: 'formulir' });
        if (b.batas) tabs.push({ v: 'absensi', label: 'Absensi', ikon: 'jam' });
        if (b.sinkron) tabs.push({ v: 'sinkron', label: 'Sinkronisasi', ikon: 'awan' });
        st.tab = st.tab && tabs.some(function (t) { return t.v === st.tab; }) ? st.tab : tabs[0].v;
        var sk = d.sinkron;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Pengaturan Aplikasi</h1><p>Perubahan tampilan & form tersimpan di backend lalu dipublikasikan ke GitHub Pages (snapshot v' + d.publik_versi + '). Harga & rekening hanya di menu Owner.</p></div><div class="aksi"><span class="chip-sinkron ' + (sk.status === 'Gagal' ? 'gagal' : /Menunggu/.test(sk.status) ? 'tunggu' : '') + '"><i></i>' + e(sk.status) + '</span></div></div>' +
          UI2.seg('tab', tabs, st.tab) + '<div id="atur-isi" class="mt16"></div>';
        var w = ctx.el.querySelector('#atur-isi');
        ({ identitas: tabIdentitas, tema: tabTema, paket: tabPaket, master: tabMaster, form: tabForm, absensi: tabAbsensi, sinkron: tabSinkron })[st.tab](ctx, w, d);
        ctx.on('seg', '.seg[data-seg=tab]', function (s, ev) { st.tab = ev.detail.v; R.tampilkan({ diam: true, bingkai: true }); });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });
  function hasilSinkron(r) { var s = r && r.sinkron; if (!s) return; MR.UI.toast(s.status === 'Tersinkron' ? 'Tersimpan & dipublikasikan (v' + s.versi + ').' : s.status === 'Gagal' ? 'Tersimpan, tetapi sinkron gagal: ' + s.pesan : 'Tersimpan · ' + s.status + '.', s.status === 'Gagal' ? 'warn' : 'ok'); }

  function tabIdentitas(ctx, w, d) {
    var id = d.identitas, owner = d.bisa.owner;
    w.innerHTML = '<div class="grid g-2-1"><form class="kartu pad" id="f-id"><b>Identitas aplikasi</b><div class="form mt16">' +
      UI2.fld({ k: 'nama_app', label: 'Nama aplikasi', v: id.nama_app, wajib: true, l: 'l3' }) + UI2.fld({ k: 'kontak_admin', label: 'WhatsApp Admin (publik)', v: id.kontak_admin, l: 'l3', ph: '08xxxxxxxxxx' }) +
      UI2.fld({ k: 'tagline', label: 'Tagline', v: id.tagline }) + UI2.fld({ k: 'alamat', label: 'Alamat (untuk kop dokumen)', v: id.alamat, tipe: 'area', baris: 2 }) +
      (owner ? UI2.fld({ k: 'email_owner', label: 'Email Owner (notifikasi penting)', v: id.email_owner, tipe: 'email' }) : '') +
      '<div class="fld"><button type="submit" class="btn primer">Simpan identitas</button></div></div></form>' +
      '<div class="kartu pad"><b>Logo & favicon</b><p class="kecil redup">PNG/SVG/ICO maks. 1 MB. Disimpan di Drive, dipakai di sidebar, halaman masuk, formulir, dan dokumen.</p>' +
      ['logo', 'favicon'].map(function (j) { return '<div class="item-ikon mt12"><span class="sb-logo" style="background:#F1F5F9"><img src="' + e(id[j] || (j === 'logo' ? 'assets/logo.svg' : 'assets/favicon.svg')) + '" alt=""></span><div class="tumbuh"><b class="kecil">' + (j === 'logo' ? 'Logo' : 'Favicon') + '</b><div class="kecil redup">' + (id[j] ? 'Kustom' : 'Bawaan') + '</div></div><label class="btn kecil">' + ik('unggah', 'k') + 'Ganti<input type="file" hidden accept="image/png,image/svg+xml,image/x-icon" data-unggah="' + j + '"></label></div>'; }).join('') + '</div></div>';
    w.querySelector('#f-id').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target, v = UI2.baca(f); MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('atur.simpan', { bagian: 'identitas', nilai: Object.assign({}, id, v) }); }, { form: f }).then(function (r) { App.terapkanPublik({ nama_app: r.nilai.nama_app, tagline: r.nilai.tagline }); hasilSinkron(r); R.muatUlang(); }).catch(function () { }); });
    w.addEventListener('change', function (ev) {
      var inp = ev.target.closest('[data-unggah]'); if (!inp) return; var j = inp.dataset.unggah;
      UI2.bacaBerkas(inp.files[0], { maksMB: 1, tipe: /^image\/(png|svg\+xml|x-icon|vnd\.microsoft\.icon)$/, kompres: false, pesanTipe: 'Format harus PNG, SVG, atau ICO.' }).then(function (b) {
        return API.T('atur.unggah', { jenis: j, berkas: { nama: b.nama, mime: b.mime, base64: b.base64 } });
      }).then(function (r) { var o = {}; o[j] = r.url; App.terapkanPublik(o); hasilSinkron(r); R.muatUlang(); }).catch(MR.UI.galat);
    });
  }

  function tabTema(ctx, w, d) {
    var t = JSON.parse(JSON.stringify(d.tema));
    w.innerHTML = '<div class="dua-kolom"><form class="kartu pad" id="f-tema"><b>Warna & huruf</b><p class="kecil redup">Setiap pasangan warna wajib lolos kontras WCAG AA 4,5:1 — server menolak bila tidak.</p><div class="form mt16">' +
      UI2.fld({ k: 'font_judul', label: 'Huruf judul', tipe: 'select', opsi: d.fontKurasi, v: t.font_judul, l: 'l3', kosong: false }) + UI2.fld({ k: 'font_isi', label: 'Huruf isi', tipe: 'select', opsi: d.fontKurasi, v: t.font_isi, l: 'l3', kosong: false }) +
      '<div class="fld"><label>Animasi</label>' + UI2.seg('animasi', [{ v: 'normal', label: 'Normal' }, { v: 'kurang', label: 'Dikurangi' }, { v: 'mati', label: 'Mati' }], t.animasi, 'lebar') + '</div>' +
      Object.keys(LABEL_WARNA).map(function (k) { return '<div class="fld l3" data-k="warna_' + k + '"><label>' + e(LABEL_WARNA[k]) + '</label><div class="warna-pilih"><input type="color" data-w="' + k + '" value="' + e(t.warna[k]) + '"><input class="inp angka" data-wt="' + k + '" value="' + e(t.warna[k]) + '" maxlength="7"></div><span class="galat"></span></div>'; }).join('') +
      '<div class="fld"><div class="baris"><button type="button" class="btn" data-x="bawaan">' + ik('segar', 'k') + 'Kembalikan bawaan</button><button type="submit" class="btn primer tumbuh">Simpan tampilan</button></div></div></div></form>' +
      '<div class="lengket tumpuk" style="gap:16px"><div class="kartu pad"><b>Pratinjau langsung</b><div class="pratinjau-tema mt12" id="pv"></div></div><div class="kartu pad"><b>Uji kontras</b><div class="uji-kontras mt12" id="uk"></div></div></div></div>';
    var f = w.querySelector('#f-tema'), pv = w.querySelector('#pv'), uk = w.querySelector('#uk');
    function gambar() {
      var c = t.warna;
      pv.innerHTML = '<div style="background:' + c.sidebar + ';padding:12px 8px;display:flex;flex-direction:column;gap:6px"><div style="height:22px;width:22px;border-radius:6px;background:#fff;margin:0 auto 8px"></div><div style="height:22px;border-radius:7px;background:' + c.primer + '"></div>' + [1, 2, 3].map(function () { return '<div style="height:8px;border-radius:4px;background:' + c.menu + ';opacity:.6;margin:6px 4px"></div>'; }).join('') + '</div>' +
        '<div style="background:' + c.latar + ';padding:12px;display:flex;flex-direction:column;gap:10px;font-family:' + (t.font_isi === 'Sistem' ? 'system-ui' : '"' + t.font_isi + '"') + '"><div style="background:linear-gradient(115deg,' + c.banner + ',' + c.aksen + ');color:#fff;border-radius:10px;padding:10px;font:700 13px ' + (t.font_judul === 'Sistem' ? 'system-ui' : '"' + t.font_judul + '"') + '">Selamat pagi, Hendro.</div>' +
        '<div style="background:' + c.permukaan + ';border-radius:10px;padding:10px;border:1px solid rgba(226,232,240,.8)"><div style="color:' + c.teks + ';font-weight:700;font-size:12px">Kartu sesi</div><div style="color:' + c.teks2 + ';font-size:11px">08:00 · Coach Budi</div><div style="display:flex;gap:6px;margin-top:8px"><span style="background:' + c.primer + ';color:#fff;font-size:10px;padding:4px 8px;border-radius:6px">Simpan</span><span style="background:' + c.primer_muda + ';color:' + c.teks + ';font-size:10px;padding:4px 8px;border-radius:6px">Batal</span></div></div>' +
        '<div style="display:flex;gap:6px">' + ['sukses', 'peringatan', 'bahaya'].map(function (k) { return '<span style="background:' + c[k] + ';color:#fff;font-size:10px;padding:3px 8px;border-radius:99px">' + k + '</span>'; }).join('') + '</div></div>';
      var uji = Inti.util.ujiKontras(c), gagal = uji.filter(function (x) { return !x.lolos; }).length;
      uk.innerHTML = '<div class="peringatan ' + (gagal ? 'bahaya' : 'ok') + '" style="grid-column:1/-1">' + ik(gagal ? 'segitiga' : 'cekBulat') + '<div><b>' + (gagal ? gagal + ' pasangan belum lolos' : 'Semua pasangan lolos WCAG AA') + '</b></div></div>' + uji.map(function (x) { return '<div class="' + (x.lolos ? '' : 'gagal') + '"><span class="baris" style="gap:6px"><i style="width:14px;height:14px;border-radius:4px;background:' + x.b + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)"></i>' + e(x.pasangan) + '</span><b class="angka">' + String(x.rasio).replace('.', ',') + ':1</b></div>'; }).join('');
    }
    gambar();
    f.addEventListener('input', function (ev) {
      var k = ev.target.dataset.w || ev.target.dataset.wt; if (!k) return;
      var v = ev.target.value.toUpperCase(); if (!/^#[0-9A-F]{6}$/.test(v)) return;
      t.warna[k] = v; f.querySelector('[data-w=' + k + ']').value = v; f.querySelector('[data-wt=' + k + ']').value = v; gambar();
    });
    f.addEventListener('change', function (ev) { if (ev.target.name === 'font_judul' || ev.target.name === 'font_isi') { t[ev.target.name] = ev.target.value; gambar(); } });
    UI2.hidupkanSeg(f); f.addEventListener('seg', function (ev) { t.animasi = ev.detail.v; });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('atur.simpan', { bagian: 'tema', nilai: t }); }, { form: f }).then(function (r) { App.terapkanTema(r.nilai); hasilSinkron(r); R.muatUlang(); }).catch(function () { });
    });
    w.querySelector('[data-x=bawaan]').onclick = function (ev) { MR.UI.kerja(ev.currentTarget, function () { return API.T('atur.simpan', { bagian: 'tema', bawaan: true }); }).then(function (r) { App.terapkanTema(r.nilai); hasilSinkron(r); R.muatUlang(); }).catch(function () { }); };
  }

  function tabPaket(ctx, w, d) {
    var m = d.master, jenis = d.jenis_paket.slice();
    w.innerHTML = '<div class="kartu pad"><div class="baris bungkus"><div class="tumpuk tumbuh"><b>Jenis paket</b><span class="kecil redup">Dipakai untuk kategori sesi & tarif honor (Home Visit otomatis jadi "HV …").</span></div></div><div class="baris bungkus mt12" id="jenis" style="gap:6px"></div><div class="baris mt12"><input class="inp" id="jenis-baru" placeholder="Jenis baru, mis. Aquababy" style="max-width:260px"><button type="button" class="btn" data-x="tambahJenis">' + ik('plus', 'k') + 'Tambah</button><button type="button" class="btn primer" data-x="simpanJenis">Simpan jenis</button></div></div>' +
      '<section class="kartu mt16"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Paket latihan</h2><p>Harga diatur Owner di menu Harga, Tarif & Aturan.</p></div><button type="button" class="btn kecil primer" data-x="paketBaru">' + ik('plus', 'k') + 'Paket</button></div>' +
      UI2.tabel({ baris: m.paket, kolom: [{ label: 'Paket', f: function (p) { return '<div class="tumpuk" style="gap:3px">' + UI2.lencana(p.kategori) + '<b>' + e(p.nama) + '</b></div>'; } }, { label: 'Sesi', kanan: true, k: 'jumlah_sesi' }, { label: 'Peserta', f: function (p) { return p.peserta_termasuk + (p.maks_peserta > p.peserta_termasuk ? '–' + p.maks_peserta : ''); } }, { label: 'Durasi', f: function (p) { return p.durasi_menit + ' mnt'; } }, { label: 'Status', f: function (p) { return UI2.status(p.aktif === 'T' ? 'Nonaktif' : 'Aktif'); } }, { label: '', f: function (p) { return '<button type="button" class="btn kecil" data-x="paket" data-id="' + e(p.paket_id) + '">' + ik('pensil', 'k') + 'Ubah</button>'; } }] }) + '</section>' +
      '<section class="kartu mt16"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Kategori kas</h2><p>Kategori sistem (otomatis dari verifikasi) tidak bisa diubah.</p></div><button type="button" class="btn kecil primer" data-x="katBaru">' + ik('plus', 'k') + 'Kategori</button></div>' +
      UI2.tabel({ baris: m.kategori_kas, kolom: [{ label: 'Nama', f: function (k) { return '<b>' + e(k.nama) + '</b>' + (k.sistem === 'Y' ? ' <span class="tag-kecil kunci">' + ik('gembok', 'k') + 'sistem</span>' : ''); } }, { label: 'Tipe', f: function (k) { return '<span class="status ' + (k.tipe === 'Pemasukan' ? 'ok' : 'habis') + ' polos">' + e(k.tipe) + '</span>'; } }, { label: 'Status', f: function (k) { return UI2.status(k.aktif === 'T' ? 'Nonaktif' : 'Aktif'); } }, { label: '', f: function (k) { return k.sistem === 'Y' ? '' : '<button type="button" class="btn kecil" data-x="kat" data-id="' + e(k.kategori_id) + '">' + ik('pensil', 'k') + 'Ubah</button>'; } }] }) + '</section>';
    function chips() { w.querySelector('#jenis').innerHTML = jenis.map(function (j, i) { return '<span class="chip aktif">' + e(j) + '<button type="button" data-hj="' + i + '" style="background:none;border:0;color:#fff;cursor:pointer;padding:0 0 0 4px" aria-label="Hapus ' + e(j) + '">×</button></span>'; }).join(''); }
    chips();
    w.addEventListener('click', function (ev) {
      var hj = ev.target.closest('[data-hj]'); if (hj) { jenis.splice(Number(hj.dataset.hj), 1); chips(); return; }
      var b = ev.target.closest('[data-x]'); if (!b) return; var x = b.dataset.x;
      if (x === 'tambahJenis') { var v = w.querySelector('#jenis-baru').value.trim(); if (v && jenis.indexOf(v) < 0) jenis.push(v); w.querySelector('#jenis-baru').value = ''; chips(); }
      if (x === 'simpanJenis') MR.UI.kerja(b, function () { return API.T('atur.simpan', { bagian: 'jenis_paket', nilai: jenis }); }).then(function (r) { hasilSinkron(r); R.muatUlang(); }).catch(function () { });
      if (x === 'paketBaru' || x === 'paket') formMaster('Paket', x === 'paket' ? m.paket.filter(function (p) { return p.paket_id === b.dataset.id; })[0] : {}, d);
      if (x === 'katBaru' || x === 'kat') formMaster('Kategori_Kas', x === 'kat' ? m.kategori_kas.filter(function (k) { return k.kategori_id === b.dataset.id; })[0] : {}, d);
    });
  }
  function tabMaster(ctx, w, d) {
    var m = d.master;
    w.innerHTML = '<div class="grid g2"><section class="kartu"><div class="kartu-kepala"><span class="ubin">' + ik('renang') + '</span><div class="tumpuk tumbuh"><h2>Kolam mitra</h2><p>' + m.kolam.length + ' lokasi</p></div><button type="button" class="btn kecil primer" data-x="kolamBaru">' + ik('plus', 'k') + 'Kolam</button></div>' +
      UI2.tabel({ baris: m.kolam, kolom: [{ label: 'Kolam', f: function (k) { return '<div class="tumpuk"><b>' + e(k.nama_resmi) + '</b><small class="redup">' + e(k.alamat || '') + '</small></div>'; } }, { label: 'Kode', f: function (k) { return '<span class="tag-kecil">' + e(k.singkatan) + '</span>'; } }, { label: 'Status', f: function (k) { return UI2.status(k.aktif === 'T' ? 'Nonaktif' : 'Aktif'); } }, { label: '', f: function (k) { return '<button type="button" class="btn kecil" data-x="kolam" data-id="' + e(k.kolam_id) + '">Ubah</button>'; } }] }) + '</section>' +
      '<section class="kartu"><div class="kartu-kepala"><span class="ubin ungu">' + ik('peluit') + '</span><div class="tumpuk tumbuh"><h2>Pelatih</h2><p>Akun login pelatih dibuat di menu Akun</p></div><button type="button" class="btn kecil primer" data-x="pelatihBaru">' + ik('plus', 'k') + 'Pelatih</button></div>' +
      UI2.tabel({ baris: m.pelatih, kolom: [{ label: 'Pelatih', f: function (c) { return '<div class="sel-utama">' + UI2.avatar(c.nama, 'kecil') + '<span class="tumpuk"><b>' + e(c.nama) + '</b><small>' + e(c.lisensi || 'Tanpa lisensi') + '</small></span></div>'; } }, { label: 'L/P', k: 'jenis_kelamin' }, { label: 'Kontak', f: function (c) { return '<span class="angka kecil">' + e(c.kontak || '-') + '</span>'; } }, { label: 'Status', f: function (c) { return UI2.status(c.aktif === 'T' ? 'Nonaktif' : 'Aktif'); } }, { label: '', f: function (c) { return '<button type="button" class="btn kecil" data-x="pelatih" data-id="' + e(c.coach_id) + '">Ubah</button>'; } }] }) + '</section></div>';
    w.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-x]'); if (!b) return; var x = b.dataset.x;
      if (x === 'kolamBaru' || x === 'kolam') formMaster('Kolam', x === 'kolam' ? m.kolam.filter(function (k) { return k.kolam_id === b.dataset.id; })[0] : {}, d);
      if (x === 'pelatihBaru' || x === 'pelatih') formMaster('Pelatih', x === 'pelatih' ? m.pelatih.filter(function (c) { return c.coach_id === b.dataset.id; })[0] : {}, d);
    });
  }
  function formMaster(tabel, x, d) {
    var baru = !(x.paket_id || x.kolam_id || x.coach_id || x.kategori_id), aktif = UI2.fld({ k: 'aktif', label: 'Status', tipe: 'select', opsi: [{ v: 'Y', l: 'Aktif' }, { v: 'T', l: 'Nonaktif' }], v: x.aktif || 'Y', kosong: false, l: 'l3' }), isi;
    if (tabel === 'Paket') isi = UI2.fld({ k: 'nama', label: 'Nama paket', v: x.nama, wajib: true }) + UI2.fld({ k: 'jenis', label: 'Jenis', tipe: 'select', opsi: d.jenis_paket, v: x.jenis, l: 'l3' }) + UI2.fld({ k: 'lokasi', label: 'Lokasi', tipe: 'select', opsi: ['Kolam', 'Home Visit'], v: x.lokasi || 'Kolam', l: 'l3', kosong: false }) +
      UI2.fld({ k: 'jumlah_sesi', label: 'Jumlah sesi', tipe: 'number', v: x.jumlah_sesi || 8, l: 'l2' }) + UI2.fld({ k: 'peserta_termasuk', label: 'Peserta termasuk harga', tipe: 'number', v: x.peserta_termasuk || 1, l: 'l2' }) + UI2.fld({ k: 'maks_peserta', label: 'Maks peserta', tipe: 'number', v: x.maks_peserta || 1, l: 'l2' }) +
      UI2.fld({ k: 'durasi_menit', label: 'Durasi (menit)', tipe: 'number', v: x.durasi_menit || 60, l: 'l2' }) + UI2.fld({ k: 'urutan', label: 'Urutan tampil', tipe: 'number', v: x.urutan || 99, l: 'l2' }) + aktif.replace('l3', 'l2');
    else if (tabel === 'Kolam') isi = UI2.fld({ k: 'nama_resmi', label: 'Nama resmi kolam', v: x.nama_resmi, wajib: true, l: 'l4' }) + UI2.fld({ k: 'singkatan', label: 'Kode (maks 8)', v: x.singkatan, wajib: true, l: 'l2' }) + UI2.fld({ k: 'alamat', label: 'Alamat', v: x.alamat, tipe: 'area', baris: 2 }) + aktif;
    else if (tabel === 'Pelatih') isi = UI2.fld({ k: 'nama', label: 'Nama pelatih', v: x.nama, wajib: true, l: 'l4' }) + UI2.fld({ k: 'jenis_kelamin', label: 'L/P', tipe: 'select', opsi: [{ v: 'L', l: 'Laki-laki' }, { v: 'P', l: 'Perempuan' }], v: x.jenis_kelamin, l: 'l2' }) + UI2.fld({ k: 'kontak', label: 'WhatsApp', v: x.kontak, l: 'l3' }) + UI2.fld({ k: 'lisensi', label: 'Lisensi / sertifikasi', v: x.lisensi, l: 'l3' }) + aktif;
    else isi = UI2.fld({ k: 'nama', label: 'Nama kategori', v: x.nama, wajib: true, l: 'l3' }) + UI2.fld({ k: 'tipe', label: 'Tipe', tipe: 'select', opsi: ['Pemasukan', 'Pengeluaran'], v: x.tipe || 'Pengeluaran', l: 'l3', kosong: false }) + aktif;
    var nama = { Paket: 'paket', Kolam: 'kolam', Pelatih: 'pelatih', Kategori_Kas: 'kategori kas' }[tabel];
    var m = MR.UI.modal({ judul: (baru ? 'Tambah ' : 'Ubah ') + nama, isi: '<form class="form">' + isi + '</form>', kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan</button>' });
    m.el.querySelector('[data-ok]').onclick = function () {
      var f = m.el.querySelector('form'), v = UI2.baca(f), idk = { Paket: 'paket_id', Kolam: 'kolam_id', Pelatih: 'coach_id', Kategori_Kas: 'kategori_id' }[tabel]; if (x[idk]) v[idk] = x[idk];
      MR.UI.kerja(this, function () { return API.T('master.simpan', { tabel: tabel, baris: v }); }, { form: f }).then(function (r) { m.tutup(); if (r.sinkron) hasilSinkron(r); else MR.UI.toast('Tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { });
    };
  }

  /* Form builder: susun ulang (seret/↑↓), ubah label, tambah kolom; blok tetap & kolom inti terkunci */
  function tabForm(ctx, w, d) {
    var sk = JSON.parse(JSON.stringify(d.form.skema)), pilih = 0;
    w.innerHTML = '<div class="dua-kolom"><div class="kartu pad"><div class="baris bungkus"><div class="tumpuk tumbuh"><b>Susunan formulir (v' + d.form.versi + ')</b><span class="kecil redup">Seret ⋮⋮ atau ↑↓ untuk mengurutkan. Blok harga, rekening, dan persetujuan tidak bisa dihapus.</span></div></div><div class="tumpuk mt12" id="fb" style="gap:8px"></div>' +
      '<div class="baris bungkus mt12"><select class="inp" id="fb-tipe" style="width:auto">' + d.form.tipe.map(function (t) { return '<option value="' + t + '">' + LABEL_TIPE[t] + '</option>'; }).join('') + '</select><button type="button" class="btn" data-x="tambah">' + ik('plus', 'k') + 'Tambah kolom</button><span class="tumbuh"></span><button type="button" class="btn" data-x="bawaan">Bawaan</button><button type="button" class="btn primer" data-x="simpan">Simpan form</button></div></div>' +
      '<div class="lengket tumpuk" style="gap:16px"><div class="kartu pad" id="fb-edit"></div><div class="kartu pad"><b>Pratinjau di HP</b><div style="margin:12px auto 0;max-width:300px;border:8px solid #0F172A;border-radius:28px;overflow:hidden;background:var(--latar)"><div id="fb-pv" style="max-height:480px;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px"></div></div></div></div></div>';
    var list = w.querySelector('#fb'), ed = w.querySelector('#fb-edit'), pv = w.querySelector('#fb-pv');
    function kunci(f) { return f.tetap || f.inti; }
    function gambar() {
      list.innerHTML = sk.map(function (f, i) { return '<div class="fb-item' + (i === pilih ? ' dipilih' : '') + (f.tetap ? ' tetap' : '') + '" data-i="' + i + '" draggable="true"><span class="fb-pegang" aria-hidden="true">' + ik('seret', 'k') + '</span><div class="tumbuh item-klik" data-p="' + i + '" style="min-width:0;cursor:pointer"><b class="kecil satu-baris" style="display:block">' + e(f.label || f.kunci) + '</b><div class="baris bungkus" style="gap:4px;margin-top:3px"><span class="tag-kecil">' + e(LABEL_TIPE[f.tipe] || f.tipe) + '</span>' + (f.wajib ? '<span class="tag-kecil wajib">wajib</span>' : '') + (f.tetap ? '<span class="tag-kecil kunci">' + ik('gembok', 'k') + 'tetap</span>' : f.inti ? '<span class="tag-kecil kunci">inti</span>' : '') + '</div></div><button type="button" class="btn ikon hantu kecil" data-g="-1" data-i="' + i + '" aria-label="Naik"' + (i ? '' : ' disabled') + '>' + ik('atas', 'k') + '</button><button type="button" class="btn ikon hantu kecil" data-g="1" data-i="' + i + '" aria-label="Turun"' + (i < sk.length - 1 ? '' : ' disabled') + '>' + ik('bawah', 'k') + '</button></div>'; }).join('');
      var f = sk[pilih];
      ed.innerHTML = '<b>Ubah kolom</b>' + (f.tetap ? '<div class="peringatan info mt12">' + ik('gembok') + '<div><b>' + e(f.label) + '</b>Blok tetap — isi dikendalikan sistem (harga resmi, rekening Owner, teks persetujuan).</div></div>' :
        '<div class="form mt12">' + UI2.fld({ k: 'label', label: 'Label', v: f.label }) + UI2.fld({ k: 'bantu', label: 'Teks bantuan', v: f.bantu }) +
        (f.inti ? '<div class="fld"><span class="bantu">' + ik('info', 'k') + ' Kolom inti: tipe tetap' + (FORM_WAJIB(f) ? ', selalu wajib' : '') + '.</span></div>' : UI2.fld({ k: 'tipe', label: 'Tipe', tipe: 'select', opsi: d.form.tipe.map(function (t) { return { v: t, l: LABEL_TIPE[t] }; }), v: f.tipe, kosong: false })) +
        (!f.inti && (f.tipe === 'pilihan' || f.tipe === 'dropdown') ? UI2.fld({ k: 'opsi', label: 'Pilihan (satu per baris)', tipe: 'area', v: (f.opsi || []).join('\n'), baris: 4 }) : '') +
        '<div class="fld"><label class="saklar"><input type="checkbox" name="wajib"' + (f.wajib ? ' checked' : '') + (f.inti && FORM_WAJIB(f) ? ' disabled' : '') + '><i></i><span>Wajib diisi</span></label></div>' +
        (!kunci(f) ? '<div class="fld"><button type="button" class="btn bahaya kecil" data-x="hapus">' + ik('sampah', 'k') + 'Hapus kolom</button></div>' : '') + '</div>');
      pv.innerHTML = sk.map(function (f) {
        if (f.tipe === 'blok_harga') return '<div style="padding:10px;border-radius:10px;background:#E0F2FE;font-size:11px"><b>Total transfer</b><div style="font:800 16px var(--f-judul);color:#075985">Rp850.000</div></div>';
        if (f.tipe === 'blok_rekening') return '<div style="padding:10px;border-radius:10px;background:#F1F5F9;font-size:11px;border:1px solid #E2E8F0">' + ik('gembok', 'k') + ' <b>Rekening resmi</b><div>BCA · 52•••••920</div></div>';
        if (f.tipe === 'blok_persetujuan') return '<label style="display:flex;gap:6px;font-size:10.5px;color:#475569"><input type="checkbox" disabled checked> Saya menyetujui data anak disimpan…</label>';
        return '<div><div style="font-size:11px;font-weight:600;margin-bottom:3px">' + e(f.label) + (f.wajib ? ' <span style="color:#B91C1C">*</span>' : '') + '</div><div style="height:' + (f.tipe === 'area' ? 44 : 30) + 'px;border:1px solid #E2E8F0;border-radius:8px;background:#fff;font-size:10px;color:#94A3B8;padding:6px 8px">' + (f.tipe === 'berkas' ? '⬆ Unggah berkas' : f.tipe === 'tanggal' ? 'hh/bb/tttt' : (f.sumber || f.tipe === 'pilihan' || f.tipe === 'dropdown') ? 'Pilih…' : '') + '</div></div>';
      }).join('');
    }
    function FORM_WAJIB(f) { return ['nama', 'tgl_lahir', 'kategori', 'jenis_kelamin', 'nama_ortu', 'kontak', 'paket', 'kolam', 'jam'].indexOf(f.kunci) >= 0; }
    function pindah(a, b) { if (b < 0 || b >= sk.length) return; var x = sk.splice(a, 1)[0]; sk.splice(b, 0, x); pilih = b; gambar(); }
    gambar();
    ed.addEventListener('input', function (ev) { var f = sk[pilih], n = ev.target.name; if (!n || f.tetap) return; if (n === 'opsi') f.opsi = ev.target.value.split('\n'); else if (n === 'wajib') f.wajib = ev.target.checked; else f[n] = ev.target.value; if (n === 'tipe') { gambar(); return; } list.querySelector('[data-i="' + pilih + '"] b').textContent = f.label || f.kunci; });
    ed.addEventListener('change', function (ev) { var f = sk[pilih]; if (ev.target.name === 'wajib') { f.wajib = ev.target.checked; gambar(); } if (ev.target.name === 'tipe') { f.tipe = ev.target.value; gambar(); } });
    w.addEventListener('click', function (ev) {
      var p = ev.target.closest('[data-p]'); if (p) { pilih = Number(p.dataset.p); gambar(); return; }
      var g = ev.target.closest('[data-g]'); if (g) { pindah(Number(g.dataset.i), Number(g.dataset.i) + Number(g.dataset.g)); return; }
      var b = ev.target.closest('[data-x]'); if (!b) return; var x = b.dataset.x;
      if (x === 'tambah') { var t = w.querySelector('#fb-tipe').value; sk.splice(sk.length - 3, 0, { kunci: 'kolom_' + Date.now().toString(36), label: 'Kolom baru', tipe: t, wajib: false, opsi: t === 'pilihan' || t === 'dropdown' ? ['Pilihan 1', 'Pilihan 2'] : undefined }); pilih = sk.length - 4; gambar(); }
      if (x === 'hapus') { sk.splice(pilih, 1); pilih = Math.max(0, pilih - 1); gambar(); }
      if (x === 'simpan') MR.UI.kerja(b, function () { return API.T('form.simpan', { skema: sk.map(function (f) { var o = Object.assign({}, f); if (o.opsi) o.opsi = o.opsi.filter(Boolean); return o; }) }); }).then(function (r) { hasilSinkron(r); R.muatUlang(); }).catch(function () { });
      if (x === 'bawaan') MR.UI.konfirmasi({ judul: 'Kembalikan form bawaan?', pesan: 'Kolom tambahan akan dihapus dari formulir (data lama tetap tersimpan).', ok: 'Kembalikan' }).then(function (y) { if (y) API.T('form.simpan', { bawaan: true }).then(function (r) { hasilSinkron(r); R.muatUlang(); }).catch(MR.UI.galat); });
    });
    /* Seret-lepas (mouse & sentuh lewat pegangan) */
    var dariI = null;
    list.addEventListener('dragstart', function (ev) { var it = ev.target.closest('.fb-item'); if (!it) return; dariI = Number(it.dataset.i); ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', String(dariI)); } catch (z) { } });
    list.addEventListener('dragover', function (ev) { var it = ev.target.closest('.fb-item'); if (!it || dariI == null) return; ev.preventDefault(); MR.qsa('.fb-item', list).forEach(function (x) { x.classList.toggle('seret-atas', x === it); }); });
    list.addEventListener('drop', function (ev) { var it = ev.target.closest('.fb-item'); if (!it || dariI == null) return; ev.preventDefault(); pindah(dariI, Number(it.dataset.i)); dariI = null; });
    list.addEventListener('dragend', function () { dariI = null; MR.qsa('.fb-item', list).forEach(function (x) { x.classList.remove('seret-atas'); }); });
  }
  function tabAbsensi(ctx, w, d) {
    var a = d.absensi;
    w.innerHTML = '<div class="grid g2"><form class="kartu pad" id="f-ab"><b>Batas waktu absensi</b><p class="kecil redup">Dihitung dari jam server WIB untuk semua pelatih. Pukul ' + e(a.jam_batas) + ':00 masih diterima, ' + e(a.jam_batas) + ':01 ditolak.</p><div class="form mt16">' + UI2.fld({ k: 'jam_batas', label: 'Jam batas', tipe: 'time', v: a.jam_batas, l: 'l3' }) + '<div class="fld l3"><label>Status</label><label class="saklar" style="height:var(--tinggi-input)"><input type="checkbox" name="batas_aktif"' + (a.batas_aktif ? ' checked' : '') + '><i></i><span>Batas aktif</span></label></div><div class="fld"><button type="submit" class="btn primer">Simpan</button></div></div></form>' +
      '<div class="kartu pad"><b>Aturan pemotongan sesi</b><p class="kecil redup mt8">Status yang memotong sisa sesi, sisa sesi saat perpanjangan, dan absensi saat paket HABIS diatur Owner di <a href="#/harga">Harga, Tarif & Aturan</a> dan hanya berlaku untuk paket baru.</p></div></div>';
    w.querySelector('#f-ab').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target, v = UI2.baca(f); MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('absensi.aturBatas', v); }, { form: f }).then(function () { MR.UI.toast('Batas absensi disimpan.', 'ok'); R.muatUlang(); }).catch(function () { }); });
  }
  function tabSinkron(ctx, w, d) {
    var s = d.sinkron;
    w.innerHTML = '<div class="grid g-2-1"><div class="kartu pad"><div class="baris"><span class="ubin ' + (s.status === 'Tersinkron' ? 'hijau' : s.status === 'Gagal' ? 'merah' : 'oranye') + '">' + ik('awan') + '</span><div class="tumpuk tumbuh"><b>' + e(s.status) + ' · snapshot v' + e(s.versi || d.publik_versi) + '</b><span class="kecil redup">' + e(s.pesan || '-') + (s.waktu ? ' · ' + e(F.waktu(s.waktu)) : '') + '</span></div><button type="button" class="btn primer" data-x="sinkron">' + ik('segar', 'k') + 'Sinkron ulang</button></div>' +
      '<p class="kecil redup mt16">Snapshot publik hanya berisi identitas, tema, daftar paket (tanpa harga), dan susunan form. Server menolak snapshot yang memuat rekening/harga/tarif. GitHub Actions menulis <code>config/app-config.json</code> lalu men-deploy ulang Pages.</p></div>' +
      '<section class="kartu"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Riwayat 10 versi</h2><p>Kembalikan bila perlu</p></div></div><div class="kartu-isi"><div class="daftar-ikon">' + (d.riwayat.length ? d.riwayat.map(function (r) { return '<div class="item-ikon"><span class="ubin abu">' + ik('riwayat', 'k') + '</span><div class="tumbuh"><b class="kecil">' + e(r.bagian) + ' · v' + r.versi + '</b><div class="kecil redup">' + e(r.oleh) + ' · ' + e(F.relatif(r.waktu)) + '</div></div>' + (r.bagian !== 'form' ? '<button type="button" class="btn kecil" data-x="balik" data-id="' + e(r.rp_id) + '">Kembalikan</button>' : '') + '</div>'; }).join('') : '<p class="kecil redup">Belum ada riwayat.</p>') + '</div></div></section></div>';
    w.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-x]'); if (!b) return;
      if (b.dataset.x === 'sinkron') MR.UI.kerja(b, function () { return API.T('atur.sinkron', {}); }).then(function (r) { hasilSinkron({ sinkron: r }); R.muatUlang(); }).catch(function () { });
      if (b.dataset.x === 'balik') MR.UI.konfirmasi({ judul: 'Kembalikan versi ini?', pesan: 'Pengaturan dikembalikan dan dipublikasikan ulang sebagai versi baru.', ok: 'Kembalikan' }).then(function (y) { if (y) API.T('atur.kembalikan', { rp_id: b.dataset.id }).then(function (r) { if (r.bagian === 'tema') App.terapkanTema(r.nilai); hasilSinkron(r); R.muatUlang(); }).catch(MR.UI.galat); });
    });
  }

  /* ================= Harga, Tarif & Aturan (Owner ubah, Admin lihat) ================= */
  R.daftar('harga', {
    judul: 'Harga, Tarif & Aturan', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      return API.Q('owner.harga').then(function (d) {
        if (ctx.basi()) return;
        var ro = !d.bolehUbah, a = d.aturan, rk = d.rekening, dis = ro ? ' disabled' : '';
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Harga, Tarif & Aturan</h1><p>Inti Owner — setiap perubahan dibandingkan dulu, dikonfirmasi, lalu dicatat di log audit. Berlaku ke depan, tidak mengubah paket yang sudah berjalan.</p></div></div>' +
          (ro ? '<div class="peringatan info">' + ik('gembok') + '<div><b>Mode lihat</b>Hanya Owner yang dapat mengubah harga, rekening, tarif honor, dan aturan bisnis.</div></div>' : '') +
          '<div class="grid g-2-1 mt16"><section class="kartu"><div class="kartu-kepala"><span class="ubin">' + ik('tag') + '</span><div class="tumpuk tumbuh"><h2>Harga paket</h2><p>Dipakai formulir pendaftaran & pencatatan kas otomatis</p></div></div>' +
            '<div class="tabel-wadah"><table class="tabel responsif" id="t-harga"><thead><tr><th>Paket</th><th>Sesi</th><th>Harga</th><th>+ per peserta</th></tr></thead><tbody>' + d.paket.map(function (p) { return '<tr data-id="' + e(p.paket_id) + '"><td class="utama-m" data-l="Paket"><div class="tumpuk" style="gap:3px">' + UI2.lencana(p.kategori) + '<b>' + e(p.nama) + '</b>' + (p.aktif === 'T' ? '<small class="redup">nonaktif</small>' : '') + '</div></td><td data-l="Sesi">' + p.jumlah_sesi + '</td><td data-l="Harga"><input class="inp angka" data-h="harga" value="' + F.ribuan(p.harga) + '" inputmode="numeric" style="max-width:140px"' + dis + '></td><td data-l="+ per peserta"><input class="inp angka" data-h="biaya_tambahan" value="' + F.ribuan(p.biaya_tambahan) + '" inputmode="numeric" style="max-width:130px"' + (ro || !/Couple|Kelas/.test(p.kategori) ? ' disabled' : '') + '></td></tr>'; }).join('') + '</tbody></table></div>' +
            (ro ? '' : '<div class="kartu-kaki baris bungkus"><label class="kecil baris">Berlaku mulai <input class="inp" type="date" id="harga-mulai" value="' + UI2.hariIni() + '" min="' + UI2.hariIni() + '" style="width:auto"></label><span class="tumbuh"></span><button type="button" class="btn primer" data-a="simpanHarga">Tinjau & simpan harga</button></div>') + '</section>' +
          '<section class="kartu"><div class="kartu-kepala"><span class="ubin hijau">' + ik('gedung') + '</span><div class="tumpuk tumbuh"><h2>Rekening resmi</h2><p>Tampil di formulir — tidak pernah ikut snapshot publik</p></div></div><form class="kartu-isi form" id="f-rek">' +
            UI2.fld({ k: 'bank', label: 'Bank', v: rk.bank, ro: ro }) + UI2.fld({ k: 'no_rekening', label: 'Nomor rekening', v: rk.no_rekening, ro: ro, mode: 'numeric' }) + UI2.fld({ k: 'atas_nama', label: 'Atas nama', v: rk.atas_nama, ro: ro }) +
            (ro ? '' : '<div class="fld"><button type="submit" class="btn primer">Tinjau & simpan rekening</button></div>') + '</form></section></div>' +
          (d.tarif ? '<div class="grid g2 mt16"><section class="kartu"><div class="kartu-kepala"><span class="ubin ungu">' + ik('koin') + '</span><div class="tumpuk tumbuh"><h2>Tarif honor per kategori sesi</h2><p>Dipakai rekap honor sejak tanggal mulai berlaku</p></div></div>' +
            '<div class="tabel-wadah"><table class="tabel responsif" id="t-tarif"><thead><tr><th>Kategori sesi</th><th>Tarif per sesi</th></tr></thead><tbody>' + d.tarif.map(function (t) { return '<tr data-k="' + e(t.kategori_sesi) + '"><td class="utama-m" data-l="Kategori">' + UI2.lencana(t.kategori_sesi) + '</td><td data-l="Tarif"><input class="inp angka" value="' + F.ribuan(t.tarif) + '" inputmode="numeric" style="max-width:150px"></td></tr>'; }).join('') + '</tbody></table></div>' +
            '<div class="kartu-kaki baris bungkus"><label class="kecil baris">Berlaku mulai <input class="inp" type="date" id="tarif-mulai" value="' + UI2.hariIni() + '" style="width:auto"></label><span class="tumbuh"></span><button type="button" class="btn primer" data-a="simpanTarif">Tinjau & simpan tarif</button></div></section>' +
            '<section class="kartu"><div class="kartu-kepala"><span class="ubin oranye">' + ik('peluit') + '</span><div class="tumpuk tumbuh"><h2>Tarif khusus pelatih</h2><p>Mengalahkan tarif umum untuk pelatih tertentu</p></div><button type="button" class="btn kecil primer" data-a="tarifKhusus">' + ik('plus', 'k') + 'Tambah</button></div>' +
            '<div class="kartu-isi"><div class="daftar-ikon">' + (d.tarifKhusus.length ? d.tarifKhusus.map(function (t) { return '<div class="item-ikon">' + UI2.avatar(t.nama_pelatih, 'kecil') + '<div class="tumbuh"><b class="kecil">' + e(t.nama_pelatih) + '</b><div class="baris bungkus" style="gap:6px">' + UI2.lencana(t.kategori_sesi) + '<span class="kecil redup">mulai ' + e(F.tgl(t.berlaku_mulai)) + '</span></div></div><b class="nominal">' + F.rp(t.tarif) + '</b><button type="button" class="btn ikon hantu kecil" data-a="hapusKhusus" data-id="' + e(t.tarif_id) + '" data-k="' + e(t.kategori_sesi) + '" data-c="' + e(t.coach_id) + '" aria-label="Nonaktifkan">' + ik('sampah', 'k') + '</button></div>'; }).join('') : '<p class="kecil redup">Belum ada tarif khusus.</p>') + '</div></div></section></div>' : '') +
          '<section class="kartu mt16"><div class="kartu-kepala"><span class="ubin merah">' + ik('tameng') + '</span><div class="tumpuk tumbuh"><h2>Aturan bisnis (versi ' + a.versi + ')</h2><p>Disalin ke setiap paket saat dibuat — perubahan hanya berlaku untuk paket baru</p></div></div><form class="kartu-isi" id="f-aturan"><div class="form">' +
            '<div class="fld l3"><label>Sisa sesi saat perpanjangan</label>' + UI2.seg('sisa', [{ v: 'hangus', label: 'Hangus' }, { v: 'dibawa', label: 'Dibawa ke paket baru' }], a.sisa_sesi_perpanjangan, 'lebar') + '</div>' +
            UI2.fld({ k: 'maks_sesi_dibawa', label: 'Maks. sesi dibawa', tipe: 'number', v: a.maks_sesi_dibawa, ro: ro, l: 'l3', bantu: 'Berlaku bila "Dibawa".' }) +
            UI2.fld({ k: 'masa_berlaku_hari', label: 'Masa berlaku paket (hari)', tipe: 'number', v: a.masa_berlaku_hari, ro: ro, l: 'l3', bantu: '0 = tanpa batas. Lewat batas → HABIS (kedaluwarsa).' }) +
            '<div class="fld l3"><label>Absensi saat paket HABIS</label>' + UI2.seg('habis', [{ v: 'tolak', label: 'Tolak' }, { v: 'sesi_lebih', label: 'Catat sesi lebih' }], a.absensi_paket_habis, 'lebar') + '</div>' +
            '<div class="fld" data-k="status_dihitung"><label>Status yang memotong sisa sesi</label><div class="baris bungkus">' + ['Hadir', 'Izin', 'Hangus'].map(function (x) { return '<label class="cek" style="align-items:center"><input type="checkbox" name="sd_' + x + '"' + (a.status_dihitung.indexOf(x) >= 0 ? ' checked' : '') + dis + '><span>' + x + '</span></label>'; }).join('') + '</div><span class="galat"></span></div>' +
            '</div>' + (ro ? '' : '<div class="baris mt12"><span class="tumbuh"></span><button type="submit" class="btn primer">Tinjau & simpan aturan</button></div>') + '</form></section>' +
          (d.riwayatVersi.length ? '<section class="kartu mt16"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Riwayat perubahan</h2><p>10 terakhir dari log audit</p></div></div>' + UI2.tabel({ baris: d.riwayatVersi, kolom: [{ label: 'Waktu', f: function (r) { return e(F.waktu(r.waktu)); } }, { label: 'Aksi', f: function (r) { return '<span class="tag-kecil">' + e(r.aksi) + '</span>'; } }, { label: 'Objek', k: 'objek' }, { label: 'Oleh', k: 'oleh' }] }) + '</section>' : '');
        var nilaiRp = function (v) { return Number(String(v).replace(/\D/g, '')) || 0; };
        ctx.on('input', 'input[inputmode=numeric].angka', function (i) { var n = i.value.replace(/\D/g, ''); i.value = n ? F.ribuan(Number(n)) : ''; });
        var seg = { sisa: a.sisa_sesi_perpanjangan, habis: a.absensi_paket_habis };
        ctx.on('seg', '.seg', function (s, ev) { seg[ev.detail.seg] = ev.detail.v; });
        ctx.on('submit', '#f-rek', function (f, ev) {
          ev.preventDefault(); var v = UI2.baca(f), beda = ['bank', 'no_rekening', 'atas_nama'].filter(function (k) { return v[k] !== rk[k]; }).map(function (k) { return { label: { bank: 'Bank', no_rekening: 'Nomor rekening', atas_nama: 'Atas nama' }[k], lama: rk[k] || '-', baru: v[k] }; });
          if (!beda.length) return MR.UI.toast('Tidak ada perubahan.', 'info');
          UI2.konfirmasiPerubahan('Ubah rekening resmi?', beda).then(function (y) { if (y) MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('owner.rekening', v); }, { form: f }).then(function () { MR.UI.toast('Rekening diperbarui & tercatat di log audit.', 'ok'); R.muatUlang(); }).catch(function () { }); });
        });
        ctx.on('submit', '#f-aturan', function (f, ev) {
          ev.preventDefault(); var v = UI2.baca(f), baru = { sisa_sesi_perpanjangan: seg.sisa, maks_sesi_dibawa: Number(v.maks_sesi_dibawa), masa_berlaku_hari: Number(v.masa_berlaku_hari), absensi_paket_habis: seg.habis, status_dihitung: ['Hadir', 'Izin', 'Hangus'].filter(function (x) { return v['sd_' + x]; }) };
          var lbl = { sisa_sesi_perpanjangan: 'Sisa sesi perpanjangan', maks_sesi_dibawa: 'Maks. sesi dibawa', masa_berlaku_hari: 'Masa berlaku (hari)', absensi_paket_habis: 'Absensi saat HABIS', status_dihitung: 'Status dihitung' };
          var beda = Object.keys(baru).filter(function (k) { return String(baru[k]) !== String(a[k]); }).map(function (k) { return { label: lbl[k], lama: String(a[k]), baru: String(baru[k]) }; });
          if (!beda.length) return MR.UI.toast('Tidak ada perubahan.', 'info');
          UI2.konfirmasiPerubahan('Simpan aturan bisnis versi ' + (a.versi + 1) + '?', beda).then(function (y) { if (y) MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('owner.aturan', { aturan: baru }); }, { form: f }).then(function () { MR.UI.toast('Aturan bisnis v' + (a.versi + 1) + ' berlaku untuk paket baru.', 'ok'); R.muatUlang(); }).catch(function () { }); });
        });
        ctx.aksi({
          simpanHarga: function (b) {
            var mulai = ctx.el.querySelector('#harga-mulai').value, baris = [], beda = [];
            MR.qsa('#t-harga tbody tr', ctx.el).forEach(function (tr) { var p = d.paket.filter(function (x) { return x.paket_id === tr.dataset.id; })[0], h = nilaiRp(tr.querySelector('[data-h=harga]').value), t = nilaiRp(tr.querySelector('[data-h=biaya_tambahan]').value); if (h !== p.harga || t !== p.biaya_tambahan) { baris.push({ paket_id: p.paket_id, harga: h, biaya_tambahan: t, berlaku_mulai: mulai }); beda.push({ label: p.nama, lama: F.rp(p.harga) + (p.biaya_tambahan ? ' (+' + F.rp(p.biaya_tambahan) + ')' : ''), baru: F.rp(h) + (t ? ' (+' + F.rp(t) + ')' : '') }); } });
            if (!baris.length) return MR.UI.toast('Tidak ada perubahan harga.', 'info');
            UI2.konfirmasiPerubahan('Ubah harga mulai ' + F.tgl(mulai) + '?', beda).then(function (y) { if (y) MR.UI.kerja(b, function () { return API.T('owner.hargaSimpan', { baris: baris }); }).then(function (r) { MR.UI.toast(r.berubah + ' harga diperbarui.', 'ok'); R.muatUlang(); }).catch(function () { }); });
          },
          simpanTarif: function (b) {
            var mulai = ctx.el.querySelector('#tarif-mulai').value, baris = [], beda = [];
            MR.qsa('#t-tarif tbody tr', ctx.el).forEach(function (tr) { var t = d.tarif.filter(function (x) { return x.kategori_sesi === tr.dataset.k; })[0], v = nilaiRp(tr.querySelector('input').value); if (v !== t.tarif) { baris.push({ kategori_sesi: t.kategori_sesi, tarif: v, berlaku_mulai: mulai }); beda.push({ label: t.kategori_sesi, lama: F.rp(t.tarif), baru: F.rp(v) }); } });
            if (!baris.length) return MR.UI.toast('Tidak ada perubahan tarif.', 'info');
            UI2.konfirmasiPerubahan('Ubah tarif honor mulai ' + F.tgl(mulai) + '?', beda).then(function (y) { if (y) MR.UI.kerja(b, function () { return API.T('owner.tarif', { baris: baris }); }).then(function (r) { MR.UI.toast(r.berubah + ' tarif diperbarui.', 'ok'); R.muatUlang(); }).catch(function () { }); });
          },
          tarifKhusus: function () {
            var m = MR.UI.modal({ judul: 'Tarif khusus pelatih', sempit: true, isi: '<form class="form">' + UI2.fld({ k: 'coach_id', label: 'Pelatih', tipe: 'select', wajib: true, opsi: d.pelatih.map(function (c) { return { v: c.coach_id, l: c.nama }; }) }) + UI2.fld({ k: 'kategori_sesi', label: 'Kategori sesi', tipe: 'select', opsi: d.kategori, kosong: false }) + UI2.fld({ k: 'tarif', label: 'Tarif per sesi (Rp)', mode: 'numeric', wajib: true }) + UI2.fld({ k: 'berlaku_mulai', label: 'Berlaku mulai', tipe: 'date', v: UI2.hariIni() }) + '</form>', kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan</button>' });
            m.el.querySelector('[data-ok]').onclick = function () { var f = m.el.querySelector('form'), v = UI2.baca(f); v.tarif = nilaiRp(v.tarif); MR.UI.kerja(this, function () { return API.T('owner.tarif', { baris: [v] }); }, { form: f }).then(function () { m.tutup(); MR.UI.toast('Tarif khusus tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { }); };
          },
          hapusKhusus: function (b) { MR.UI.konfirmasi({ judul: 'Nonaktifkan tarif khusus?', pesan: 'Pelatih kembali memakai tarif umum untuk kategori ini.', ok: 'Nonaktifkan', bahaya: true }).then(function (y) { if (y) API.T('owner.tarif', { baris: [{ tarif_id: b.dataset.id, kategori_sesi: b.dataset.k, coach_id: b.dataset.c, hapus: true }] }).then(function () { MR.UI.toast('Tarif khusus dinonaktifkan.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); }); }
        });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); if (ro) MR.qsa('.seg button', ctx.el).forEach(function (x) { x.disabled = true; }); });
      });
    }
  });

  /* ================= Hak akses (Owner) ================= */
  R.daftar('hak-akses', {
    judul: 'Hak Akses', kerangka: 'tabel', peran: ['owner'],
    render: function (ctx) {
      return API.Q('hak.ambil').then(function (d) {
        if (ctx.basi()) return;
        var peran = ['admin', 'pelatih', 'ortu'], ubah = {}, grup = {};
        d.katalog.forEach(function (i) { (grup[i.grup] = grup[i.grup] || []).push(i); });
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Hak Akses Peran</h1><p>Versi ' + d.versi + ' · diubah ' + e(F.relatif(d.terakhir)) + '. Perubahan berlaku langsung tanpa perlu login ulang. Batas data (pelatih hanya siswanya, orang tua hanya anaknya) tetap ditegakkan server.</p></div><div class="aksi"><button type="button" class="btn" data-a="reset">' + ik('segar') + 'Bawaan</button><button type="button" class="btn primer" data-a="simpan" id="hak-simpan" disabled>Simpan perubahan</button></div></div>' +
          '<div class="grid g-2-1"><section class="kartu"><div class="tabel-wadah matriks-wadah"><table class="tabel responsif matriks"><thead><tr><th>Izin</th>' + peran.map(function (p) { return '<th>' + e(Inti.NAMA_PERAN[p]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
            Object.keys(grup).map(function (g) { return '<tr class="grup-baris"><td colspan="4" data-l="">' + e(g) + '</td></tr>' + grup[g].map(function (i) { return '<tr><td class="utama-m" data-l="Izin"><b>' + e(i.arti) + '</b><small>' + e(i.k) + '</small></td>' + peran.map(function (p) { var boleh = i.boleh.indexOf(p) >= 0, on = !!(d.matriks[p] || {})[i.k]; return '<td data-l="' + e(Inti.NAMA_PERAN[p]) + '" data-sel="' + p + ':' + i.k + '">' + (boleh ? UI2.saklar('h_' + p + '_' + i.k.replace('.', '_'), on).replace('<input', '<input data-p="' + p + '" data-i="' + i.k + '" data-awal="' + (on ? 1 : 0) + '"') : '<span class="sel-kunci">' + ik('gembok', 'k') + 'Tidak tersedia</span>'); }).join('') + '</td></tr>'; }).join(''); }).join('') + '</tbody></table></div></section>' +
          '<div class="lengket tumpuk" style="gap:16px"><div class="kartu pad"><div class="baris"><span class="ubin merah">' + ik('tameng') + '</span><div class="tumpuk"><b>Inti Owner</b><span class="kecil redup">Selalu milik Owner, tidak bisa didelegasikan</span></div></div><ul class="kecil mt12" style="padding-left:18px;line-height:1.8;margin:0">' + d.intiOwner.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') + '</ul></div>' +
          '<div class="kartu pad"><b>Ringkasan</b><p class="kecil redup mt8">' + d.jumlahAdmin + ' akun Admin aktif. Sel abu-abu = di luar batas peran (mis. orang tua tidak bisa diberi akses kas).</p><div id="hak-ubah" class="mt12 kecil redup">Belum ada perubahan.</div></div></div></div>';
        function perbarui() {
          var list = Object.keys(ubah).map(function (k) { return ubah[k]; });
          ctx.el.querySelector('#hak-simpan').disabled = !list.length; ctx.el.querySelector('#hak-simpan').textContent = list.length ? 'Simpan ' + list.length + ' perubahan' : 'Simpan perubahan';
          ctx.el.querySelector('#hak-ubah').innerHTML = list.length ? list.map(function (c) { return '<div class="baris" style="gap:6px;margin-bottom:4px"><span class="status ' + (c.aktif ? 'ok' : 'habis') + ' polos">' + (c.aktif ? 'ON' : 'OFF') + '</span><span>' + e(Inti.NAMA_PERAN[c.peran]) + ' · ' + e(c.izin) + '</span></div>'; }).join('') : 'Belum ada perubahan.';
        }
        ctx.on('change', 'input[data-p]', function (i) { var k = i.dataset.p + ':' + i.dataset.i, sel = i.closest('td'); if (String(i.checked ? 1 : 0) === i.dataset.awal) delete ubah[k]; else ubah[k] = { peran: i.dataset.p, izin: i.dataset.i, aktif: i.checked }; sel.classList.toggle('berubah', !!ubah[k]); perbarui(); });
        ctx.aksi({
          simpan: function (b) {
            var list = Object.keys(ubah).map(function (k) { return ubah[k]; });
            UI2.konfirmasiPerubahan('Terapkan ' + list.length + ' perubahan hak akses?', list.map(function (c) { return { label: Inti.NAMA_PERAN[c.peran] + ' · ' + c.izin, lama: c.aktif ? 'OFF' : 'ON', baru: c.aktif ? 'ON' : 'OFF' }; }), 'Terapkan sekarang').then(function (y) { if (y) MR.UI.kerja(b, function () { return API.T('hak.simpan', { perubahan: list }); }).then(function (r) { MR.UI.toast('Hak akses v' + r.versi + ' berlaku. Pengguna terdampak menerima pembaruan otomatis.', 'ok'); R.muatUlang(); }).catch(function () { }); });
          },
          reset: function (b) { MR.UI.konfirmasi({ judul: 'Kembalikan hak akses bawaan?', pesan: 'Semua izin Admin, Pelatih, dan Orang Tua kembali ke pengaturan awal PRD.', ok: 'Kembalikan', bahaya: true }).then(function (y) { if (y) MR.UI.kerja(b, function () { return API.T('hak.reset', {}); }).then(function () { MR.UI.toast('Hak akses dikembalikan ke bawaan.', 'ok'); R.muatUlang(); }).catch(function () { }); }); }
        });
      });
    }
  });

  /* ================= Akun pengguna ================= */
  R.daftar('akun', {
    judul: 'Akun Pengguna', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.peran = st.peran || '';
      return API.Q('akun.list').then(function (d) {
        if (ctx.basi()) return;
        var hit = {}; d.akun.forEach(function (u) { hit[u.peran] = (hit[u.peran] || 0) + 1; });
        var peran = ['owner', 'admin', 'pelatih', 'ortu'].filter(function (p) { return hit[p]; });
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Akun Pengguna</h1><p>' + (d.bolehAdmin ? 'Owner mengelola semua akun.' : 'Admin mengelola akun Pelatih & Orang Tua.') + ' Akun orang tua dibuat otomatis saat verifikasi pendaftaran.</p></div><div class="aksi"><button type="button" class="btn primer" data-a="tambah" data-kunci="n">' + ik('tambahOrang') + 'Tambah akun</button></div></div>' +
          UI2.seg('peran', [{ v: '', label: 'Semua', n: d.akun.length }].concat(peran.map(function (p) { return { v: p, label: Inti.NAMA_PERAN[p], n: hit[p] }; })), st.peran) + '<section class="kartu mt16" id="akun-isi"></section>';
        function gambar() {
          ctx.el.querySelector('#akun-isi').innerHTML = UI2.tabel({ baris: d.akun.filter(function (u) { return !st.peran || u.peran === st.peran; }), kolom: [
            { label: 'Pengguna', f: function (u) { return '<div class="sel-utama">' + UI2.avatar(u.nama, 'kecil') + '<span class="tumpuk"><b>' + e(u.nama) + '</b><small>' + (u.peran === 'ortu' ? e(u.kontak || '') : '@' + e(u.username)) + '</small></span></div>'; } },
            { label: 'Peran', f: function (u) { return '<span class="tag-kecil">' + e(Inti.NAMA_PERAN[u.peran]) + '</span>'; } },
            { label: 'Terhubung', f: function (u) { return u.peran === 'pelatih' ? e(u.nama_pelatih) : u.peran === 'ortu' ? u.anak.map(function (a) { return e(a.nama) + ' <small class="redup">' + e(a.kode_akses) + '</small>'; }).join('<br>') : '—'; } },
            { label: 'Login terakhir', f: function (u) { return u.login_terakhir ? e(F.relatif(u.login_terakhir)) : '<span class="redup">belum pernah</span>'; } },
            { label: 'Status', f: function (u) { return u.terkunci ? '<span class="status habis">Terkunci</span>' : UI2.status(u.aktif === 'T' ? 'Nonaktif' : 'Aktif'); } },
            { label: '', f: function (u) { return '<div class="baris">' + (u.peran !== 'ortu' ? '<button type="button" class="btn kecil" data-a="ubah" data-id="' + e(u.user_id) + '">' + ik('pensil', 'k') + '</button>' : '') + '<button type="button" class="btn kecil" data-a="reset" data-id="' + e(u.user_id) + '">' + ik('kunci', 'k') + (u.peran === 'ortu' ? 'Reset PIN' : 'Reset sandi') + '</button></div>'; } }
          ] });
        }
        ctx.on('seg', '.seg', function (s, ev) { st.peran = ev.detail.v; gambar(); });
        ctx.aksi({
          tambah: function () { formAkun({}, d); },
          ubah: function (b) { formAkun(d.akun.filter(function (u) { return u.user_id === b.dataset.id; })[0], d); },
          reset: function (b) { var u = d.akun.filter(function (x) { return x.user_id === b.dataset.id; })[0]; MR.UI.konfirmasi({ judul: (u.peran === 'ortu' ? 'Reset PIN ' : 'Reset sandi ') + u.nama + '?', pesan: 'Rahasia lama langsung tidak berlaku dan semua sesi akun ini berakhir.', ok: 'Reset', bahaya: true }).then(function (y) { if (y) API.T('akun.reset', { user_id: u.user_id }).then(function (r) { W.tampilRahasiaBaru(r); R.muatUlang(); }).catch(MR.UI.galat); }); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); });
      });
    }
  });
  function formAkun(u, d) {
    var baru = !u.user_id, opsiPeran = (d.bolehAdmin ? ['owner', 'admin', 'pelatih'] : ['pelatih']).map(function (p) { return { v: p, l: Inti.NAMA_PERAN[p] }; });
    var m = MR.UI.modal({ judul: baru ? 'Tambah akun' : 'Ubah akun', sub: baru ? 'Sandi sementara dibuat otomatis dan ditampilkan sekali.' : 'Mengubah peran/username/status mencabut sesi aktif akun ini.', isi: '<form class="form">' +
      UI2.fld({ k: 'nama', label: 'Nama', v: u.nama, wajib: true, l: 'l3' }) + UI2.fld({ k: 'peran', label: 'Peran', tipe: 'select', opsi: opsiPeran, v: u.peran || 'pelatih', kosong: false, l: 'l3' }) +
      UI2.fld({ k: 'username', label: 'Username', v: u.username, wajib: true, l: 'l3', attr: ' autocapitalize="off"' }) + '<div class="fld l3" data-k="coach_id"><label>Data pelatih</label><select class="inp" name="coach_id"><option value="">— Pilih —</option>' + d.pelatih.map(function (c) { return '<option value="' + e(c.coach_id) + '"' + (u.coach_id === c.coach_id ? ' selected' : '') + '>' + e(c.nama) + '</option>'; }).join('') + '</select><span class="galat"></span></div>' +
      UI2.fld({ k: 'kontak', label: 'WhatsApp', v: u.kontak, l: 'l3' }) + UI2.fld({ k: 'email', label: 'Email', tipe: 'email', v: u.email, l: 'l3' }) +
      (baru ? '' : UI2.fld({ k: 'aktif', label: 'Status', tipe: 'select', opsi: [{ v: 'Y', l: 'Aktif' }, { v: 'T', l: 'Nonaktif' }], v: u.aktif || 'Y', kosong: false })) + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan akun</button>' });
    var f = m.el.querySelector('form'), cek = function () { f.querySelector('[data-k=coach_id]').hidden = f.peran.value !== 'pelatih'; };
    f.peran.addEventListener('change', cek); cek();
    m.el.querySelector('[data-ok]').onclick = function () { var v = UI2.baca(f); v.user_id = u.user_id; MR.UI.kerja(this, function () { return API.T('akun.simpan', v); }, { form: f }).then(function (r) { m.tutup(); R.muatUlang(); if (r.sandi_awal) W.tampilRahasiaBaru({ peran: v.peran, nama: v.nama, rahasia: r.sandi_awal, kontak: v.kontak, kode_akses: [] }); else MR.UI.toast('Akun disimpan.', 'ok'); }).catch(function () { }); };
  }

  /* ================= Log audit (Owner) ================= */
  R.daftar('log', {
    judul: 'Log Audit', kerangka: 'tabel', peran: ['owner'],
    render: function (ctx) {
      var st = ctx.st; st.hal = st.hal || 1;
      return API.Q('log.list', { q: st.q || '', aksi: st.aksi || '', halaman: st.hal }).then(function (d) {
        if (ctx.basi()) return;
        var ringkas = function (v) { v = String(v || ''); return v.length > 90 ? e(v.slice(0, 90)) + '…' : e(v); };
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Log Audit</h1><p>' + F.ribuan(d.total) + ' catatan · tidak bisa diubah dari aplikasi (sheet dilindungi). Rahasia tidak pernah dicatat.</p></div></div>' +
          '<div class="kartu pad"><div class="baris bungkus" style="gap:10px"><div class="inp-ikon tumbuh" style="min-width:220px">' + ik('cari') + '<input class="inp" data-f="q" placeholder="Cari aksi, objek, nilai, atau nama…" value="' + e(st.q || '') + '"></div><select class="inp" data-f="aksi" style="width:auto"><option value="">Semua aksi</option>' + d.aksiList.map(function (a) { return '<option' + (st.aksi === a ? ' selected' : '') + '>' + e(a) + '</option>'; }).join('') + '</select></div></div>' +
          '<section class="kartu mt16">' + UI2.tabel({ baris: d.rows, kolom: [{ label: 'Waktu', f: function (r) { return '<span class="angka">' + e(F.waktu(r.waktu)) + '</span>'; } }, { label: 'Pengguna', f: function (r) { return e(r.nama); } }, { label: 'Aksi', f: function (r) { return '<span class="tag-kecil ' + (/DITOLAK|BATAL|TARIK/.test(r.aksi) ? 'wajib' : '') + '">' + e(r.aksi) + '</span>'; } }, { label: 'Objek', f: function (r) { return '<span class="kecil putus">' + e(r.objek) + '</span>'; } }, { label: 'Perubahan', f: function (r) { return '<span class="kecil putus">' + (r.nilai_lama ? '<s class="redup">' + ringkas(r.nilai_lama) + '</s> → ' : '') + ringkas(r.nilai_baru) + '</span>'; } }] }) +
          '<div class="halaman-nav"><span>Halaman ' + d.halaman + ' dari ' + Math.max(1, Math.ceil(d.total / d.per)) + '</span><div class="baris"><button type="button" class="btn kecil" data-a="hal" data-n="-1"' + (d.halaman <= 1 ? ' disabled' : '') + '>' + ik('kiri', 'k') + '</button><button type="button" class="btn kecil" data-a="hal" data-n="1"' + (d.halaman * d.per >= d.total ? ' disabled' : '') + '>' + ik('kanan', 'k') + '</button></div></div></section>';
        ctx.on('input', '[data-f=q]', MR.U.debounce(function (i) { st.q = i.value; st.hal = 1; R.tampilkan({ diam: true, bingkai: true }); }, 400));
        ctx.on('change', '[data-f=aksi]', function (s) { st.aksi = s.value; st.hal = 1; R.tampilkan({ diam: true, bingkai: true }); });
        ctx.aksi({ hal: function (b) { st.hal = Math.max(1, st.hal + Number(b.dataset.n)); R.tampilkan({ diam: true, bingkai: true }); } });
      });
    }
  });
})(window, document);
