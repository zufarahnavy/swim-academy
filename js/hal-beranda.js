/* =====================================================================
 * BERANDA (Owner/Admin) & ANALITIK
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router, OA = ['owner', 'admin'];
  var WARNA = { masuk: '#0369A1', keluar: '#C2410C', baru: '#0369A1', perpanjangan: '#C2410C', trial: '#0D9488', ini: '#0369A1', lalu: '#0D9488' };
  W.WARNA_GRAFIK = WARNA;

  /* Kartu sesi ringkas — dipakai Beranda, Absensi, Portal Pelatih */
  W.kartuSesi = function (x, o) {
    o = o || {}; var r = x.enr || {}, a = x.absen, j = UI2.jenis(r.kategori);
    var nama = (r.peserta || []).map(function (p) { return p.nama; }).join(' & ') || '-';
    var stAbsen = a ? '<span class="status ' + (a.dihitung ? 'ok' : 'info') + '">' + ik('cek', 'k') + (a.dihitung ? 'Tercatat' : 'Izin') + '</span>' : x.batas && !x.batas.boleh ? '<span class="status habis">' + ik('gembok', 'k') + 'Terkunci</span>' : '<span class="status warn">Belum diabsen</span>';
    return '<div class="sesi ' + j + (a ? ' selesai' : '') + (o.klik ? ' klik' : '') + '"' + (o.klik ? ' data-a="' + o.klik + '" data-enr="' + e(x.enr_id) + '" tabindex="0" role="button"' : '') + (o.i != null ? ' style="--i:' + o.i + '"' : '') + '>' +
      '<div class="baris ujung"><span class="jam">' + e(x.jam_mulai || '—') + (x.jam_selesai ? '<span class="redup" style="font-weight:500;font-size:13px"> – ' + e(x.jam_selesai) + '</span>' : '') + '</span>' + stAbsen + '</div>' +
      '<div class="baris bungkus" style="gap:6px">' + UI2.lencana(r.kategori) + '<span class="nama satu-baris">' + e(nama) + '</span></div>' +
      '<div class="meta baris bungkus" style="gap:10px"><span class="baris" style="gap:4px">' + ik('peluit', 'k') + e(x.pelatih || r.pelatih) + '</span><span class="baris" style="gap:4px">' + ik(r.lokasi === 'Home Visit' ? 'rumah' : 'pin', 'k') + e(r.lokasi === 'Home Visit' ? 'Home Visit · ' + (r.kolam_singkat || '') : r.kolam) + '</span><span class="baris" style="gap:4px">' + ik('absen', 'k') + (r.sesi_terpakai || 0) + '/' + (r.sesi_total || 0) + '</span></div>' +
      (a && o.detail !== false ? '<div class="kecil redup">' + a.peserta.map(function (p) { return e(p.nama.split(' ')[0]) + ': <b>' + e(p.status) + '</b>'; }).join(' · ') + ' · ' + e(F.jam(a.waktu_server)) + ' WIB' + (a.via_buka_kunci ? ' · via buka kunci' : '') + '</div>' : '') +
      '</div>';
  };

  /* ---------------- Beranda ---------------- */
  R.daftar('beranda', {
    judul: 'Beranda', kerangka: 'dashboard', peran: OA,
    render: function (ctx) {
      return API.Q('dash.admin').then(function (d) {
        if (ctx.basi()) return;
        App.perbaruiLencana();
        var k = d.kpi, b = d.batas, kas = d.kas, sisaBatas = b.batas_aktif ? b.batas_ms - API.jamServer() : null;
        var info = k.sesi_total ? k.sesi_total + ' sesi latihan hari ini · ' + k.sesi_belum + ' belum diabsen' : 'Tidak ada sesi terjadwal hari ini';
        ctx.el.innerHTML =
          '<div class="banner masuk">' + W.bannerOmbak() +
            '<span class="label-atas">' + ik('kalender', 'k') + e(F.tglHari(d.hariIni)) + '</span>' +
            '<h1>' + F.salam() + ', ' + e(d.nama.split(' ')[0]) + '.</h1>' +
            '<p>' + info + (b.batas_aktif ? ' · batas absensi ' + e(b.jam_batas) + ' WIB (jam server)' : ' · batas absensi nonaktif') + '.</p>' +
            '<div class="banner-aksi">' +
              (d.bisa.verifikasi ? '<a class="btn putih" href="#/pendaftaran">' + ik('tambahOrang') + 'Verifikasi pendaftaran' + (d.pendaftaran_baru ? ' <span class="sb-lencana" style="margin-left:4px">' + d.pendaftaran_baru + '</span>' : '') + '</a>' : '') +
              (d.bisa.link ? '<a class="btn" href="#/pendaftaran?buat=1">' + ik('tautan') + 'Buat link pendaftaran</a>' : '') +
              (d.bisa.kas ? '<a class="btn" href="#/kas?input=1">' + ik('plus') + 'Input kas</a>' : '') +
            '</div></div>' +
          '<div class="grid g4 kpi-baris stagger mt16">' +
            UI2.kpi({ i: 0, label: 'Siswa aktif', nilai: F.ribuan(k.siswa_aktif), ikon: 'orang2', sub: '<span class="naik">+' + k.baru_bulan_ini + '</span> pendaftaran baru bulan ini', klik: 'ke', }).replace('data-a="ke"', 'data-a="ke" data-h="#/siswa?status=Aktif"') +
            UI2.kpi({ i: 1, label: 'Perlu perpanjangan', nilai: k.perlu, ikon: 'segitiga', warna: 'merah', sub: '<span class="status habis polos">' + k.habis + ' HABIS</span><span class="status warn polos">' + k.sisa1 + ' sisa 1</span>' }).replace('class="kartu kpi"', 'class="kartu kpi klik" data-a="ke" data-h="#/siswa?status=HABIS" tabindex="0" role="button"') +
            UI2.kpi({ i: 2, label: 'Absensi hari ini', nilai: k.sesi_sudah, satuan: '/ ' + k.sesi_total + ' sesi', ikon: 'absen', warna: 'ungu', sub: k.sesi_belum ? '<span class="teks-warn tebal">' + k.sesi_belum + ' belum diabsen</span>' + (sisaBatas > 0 ? ' · ' + Math.floor(sisaBatas / 3600e3) + ' j ' + Math.floor(sisaBatas % 3600e3 / 60000) + ' m lagi' : '') : '<span class="naik">Semua tercatat</span>' }).replace('class="kartu kpi"', 'class="kartu kpi klik" data-a="ke" data-h="#/absensi" tabindex="0" role="button"') +
            (kas ? UI2.kpi({ i: 3, label: 'Kas masuk ' + Inti.NAMA_BULAN[Number(d.hariIni.slice(5, 7)) - 1], nilai: F.rpR(kas.masuk), rp: true, ikon: 'dompet', warna: 'hijau', sub: 'Saldo bulan ini <b class="' + (kas.saldo >= 0 ? 'naik' : 'turun') + '">' + F.rpR(kas.saldo) + '</b>', spark: Grafik.spark(kas.tren_masuk, '#15803D') }).replace('class="kartu kpi rp"', 'class="kartu kpi rp klik" data-a="ke" data-h="#/kas" tabindex="0" role="button"')
              : UI2.kpi({ i: 3, label: 'Pendaftaran baru', nilai: d.pendaftaran_baru, ikon: 'tambahOrang', warna: 'oranye', sub: 'Menunggu verifikasi' })) +
          '</div>' +
          '<div class="grid g-2-1 mt16">' +
            '<section class="kartu masuk-2"><div class="kartu-kepala"><span class="ubin ungu">' + ik('absen') + '</span><div class="tumpuk tumbuh"><h2>Sesi hari ini</h2><p>' + e(info) + '</p></div><a class="btn kecil hantu" href="#/absensi">Monitoring ' + ik('kanan', 'k') + '</a></div>' +
              '<div class="kartu-isi">' + (d.sesi.length ? '<div class="daftar-sesi stagger">' + d.sesi.slice(0, 8).map(function (x, i) { return W.kartuSesi(x, { klik: 'sesi', i: i }); }).join('') + '</div>' + (d.sesi.length > 8 ? '<a class="tautan-kaki" href="#/absensi">Lihat ' + (d.sesi.length - 8) + ' sesi lainnya</a>' : '') : MR.UI.kosong('Tidak ada sesi hari ini', 'Jadwal terisi akan muncul di sini.')) + '</div></section>' +
            '<section class="kartu masuk-3"><div class="kartu-kepala"><span class="ubin merah">' + ik('segitiga') + '</span><div class="tumpuk tumbuh"><h2>Perlu tindakan</h2><p>Paket HABIS & tersisa 1 sesi</p></div></div>' +
              '<div class="kartu-isi"><div class="daftar-ikon">' + (d.perlu.length ? d.perlu.map(function (r) {
                var nama = r.peserta.map(function (p) { return p.nama; }).join(' & ');
                return '<div class="item-ikon"><span class="avatar ' + (r.status === 'HABIS' ? '' : 'lembut') + '" style="' + (r.status === 'HABIS' ? 'background:#B91C1C' : '') + '">' + e(F.inisial(nama)) + '</span><div class="tumbuh" style="min-width:0"><b class="kecil satu-baris" style="display:block">' + e(nama) + '</b><div class="kecil redup satu-baris">' + e(r.paket) + ' · ' + r.sesi_terpakai + '/' + r.sesi_total + (r.status === 'HABIS' && r.hari_habis ? ' · ' + r.hari_habis + ' hari lalu' : '') + '</div></div>' +
                  (d.bisa.link ? '<button type="button" class="btn kecil ' + (r.status === 'HABIS' ? 'wa' : 'lembut') + '" data-a="perpanjang" data-enr="' + e(r.enr_id) + '">' + ik('wa', 'k') + '<span class="sembunyi-hp">Link</span></button>' : UI2.sisaChip(r)) + '</div>';
              }).join('') : MR.UI.kosong('Tidak ada yang mendesak', 'Semua paket masih aman.')) + '</div></div></section>' +
          '</div>' +
          '<div class="grid g-2-1 mt16">' +
            '<section class="kartu masuk-3"><div class="kartu-kepala"><span class="ubin">' + ik('tambahOrang') + '</span><div class="tumpuk tumbuh"><h2>Pendaftaran masuk</h2><p>' + d.pendaftaran_baru + ' menunggu verifikasi</p></div><a class="btn kecil hantu" href="#/pendaftaran">Semua ' + ik('kanan', 'k') + '</a></div>' +
              '<div class="kartu-isi">' + (d.pendaftaran.length ? '<div class="daftar-ikon">' + d.pendaftaran.map(function (p) {
                return '<a class="item-ikon item-klik" style="color:inherit" href="#/pendaftaran?id=' + e(p.id) + '">' + UI2.avatar(p.nama) + '<div class="tumbuh" style="min-width:0"><div class="baris bungkus" style="gap:6px"><b class="kecil">' + e(p.nama) + '</b>' + (p.tipe === 'perpanjangan' ? '<span class="status ungu polos">Perpanjangan</span>' : '<span class="status info polos">Baru</span>') + '</div><div class="kecil redup satu-baris">' + e(p.paket) + ' · ' + e(F.relatif(p.dibuat_at)) + '</div></div>' + (p.bukti ? '<span class="status ok polos">' + ik('struk', 'k') + 'Bukti</span>' : '<span class="status warn polos">Tanpa bukti</span>') + '</a>';
              }).join('') + '</div>' : MR.UI.kosong('Belum ada pendaftaran baru', 'Bagikan link resmi ke calon siswa.')) + '</div></section>' +
            '<section class="kartu masuk-4"><div class="kartu-kepala"><span class="ubin abu">' + ik('riwayat') + '</span><div class="tumpuk tumbuh"><h2>Aktivitas terbaru</h2><p>Absensi, pendaftaran, kas</p></div></div>' +
              '<div class="kartu-isi"><ul class="linimasa">' + d.aktivitas.map(function (a) {
                var m = { absensi: ['ok', 'absen'], koreksi: ['warn', 'pensil'], daftar: ['', 'tambahOrang'], masuk: ['ok', 'naik'], keluar: ['oranye', 'turun'], kunci: ['ungu', 'buka'] }[a.jenis] || ['', 'info'];
                return '<li><span class="titik ' + m[0] + '">' + ik(m[1]) + '</span><div class="tumbuh" style="min-width:0"><div class="baris ujung"><b>' + e(a.judul) + '</b><time>' + e(F.relatif(a.waktu)) + '</time></div><p class="satu-baris">' + e(a.teks) + '</p></div></li>';
              }).join('') + '</ul></div></section>' +
          '</div>';
        ctx.aksi({
          ke: function (t) { location.hash = t.dataset.h; },
          sesi: function (t) { var x = d.sesi.filter(function (s) { return s.enr_id === t.dataset.enr; })[0]; if (x) W.detailSesi(x, d.bisa); },
          perpanjang: function (t) { W.buatLinkPerpanjangan(t.dataset.enr, t); }
        });
        ctx.on('keydown', '[role=button]', function (t, ev) { if (ev.key === 'Enter') t.click(); });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });

  /* Detail sesi (laci) */
  W.detailSesi = function (x, bisa) {
    var r = x.enr, a = x.absen;
    MR.UI.laci({ judul: (r.peserta || []).map(function (p) { return p.nama; }).join(' & '), sub: e(r.paket) + ' · ' + e(x.jam_mulai || '') + (x.jam_selesai ? '–' + e(x.jam_selesai) : ''), isi:
      '<div class="baris bungkus">' + UI2.lencana(r.kategori) + UI2.sisaChip(r) + '</div><div class="mt16">' + UI2.progres(r) + '</div>' +
      '<div class="grid g2 mt16">' + [['Pelatih', x.pelatih], ['Lokasi', r.lokasi === 'Home Visit' ? 'Home Visit (' + r.kolam + ')' : r.kolam], ['Mulai paket', F.tgl(r.tgl_mulai)], ['Sisa sesi', r.sisa + ' sesi']].map(function (y) { return '<div><div class="kecil redup">' + y[0] + '</div><b>' + e(y[1]) + '</b></div>'; }).join('') + '</div>' +
      '<hr class="garis"><b>Absensi hari ini</b>' + (a ? '<div class="daftar-ikon mt8">' + a.peserta.map(function (p) { return '<div class="item-ikon">' + UI2.avatar(p.nama, 'kecil') + '<b class="kecil tumbuh">' + e(p.nama) + '</b>' + UI2.status(p.status) + '</div>'; }).join('') + '</div><p class="kecil redup mt8">Pertemuan ke-' + a.pertemuan_ke + ' · disimpan ' + e(F.waktu(a.waktu_server)) + ' WIB oleh ' + e(a.oleh) + (a.via_buka_kunci ? ' (via buka kunci)' : '') + '</p>'
        : '<div class="peringatan ' + (x.batas.boleh ? 'warn' : 'bahaya') + ' mt8">' + ik(x.batas.boleh ? 'jam' : 'gembok') + '<div><b>' + (x.batas.boleh ? 'Belum diabsen' : 'Terkunci') + '</b>' + e(x.batas.boleh ? 'Pelatih dapat mengisi sampai ' + x.batas.jam_batas + ' WIB.' : x.batas.alasan) + '</div></div>'),
      kaki: '<a class="btn" href="#/siswa?id=' + e((r.peserta[0] || {}).siswa_id) + '">' + ik('orang', 'k') + 'Profil siswa</a><a class="btn primer" href="#/absensi?tanggal=' + e(x.batas.tanggal) + '">' + ik('absen', 'k') + 'Buka di Absensi</a>' }).on('click', 'a', function (t, ev) { MR.UI.tutupSemua(); });
  };

  /* Link perpanjangan cepat → WhatsApp manual (wa.me) */
  W.buatLinkPerpanjangan = function (enrId, tombol) {
    return MR.UI.kerja(tombol, function () { return API.T('daftar.linkBuat', { tipe: 'perpanjangan', enr_id: enrId, hari: 7 }); }).then(function (r) { W.tampilLink(r); }).catch(function () { });
  };
  W.urlDaftar = function (token) { return location.href.split('#')[0] + '#/daftar/' + token; };
  W.urlPortal = function () { return location.href.split('#')[0].split('?')[0]; };
  W.tampilLink = function (r) {
    var url = W.urlDaftar(r.token), u = r.untuk;
    var teks = u ? 'Halo ' + (u.nama_ortu || 'Bapak/Ibu') + ', paket *' + u.paket + '* ' + u.nama + ' sudah terpakai ' + u.terpakai + '/' + u.total + ' sesi. Silakan perpanjang melalui link resmi ' + r.nama_app + ' berikut (berlaku sampai ' + F.waktu(r.kedaluwarsa) + '):\n' + url
      : 'Halo, berikut link pendaftaran resmi ' + r.nama_app + ' (berlaku sampai ' + F.waktu(r.kedaluwarsa) + '):\n' + url;
    var m = MR.UI.modal({ judul: r.tipe === 'perpanjangan' ? 'Link perpanjangan siap' : 'Link pendaftaran siap', sub: r.sekali_pakai === 'Y' ? 'Sekali pakai · berlaku sampai ' + e(F.waktu(r.kedaluwarsa)) + ' WIB' : 'Bisa dipakai berkali-kali sampai ' + e(F.waktu(r.kedaluwarsa)) + ' WIB', isi:
      '<div class="kotak-kode" style="font-size:13px;letter-spacing:0">' + e(url) + '<button type="button" class="btn kecil lembut" data-x="salin">' + ik('salin', 'k') + 'Salin</button></div>' +
      '<div class="fld mt16"><label>Pesan WhatsApp</label><textarea class="inp" rows="5" data-x="teks">' + e(teks) + '</textarea><span class="bantu">Dikirim manual lewat WhatsApp Anda (wa.me). Pesan bisa diubah sebelum dikirim.</span></div>',
      kaki: '<a class="btn" href="' + e(url) + '" target="_blank" rel="noopener">' + ik('mata', 'k') + 'Buka formulir</a><button type="button" class="btn wa" data-x="wa">' + ik('wa', 'k') + 'Kirim via WhatsApp</button>' });
    m.on('click', '[data-x=salin]', function () { UI2.salin(url, 'Link disalin.'); });
    m.on('click', '[data-x=wa]', function () { var t = m.el.querySelector('[data-x=teks]').value; W.open(u && u.kontak ? UI2.waLink(u.kontak, t) : 'https://wa.me/?text=' + encodeURIComponent(t), '_blank', 'noopener'); });
  };

  /* ---------------- Analitik ---------------- */
  R.daftar('analitik', {
    judul: 'Analitik', kerangka: 'dashboard', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.n = st.n || 6;
      return API.Q('analitik.data', { bulan_ke: st.n }).then(function (d) {
        if (ctx.basi()) return;
        var k = d.kpi, pb = d.perBulan, label = pb.map(function (x) { return x.label; });
        var persen = function (v) { return v == null ? '—' : String(v).replace('.', ',') + '%'; };
        ctx.el.innerHTML =
          '<div class="kepala-hal"><div class="judul"><h1>Analitik Penjualan & Pertumbuhan</h1><p>Pendapatan, siswa, perpanjangan, dan kehadiran — dihitung dari transaksi kas aktif dan absensi.</p></div><div class="aksi">' +
            UI2.seg('periode', [{ v: 6, label: '6 bulan' }, { v: 12, label: '12 bulan' }], st.n) +
            (Sesi.punya('laporan.ekspor') ? '<button type="button" class="btn" data-a="ekspor">' + ik('unduh') + 'Excel</button>' : '') + '</div></div>' +
          '<div class="grid g4 kpi-baris stagger">' +
            UI2.kpi({ i: 0, label: 'Pendapatan ' + st.n + ' bulan', nilai: F.rpR(k.pendapatan_periode), rp: true, ikon: 'dompet', warna: 'hijau', sub: 'Rata-rata ' + F.rpR(k.rata_bulanan) + '/bulan', spark: Grafik.spark(pb.map(function (x) { return x.masuk; }), '#15803D') }) +
            UI2.kpi({ i: 1, label: 'Pendapatan bulan ini', nilai: F.rpR(k.pendapatan_bulan_ini), rp: true, ikon: 'naik', sub: k.tumbuh == null ? 'Belum ada pembanding' : '<span class="' + (k.tumbuh >= 0 ? 'naik' : 'turun') + '">' + (k.tumbuh >= 0 ? '▲ ' : '▼ ') + persen(Math.abs(k.tumbuh)) + '</span> dibanding bulan lalu' }) +
            UI2.kpi({ i: 2, label: 'Laba bersih periode', nilai: F.rpR(k.laba_periode), rp: true, ikon: 'koin', warna: k.laba_periode >= 0 ? 'navy' : 'merah', sub: 'Pemasukan − pengeluaran' }) +
            UI2.kpi({ i: 3, label: 'Pendapatan per siswa (ARPU)', nilai: F.rpR(k.arpu), rp: true, ikon: 'orang', warna: 'ungu', sub: 'Bulan ini, per siswa hadir' }) +
          '</div>' +
          '<div class="grid g4 kpi-baris stagger mt16">' +
            UI2.kpi({ i: 4, label: 'Siswa aktif', nilai: F.ribuan(k.siswa_aktif), ikon: 'orang2', sub: k.habis_lama ? '<span class="turun">' + k.habis_lama + '</span> paket HABIS > 3 hari' : 'Tidak ada paket tertunda' }) +
            UI2.kpi({ i: 5, label: 'Tingkat perpanjangan', nilai: persen(k.tingkat_perpanjangan), ikon: 'segar', warna: 'oranye', sub: k.diperpanjang + ' dari ' + k.paket_berakhir + ' paket berakhir' }) +
            UI2.kpi({ i: 6, label: 'Konversi trial', nilai: persen(k.konversi_trial), ikon: 'bintang', warna: 'hijau', sub: k.trial_lanjut + ' dari ' + k.trial + ' siswa trial lanjut paket' }) +
            UI2.kpi({ i: 7, label: 'Kehadiran rata-rata', nilai: persen(k.kehadiran), ikon: 'absen', warna: 'ungu', sub: 'Status Hadir dari semua peserta' }) +
          '</div>' +
          '<div class="grid g-2-1 mt16">' +
            '<section class="kartu masuk-2"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Pemasukan vs pengeluaran</h2><p>Per bulan, transaksi aktif</p></div></div><div class="kartu-isi"><div id="g-kas"></div></div></section>' +
            '<section class="kartu masuk-3"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Wawasan otomatis</h2><p>Disusun dari data periode ini</p></div></div><div class="kartu-isi"><div class="wawasan">' + (d.wawasan.length ? d.wawasan.map(function (w) { var m = { naik: ['hijau', 'naik'], turun: ['merah', 'turun'], info: ['', 'info'], peringatan: ['oranye', 'segitiga'], waspada: ['oranye', 'segitiga'] }[w.jenis] || ['', 'kilau']; return '<div><span class="ubin ' + m[0] + '">' + ik(m[1], 'k') + '</span><span>' + e(w.teks) + '</span></div>'; }).join('') : '<p class="redup kecil">Belum cukup data untuk wawasan.</p>') + '</div></div></section>' +
          '</div>' +
          '<div class="grid g2 mt16">' +
            '<section class="kartu masuk-3"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Laba bersih</h2><p>Pemasukan dikurangi pengeluaran</p></div></div><div class="kartu-isi"><div id="g-laba"></div></div></section>' +
            '<section class="kartu masuk-3"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Paket baru, perpanjangan & trial</h2><p>Jumlah paket dimulai per bulan</p></div></div><div class="kartu-isi"><div id="g-siswa"></div></div></section>' +
          '</div>' +
          '<div class="grid g3 bawah3 mt16">' +
            '<section class="kartu masuk-4"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Pendapatan per kategori</h2><p>Privat, Couple, Kelas, Trial, Home Visit</p></div></div><div class="kartu-isi">' + Grafik.batangH(d.perKategori.map(function (x) { return { nama: x.nama, nilai: x.nilai, persen: x.persen, warna: Grafik.warnaJenis(x.nama), lencana: /^(HV )?(Privat|Couple|Kelas|Trial)$/.test(x.nama) ? '<i style="width:8px;height:8px;border-radius:2px;flex:none;background:' + Grafik.warnaJenis(x.nama) + '"></i>' : '' }; }), { fmt: F.rpR }) + '</div></section>' +
            '<section class="kartu masuk-4"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Pendapatan per kolam</h2><p>Lokasi acuan paket</p></div></div><div class="kartu-isi">' + Grafik.batangH(d.perKolam.map(function (x) { return { nama: x.nama, nilai: x.nilai, persen: x.persen, warna: 'var(--merek)' }; }), { fmt: F.rpR }) + '</div></section>' +
            '<section class="kartu masuk-4"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Paket terlaris</h2><p>Berdasarkan pendapatan</p></div></div><div class="kartu-isi">' + Grafik.batangH(d.perPaket.slice(0, 7).map(function (x) { return { nama: x.nama + ' · ' + x.jumlah + '×', nilai: x.nilai, warna: Grafik.warnaJenis(x.kategori) }; }), { fmt: F.rpR }) + '</div></section>' +
          '</div>' +
          '<div class="grid g-2-1 mt16">' +
            '<section class="kartu masuk-4"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Sesi per pelatih</h2><p>Sesi dihitung bulan ini vs bulan lalu</p></div></div><div class="kartu-isi"><div id="g-pelatih"></div></div></section>' +
            '<section class="kartu masuk-4"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Kehadiran</h2><p>Persentase status Hadir per bulan</p></div></div><div class="kartu-isi"><div id="g-hadir"></div></div></section>' +
          '</div>' +
          '<section class="kartu mt16 masuk-4"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Tabel data per bulan</h2><p>Angka lengkap di balik grafik</p></div></div>' +
            UI2.tabel({ kolom: [{ label: 'Bulan', f: function (x) { return '<b>' + e(F.bulan(x.bulan)) + '</b>'; } }, { label: 'Pemasukan', kanan: true, f: function (x) { return '<span class="nominal masuk">' + F.rp(x.masuk) + '</span>'; } }, { label: 'Pengeluaran', kanan: true, f: function (x) { return '<span class="nominal keluar">' + F.rp(x.keluar) + '</span>'; } }, { label: 'Laba', kanan: true, f: function (x) { return '<span class="nominal">' + F.rp(x.laba) + '</span>'; } }, { label: 'Baru', kanan: true, k: 'baru' }, { label: 'Perpanjangan', kanan: true, k: 'perpanjangan' }, { label: 'Trial', kanan: true, k: 'trial' }, { label: 'Sesi', kanan: true, k: 'sesi' }, { label: 'Siswa hadir', kanan: true, k: 'siswa_aktif' }, { label: 'Kehadiran', kanan: true, f: function (x) { return persen(x.kehadiran); } }], baris: pb.slice().reverse() }) + '</section>';
        function gambar() {
          Grafik.kolom(ctx.el.querySelector('#g-kas'), { label: label, seri: [{ nama: 'Pemasukan', warna: WARNA.masuk, nilai: pb.map(function (x) { return x.masuk; }) }, { nama: 'Pengeluaran', warna: WARNA.keluar, nilai: pb.map(function (x) { return x.keluar; }) }], fmt: F.rp, judul: 'Pemasukan dan pengeluaran per bulan' });
          Grafik.garis(ctx.el.querySelector('#g-laba'), { label: label, seri: [{ nama: 'Laba bersih', warna: WARNA.masuk, nilai: pb.map(function (x) { return x.laba; }) }], fmt: F.rp, dariNol: false, judul: 'Laba bersih per bulan' });
          Grafik.kolom(ctx.el.querySelector('#g-siswa'), { label: label, seri: [{ nama: 'Baru', warna: WARNA.baru, nilai: pb.map(function (x) { return x.baru; }) }, { nama: 'Perpanjangan', warna: WARNA.perpanjangan, nilai: pb.map(function (x) { return x.perpanjangan; }) }, { nama: 'Trial', warna: WARNA.trial, nilai: pb.map(function (x) { return x.trial; }) }], judul: 'Paket dimulai per bulan' });
          Grafik.kolom(ctx.el.querySelector('#g-pelatih'), { label: d.perPelatih.map(function (x) { return x.nama.split(' ')[0]; }), seri: [{ nama: 'Bulan ini', warna: WARNA.ini, nilai: d.perPelatih.map(function (x) { return x.ini; }) }, { nama: 'Bulan lalu', warna: WARNA.lalu, nilai: d.perPelatih.map(function (x) { return x.lalu; }) }], judul: 'Sesi per pelatih' });
          Grafik.garis(ctx.el.querySelector('#g-hadir'), { label: label, seri: [{ nama: 'Kehadiran', warna: WARNA.trial, nilai: pb.map(function (x) { return x.kehadiran; }) }], persen: true, fmt: function (v) { return persen(v); }, judul: 'Persentase kehadiran' });
        }
        ctx.grafik(gambar);
        ctx.on('seg', '.seg', function (s, ev) { st.n = Number(ev.detail.v); setTimeout(function () { R.tampilkan({ diam: true, bingkai: true }); }, 180); });
        ctx.aksi({ ekspor: function () {
          Xlsx.unduh('Analitik_' + UI2.bulanIni(), [
            { nama: 'Per Bulan', kolom: ['Bulan', 'Pemasukan', 'Pengeluaran', 'Laba', 'Paket baru', 'Perpanjangan', 'Trial', 'Sesi dihitung', 'Siswa hadir', 'Kehadiran %'], baris: pb.map(function (x) { return [F.bulan(x.bulan), x.masuk, x.keluar, x.laba, x.baru, x.perpanjangan, x.trial, x.sesi, x.siswa_aktif, x.kehadiran]; }) },
            { nama: 'Per Kategori', kolom: ['Kategori', 'Pendapatan', 'Persen'], baris: d.perKategori.map(function (x) { return [x.nama, x.nilai, x.persen]; }) },
            { nama: 'Per Kolam', kolom: ['Kolam', 'Pendapatan', 'Persen'], baris: d.perKolam.map(function (x) { return [x.nama, x.nilai, x.persen]; }) },
            { nama: 'Per Paket', kolom: ['Paket', 'Kategori', 'Jumlah', 'Pendapatan'], baris: d.perPaket.map(function (x) { return [x.nama, x.kategori, x.jumlah, x.nilai]; }) }
          ]);
        } });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });
})(window, document);
