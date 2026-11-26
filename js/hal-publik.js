/* =====================================================================
 * HALAMAN PUBLIK — Masuk, Formulir Pendaftaran (link resmi), Verifikasi dokumen
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router;
  var OMBAK = '<svg class="ombak-bawah" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true"><path fill="rgba(56,189,248,.18)" d="M0 70c120-30 220-30 340 0s220 30 340 0 220-30 340 0 120 15 180 10v80H0z"/><path fill="rgba(56,189,248,.12)" d="M0 100c150-35 260-35 400 0s250 35 400 0 260-35 400 0v60H0z"/></svg>';

  /* ---------------- Masuk ---------------- */
  R.daftar('masuk', {
    judul: 'Masuk', publik: true,
    render: function (ctx) {
      var st = ctx.st, mode = st.mode || (ctx.q.ortu ? 'ortu' : 'staf'), demo = API.mode === 'demo', P = App.publik;
      ctx.el.innerHTML = '<div class="masuk-wadah">' +
        '<section class="masuk-hero">' + OMBAK +
          '<div class="baris" style="gap:12px"><span class="sb-logo" style="width:46px;height:46px;border-radius:14px"><img data-logo src="' + e(MR.logo) + '" alt="" style="width:36px;height:36px"></span><div class="tumpuk"><b style="font:800 18px var(--f-judul);color:#fff" data-nama-app>' + e(P.nama_app) + '</b><small style="color:#7DD3FC;font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:11px">Dashboard Terintegrasi</small></div></div>' +
          '<h1>Latihan tertib, absensi jujur, keuangan rapi — dalam satu kolam data.</h1>' +
          '<p data-tagline>' + e(P.tagline || '') + '</p>' +
          '<div class="fitur">' +
            '<div><span class="ubin">' + ik('jam') + '</span><span><b>Batas absensi dari jam server</b><small>Jam di HP pelatih tidak berpengaruh. Pukul 22:00:01 WIB otomatis terkunci.</small></span></div>' +
            '<div><span class="ubin">' + ik('renang') + '</span><span><b>Portal orang tua real-time</b><small>Sisa sesi, jadwal, dan riwayat kehadiran anak dari HP masing-masing.</small></span></div>' +
            '<div><span class="ubin">' + ik('tameng') + '</span><span><b>Harga & rekening hanya di tangan Owner</b><small>Setiap perubahan penting tercatat di log audit.</small></span></div>' +
          '</div></section>' +
        '<section class="masuk-panel"><div class="masuk-kartu masuk">' +
          '<h2>Masuk ke akun Anda</h2><p class="sub">Pilih jenis akun, lalu masukkan data akses.</p>' +
          '<div class="mt16">' + UI2.seg('mode', [{ v: 'staf', label: 'Staf & Pelatih', ikon: 'orang' }, { v: 'ortu', label: 'Orang Tua', ikon: 'renang' }], mode, 'lebar') + '</div>' +
          '<form class="form mt16" id="f-masuk" autocomplete="on" novalidate>' + formMasuk(mode) + '</form>' +
          (demo ? '<div class="pemisah">atau coba akun demo</div><div class="demo-akun">' + App.AKUN_DEMO.map(function (a, i) { return '<button type="button" data-a="demo" data-i="' + i + '"><span class="ubin" style="width:34px;height:34px;border-radius:10px">' + ik(a.ikon, 'k') + '</span><span class="tumpuk"><span>' + e(a.label) + '</span><small>' + e(a.sub.split(' · ')[0]) + '</small></span></button>'; }).join('') + '</div>' +
            '<p class="kecil redup tengah mt12">Sandi staf demo: <b>demo1234</b> · Orang tua: kode <b>SA-8829</b>, PIN <b>123456</b></p>' : '') +
          '<div class="baris ujung bungkus mt16 kecil"><a href="#/daftar/DEMO-BARU">' + ik('formulir', 'k') + ' Contoh formulir pendaftaran</a><a href="#/v">' + ik('qr', 'k') + ' Verifikasi dokumen</a></div>' +
        '</div></section></div>';
      ctx.on('seg', '.seg', function (s, ev) { st.mode = ev.detail.v; var f = ctx.el.querySelector('#f-masuk'); f.innerHTML = formMasuk(st.mode); f.classList.remove('pudar'); void f.offsetWidth; f.classList.add('pudar'); pasangPin(f); });
      ctx.on('submit', '#f-masuk', function (f, ev) { ev.preventDefault(); kirim(f, ctx.el.querySelector('#f-masuk [type=submit]')); });
      ctx.on('click', '[data-mata]', function (b) { var i = b.parentNode.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; b.innerHTML = ik(i.type === 'password' ? 'mata' : 'mataTutup'); });
      ctx.aksi({ demo: function (b) { App.masukDemo(App.AKUN_DEMO[b.dataset.i], b); } });
      ctx.nanti(function () { UI2.hidupkan(ctx.el); pasangPin(ctx.el.querySelector('#f-masuk')); });
      function kirim(f, tombol) {
        var v = UI2.baca(f), ortu = (st.mode || mode) === 'ortu';
        if (ortu) v.pin = MR.qsa('.pin-kotak input', f).map(function (x) { return x.value; }).join('');
        MR.UI.kerja(tombol, function () { return ortu ? API.T('auth.masukOrtu', { kode: v.kode, pin: v.pin }) : API.T('auth.masuk', { username: v.username, sandi: v.sandi }); }, { form: f }).then(App.setelahMasuk).catch(function () { });
      }
    }
  });
  function formMasuk(mode) {
    if (mode === 'ortu') return UI2.fld({ k: 'kode', label: 'Kode akses anak', ph: 'Contoh: SA-8829', ikon: 'kunci', wajib: true, attr: ' autocapitalize="characters" autocomplete="username"', bantu: 'Kode dikirim Admin lewat WhatsApp setelah pendaftaran diverifikasi.' }) +
      '<div class="fld" data-k="pin"><label>PIN 6 angka <span class="wajib">*</span></label><div class="pin-kotak">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<input inputmode="numeric" maxlength="1" pattern="[0-9]" aria-label="Digit PIN ' + (i + 1) + '" autocomplete="off">'; }).join('') + '</div><span class="galat"></span></div>' +
      '<button type="submit" class="btn primer besar lebar">' + ik('panah') + 'Masuk ke Portal Orang Tua</button>';
    return UI2.fld({ k: 'username', label: 'Username', ph: 'mis. admin', ikon: 'orang', wajib: true, attr: ' autocomplete="username" autocapitalize="off"' }) +
      UI2.fld({ k: 'sandi', label: 'Sandi', tipe: 'password', ikon: 'kunci', wajib: true, attr: ' autocomplete="current-password"', ujung: '<button type="button" class="btn ikon hantu kecil ujung" data-mata aria-label="Tampilkan sandi">' + ik('mata') + '</button>' }) +
      '<button type="submit" class="btn primer besar lebar">Masuk</button>';
  }
  /* Kotak PIN: pindah otomatis, tempel 6 digit sekaligus, Backspace kembali */
  function pasangPin(root) {
    var box = MR.qsa('.pin-kotak input', root || D); if (!box.length) return;
    box.forEach(function (b, i) {
      b.addEventListener('input', function () { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && box[i + 1]) box[i + 1].focus(); });
      b.addEventListener('keydown', function (ev) { if (ev.key === 'Backspace' && !b.value && box[i - 1]) box[i - 1].focus(); if (ev.key === 'Enter') { var f = b.closest('form'); if (f) f.requestSubmit ? f.requestSubmit() : f.submit(); } });
      b.addEventListener('paste', function (ev) { var t = (ev.clipboardData || W.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6); if (!t) return; ev.preventDefault(); t.split('').forEach(function (c, j) { if (box[j]) box[j].value = c; }); (box[t.length] || box[5]).focus(); });
    });
  }
  W.pasangPin = pasangPin;

  /* ---------------- Formulir pendaftaran ---------------- */
  var KELOMPOK_PAKET = ['paket', 'kolam', 'jam'], DILEWATI = { bukti: 1 };
  R.daftar('daftar', {
    judul: 'Formulir Pendaftaran', publik: true,
    render: function (ctx) {
      var token = ctx.arg[0] || '';
      return API.panggil('pub.formDaftar', { token: token }).then(function (d) {
        if (ctx.basi()) return;
        var st = { paket: null, tambahan: [], bukti: null, katManual: false };
        var skema = d.form.skema, P = d.identitas, perpanjang = d.tipe === 'perpanjangan', pre = d.prefill || {};
        var idxPaket = skema.findIndex(function (f) { return f.kunci === 'paket'; });
        var grupData = [], grupPaket = [], grupTambah = [], blok = {};
        skema.forEach(function (f, i) {
          if (f.tetap) { blok[f.tipe] = f; return; }
          if (DILEWATI[f.kunci]) { blok.bukti = f; return; }
          if (KELOMPOK_PAKET.indexOf(f.kunci) >= 0) grupPaket.push(f); else if (i < idxPaket || f.inti) grupData.push(f); else grupTambah.push(f);
        });
        var paketPeta = {}; d.paket.forEach(function (p) { paketPeta[p.paket_id] = p; });
        ctx.el.innerHTML = '<div class="publik-atas"><span class="sb-logo" style="width:36px;height:36px">' + (P.logo ? '<img src="' + e(P.logo) + '" alt="">' : '<img src="assets/logo.svg" alt="">') + '</span><div class="tumpuk tumbuh"><b style="font:700 15px var(--f-judul)">' + e(P.nama_app) + '</b><small class="redup satu-baris">' + e(P.tagline || '') + '</small></div>' +
          (P.kontak_admin ? '<a class="btn kecil wa" target="_blank" rel="noopener" href="' + UI2.waLink(P.kontak_admin, 'Halo Admin ' + P.nama_app + ', saya ingin bertanya tentang pendaftaran.') + '">' + ik('wa') + '<span class="sembunyi-hp">Tanya Admin</span></a>' : '') + '</div>' +
          '<div class="publik-isi">' +
          '<div class="banner masuk" style="margin-bottom:20px">' + bannerOmbak() + '<span class="label-atas">' + ik(perpanjang ? 'segar' : 'formulir', 'k') + (perpanjang ? 'Perpanjangan paket' : 'Pendaftaran siswa baru') + '</span><h1>' + (perpanjang ? 'Perpanjang paket latihan ' + e(pre.nama || '') : 'Formulir pendaftaran latihan renang') + '</h1><p>Isi data dengan benar. Admin memverifikasi pembayaran lalu mengirim kode akses portal orang tua lewat WhatsApp. Link berlaku sampai ' + e(F.waktu(d.kedaluwarsa)) + ' WIB.</p></div>' +
          '<form id="f-daftar" novalidate><div class="publik-grid"><div class="tumpuk" style="gap:16px">' +
            kartuSeksi(1, 'Data peserta', 'Data utama siswa dan orang tua/wali.', '<div class="form">' + grupData.map(function (f) { return fieldPublik(f, pre, d); }).join('') + '</div>', 'masuk') +
            kartuSeksi(2, 'Paket & jadwal', 'Pilih paket latihan, lokasi, dan waktu yang diinginkan.', '<div class="form">' + grupPaket.map(function (f) { return f.kunci === 'paket' ? pilihPaket(f, d, pre) : fieldPublik(f, pre, d); }).join('') + '</div><div id="peserta-tambahan" class="mt16"></div>', 'masuk-2') +
            (grupTambah.length ? kartuSeksi(3, 'Informasi tambahan', 'Membantu pelatih menyiapkan latihan.', '<div class="form">' + grupTambah.map(function (f) { return fieldPublik(f, pre, d); }).join('') + '</div>', 'masuk-3') : '') +
            kartuSeksi(grupTambah.length ? 4 : 3, 'Pembayaran', 'Transfer sesuai total tagihan ke rekening resmi berikut, lalu unggah buktinya.',
              (blok.blok_rekening ? '<div class="blok-tetap"><span class="kunci-label">' + ik('gembok', 'k') + 'Rekening resmi</span><div class="kecil redup">Bank</div><b>' + e(d.rekening.bank) + '</b><div class="kecil redup mt8">Nomor rekening</div><div class="baris bungkus"><span class="rek-nomor">' + e(d.rekening.no_rekening) + '</span><button type="button" class="btn kecil lembut" data-a="salinRek">' + ik('salin', 'k') + 'Salin</button></div><div class="kecil redup mt8">Atas nama</div><b>' + e(d.rekening.atas_nama) + '</b><p class="kecil redup mt8">Rekening hanya diubah oleh Owner. Waspada penipuan — jangan transfer ke rekening lain.</p></div>' : '') +
              (blok.bukti ? '<div class="fld mt16" data-k="bukti"><label>' + e(blok.bukti.label) + (blok.bukti.wajib ? ' <span class="wajib">*</span>' : '') + '</label><label class="unggah" id="unggah-bukti"><input type="file" accept="image/png,image/jpeg,application/pdf" hidden>' + ik('unggah', 'b') + '<b>Pilih atau seret berkas ke sini</b><span class="kecil redup">' + e(blok.bukti.bantu || 'JPG, PNG, atau PDF · maks. 5 MB') + '</span></label><div id="pratinjau-bukti"></div><span class="galat"></span></div>' : ''), 'masuk-3') +
            (blok.blok_persetujuan ? kartuSeksi(grupTambah.length ? 5 : 4, 'Persetujuan', 'Wajib dicentang sebelum mengirim.', '<div class="fld" data-k="_persetujuan"><label class="cek"><input type="checkbox" name="setuju"><span>' + e(d.teks_persetujuan) + '</span></label><span class="galat"></span></div>', 'masuk-4') : '') +
          '</div><aside class="publik-samping"><div class="kartu pad">' +
            '<div class="baris"><span class="ubin">' + ik('struk') + '</span><div class="tumpuk"><b>Ringkasan biaya</b><span class="kecil redup">Dihitung otomatis dari harga resmi</span></div></div>' +
            '<div id="ringkas-biaya" class="mt16"></div>' +
            '<button type="submit" class="btn primer besar lebar mt16">' + ik('kirim') + 'Kirim pendaftaran</button>' +
            '<p class="kecil redup tengah mt8">Data Anda dikirim terenkripsi (HTTPS) dan hanya dapat dilihat Admin.</p></div>' +
            (P.kontak_admin ? '<a class="kartu pad item-klik baris" target="_blank" rel="noopener" style="color:inherit" href="' + UI2.waLink(P.kontak_admin, 'Halo Admin, saya butuh bantuan mengisi formulir pendaftaran.') + '"><span class="ubin hijau">' + ik('wa') + '</span><span class="tumpuk tumbuh"><b>Butuh bantuan?</b><span class="kecil redup">Chat Admin lewat WhatsApp</span></span>' + ik('kanan') + '</a>' : '') +
          '</aside></div></form></div>';

        var form = ctx.el.querySelector('#f-daftar');
        function nilai(k) { var x = form.querySelector('[name="' + k + '"]'); return x ? (x.type === 'radio' ? (form.querySelector('[name="' + k + '"]:checked') || {}).value : x.value) : ''; }
        function hitung(tanpaPeserta) {
          var p = paketPeta[nilai('paket')], n = 1 + st.tambahan.filter(function (t) { return t.nama; }).length, el = ctx.el.querySelector('#ringkas-biaya');
          st.paket = p;
          if (!p) { el.innerHTML = '<div class="info-aturan">' + ik('info') + '<span>Pilih paket latihan untuk melihat total tagihan.</span></div>'; if (!tanpaPeserta) gambarTambahan(); return; }
          var ekstra = Math.max(0, n - p.peserta_termasuk), total = p.harga + ekstra * p.biaya_tambahan;
          el.innerHTML = '<div class="baris ujung kecil"><span>' + UI2.lencana(p.kategori) + '</span><span class="redup">' + p.jumlah_sesi + ' sesi · ' + p.durasi_menit + ' mnt</span></div><b class="mt8" style="display:block">' + e(p.nama) + '</b>' +
            '<div class="baris ujung kecil mt12"><span class="redup">Harga paket</span><b class="angka">' + F.rp(p.harga) + '</b></div>' +
            (ekstra ? '<div class="baris ujung kecil mt8"><span class="redup">Peserta tambahan × ' + ekstra + '</span><b class="angka">' + F.rp(ekstra * p.biaya_tambahan) + '</b></div>' : '') +
            '<div class="total-tagihan mt12"><div class="kecil redup">Total transfer</div><div class="nilai angka">' + F.rp(total) + '</div><div class="kecil redup">Transfer sesuai total ini ke rekening resmi.</div></div>';
          if (!tanpaPeserta) gambarTambahan();
        }
        function gambarTambahan() {
          var w = ctx.el.querySelector('#peserta-tambahan'), p = st.paket, maks = p ? p.maks_peserta - 1 : 0;
          if (!p || maks < 1) { w.innerHTML = ''; st.tambahan = []; return; }
          st.tambahan = st.tambahan.slice(0, maks);
          w.innerHTML = '<div class="baris ujung"><div class="tumpuk"><b>Peserta tambahan</b><span class="kecil redup">Paket ini untuk hingga ' + p.maks_peserta + ' peserta (' + p.peserta_termasuk + ' termasuk harga' + (p.biaya_tambahan ? ', berikutnya +' + F.rp(p.biaya_tambahan) + '/anak' : '') + ').</span></div>' + (st.tambahan.length < maks ? '<button type="button" class="btn kecil lembut" data-a="tambahPeserta">' + ik('plus', 'k') + 'Tambah</button>' : '') + '</div>' +
            st.tambahan.map(function (t, i) { return '<div class="peserta-absen mt12" data-pt="' + i + '"><div class="baris ujung"><b class="kecil">Peserta ' + (i + 2) + '</b><button type="button" class="btn ikon hantu kecil" data-a="hapusPeserta" data-i="' + i + '" aria-label="Hapus">' + ik('sampah', 'k') + '</button></div><div class="form">' +
              UI2.fld({ k: 'pt_nama_' + i, label: 'Nama lengkap', v: t.nama, l: 'l3', wajib: true }) + UI2.fld({ k: 'pt_tgl_' + i, label: 'Tanggal lahir', tipe: 'date', v: t.tgl_lahir, l: 'l3', wajib: true, attr: ' max="' + UI2.hariIni() + '"' }) +
              UI2.fld({ k: 'pt_kat_' + i, label: 'Kategori', tipe: 'select', opsi: ['Anak', 'Dewasa'], v: t.kategori, l: 'l3', kosong: false }) + UI2.fld({ k: 'pt_jk_' + i, label: 'Jenis kelamin', tipe: 'select', opsi: ['Laki-laki', 'Perempuan'], v: t.jenis_kelamin, l: 'l3' }) +
              '</div><div class="fld" data-k="peserta_' + i + '"><span class="galat"></span></div></div>'; }).join('');
        }
        function bacaTambahan() { st.tambahan = st.tambahan.map(function (t, i) { return { nama: nilai('pt_nama_' + i), tgl_lahir: nilai('pt_tgl_' + i), kategori: nilai('pt_kat_' + i), jenis_kelamin: nilai('pt_jk_' + i) }; }); }
        if (pre.peserta_tambahan) st.tambahan = pre.peserta_tambahan.slice();
        form.addEventListener('change', function (ev) {
          var n = ev.target.name;
          if (n === 'paket') { bacaTambahan(); hitung(); MR.qsa('.pilih', form).forEach(function (x) { x.classList.toggle('aktif', !!x.querySelector('input:checked')); }); }
          if (n === 'kategori') st.katManual = true;
          if (n === 'tgl_lahir' && !st.katManual) { var u = Inti.util.usia(ev.target.value, UI2.hariIni()), k = form.querySelector('[name=kategori]'); if (k && u != null) k.value = u >= 15 ? 'Dewasa' : 'Anak'; }
          if (/^pt_/.test(n)) { bacaTambahan(); hitung(true); }
        });
        ctx.aksi({
          salinRek: function () { UI2.salin(d.rekening.no_rekening.replace(/\D/g, ''), 'Nomor rekening disalin.'); },
          tambahPeserta: function () { bacaTambahan(); st.tambahan.push({ nama: '', tgl_lahir: '', kategori: 'Anak', jenis_kelamin: '' }); hitung(); },
          hapusPeserta: function (b) { bacaTambahan(); st.tambahan.splice(Number(b.dataset.i), 1); hitung(); }
        });
        /* Unggah bukti: seret-lepas, kompres gambar, pratinjau */
        var zona = ctx.el.querySelector('#unggah-bukti');
        if (zona) {
          var inp = zona.querySelector('input'), pilihBerkas = function (file) {
            UI2.bacaBerkas(file).then(function (b) {
              st.bukti = b; var pv = ctx.el.querySelector('#pratinjau-bukti');
              pv.innerHTML = '<div class="item-ikon mt8">' + (/^image/.test(b.mime) ? '<img src="' + b.url + '" alt="Pratinjau bukti" style="width:56px;height:56px;object-fit:cover;border-radius:10px">' : '<span class="ubin merah">' + ik('dokumen') + '</span>') + '<div class="tumbuh"><b class="kecil satu-baris">' + e(b.nama) + '</b><div class="kecil redup">' + Math.round(b.ukuran / 1024) + ' KB · siap dikirim</div></div><button type="button" class="btn ikon hantu kecil" data-a="hapusBukti" aria-label="Hapus">' + ik('x', 'k') + '</button></div>';
            }, function (er) { MR.UI.tandaiGalat(form, { bukti: er.message }); });
          };
          inp.addEventListener('change', function () { pilihBerkas(inp.files[0]); inp.value = ''; });
          ['dragenter', 'dragover'].forEach(function (x) { zona.addEventListener(x, function (ev) { ev.preventDefault(); zona.classList.add('seret'); }); });
          ['dragleave', 'drop'].forEach(function (x) { zona.addEventListener(x, function (ev) { ev.preventDefault(); zona.classList.remove('seret'); if (x === 'drop' && ev.dataTransfer.files[0]) pilihBerkas(ev.dataTransfer.files[0]); }); });
          ctx.aksi({ hapusBukti: function () { st.bukti = null; ctx.el.querySelector('#pratinjau-bukti').innerHTML = ''; } });
        }
        form.addEventListener('submit', function (ev) {
          ev.preventDefault(); bacaTambahan();
          var data = {}; skema.forEach(function (f) { if (f.tetap || f.tipe === 'berkas') return; data[f.kunci] = nilai(f.kunci) || ''; });
          var setuju = !!(form.querySelector('[name=setuju]') || {}).checked, tombol = form.querySelector('[type=submit]');
          var lokal = {}; if (blok.blok_persetujuan && !setuju) lokal._persetujuan = 'Centang persetujuan untuk melanjutkan';
          if (Object.keys(lokal).length) { MR.UI.tandaiGalat(form, lokal); MR.UI.toast('Lengkapi isian yang ditandai.', 'warn'); return; }
          var p = MR.UI.proses('Mengirim pendaftaran', ['Memeriksa isian', 'Mengunggah bukti transfer', 'Menyimpan ke sistem']);
          setTimeout(function () { p.langkah(1); }, 250); setTimeout(function () { p.langkah(2); }, 600);
          MR.UI.kerja(tombol, function () { return API.panggil('pub.kirimDaftar', { token: token, data: data, peserta_tambahan: st.tambahan.filter(function (t) { return t.nama; }), bukti: st.bukti ? { nama: st.bukti.nama, mime: st.bukti.mime, base64: st.bukti.base64 } : null, setuju: setuju }); }, { form: form })
            .then(function (r) { p.selesai(); setTimeout(function () { sukses(ctx, r, P, data, st.paket); }, 300); }, function () { p.gagal(); });
        });
        ctx.nanti(function () { hitung(); });
      }, function (er) {
        if (er.code !== 'LINK') throw er;
        ctx.el.innerHTML = '<div class="publik-isi" style="max-width:560px;padding-top:12vh"><div class="kartu pad tengah masuk"><div class="verif-cap tidak">' + ik('tautan') + '</div><h2 class="mt16">Link tidak berlaku</h2><p class="redup mt8">' + e(er.message) + '</p><a class="btn primer mt16" href="#/masuk">Kembali ke halaman masuk</a></div></div>';
      });
    }
  });
  function bannerOmbak() { return '<svg class="banner-ombak" viewBox="0 0 520 150" aria-hidden="true"><g class="ombak"><path fill="rgba(255,255,255,.14)" d="M0 90c40-18 80-18 120 0s80 18 120 0 80-18 120 0 80 18 120 0 80-18 120 0 80 18 120 0v80H0z"/></g><g class="ombak b"><path fill="rgba(255,255,255,.10)" d="M0 110c40-14 80-14 120 0s80 14 120 0 80-14 120 0 80 14 120 0 80-14 120 0 80 14 120 0v60H0z"/></g></svg>'; }
  W.bannerOmbak = bannerOmbak;
  function kartuSeksi(no, judul, sub, isi, kelas) { return '<section class="kartu ' + (kelas || '') + '"><div class="kartu-kepala"><span class="langkah-no">' + no + '</span><div class="tumpuk"><h2>' + e(judul) + '</h2><p>' + e(sub) + '</p></div></div><div class="kartu-isi">' + isi + '</div></section>'; }
  function fieldPublik(f, pre, d) {
    var v = pre[f.kunci] != null ? pre[f.kunci] : '', l = /^(nama|tgl_lahir|kategori|jenis_kelamin|kontak|email|kolam|jam)$/.test(f.kunci) ? 'l3' : '';
    var o = { k: f.kunci, label: f.label, wajib: f.wajib, bantu: f.bantu, v: v, l: l };
    if (f.tipe === 'tanggal') { o.tipe = 'date'; o.attr = ' max="' + UI2.hariIni() + '"'; }
    else if (f.tipe === 'angka') { o.tipe = 'number'; o.mode = 'numeric'; }
    else if (f.tipe === 'area') { o.tipe = 'area'; o.l = ''; }
    else if (f.tipe === 'pilihan' || (f.tipe === 'dropdown' && !f.sumber)) { o.tipe = 'select'; o.opsi = f.opsi || []; }
    else if (f.sumber === 'kolam') { o.tipe = 'select'; o.opsi = d.kolam.map(function (k) { return { v: k.kolam_id, l: k.nama }; }); }
    if (f.kunci === 'kontak') { o.tipe = 'tel'; o.mode = 'tel'; o.ph = '08xxxxxxxxxx'; o.attr = ' autocomplete="tel"'; }
    if (f.kunci === 'email') { o.tipe = 'email'; o.attr = ' autocomplete="email"'; }
    if (f.kunci === 'nama') o.attr = ' autocomplete="off"';
    if (f.kunci === 'jam') o.ph = 'Contoh: Sabtu 08:00';
    return UI2.fld(o);
  }
  function pilihPaket(f, d, pre) {
    var grup = {}; d.paket.forEach(function (p) { (grup[p.lokasi] = grup[p.lokasi] || []).push(p); });
    return '<div class="fld" data-k="paket"><label>' + e(f.label) + ' <span class="wajib">*</span></label>' + Object.keys(grup).map(function (lok) {
      return '<div class="kecil tebal redup" style="margin:6px 0 2px;display:flex;gap:6px;align-items:center">' + ik(lok === 'Home Visit' ? 'rumah' : 'renang', 'k') + e(lok === 'Home Visit' ? 'Home Visit — pelatih datang ke rumah' : 'Di kolam mitra') + '</div><div class="pilihan-kartu" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">' + grup[lok].map(function (p) {
        return '<label class="pilih dengan-gambar' + (pre.paket === p.paket_id ? ' aktif' : '') + '"><input type="radio" name="paket" value="' + e(p.paket_id) + '"' + (pre.paket === p.paket_id ? ' checked' : '') + '><img src="' + UI2.gambarPaket(p.kategori) + '" alt="" loading="lazy"><span class="tumpuk" style="gap:4px;min-width:0"><span>' + UI2.lencana(p.kategori) + '</span><b>' + e(p.nama) + '</b><span class="kecil redup">' + p.jumlah_sesi + ' sesi · ' + p.durasi_menit + ' menit' + (p.maks_peserta > 1 ? ' · hingga ' + p.maks_peserta + ' peserta' : '') + '</span><b class="teks-merek angka">' + F.rp(p.harga) + '</b></span></label>';
      }).join('') + '</div>';
    }).join('') + '<span class="galat"></span></div>';
  }
  function sukses(ctx, r, P, data, paket) {
    ctx.el.querySelector('.publik-isi').innerHTML = '<div class="kartu pad tengah masuk" style="max-width:560px;margin:8vh auto 0">' +
      '<div class="verif-cap sah">' + ik('cekBulat') + '</div><h2 class="mt16">Pendaftaran terkirim!</h2><p class="redup mt8">' + e(r.pesan) + '</p>' +
      '<div class="kotak-kode mt16"><span class="kecil redup" style="font:500 12px var(--f-isi);letter-spacing:0">Nomor pendaftaran</span>' + e(r.id) + '</div>' +
      (P.kontak_admin ? '<a class="btn wa besar lebar mt16" target="_blank" rel="noopener" href="' + UI2.waLink(P.kontak_admin, 'Halo Admin ' + P.nama_app + ', saya sudah mengirim pendaftaran ' + r.id + ' atas nama ' + (data.nama || '') + (paket ? ' (paket ' + paket.nama + ')' : '') + '. Mohon diverifikasi, terima kasih.') + '">' + ik('wa') + 'Konfirmasi ke Admin via WhatsApp</a>' : '') +
      '<a class="btn lebar mt8" href="#/masuk">Ke halaman masuk</a></div>';
    W.scrollTo(0, 0);
  }

  /* ---------------- Verifikasi dokumen (QR) ---------------- */
  R.daftar('v', {
    judul: 'Verifikasi Dokumen', publik: true,
    render: function (ctx) {
      var kode = (ctx.arg[0] || '').toUpperCase(), kepala = '<div class="publik-atas"><span class="sb-logo" style="width:36px;height:36px"><img src="' + e(MR.logo) + '" alt=""></span><div class="tumpuk tumbuh"><b style="font:700 15px var(--f-judul)">' + e(App.publik.nama_app) + '</b><small class="redup">Verifikasi keaslian dokumen</small></div><a class="btn kecil" href="#/masuk">Masuk</a></div>';
      var formKode = '<form id="f-v" class="form mt16"><div class="fld"><label>Kode verifikasi</label><div class="baris"><input class="inp" name="kode" placeholder="14 karakter, mis. 7KQ2…" value="' + e(kode) + '" autocapitalize="characters"><button class="btn primer" type="submit">Periksa</button></div></div></form>';
      if (!kode) {
        ctx.el.innerHTML = kepala + '<div class="publik-isi" style="max-width:560px"><div class="kartu pad masuk mt24"><div class="baris"><span class="ubin">' + ik('qr') + '</span><div class="tumpuk"><h2>Cek keaslian dokumen</h2><span class="kecil redup">Pindai QR pada kwitansi/slip/sertifikat, atau ketik kodenya.</span></div></div>' + formKode + '</div></div>';
        pasangForm(); return;
      }
      return API.panggil('pub.verifikasi', { kode: kode }).then(function (r) {
        if (ctx.basi()) return;
        var sah = r.ditemukan && r.status === 'SAH';
        ctx.el.innerHTML = kepala + '<div class="publik-isi" style="max-width:640px"><div class="kartu pad masuk mt24 tengah">' +
          '<div class="verif-cap ' + (sah ? 'sah' : 'tidak') + '">' + ik(sah ? 'cekBulat' : 'xBulat') + '</div>' +
          '<h2 class="mt16">' + (!r.ditemukan ? 'Dokumen tidak ditemukan' : sah ? 'Dokumen SAH' : r.status === 'DITARIK' ? 'Dokumen telah DITARIK' : 'Dokumen belum terbit') + '</h2>' +
          '<p class="redup mt8">' + (!r.ditemukan ? 'Kode ' + e(kode) + ' tidak terdaftar. Pastikan kode diketik dengan benar.' : sah ? 'Diterbitkan secara resmi oleh ' + e(r.instansi) + '.' : e(r.alasan_tarik || 'Dokumen ini tidak berlaku.')) + '</p></div>' +
          (r.ditemukan ? '<div class="kartu pad masuk-2 mt16"><div class="grid g2">' + [['Jenis dokumen', r.jenis], ['Nomor', r.nomor || '-'], ['Tanggal terbit', r.terbit ? F.waktu(r.terbit) + ' WIB' : '-'], ['Instansi', r.instansi]].map(function (x) { return '<div><div class="kecil redup">' + x[0] + '</div><b>' + e(x[1]) + '</b></div>'; }).join('') + '</div>' +
            (r.ringkas ? '<hr class="garis"><div class="kecil redup">Ringkasan</div><b>' + e(r.ringkas) + '</b>' : '') +
            (r.penandatangan.length ? '<hr class="garis"><div class="kecil redup">Ditandatangani</div>' + r.penandatangan.map(function (p) { return '<div class="baris mt8">' + UI2.avatar(p.nama, 'kecil') + '<div class="tumpuk"><b class="kecil">' + e(p.nama) + ' · ' + e(p.jabatan) + '</b><span class="kecil redup">' + e(p.metode) + ' · ' + e(F.waktu(p.waktu)) + '</span></div></div>'; }).join('') : '') +
            (r.hash_pdf ? '<hr class="garis"><div class="kecil redup">Sidik jari PDF (SHA-256)</div><code class="kecil putus">' + e(r.hash_pdf) + '</code><label class="btn kecil mt8">' + ik('unggah', 'k') + 'Cocokkan berkas PDF<input type="file" accept="application/pdf" hidden id="cek-pdf"></label><div id="hasil-pdf" class="mt8"></div>' : '') +
          '</div>' : '') +
          '<div class="kartu pad mt16 masuk-3"><b class="kecil">Periksa kode lain</b>' + formKode + '</div></div>';
        pasangForm();
        var cek = ctx.el.querySelector('#cek-pdf');
        if (cek) cek.addEventListener('change', function () {
          var f = cek.files[0]; if (!f || !W.crypto || !crypto.subtle) return;
          f.arrayBuffer().then(function (buf) { return crypto.subtle.digest('SHA-256', buf); }).then(function (h) {
            var hex = Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''), sama = hex === String(r.hash_pdf).toLowerCase();
            ctx.el.querySelector('#hasil-pdf').innerHTML = '<div class="peringatan ' + (sama ? 'ok' : 'bahaya') + '">' + ik(sama ? 'cekBulat' : 'segitiga') + '<div><b>' + (sama ? 'Berkas identik dengan dokumen resmi' : 'Berkas BERBEDA dari dokumen resmi') + '</b>' + (sama ? 'Isi PDF tidak diubah sejak diterbitkan.' : 'PDF ini mungkin telah diubah. Hubungi penerbit.') + '</div></div>';
          });
        });
      });
      function pasangForm() { var f = ctx.el.querySelector('#f-v'); if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); var k = f.kode.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); if (k) location.hash = '#/v/' + k; }); }
    }
  });
})(window, document);
