/* =====================================================================
 * PENDAFTARAN (verifikasi + link resmi) & DATA SISWA (detail, paket, akun ortu)
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router, OA = ['owner', 'admin'];
  var LABEL_DATA = { nama: 'Nama siswa', tgl_lahir: 'Tanggal lahir', kategori: 'Kategori', jenis_kelamin: 'Jenis kelamin', nama_ortu: 'Orang tua / wali', kontak: 'WhatsApp', email: 'Email', jam: 'Jadwal diinginkan', catatan_kesehatan: 'Catatan kesehatan' };
  var HARI = [1, 2, 3, 4, 5, 6, 7].map(function (h) { return { v: h, l: Inti.NAMA_HARI[h] }; });

  /* ---------------- Pendaftaran ---------------- */
  R.daftar('pendaftaran', {
    judul: 'Pendaftaran', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st, bisaV = Sesi.punya('pendaftaran.verifikasi'), bisaL = Sesi.punya('pendaftaran.link');
      st.tab = st.tab || (bisaV ? 'Baru' : 'Link');
      var ambil = st.tab === 'Link' ? API.Q('daftar.linkList') : API.Q('daftar.masukList', { status: st.tab });
      var hitungP = bisaV ? (API.tersimpan('daftar.masukList', { status: 'Baru' }) ? Promise.resolve(API.tersimpan('daftar.masukList', { status: 'Baru' })) : API.Q('daftar.masukList', { status: 'Baru' })) : Promise.resolve(null);
      return Promise.all([ambil, hitungP]).then(function (h) {
        if (ctx.basi()) return;
        var d = h[0], ref = st.tab === 'Link' ? h[1] : d, hit = ref ? ref.hitung : { Baru: 0, Diverifikasi: 0, Ditolak: 0 };
        var tabs = (bisaV ? [{ v: 'Baru', label: 'Menunggu', n: hit.Baru }, { v: 'Diverifikasi', label: 'Diverifikasi', n: hit.Diverifikasi }, { v: 'Ditolak', label: 'Ditolak', n: hit.Ditolak }] : []).concat(bisaL ? [{ v: 'Link', label: 'Link resmi', ikon: 'tautan' }] : []);
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Pendaftaran & Perpanjangan</h1><p>Formulir hanya bisa diisi lewat link resmi. Verifikasi mengaktifkan paket, mencatat kas, dan membuat kode akses orang tua.</p></div><div class="aksi">' +
          (bisaL ? '<button type="button" class="btn primer" data-a="buatLink" data-kunci="n">' + ik('tautan') + 'Buat link pendaftaran</button>' : '') + '</div></div>' +
          (bisaV ? '<div class="grid g4 kpi-baris stagger">' + UI2.kpi({ i: 0, label: 'Menunggu verifikasi', nilai: hit.Baru, ikon: 'jam', warna: 'oranye' }) + UI2.kpi({ i: 1, label: 'Diverifikasi', nilai: hit.Diverifikasi, ikon: 'cekBulat', warna: 'hijau' }) + UI2.kpi({ i: 2, label: 'Ditolak', nilai: hit.Ditolak, ikon: 'xBulat', warna: 'merah' }) + UI2.kpi({ i: 3, label: 'Rata-rata verifikasi', nilai: ref && ref.rataMenit ? (ref.rataMenit >= 60 ? Math.round(ref.rataMenit / 60) : ref.rataMenit) : '—', satuan: ref && ref.rataMenit >= 60 ? 'jam' : 'menit', ikon: 'segar' }) + '</div>' : '') +
          '<div class="baris ujung bungkus mt16">' + UI2.seg('tab', tabs, st.tab) + '</div><div id="daftar-isi" class="mt16"></div>';
        var isi = ctx.el.querySelector('#daftar-isi');
        if (st.tab === 'Link') isi.innerHTML = tabelLink(d.rows);
        else isi.innerHTML = d.rows.length ? '<div class="grid g2 stagger">' + d.rows.map(function (r, i) { return kartuPendaftaran(r, i); }).join('') + '</div>' : '<div class="kartu pad">' + MR.UI.kosong(st.tab === 'Baru' ? 'Tidak ada pendaftaran menunggu' : 'Belum ada data', st.tab === 'Baru' ? 'Semua pendaftaran sudah diproses. Bagikan link resmi untuk menerima pendaftaran baru.' : '') + '</div>';
        ctx.on('seg', '.seg', function (s, ev) { st.tab = ev.detail.v; R.tampilkan({ diam: true, bingkai: true }); });
        ctx.aksi({
          buatLink: function () { formLink(); },
          buka: function (t) { var r = d.rows.filter(function (x) { return x.id === t.dataset.id; })[0]; if (r) detailPendaftaran(r, d); },
          salinLink: function (t) { UI2.salin(W.urlDaftar(t.dataset.token), 'Link disalin.'); },
          waLink: function (t) { W.open('https://wa.me/?text=' + encodeURIComponent('Link pendaftaran resmi ' + App.publik.nama_app + ':\n' + W.urlDaftar(t.dataset.token)), '_blank', 'noopener'); }
        });
        ctx.nanti(function () {
          UI2.hidupkan(ctx.el);
          if (ctx.q.buat && bisaL && !st._buat) { st._buat = 1; formLink(); }
          if (ctx.q.id && !st._id) { st._id = 1; var r = (d.rows || []).filter(function (x) { return x.id === ctx.q.id; })[0]; if (r) detailPendaftaran(r, d); }
        });
      });
    }
  });
  function kartuPendaftaran(r, i) {
    var dt = r.data, n = 1 + (dt.peserta_tambahan || []).length, dup = r.duplikat && r.duplikat.length;
    return '<div class="kartu pad klik" data-a="buka" data-id="' + e(r.id) + '" tabindex="0" role="button" style="--i:' + i + '">' +
      '<div class="baris">' + UI2.avatar(dt.nama) + '<div class="tumpuk tumbuh" style="min-width:0"><div class="baris bungkus" style="gap:6px"><b class="satu-baris">' + e(dt.nama) + (n > 1 ? ' +' + (n - 1) : '') + '</b>' + (r.tipe === 'perpanjangan' ? '<span class="status ungu polos">Perpanjangan</span>' : '<span class="status info polos">Baru</span>') + '</div><span class="kecil redup">' + e(r.id) + ' · ' + e(F.relatif(r.dibuat_at)) + '</span></div>' + UI2.status(r.status) + '</div>' +
      '<div class="baris bungkus mt12" style="gap:8px">' + (r.paket ? UI2.lencana(r.paket.kategori) + '<b class="kecil">' + e(r.paket.nama) + '</b>' : '<span class="redup">Paket tidak valid</span>') + '</div>' +
      '<div class="baris ujung mt12"><span class="kecil redup">' + ik('pin', 'k') + ' ' + e(r.kolam) + '</span><b class="nominal">' + F.rp(r.tagihan) + '</b></div>' +
      '<div class="baris bungkus mt8" style="gap:6px">' + (r.bukti_url ? '<span class="status ok polos">' + ik('struk', 'k') + 'Bukti transfer</span>' : '<span class="status warn polos">Tanpa bukti</span>') + (dup ? '<span class="status habis polos">' + ik('segitiga', 'k') + 'Mirip siswa terdaftar</span>' : '') + (r.status === 'Diverifikasi' ? '<span class="kecil redup">oleh ' + e(r.diverifikasi_oleh) + '</span>' : '') + '</div></div>';
  }
  function tabelLink(rows) {
    return '<div class="kartu">' + UI2.tabel({ kolom: [
      { label: 'Link', f: function (l) { return '<div class="sel-utama"><span class="ubin" style="width:34px;height:34px">' + ik(l.tipe === 'perpanjangan' ? 'segar' : 'tautan', 'k') + '</span><span class="tumpuk"><b class="kecil">' + e(l.tipe === 'perpanjangan' ? 'Perpanjangan · ' + l.untuk : 'Pendaftaran baru') + '</b><small>' + e(l.catatan || l.token) + '</small></span></div>'; } },
      { label: 'Status', f: function (l) { return UI2.status(l.status); } },
      { label: 'Penggunaan', f: function (l) { return l.sekali_pakai === 'Y' ? 'Sekali pakai' : 'Berkali-kali'; } },
      { label: 'Berlaku sampai', f: function (l) { return e(F.waktu(l.kedaluwarsa)); } },
      { label: 'Aksi', f: function (l) { return l.status === 'Aktif' ? '<div class="baris"><button type="button" class="btn kecil" data-a="salinLink" data-token="' + e(l.token) + '">' + ik('salin', 'k') + 'Salin</button><button type="button" class="btn kecil wa" data-a="waLink" data-token="' + e(l.token) + '">' + ik('wa', 'k') + '</button></div>' : '<span class="redup kecil">—</span>'; } }
    ], baris: rows, kosong: 'Belum ada link', kosongSub: 'Buat link resmi lalu bagikan ke calon siswa.' }) + '</div>';
  }
  function formLink() {
    API.Q('siswa.list').then(function (sl) {
      var enr = sl.rows.filter(function (s) { return s.paket && s.paket.status !== 'Selesai'; }).map(function (s) { return { v: s.paket.enr_id, l: s.nama + ' · ' + s.paket.paket + ' (' + s.paket.sesi_terpakai + '/' + s.paket.sesi_total + ')' }; });
      var m = MR.UI.modal({ judul: 'Buat link pendaftaran', sub: 'Link resmi bertanda token unik; formulir tidak bisa dibuka tanpa link ini.', isi: '<form class="form">' +
        '<div class="fld"><label>Jenis link</label>' + UI2.seg('tipe', [{ v: 'baru', label: 'Siswa baru', ikon: 'tambahOrang' }, { v: 'perpanjangan', label: 'Perpanjangan', ikon: 'segar' }], 'baru', 'lebar') + '</div>' +
        '<div class="fld" data-k="enr_id" id="fld-enr" hidden><label>Paket yang diperpanjang</label><select class="inp" name="enr_id"><option value="">— Pilih siswa —</option>' + enr.map(function (x) { return '<option value="' + e(x.v) + '">' + e(x.l) + '</option>'; }).join('') + '</select><span class="galat"></span></div>' +
        UI2.fld({ k: 'hari', label: 'Berlaku (hari)', tipe: 'number', v: 7, l: 'l3', attr: ' min="1" max="30"' }) +
        '<div class="fld l3"><label>Penggunaan</label><label class="cek" style="height:var(--tinggi-input);align-items:center"><input type="checkbox" name="sekali_pakai" checked><span>Sekali pakai</span></label></div>' +
        UI2.fld({ k: 'catatan', label: 'Catatan (opsional)', ph: 'mis. nama calon siswa atau sumber promosi' }) + '</form>',
        kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + ik('tautan', 'k') + 'Buat link</button>' });
      var tipe = 'baru';
      UI2.hidupkanSeg(m.el); m.el.addEventListener('seg', function (ev) { tipe = ev.detail.v; m.el.querySelector('#fld-enr').hidden = tipe !== 'perpanjangan'; });
      m.el.querySelector('[data-ok]').onclick = function () {
        var f = m.el.querySelector('form'), v = UI2.baca(f);
        if (tipe === 'perpanjangan' && !v.enr_id) return MR.UI.tandaiGalat(f, { enr_id: 'Pilih paket siswa' });
        MR.UI.kerja(this, function () { return API.T('daftar.linkBuat', { tipe: tipe, enr_id: v.enr_id, hari: Number(v.hari) || 7, sekali_pakai: v.sekali_pakai, catatan: v.catatan }); }, { form: f }).then(function (r) { m.tutup(); W.tampilLink(r); R.muatUlang(); }).catch(function () { });
      };
    });
  }
  function detailPendaftaran(r, d) {
    var dt = r.data, tam = dt.peserta_tambahan || [], baru = r.status === 'Baru', lama = r.lama;
    var ekstraKey = Object.keys(dt).filter(function (k) { return !LABEL_DATA[k] && ['paket', 'kolam', 'peserta_tambahan', 'bukti'].indexOf(k) < 0 && dt[k] !== ''; });
    var m = MR.UI.laci({ lebar: true, judul: dt.nama + (tam.length ? ' + ' + tam.length + ' peserta' : ''), sub: e(r.id) + ' · masuk ' + e(F.waktu(r.dibuat_at)) + ' WIB', isi:
      (r.duplikat && r.duplikat.length ? '<div class="peringatan bahaya">' + ik('segitiga') + '<div><b>Kemungkinan data ganda</b>' + r.duplikat.map(function (x) { return e(x.pesan); }).join('<br>') + '</div></div>' : '') +
      (lama ? '<div class="peringatan info mt8">' + ik('segar') + '<div><b>Perpanjangan dari paket ' + e(lama.paket) + '</b>Terpakai ' + lama.sesi_terpakai + '/' + lama.sesi_total + ' · sisa ' + lama.sisa + ' sesi. Aturan saat ini: sisa sesi <b>' + e(d.aturan.sisa_sesi_perpanjangan) + '</b>' + (d.aturan.sisa_sesi_perpanjangan === 'dibawa' ? ' (maks. ' + d.aturan.maks_sesi_dibawa + ')' : '') + '.</div></div>' : '') +
      '<div class="dua-kolom mt16"><div>' +
        '<div class="kartu pad"><b>Data peserta</b><div class="grid g2 mt12">' + Object.keys(LABEL_DATA).filter(function (k) { return dt[k]; }).map(function (k) { return '<div><div class="kecil redup">' + LABEL_DATA[k] + '</div><b class="kecil putus">' + e(k === 'tgl_lahir' ? F.tgl(dt[k]) + ' (' + Inti.util.usia(dt[k], UI2.hariIni()) + ' th)' : dt[k]) + '</b></div>'; }).join('') +
          ekstraKey.map(function (k) { return '<div><div class="kecil redup">' + e(k.replace(/_/g, ' ')) + '</div><b class="kecil putus">' + e(dt[k]) + '</b></div>'; }).join('') + '</div>' +
          (tam.length ? '<hr class="garis"><b class="kecil">Peserta tambahan</b>' + tam.map(function (t, i) { return '<div class="item-ikon mt8">' + UI2.avatar(t.nama, 'kecil') + '<div class="tumbuh"><b class="kecil">' + e(t.nama) + '</b><div class="kecil redup">' + e(F.tgl(t.tgl_lahir)) + ' · ' + e(t.kategori) + '</div></div><span class="kecil redup">Peserta ' + (i + 2) + '</span></div>'; }).join('') : '') +
          (dt.kontak ? '<a class="btn wa kecil mt12" target="_blank" rel="noopener" href="' + UI2.waLink(dt.kontak, 'Halo ' + (dt.nama_ortu || '') + ', kami dari ' + App.publik.nama_app + ' terkait pendaftaran ' + dt.nama + '.') + '">' + ik('wa', 'k') + 'Chat orang tua</a>' : '') + '</div>' +
        '<div class="kartu pad mt12"><b>Pembayaran</b><div class="baris ujung mt12"><span>' + (r.paket ? UI2.lencana(r.paket.kategori) + ' <b class="kecil">' + e(r.paket.nama) + '</b>' : '-') + '</span><b class="nominal">' + F.rp(r.tagihan) + '</b></div>' + (r.ekstra ? '<div class="kecil redup mt8">Termasuk biaya ' + r.ekstra + ' peserta tambahan</div>' : '') +
          '<div class="mt12" id="bukti-wadah">' + (r.bukti_url ? UI2.muatSebaris('Memuat bukti…') : '<div class="peringatan warn">' + ik('segitiga') + '<div><b>Tanpa bukti transfer</b>Pastikan pembayaran diterima sebelum verifikasi.</div></div>') + '</div>' +
          '<div class="kecil redup mt8">Persetujuan data: ' + e(F.waktu(r.persetujuan_data_at)) + ' WIB</div></div>' +
      '</div><div>' +
        (baru && Sesi.punya('pendaftaran.verifikasi') ? '<form class="kartu pad lengket" id="f-verif"><b>Verifikasi & aktifkan</b><p class="kecil redup">Koreksi nama/tanggal lahir bila salah ketik — tercatat di log audit.</p><div class="form mt12">' +
          UI2.fld({ k: 'nama', label: 'Nama siswa', v: dt.nama, l: 'l3' }) + UI2.fld({ k: 'tgl_lahir', label: 'Tanggal lahir', tipe: 'date', v: dt.tgl_lahir, l: 'l3' }) +
          UI2.fld({ k: 'coach_id', label: 'Pelatih', tipe: 'select', wajib: true, opsi: d.pelatih.map(function (c) { return { v: c.coach_id, l: c.nama }; }), v: lama ? lama.coach_id : '', l: 'l3' }) +
          UI2.fld({ k: 'kolam_id', label: 'Kolam / area', tipe: 'select', opsi: d.kolam.map(function (k) { return { v: k.kolam_id, l: k.nama }; }), v: dt.kolam, l: 'l3', kosong: false }) +
          UI2.fld({ k: 'jam', label: 'Keterangan jam', v: dt.jam, l: 'l3' }) + UI2.fld({ k: 'tgl_mulai', label: 'Mulai paket', tipe: 'date', v: UI2.hariIni(), l: 'l3' }) +
          (lama ? '<div class="fld"><span class="bantu">' + ik('info', 'k') + ' Jadwal mingguan paket lama otomatis dipindahkan ke paket baru.</span></div>' :
            '<div class="fld"><label>Jadwal mingguan (opsional)</label><div class="baris">' + '<select class="inp" name="hari"><option value="">Hari</option>' + HARI.map(function (h) { return '<option value="' + h.v + '">' + h.l + '</option>'; }).join('') + '</select><input class="inp" type="time" name="jam_mulai" value="08:00"><input class="inp" type="time" name="jam_selesai" value="09:00"></div><span class="bantu">Bila diisi, slot jadwal pelatih langsung dibuat.</span></div>') +
          '</div><div class="baris mt16"><button type="button" class="btn bahaya" data-x="tolak">' + ik('xBulat', 'k') + 'Tolak</button><button type="submit" class="btn primer tumbuh">' + ik('cekBulat', 'k') + 'Verifikasi & aktifkan</button></div></form>'
          : '<div class="kartu pad"><b>Status</b><div class="mt12">' + UI2.status(r.status) + '</div>' + (r.status === 'Ditolak' ? '<p class="kecil mt8"><b>Alasan:</b> ' + e(r.catatan) + '</p>' : '') + '<p class="kecil redup mt8">' + (r.diverifikasi_at ? 'Diproses ' + e(F.waktu(r.diverifikasi_at)) + ' oleh ' + e(r.diverifikasi_oleh) : '') + '</p>' + (r.enr_baru ? '<a class="btn kecil mt12" href="#/siswa">' + ik('orang2', 'k') + 'Lihat di data siswa</a>' : '') + '</div>') +
      '</div></div>', kaki: false });
    if (r.bukti_url) API.berkas(r.bukti_url).then(function (u) { var w = m.el.querySelector('#bukti-wadah'); if (!w) return; w.innerHTML = /^data:application\/pdf|\.pdf/.test(u) ? '<a class="btn" href="' + e(u) + '" target="_blank" rel="noopener">' + ik('dokumen', 'k') + 'Buka bukti (PDF)</a>' : '<a href="' + e(u) + '" target="_blank" rel="noopener"><img src="' + e(u) + '" alt="Bukti transfer" style="width:100%;max-height:340px;object-fit:contain;border-radius:12px;background:#F8FAFC;border:1px solid var(--garis)"></a>'; }).catch(function () { var w = m.el.querySelector('#bukti-wadah'); if (w) w.innerHTML = '<span class="kecil redup">Bukti tidak dapat dimuat.</span>'; });
    var f = m.el.querySelector('#f-verif'); if (!f) return;
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var v = UI2.baca(f), tombol = f.querySelector('[type=submit]');
      var muatan = { id: r.id, koreksi: { nama: v.nama, tgl_lahir: v.tgl_lahir }, coach_id: v.coach_id, kolam_id: v.kolam_id, jam: v.jam, tgl_mulai: v.tgl_mulai };
      if (v.hari) muatan.jadwal = { hari: Number(v.hari), jam_mulai: v.jam_mulai, jam_selesai: v.jam_selesai };
      muatan.portal = W.urlPortal();
      MR.UI.kerja(tombol, function () { return API.T('daftar.verifikasi', muatan); }, { form: f }).then(function (h) { m.tutup(); hasilVerifikasi(h, dt); R.muatUlang(); }).catch(function () { });
    });
    f.querySelector('[data-x=tolak]').onclick = function () {
      UI2.mintaTeks({ judul: 'Tolak pendaftaran', pesan: 'Alasan dikirim ke orang tua lewat pesan WhatsApp manual.', label: 'Alasan penolakan', ph: 'mis. bukti transfer tidak terbaca', ok: 'Tolak pendaftaran', bahaya: true, min: 3 }).then(function (al) {
        if (!al) return;
        API.T('daftar.tolak', { id: r.id, alasan: al }).then(function (h) { m.tutup(); MR.UI.toast('Pendaftaran ditolak.', 'info', { aksi: { label: 'Kabari via WA', fn: function () { W.open('https://wa.me/' + h.wa.nomor + '?text=' + encodeURIComponent(h.wa.teks), '_blank', 'noopener'); } } }); R.muatUlang(); }).catch(MR.UI.galat);
      });
    };
  }
  function hasilVerifikasi(h, dt) {
    var m = MR.UI.modal({ judul: 'Paket aktif! 🎉', sub: 'Kirim kode akses portal ke orang tua lewat WhatsApp.', isi:
      '<div class="peringatan ok">' + ik('cekBulat') + '<div><b>Verifikasi berhasil</b>Paket ' + e(h.enr_id) + ' aktif' + (h.sesi_bawaan ? ' · ' + h.sesi_bawaan + ' sisa sesi dibawa dari paket lama' : '') + '. ' + h.trx.length + ' transaksi kas tercatat otomatis.</div></div>' +
      '<div class="mt16 daftar-ikon">' + h.siswa.map(function (x) { return '<div class="item-ikon">' + UI2.avatar(x.nama) + '<div class="tumbuh"><b class="kecil">' + e(x.nama) + '</b><div class="kecil redup">Kode akses portal</div></div><b class="kotak-kode" style="padding:6px 10px">' + e(x.kode_akses) + '</b></div>'; }).join('') +
      '<div class="item-ikon"><span class="ubin">' + ik('kunci') + '</span><div class="tumbuh"><b class="kecil">PIN orang tua</b><div class="kecil redup">' + (h.pin ? 'Akun orang tua baru dibuat' : 'Akun orang tua sudah ada (saudara terhubung)') + '</div></div><b class="kotak-kode" style="padding:6px 10px">' + e(h.pin || 'PIN lama') + '</b></div></div>' +
      '<div class="kartu pad mt16" style="background:#F8FAFC"><div class="kecil redup">Pratinjau pesan</div><p class="kecil mt8" style="white-space:pre-line">' + e(h.wa.teks) + '</p></div>',
      kaki: '<button type="button" class="btn" data-x="salin">' + ik('salin', 'k') + 'Salin pesan</button><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/' + e(h.wa.nomor) + '?text=' + encodeURIComponent(h.wa.teks) + '">' + ik('wa', 'k') + 'Kirim via WhatsApp</a>' });
    m.on('click', '[data-x=salin]', function () { UI2.salin(h.wa.teks, 'Pesan disalin.'); });
    m.on('click', 'a[href^="#"]', function () { m.tutup(); });
  }

  /* ---------------- Data siswa ---------------- */
  var STATUS = ['Aktif', 'HABIS', 'Tanpa paket', 'Selesai', 'Nonaktif'];
  R.daftar('siswa', {
    judul: 'Data Siswa', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st;
      if (ctx.q.status && !st._q) { st.status = ctx.q.status; st._q = 1; }
      st.status = st.status || ''; st.tampil = st.tampil || MR.Pref.ambil('siswa_tampil', W.innerWidth < 860 ? 'kartu' : 'tabel');
      return API.Q('siswa.list').then(function (d) {
        if (ctx.basi()) return;
        var fc = d.facet.status, kelola = Sesi.punya('siswa.kelola');
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Data Siswa</h1><p>' + d.total + ' siswa terdaftar · ' + (fc.Aktif || 0) + ' aktif · ' + (fc.HABIS || 0) + ' paket HABIS</p></div><div class="aksi">' +
          (Sesi.punya('laporan.ekspor') ? '<button type="button" class="btn" data-a="ekspor">' + ik('unduh') + 'Excel</button>' : '') +
          (kelola ? '<button type="button" class="btn primer" data-a="tambah" data-kunci="n">' + ik('tambahOrang') + 'Tambah siswa</button>' : '') + '</div></div>' +
          '<div class="kartu pad"><div class="baris bungkus" style="gap:10px"><div class="inp-ikon tumbuh" style="min-width:220px">' + ik('cari') + '<input class="inp" data-f="q" placeholder="Cari nama, kode akses, orang tua, atau nomor WA…" value="' + e(st.q || '') + '"></div>' +
            '<select class="inp" data-f="kolam" style="width:auto"><option value="">Semua kolam</option>' + d.kolam.map(function (k) { return '<option value="' + e(k.kolam_id) + '"' + (st.kolam === k.kolam_id ? ' selected' : '') + '>' + e(k.nama) + '</option>'; }).join('') + '</select>' +
            '<select class="inp" data-f="coach" style="width:auto"><option value="">Semua pelatih</option>' + d.pelatih.map(function (c) { return '<option value="' + e(c.coach_id) + '"' + (st.coach === c.coach_id ? ' selected' : '') + '>' + e(c.nama) + '</option>'; }).join('') + '</select>' +
            '<select class="inp" data-f="jenis" style="width:auto"><option value="">Semua jenis</option>' + d.jenis.map(function (j) { return '<option' + (st.jenis === j ? ' selected' : '') + '>' + e(j) + '</option>'; }).join('') + '</select>' +
            UI2.seg('tampil', [{ v: 'tabel', label: 'Tabel', ikon: 'daftar' }, { v: 'kartu', label: 'Kartu', ikon: 'grid' }], st.tampil) + '</div>' +
            '<div class="deret-chip mt12">' + [{ v: '', l: 'Semua', n: d.total }].concat(STATUS.map(function (s) { return { v: s, l: s === 'HABIS' ? 'Paket HABIS' : s, n: fc[s] || 0 }; })).map(function (c) { return '<button type="button" class="chip' + (st.status === c.v ? ' aktif' : '') + '" data-a="status" data-v="' + e(c.v) + '">' + e(c.l) + '<span class="n">' + c.n + '</span></button>'; }).join('') + '</div></div>' +
          '<div id="siswa-isi" class="mt16"></div>';
        function saring() {
          var q = (st.q || '').toLowerCase();
          return d.rows.filter(function (s) {
            if (st.status && s.status !== st.status) return false; if (st.kolam && (!s.paket || s.paket.kolam_id !== st.kolam)) return false;
            if (st.coach && (!s.paket || s.paket.coach_id !== st.coach)) return false; if (st.jenis && (!s.paket || s.paket.jenis !== st.jenis)) return false;
            return !q || (s.nama + ' ' + s.kode_akses + ' ' + s.nama_ortu + ' ' + s.kontak_ortu).toLowerCase().indexOf(q) >= 0;
          });
        }
        function gambar() {
          var rows = saring(), w = ctx.el.querySelector('#siswa-isi');
          if (!rows.length) { w.innerHTML = '<div class="kartu pad">' + MR.UI.kosong('Tidak ada siswa yang cocok', 'Ubah kata kunci atau filter.') + '</div>'; return; }
          w.innerHTML = st.tampil === 'kartu' ? '<div class="grid g3 stagger">' + rows.slice(0, 120).map(function (s, i) { return kartuSiswa(s, i); }).join('') + '</div>'
            : '<div class="kartu">' + UI2.tabel({ klik: 'buka', id: 'siswa_id', baris: rows, kelasBaris: function (s) { return s.status === 'HABIS' ? 'baris-habis' : ''; }, kolom: [
              { label: 'Siswa', f: function (s) { return '<div class="sel-utama">' + UI2.avatar(s.nama, 'kecil') + '<span class="tumpuk"><b>' + e(s.nama) + '</b><small>' + e(s.kode_akses) + ' · ' + e(s.kategori) + (s.usia != null ? ', ' + s.usia + ' th' : '') + '</small></span></div>'; } },
              { label: 'Paket', f: function (s) { return s.paket ? '<div class="tumpuk" style="gap:3px">' + UI2.lencana(s.paket.kategori) + '<span class="kecil">' + e(s.paket.paket) + '</span></div>' : '<span class="redup">—</span>'; } },
              { label: 'Pemakaian', f: function (s) { return s.paket ? '<div style="min-width:120px">' + UI2.progres(s.paket, { tanpaLabel: true }) + '<span class="kecil angka">' + s.paket.sesi_terpakai + '/' + s.paket.sesi_total + ' · sisa ' + s.paket.sisa + '</span></div>' : ''; } },
              { label: 'Pelatih', f: function (s) { return s.paket ? e(s.paket.pelatih) : ''; } },
              { label: 'Kolam', f: function (s) { return s.paket ? e(s.paket.kolam_singkat || s.paket.kolam) : ''; } },
              { label: 'Status', f: function (s) { return s.paket && s.status !== 'Nonaktif' ? UI2.sisaChip(s.paket) : UI2.status(s.status); } },
              { label: 'Orang tua', f: function (s) { return '<span class="tumpuk"><span class="kecil">' + e(s.nama_ortu || '-') + '</span><small class="redup angka">' + e(s.kontak_ortu || '') + '</small></span>'; } },
              { label: 'Pesan', f: function (s) { return s.kontak_ortu ? '<button type="button" class="btn ikon kecil wa" data-a="wa" data-id="' + e(s.siswa_id) + '" aria-label="Pesan WhatsApp ke orang tua ' + e(s.nama) + '" title="Pengingat jadwal / sisa sesi">' + ik('wa', 'k') + '</button>' : ''; } }
            ] }) + '</div>';
          UI2.hidupkan(w);
        }
        ctx.on('input', '[data-f=q]', MR.U.debounce(function (i) { st.q = i.value; gambar(); }, 120));
        ctx.on('change', 'select[data-f]', function (s) { st[s.dataset.f] = s.value; gambar(); });
        ctx.on('seg', '.seg', function (s, ev) { st.tampil = ev.detail.v; MR.Pref.simpan('siswa_tampil', st.tampil); gambar(); });
        ctx.aksi({
          wa: function (b, ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); W.pesanWA(b.dataset.id); },
          status: function (b) { st.status = b.dataset.v; MR.qsa('.chip', ctx.el).forEach(function (c) { c.classList.toggle('aktif', c === b); }); gambar(); },
          buka: function (t) { W.detailSiswa(t.dataset.id); },
          tambah: function () { formSiswa(); },
          ekspor: function () {
            var rows = saring();
            Xlsx.unduh('Data_Siswa_' + UI2.hariIni(), [{ nama: 'Siswa', kolom: ['Kode akses', 'Nama', 'Kategori', 'Usia', 'Jenis kelamin', 'Status', 'Paket', 'Kategori sesi', 'Terpakai', 'Total sesi', 'Sisa', 'Pelatih', 'Kolam', 'Mulai', 'Orang tua', 'WhatsApp'],
              baris: rows.map(function (s) { var p = s.paket || {}; return [s.kode_akses, s.nama, s.kategori, s.usia == null ? '' : s.usia, s.jenis_kelamin, s.status, p.paket || '', p.kategori || '', p.sesi_terpakai || 0, p.sesi_total || 0, p.sisa || 0, p.pelatih || '', p.kolam || '', p.tgl_mulai || '', s.nama_ortu, s.kontak_ortu]; }) }]);
          }
        });
        ctx.nanti(function () {
          gambar(); UI2.hidupkan(ctx.el);
          if (ctx.q.tambah && kelola && !st._t) { st._t = 1; formSiswa(); }
          if (ctx.q.id && st._id !== ctx.q.id) { st._id = ctx.q.id; W.detailSiswa(ctx.q.id); }
        });
      });
    }
  });
  function kartuSiswa(s, i) {
    var p = s.paket;
    return '<div class="kartu kartu-paket klik' + (s.status === 'HABIS' ? ' habis' : '') + '" data-a="buka" data-id="' + e(s.siswa_id) + '" tabindex="0" role="button" style="--i:' + i + '">' +
      '<div class="baris">' + UI2.avatar(s.nama) + '<div class="tumpuk tumbuh" style="min-width:0"><b class="satu-baris">' + e(s.nama) + '</b><span class="kecil redup">' + e(s.kode_akses) + ' · ' + e(s.kategori) + (s.usia != null ? ', ' + s.usia + ' th' : '') + '</span></div>' + (p && s.status !== 'Nonaktif' ? UI2.sisaChip(p) : UI2.status(s.status)) + '</div>' +
      (p ? '<div class="baris bungkus" style="gap:6px">' + UI2.lencana(p.kategori) + '<span class="kecil tebal satu-baris">' + e(p.paket) + '</span></div>' + UI2.progres(p) + '<div class="meta"><span>' + ik('peluit', 'k') + ' ' + e(p.pelatih) + '</span> · <span>' + e(p.kolam_singkat || p.kolam) + '</span></div>' : '<p class="kecil redup">Belum memiliki paket.</p>') + '</div>';
  }

  /* Detail siswa (laci lebar) — dipakai dari mana saja */
  var laciDetail = null;
  /* lama = laci yang sudah terbuka → isinya diperbarui di tempat (tanpa tutup-buka ulang) */
  W.detailSiswa = function (id, lama) {
    var m = lama || MR.UI.laci({ lebar: true, judul: 'Memuat…', isi: UI2.muatSebaris('Mengambil data siswa…'), kaki: false, saatTutup: function () { if (laciDetail === m) laciDetail = null; } });
    m._id = id; laciDetail = m;
    API.Q('siswa.detail', { siswa_id: id }).then(function (d) {
      if (m.tertutup) return;
      m._data = d;
      var s = d.siswa, aktif = d.paket.filter(function (p) { return p.status !== 'Selesai'; })[0], b = d.bisa;
      m.el.querySelector('.ov-kepala h2').textContent = s.nama;
      m.isi.innerHTML = '<div class="baris" style="gap:14px">' + UI2.avatar(s.nama, 'besar') + '<div class="tumpuk tumbuh"><b style="font:700 18px var(--f-judul)">' + e(s.nama) + '</b><span class="redup kecil">' + e(s.kategori) + (d.usia != null ? ' · ' + d.usia + ' tahun' : '') + ' · ' + e(s.jenis_kelamin || '-') + ' · lahir ' + e(F.tgl(s.tgl_lahir)) + '</span>' +
        '<div class="baris bungkus mt8" style="gap:6px">' + (s.kode_akses ? '<button type="button" class="chip" data-x="salinKode">' + ik('kunci', 'k') + e(s.kode_akses) + '</button>' : '') + (s.aktif === 'T' ? '<span class="status netral">Nonaktif</span>' : '') + '</div></div>' +
        (b.kelola ? '<button type="button" class="btn kecil" data-x="edit">' + ik('pensil', 'k') + 'Ubah data</button>' : '') + '</div>' +
        (d.ortu || s.nama_ortu ? '<div class="kartu pad mt16"><div class="baris"><span class="ubin hijau">' + ik('orang') + '</span><div class="tumpuk tumbuh"><b class="kecil">' + e(s.nama_ortu || (d.ortu || {}).nama || '-') + '</b><span class="kecil redup angka">' + e(s.kontak_ortu || '') + (s.email_ortu ? ' · ' + e(s.email_ortu) : '') + '</span><span class="kecil redup">Portal: ' + (d.ortu && d.ortu.login_terakhir ? 'terakhir masuk ' + e(F.relatif(d.ortu.login_terakhir)) : 'belum pernah masuk') + '</span></div>' +
          (s.kontak_ortu ? '<button type="button" class="btn kecil wa" data-x="pesanWA" aria-label="Kirim pesan WhatsApp">' + ik('wa', 'k') + '<span class="sembunyi-hp">Pesan</span></button>' : '') +
          (b.akun && d.ortu ? '<button type="button" class="btn kecil" data-x="resetPin">' + ik('kunci', 'k') + '<span class="sembunyi-hp">Reset PIN</span></button>' : '') + '</div></div>' : '') +
        (s.catatan ? '<div class="peringatan info mt12">' + ik('info') + '<div><b>Catatan</b>' + e(s.catatan) + '</div></div>' : '') +
        '<div class="judul-seksi"><h2>Paket</h2><span class="tumbuh"></span>' + (b.kelola ? '<button type="button" class="btn kecil primer" data-x="paketBaru">' + ik('plus', 'k') + (aktif ? 'Perpanjang' : 'Paket baru') + '</button>' : '') + '</div>' +
        (d.paket.length ? d.paket.map(function (p, i) {
          return '<div class="kartu pad' + (i ? ' mt12' : '') + (p.status === 'HABIS' ? ' kartu-paket habis' : '') + '"><div class="baris bungkus ujung"><div class="baris bungkus" style="gap:6px">' + UI2.lencana(p.kategori) + '<b>' + e(p.paket) + '</b><span class="kecil redup">' + e(p.tipe) + ' · ' + e(p.enr_id) + '</span></div>' + UI2.sisaChip(p) + '</div>' +
            '<div class="mt12">' + UI2.progres(p) + '</div>' +
            '<div class="grid g4 mt12 kecil">' + [['Pelatih', p.pelatih], ['Lokasi', (p.lokasi === 'Home Visit' ? 'HV · ' : '') + p.kolam], ['Mulai', F.tgl(p.tgl_mulai)], ['Kedaluwarsa', p.tgl_kedaluwarsa ? F.tgl(p.tgl_kedaluwarsa) : 'Tanpa batas']].map(function (x) { return '<div><div class="redup">' + x[0] + '</div><b>' + e(x[1]) + '</b></div>'; }).join('') + '</div>' +
            (p.sesi_bawaan ? '<p class="kecil redup mt8">Termasuk ' + p.sesi_bawaan + ' sesi dibawa dari paket sebelumnya.</p>' : '') + (p.sesi_lebih ? '<p class="kecil teks-warn mt8">' + p.sesi_lebih + ' sesi lebih (absen setelah paket HABIS).</p>' : '') +
            (p.status !== 'Selesai' && b.kelola ? '<div class="baris bungkus mt12"><button type="button" class="btn kecil" data-x="ubahPaket" data-enr="' + e(p.enr_id) + '">' + ik('pensil', 'k') + 'Ubah pelatih/kolam</button>' + (b.link ? '<button type="button" class="btn kecil wa" data-x="link" data-enr="' + e(p.enr_id) + '">' + ik('wa', 'k') + 'Link perpanjangan</button>' : '') + '<button type="button" class="btn kecil bahaya" data-x="selesai" data-enr="' + e(p.enr_id) + '">Selesaikan</button></div>' : '') +
            (p.riwayat && p.riwayat.length ? '<details class="mt12"><summary class="kecil tebal" style="cursor:pointer">Riwayat kehadiran (' + p.riwayat.length + ')</summary>' + UI2.tabel({ baris: p.riwayat, kolom: [{ label: 'Ke', f: function (a) { return '#' + a.pertemuan_ke; } }, { label: 'Tanggal', f: function (a) { return e(F.tglHari(a.tanggal)); } }, { label: 'Status', f: function (a) { return a.peserta.filter(function (x) { return x.siswa_id === s.siswa_id; }).map(function (x) { return UI2.status(x.status); }).join(' ') + (a.dihitung ? '' : ' <span class="kecil redup">tidak dihitung</span>') + (a.sesi_lebih ? ' <span class="status warn polos">lebih</span>' : '') + (a.koreksi ? ' <span class="status netral polos">koreksi</span>' : ''); } }, { label: 'Pelatih', k: 'pelatih' }, { label: 'Waktu server', f: function (a) { return e(F.jam(a.waktu_server)) + (a.via_buka_kunci ? ' · buka kunci' : ''); } }] }) + '</details>' : '') +
            '</div>';
        }).join('') : '<div class="kartu pad">' + MR.UI.kosong('Belum ada paket', 'Tambahkan paket untuk mulai menjadwalkan latihan.') + '</div>') +
        (d.jadwal.length ? '<div class="judul-seksi"><h2>Jadwal mingguan</h2></div><div class="daftar-ikon">' + d.jadwal.map(function (j) { return '<div class="item-ikon"><span class="ubin">' + ik('kalender') + '</span><div class="tumbuh"><b class="kecil">' + e(j.nama_hari) + ', ' + e(j.jam_mulai) + '–' + e(j.jam_selesai) + '</b><div class="kecil redup">' + e(j.pelatih) + ' · ' + e(j.kolam) + '</div></div></div>'; }).join('') + '</div>' : '');
      if (m._pasang) return; m._pasang = 1;
      m.on('click', '[data-x]', function (t) {
        var d = m._data, s = d.siswa, aktif = d.paket.filter(function (q) { return q.status !== 'Selesai'; })[0];
        var x = t.dataset.x, enr = t.dataset.enr, p = d.paket.filter(function (q) { return q.enr_id === enr; })[0];
        if (x === 'salinKode') UI2.salin(s.kode_akses, 'Kode akses disalin.');
        if (x === 'pesanWA') W.pesanWA(s.siswa_id);
        if (x === 'edit') formSiswa(s);
        if (x === 'paketBaru') formPaket([s], aktif);
        if (x === 'ubahPaket') ubahPaket(p);
        if (x === 'link') W.buatLinkPerpanjangan(enr, t);
        if (x === 'selesai') UI2.mintaTeks({ judul: 'Selesaikan paket?', pesan: 'Paket ditutup (status Selesai) dan slot jadwal dinonaktifkan. Riwayat tetap tersimpan.', label: 'Alasan', ph: 'mis. tidak melanjutkan / pindah kota', ok: 'Selesaikan paket', bahaya: true, min: 3 }).then(function (al) { if (al) API.T('paket.selesai', { enr_id: enr, alasan: al }).then(function () { MR.UI.toast('Paket diselesaikan.', 'ok'); m.tutup(); R.muatUlang(); }).catch(MR.UI.galat); });
        if (x === 'resetPin') MR.UI.konfirmasi({ judul: 'Reset PIN orang tua?', pesan: 'PIN lama langsung tidak berlaku dan sesi orang tua di semua perangkat berakhir.', ok: 'Reset PIN', bahaya: true }).then(function (y) { if (y) API.T('akun.reset', { user_id: d.ortu.user_id }).then(W.tampilRahasiaBaru).catch(MR.UI.galat); });
      });
    }).catch(function (er) { m.isi.innerHTML = MR.UI.kosong('Gagal memuat', er.message); });
  };
  W.tampilRahasiaBaru = function (r) {
    var ortu = r.peran === 'ortu', teks = ortu ? 'Halo ' + r.nama + ', PIN portal orang tua ' + App.publik.nama_app + ' telah direset.\nKode akses: ' + r.kode_akses.join(', ') + '\nPIN baru: *' + r.rahasia + '*' : 'Halo ' + r.nama + ', sandi akun ' + App.publik.nama_app + ' Anda direset. Sandi sementara: *' + r.rahasia + '* — segera ganti setelah masuk.';
    var m = MR.UI.modal({ judul: ortu ? 'PIN baru' : 'Sandi sementara', sempit: true, sub: 'Hanya ditampilkan sekali. Kirim langsung ke pemilik akun.', isi: '<div class="kotak-kode" style="justify-content:center;font-size:24px">' + e(r.rahasia) + '</div>', kaki: '<button type="button" class="btn" data-x="salin">' + ik('salin', 'k') + 'Salin</button>' + (r.kontak ? '<a class="btn wa" target="_blank" rel="noopener" href="' + UI2.waLink(r.kontak, teks) + '">' + ik('wa', 'k') + 'Kirim via WA</a>' : '') });
    m.on('click', '[data-x=salin]', function () { UI2.salin(r.rahasia); });
  };
  function segarkanDetail(id) { if (laciDetail && !laciDetail.tertutup && laciDetail._id === id) W.detailSiswa(id, laciDetail); else { MR.UI.tutupSemua(); W.detailSiswa(id); } }
  /* Optimistic UI: detail & daftar siswa berubah seketika; server di latar; gagal → data semula + "Buka lagi" */
  function ubahOptimistik(s, v, f, m) {
    var lokal = {};
    if (!String(v.nama || '').trim()) lokal.nama = 'Wajib diisi';
    if (!Inti.util.hpValid(Inti.util.hp08(v.kontak_ortu || ''))) lokal.kontak_ortu = 'Nomor WhatsApp tidak valid';
    if (Object.keys(lokal).length) { MR.UI.tandaiGalat(f, lokal); return; }
    var baru = { nama: v.nama.trim(), jenis_kelamin: v.jenis_kelamin, tgl_lahir: v.tgl_lahir, kategori: v.kategori, nama_ortu: v.nama_ortu, kontak_ortu: Inti.util.hp08(v.kontak_ortu), email_ortu: v.email_ortu, aktif: v.aktif, catatan: v.catatan };
    var pulihkan = API.ubahCache(function (k) { return k.indexOf('siswa.detail|') === 0 || k.indexOf('siswa.list|') === 0; }, function (d) {
      if (d.siswa && d.siswa.siswa_id === s.siswa_id) Object.assign(d.siswa, baru);
      (d.rows || []).forEach(function (r) { if (r.siswa_id === s.siswa_id) Object.keys(baru).forEach(function (k) { if (k in r) r[k] = baru[k]; }); });
    });
    m.tutup(); segarkanDetail(s.siswa_id);
    requestAnimationFrame(function () { setTimeout(function () { R.tampilkan({ diam: true }); }, 0); });   /* laci detail dilukis dulu, daftar di belakangnya menyusul */
    MR.UI.toast('Data ' + baru.nama + ' disimpan.', 'ok');
    API.T('siswa.simpan', { siswa: v }, { diam: true }).then(function () { R.segarkanDiam(); }, function (er) {
      pulihkan(); R.segarkanDiam(); segarkanDetail(s.siswa_id);
      MR.UI.toast((er && er.message) || 'Gagal menyimpan data siswa.', 'bahaya', { judul: 'Perubahan belum tersimpan', durasi: 9000, aksi: { label: 'Buka lagi', fn: function () { formSiswa(Object.assign({}, s, v)); } } });
    });
  }
  function formSiswa(s) {
    s = s || {}; var baru = !s.siswa_id;
    var m = MR.UI.modal({ judul: baru ? 'Tambah siswa' : 'Ubah data siswa', sub: baru ? 'Akun orang tua dibuat otomatis (satu nomor WA = satu akun, saudara terhubung).' : 'Perubahan nama & tanggal lahir tercatat di log audit.', isi: '<form class="form">' +
      UI2.fld({ k: 'nama', label: 'Nama lengkap', v: s.nama, wajib: true, l: 'l4' }) + UI2.fld({ k: 'jenis_kelamin', label: 'Jenis kelamin', tipe: 'select', opsi: ['Laki-laki', 'Perempuan'], v: s.jenis_kelamin, l: 'l2' }) +
      UI2.fld({ k: 'tgl_lahir', label: 'Tanggal lahir', tipe: 'date', v: s.tgl_lahir, l: 'l3', attr: ' max="' + UI2.hariIni() + '"' }) + UI2.fld({ k: 'kategori', label: 'Kategori', tipe: 'select', opsi: ['Anak', 'Dewasa'], v: s.kategori || 'Anak', l: 'l3', kosong: false, bantu: '15 tahun ke atas = Dewasa' }) +
      UI2.fld({ k: 'nama_ortu', label: 'Nama orang tua / wali', v: s.nama_ortu, l: 'l3' }) + UI2.fld({ k: 'kontak_ortu', label: 'WhatsApp orang tua', tipe: 'tel', mode: 'tel', v: s.kontak_ortu, wajib: true, l: 'l3', ph: '08xxxxxxxxxx' }) +
      UI2.fld({ k: 'email_ortu', label: 'Email orang tua', tipe: 'email', v: s.email_ortu, l: 'l3' }) + (baru ? '' : UI2.fld({ k: 'aktif', label: 'Status siswa', tipe: 'select', opsi: [{ v: 'Y', l: 'Aktif' }, { v: 'T', l: 'Nonaktif' }], v: s.aktif || 'Y', l: 'l3', kosong: false })) +
      UI2.fld({ k: 'catatan', label: 'Catatan (kesehatan/kebutuhan khusus)', tipe: 'area', v: s.catatan, baris: 2 }) + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + (baru ? 'Simpan & lanjut paket' : 'Simpan perubahan') + '</button>' });
    var f = m.el.querySelector('form');
    f.tgl_lahir.addEventListener('change', function () { var u = Inti.util.usia(f.tgl_lahir.value, UI2.hariIni()); if (u != null) f.kategori.value = u >= 15 ? 'Dewasa' : 'Anak'; });
    m.el.querySelector('[data-ok]').onclick = function () {
      var v = UI2.baca(f); v.siswa_id = s.siswa_id;
      if (!baru) { ubahOptimistik(s, v, f, m); return; }
      MR.UI.kerja(this, function () { return API.T('siswa.simpan', { siswa: v }); }, { form: f }).then(function (r) {
        m.tutup(); R.muatUlang();
        if (!baru) { MR.UI.toast('Data siswa disimpan.', 'ok'); MR.UI.tutupSemua(); W.detailSiswa(s.siswa_id); return; }
        MR.UI.toast('Siswa ditambahkan · kode akses ' + r.kode_akses + (r.pin ? ' · PIN ' + r.pin : ''), 'ok', { durasi: 9000 });
        formPaket([{ siswa_id: r.siswa_id, nama: v.nama }], null, r);
      }).catch(function () { });
    };
  }
  function formPaket(peserta, induk, akunBaru) {
    Promise.all([API.Q('pub.config', {}, { umur: 300000 }), API.Q('siswa.list'), API.Q('owner.harga').catch(function () { return null; })]).then(function (h) {
      var sl = h[1], hr = h[2], paketList = h[0].paket, harga = {};
      (hr ? hr.paket : []).forEach(function (p) { harga[p.paket_id] = p; });
      var m = MR.UI.modal({ lebar: true, judul: induk ? 'Perpanjang paket' : 'Paket latihan baru', sub: induk ? 'Paket lama ditutup; sisa sesi mengikuti Aturan Bisnis saat ini. Jadwal lama dipindahkan.' : 'Transaksi kas pendaftaran dicatat otomatis sesuai harga resmi.', isi: '<form class="form">' +
        (akunBaru ? '<div class="fld"><div class="peringatan ok">' + ik('cekBulat') + '<div><b>Siswa tersimpan</b>Kode akses <b>' + e(akunBaru.kode_akses) + '</b>' + (akunBaru.pin ? ' · PIN orang tua <b>' + e(akunBaru.pin) + '</b>' : ' · akun orang tua sudah ada') + '</div></div></div>' : '') +
        '<div class="fld" data-k="paket_id"><label>Paket <span class="wajib">*</span></label><div class="pilihan-kartu" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">' + paketList.map(function (p) { var hp = harga[p.paket_id]; return '<label class="pilih dengan-gambar' + (induk && induk.paket_id === p.paket_id ? ' aktif' : '') + '"><input type="radio" name="paket_id" value="' + e(p.paket_id) + '"' + (induk && induk.paket_id === p.paket_id ? ' checked' : '') + '><img src="' + UI2.gambarPaket(p.kategori) + '" alt="" loading="lazy"><span class="tumpuk" style="gap:3px;min-width:0">' + UI2.lencana(p.kategori) + '<b class="kecil">' + e(p.nama) + '</b><span class="kecil redup">' + p.jumlah_sesi + ' sesi' + (p.maks_peserta > 1 ? ' · maks ' + p.maks_peserta + ' peserta' : '') + '</span>' + (hp ? '<b class="kecil teks-merek">' + F.rp(hp.harga) + '</b>' : '') + '</span></label>'; }).join('') + '</div><span class="galat"></span></div>' +
        '<div class="fld" id="fld-peserta"><label>Peserta</label><div id="daftar-peserta" class="baris bungkus"></div><select class="inp mt8" id="tambah-peserta" hidden><option value="">+ Tambah peserta lain (Couple/Kelas)</option>' + sl.rows.filter(function (s) { return !peserta.some(function (p) { return p.siswa_id === s.siswa_id; }); }).map(function (s) { return '<option value="' + e(s.siswa_id) + '">' + e(s.nama) + ' · ' + e(s.kode_akses) + '</option>'; }).join('') + '</select></div>' +
        UI2.fld({ k: 'coach_id', label: 'Pelatih', tipe: 'select', opsi: sl.pelatih.map(function (c) { return { v: c.coach_id, l: c.nama }; }), v: induk ? induk.coach_id : '', l: 'l3' }) +
        UI2.fld({ k: 'kolam_id', label: 'Kolam / area', tipe: 'select', wajib: true, opsi: sl.kolam.map(function (k) { return { v: k.kolam_id, l: k.nama }; }), v: induk ? induk.kolam_id : '', l: 'l3' }) +
        UI2.fld({ k: 'tgl_mulai', label: 'Mulai', tipe: 'date', v: UI2.hariIni(), l: 'l2' }) + UI2.fld({ k: 'jam', label: 'Keterangan jam', v: induk ? induk.jam : '', ph: 'mis. Sabtu 08:00', l: 'l4' }) +
        (induk ? '' : '<div class="fld"><label>Jadwal mingguan (opsional)</label><div class="baris"><select class="inp" name="hari"><option value="">Hari</option>' + HARI.map(function (x) { return '<option value="' + x.v + '">' + x.l + '</option>'; }).join('') + '</select><input class="inp" type="time" name="jam_mulai" value="08:00"><input class="inp" type="time" name="jam_selesai" value="09:00"></div></div>') +
        '<div class="fld"><label class="cek"><input type="checkbox" name="catat_kas" checked><span>Catat pemasukan kas otomatis sesuai harga resmi (pilih tidak bila pembayaran sudah dicatat manual)</span></label></div></form>',
        kaki: '<button type="button" class="btn" data-tutup>Nanti saja</button><button type="button" class="btn primer" data-ok>' + ik('cekBulat', 'k') + (induk ? 'Perpanjang paket' : 'Aktifkan paket') + '</button>' });
      var f = m.el.querySelector('form'), ps = peserta.slice();
      function gambarPeserta() {
        var p = paketList.filter(function (x) { return x.paket_id === (f.querySelector('[name=paket_id]:checked') || {}).value; })[0], maks = p ? (p.maks_peserta || 1) : 1;
        m.el.querySelector('#daftar-peserta').innerHTML = ps.map(function (x, i) { return '<span class="chip aktif">' + e(x.nama) + (i && !induk ? '<button type="button" data-hapus="' + i + '" style="background:none;border:0;color:#fff;cursor:pointer;padding:0 0 0 4px" aria-label="Hapus">×</button>' : '') + '</span>'; }).join('');
        m.el.querySelector('#tambah-peserta').hidden = !!induk || ps.length >= maks;
      }
      f.addEventListener('change', function (ev) {
        if (ev.target.name === 'paket_id') { MR.qsa('.pilih', f).forEach(function (x) { x.classList.toggle('aktif', !!x.querySelector('input:checked')); }); gambarPeserta(); }
        if (ev.target.id === 'tambah-peserta' && ev.target.value) { var o = ev.target.selectedOptions[0]; ps.push({ siswa_id: o.value, nama: o.textContent.split(' · ')[0] }); o.remove(); ev.target.value = ''; gambarPeserta(); }
      });
      m.on('click', '[data-hapus]', function (b) { ps.splice(Number(b.dataset.hapus), 1); gambarPeserta(); });
      if (induk) ps = (induk.peserta || peserta).map(function (x) { return { siswa_id: x.siswa_id, nama: x.nama }; });
      gambarPeserta();
      m.el.querySelector('[data-ok]').onclick = function () {
        var v = UI2.baca(f), paket = (f.querySelector('[name=paket_id]:checked') || {}).value;
        var muatan = { paket_id: paket, siswa_ids: ps.map(function (x) { return x.siswa_id; }), coach_id: v.coach_id, kolam_id: v.kolam_id, jam: v.jam, tgl_mulai: v.tgl_mulai, catat_kas: v.catat_kas, induk_enr_id: induk ? induk.enr_id : '' };
        if (v.hari) muatan.jadwal = { hari: Number(v.hari), jam_mulai: v.jam_mulai, jam_selesai: v.jam_selesai };
        MR.UI.kerja(this, function () { return API.T('paket.buat', muatan); }, { form: f }).then(function (r) { m.tutup(); MR.UI.toast('Paket ' + r.enr.paket + ' aktif' + (r.trx ? ' · ' + r.trx + ' transaksi kas tercatat' : '') + (r.sesi_bawaan ? ' · ' + r.sesi_bawaan + ' sesi dibawa' : '') + '.', 'ok'); MR.UI.tutupSemua(); R.muatUlang(); }).catch(function () { });
      };
    });
  }
  function ubahPaket(p) {
    API.Q('siswa.list').then(function (sl) {
      var m = MR.UI.modal({ judul: 'Ubah pelatih / kolam', sempit: true, sub: 'Pergantian pelatih juga memindahkan slot jadwal paket ini.', isi: '<form class="form">' +
        UI2.fld({ k: 'coach_id', label: 'Pelatih', tipe: 'select', opsi: sl.pelatih.map(function (c) { return { v: c.coach_id, l: c.nama }; }), v: p.coach_id }) +
        UI2.fld({ k: 'kolam_id', label: 'Kolam / area', tipe: 'select', opsi: sl.kolam.map(function (k) { return { v: k.kolam_id, l: k.nama }; }), v: p.kolam_id, kosong: false }) +
        UI2.fld({ k: 'jam', label: 'Keterangan jam', v: p.jam }) + '</form>', kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan</button>' });
      m.el.querySelector('[data-ok]').onclick = function () { var f = m.el.querySelector('form'), v = UI2.baca(f); v.enr_id = p.enr_id; MR.UI.kerja(this, function () { return API.T('paket.ubah', v); }, { form: f }).then(function () { m.tutup(); MR.UI.toast('Paket diperbarui.', 'ok'); MR.UI.tutupSemua(); R.muatUlang(); }).catch(function () { }); };
    });
  }

  /* ================= Generator pesan WhatsApp (wa.me manual) =================
     Pengingat jadwal H-1 & peringatan sisa sesi/HABIS + link perpanjangan resmi.
     Teks bisa disunting sebelum dikirim; dikirim lewat WhatsApp Admin sendiri. */
  W.pesanWA = function (siswaId, jenisAwal) {
    var m = MR.UI.modal({ judul: 'Pesan WhatsApp', sub: 'Menyusun pesan…', isi: UI2.muatSebaris('Mengambil jadwal & paket siswa…'), kaki: '<button type="button" class="btn" data-tutup>Tutup</button>' });
    API.Q('siswa.detail', { siswa_id: siswaId }).then(function (d) {
      if (m.tertutup) return;
      var sw = d.siswa, p = d.paket.filter(function (x) { return x.status !== 'Selesai'; })[0] || d.paket[0] || null, nx = (d.berikutnya || [])[0] || null, app = d.nama_app || App.publik.nama_app, link = '';
      var sapaan = 'Halo Bapak/Ibu ' + (sw.nama_ortu || '').split(' ')[0];
      var besok = Inti.util.geserTgl(UI2.hariIni(), 1);
      var jenis = jenisAwal || (p && (p.status === 'HABIS' || p.sisa <= 1) ? 'sisa' : 'h1');
      function teksH1() {
        if (!nx) return '';
        var kapan = nx.tanggal === besok ? 'besok' : nx.tanggal === UI2.hariIni() ? 'hari ini' : 'pada';
        return sapaan.trim() + ' 👋\nMengingatkan jadwal latihan renang *' + sw.nama + '* ' + kapan + ':\n' +
          '📅 ' + F.tglHari(nx.tanggal) + '\n⏰ ' + nx.jam_mulai + '–' + nx.jam_selesai + ' WIB\n📍 ' + nx.kolam + '\n👤 Coach ' + nx.pelatih + '\n\n' +
          'Mohon hadir 10 menit lebih awal ya. Bila berhalangan, mohon kabari kami sebelum jadwal. Terima kasih 🙏\n— ' + app;
      }
      function teksSisa() {
        if (!p) return '';
        var awal = p.status === 'HABIS' ? 'paket *' + p.paket + '* ' + sw.nama + ' sudah selesai (' + p.sesi_terpakai + '/' + p.sesi_total + ' sesi). Terima kasih atas semangat latihannya! 🏊'
          : 'sisa sesi paket *' + p.paket + '* ' + sw.nama + ' tinggal *' + p.sisa + ' sesi* (' + p.sesi_terpakai + '/' + p.sesi_total + ' terpakai).';
        return sapaan.trim() + ',\n' + awal.charAt(0).toUpperCase() + awal.slice(1) + '\n\n' +
          'Agar jadwal latihan tidak terputus, silakan perpanjang paket melalui link resmi berikut:\n' + (link || '[link perpanjangan]') + '\n\nAda pertanyaan? Cukup balas pesan ini ya. Terima kasih 🙏\n— ' + app;
      }
      function susun() {
        var t = jenis === 'h1' ? teksH1() : teksSisa(), area = m.el.querySelector('[name=pesan]');
        area.value = t; perbarui();
        m.el.querySelector('#wa-catatan').innerHTML = jenis === 'h1' ? (nx ? ik('kalender', 'k') + ' Sesi berikutnya: ' + e(F.tglHari(nx.tanggal)) + ' · ' + e(nx.jam_mulai) : '<span class="teks-bahaya">' + ik('info', 'k') + ' Belum ada jadwal dalam 14 hari ke depan.</span>')
          : (p ? UI2.sisaChip(p) + (d.bisa.link && p.enr_id ? (link ? ' <span class="status ok polos">' + ik('cekBulat', 'k') + 'Link berlaku 7 hari</span>' : ' <button type="button" class="btn kecil lembut" data-x="link">' + ik('tautan', 'k') + 'Sisipkan link perpanjangan</button>') : ' <span class="kecil redup">Link dibuat oleh Admin yang berizin.</span>') : '<span class="redup">Belum ada paket.</span>');
      }
      function perbarui() {
        var v = m.el.querySelector('[name=pesan]').value, a = m.el.querySelector('[data-kirim]');
        a.href = UI2.waLink(sw.kontak_ortu, v); a.classList.toggle('mati', !v.trim() || (jenis === 'sisa' && v.indexOf('[link perpanjangan]') >= 0));
      }
      m.el.querySelector('.ov-kepala h2').textContent = 'Pesan ke orang tua ' + sw.nama.split(' ')[0];
      var sub = m.el.querySelector('.ov-kepala p'); if (sub) sub.textContent = (sw.nama_ortu || 'Orang tua') + ' · ' + Inti.util.hp08(sw.kontak_ortu || '');
      m.isi.innerHTML = UI2.seg('wa-jenis', [{ v: 'h1', label: 'Pengingat jadwal H-1', ikon: 'kalender' }, { v: 'sisa', label: 'Sisa sesi / perpanjangan', ikon: 'segitiga' }], jenis, 'lebar') +
        '<div class="baris bungkus mt12" id="wa-catatan" style="gap:6px;min-height:32px"></div>' +
        '<div class="fld mt12"><label for="wa-pesan">Isi pesan <span class="kecil redup">(boleh disunting)</span></label><textarea class="inp" id="wa-pesan" name="pesan" rows="10" style="font-size:14px;line-height:1.5"></textarea></div>';
      m.kaki.innerHTML = '<button type="button" class="btn" data-x="salin">' + ik('salin', 'k') + 'Salin</button><a class="btn wa" data-kirim target="_blank" rel="noopener" href="#">' + ik('wa', 'k') + 'Buka WhatsApp</a>';
      UI2.hidupkanSeg(m.el); susun();
      m.el.addEventListener('seg', function (ev) { if (ev.detail.seg === 'wa-jenis') { jenis = ev.detail.v; susun(); } });
      m.el.querySelector('[name=pesan]').addEventListener('input', perbarui);
      m.el.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-x]');
        if (ev.target.closest('[data-kirim].mati')) { ev.preventDefault(); MR.UI.toast(jenis === 'sisa' && !link ? 'Sisipkan link perpanjangan dulu, atau hapus baris [link perpanjangan].' : 'Pesan masih kosong.', 'warn'); return; }
        if (!b) return;
        if (b.dataset.x === 'salin') UI2.salin(m.el.querySelector('[name=pesan]').value, 'Pesan disalin.');
        if (b.dataset.x === 'link') MR.UI.kerja(b, function () { return API.T('daftar.linkBuat', { tipe: 'perpanjangan', enr_id: p.enr_id, hari: 7 }); }).then(function (r) { link = W.urlDaftar(r.token); susun(); MR.UI.toast('Link perpanjangan dibuat (berlaku 7 hari).', 'ok'); }).catch(function () { });
      });
    }).catch(function (er) { m.tutup(); MR.UI.galat(er); });
  };
})(window, document);
