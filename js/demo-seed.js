/* =====================================================================
 * DATA DEMO — dibangkitkan relatif terhadap hari ini (WIB) agar dashboard
 * selalu hidup: sesi hari ini, paket HABIS, sisa 1 sesi, riwayat 5 bulan,
 * kas, honor, pendaftaran masuk, dokumen. Semua nama fiktif.
 * Akun demo: owner / admin / budi / meilin / hendra / doni / rina / sari
 * (sandi: demo1234). Orang tua: kode SA-8829 · PIN 123456.
 * ===================================================================== */
(function (root) {
  'use strict';
  var TEKS_TEMPLATE = {
    KWITANSI: { engine: 'docs', teks: '{{INSTITUSI_NAMA}} {{INSTITUSI_ALAMAT}} KWITANSI {{NOMOR}} {{TANGGAL}} Telah terima dari {{NAMA_PEMBAYAR}} uang sejumlah {{NOMINAL|rupiah}} ({{NOMINAL|terbilang:rupiah}}) untuk {{PERUNTUKAN}} Peserta {{PESERTA}} Paket {{PAKET}} ({{KATEGORI}}) Metode {{METODE}} Tanggal bayar {{TANGGAL_BAYAR|tanggal}} {{NAMA_PEJABAT_1}} {{JABATAN_1}} {{TTD_1}} {{QR}} {{KODE_VERIFIKASI}}' },
    SLIP_HONOR: { engine: 'docs', teks: '{{INSTITUSI_NAMA}} SLIP HONOR {{NOMOR}} {{NAMA_PELATIH}} {{LISENSI}} Periode {{PERIODE}} {{#RINCIAN}} {{RINCIAN.KATEGORI}} {{RINCIAN.SESI}} {{RINCIAN.TARIF|rupiah}} {{RINCIAN.SUBTOTAL|rupiah}} {{/RINCIAN}} Total sesi {{TOTAL_SESI}} Total {{TOTAL|rupiah}} {{NAMA_PEJABAT_1}} {{TTD_1}} {{QR}}' },
    LAPORAN_KAS: { engine: 'sheets', teks: '{{INSTITUSI_NAMA}} LAPORAN KAS {{PERIODE}} {{NOMOR}} Saldo awal {{SALDO_AWAL|rupiah}} {{#TRX}} {{TRX.TANGGAL|tanggal}} {{TRX.KATEGORI}} {{TRX.URAIAN}} {{TRX.MASUK}} {{TRX.KELUAR}} {{/TRX}} Masuk {{MASUK|rupiah}} Keluar {{KELUAR|rupiah}} Saldo akhir {{SALDO_AKHIR|rupiah}} {{NAMA_PEJABAT_1}} {{QR}}' },
    SERTIFIKAT: { engine: 'slides', teks: 'SERTIFIKAT {{NOMOR}} diberikan kepada {{NAMA_SISWA|kapital}} {{PREDIKAT}} {{PAKET}} {{KATEGORI}} {{JUMLAH_HADIR}} sesi bersama {{PELATIH}} di {{KOLAM}} {{PERIODE}} {{TANGGAL}} {{NAMA_PEJABAT_1}} {{JABATAN_1}} {{QR}}' }
  };
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function seed(Inti, env) {
    var U = Inti.util, now = env.sekarang(), hariIni = U.tglWIB(now), H0 = U.hariKe(hariIni), rng = mulberry32(20261126), db = env.db;
    var b0 = new Date(now + 7 * 3600e3), menitKini = b0.getUTCHours() * 60 + b0.getUTCMinutes();
    function T(t, rows) { db.tambah(t, rows); return rows; }
    var seq = 0; function id(p) { seq++; return p + '-' + String(1000 + seq); }
    function waktu(tgl, jam) { return tgl + ' ' + (jam || '09:00') + ':00'; }
    function hariRel(k) { return ((H0 - 1 + k) % 7 + 7) % 7 + 1; }
    function tambahMenit(j, m) { var x = U.menitDari(j) + m; return ('0' + Math.floor(x / 60)).slice(-2) + ':' + ('0' + x % 60).slice(-2); }

    Inti.setupAwal(env, {
      owner: { nama: 'Hendro Wijaya', username: 'owner', sandi: 'demo1234', email: 'owner@swimacademy.id' },
      identitas: { nama_app: 'Swim Academy', tagline: 'Sistem Terpadu Pelatihan & Absensi Renang', kontak_admin: '081234567890', email_owner: 'owner@swimacademy.id', alamat: 'Jl. Tirta Raya No. 12, Jakarta Selatan', logo: '', favicon: '' },
      template: Object.keys(TEKS_TEMPLATE).reduce(function (o, k) { o[k] = { file_id: 'demo-' + k.toLowerCase(), engine: TEKS_TEMPLATE[k].engine, teks: TEKS_TEMPLATE[k].teks }; return o; }, {})
    });
    var pengaturanAwal = new Date(now - 160 * 864e5), mulaiHarga = U.tglWIB(pengaturanAwal.getTime());
    T('Config_Terkunci', [{ key: 'bank', value: 'Bank Central Asia (BCA)', updated_by: 'USR-OWNER', updated_at: waktu(mulaiHarga) }, { key: 'no_rekening', value: '5240881920', updated_by: 'USR-OWNER', updated_at: waktu(mulaiHarga) }, { key: 'atas_nama', value: 'PT Tirta Renang Indonesia', updated_by: 'USR-OWNER', updated_at: waktu(mulaiHarga) }]);
    T('Pelatih', [['CO-01', 'Budi Santoso', 'L', '081311110001', 'PRSI A'], ['CO-02', 'Mei Lin', 'P', '081311110002', 'PRSI B'], ['CO-03', 'Hendra Kusuma', 'L', '081311110003', 'PRSI A'], ['CO-04', 'Doni Ramadhan', 'L', '081311110004', 'PRSI B'], ['CO-05', 'Rina Wijaya', 'P', '081311110005', 'PRSI B'], ['CO-06', 'Sari Puspita', 'P', '081311110006', 'PRSI C']]
      .map(function (x) { return { coach_id: x[0], nama: x[1], jenis_kelamin: x[2], kontak: x[3], lisensi: x[4], aktif: 'Y' }; }));
    T('Kolam', [['KL-01', 'Tirta Senayan Aquatic', 'SNY', 'Jl. Tirta Senayan 1'], ['KL-02', 'Cilandak Swim Hub', 'CLD', 'Jl. Cilandak Raya 8'], ['KL-03', 'Kolam Bintaro Asri', 'BTR', 'Bintaro Sektor 7'], ['KL-04', 'Kemang Swim Center', 'KMG', 'Jl. Kemang Selatan 21']]
      .map(function (x) { return { kolam_id: x[0], nama_resmi: x[1], singkatan: x[2], alamat: x[3], aktif: 'Y' }; }));
    var PAKET = [['PK-01', 'Privat Kolam 4x', 'Privat', 'Kolam', 4, 1, 1, 850000, 0], ['PK-02', 'Privat Kolam 8x', 'Privat', 'Kolam', 8, 1, 1, 1600000, 0], ['PK-03', 'Couple Kolam 4x', 'Couple', 'Kolam', 4, 2, 2, 1400000, 350000],
      ['PK-04', 'Kelas Kolam 8x', 'Kelas', 'Kolam', 8, 1, 8, 750000, 750000], ['PK-05', 'Trial Kolam 1x', 'Trial', 'Kolam', 1, 1, 1, 150000, 0], ['PK-06', 'Home Visit Privat 4x', 'Privat', 'Home Visit', 4, 1, 1, 1100000, 0],
      ['PK-07', 'Home Visit Couple 4x', 'Couple', 'Home Visit', 4, 2, 2, 1800000, 450000], ['PK-08', 'Home Visit Kelas 8x', 'Kelas', 'Home Visit', 8, 1, 6, 1400000, 300000]];
    var PK = {};
    T('Paket', PAKET.map(function (x, i) { PK[x[0]] = { id: x[0], nama: x[1], jenis: x[2], lokasi: x[3], sesi: x[4], termasuk: x[5], harga: x[7], tambahan: x[8] }; return { paket_id: x[0], nama: x[1], jenis: x[2], lokasi: x[3], jumlah_sesi: x[4], peserta_termasuk: x[5], maks_peserta: x[6], durasi_menit: 60, urutan: i + 1, aktif: 'Y' }; }));
    T('Harga_Paket', PAKET.map(function (x) { return { harga_id: 'HRG-' + x[0], paket_id: x[0], harga: x[7], biaya_tambahan_per_peserta: x[8], berlaku_mulai: mulaiHarga, updated_by: 'USR-OWNER', updated_at: waktu(mulaiHarga) }; }));
    var TARIF = { 'Privat': 90000, 'Couple': 110000, 'Kelas': 95000, 'Trial': 50000, 'HV Privat': 130000, 'HV Couple': 150000, 'HV Kelas': 140000 };
    T('Tarif_Honor', Object.keys(TARIF).map(function (k) { return { tarif_id: 'TRF-' + k.replace(' ', ''), kategori_sesi: k, coach_id: '', tarif: TARIF[k], berlaku_mulai: mulaiHarga, aktif: 'Y', updated_by: 'USR-OWNER', updated_at: waktu(mulaiHarga) }; })
      .concat([{ tarif_id: 'TRF-BUDI-PRIVAT', kategori_sesi: 'Privat', coach_id: 'CO-01', tarif: 105000, berlaku_mulai: mulaiHarga, aktif: 'Y', updated_by: 'USR-OWNER', updated_at: waktu(mulaiHarga) }]));
    function tarifUntuk(kat, coach) { return kat === 'Privat' && coach === 'CO-01' ? 105000 : TARIF[kat]; }

    function akun(uid, nama, peran, un, sandi, extra) { var salt = env.acak(16); return Object.assign({ user_id: uid, nama: nama, peran: peran, username: un, hash_sandi: Inti.hashRahasia(env, sandi, salt), salt: salt, versi_token: 1, gagal_login: 0, kunci_hingga: '', coach_id: '', siswa_ids: '', kontak: '', email: '', aktif: 'Y', login_terakhir: '', dibuat_at: waktu(mulaiHarga) }, extra || {}); }
    T('Pengguna', [akun('USR-ADMIN', 'Dina Pratiwi', 'admin', 'admin', 'demo1234', { kontak: '081234567890', email: 'admin@swimacademy.id' })]
      .concat([['CO-01', 'budi'], ['CO-02', 'meilin'], ['CO-03', 'hendra'], ['CO-04', 'doni'], ['CO-05', 'rina'], ['CO-06', 'sari']].map(function (x, i) { var nm = ['Budi Santoso', 'Mei Lin', 'Hendra Kusuma', 'Doni Ramadhan', 'Rina Wijaya', 'Sari Puspita'][i]; return akun('USR-' + x[1].toUpperCase(), nm, 'pelatih', x[1], 'demo1234', { coach_id: x[0], kontak: '08131111000' + (i + 1) }); })));

    /* Jalur siswa: peserta, ortu, paket, pelatih, kolam, hari (relatif ke hari ini), jam, riwayat paket, sesi terpakai paket berjalan */
    var JALUR = [
      { p: [['Kenzo Alfarizqi', 'Anak', '2018-05-12', 'Laki-laki']], o: ['Maya Kartika', '081123456780', 'maya.kartika@mail.id'], pk: 'PK-01', c: 'CO-01', k: 'KL-01', h: [0], jam: '08:00', riw: 4, pakai: 3, kode: ['SA-8829'], catatan: 'Alergi kaporit ringan, pakai kacamata renang khusus.' },
      { p: [['Aisyah Kirana', 'Anak', '2017-09-03', 'Perempuan'], ['Nadia Salsabila', 'Anak', '2017-11-21', 'Perempuan', ['Lia Salsabila', '081367001122', 'lia.salsabila@mail.id']]], o: ['Maya Kartika', '081123456780', 'maya.kartika@mail.id'], pk: 'PK-07', c: 'CO-05', k: 'KL-03', h: [0], jam: '18:30', riw: 1, pakai: 4, akhir: 6, kode: ['SA-8830', 'SA-4512'] },
      { p: [['Farhan Malik', 'Anak', '2016-02-14', 'Laki-laki'], ['Bima Sakti', 'Anak', '2016-07-30', 'Laki-laki'], ['Keyla Putri', 'Anak', '2017-01-08', 'Perempuan'], ['Zahra Amalia', 'Anak', '2016-12-19', 'Perempuan']], o: ['Ratna Malik', '081245678901', 'ratna.malik@mail.id'], pk: 'PK-04', c: 'CO-03', k: 'KL-02', h: [0, 4], jam: '16:45', riw: 1, pakai: 8, akhir: 1, belum: true },
      { p: [['Naura Salsabila', 'Anak', '2015-04-02', 'Perempuan']], o: ['Ayu Salsabila', '081356789012', 'ayu.s@mail.id'], pk: 'PK-06', c: 'CO-02', k: 'KL-04', h: [2], jam: '10:00', riw: 3, pakai: 3 },
      { p: [['Dimas Pratama', 'Dewasa', '2004-03-17', 'Laki-laki'], ['Rian Ardiansyah', 'Dewasa', '2003-10-05', 'Laki-laki']], o: ['Dimas Pratama', '081367890123', 'dimas.p@mail.id'], pk: 'PK-03', c: 'CO-02', k: 'KL-01', h: [0], jam: '10:00', riw: 1, pakai: 2 },
      { p: [['Clara Wijaya', 'Anak', '2014-08-25', 'Perempuan']], o: ['Linda Wijaya', '081378901234', 'linda.w@mail.id'], pk: 'PK-02', c: 'CO-04', k: 'KL-01', h: [0, 3], jam: '15:30', riw: 0, pakai: 2, belum: true },
      { p: [['Arka Pratama', 'Anak', '2019-01-30', 'Laki-laki']], o: ['Sinta Pratama', '081389012345', ''], pk: 'PK-01', c: 'CO-01', k: 'KL-01', h: [1], jam: '07:00', riw: 5, pakai: 1 },
      { p: [['Nadia Sabrina', 'Dewasa', '1996-06-11', 'Perempuan']], o: ['Nadia Sabrina', '081390123456', 'nadia.sabrina@mail.id'], pk: 'PK-01', c: 'CO-02', k: 'KL-02', h: [1], jam: '07:00', riw: 0, pakai: 2, trial: true },
      { p: [['Rayyan Kusuma', 'Anak', '2016-10-10', 'Laki-laki']], o: ['Tono Kusuma', '081401234567', 'tono.k@mail.id'], pk: 'PK-01', c: 'CO-04', k: 'KL-01', h: [4], jam: '07:00', riw: 1, pakai: 4, akhir: 0 },
      { p: [['Siti Aisyah', 'Dewasa', '1990-12-01', 'Perempuan']], o: ['Siti Aisyah', '081412345678', 'siti.aisyah@mail.id'], pk: 'PK-02', c: 'CO-02', k: 'KL-02', h: [2, 5], jam: '08:00', riw: 3, pakai: 5 },
      { p: [['Vino Mahendra', 'Anak', '2015-05-20', 'Laki-laki'], ['Sheila Anjani', 'Anak', '2015-09-09', 'Perempuan']], o: ['Rudi Mahendra', '081423456789', 'rudi.m@mail.id'], pk: 'PK-03', c: 'CO-01', k: 'KL-01', h: [1], jam: '08:00', riw: 4, pakai: 2 },
      { p: [['Gading Prakoso', 'Anak', '2014-03-03', 'Laki-laki'], ['Anya Lestari', 'Anak', '2014-06-16', 'Perempuan']], o: ['Wulan Prakoso', '081434567890', ''], pk: 'PK-03', c: 'CO-03', k: 'KL-01', h: [4], jam: '08:00', riw: 0, pakai: 3 },
      { p: [['Bagas Wiratama', 'Anak', '2013-11-11', 'Laki-laki'], ['Citra Maharani', 'Anak', '2013-04-04', 'Perempuan'], ['Dafa Ramadhan', 'Anak', '2014-01-17', 'Laki-laki']], o: ['Yuni Wiratama', '081445678901', 'yuni.w@mail.id'], pk: 'PK-04', c: 'CO-01', k: 'KL-01', h: [2, 6], jam: '16:00', riw: 3, pakai: 4 },
      { p: [['Danish Arya', 'Anak', '2017-02-02', 'Laki-laki']], o: ['Fitri Arya', '081456789012', 'fitri.arya@mail.id'], pk: 'PK-01', c: 'CO-02', k: 'KL-02', h: [1], jam: '15:30', riw: 3, pakai: 1 },
      { p: [['Devina Larasati', 'Anak', '2016-08-08', 'Perempuan']], o: ['Agus Larasati', '081467890123', ''], pk: 'PK-01', c: 'CO-01', k: 'KL-01', h: [3], jam: '16:45', riw: 3, pakai: 2 },
      { p: [['Rafka Zayn', 'Anak', '2018-12-12', 'Laki-laki']], o: ['Zaynab Putri', '081478901234', 'zaynab@mail.id'], pk: 'PK-05', c: 'CO-03', k: 'KL-02', h: [0], jam: '16:45', riw: 0, pakai: 0 },
      { p: [['M. Fatih Akbar', 'Anak', '2017-07-07', 'Laki-laki']], o: ['Akbar Maulana', '081489012345', 'akbar.m@mail.id'], pk: 'PK-01', c: 'CO-05', k: 'KL-01', h: [5], jam: '16:45', riw: 4, pakai: 3 },
      { p: [['Kevin Sanjaya', 'Anak', '2013-09-19', 'Laki-laki']], o: ['Hartono Sanjaya', '081490123456', 'hartono.s@mail.id'], pk: 'PK-02', c: 'CO-01', k: 'KL-04', h: [3, 6], jam: '15:30', riw: 3, pakai: 6 },
      { p: [['Naufal Rizky', 'Anak', '2016-04-14', 'Laki-laki'], ['Alya Rizky', 'Anak', '2018-02-22', 'Perempuan']], o: ['Rizky Hidayat', '081501234567', 'rizky.h@mail.id'], pk: 'PK-07', c: 'CO-04', k: 'KL-04', h: [5], jam: '15:30', riw: 2, pakai: 1 },
      { p: [['Jessica Tamara', 'Anak', '2015-10-01', 'Perempuan'], ['Jason Tamara', 'Anak', '2017-03-12', 'Laki-laki'], ['Jovan Tamara', 'Anak', '2019-05-05', 'Laki-laki']], o: ['Monica Tamara', '081512345678', 'monica.t@mail.id'], pk: 'PK-08', c: 'CO-06', k: 'KL-03', h: [3, 6], jam: '09:00', riw: 0, pakai: 0 },
      { p: [['Alvaro Pratama', 'Anak', '2016-01-25', 'Laki-laki']], o: ['Dewi Pratama', '081523456789', 'dewi.p@mail.id'], pk: 'PK-06', c: 'CO-06', k: 'KL-03', h: [4], jam: '16:00', riw: 2, pakai: 2 },
      { p: [['Lintang Ayu', 'Dewasa', '1999-08-18', 'Perempuan']], o: ['Lintang Ayu', '081534567890', 'lintang.ayu@mail.id'], pk: 'PK-02', c: 'CO-03', k: 'KL-02', h: [1, 4], jam: '19:00', riw: 0, pakai: 3, trial: true },
      { p: [['Bayu Saputra', 'Dewasa', '1988-05-05', 'Laki-laki']], o: ['Bayu Saputra', '081545678901', 'bayu.s@mail.id'], pk: 'PK-01', c: 'CO-05', k: 'KL-01', h: [2], jam: '19:00', riw: 5, pakai: 2 },
      { p: [['Mikha Hutapea', 'Anak', '2015-02-15', 'Laki-laki'], ['Aurel Gunawan', 'Anak', '2015-06-06', 'Perempuan'], ['Bryan Tanoto', 'Anak', '2014-12-24', 'Laki-laki'], ['Cheryl Halim', 'Anak', '2015-03-30', 'Perempuan']], o: ['Grace Hutapea', '081556789012', 'grace.h@mail.id'], pk: 'PK-04', c: 'CO-06', k: 'KL-03', h: [1, 5], jam: '16:00', riw: 4, pakai: 6 },
      { p: [['Rizky Fadillah', 'Anak', '2015-07-17', 'Laki-laki']], o: ['Fadillah Umar', '081567890123', ''], pk: 'PK-01', c: 'CO-04', k: 'KL-01', h: [2], jam: '17:00', riw: 2, pakai: 4, akhir: 40, selesai: true },
      { p: [['Putri Ayu', 'Anak', '2018-09-09', 'Perempuan']], o: ['Ayu Lestari', '081578901234', ''], pk: 'PK-05', c: 'CO-02', k: 'KL-02', h: [3], jam: '17:00', riw: 0, pakai: 1, akhir: 60, selesai: true },
      { p: [['Hana Safitri', 'Anak', '2016-06-01', 'Perempuan'], ['Hani Safitri', 'Anak', '2016-06-01', 'Perempuan']], o: ['Safitri Ningsih', '081589012345', 'safitri@mail.id'], pk: 'PK-07', c: 'CO-05', k: 'KL-03', h: [6], jam: '10:00', riw: 0, pakai: 4, akhir: 75, selesai: true }
    ];

    var siswaRows = [], ppRows = [], enrRows = [], absRows = [], apRows = [], jadRows = [], trxRows = [], ortu = {}, kodeDipakai = {};
    function tanggalMundur(hariList, sampai, n) { var o = [], t = sampai, guard = 0; while (o.length < n && guard++ < 400) { if (hariList.indexOf(U.hariKe(t)) >= 0) o.unshift(t); t = U.geserTgl(t, -1); } return o; }
    function statusPeserta(n) {
      var st = []; for (var i = 0; i < n; i++) { var r = rng(); st.push(n === 1 ? (r < 0.93 ? 'Hadir' : 'Hangus') : (r < 0.86 ? 'Hadir' : r < 0.94 ? 'Izin' : 'Hangus')); }
      if (st.every(function (x) { return x === 'Izin'; })) st[0] = 'Hadir';
      return st;
    }
    function kategoriKas(n) { return { Pendaftaran: 'KK-01', Perpanjangan: 'KK-02', 'Penambahan Biaya': 'KK-03', Trial: 'KK-04', 'Tiket Kolam': 'KK-05', 'Honor Pelatih': 'KK-06', Lainnya: 'KK-07' }[n]; }
    function kodeAkses(pref) { if (pref && !kodeDipakai[pref]) { kodeDipakai[pref] = 1; return pref; } var k; do { k = 'SA-' + (1000 + Math.floor(rng() * 9000)); } while (kodeDipakai[k]); kodeDipakai[k] = 1; return k; }

    JALUR.forEach(function (j, ji) {
      var hari = j.h.map(hariRel), jamSelesai = tambahMenit(j.jam, 60), ids = [];
      j.p.forEach(function (p, pi) {
        var sid = 'SW-' + (101 + siswaRows.length);
        var ot = p[4] || j.o;
        siswaRows.push({ siswa_id: sid, nama: p[0], kategori: p[1], tgl_lahir: p[2], jenis_kelamin: p[3], nama_ortu: ot[0], kontak_ortu: ot[1], email_ortu: ot[2], catatan: pi === 0 ? (j.catatan || '') : '', data_tambahan: '{}', kode_akses: kodeAkses(j.kode && j.kode[pi]), aktif: 'Y', dibuat_at: '' });
        ids.push(sid); (ortu[ot[1]] = ortu[ot[1]] || { nama: ot[0], email: ot[2], ids: [] }).ids.push(sid);
      });
      var hariIniTermasuk = hari.indexOf(H0) >= 0 && menitKini > U.menitDari(jamSelesai) && !j.belum;
      var sampai = j.akhir ? U.geserTgl(hariIni, -j.akhir) : (hariIniTermasuk ? hariIni : U.geserTgl(hariIni, -1));
      var urutPaket = [], p = PK[j.pk];
      /* paket berjalan dulu (mundur dari hari ini), lalu riwayat sebelumnya */
      var nIzin = p.sesi > 1 && ids.length === 1 && rng() < 0.3 && j.pakai > 1 ? 1 : 0;
      var tglKini = tanggalMundur(hari, sampai, j.pakai + nIzin);
      var mulaiKini = tglKini.length ? U.geserTgl(tglKini[0], -Math.floor(rng() * 3)) : U.geserTgl(hariIni, -Math.floor(rng() * 4) - 1);
      urutPaket.unshift({ paket: p, tanggal: tglKini, izinKe: nIzin ? Math.floor(rng() * (tglKini.length - 1)) : -1, mulai: mulaiKini, pakai: j.pakai });
      var batas = U.geserTgl(mulaiKini, -1 - Math.floor(rng() * 4));
      for (var r = 0; r < j.riw; r++) { var tg = tanggalMundur(hari, batas, p.sesi); urutPaket.unshift({ paket: p, tanggal: tg, izinKe: -1, mulai: U.geserTgl(tg[0], -Math.floor(rng() * 2)), pakai: p.sesi }); batas = U.geserTgl(urutPaket[0].mulai, -1 - Math.floor(rng() * 5)); }
      if (j.trial) { var tt = tanggalMundur(hari, batas, 1); urutPaket.unshift({ paket: PK['PK-05'], tanggal: tt, izinKe: -1, mulai: tt[0], pakai: 1 }); }
      siswaRows.forEach(function (s0) { if (ids.indexOf(s0.siswa_id) >= 0 && !s0.dibuat_at) s0.dibuat_at = waktu(urutPaket[0].mulai, '09:00'); });
      var induk = '';
      urutPaket.forEach(function (u, ui) {
        var terakhir = ui === urutPaket.length - 1, enr = 'ENR-' + (5001 + enrRows.length), kat = (u.paket.lokasi === 'Home Visit' ? 'HV ' : '') + u.paket.jenis;
        var habis = u.pakai >= u.paket.sesi, tipe = ui === 0 || (urutPaket[ui - 1].paket.jenis === 'Trial') ? 'Pendaftaran' : 'Perpanjangan';
        var e = { enr_id: enr, paket_id: u.paket.id, coach_id: j.c, kolam_id: j.k, jam: Inti.NAMA_HARI[hari[0]] + ' ' + j.jam, tgl_mulai: u.mulai, tgl_kedaluwarsa: '', tipe: tipe, induk_enr_id: tipe === 'Perpanjangan' ? induk : '', sesi_bawaan: 0, sesi_total: u.paket.sesi, sesi_terpakai: Math.min(u.pakai, u.paket.sesi), sesi_lebih: 0,
          status: !terakhir ? 'Selesai' : (habis ? (j.selesai ? 'Selesai' : 'HABIS') : 'Aktif'), alasan_habis: habis ? 'sesi penuh' : '', habis_at: habis && u.tanggal.length ? waktu(u.tanggal[u.tanggal.length - 1], jamSelesai) : '',
          aturan_json: JSON.stringify({ sisa_sesi_perpanjangan: 'hangus', maks_sesi_dibawa: 2, masa_berlaku_hari: 0, versi: 1 }), dibuat_oleh: 'USR-ADMIN', dibuat_at: waktu(u.mulai, '08:15'), selesai_at: !terakhir ? waktu(urutPaket[ui + 1].mulai, '08:15') : (j.selesai ? waktu(U.geserTgl(u.tanggal[u.tanggal.length - 1] || u.mulai, 9), '10:00') : '') };
        enrRows.push(e); induk = enr;
        ids.forEach(function (sid) { ppRows.push({ pp_id: enr + ':' + sid, enr_id: enr, siswa_id: sid }); });
        var pert = 0;
        u.tanggal.forEach(function (tgl, ti) {
          pert++; var aid = 'ABS-' + (70001 + absRows.length), izin = ti === u.izinKe, st = izin ? ids.map(function () { return 'Izin'; }) : statusPeserta(ids.length);
          var dihitung = st.some(function (x) { return x === 'Hadir' || x === 'Hangus'; });
          absRows.push({ absen_id: aid, enr_id: enr, pertemuan_ke: pert, tanggal: tgl, coach_id: j.c, kategori_sesi: kat, kolam_id: j.k, dihitung: dihitung ? 'Y' : 'T', sesi_lebih: 'T', dibuat_oleh: 'USR-' + ({ 'CO-01': 'BUDI', 'CO-02': 'MEILIN', 'CO-03': 'HENDRA', 'CO-04': 'DONI', 'CO-05': 'RINA', 'CO-06': 'SARI' })[j.c], waktu_server: (function (w) { var b = U.waktuWIB(now - 60000); return tgl === hariIni && w > b ? b : w; })(waktu(tgl, tambahMenit(jamSelesai, 7 + Math.floor(rng() * 40)))), via_buka_kunci: 'T', status_rekam: 'aktif', koreksi_dari: '', catatan: '' });
          ids.forEach(function (sid, si) { apRows.push({ ap_id: aid + ':' + sid, absen_id: aid, siswa_id: sid, status: st[si] }); });
        });
        if (u.mulai <= hariIni) {
          var nm = j.o[0], ekstra = Math.max(0, ids.length - u.paket.termasuk);
          trxRows.push({ trx_id: 'TRX-' + (20001 + trxRows.length), tanggal: u.mulai, tipe: 'Pemasukan', kategori_id: kategoriKas(u.paket.jenis === 'Trial' ? 'Trial' : tipe), nama: nm, nominal: u.paket.harga, penjelasan: tipe + ' ' + u.paket.nama, enr_id: enr, bukti_file_id: '', status: 'aktif', alasan_batal: '', dibuat_oleh: 'USR-ADMIN', dibuat_at: waktu(u.mulai, '08:15'), diubah_oleh: '', diubah_at: '' });
          if (ekstra && u.paket.tambahan) trxRows.push({ trx_id: 'TRX-' + (20001 + trxRows.length), tanggal: u.mulai, tipe: 'Pemasukan', kategori_id: kategoriKas('Penambahan Biaya'), nama: nm, nominal: ekstra * u.paket.tambahan, penjelasan: 'Biaya tambahan ' + ekstra + ' peserta · ' + u.paket.nama, enr_id: enr, bukti_file_id: '', status: 'aktif', alasan_batal: '', dibuat_oleh: 'USR-ADMIN', dibuat_at: waktu(u.mulai, '08:16'), diubah_oleh: '', diubah_at: '' });
        }
        if (terakhir && e.status !== 'Selesai') hari.forEach(function (h) { jadRows.push({ jadwal_id: 'JD-' + (301 + jadRows.length), coach_id: j.c, hari: h, jam_mulai: j.jam, jam_selesai: jamSelesai, enr_id: enr, kolam_id: j.k, status_slot: 'Terisi', catatan: '', aktif: 'Y' }); });
      });
    });
    jadRows.push({ jadwal_id: 'JD-290', coach_id: 'CO-02', hari: hariRel(3), jam_mulai: '08:00', jam_selesai: '09:00', enr_id: '', kolam_id: 'KL-02', status_slot: 'Kosong', catatan: 'Siap menerima siswa baru', aktif: 'Y' });
    jadRows.push({ jadwal_id: 'JD-291', coach_id: 'CO-04', hari: hariRel(2), jam_mulai: '16:45', jam_selesai: '17:45', enr_id: '', kolam_id: 'KL-01', status_slot: 'Kosong', catatan: '', aktif: 'Y' });
    jadRows.push({ jadwal_id: 'JD-292', coach_id: 'CO-03', hari: hariRel(6), jam_mulai: '07:00', jam_selesai: '12:00', enr_id: '', kolam_id: 'KL-02', status_slot: 'Libur', catatan: 'Libur rutin / perawatan kolam', aktif: 'Y' });
    T('Siswa', siswaRows); T('Paket_Aktif', enrRows); T('Paket_Peserta', ppRows); T('Absensi_Sesi', absRows); T('Absensi_Peserta', apRows); T('Jadwal', jadRows);

    /* Pengeluaran bulanan: tiket kolam, honor pelatih (bulan sebelumnya), lain-lain */
    var bulanAwal = U.bulanDari(enrRows.reduce(function (m, e) { return e.tgl_mulai < m ? e.tgl_mulai : m; }, hariIni)), bulanKini = U.bulanDari(hariIni), b = bulanAwal, honorBulan = {};
    absRows.forEach(function (a) { if (a.dihitung !== 'Y') return; var bl = U.bulanDari(a.tanggal); honorBulan[bl] = (honorBulan[bl] || 0) + tarifUntuk(a.kategori_sesi.replace(/^HV /, 'HV ').trim(), a.coach_id); });
    while (b <= bulanKini) {
      var t5 = b + '-05', t3 = b + '-03', t18 = b + '-18';
      if (t5 <= hariIni) ['KL-01', 'KL-02', 'KL-03', 'KL-04'].forEach(function (k, i) { trxRows.push({ trx_id: 'TRX-' + (20001 + trxRows.length), tanggal: t5, tipe: 'Pengeluaran', kategori_id: 'KK-05', nama: ['Tirta Senayan Aquatic', 'Cilandak Swim Hub', 'Kolam Bintaro Asri', 'Kemang Swim Center'][i], nominal: [1800000, 1400000, 900000, 700000][i] + Math.round(rng() * 4) * 100000, penjelasan: 'Sewa lajur & tiket kolam ' + U.namaBulan(b), enr_id: '', bukti_file_id: '', status: 'aktif', alasan_batal: '', dibuat_oleh: 'USR-ADMIN', dibuat_at: waktu(t5, '10:00'), diubah_oleh: '', diubah_at: '' }); });
      var bl0 = U.geserBulan(b, -1);
      if (t3 <= hariIni && honorBulan[bl0]) trxRows.push({ trx_id: 'TRX-' + (20001 + trxRows.length), tanggal: t3, tipe: 'Pengeluaran', kategori_id: 'KK-06', nama: 'Honor pelatih ' + U.namaBulan(bl0), nominal: honorBulan[bl0], penjelasan: 'Transfer honor 6 pelatih', enr_id: '', bukti_file_id: '', status: 'aktif', alasan_batal: '', dibuat_oleh: 'USR-OWNER', dibuat_at: waktu(t3, '11:00'), diubah_oleh: '', diubah_at: '' });
      if (t18 <= hariIni && rng() < 0.7) trxRows.push({ trx_id: 'TRX-' + (20001 + trxRows.length), tanggal: t18, tipe: 'Pengeluaran', kategori_id: 'KK-07', nama: ['Toko Olahraga Bahari', 'Aquatic Gear ID', 'Percetakan Jaya'][Math.floor(rng() * 3)], nominal: [450000, 850000, 1200000][Math.floor(rng() * 3)], penjelasan: ['Kickboard EVA & pull buoy', 'Kacamata renang cadangan', 'Cetak sertifikat & banner'][Math.floor(rng() * 3)], enr_id: '', bukti_file_id: '', status: 'aktif', alasan_batal: '', dibuat_oleh: 'USR-ADMIN', dibuat_at: waktu(t18, '13:00'), diubah_oleh: '', diubah_at: '' });
      b = U.geserBulan(b, 1);
    }
    var batal = trxRows.filter(function (t) { return t.kategori_id === 'KK-07'; }).slice(-1)[0];
    if (batal) { batal.status = 'batal'; batal.alasan_batal = 'Nota ganda, sudah dicatat sebelumnya'; batal.diubah_oleh = 'USR-OWNER'; batal.diubah_at = batal.dibuat_at; }
    T('Transaksi', trxRows);

    /* Akun orang tua (PIN demo 123456) */
    T('Pengguna', Object.keys(ortu).map(function (hp, i) { var o = ortu[hp]; return akun('USR-ORTU' + (i + 1), o.nama, 'ortu', 'ortu.' + (i + 1), '123456', { kontak: hp, email: o.email, siswa_ids: o.ids.join(',') }); }));

    /* Pendaftaran masuk, link, materi, buka kunci */
    var jamNow = function (mundurMenit) { return U.waktuWIB(now - mundurMenit * 60000); };
    var rayyan = enrRows.filter(function (e) { return ppRows.some(function (p) { return p.enr_id === e.enr_id && siswaRows.some(function (s0) { return s0.siswa_id === p.siswa_id && s0.nama === 'Rayyan Kusuma'; }); }); }).slice(-1)[0];
    T('Link_Pendaftaran', [
      { token: 'DEMO-BARU', form_id: 'FRM-0001', tipe: 'baru', enr_id: '', kedaluwarsa: U.waktuWIB(now + 30 * 864e5), sekali_pakai: 'T', dipakai: 'T', catatan: 'Link umum demo', dibuat_oleh: 'USR-ADMIN', dibuat_at: jamNow(60 * 24 * 3) },
      { token: 'LNK882RADITYA', form_id: 'FRM-0001', tipe: 'baru', enr_id: '', kedaluwarsa: U.waktuWIB(now + 6 * 864e5), sekali_pakai: 'Y', dipakai: 'Y', catatan: 'Raditya', dibuat_oleh: 'USR-ADMIN', dibuat_at: jamNow(60 * 26) },
      { token: 'LNKKIRANA01', form_id: 'FRM-0001', tipe: 'baru', enr_id: '', kedaluwarsa: U.waktuWIB(now + 6 * 864e5), sekali_pakai: 'Y', dipakai: 'Y', catatan: 'Kirana', dibuat_oleh: 'USR-ADMIN', dibuat_at: jamNow(60 * 30) },
      { token: 'LNKRAYYAN02', form_id: 'FRM-0001', tipe: 'perpanjangan', enr_id: rayyan ? rayyan.enr_id : '', kedaluwarsa: U.waktuWIB(now + 5 * 864e5), sekali_pakai: 'Y', dipakai: 'Y', catatan: 'Perpanjangan Rayyan', dibuat_oleh: 'USR-ADMIN', dibuat_at: jamNow(60 * 20) },
      { token: 'LNKLAMA99', form_id: 'FRM-0001', tipe: 'baru', enr_id: '', kedaluwarsa: U.waktuWIB(now - 2 * 864e5), sekali_pakai: 'Y', dipakai: 'T', catatan: 'Kedaluwarsa (contoh)', dibuat_oleh: 'USR-ADMIN', dibuat_at: jamNow(60 * 24 * 9) }
    ]);
    var buktiDemo = env.berkas ? 'assets/ilustrasi/bukti-transfer.svg' : '';
    if (env.berkas) env.berkas[buktiDemo] = { nama: 'bukti.svg', mime: 'image/svg+xml', url: buktiDemo };
    T('Pendaftaran_Masuk', [
      { id: 'REG-8941', token: 'LNK882RADITYA', tipe: 'baru', enr_lama: '', form_versi: 1, data_json: JSON.stringify({ nama: 'Raditya Arya Pratama', tgl_lahir: '2017-08-14', kategori: 'Anak', jenis_kelamin: 'Laki-laki', nama_ortu: 'Hendra Pratama', kontak: '081298457210', email: 'hendra.pratama@mail.id', paket: 'PK-01', kolam: 'KL-01', jam: 'Sabtu 08:00', catatan_kesehatan: 'Takut air dalam (trauma ringan)', peserta_tambahan: [] }), bukti_file_id: buktiDemo, persetujuan_data_at: jamNow(122), status: 'Baru', catatan: '', enr_baru: '', diverifikasi_oleh: '', diverifikasi_at: '', dibuat_at: jamNow(120) },
      { id: 'REG-8942', token: 'LNKKIRANA01', tipe: 'baru', enr_lama: '', form_versi: 1, data_json: JSON.stringify({ nama: 'Kirana Larasati', tgl_lahir: '2016-03-09', kategori: 'Anak', jenis_kelamin: 'Perempuan', nama_ortu: 'Maya Larasati', kontak: '081377712345', email: '', paket: 'PK-07', kolam: 'KL-03', jam: 'Minggu 09:00', catatan_kesehatan: '', peserta_tambahan: [{ nama: 'Kayla Larasati', tgl_lahir: '2018-07-01', kategori: 'Anak', jenis_kelamin: 'Perempuan' }] }), bukti_file_id: buktiDemo, persetujuan_data_at: jamNow(168), status: 'Baru', catatan: '', enr_baru: '', diverifikasi_oleh: '', diverifikasi_at: '', dibuat_at: jamNow(165) },
      { id: 'REG-8943', token: 'LNKRAYYAN02', tipe: 'perpanjangan', enr_lama: rayyan ? rayyan.enr_id : '', form_versi: 1, data_json: JSON.stringify({ nama: 'Rayyan Kusuma', tgl_lahir: '2016-10-10', kategori: 'Anak', jenis_kelamin: 'Laki-laki', nama_ortu: 'Tono Kusuma', kontak: '081401234567', email: 'tono.k@mail.id', paket: 'PK-01', kolam: 'KL-01', jam: 'Pagi 07:00', peserta_tambahan: [] }), bukti_file_id: '', persetujuan_data_at: jamNow(40), status: 'Baru', catatan: '', enr_baru: '', diverifikasi_oleh: '', diverifikasi_at: '', dibuat_at: jamNow(38) },
      { id: 'REG-8890', token: 'LNKLAMA99', tipe: 'baru', enr_lama: '', form_versi: 1, data_json: JSON.stringify({ nama: 'Bimo Prasetyo', tgl_lahir: '2012-01-01', kategori: 'Anak', jenis_kelamin: 'Laki-laki', nama_ortu: 'Prasetyo', kontak: '081300000099', paket: 'PK-02', kolam: 'KL-04', jam: 'Rabu sore', peserta_tambahan: [] }), bukti_file_id: '', persetujuan_data_at: jamNow(60 * 24 * 8), status: 'Ditolak', catatan: 'Kuota pelatih Kemang penuh, ditawarkan Cilandak', enr_baru: '', diverifikasi_oleh: 'USR-ADMIN', diverifikasi_at: jamNow(60 * 24 * 7), dibuat_at: jamNow(60 * 24 * 8) }
    ].concat(enrRows.filter(function (e) { return e.tipe === 'Pendaftaran' && e.tgl_mulai >= U.geserTgl(hariIni, -40); }).map(function (e, i) {
      var ps = ppRows.filter(function (p) { return p.enr_id === e.enr_id; }).map(function (p) { return siswaRows.filter(function (s0) { return s0.siswa_id === p.siswa_id; })[0]; });
      return { id: 'REG-' + (8800 + i), token: 'LNKV' + i, tipe: 'baru', enr_lama: '', form_versi: 1, data_json: JSON.stringify({ nama: ps[0].nama, tgl_lahir: ps[0].tgl_lahir, kategori: ps[0].kategori, jenis_kelamin: ps[0].jenis_kelamin, nama_ortu: ps[0].nama_ortu, kontak: ps[0].kontak_ortu, paket: e.paket_id, kolam: e.kolam_id, jam: e.jam, peserta_tambahan: [] }),
        bukti_file_id: '', persetujuan_data_at: waktu(U.geserTgl(e.tgl_mulai, -1), '19:40'), status: 'Diverifikasi', catatan: '', enr_baru: e.enr_id, diverifikasi_oleh: 'USR-ADMIN', diverifikasi_at: waktu(U.geserTgl(e.tgl_mulai, -1), '20:05'), dibuat_at: waktu(U.geserTgl(e.tgl_mulai, -1), '19:40') };
    })));
    T('Materi', [
      ['Teknik Gaya Bebas: Pernapasan Samping', 'Gaya Bebas', 'Video', 'gaya bebas, napas', 'Latihan rotasi kepala 3 kayuhan, hembuskan di dalam air, ambil napas cepat di samping.'],
      ['Streamline & Dorongan Dinding', 'Dasar', 'Video', 'streamline, start', 'Posisi lengan mengunci di atas kepala, dagu menempel, dorong dinding dengan kedua kaki.'],
      ['Kurikulum Pemula 8 Pertemuan', 'Kurikulum', 'PDF', 'kurikulum, anak', 'Urutan materi: adaptasi air, mengapung, meluncur, kaki gaya bebas, lengan, pernapasan, kombinasi, evaluasi.'],
      ['Mengatasi Takut Air pada Anak', 'Psikologi', 'Teks', 'takut air, anak', 'Mulai di air dangkal, gunakan permainan, beri pujian spesifik, jangan memaksa menyelam di pertemuan awal.'],
      ['Drill Kaki Gaya Dada', 'Gaya Dada', 'Video', 'gaya dada, drill', 'Tendangan cambuk: tumit ke bokong, telapak menghadap luar, rapatkan dengan cepat.'],
      ['Protokol Keselamatan Kolam', 'Keselamatan', 'PDF', 'keselamatan, SOP', 'Hitung peserta setiap 10 menit, pelampung siaga, larangan berlari, prosedur darurat & P3K.'],
      ['Posisi Badan Gaya Punggung', 'Gaya Punggung', 'Gambar', 'gaya punggung', 'Telinga di dalam air, pinggul tinggi, pandangan ke langit-langit, kaki bergerak dari pangkal paha.'],
      ['Evaluasi Akhir Paket', 'Kurikulum', 'Teks', 'evaluasi, rapor', 'Nilai 5 aspek: adaptasi, pernapasan, kaki, lengan, kombinasi. Catat di riwayat siswa untuk orang tua.'],
      ['Pemanasan Darat 10 Menit', 'Dasar', 'Video', 'pemanasan', 'Putar lengan, peregangan bahu, lompat ringan, aktivasi inti tubuh sebelum masuk air.'],
      ['Teknik Pembalikan (Flip Turn)', 'Lanjutan', 'Video', 'flip turn, lanjutan', 'Satu kayuhan terakhir, tarik dagu, salto setengah, dorong dinding dalam posisi streamline menyamping.']
    ].map(function (m, i) { return { materi_id: 'MT-' + (11 + i), judul: m[0], kategori: m[1], jenis: m[2], link: m[2] === 'Video' ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(m[0]) : '', drive_id: '', tag: m[3], deskripsi: m[4], aktif: 'Y', dibuat_at: waktu(U.geserTgl(hariIni, -i * 6 - 2)) }; }));
    T('Buka_Kunci', [{ id: 'BK-1001', coach_id: 'CO-03', tanggal: U.geserTgl(hariIni, -1), alasan: 'Sinyal area kolam Cilandak drop saat jam kelas', dibuat_oleh: 'USR-ADMIN', dibuat_at: waktu(U.geserTgl(hariIni, -1), '21:55'), berlaku_hingga: waktu(hariIni, '21:55') }]);
    db.tambah('DE_Pejabat', [{ user_id: 'USR-OWNER', nama: 'Hendro Wijaya', jabatan: 'Owner & Head Coach', pin_hash: Inti.hashRahasia(env, '123456', 'pejabat-demo'), pin_salt: 'pejabat-demo', aktif: 'Y' }]);

    /* Beberapa aksi lewat jalur resmi (menghasilkan log audit & dokumen ber-QR) */
    var masukOwner = Inti.jalankan(env, { action: 'auth.masuk', payload: { username: 'owner', sandi: 'demo1234' } }), tok = masukOwner.data && masukOwner.data.token;
    Inti.jalankan(env, { action: 'auth.masuk', payload: { username: 'admin', sandi: 'demo1234' } });
    var masuk = trxRows.filter(function (t) { return t.tipe === 'Pemasukan' && t.status === 'aktif'; }).slice(-4);
    masuk.forEach(function (t) { Inti.jalankan(env, { action: 'dok.buat', token: tok, payload: { jenis: 'KWITANSI', ref: { trx_id: t.trx_id } } }); });
    var blnLalu = U.geserBulan(U.bulanDari(hariIni), -1);
    var slip = Inti.jalankan(env, { action: 'dok.buat', token: tok, payload: { jenis: 'SLIP_HONOR', refs: [{ coach_id: 'CO-01', bulan: blnLalu }, { coach_id: 'CO-02', bulan: blnLalu }] } });
    if (slip.ok && slip.data.dokumen[0]) Inti.jalankan(env, { action: 'dok.setujui', token: tok, payload: { ids: [slip.data.dokumen[0].id], pin: '123456' } });
    var tamat = enrRows.filter(function (e) { return e.status === 'Selesai' && e.sesi_terpakai >= e.sesi_total; }).slice(-1)[0];
    if (tamat) Inti.jalankan(env, { action: 'dok.buat', token: tok, payload: { jenis: 'SERTIFIKAT', ref: { enr_id: tamat.enr_id } } });
    Inti.jalankan(env, { action: 'crm.sync', token: tok, payload: {} });
    if (db.v) { db.v = {}; db.berubah = false; }
    return { siswa: siswaRows.length, paket: enrRows.length, absensi: absRows.length, transaksi: trxRows.length };
  }
  var api = { seed: seed, TEKS_TEMPLATE: TEKS_TEMPLATE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DemoSeed = api;
})(typeof window !== 'undefined' ? window : globalThis);
