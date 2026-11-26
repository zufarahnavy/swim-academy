/* =====================================================================
 * INTI SWIM ACADEMY — aturan bisnis & seluruh layanan (v1.2.0)
 * Satu sumber dipakai di dua tempat dengan isi IDENTIK:
 *   apps-script/Inti.gs → backend Google Apps Script (data di Google Sheets)
 *   js/inti.js          → mode demo di browser (data contoh di localStorage)
 * Lingkungan (penyimpanan, kunci, hash, email, Drive) disuntikkan lewat
 * objek `env`, jadi aturan di sini tidak tahu sedang jalan di mana.
 * ===================================================================== */
var Inti = (function () {
  'use strict';
  var VERSI_APP = '1.2.0';

  /* ---------- 1. Skema 27 sheet (PRD v1.1 + riwayat 10 versi pengaturan + info kolam harian) ---------- */
  var SKEMA = {
    Config_Terkunci: { id: 'key', kolom: ['key', 'value', 'updated_by', 'updated_at'] },
    Harga_Paket: { id: 'harga_id', prefix: 'HRG', kolom: ['harga_id', 'paket_id', 'harga', 'biaya_tambahan_per_peserta', 'berlaku_mulai', 'updated_by', 'updated_at'], angka: ['harga', 'biaya_tambahan_per_peserta'] },
    Tarif_Honor: { id: 'tarif_id', prefix: 'TRF', kolom: ['tarif_id', 'kategori_sesi', 'coach_id', 'tarif', 'berlaku_mulai', 'aktif', 'updated_by', 'updated_at'], angka: ['tarif'] },
    Aturan_Bisnis: { id: 'key', kolom: ['key', 'value', 'versi', 'updated_by', 'updated_at'], angka: ['versi'] },
    Hak_Akses: { id: 'kunci', kolom: ['kunci', 'peran', 'izin', 'aktif', 'versi', 'updated_by', 'updated_at'], angka: ['versi'] },
    Pengaturan: { id: 'key', kolom: ['key', 'value', 'versi', 'updated_by', 'updated_at'], angka: ['versi'] },
    Pengguna: { id: 'user_id', prefix: 'USR', kolom: ['user_id', 'nama', 'peran', 'username', 'hash_sandi', 'salt', 'versi_token', 'gagal_login', 'kunci_hingga', 'coach_id', 'siswa_ids', 'kontak', 'email', 'aktif', 'login_terakhir', 'dibuat_at'], angka: ['versi_token', 'gagal_login'] },
    Pelatih: { id: 'coach_id', prefix: 'CO', kolom: ['coach_id', 'nama', 'jenis_kelamin', 'kontak', 'lisensi', 'aktif'] },
    Kolam: { id: 'kolam_id', prefix: 'KL', kolom: ['kolam_id', 'nama_resmi', 'singkatan', 'alamat', 'aktif'] },
    Paket: { id: 'paket_id', prefix: 'PK', kolom: ['paket_id', 'nama', 'jenis', 'lokasi', 'jumlah_sesi', 'peserta_termasuk', 'maks_peserta', 'durasi_menit', 'urutan', 'aktif'], angka: ['jumlah_sesi', 'peserta_termasuk', 'maks_peserta', 'durasi_menit', 'urutan'] },
    Siswa: { id: 'siswa_id', prefix: 'SW', kolom: ['siswa_id', 'nama', 'kategori', 'tgl_lahir', 'jenis_kelamin', 'nama_ortu', 'kontak_ortu', 'email_ortu', 'catatan', 'data_tambahan', 'kode_akses', 'aktif', 'dibuat_at'] },
    Paket_Aktif: { id: 'enr_id', prefix: 'ENR', kolom: ['enr_id', 'paket_id', 'coach_id', 'kolam_id', 'jam', 'tgl_mulai', 'tgl_kedaluwarsa', 'tipe', 'induk_enr_id', 'sesi_bawaan', 'sesi_total', 'sesi_terpakai', 'sesi_lebih', 'status', 'alasan_habis', 'habis_at', 'aturan_json', 'dibuat_oleh', 'dibuat_at', 'selesai_at'], angka: ['sesi_bawaan', 'sesi_total', 'sesi_terpakai', 'sesi_lebih'] },
    Paket_Peserta: { id: 'pp_id', kolom: ['pp_id', 'enr_id', 'siswa_id'] },
    Absensi_Sesi: { id: 'absen_id', prefix: 'ABS', kolom: ['absen_id', 'enr_id', 'pertemuan_ke', 'tanggal', 'coach_id', 'kategori_sesi', 'kolam_id', 'dihitung', 'sesi_lebih', 'dibuat_oleh', 'waktu_server', 'via_buka_kunci', 'status_rekam', 'koreksi_dari', 'catatan'], angka: ['pertemuan_ke'] },
    Absensi_Peserta: { id: 'ap_id', kolom: ['ap_id', 'absen_id', 'siswa_id', 'status'] },
    Info_Kolam: { id: 'info_id', prefix: 'IK', kolom: ['info_id', 'tanggal', 'kolam_id', 'level', 'pesan', 'aktif', 'dibuat_oleh', 'dibuat_at'] },
    Jadwal: { id: 'jadwal_id', prefix: 'JD', kolom: ['jadwal_id', 'coach_id', 'hari', 'jam_mulai', 'jam_selesai', 'enr_id', 'kolam_id', 'status_slot', 'catatan', 'aktif'], angka: ['hari'] },
    Buka_Kunci: { id: 'id', prefix: 'BK', kolom: ['id', 'coach_id', 'tanggal', 'alasan', 'dibuat_oleh', 'dibuat_at', 'berlaku_hingga'] },
    Transaksi: { id: 'trx_id', prefix: 'TRX', kolom: ['trx_id', 'tanggal', 'tipe', 'kategori_id', 'nama', 'nominal', 'penjelasan', 'enr_id', 'bukti_file_id', 'status', 'alasan_batal', 'dibuat_oleh', 'dibuat_at', 'diubah_oleh', 'diubah_at'], angka: ['nominal'] },
    Kategori_Kas: { id: 'kategori_id', prefix: 'KK', kolom: ['kategori_id', 'nama', 'tipe', 'aktif', 'sistem'] },
    Materi: { id: 'materi_id', prefix: 'MT', kolom: ['materi_id', 'judul', 'kategori', 'jenis', 'link', 'drive_id', 'tag', 'deskripsi', 'aktif', 'dibuat_at'] },
    Form_Def: { id: 'form_id', prefix: 'FRM', kolom: ['form_id', 'versi', 'skema_json', 'status', 'updated_by', 'updated_at'], angka: ['versi'] },
    Link_Pendaftaran: { id: 'token', kolom: ['token', 'form_id', 'tipe', 'enr_id', 'kedaluwarsa', 'sekali_pakai', 'dipakai', 'catatan', 'dibuat_oleh', 'dibuat_at'] },
    Pendaftaran_Masuk: { id: 'id', prefix: 'REG', kolom: ['id', 'token', 'tipe', 'enr_lama', 'form_versi', 'data_json', 'bukti_file_id', 'persetujuan_data_at', 'status', 'catatan', 'enr_baru', 'diverifikasi_oleh', 'diverifikasi_at', 'dibuat_at'] },
    Tutup_Bulan: { id: 'periode', kolom: ['periode', 'ditutup_oleh', 'waktu', 'ringkasan_json'] },
    Log_Audit: { id: 'log_id', prefix: 'LOG', besar: true, kolom: ['log_id', 'waktu', 'user_id', 'peran', 'aksi', 'objek', 'nilai_lama', 'nilai_baru'] },
    Riwayat_Pengaturan: { id: 'rp_id', prefix: 'RP', kolom: ['rp_id', 'versi', 'bagian', 'data_json', 'oleh', 'waktu'], angka: ['versi'] }
  };

  /* ---------- 2. Konstanta bisnis ---------- */
  var NAMA_PERAN = { owner: 'Owner', admin: 'Admin', pelatih: 'Pelatih', ortu: 'Orang Tua' };
  var STATUS_HADIR = ['Hadir', 'Izin', 'Hangus'];
  var LOKASI = ['Kolam', 'Home Visit'];
  var NAMA_HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var FONT_KURASI = ['Plus Jakarta Sans', 'Inter', 'Manrope', 'DM Sans', 'Outfit', 'Poppins', 'Nunito Sans', 'Lexend', 'Sora', 'Sistem'];

  var ATURAN_BAWAAN = {
    sisa_sesi_perpanjangan: 'hangus',      // 'hangus' | 'dibawa'
    maks_sesi_dibawa: 2,
    masa_berlaku_hari: 0,                  // 0 = tanpa batas
    status_dihitung: ['Hadir', 'Hangus'],
    absensi_paket_habis: 'tolak'           // 'tolak' | 'sesi_lebih'
  };

  var TEMA_BAWAAN = {
    font_judul: 'Plus Jakarta Sans', font_isi: 'Inter', animasi: 'normal',
    warna: {
      primer: '#0369A1', aksen: '#0284C7', sidebar: '#1E2A4A', menu: '#A8B4CF', banner: '#075985',
      latar: '#F1F5F9', permukaan: '#FFFFFF', primer_muda: '#E0F2FE', teks: '#1E293B', teks2: '#475569',
      sukses: '#15803D', peringatan: '#B45309', bahaya: '#B91C1C'
    }
  };
  /* Warna kategori sesi tetap di kode (lolos uji kontras PRD 7.3) */
  var WARNA_KATEGORI = { Privat: '#1D4ED8', Couple: '#C2410C', Kelas: '#6D28D9', Trial: '#0F766E' };

  var PENGATURAN_BAWAAN = {
    identitas: { nama_app: 'Swim Academy', tagline: 'Sistem Terpadu Pelatihan & Absensi Renang', logo: '', favicon: '', kontak_admin: '', email_owner: '', alamat: '' },
    tema: TEMA_BAWAAN,
    absensi: { jam_batas: '22:00', batas_aktif: true },
    jenis_paket: ['Privat', 'Couple', 'Kelas', 'Trial'],
    sinkron: { status: 'Belum pernah', waktu: '', pesan: '', gagal_berturut: 0, versi: 0 },
    publik_versi: 1,
    hak_akses_versi: 1,
    /* Halaman masuk: slideshow kosong = ilustrasi bawaan di assets/ilustrasi/masuk-*.svg */
    login: { slides: [], headline: 'Disiplin di air, percaya diri di daratan.', subjudul: 'Pantau jadwal, absensi, dan perkembangan latihan renang dalam satu tempat.', durasi: 5000 }
  };
  var LOGIN_MAKS_SLIDE = 6;

  /* Katalog izin (PRD 3.4) + tambahan: analitik */
  var IZIN = [
    ['siswa.lihat', 'Melihat data siswa (sesuai batas data)', 'Siswa & Pendaftaran', 'apo', 'apo'],
    ['siswa.kelola', 'Menambah, mengubah, menonaktifkan siswa dan paket aktif', 'Siswa & Pendaftaran', 'a', 'a'],
    ['pendaftaran.link', 'Membuat dan mengirim link pendaftaran/perpanjangan', 'Siswa & Pendaftaran', 'a', 'a'],
    ['pendaftaran.verifikasi', 'Memverifikasi pendaftaran masuk', 'Siswa & Pendaftaran', 'a', 'a'],
    ['jadwal.lihat', 'Melihat jadwal (sesuai batas data)', 'Jadwal & Absensi', 'apo', 'apo'],
    ['jadwal.kelola', 'Mengelola jadwal semua pelatih', 'Jadwal & Absensi', 'a', 'a'],
    ['absensi.input', 'Menginput absensi dalam batas waktu', 'Jadwal & Absensi', 'ap', 'ap'],
    ['absensi.koreksi', 'Mengoreksi absensi setelah batas waktu (alasan wajib)', 'Jadwal & Absensi', 'a', 'a'],
    ['absensi.riwayat', 'Melihat sisa sesi dan riwayat kehadiran', 'Jadwal & Absensi', 'apo', 'apo'],
    ['absensi.atur_batas', 'Mengatur jam batas dan mengaktifkan/menonaktifkannya', 'Jadwal & Absensi', 'a', 'a'],
    ['absensi.buka_kunci', 'Membuka kunci absensi per pelatih dan tanggal', 'Jadwal & Absensi', 'a', 'a'],
    ['materi.lihat', 'Mencari dan membuka materi', 'Materi', 'ap', 'ap'],
    ['materi.kelola', 'Mengunggah dan mengatur materi', 'Materi', 'a', ''],
    ['kas.lihat', 'Melihat transaksi dan ringkasan kas', 'Keuangan', 'a', 'a'],
    ['kas.input', 'Menginput transaksi', 'Keuangan', 'a', 'a'],
    ['laporan.ekspor', 'Mengunduh Excel/PDF siswa, absensi, dan kas', 'Keuangan', 'a', 'a'],
    ['analitik.lihat', 'Melihat menu Analitik (pendapatan & pertumbuhan)', 'Keuangan', 'a', 'a'],
    ['honor.rekap_lihat', 'Melihat rekap honor semua pelatih beserta nominal', 'Keuangan', 'a', ''],
    ['honor.rekap_sendiri', 'Melihat rekap jumlah sesi sendiri', 'Keuangan', 'p', 'p'],
    ['honor.nominal_sendiri', 'Melihat nominal honor sendiri', 'Keuangan', 'p', ''],
    ['tutup_bulan', 'Menutup bulan', 'Keuangan', 'a', 'a'],
    ['pengaturan.tampilan', 'Identitas dan tema', 'Pengaturan', 'a', 'a'],
    ['pengaturan.master', 'Paket tanpa harga, kategori kas, data master', 'Pengaturan', 'a', 'a'],
    ['pengaturan.form', 'Form builder', 'Pengaturan', 'a', 'a'],
    ['pengaturan.sinkron', 'Sinkron ulang ke GitHub', 'Pengaturan', 'a', 'a'],
    ['akun.kelola', 'Mengelola akun Pelatih dan Orang Tua', 'Pengaturan', 'a', 'a']
  ].map(function (r) {
    var kode = { a: 'admin', p: 'pelatih', o: 'ortu' };
    return { k: r[0], arti: r[1], grup: r[2], boleh: r[3].split('').map(function (c) { return kode[c]; }), bawaan: r[4].split('').filter(Boolean).map(function (c) { return kode[c]; }) };
  });
  var IZIN_PETA = {}; IZIN.forEach(function (i) { IZIN_PETA[i.k] = i; });
  var INTI_OWNER = [
    'Mengubah rekening, harga paket, dan biaya tambahan', 'Mengubah tarif honor', 'Mengubah Aturan Bisnis',
    'Mengubah atau membatalkan transaksi kas', 'Mengubah Hak Akses peran', 'Membaca log audit',
    'Mengelola akun Admin dan Owner', 'Token GitHub & rahasia lain', 'Blok rekening & persetujuan data di form'
  ];


  /* ---------- 3. Utilitas umum ---------- */
  function Gagal(pesan, code, fields) { var e = new Error(pesan); e.__inti = true; e.code = code || 'VALIDATION'; e.fields = fields || null; return e; }
  function s(v) { return v == null ? '' : String(v).trim(); }
  function num(v) { var x = Number(v); return isFinite(x) ? x : 0; }
  function rp(v) { if (typeof v === 'number') return Math.round(v); var t = String(v == null ? '' : v), neg = /^\s*-/.test(t), d = t.replace(/[^\d]/g, ''); return d ? (neg ? -1 : 1) * Number(d) : 0; }
  function salin(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function gabung(dasar, atas) {
    var o = salin(dasar) || {};
    Object.keys(atas || {}).forEach(function (k) {
      if (atas[k] && typeof atas[k] === 'object' && !Array.isArray(atas[k]) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) o[k] = gabung(o[k], atas[k]);
      else o[k] = atas[k];
    });
    return o;
  }
  function jsonAman(t, d) { try { return t ? JSON.parse(t) : d; } catch (e) { return d; } }
  function unik(a) { var m = {}, o = []; a.forEach(function (x) { if (!m[x]) { m[x] = 1; o.push(x); } }); return o; }
  function jumlah(a, f) { return a.reduce(function (t, x) { return t + (f ? f(x) : x); }, 0); }
  function kelompok(a, f) { var m = {}; a.forEach(function (x) { var k = f(x); (m[k] = m[k] || []).push(x); }); return m; }
  function urut(a, f, turun) { return a.slice().sort(function (x, y) { var p = f(x), q = f(y); return (p < q ? -1 : p > q ? 1 : 0) * (turun ? -1 : 1); }); }
  function rupiah(v) { var x = Math.round(num(v)), t = String(Math.abs(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (x < 0 ? '-Rp' : 'Rp') + t; }
  function samaAman(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; var r = 0; for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

  /* Waktu: semua perhitungan memakai WIB (UTC+7) dari jam SERVER, bukan jam perangkat */
  var JAM7 = 7 * 3600e3;
  function p2(x) { return (x < 10 ? '0' : '') + x; }
  function bagWIB(ms) { var d = new Date(ms + JAM7); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), H: d.getUTCHours(), M: d.getUTCMinutes(), S: d.getUTCSeconds(), w: d.getUTCDay() }; }
  function tglWIB(ms) { var b = bagWIB(ms); return b.y + '-' + p2(b.m) + '-' + p2(b.d); }
  function waktuWIB(ms) { var b = bagWIB(ms); return tglWIB(ms) + ' ' + p2(b.H) + ':' + p2(b.M) + ':' + p2(b.S); }
  function msWIB(tgl, jam) {
    var a = String(tgl).split('-').map(Number), j = String(jam || '00:00:00').split(':').map(Number);
    return Date.UTC(a[0], (a[1] || 1) - 1, a[2] || 1, j[0] || 0, j[1] || 0, j[2] || 0) - JAM7;
  }
  function msDariWaktu(w) { if (!w) return 0; var p = String(w).split(/[ T]/); return msWIB(p[0], (p[1] || '00:00:00').slice(0, 8)); }
  function geserTgl(tgl, h) { return tglWIB(msWIB(tgl, '12:00:00') + h * 864e5); }
  function hariKe(tgl) { var w = new Date(msWIB(tgl, '12:00:00') + JAM7).getUTCDay(); return w === 0 ? 7 : w; }
  function tglValid(t) { return /^\d{4}-\d{2}-\d{2}$/.test(String(t)) && tglWIB(msWIB(t, '12:00:00')) === t; }
  function jamValid(j) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(j)); }
  function bulanValid(b) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(b)); }
  function bulanDari(t) { return String(t || '').slice(0, 7); }
  function geserBulan(b, k) { var a = b.split('-').map(Number), x = a[0] * 12 + (a[1] - 1) + k; return Math.floor(x / 12) + '-' + p2(x % 12 + 1); }
  function selisihHari(a, b) { return Math.round((msWIB(b, '12:00:00') - msWIB(a, '12:00:00')) / 864e5); }
  function tglIndo(t) { if (!tglValid(t)) return s(t); var a = t.split('-'); return Number(a[2]) + ' ' + NAMA_BULAN[Number(a[1]) - 1] + ' ' + a[0]; }
  function namaBulan(b) { var a = String(b).split('-'); return NAMA_BULAN[Number(a[1]) - 1] + ' ' + a[0]; }
  function usia(tglLahir, hariIni) {
    if (!tglValid(tglLahir)) return null;
    var a = tglLahir.split('-').map(Number), b = hariIni.split('-').map(Number), u = b[0] - a[0];
    if (b[1] < a[1] || (b[1] === a[1] && b[2] < a[2])) u--;
    return u;
  }
  function menitDari(j) { var a = String(j).split(':'); return Number(a[0]) * 60 + Number(a[1] || 0); }

  /* Nomor HP: simpan & tampil 08…, kirim 62… */
  function hp08(v) {
    var t = String(v == null ? '' : v).trim().replace(/\.0+$/, '').replace(/[^0-9+]/g, '').replace(/^\+/, '');
    if (!t) return '';
    if (t.indexOf('62') === 0) t = '0' + t.substring(2); else if (t.indexOf('8') === 0) t = '0' + t;
    return t;
  }
  function hp62(v) { var t = hp08(v); return t ? (t[0] === '0' ? '62' + t.substring(1) : t) : ''; }
  function hpValid(v) { return /^08\d{8,12}$/.test(hp08(v)); }
  function emailValid(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim()); }
  function isiTemplate(tpl, v) { return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] == null ? '' : String(v[k]); }); }

  /* Kontras WCAG */
  function luminans(hex) {
    var h = String(hex || '').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    var c = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function kontras(a, b) { var x = luminans(a), y = luminans(b); if (x == null || y == null) return 0; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /* Pasangan wajib (PRD 7.3) — ambang 4,5:1 */
  function ujiKontras(w) {
    var p = [
      ['Teks utama di latar', w.teks, w.latar], ['Teks utama di kartu', w.teks, w.permukaan], ['Teks utama di primer muda', w.teks, w.primer_muda],
      ['Teks sekunder di latar', w.teks2, w.latar], ['Teks sekunder di kartu', w.teks2, w.permukaan], ['Teks sekunder di primer muda', w.teks2, w.primer_muda],
      ['Teks putih di primer', '#FFFFFF', w.primer], ['Teks putih di sidebar', '#FFFFFF', w.sidebar], ['Teks putih di sukses', '#FFFFFF', w.sukses],
      ['Teks putih di peringatan', '#FFFFFF', w.peringatan], ['Teks putih di bahaya', '#FFFFFF', w.bahaya],
      ['Teks menu di sidebar', w.menu, w.sidebar], ['Teks putih di banner', '#FFFFFF', w.banner]
    ];
    Object.keys(WARNA_KATEGORI).forEach(function (k) { p.push(['Teks putih di lencana ' + k, '#FFFFFF', WARNA_KATEGORI[k]]); });
    return p.map(function (x) { var r = kontras(x[1], x[2]); return { pasangan: x[0], a: x[1], b: x[2], rasio: Math.round(r * 100) / 100, lolos: r >= 4.5 }; });
  }

  /* base64url untuk token (teks ASCII/UTF-8) */
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64e(str) {
    var b = unescape(encodeURIComponent(str)), o = '', i;
    for (i = 0; i < b.length; i += 3) {
      var n1 = b.charCodeAt(i), n2 = b.charCodeAt(i + 1), n3 = b.charCodeAt(i + 2), t = (n1 << 16) | ((n2 || 0) << 8) | (n3 || 0);
      o += B64[(t >> 18) & 63] + B64[(t >> 12) & 63] + (i + 1 < b.length ? B64[(t >> 6) & 63] : '') + (i + 2 < b.length ? B64[t & 63] : '');
    }
    return o;
  }
  function b64d(str) {
    var o = '', bits = 0, val = 0;
    for (var i = 0; i < str.length; i++) { var c = B64.indexOf(str[i]); if (c < 0) continue; val = (val << 6) | c; bits += 6; if (bits >= 8) { bits -= 8; o += String.fromCharCode((val >> bits) & 255); } }
    return decodeURIComponent(escape(o));
  }

  var POLA_RAHASIA = /(token|password|sandi|secret|rahasia|api[_-]?key|hash|salt|pin|no_rekening)/i;
  function redaksi(o, d) {
    d = d || 0; if (o === null || typeof o !== 'object' || d > 4) return o;
    if (Array.isArray(o)) return o.map(function (x) { return redaksi(x, d + 1); });
    var out = {}; Object.keys(o).forEach(function (k) { out[k] = POLA_RAHASIA.test(k) ? (k === 'no_rekening' ? samarRek(o[k]) : '[DISAMARKAN]') : redaksi(o[k], d + 1); });
    return out;
  }
  function samarRek(v) { var t = String(v || '').replace(/\D/g, ''); return t.length <= 4 ? '••••' : t.slice(0, 2) + '•'.repeat(Math.max(2, t.length - 4)) + t.slice(-2); }
  function samarkan(v) { v = String(v || ''); return !v ? '' : v.length <= 8 ? '••••••' : v.slice(0, 4) + '••••••' + v.slice(-3); }

  /* ---------- 4. Konteks & akses data ---------- */
  function buatKonteks(env, now) { return { env: env, db: env.db, now: now, hariIni: tglWIB(now), me: null, _peta: {}, _matriks: null, _email: [] }; }
  function semua(ctx, t, o) { return ctx.db.semua(t, o) || []; }
  function aktif(rows) { return rows.filter(function (r) { return r.aktif !== 'T'; }); }
  function petaDari(rows, k) { var m = {}; rows.forEach(function (r) { m[r[k]] = r; }); return m; }
  function peta(ctx, t) { return ctx._peta[t] || (ctx._peta[t] = petaDari(semua(ctx, t), SKEMA[t].id)); }
  function cari(ctx, t, id) { return id == null || id === '' ? null : peta(ctx, t)[id] || null; }
  function wajibAda(ctx, t, id, label) { var r = cari(ctx, t, id); if (!r) throw Gagal((label || 'Data') + ' tidak ditemukan.', 'NOT_FOUND'); return r; }
  function tambah(ctx, t, rows) { delete ctx._peta[t]; if (rows.length) ctx.db.tambah(t, rows); return rows; }
  function ubah(ctx, t, rows) { delete ctx._peta[t]; if (rows.length) ctx.db.ubah(t, rows); return rows; }
  function ganti(ctx, t, rows) { delete ctx._peta[t]; ctx.db.ganti(t, rows); return rows; }
  function idBaru(ctx, t) { var b = bagWIB(ctx.now); return (SKEMA[t].prefix || 'ID') + '-' + String(b.y).slice(2) + p2(b.m) + p2(b.d) + '-' + ctx.env.acak(5).toUpperCase(); }
  function kini(ctx) { return waktuWIB(ctx.now); }
  function oleh(ctx) { return ctx.me ? ctx.me.user_id : 'sistem'; }

  function audit(ctx, aksi, objek, lama, baru) {
    function r(v) { if (v == null || v === '') return ''; var x = typeof v === 'string' ? v : JSON.stringify(redaksi(v)); return x.length > 900 ? x.slice(0, 897) + '…' : x; }
    tambah(ctx, 'Log_Audit', [{ log_id: idBaru(ctx, 'Log_Audit'), waktu: kini(ctx), user_id: ctx.me ? ctx.me.user_id : '-', peran: ctx.me ? ctx.me.peran : 'publik', aksi: aksi, objek: objek || '', nilai_lama: r(lama), nilai_baru: r(baru) }]);
  }

  /* Pengaturan (key → JSON) */
  function atur(ctx, key) {
    var r = peta(ctx, 'Pengaturan')[key], b = PENGATURAN_BAWAAN[key];
    if (!r) return salin(b);
    var v = jsonAman(r.value, null);
    if (v == null) return salin(b);
    return b && typeof b === 'object' && !Array.isArray(b) ? gabung(b, v) : v;
  }
  function setAtur(ctx, key, val) {
    var ada = peta(ctx, 'Pengaturan')[key];
    var row = { key: key, value: JSON.stringify(val), versi: (ada ? num(ada.versi) : 0) + 1, updated_by: oleh(ctx), updated_at: kini(ctx) };
    if (ada) ubah(ctx, 'Pengaturan', [row]); else tambah(ctx, 'Pengaturan', [row]);
    return row.versi;
  }
  function aturan(ctx) {
    var m = peta(ctx, 'Aturan_Bisnis'), a = salin(ATURAN_BAWAAN), v = 0;
    Object.keys(a).forEach(function (k) { if (m[k]) { var x = jsonAman(m[k].value, null); if (x != null) a[k] = x; v = Math.max(v, num(m[k].versi)); } });
    a.versi = v || 1; return a;
  }
  function configTerkunci(ctx) { var m = peta(ctx, 'Config_Terkunci'); return { bank: m.bank ? m.bank.value : '', no_rekening: m.no_rekening ? m.no_rekening.value : '', atas_nama: m.atas_nama ? m.atas_nama.value : '' }; }

  /* ---------- 5. Hak akses (RBAC) ---------- */
  function matriks(ctx) {
    if (ctx._matriks) return ctx._matriks;
    var rows = semua(ctx, 'Hak_Akses'), m = { admin: {}, pelatih: {}, ortu: {} };
    if (!rows.length) IZIN.forEach(function (i) { i.bawaan.forEach(function (p) { m[p][i.k] = true; }); });
    else rows.forEach(function (r) { if (m[r.peran] && r.aktif === 'Y') m[r.peran][r.izin] = true; });
    /* batas peran ditegakkan saat BACA juga: sel yang tidak boleh diberikan selalu mati */
    Object.keys(m).forEach(function (p) { Object.keys(m[p]).forEach(function (k) { var d = IZIN_PETA[k]; if (!d || d.boleh.indexOf(p) < 0) delete m[p][k]; }); });
    return (ctx._matriks = m);
  }
  function punya(ctx, izin) { if (!ctx.me) return false; if (ctx.me.peran === 'owner') return true; return !!(matriks(ctx)[ctx.me.peran] || {})[izin]; }
  function wajibIzin(ctx, izin) { if (!punya(ctx, izin)) throw Gagal('Anda tidak memiliki izin untuk tindakan ini.', 'FORBIDDEN'); }
  function daftarIzin(ctx) { if (!ctx.me) return []; if (ctx.me.peran === 'owner') return IZIN.map(function (i) { return i.k; }); return Object.keys(matriks(ctx)[ctx.me.peran] || {}); }
  function wajibOwner(ctx) { if (!ctx.me || ctx.me.peran !== 'owner') throw Gagal('Hanya Owner yang dapat melakukan ini (Inti Owner).', 'FORBIDDEN'); }

  /* ---------- 6. Autentikasi ---------- */
  function hashRahasia(ctx, rahasia, salt) {
    var pep = ctx.env.rahasia('PEPPER') || 'swim-academy', h = String(rahasia);
    for (var i = 0; i < 300; i++) h = ctx.env.sha256(h + '|' + salt + '|' + pep);
    return h;
  }
  function profil(u) {
    return { user_id: u.user_id, nama: u.nama, peran: u.peran, username: u.username, coach_id: u.coach_id || '', siswa_ids: s(u.siswa_ids) ? s(u.siswa_ids).split(',') : [], kontak: u.kontak || '' };
  }
  function tokenBaru(ctx, u) {
    var body = b64e(JSON.stringify({ u: u.user_id, p: u.peran, v: num(u.versi_token), i: ctx.now, x: ctx.now + 12 * 3600e3 }));
    return body + '.' + ctx.env.hmac(body);
  }
  function verifikasiToken(ctx, token) {
    try {
      var parts = String(token || '').split('.');
      if (parts.length !== 2 || !samaAman(ctx.env.hmac(parts[0]), parts[1])) return null;
      var p = JSON.parse(b64d(parts[0]));
      if (!p.x || p.x < ctx.now) return null;
      var u = cari(ctx, 'Pengguna', p.u);
      if (!u || u.aktif === 'T' || u.peran !== p.p || num(u.versi_token) !== num(p.v)) return null;   // versi_token: cabut seketika
      return profil(u);
    } catch (e) { return null; }
  }
  function sesiDari(ctx, u) {
    ctx.me = profil(u);
    return { token: tokenBaru(ctx, u), me: ctx.me, izin: daftarIzin(ctx), hakVersi: atur(ctx, 'hak_akses_versi'), kedaluwarsa: ctx.now + 12 * 3600e3 };
  }
  function prosesLogin(ctx, u, rahasia, pesanSalah) {
    if (!u || u.aktif === 'T') { hashRahasia(ctx, rahasia, 'x'); throw Gagal(pesanSalah, 'AUTH_FAIL'); }
    var kunci = msDariWaktu(u.kunci_hingga);
    if (kunci > ctx.now) throw Gagal('Akses terkunci sementara karena 5 kali gagal. Coba lagi dalam ' + Math.ceil((kunci - ctx.now) / 60000) + ' menit.', 'LOCKED');
    if (!samaAman(hashRahasia(ctx, rahasia, u.salt), u.hash_sandi)) {
      var g = num(u.gagal_login) + 1, patch = { user_id: u.user_id, gagal_login: g };
      if (g >= 5) { patch.gagal_login = 0; patch.kunci_hingga = waktuWIB(ctx.now + 15 * 60000); }
      ubah(ctx, 'Pengguna', [patch]);
      throw Gagal(g >= 5 ? 'Terlalu banyak percobaan. Akses dikunci 15 menit.' : pesanSalah + (g >= 3 ? ' Sisa percobaan: ' + (5 - g) + '.' : ''), g >= 5 ? 'LOCKED' : 'AUTH_FAIL');
    }
    ubah(ctx, 'Pengguna', [{ user_id: u.user_id, gagal_login: 0, kunci_hingga: '', login_terakhir: kini(ctx) }]);
    var hasil = sesiDari(ctx, u);
    if (u.peran === 'owner' || u.peran === 'admin') audit(ctx, 'LOGIN', 'Pengguna:' + u.user_id, '', '');
    return hasil;
  }
  function svcMasuk(ctx, d) {
    var un = s(d.username).toLowerCase();
    if (!un || !d.sandi) throw Gagal('Isi username dan sandi.', 'VALIDATION', { username: !un ? 'Wajib diisi' : undefined, sandi: !d.sandi ? 'Wajib diisi' : undefined });
    var u = semua(ctx, 'Pengguna').filter(function (r) { return s(r.username).toLowerCase() === un && r.peran !== 'ortu'; })[0];
    return prosesLogin(ctx, u, String(d.sandi), 'Username atau sandi salah.');
  }
  function svcMasukOrtu(ctx, d) {
    var kode = s(d.kode).toUpperCase(), pin = s(d.pin);
    if (!kode || !/^\d{6}$/.test(pin)) throw Gagal('Isi kode akses dan PIN 6 angka.', 'VALIDATION', { kode: !kode ? 'Wajib diisi' : undefined, pin: !/^\d{6}$/.test(pin) ? 'PIN 6 angka' : undefined });
    var sw = semua(ctx, 'Siswa').filter(function (r) { return s(r.kode_akses).toUpperCase() === kode; })[0];
    var u = sw ? semua(ctx, 'Pengguna').filter(function (r) { return r.peran === 'ortu' && (',' + r.siswa_ids + ',').indexOf(',' + sw.siswa_id + ',') >= 0; })[0] : null;
    return prosesLogin(ctx, u, pin, 'Kode akses atau PIN salah.');
  }
  function svcSaya(ctx) {
    var u = cari(ctx, 'Pengguna', ctx.me.user_id);
    return { me: ctx.me, izin: daftarIzin(ctx), hakVersi: atur(ctx, 'hak_akses_versi'), publik: snapshotPublik(ctx), versiData: versiData(ctx), login_terakhir: u ? u.login_terakhir : '' };
  }
  function svcGantiSandi(ctx, d) {
    var u = wajibAda(ctx, 'Pengguna', ctx.me.user_id, 'Akun');
    if (u.peran === 'ortu') throw Gagal('PIN orang tua diatur oleh Admin.', 'FORBIDDEN');
    if (!samaAman(hashRahasia(ctx, String(d.lama || ''), u.salt), u.hash_sandi)) throw Gagal('Sandi lama salah.', 'VALIDATION', { lama: 'Sandi lama salah' });
    validasiSandi(d.baru);
    var salt = ctx.env.acak(16);
    ubah(ctx, 'Pengguna', [{ user_id: u.user_id, salt: salt, hash_sandi: hashRahasia(ctx, String(d.baru), salt), versi_token: num(u.versi_token) + 1 }]);
    audit(ctx, 'GANTI_SANDI', 'Pengguna:' + u.user_id, '', '');
    u = cari(ctx, 'Pengguna', u.user_id);
    return sesiDari(ctx, u);
  }
  function validasiSandi(p) { p = String(p || ''); if (p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p)) throw Gagal('Sandi minimal 8 karakter berisi huruf dan angka.', 'VALIDATION', { baru: 'Minimal 8 karakter, huruf + angka' }); }
  function sandiAcak(ctx) { var t = ctx.env.acak(10); return /\d/.test(t) && /[A-Za-z]/.test(t) ? t : t.slice(0, 8) + '7k'; }
  function pinAcak(ctx) { var t = ''; while (t.length < 6) { var c = ctx.env.acak(4).replace(/\D/g, ''); t += c; } return t.slice(0, 6); }

  /* ---------- 7. Master, pengaturan, form builder, snapshot publik ---------- */
  var FORM_BAWAAN = [
    { kunci: 'nama', label: 'Nama lengkap siswa', tipe: 'teks', wajib: true, inti: true },
    { kunci: 'tgl_lahir', label: 'Tanggal lahir', tipe: 'tanggal', wajib: true, inti: true },
    { kunci: 'kategori', label: 'Kategori', tipe: 'pilihan', opsi: ['Anak', 'Dewasa'], wajib: true, inti: true, bantu: 'Terisi otomatis dari tanggal lahir (15 tahun ke atas = Dewasa), boleh diubah.' },
    { kunci: 'jenis_kelamin', label: 'Jenis kelamin', tipe: 'pilihan', opsi: ['Laki-laki', 'Perempuan'], wajib: true, inti: true },
    { kunci: 'nama_ortu', label: 'Nama orang tua / wali', tipe: 'teks', wajib: true, inti: true, bantu: 'Untuk peserta dewasa, isi nama sendiri.' },
    { kunci: 'kontak', label: 'No. WhatsApp orang tua / wali', tipe: 'teks', wajib: true, inti: true, bantu: 'Kode akses portal orang tua dikirim ke nomor ini.' },
    { kunci: 'email', label: 'Email', tipe: 'teks', wajib: false, inti: true },
    { kunci: 'paket', label: 'Paket latihan', tipe: 'dropdown', sumber: 'paket', wajib: true, inti: true },
    { kunci: 'kolam', label: 'Lokasi kolam', tipe: 'dropdown', sumber: 'kolam', wajib: true, inti: true, bantu: 'Untuk Home Visit, pilih kolam terdekat sebagai acuan area.' },
    { kunci: 'jam', label: 'Hari & jam yang diinginkan', tipe: 'teks', wajib: true, inti: true, bantu: 'Contoh: Sabtu 08:00' },
    { kunci: 'catatan_kesehatan', label: 'Catatan kesehatan / hal yang perlu diketahui pelatih', tipe: 'area', wajib: false },
    { kunci: '_harga', tipe: 'blok_harga', tetap: true, label: 'Ringkasan biaya' },
    { kunci: '_rekening', tipe: 'blok_rekening', tetap: true, label: 'Rekening resmi' },
    { kunci: 'bukti', label: 'Bukti transfer', tipe: 'berkas', wajib: false, inti: true, bantu: 'JPG, PNG, atau PDF, maksimal 5 MB.' },
    { kunci: '_persetujuan', tipe: 'blok_persetujuan', tetap: true, label: 'Persetujuan orang tua / wali' }
  ];
  var TEKS_PERSETUJUAN = 'Saya sebagai orang tua/wali menyetujui data anak saya (nama, tanggal lahir, kontak, catatan kesehatan, dan kehadiran) disimpan dan digunakan oleh {institusi} untuk pendaftaran, penjadwalan, absensi, dan komunikasi latihan.';
  var TIPE_FIELD = ['teks', 'angka', 'tanggal', 'pilihan', 'dropdown', 'berkas', 'area'];

  function kategoriSesi(p) { return p ? (p.lokasi === 'Home Visit' ? 'HV ' : '') + p.jenis : ''; }
  function daftarKategori(ctx) {
    var j = atur(ctx, 'jenis_paket'), o = j.slice();
    j.forEach(function (x) { if (x !== 'Trial') o.push('HV ' + x); });
    return o;
  }
  function paketUrut(ctx) { return urut(aktif(semua(ctx, 'Paket')), function (p) { return num(p.urutan) * 1000 + 0; }); }
  function hargaBerlaku(ctx, paketId, tgl) {
    var rows = semua(ctx, 'Harga_Paket').filter(function (r) { return r.paket_id === paketId && s(r.berlaku_mulai) <= tgl; });
    var r = urut(rows, function (x) { return x.berlaku_mulai + x.updated_at; }, true)[0];
    return r ? { harga: num(r.harga), biaya_tambahan: num(r.biaya_tambahan_per_peserta), berlaku_mulai: r.berlaku_mulai } : null;
  }
  function pencariTarif(ctx) {
    var grup = kelompok(semua(ctx, 'Tarif_Honor').filter(function (r) { return r.aktif !== 'T'; }), function (r) { return r.kategori_sesi; });
    Object.keys(grup).forEach(function (k) { grup[k] = urut(grup[k], function (r) { return r.berlaku_mulai; }, true); });
    return function (kategori, coachId, tgl) {
      var g = grup[kategori] || [], k = null, u = null;
      for (var i = 0; i < g.length; i++) {
        if (g[i].berlaku_mulai > tgl) continue;
        if (!k && g[i].coach_id && g[i].coach_id === coachId) k = g[i];
        if (!u && !g[i].coach_id) u = g[i];
      }
      var r = k || u; return r ? { tarif: num(r.tarif), khusus: !!k } : { tarif: 0, khusus: false };
    };
  }

  function formAktif(ctx) {
    var r = urut(semua(ctx, 'Form_Def').filter(function (x) { return x.status === 'aktif'; }), function (x) { return num(x.versi); }, true)[0];
    return r ? { form_id: r.form_id, versi: num(r.versi), skema: normalisasiForm(jsonAman(r.skema_json, FORM_BAWAAN)) } : { form_id: 'FRM-BAWAAN', versi: 1, skema: salin(FORM_BAWAAN) };
  }
  /* Blok tetap (rekening, harga, persetujuan) & kolom inti tidak bisa dihapus/disembunyikan/diubah lewat builder */
  function normalisasiForm(skema) {
    if (!Array.isArray(skema)) throw Gagal('Format form tidak valid.');
    var bawaan = petaDari(FORM_BAWAAN, 'kunci'), lihat = {}, out = [];
    skema.forEach(function (f) {
      if (!f || typeof f !== 'object') return;
      var k = s(f.kunci).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40);
      if (!k || lihat[k]) return; lihat[k] = 1;
      var b = bawaan[k];
      if (b && b.tetap) { out.push(salin(b)); return; }
      if (b && b.inti) {
        out.push({ kunci: k, label: s(f.label).slice(0, 80) || b.label, tipe: b.tipe, opsi: b.opsi, sumber: b.sumber, inti: true,
          wajib: b.wajib ? true : !!f.wajib, bantu: s(f.bantu).slice(0, 200) });
        return;
      }
      var tipe = TIPE_FIELD.indexOf(f.tipe) >= 0 ? f.tipe : 'teks';
      var o = { kunci: k, label: s(f.label).slice(0, 80) || k, tipe: tipe, wajib: !!f.wajib, bantu: s(f.bantu).slice(0, 200) };
      if (tipe === 'pilihan' || tipe === 'dropdown') { o.opsi = (Array.isArray(f.opsi) ? f.opsi : String(f.opsi || '').split('\n')).map(s).filter(Boolean).slice(0, 30); if (!o.opsi.length) throw Gagal('Kolom "' + o.label + '" butuh minimal satu pilihan.'); }
      out.push(o);
    });
    FORM_BAWAAN.forEach(function (b, i) { if ((b.tetap || b.inti) && !lihat[b.kunci]) out.splice(Math.min(i, out.length), 0, salin(b)); });
    return out;
  }

  function snapshotPublik(ctx) {
    var id = atur(ctx, 'identitas'), tema = atur(ctx, 'tema'), f = formAktif(ctx);
    return {
      versi: num(atur(ctx, 'publik_versi')),
      nama_app: id.nama_app, tagline: id.tagline, logo: id.logo, favicon: id.favicon, kontak_admin: id.kontak_admin,
      tema: { font_judul: tema.font_judul, font_isi: tema.font_isi, animasi: tema.animasi, warna: tema.warna },
      jenis_paket: atur(ctx, 'jenis_paket'),
      paket: paketUrut(ctx).map(function (p) { return { paket_id: p.paket_id, nama: p.nama, jenis: p.jenis, lokasi: p.lokasi, jumlah_sesi: num(p.jumlah_sesi), maks_peserta: num(p.maks_peserta) || 1, kategori: kategoriSesi(p) }; }),
      form: { versi: f.versi, skema: f.skema.map(function (x) { return x.tetap ? { kunci: x.kunci, tipe: x.tipe, tetap: true, label: x.label } : x; }) },
      login: (function (l) { return { headline: l.headline, subjudul: l.subjudul, durasi: num(l.durasi) || 5000, slides: (l.slides || []).slice(0, LOGIN_MAKS_SLIDE) }; })(atur(ctx, 'login'))
    };
  }
  var KUNCI_PUBLIK = ['versi', 'nama_app', 'tagline', 'logo', 'favicon', 'kontak_admin', 'tema', 'jenis_paket', 'paket', 'form', 'login'];
  var KATA_TERLARANG = /(rekening|harga|tarif|nominal|honor)/i;
  /* Pengaman sebelum dispatch: kunci di luar whitelist / nilai rekening / nominal harga → tolak */
  function cekSnapshot(ctx, snap) {
    var luar = Object.keys(snap).filter(function (k) { return KUNCI_PUBLIK.indexOf(k) < 0; });
    if (luar.length) return { ok: false, pesan: 'Kunci di luar whitelist: ' + luar.join(', ') };
    var rek = configTerkunci(ctx).no_rekening.replace(/\D/g, ''), harga = {};
    semua(ctx, 'Harga_Paket').forEach(function (r) { if (num(r.harga) >= 1000) harga[num(r.harga)] = 1; if (num(r.biaya_tambahan_per_peserta) >= 1000) harga[num(r.biaya_tambahan_per_peserta)] = 1; });
    var masalah = null;
    (function jelajah(o, jalur) {
      if (masalah || o == null) return;
      if (typeof o === 'object') { Object.keys(o).forEach(function (k) { if (!Array.isArray(o) && KATA_TERLARANG.test(k)) masalah = 'Nama kunci terlarang: ' + jalur + k; jelajah(o[k], jalur + k + '.'); }); return; }
      var t = String(o), d = t.replace(/\D/g, '');
      if (rek.length >= 5 && d.length >= 5 && d.indexOf(rek) >= 0) masalah = 'Nilai sama dengan nomor rekening di ' + jalur;
      if (typeof o === 'number' && harga[o]) masalah = 'Nilai sama dengan nominal harga di ' + jalur;
    })(snap, '');
    return masalah ? { ok: false, pesan: masalah } : { ok: true };
  }
  function naikkanPublik(ctx) { var v = num(atur(ctx, 'publik_versi')) + 1; setAtur(ctx, 'publik_versi', v); return v; }
  function picuSinkron(ctx, alasan) {
    var st = atur(ctx, 'sinkron'), snap = snapshotPublik(ctx), cek = cekSnapshot(ctx, snap);
    st.waktu = kini(ctx); st.versi = snap.versi;
    if (!cek.ok) { st.status = 'Gagal'; st.pesan = 'Ditolak server: ' + cek.pesan; audit(ctx, 'SINKRON_DITOLAK', 'Snapshot', '', cek.pesan); setAtur(ctx, 'sinkron', st); return st; }
    var r = ctx.env.dispatchGitHub ? ctx.env.dispatchGitHub({ versi: snap.versi, alasan: alasan }) : { belumAtur: true };
    if (r.belumAtur) { st.status = 'Belum dikonfigurasi'; st.pesan = 'Isi GITHUB_TOKEN & GITHUB_REPO di Script Properties. Pengaturan tetap dipakai langsung dari backend.'; }
    else if (!r.ok) {
      st.status = 'Gagal'; st.pesan = r.pesan || 'Dispatch gagal'; st.gagal_berturut = num(st.gagal_berturut) + 1;
      if (st.gagal_berturut > 3) emailOwner(ctx, 'Sinkron GitHub gagal', 'Sinkron pengaturan ke GitHub gagal ' + st.gagal_berturut + ' kali berturut-turut. Pesan terakhir: ' + st.pesan);
    } else if (r.langsung) { st.status = 'Tersinkron'; st.pesan = 'Snapshot v' + snap.versi + ' dipublikasikan.'; st.gagal_berturut = 0; }
    else { st.status = 'Menunggu publikasi'; st.pesan = alasan || 'Menunggu GitHub Actions'; }
    setAtur(ctx, 'sinkron', st);
    return st;
  }
  function svcSyncAck(ctx, d) {
    var rahasia = ctx.env.rahasia('SYNC_SECRET');
    if (!rahasia || !samaAman(String(d.secret || ''), rahasia)) throw Gagal('Secret sinkron tidak cocok.', 'FORBIDDEN');
    var st = atur(ctx, 'sinkron'), okk = d.status === 'success';
    st.status = okk ? 'Tersinkron' : 'Gagal'; st.waktu = kini(ctx); st.pesan = s(d.pesan).slice(0, 300) || (okk ? 'Deploy selesai.' : 'Workflow gagal.');
    st.gagal_berturut = okk ? 0 : num(st.gagal_berturut) + 1;
    if (!okk && st.gagal_berturut > 3) emailOwner(ctx, 'Sinkron GitHub gagal', 'Sinkron pengaturan ke GitHub gagal ' + st.gagal_berturut + ' kali berturut-turut. Pesan terakhir: ' + st.pesan);
    setAtur(ctx, 'sinkron', st);
    return { status: st.status };
  }
  function svcPubConfig(ctx) { return snapshotPublik(ctx); }

  function bisaAtur(ctx) { return { tampilan: punya(ctx, 'pengaturan.tampilan'), master: punya(ctx, 'pengaturan.master'), form: punya(ctx, 'pengaturan.form'), sinkron: punya(ctx, 'pengaturan.sinkron'), batas: punya(ctx, 'absensi.atur_batas'), owner: ctx.me.peran === 'owner' }; }
  function svcAturAmbil(ctx) {
    var b = bisaAtur(ctx);
    if (!b.tampilan && !b.master && !b.form && !b.sinkron && !b.batas) throw Gagal('Anda tidak memiliki izin pengaturan.', 'FORBIDDEN');
    var tema = atur(ctx, 'tema'), f = formAktif(ctx);
    return {
      bisa: b, identitas: atur(ctx, 'identitas'), tema: tema, temaBawaan: TEMA_BAWAAN, kontras: ujiKontras(tema.warna), fontKurasi: FONT_KURASI,
      absensi: atur(ctx, 'absensi'), jenis_paket: atur(ctx, 'jenis_paket'), login: atur(ctx, 'login'), loginMaks: LOGIN_MAKS_SLIDE, sinkron: atur(ctx, 'sinkron'), publik_versi: atur(ctx, 'publik_versi'),
      master: {
        kolam: semua(ctx, 'Kolam'), pelatih: semua(ctx, 'Pelatih'), kategori_kas: semua(ctx, 'Kategori_Kas'),
        paket: urut(semua(ctx, 'Paket'), function (p) { return num(p.urutan); }).map(function (p) { var o = salin(p); o.kategori = kategoriSesi(p); return o; })
      },
      form: { versi: f.versi, skema: f.skema, teks_persetujuan: isiTemplate(TEKS_PERSETUJUAN.replace('{institusi}', '{nama}'), { nama: atur(ctx, 'identitas').nama_app }), tipe: TIPE_FIELD },
      riwayat: urut(semua(ctx, 'Riwayat_Pengaturan'), function (r) { return r.waktu; }, true).slice(0, 10).map(function (r) { return { rp_id: r.rp_id, versi: r.versi, bagian: r.bagian, oleh: namaPengguna(ctx, r.oleh), waktu: r.waktu }; })
    };
  }
  function namaPengguna(ctx, id) { var u = cari(ctx, 'Pengguna', id); return u ? u.nama : (id || '-'); }
  function catatRiwayat(ctx, bagian, data) {
    tambah(ctx, 'Riwayat_Pengaturan', [{ rp_id: idBaru(ctx, 'Riwayat_Pengaturan'), versi: num(atur(ctx, 'publik_versi')), bagian: bagian, data_json: JSON.stringify(data), oleh: oleh(ctx), waktu: kini(ctx) }]);
  }
  function validasiIdentitas(ctx, v, lama) {
    var o = gabung(lama, {}), f = {};
    o.nama_app = s(v.nama_app).slice(0, 60); if (!o.nama_app) f.nama_app = 'Nama aplikasi wajib diisi';
    o.tagline = s(v.tagline).slice(0, 120); o.alamat = s(v.alamat).slice(0, 200);
    o.kontak_admin = v.kontak_admin ? hp08(v.kontak_admin) : ''; if (o.kontak_admin && !hpValid(o.kontak_admin)) f.kontak_admin = 'Nomor WA tidak valid';
    if (ctx.me.peran === 'owner') { o.email_owner = s(v.email_owner); if (o.email_owner && !emailValid(o.email_owner)) f.email_owner = 'Email tidak valid'; }
    if (v.logo !== undefined && (v.logo === '' || lama.logo === v.logo)) o.logo = v.logo;
    if (v.favicon !== undefined && (v.favicon === '' || lama.favicon === v.favicon)) o.favicon = v.favicon;
    if (Object.keys(f).length) throw Gagal('Periksa kembali isian identitas.', 'VALIDATION', f);
    return o;
  }
  function validasiTema(v) {
    var o = salin(TEMA_BAWAAN), f = {};
    if (FONT_KURASI.indexOf(v.font_judul) >= 0) o.font_judul = v.font_judul; else f.font_judul = 'Pilih dari daftar';
    if (FONT_KURASI.indexOf(v.font_isi) >= 0) o.font_isi = v.font_isi; else f.font_isi = 'Pilih dari daftar';
    o.animasi = ['normal', 'kurang', 'mati'].indexOf(v.animasi) >= 0 ? v.animasi : 'normal';
    Object.keys(o.warna).forEach(function (k) { var w = s((v.warna || {})[k]).toUpperCase(); if (/^#[0-9A-F]{6}$/.test(w)) o.warna[k] = w; else f['warna_' + k] = 'Kode warna #RRGGBB'; });
    if (Object.keys(f).length) throw Gagal('Periksa kembali isian tema.', 'VALIDATION', f);
    var uji = ujiKontras(o.warna).filter(function (x) { return !x.lolos; });
    if (uji.length) {
      var e = Gagal('Kontras warna kurang dari 4,5:1 (WCAG AA): ' + uji.map(function (x) { return x.pasangan + ' ' + String(x.rasio).replace('.', ',') + ':1'; }).join('; ') + '.', 'VALIDATION');
      e.data = uji; throw e;
    }
    return o;
  }
  function svcAturSimpan(ctx, d) {
    var bagian = d.bagian, lama, baru;
    if (bagian === 'identitas') { wajibIzin(ctx, 'pengaturan.tampilan'); lama = atur(ctx, 'identitas'); baru = validasiIdentitas(ctx, d.nilai || {}, lama); }
    else if (bagian === 'login') { wajibIzin(ctx, 'pengaturan.tampilan'); lama = atur(ctx, 'login'); baru = validasiLogin(ctx, d.nilai || {}); }
    else if (bagian === 'tema') { wajibIzin(ctx, 'pengaturan.tampilan'); lama = atur(ctx, 'tema'); baru = d.bawaan ? salin(TEMA_BAWAAN) : validasiTema(d.nilai || {}); }
    else if (bagian === 'jenis_paket') {
      wajibIzin(ctx, 'pengaturan.master'); lama = atur(ctx, 'jenis_paket');
      baru = unik((d.nilai || []).map(function (x) { return s(x).slice(0, 24); }).filter(Boolean));
      lama.forEach(function (j) { if (baru.indexOf(j) < 0 && aktif(semua(ctx, 'Paket')).some(function (p) { return p.jenis === j; })) throw Gagal('Jenis "' + j + '" masih dipakai paket aktif. Nonaktifkan paketnya dulu.'); });
      if (!baru.length) throw Gagal('Minimal satu jenis paket.');
    } else throw Gagal('Bagian pengaturan tidak dikenal.');
    setAtur(ctx, bagian, baru);
    var v = naikkanPublik(ctx);
    catatRiwayat(ctx, bagian, baru);
    audit(ctx, 'PENGATURAN', bagian, lama, baru);
    var st = picuSinkron(ctx, 'Perubahan ' + bagian);
    return { bagian: bagian, nilai: baru, versi: v, sinkron: st, kontras: bagian === 'tema' ? ujiKontras(baru.warna) : null };
  }
  function svcUnggahIdentitas(ctx, d) {
    wajibIzin(ctx, 'pengaturan.tampilan');
    var b = d.berkas || {}, jenis = d.jenis === 'favicon' ? 'favicon' : 'logo';
    var okMime = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (okMime.indexOf(b.mime) < 0 || !/\.(png|svg|ico)$/i.test(s(b.nama))) throw Gagal('Format harus PNG, SVG, atau ICO.', 'VALIDATION', { [jenis]: 'PNG/SVG/ICO' });
    if (Math.floor(String(b.base64 || '').length * 3 / 4) > 1024 * 1024) throw Gagal('Ukuran maksimal 1 MB.', 'VALIDATION', { [jenis]: 'Maks 1 MB' });
    var f = ctx.env.simpanBerkas({ nama: jenis + '-' + Date.now() + '.' + s(b.nama).split('.').pop().toLowerCase(), mime: b.mime, base64: b.base64, folder: 'Logo', publik: true });
    var id = atur(ctx, 'identitas'), lama = id[jenis]; id[jenis] = f.url;
    setAtur(ctx, 'identitas', id); naikkanPublik(ctx); catatRiwayat(ctx, 'identitas', id);
    audit(ctx, 'PENGATURAN', 'identitas.' + jenis, lama, f.url);
    return { url: f.url, sinkron: picuSinkron(ctx, 'Perubahan ' + jenis) };
  }
  function svcAturKembalikan(ctx, d) {
    var r = wajibAda(ctx, 'Riwayat_Pengaturan', d.rp_id, 'Versi');
    return svcAturSimpan(ctx, { bagian: r.bagian, nilai: jsonAman(r.data_json, {}) });
  }
  function svcSinkronUlang(ctx) { wajibIzin(ctx, 'pengaturan.sinkron'); return picuSinkron(ctx, 'Sinkron ulang manual'); }

  var MASTER_FIELD = {
    Kolam: ['nama_resmi', 'singkatan', 'alamat', 'aktif'],
    Pelatih: ['nama', 'jenis_kelamin', 'kontak', 'lisensi', 'aktif'],
    Paket: ['nama', 'jenis', 'lokasi', 'jumlah_sesi', 'peserta_termasuk', 'maks_peserta', 'durasi_menit', 'urutan', 'aktif'],
    Kategori_Kas: ['nama', 'tipe', 'aktif']
  };
  function svcMasterSimpan(ctx, d) {
    wajibIzin(ctx, 'pengaturan.master');
    var t = d.tabel, fields = MASTER_FIELD[t]; if (!fields) throw Gagal('Tabel master tidak dikenal.');
    var x = d.baris || {}, idk = SKEMA[t].id, lama = x[idk] ? wajibAda(ctx, t, x[idk], 'Data') : null, o = {}, f = {};
    fields.forEach(function (k) { if (x[k] !== undefined) o[k] = typeof x[k] === 'string' ? s(x[k]) : x[k]; });
    o.aktif = o.aktif === 'T' || o.aktif === false ? 'T' : 'Y';
    if (t === 'Kolam') { if (!o.nama_resmi) f.nama_resmi = 'Wajib'; o.singkatan = s(o.singkatan).toUpperCase().slice(0, 8); if (!o.singkatan) f.singkatan = 'Wajib (maks 8)'; }
    if (t === 'Pelatih') { if (!o.nama) f.nama = 'Wajib'; if (['L', 'P'].indexOf(o.jenis_kelamin) < 0) f.jenis_kelamin = 'Pilih L/P'; if (o.kontak) { o.kontak = hp08(o.kontak); if (!hpValid(o.kontak)) f.kontak = 'Nomor tidak valid'; } }
    if (t === 'Paket') {
      if (!o.nama) f.nama = 'Wajib';
      if (atur(ctx, 'jenis_paket').indexOf(o.jenis) < 0) f.jenis = 'Pilih jenis';
      if (LOKASI.indexOf(o.lokasi) < 0) f.lokasi = 'Pilih lokasi';
      if (o.jenis === 'Trial' && o.lokasi === 'Home Visit') f.lokasi = 'Trial hanya di kolam';
      ['jumlah_sesi', 'peserta_termasuk', 'maks_peserta', 'durasi_menit', 'urutan'].forEach(function (k) { o[k] = Math.round(num(o[k])); });
      if (o.jumlah_sesi < 1 || o.jumlah_sesi > 100) f.jumlah_sesi = '1–100';
      if (o.peserta_termasuk < 1) o.peserta_termasuk = 1;
      if (o.maks_peserta < o.peserta_termasuk) o.maks_peserta = o.peserta_termasuk;
      if (!o.durasi_menit) o.durasi_menit = 60;
      if (x.harga !== undefined || x.biaya_tambahan !== undefined) throw Gagal('Harga hanya bisa diubah Owner di halaman Harga, Tarif & Aturan.', 'FORBIDDEN');
    }
    if (t === 'Kategori_Kas') {
      if (!o.nama) f.nama = 'Wajib'; if (['Pemasukan', 'Pengeluaran'].indexOf(o.tipe) < 0) f.tipe = 'Pilih tipe';
      if (lama && lama.sistem === 'Y') { o.nama = lama.nama; o.tipe = lama.tipe; o.aktif = 'Y'; }
      else if (o.nama && semua(ctx, 'Kategori_Kas').some(function (k) { return k.kategori_id !== (lama || {}).kategori_id && k.tipe === o.tipe && s(k.nama).toLowerCase() === o.nama.toLowerCase(); })) f.nama = 'Kategori "' + o.nama + '" sudah ada';
      o.nama = s(o.nama).slice(0, 40);
    }
    if (Object.keys(f).length) throw Gagal('Periksa kembali isian.', 'VALIDATION', f);
    if (lama) { o[idk] = lama[idk]; ubah(ctx, t, [o]); } else { o[idk] = idBaru(ctx, t); if (t === 'Kategori_Kas') o.sistem = 'T'; tambah(ctx, t, [o]); }
    audit(ctx, lama ? 'MASTER_UBAH' : 'MASTER_TAMBAH', t + ':' + o[idk], lama, o);
    var st = null; if (t === 'Paket') { naikkanPublik(ctx); st = picuSinkron(ctx, 'Perubahan paket'); }
    return { baris: cari(ctx, t, o[idk]), sinkron: st };
  }
  function svcFormSimpan(ctx, d) {
    wajibIzin(ctx, 'pengaturan.form');
    var skema = d.bawaan ? salin(FORM_BAWAAN) : normalisasiForm(d.skema), lama = formAktif(ctx);
    var rows = semua(ctx, 'Form_Def').filter(function (r) { return r.status === 'aktif'; }).map(function (r) { return { form_id: r.form_id, status: 'arsip' }; });
    ubah(ctx, 'Form_Def', rows);
    var baru = { form_id: idBaru(ctx, 'Form_Def'), versi: lama.versi + 1, skema_json: JSON.stringify(skema), status: 'aktif', updated_by: oleh(ctx), updated_at: kini(ctx) };
    tambah(ctx, 'Form_Def', [baru]);
    naikkanPublik(ctx); catatRiwayat(ctx, 'form', skema);
    audit(ctx, 'FORM_BUILDER', 'Form v' + baru.versi, 'v' + lama.versi, skema.map(function (x) { return x.kunci; }).join(','));
    return { versi: baru.versi, skema: skema, sinkron: picuSinkron(ctx, 'Perubahan form pendaftaran') };
  }

  /* ---------- 8. Halaman Owner: Harga, Tarif & Aturan; Hak Akses; Akun; Log ---------- */
  function svcHargaAmbil(ctx) {
    var owner = ctx.me.peran === 'owner';
    if (!owner && ctx.me.peran !== 'admin') throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
    var hariIni = ctx.hariIni, cariTarif = pencariTarif(ctx);
    var o = {
      bolehUbah: owner, rekening: configTerkunci(ctx), aturan: aturan(ctx), aturanBawaan: ATURAN_BAWAAN,
      paket: urut(semua(ctx, 'Paket'), function (p) { return num(p.urutan); }).map(function (p) {
        var h = hargaBerlaku(ctx, p.paket_id, hariIni) || { harga: 0, biaya_tambahan: 0, berlaku_mulai: '' };
        return { paket_id: p.paket_id, nama: p.nama, kategori: kategoriSesi(p), jenis: p.jenis, jumlah_sesi: num(p.jumlah_sesi), peserta_termasuk: num(p.peserta_termasuk) || 1, aktif: p.aktif, harga: h.harga, biaya_tambahan: h.biaya_tambahan, berlaku_mulai: h.berlaku_mulai };
      }),
      riwayatVersi: urut(semua(ctx, 'Log_Audit', { ekor: 1500 }).filter(function (r) { return /^(REKENING|HARGA|TARIF|ATURAN)/.test(r.aksi); }), function (r) { return r.waktu; }, true).slice(0, 10)
        .map(function (r) { return { waktu: r.waktu, aksi: r.aksi, oleh: namaPengguna(ctx, r.user_id), objek: r.objek }; })
    };
    if (owner) {
      o.kategori = daftarKategori(ctx);
      o.tarif = o.kategori.map(function (k) { var t = cariTarif(k, '', hariIni); return { kategori_sesi: k, tarif: t.tarif }; });
      o.tarifKhusus = semua(ctx, 'Tarif_Honor').filter(function (r) { return r.coach_id && r.aktif !== 'T'; }).map(function (r) { var c = cari(ctx, 'Pelatih', r.coach_id); return { tarif_id: r.tarif_id, kategori_sesi: r.kategori_sesi, coach_id: r.coach_id, nama_pelatih: c ? c.nama : r.coach_id, tarif: num(r.tarif), berlaku_mulai: r.berlaku_mulai }; });
      o.pelatih = aktif(semua(ctx, 'Pelatih')).map(function (c) { return { coach_id: c.coach_id, nama: c.nama }; });
    }
    return o;
  }
  function svcRekeningSimpan(ctx, d) {
    var bank = s(d.bank).slice(0, 60), no = s(d.no_rekening).replace(/[^\d-]/g, ''), an = s(d.atas_nama).slice(0, 80), f = {};
    if (!bank) f.bank = 'Wajib'; if (no.replace(/\D/g, '').length < 6) f.no_rekening = 'Minimal 6 digit'; if (!an) f.atas_nama = 'Wajib';
    if (Object.keys(f).length) throw Gagal('Periksa kembali isian rekening.', 'VALIDATION', f);
    var lama = configTerkunci(ctx), m = peta(ctx, 'Config_Terkunci'), baru = { bank: bank, no_rekening: no, atas_nama: an };
    Object.keys(baru).forEach(function (k) { var row = { key: k, value: baru[k], updated_by: oleh(ctx), updated_at: kini(ctx) }; if (m[k]) ubah(ctx, 'Config_Terkunci', [row]); else tambah(ctx, 'Config_Terkunci', [row]); });
    audit(ctx, 'REKENING', 'Config_Terkunci', { bank: lama.bank, no_rekening: lama.no_rekening, atas_nama: lama.atas_nama }, baru);
    return { rekening: configTerkunci(ctx) };
  }
  function svcHargaSimpan(ctx, d) {
    var berubah = [];
    (d.baris || []).forEach(function (b) {
      var p = wajibAda(ctx, 'Paket', b.paket_id, 'Paket'), mulai = tglValid(b.berlaku_mulai) ? b.berlaku_mulai : ctx.hariIni;
      var harga = rp(b.harga), tam = rp(b.biaya_tambahan);
      if (harga < 0 || tam < 0) throw Gagal('Harga tidak boleh negatif.');
      var lama = hargaBerlaku(ctx, p.paket_id, mulai);
      if (lama && lama.harga === harga && lama.biaya_tambahan === tam) return;
      var sama = semua(ctx, 'Harga_Paket').filter(function (r) { return r.paket_id === p.paket_id && r.berlaku_mulai === mulai; })[0];
      var row = { paket_id: p.paket_id, harga: harga, biaya_tambahan_per_peserta: tam, berlaku_mulai: mulai, updated_by: oleh(ctx), updated_at: kini(ctx) };
      if (sama) { row.harga_id = sama.harga_id; ubah(ctx, 'Harga_Paket', [row]); } else { row.harga_id = idBaru(ctx, 'Harga_Paket'); tambah(ctx, 'Harga_Paket', [row]); }
      berubah.push({ paket: p.nama, lama: lama ? lama.harga + '/' + lama.biaya_tambahan : '-', baru: harga + '/' + tam, mulai: mulai });
    });
    if (berubah.length) audit(ctx, 'HARGA', 'Harga_Paket', berubah.map(function (x) { return x.paket + ': ' + x.lama; }).join('; '), berubah.map(function (x) { return x.paket + ': ' + x.baru + ' (mulai ' + x.mulai + ')'; }).join('; '));
    return { berubah: berubah.length };
  }
  function svcTarifSimpan(ctx, d) {
    var kat = daftarKategori(ctx), berubah = [], cariTarif = pencariTarif(ctx);
    (d.baris || []).forEach(function (b) {
      var k = s(b.kategori_sesi), coach = s(b.coach_id), mulai = tglValid(b.berlaku_mulai) ? b.berlaku_mulai : ctx.hariIni;
      if (kat.indexOf(k) < 0) throw Gagal('Kategori sesi tidak dikenal: ' + k);
      if (coach) wajibAda(ctx, 'Pelatih', coach, 'Pelatih');
      if (b.hapus && b.tarif_id) { ubah(ctx, 'Tarif_Honor', [{ tarif_id: b.tarif_id, aktif: 'T', updated_by: oleh(ctx), updated_at: kini(ctx) }]); berubah.push(k + (coach ? ' (' + coach + ')' : '') + ': dinonaktifkan'); return; }
      var tarif = rp(b.tarif); if (tarif < 0) throw Gagal('Tarif tidak boleh negatif.');
      var lama = coach ? semua(ctx, 'Tarif_Honor').filter(function (r) { return r.kategori_sesi === k && r.coach_id === coach && r.aktif !== 'T' && r.berlaku_mulai <= mulai; }).sort(function (a, c) { return a.berlaku_mulai < c.berlaku_mulai ? 1 : -1; })[0] : null;
      var nilaiLama = coach ? (lama ? num(lama.tarif) : null) : cariTarif(k, '', mulai).tarif;
      if (nilaiLama === tarif && !b.tarif_id) return;
      var sama = semua(ctx, 'Tarif_Honor').filter(function (r) { return r.kategori_sesi === k && s(r.coach_id) === coach && r.berlaku_mulai === mulai && r.aktif !== 'T'; })[0];
      var row = { kategori_sesi: k, coach_id: coach, tarif: tarif, berlaku_mulai: mulai, aktif: 'Y', updated_by: oleh(ctx), updated_at: kini(ctx) };
      if (sama) { row.tarif_id = sama.tarif_id; ubah(ctx, 'Tarif_Honor', [row]); } else { row.tarif_id = idBaru(ctx, 'Tarif_Honor'); tambah(ctx, 'Tarif_Honor', [row]); }
      berubah.push(k + (coach ? ' (' + coach + ')' : '') + ': ' + (nilaiLama == null ? '-' : nilaiLama) + ' → ' + tarif + ' mulai ' + mulai);
    });
    if (berubah.length) audit(ctx, 'TARIF', 'Tarif_Honor', '', berubah.join('; '));
    return { berubah: berubah.length };
  }
  function svcAturanSimpan(ctx, d) {
    var a = d.aturan || {}, f = {}, lama = aturan(ctx), baru = {};
    baru.sisa_sesi_perpanjangan = a.sisa_sesi_perpanjangan === 'dibawa' ? 'dibawa' : 'hangus';
    baru.maks_sesi_dibawa = Math.max(0, Math.min(50, Math.round(num(a.maks_sesi_dibawa))));
    if (baru.sisa_sesi_perpanjangan === 'dibawa' && baru.maks_sesi_dibawa < 1) f.maks_sesi_dibawa = 'Minimal 1 sesi';
    baru.masa_berlaku_hari = Math.max(0, Math.min(730, Math.round(num(a.masa_berlaku_hari))));
    baru.status_dihitung = (Array.isArray(a.status_dihitung) ? a.status_dihitung : []).filter(function (x) { return STATUS_HADIR.indexOf(x) >= 0; });
    if (!baru.status_dihitung.length) f.status_dihitung = 'Pilih minimal satu status';
    baru.absensi_paket_habis = a.absensi_paket_habis === 'sesi_lebih' ? 'sesi_lebih' : 'tolak';
    if (Object.keys(f).length) throw Gagal('Periksa kembali Aturan Bisnis.', 'VALIDATION', f);
    var m = peta(ctx, 'Aturan_Bisnis'), v = (lama.versi || 0) + 1;
    Object.keys(baru).forEach(function (k) { var row = { key: k, value: JSON.stringify(baru[k]), versi: v, updated_by: oleh(ctx), updated_at: kini(ctx) }; if (m[k]) ubah(ctx, 'Aturan_Bisnis', [row]); else tambah(ctx, 'Aturan_Bisnis', [row]); });
    delete lama.versi; audit(ctx, 'ATURAN_BISNIS', 'Aturan_Bisnis v' + v, lama, baru);
    baru.versi = v; return { aturan: baru };
  }

  function svcHakAmbil(ctx) {
    var m = matriks(ctx), rows = semua(ctx, 'Hak_Akses');
    return { katalog: IZIN, matriks: m, versi: atur(ctx, 'hak_akses_versi'), intiOwner: INTI_OWNER, terakhir: rows.length ? urut(rows, function (r) { return r.updated_at; }, true)[0].updated_at : '',
      jumlahAdmin: semua(ctx, 'Pengguna').filter(function (u) { return u.peran === 'admin' && u.aktif !== 'T'; }).length };
  }
  function tulisMatriks(ctx, m, alasan) {
    var lama = matriks(ctx), v = num(atur(ctx, 'hak_akses_versi')) + 1, rows = [], beda = [];
    IZIN.forEach(function (i) { i.boleh.forEach(function (p) {
      var on = !!(m[p] || {})[i.k];
      if (!!lama[p][i.k] !== on) beda.push(NAMA_PERAN[p] + ' · ' + i.k + ': ' + (on ? 'ON' : 'OFF'));
      rows.push({ kunci: p + ':' + i.k, peran: p, izin: i.k, aktif: on ? 'Y' : 'T', versi: v, updated_by: oleh(ctx), updated_at: kini(ctx) });
    }); });
    ganti(ctx, 'Hak_Akses', rows); setAtur(ctx, 'hak_akses_versi', v); ctx._matriks = null;
    audit(ctx, 'HAK_AKSES', 'Matriks v' + v, alasan || '', beda.join('; ') || 'tanpa perubahan');
    return { versi: v, perubahan: beda };
  }
  function svcHakSimpan(ctx, d) {
    var m = salin(matriks(ctx));
    (d.perubahan || []).forEach(function (c) {
      var i = IZIN_PETA[c.izin];
      if (!i) throw Gagal('Izin tidak dikenal: ' + c.izin, 'FORBIDDEN');
      if (!m[c.peran]) throw Gagal('Peran tidak dapat diatur: ' + c.peran, 'FORBIDDEN');
      if (i.boleh.indexOf(c.peran) < 0) throw Gagal('Izin "' + c.izin + '" tidak dapat diberikan ke ' + NAMA_PERAN[c.peran] + ' (batas peran).', 'FORBIDDEN');
      if (c.aktif) m[c.peran][c.izin] = true; else delete m[c.peran][c.izin];
    });
    var r = tulisMatriks(ctx, m); r.matriks = matriks(ctx); return r;
  }
  function svcHakReset(ctx) { var m = { admin: {}, pelatih: {}, ortu: {} }; IZIN.forEach(function (i) { i.bawaan.forEach(function (p) { m[p][i.k] = true; }); }); var r = tulisMatriks(ctx, m, 'Kembalikan ke bawaan'); r.matriks = matriks(ctx); return r; }

  function bolehKelolaAkun(ctx, peran) { if (ctx.me.peran === 'owner') return true; return punya(ctx, 'akun.kelola') && (peran === 'pelatih' || peran === 'ortu'); }
  function svcAkunList(ctx) {
    if (ctx.me.peran !== 'owner' && !punya(ctx, 'akun.kelola')) throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
    var sw = peta(ctx, 'Siswa'), co = peta(ctx, 'Pelatih');
    return { akun: semua(ctx, 'Pengguna').filter(function (u) { return bolehKelolaAkun(ctx, u.peran); }).map(function (u) {
      return { user_id: u.user_id, nama: u.nama, peran: u.peran, username: u.username, coach_id: u.coach_id, nama_pelatih: co[u.coach_id] ? co[u.coach_id].nama : '',
        anak: s(u.siswa_ids).split(',').filter(Boolean).map(function (id) { return sw[id] ? { siswa_id: id, nama: sw[id].nama, kode_akses: sw[id].kode_akses } : null; }).filter(Boolean),
        kontak: u.kontak, email: u.email, aktif: u.aktif, login_terakhir: u.login_terakhir, terkunci: msDariWaktu(u.kunci_hingga) > ctx.now };
    }), pelatih: aktif(semua(ctx, 'Pelatih')).map(function (c) { return { coach_id: c.coach_id, nama: c.nama }; }), bolehAdmin: ctx.me.peran === 'owner' };
  }
  function svcAkunSimpan(ctx, d) {
    var lama = d.user_id ? wajibAda(ctx, 'Pengguna', d.user_id, 'Akun') : null, peran = lama && d.peran === undefined ? lama.peran : d.peran;
    if (['owner', 'admin', 'pelatih'].indexOf(peran) < 0) throw Gagal('Peran tidak valid. Akun orang tua dibuat otomatis saat verifikasi pendaftaran.');
    if (!bolehKelolaAkun(ctx, peran) || (lama && !bolehKelolaAkun(ctx, lama.peran))) throw Gagal('Mengelola akun ' + NAMA_PERAN[peran] + ' hanya bisa dilakukan Owner.', 'FORBIDDEN');
    if (lama && lama.user_id === ctx.me.user_id && (peran !== lama.peran || d.aktif === 'T')) throw Gagal('Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri.');
    var f = {}, nama = s(d.nama).slice(0, 80), un = s(d.username).toLowerCase();
    if (!nama) f.nama = 'Wajib'; if (!/^[a-z0-9._-]{3,30}$/.test(un)) f.username = '3–30 huruf kecil/angka/titik';
    if (semua(ctx, 'Pengguna').some(function (u) { return s(u.username).toLowerCase() === un && (!lama || u.user_id !== lama.user_id); })) f.username = 'Sudah dipakai';
    if (peran === 'pelatih') { if (!d.coach_id || !cari(ctx, 'Pelatih', d.coach_id)) f.coach_id = 'Pilih data pelatih'; }
    if (d.email && !emailValid(d.email)) f.email = 'Email tidak valid';
    if (Object.keys(f).length) throw Gagal('Periksa kembali isian akun.', 'VALIDATION', f);
    var row = { nama: nama, peran: peran, username: un, coach_id: peran === 'pelatih' ? d.coach_id : '', kontak: d.kontak ? hp08(d.kontak) : '', email: s(d.email), aktif: d.aktif === 'T' ? 'T' : 'Y' }, sandi = null;
    if (lama) {
      row.user_id = lama.user_id;
      if (lama.peran !== peran || lama.aktif !== row.aktif || lama.username !== un) row.versi_token = num(lama.versi_token) + 1;
      ubah(ctx, 'Pengguna', [row]);
    } else {
      sandi = sandiAcak(ctx); var salt = ctx.env.acak(16);
      row.user_id = idBaru(ctx, 'Pengguna'); row.salt = salt; row.hash_sandi = hashRahasia(ctx, sandi, salt); row.versi_token = 1; row.gagal_login = 0; row.siswa_ids = ''; row.dibuat_at = kini(ctx);
      tambah(ctx, 'Pengguna', [row]);
    }
    audit(ctx, lama ? 'AKUN_UBAH' : 'AKUN_TAMBAH', 'Pengguna:' + row.user_id, lama ? { peran: lama.peran, aktif: lama.aktif, username: lama.username } : '', { peran: peran, aktif: row.aktif, username: un });
    return { user_id: row.user_id, sandi_awal: sandi };
  }
  function svcAkunReset(ctx, d) {
    var u = wajibAda(ctx, 'Pengguna', d.user_id, 'Akun');
    if (!bolehKelolaAkun(ctx, u.peran)) throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
    var baru = u.peran === 'ortu' ? pinAcak(ctx) : sandiAcak(ctx), salt = ctx.env.acak(16);
    ubah(ctx, 'Pengguna', [{ user_id: u.user_id, salt: salt, hash_sandi: hashRahasia(ctx, baru, salt), versi_token: num(u.versi_token) + 1, gagal_login: 0, kunci_hingga: '' }]);
    audit(ctx, u.peran === 'ortu' ? 'RESET_PIN' : 'RESET_SANDI', 'Pengguna:' + u.user_id, '', '');
    var anak = s(u.siswa_ids).split(',').filter(Boolean).map(function (id) { var x = cari(ctx, 'Siswa', id); return x ? x.kode_akses : ''; }).filter(Boolean);
    return { user_id: u.user_id, peran: u.peran, rahasia: baru, kode_akses: anak, kontak: u.kontak, nama: u.nama };
  }
  function svcLogList(ctx, d) {
    var q = s(d.q).toLowerCase(), aksi = s(d.aksi), rows = semua(ctx, 'Log_Audit', { ekor: 3000 });
    rows = urut(rows, function (r) { return r.waktu + r.log_id; }, true).filter(function (r) {
      if (aksi && r.aksi !== aksi) return false;
      return !q || (r.aksi + ' ' + r.objek + ' ' + r.nilai_lama + ' ' + r.nilai_baru + ' ' + namaPengguna(ctx, r.user_id)).toLowerCase().indexOf(q) >= 0;
    });
    var hal = Math.max(1, num(d.halaman) || 1), per = 50;
    return { total: rows.length, halaman: hal, per: per, aksiList: unik(semua(ctx, 'Log_Audit', { ekor: 3000 }).map(function (r) { return r.aksi; })).sort(),
      rows: rows.slice((hal - 1) * per, hal * per).map(function (r) { var o = salin(r); o.nama = namaPengguna(ctx, r.user_id); return o; }) };
  }

  /* ---------- 9. Siswa, paket aktif, pendaftaran ---------- */
  function pesertaPeta(ctx) {
    if (ctx._pp && ctx._ppV === ctx._peta.Paket_Peserta) return ctx._pp;
    var m = {}, bySiswa = {};
    semua(ctx, 'Paket_Peserta').forEach(function (r) { (m[r.enr_id] = m[r.enr_id] || []).push(r.siswa_id); (bySiswa[r.siswa_id] = bySiswa[r.siswa_id] || []).push(r.enr_id); });
    ctx._pp = { enr: m, siswa: bySiswa }; ctx._ppV = peta(ctx, 'Paket_Peserta');
    return ctx._pp;
  }
  function pesertaDari(ctx, enrId) { var sw = peta(ctx, 'Siswa'); return (pesertaPeta(ctx).enr[enrId] || []).map(function (id) { return sw[id]; }).filter(Boolean); }
  function statusEfektif(ctx, e) {
    if (e.status === 'Aktif' && e.tgl_kedaluwarsa && e.tgl_kedaluwarsa < ctx.hariIni) return { status: 'HABIS', alasan: 'kedaluwarsa' };
    return { status: e.status, alasan: e.alasan_habis };
  }
  function ringkasEnr(ctx, e) {
    if (!e) return null;
    var p = cari(ctx, 'Paket', e.paket_id) || {}, c = cari(ctx, 'Pelatih', e.coach_id) || {}, k = cari(ctx, 'Kolam', e.kolam_id) || {}, st = statusEfektif(ctx, e);
    var total = num(e.sesi_total), pakai = num(e.sesi_terpakai);
    return {
      enr_id: e.enr_id, paket_id: e.paket_id, paket: p.nama || '-', jenis: p.jenis || '', lokasi: p.lokasi || '', kategori: kategoriSesi(p),
      coach_id: e.coach_id, pelatih: c.nama || '-', kolam_id: e.kolam_id, kolam: k.nama_resmi || '-', kolam_singkat: k.singkatan || '', jam: e.jam,
      tgl_mulai: e.tgl_mulai, tgl_kedaluwarsa: e.tgl_kedaluwarsa, tipe: e.tipe, induk_enr_id: e.induk_enr_id, sesi_bawaan: num(e.sesi_bawaan),
      sesi_total: total, sesi_terpakai: pakai, sisa: Math.max(0, total - pakai), sesi_lebih: num(e.sesi_lebih), status: st.status, alasan_habis: st.alasan,
      habis_at: e.habis_at, hari_habis: st.status === 'HABIS' && e.habis_at ? selisihHari(String(e.habis_at).slice(0, 10), ctx.hariIni) : (st.alasan === 'kedaluwarsa' ? selisihHari(e.tgl_kedaluwarsa, ctx.hariIni) : 0),
      aturan: jsonAman(e.aturan_json, {}), peserta: pesertaDari(ctx, e.enr_id).map(function (x) { return { siswa_id: x.siswa_id, nama: x.nama, kategori: x.kategori }; })
    };
  }
  function enrTerbaruSiswa(ctx, siswaId) {
    var ids = pesertaPeta(ctx).siswa[siswaId] || [], pe = peta(ctx, 'Paket_Aktif');
    var list = ids.map(function (i) { return pe[i]; }).filter(Boolean);
    var hidup = list.filter(function (e) { return e.status !== 'Selesai'; });
    return urut(hidup.length ? hidup : list, function (e) { return e.dibuat_at + e.enr_id; }, true)[0] || null;
  }
  function siswaTerlihat(ctx) {
    var me = ctx.me;
    if (me.peran === 'owner' || me.peran === 'admin') return null; // semua
    var set = {};
    if (me.peran === 'ortu') me.siswa_ids.forEach(function (id) { set[id] = 1; });
    if (me.peran === 'pelatih') semua(ctx, 'Paket_Aktif').forEach(function (e) { if (e.coach_id === me.coach_id && e.status !== 'Selesai') (pesertaPeta(ctx).enr[e.enr_id] || []).forEach(function (id) { set[id] = 1; }); });
    return set;
  }
  function wajibLihatSiswa(ctx, siswaId) { var set = siswaTerlihat(ctx); if (set && !set[siswaId]) throw Gagal('Data siswa ini di luar akses Anda.', 'FORBIDDEN'); }
  function wajibEnrSendiri(ctx, e) {
    if (ctx.me.peran === 'pelatih' && e.coach_id !== ctx.me.coach_id) throw Gagal('Paket ini bukan milik sesi Anda.', 'FORBIDDEN');
    if (ctx.me.peran === 'ortu' && !(pesertaPeta(ctx).enr[e.enr_id] || []).some(function (id) { return ctx.me.siswa_ids.indexOf(id) >= 0; })) throw Gagal('Data ini di luar akses Anda.', 'FORBIDDEN');
  }

  function kategoriKasId(ctx, nama, tipe) {
    var k = semua(ctx, 'Kategori_Kas').filter(function (r) { return r.nama === nama; })[0];
    if (k) return k.kategori_id;
    var row = { kategori_id: idBaru(ctx, 'Kategori_Kas'), nama: nama, tipe: tipe || 'Pemasukan', aktif: 'Y', sistem: 'Y' };
    tambah(ctx, 'Kategori_Kas', [row]); return row.kategori_id;
  }
  function kodeAksesBaru(ctx) {
    var ada = {}; semua(ctx, 'Siswa').forEach(function (r) { ada[s(r.kode_akses).toUpperCase()] = 1; });
    for (var i = 0; i < 50; i++) { var d = ctx.env.acak(8).replace(/\D/g, ''); if (d.length < 4) continue; var k = 'SA-' + d.slice(0, 4); if (!ada[k]) return k; }
    return 'SA-' + ctx.env.acak(6).toUpperCase();
  }
  function akunOrtu(ctx, kontak, namaOrtu, email, siswaIds) {
    var hp = hp08(kontak), u = hp ? semua(ctx, 'Pengguna').filter(function (r) { return r.peran === 'ortu' && hp08(r.kontak) === hp; })[0] : null;
    if (u) {
      var ids = unik(s(u.siswa_ids).split(',').filter(Boolean).concat(siswaIds));
      ubah(ctx, 'Pengguna', [{ user_id: u.user_id, siswa_ids: ids.join(','), email: u.email || s(email) }]);
      return { user_id: u.user_id, pin: null, baru: false };
    }
    var pin = pinAcak(ctx), salt = ctx.env.acak(16), id = idBaru(ctx, 'Pengguna');
    tambah(ctx, 'Pengguna', [{ user_id: id, nama: s(namaOrtu) || 'Orang Tua', peran: 'ortu', username: 'ortu.' + ctx.env.acak(6).toLowerCase(), hash_sandi: hashRahasia(ctx, pin, salt), salt: salt, versi_token: 1, gagal_login: 0, kunci_hingga: '', coach_id: '', siswa_ids: siswaIds.join(','), kontak: hp, email: s(email), aktif: 'Y', login_terakhir: '', dibuat_at: kini(ctx) }]);
    return { user_id: id, pin: pin, baru: true };
  }
  function bulanTertutup(ctx, tgl) { return !!cari(ctx, 'Tutup_Bulan', bulanDari(tgl)); }
  function wajibBulanTerbuka(ctx, tgl, alasan) {
    if (!bulanTertutup(ctx, tgl)) return;
    if (ctx.me.peran !== 'owner') throw Gagal('Bulan ' + namaBulan(bulanDari(tgl)) + ' sudah ditutup. Perubahan hanya oleh Owner dengan alasan.', 'FORBIDDEN');
    if (s(alasan).length < 5) throw Gagal('Bulan sudah ditutup: alasan wajib diisi (min. 5 karakter).', 'VALIDATION', { alasan: 'Wajib diisi' });
  }

  /* Satu pintu pembuatan paket aktif: verifikasi pendaftaran, perpanjangan, atau input manual Admin */
  function buatPaketAktif(ctx, o) {
    var p = wajibAda(ctx, 'Paket', o.paket_id, 'Paket'), a = aturan(ctx), bawaan = 0, induk = o.induk || null;
    if (p.aktif === 'T') throw Gagal('Paket "' + p.nama + '" sudah nonaktif.');
    if (!o.siswa_ids.length) throw Gagal('Minimal satu peserta.');
    if (o.siswa_ids.length > (num(p.maks_peserta) || 1)) throw Gagal('Paket ' + p.nama + ' maksimal ' + (num(p.maks_peserta) || 1) + ' peserta.');
    if (o.coach_id) wajibAda(ctx, 'Pelatih', o.coach_id, 'Pelatih');
    wajibAda(ctx, 'Kolam', o.kolam_id, 'Kolam');
    var mulai = tglValid(o.tgl_mulai) ? o.tgl_mulai : ctx.hariIni;
    if (induk) {
      var sisa = Math.max(0, num(induk.sesi_total) - num(induk.sesi_terpakai));
      bawaan = a.sisa_sesi_perpanjangan === 'dibawa' ? Math.min(sisa, num(a.maks_sesi_dibawa)) : 0;
      ubah(ctx, 'Paket_Aktif', [{ enr_id: induk.enr_id, status: 'Selesai', selesai_at: kini(ctx) }]);
    }
    var e = {
      enr_id: idBaru(ctx, 'Paket_Aktif'), paket_id: p.paket_id, coach_id: o.coach_id || '', kolam_id: o.kolam_id, jam: s(o.jam).slice(0, 40), tgl_mulai: mulai,
      tgl_kedaluwarsa: num(a.masa_berlaku_hari) > 0 ? geserTgl(mulai, num(a.masa_berlaku_hari)) : '', tipe: induk ? 'Perpanjangan' : (o.tipe || 'Pendaftaran'), induk_enr_id: induk ? induk.enr_id : '',
      sesi_bawaan: bawaan, sesi_total: num(p.jumlah_sesi) + bawaan, sesi_terpakai: 0, sesi_lebih: 0, status: 'Aktif', alasan_habis: '', habis_at: '',
      aturan_json: JSON.stringify({ sisa_sesi_perpanjangan: a.sisa_sesi_perpanjangan, maks_sesi_dibawa: a.maks_sesi_dibawa, masa_berlaku_hari: a.masa_berlaku_hari, versi: a.versi }),
      dibuat_oleh: oleh(ctx), dibuat_at: kini(ctx), selesai_at: ''
    };
    tambah(ctx, 'Paket_Aktif', [e]);
    tambah(ctx, 'Paket_Peserta', o.siswa_ids.map(function (id) { return { pp_id: e.enr_id + ':' + id, enr_id: e.enr_id, siswa_id: id }; }));
    if (induk) {   // jadwal paket lama pindah ke paket baru
      var jd = semua(ctx, 'Jadwal').filter(function (j) { return j.enr_id === induk.enr_id && j.aktif !== 'T'; });
      ubah(ctx, 'Jadwal', jd.map(function (j) { return { jadwal_id: j.jadwal_id, enr_id: e.enr_id, coach_id: e.coach_id || j.coach_id }; }));
    }
    var trx = [];
    if (o.catatKas !== false) {
      var h = hargaBerlaku(ctx, p.paket_id, ctx.hariIni) || { harga: 0, biaya_tambahan: 0 };
      var namaP = o.nama_pembayar || pesertaDari(ctx, e.enr_id).map(function (x) { return x.nama; }).join(' & ');
      var kat = e.tipe === 'Perpanjangan' ? 'Perpanjangan' : (p.jenis === 'Trial' ? 'Trial' : 'Pendaftaran');
      trx.push({ trx_id: idBaru(ctx, 'Transaksi'), tanggal: ctx.hariIni, tipe: 'Pemasukan', kategori_id: kategoriKasId(ctx, kat, 'Pemasukan'), nama: namaP, nominal: h.harga, penjelasan: e.tipe + ' ' + p.nama, enr_id: e.enr_id, bukti_file_id: o.bukti_file_id || '', status: 'aktif', alasan_batal: '', dibuat_oleh: oleh(ctx), dibuat_at: kini(ctx), diubah_oleh: '', diubah_at: '' });
      var ekstra = Math.max(0, o.siswa_ids.length - (num(p.peserta_termasuk) || 1));
      if (ekstra && h.biaya_tambahan) trx.push({ trx_id: idBaru(ctx, 'Transaksi') + 'B', tanggal: ctx.hariIni, tipe: 'Pemasukan', kategori_id: kategoriKasId(ctx, 'Penambahan Biaya', 'Pemasukan'), nama: namaP, nominal: ekstra * h.biaya_tambahan, penjelasan: 'Biaya tambahan ' + ekstra + ' peserta · ' + p.nama, enr_id: e.enr_id, bukti_file_id: '', status: 'aktif', alasan_batal: '', dibuat_oleh: oleh(ctx), dibuat_at: kini(ctx), diubah_oleh: '', diubah_at: '' });
      tambah(ctx, 'Transaksi', trx);
    }
    return { enr: e, trx: trx, sesi_bawaan: bawaan };
  }

  function svcSiswaList(ctx, d) {
    var set = siswaTerlihat(ctx), q = s(d.q).toLowerCase(), rows = [];
    semua(ctx, 'Siswa').forEach(function (sw) {
      if (set && !set[sw.siswa_id]) return;
      var e = ringkasEnr(ctx, enrTerbaruSiswa(ctx, sw.siswa_id)), st = sw.aktif === 'T' ? 'Nonaktif' : (e ? e.status : 'Tanpa paket');
      if (q && (sw.nama + ' ' + sw.kode_akses + ' ' + sw.nama_ortu + ' ' + sw.kontak_ortu).toLowerCase().indexOf(q) < 0) return;
      if (d.status && d.status !== st) return;
      if (d.kategori && sw.kategori !== d.kategori) return;
      if (d.kolam_id && (!e || e.kolam_id !== d.kolam_id)) return;
      if (d.coach_id && (!e || e.coach_id !== d.coach_id)) return;
      if (d.jenis && (!e || e.jenis !== d.jenis)) return;
      var o = { siswa_id: sw.siswa_id, nama: sw.nama, kategori: sw.kategori, usia: usia(sw.tgl_lahir, ctx.hariIni), jenis_kelamin: sw.jenis_kelamin, status: st, paket: e, aktif: sw.aktif };
      if (ctx.me.peran !== 'pelatih') { o.kode_akses = sw.kode_akses; o.nama_ortu = sw.nama_ortu; o.kontak_ortu = sw.kontak_ortu; }
      rows.push(o);
    });
    rows = urut(rows, function (r) { return (r.status === 'HABIS' ? '0' : r.status === 'Aktif' ? '1' : '2') + r.nama.toLowerCase(); });
    var facet = { status: {}, kategori: {} }; rows.forEach(function (r) { facet.status[r.status] = (facet.status[r.status] || 0) + 1; facet.kategori[r.kategori] = (facet.kategori[r.kategori] || 0) + 1; });
    return { rows: rows, total: rows.length, facet: facet, kolam: aktif(semua(ctx, 'Kolam')).map(function (k) { return { kolam_id: k.kolam_id, nama: k.nama_resmi, singkatan: k.singkatan }; }), pelatih: aktif(semua(ctx, 'Pelatih')).map(function (c) { return { coach_id: c.coach_id, nama: c.nama, jenis_kelamin: c.jenis_kelamin }; }), jenis: atur(ctx, 'jenis_paket') };
  }
  function riwayatEnr(ctx, enrId) {
    var ap = kelompok(semua(ctx, 'Absensi_Peserta'), function (r) { return r.absen_id; }), sw = peta(ctx, 'Siswa'), co = peta(ctx, 'Pelatih'), kl = peta(ctx, 'Kolam');
    return urut(semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.enr_id === enrId && a.status_rekam !== 'dikoreksi'; }), function (a) { return a.tanggal + a.waktu_server; }, true).map(function (a) {
      return { absen_id: a.absen_id, pertemuan_ke: num(a.pertemuan_ke), tanggal: a.tanggal, pelatih: (co[a.coach_id] || {}).nama || '-', kolam: (kl[a.kolam_id] || {}).nama_resmi || '-', kategori: a.kategori_sesi, dihitung: a.dihitung === 'Y', sesi_lebih: a.sesi_lebih === 'Y', via_buka_kunci: a.via_buka_kunci === 'Y', catatan: a.catatan, waktu_server: a.waktu_server, koreksi: !!a.koreksi_dari,
        peserta: (ap[a.absen_id] || []).map(function (p) { return { siswa_id: p.siswa_id, nama: (sw[p.siswa_id] || {}).nama || p.siswa_id, status: p.status }; }) };
    });
  }
  function svcSiswaDetail(ctx, d) {
    var sw = wajibAda(ctx, 'Siswa', d.siswa_id, 'Siswa'); wajibLihatSiswa(ctx, sw.siswa_id);
    var pe = peta(ctx, 'Paket_Aktif'), enrs = urut((pesertaPeta(ctx).siswa[sw.siswa_id] || []).map(function (i) { return pe[i]; }).filter(Boolean), function (e) { return e.dibuat_at; }, true);
    var o = { siswa: salin(sw), usia: usia(sw.tgl_lahir, ctx.hariIni), paket: enrs.map(function (e) { var r = ringkasEnr(ctx, e); r.riwayat = punya(ctx, 'absensi.riwayat') ? riwayatEnr(ctx, e.enr_id) : []; return r; }) };
    o.siswa.data_tambahan = jsonAman(sw.data_tambahan, {});
    if (ctx.me.peran === 'pelatih') { delete o.siswa.kontak_ortu; delete o.siswa.email_ortu; delete o.siswa.kode_akses; delete o.siswa.nama_ortu; }
    else {
      var u = semua(ctx, 'Pengguna').filter(function (x) { return x.peran === 'ortu' && (',' + x.siswa_ids + ',').indexOf(',' + sw.siswa_id + ',') >= 0; })[0];
      o.ortu = u ? { user_id: u.user_id, nama: u.nama, kontak: u.kontak, login_terakhir: u.login_terakhir, aktif: u.aktif } : null;
    }
    var cur = enrs.filter(function (e) { return e.status !== 'Selesai'; })[0];
    o.jadwal = cur ? jadwalEnr(ctx, cur.enr_id) : [];
    o.berikutnya = cur ? kejadianMendatang(ctx, cur.enr_id, 14).slice(0, 3) : [];   /* untuk pesan pengingat H-1 */
    o.nama_app = atur(ctx, 'identitas').nama_app;
    o.bisa = { kelola: punya(ctx, 'siswa.kelola'), akun: punya(ctx, 'akun.kelola'), link: punya(ctx, 'pendaftaran.link') };
    return o;
  }
  function jadwalEnr(ctx, enrId) {
    var co = peta(ctx, 'Pelatih'), kl = peta(ctx, 'Kolam');
    return urut(semua(ctx, 'Jadwal').filter(function (j) { return j.enr_id === enrId && j.aktif !== 'T'; }), function (j) { return num(j.hari) * 10000 + menitDari(j.jam_mulai); })
      .map(function (j) { return { jadwal_id: j.jadwal_id, hari: num(j.hari), nama_hari: NAMA_HARI[num(j.hari)], jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, pelatih: (co[j.coach_id] || {}).nama || '-', kolam: (kl[j.kolam_id] || {}).nama_resmi || '-', status_slot: j.status_slot }; });
  }
  function validasiSiswa(ctx, x) {
    var f = {}, o = {};
    o.nama = s(x.nama).slice(0, 80); if (o.nama.length < 2) f.nama = 'Wajib diisi';
    o.tgl_lahir = s(x.tgl_lahir); if (o.tgl_lahir && (!tglValid(o.tgl_lahir) || o.tgl_lahir > ctx.hariIni)) f.tgl_lahir = 'Tanggal tidak valid';
    var u = usia(o.tgl_lahir, ctx.hariIni);
    o.kategori = ['Anak', 'Dewasa'].indexOf(x.kategori) >= 0 ? x.kategori : (u != null && u >= 15 ? 'Dewasa' : 'Anak');
    o.jenis_kelamin = ['Laki-laki', 'Perempuan'].indexOf(x.jenis_kelamin) >= 0 ? x.jenis_kelamin : '';
    return { o: o, f: f };
  }
  function svcSiswaSimpan(ctx, d) {
    var x = d.siswa || {}, lama = x.siswa_id ? wajibAda(ctx, 'Siswa', x.siswa_id, 'Siswa') : null, v = validasiSiswa(ctx, x), o = v.o, f = v.f;
    o.nama_ortu = s(x.nama_ortu).slice(0, 80); o.kontak_ortu = hp08(x.kontak_ortu); o.email_ortu = s(x.email_ortu); o.catatan = s(x.catatan).slice(0, 500);
    if (!o.kontak_ortu || !hpValid(o.kontak_ortu)) f.kontak_ortu = 'Nomor WhatsApp tidak valid';
    if (o.email_ortu && !emailValid(o.email_ortu)) f.email_ortu = 'Email tidak valid';
    if (Object.keys(f).length) throw Gagal('Periksa kembali data siswa.', 'VALIDATION', f);
    if (lama) { o.siswa_id = lama.siswa_id; if (x.aktif === 'T' || x.aktif === 'Y') o.aktif = x.aktif; ubah(ctx, 'Siswa', [o]); audit(ctx, 'SISWA_UBAH', 'Siswa:' + o.siswa_id, { nama: lama.nama, tgl_lahir: lama.tgl_lahir }, { nama: o.nama, tgl_lahir: o.tgl_lahir }); return { siswa_id: o.siswa_id }; }
    o.siswa_id = idBaru(ctx, 'Siswa'); o.kode_akses = kodeAksesBaru(ctx); o.aktif = 'Y'; o.dibuat_at = kini(ctx); o.data_tambahan = '{}';
    tambah(ctx, 'Siswa', [o]);
    var akun = akunOrtu(ctx, o.kontak_ortu, o.nama_ortu, o.email_ortu, [o.siswa_id]);
    audit(ctx, 'SISWA_TAMBAH', 'Siswa:' + o.siswa_id, '', { nama: o.nama });
    return { siswa_id: o.siswa_id, kode_akses: o.kode_akses, pin: akun.pin, kontak: o.kontak_ortu };
  }
  function svcPaketBuat(ctx, d) {
    var ids = (d.siswa_ids || []).filter(function (id) { return wajibAda(ctx, 'Siswa', id, 'Siswa'); });
    var induk = d.induk_enr_id ? wajibAda(ctx, 'Paket_Aktif', d.induk_enr_id, 'Paket lama') : null;
    if (!d.paket_id) throw Gagal('Pilih paket.', 'VALIDATION', { paket_id: 'Wajib' });
    if (!d.kolam_id) throw Gagal('Pilih kolam.', 'VALIDATION', { kolam_id: 'Wajib' });
    var r = buatPaketAktif(ctx, { paket_id: d.paket_id, siswa_ids: ids, coach_id: d.coach_id, kolam_id: d.kolam_id, jam: d.jam, tgl_mulai: d.tgl_mulai, induk: induk, catatKas: d.catat_kas !== false });
    if (d.jadwal && d.jadwal.hari) simpanJadwalBaris(ctx, { coach_id: r.enr.coach_id, hari: d.jadwal.hari, jam_mulai: d.jadwal.jam_mulai, jam_selesai: d.jadwal.jam_selesai, enr_id: r.enr.enr_id, kolam_id: r.enr.kolam_id, status_slot: 'Terisi' });
    r.trx.forEach(function (t) { audit(ctx, 'KAS_INPUT', 'Transaksi:' + t.trx_id, '', { nominal: t.nominal, penjelasan: t.penjelasan }); });
    return { enr: ringkasEnr(ctx, cari(ctx, 'Paket_Aktif', r.enr.enr_id)), trx: r.trx.length, sesi_bawaan: r.sesi_bawaan };
  }
  function svcPaketUbah(ctx, d) {
    var e = wajibAda(ctx, 'Paket_Aktif', d.enr_id, 'Paket'), o = { enr_id: e.enr_id };
    if (d.coach_id !== undefined) { if (d.coach_id) wajibAda(ctx, 'Pelatih', d.coach_id, 'Pelatih'); o.coach_id = d.coach_id; }
    if (d.kolam_id) { wajibAda(ctx, 'Kolam', d.kolam_id, 'Kolam'); o.kolam_id = d.kolam_id; }
    if (d.jam !== undefined) o.jam = s(d.jam).slice(0, 40);
    ubah(ctx, 'Paket_Aktif', [o]);
    if (o.coach_id) ubah(ctx, 'Jadwal', semua(ctx, 'Jadwal').filter(function (j) { return j.enr_id === e.enr_id; }).map(function (j) { return { jadwal_id: j.jadwal_id, coach_id: o.coach_id }; }));
    audit(ctx, 'PAKET_UBAH', 'Paket_Aktif:' + e.enr_id, { coach_id: e.coach_id, kolam_id: e.kolam_id, jam: e.jam }, o);
    return { enr: ringkasEnr(ctx, cari(ctx, 'Paket_Aktif', e.enr_id)) };
  }
  function svcPaketSelesai(ctx, d) {
    var e = wajibAda(ctx, 'Paket_Aktif', d.enr_id, 'Paket');
    if (e.status === 'Selesai') throw Gagal('Paket sudah selesai.');
    ubah(ctx, 'Paket_Aktif', [{ enr_id: e.enr_id, status: 'Selesai', selesai_at: kini(ctx) }]);
    ubah(ctx, 'Jadwal', semua(ctx, 'Jadwal').filter(function (j) { return j.enr_id === e.enr_id && j.aktif !== 'T'; }).map(function (j) { return { jadwal_id: j.jadwal_id, aktif: 'T' }; }));
    audit(ctx, 'PAKET_SELESAI', 'Paket_Aktif:' + e.enr_id, e.status, 'Selesai — ' + s(d.alasan || 'tidak lanjut'));
    return { ok: true };
  }

  /* Link pendaftaran resmi */
  function svcLinkBuat(ctx, d) {
    var tipe = d.tipe === 'perpanjangan' ? 'perpanjangan' : 'baru', e = null;
    if (tipe === 'perpanjangan') { e = wajibAda(ctx, 'Paket_Aktif', d.enr_id, 'Paket'); }
    var hari = Math.max(1, Math.min(30, Math.round(num(d.hari) || 7)));
    var row = { token: ctx.env.acak(12), form_id: formAktif(ctx).form_id, tipe: tipe, enr_id: e ? e.enr_id : '', kedaluwarsa: waktuWIB(ctx.now + hari * 864e5), sekali_pakai: d.sekali_pakai === false ? 'T' : 'Y', dipakai: 'T', catatan: s(d.catatan).slice(0, 120), dibuat_oleh: oleh(ctx), dibuat_at: kini(ctx) };
    tambah(ctx, 'Link_Pendaftaran', [row]);
    var untuk = null;
    if (e) { var r = ringkasEnr(ctx, e), ps = pesertaDari(ctx, e.enr_id)[0] || {}; untuk = { nama: r.peserta.map(function (x) { return x.nama; }).join(' & '), nama_ortu: ps.nama_ortu, kontak: ps.kontak_ortu, paket: r.paket, terpakai: r.sesi_terpakai, total: r.sesi_total }; }
    return { token: row.token, tipe: tipe, kedaluwarsa: row.kedaluwarsa, sekali_pakai: row.sekali_pakai, untuk: untuk, nama_app: atur(ctx, 'identitas').nama_app };
  }
  function statusLink(ctx, l) { if (l.sekali_pakai === 'Y' && l.dipakai === 'Y') return 'Terpakai'; if (msDariWaktu(l.kedaluwarsa) < ctx.now) return 'Kedaluwarsa'; return 'Aktif'; }
  function svcLinkList(ctx) {
    return { rows: urut(semua(ctx, 'Link_Pendaftaran'), function (l) { return l.dibuat_at; }, true).slice(0, 60).map(function (l) {
      var e = l.enr_id ? ringkasEnr(ctx, cari(ctx, 'Paket_Aktif', l.enr_id)) : null;
      return { token: l.token, tipe: l.tipe, status: statusLink(ctx, l), kedaluwarsa: l.kedaluwarsa, sekali_pakai: l.sekali_pakai, untuk: e ? e.peserta.map(function (x) { return x.nama; }).join(' & ') : '', catatan: l.catatan, dibuat_at: l.dibuat_at };
    }) };
  }
  function cekLink(ctx, token) {
    var l = cari(ctx, 'Link_Pendaftaran', s(token));
    if (!l) throw Gagal('Link pendaftaran tidak dikenal. Minta link resmi ke Admin.', 'LINK');
    var st = statusLink(ctx, l);
    if (st === 'Terpakai') throw Gagal('Link ini sudah dipakai. Minta link baru ke Admin.', 'LINK');
    if (st === 'Kedaluwarsa') throw Gagal('Link ini sudah kedaluwarsa. Minta link baru ke Admin.', 'LINK');
    return l;
  }
  function daftarPaketPublik(ctx) {
    return paketUrut(ctx).map(function (p) { var h = hargaBerlaku(ctx, p.paket_id, ctx.hariIni) || { harga: 0, biaya_tambahan: 0 };
      return { paket_id: p.paket_id, nama: p.nama, jenis: p.jenis, lokasi: p.lokasi, kategori: kategoriSesi(p), jumlah_sesi: num(p.jumlah_sesi), peserta_termasuk: num(p.peserta_termasuk) || 1, maks_peserta: num(p.maks_peserta) || 1, durasi_menit: num(p.durasi_menit), harga: h.harga, biaya_tambahan: h.biaya_tambahan }; });
  }
  function svcPubFormDaftar(ctx, d) {
    var l = cekLink(ctx, d.token), id = atur(ctx, 'identitas'), f = formAktif(ctx), prefill = null;
    if (l.enr_id) {
      var e = cari(ctx, 'Paket_Aktif', l.enr_id), ps = e ? pesertaDari(ctx, e.enr_id) : [];
      if (e && ps.length) prefill = { nama: ps[0].nama, tgl_lahir: ps[0].tgl_lahir, kategori: ps[0].kategori, jenis_kelamin: ps[0].jenis_kelamin, nama_ortu: ps[0].nama_ortu, kontak: ps[0].kontak_ortu, email: ps[0].email_ortu, paket: e.paket_id, kolam: e.kolam_id, jam: e.jam,
        peserta_tambahan: ps.slice(1).map(function (x) { return { nama: x.nama, tgl_lahir: x.tgl_lahir, kategori: x.kategori, jenis_kelamin: x.jenis_kelamin }; }) };
    }
    return { tipe: l.tipe, kedaluwarsa: l.kedaluwarsa, identitas: { nama_app: id.nama_app, logo: id.logo, kontak_admin: id.kontak_admin, tagline: id.tagline },
      form: f, teks_persetujuan: TEKS_PERSETUJUAN.replace('{institusi}', id.nama_app), rekening: configTerkunci(ctx), paket: daftarPaketPublik(ctx),
      kolam: aktif(semua(ctx, 'Kolam')).map(function (k) { return { kolam_id: k.kolam_id, nama: k.nama_resmi, singkatan: k.singkatan }; }), prefill: prefill };
  }
  function validasiBerkas(b, maksMB, tipe) {
    var mime = s(b.mime).toLowerCase(), okMime = { 'image/jpeg': 1, 'image/jpg': 1, 'image/png': 1, 'application/pdf': 1 };
    if (!okMime[mime] || !/\.(jpe?g|png|pdf)$/i.test(s(b.nama))) throw Gagal('Bukti transfer harus JPG, PNG, atau PDF.', 'VALIDATION', { bukti: 'Format JPG/PNG/PDF' });
    if (Math.floor(String(b.base64 || '').length * 3 / 4) > maksMB * 1024 * 1024) throw Gagal('Ukuran berkas maksimal ' + maksMB + ' MB.', 'VALIDATION', { bukti: 'Maksimal ' + maksMB + ' MB' });
  }
  function svcPubKirimDaftar(ctx, d) {
    var l = cekLink(ctx, d.token), f = formAktif(ctx), x = d.data || {}, err = {}, data = {}, kolamP = peta(ctx, 'Kolam'), paketP = peta(ctx, 'Paket');
    f.skema.forEach(function (fd) {
      if (fd.tetap || fd.tipe === 'berkas') return;
      var v = x[fd.kunci], t = typeof v === 'string' ? s(v) : v;
      if ((t === '' || t == null) && fd.wajib) { err[fd.kunci] = 'Wajib diisi'; return; }
      if (t === '' || t == null) return;
      if (fd.tipe === 'tanggal' && (!tglValid(t) || t > ctx.hariIni)) err[fd.kunci] = 'Tanggal tidak valid';
      else if (fd.tipe === 'angka' && !isFinite(Number(t))) err[fd.kunci] = 'Harus angka';
      else if (fd.tipe === 'pilihan' && fd.opsi && fd.opsi.indexOf(t) < 0) err[fd.kunci] = 'Pilihan tidak valid';
      else if (fd.sumber === 'paket' && (!paketP[t] || paketP[t].aktif === 'T')) err[fd.kunci] = 'Paket tidak valid';
      else if (fd.sumber === 'kolam' && (!kolamP[t] || kolamP[t].aktif === 'T')) err[fd.kunci] = 'Kolam tidak valid';
      else if (fd.tipe === 'dropdown' && !fd.sumber && fd.opsi && fd.opsi.indexOf(t) < 0) err[fd.kunci] = 'Pilihan tidak valid';
      data[fd.kunci] = typeof t === 'string' ? t.slice(0, 500) : t;
    });
    if (data.kontak && !hpValid(data.kontak)) err.kontak = 'Nomor WhatsApp tidak valid'; else if (data.kontak) data.kontak = hp08(data.kontak);
    if (data.email && !emailValid(data.email)) err.email = 'Email tidak valid';
    if (d.setuju !== true) err._persetujuan = 'Centang persetujuan wajib';
    var p = paketP[data.paket], tambahan = [];
    (Array.isArray(d.peserta_tambahan) ? d.peserta_tambahan : []).forEach(function (t, i) {
      var v = validasiSiswa(ctx, t); if (!v.o.nama || v.o.nama.length < 2) return;
      if (Object.keys(v.f).length || !v.o.tgl_lahir) err['peserta_' + i] = 'Lengkapi nama & tanggal lahir peserta ' + (i + 2);
      tambahan.push(v.o);
    });
    if (p && tambahan.length + 1 > (num(p.maks_peserta) || 1)) err.paket = 'Paket ini maksimal ' + (num(p.maks_peserta) || 1) + ' peserta';
    var bukti = d.bukti && d.bukti.base64 ? d.bukti : null;
    if (bukti) validasiBerkas(bukti, 5);
    else if (f.skema.some(function (fd) { return fd.kunci === 'bukti' && fd.wajib; })) err.bukti = 'Wajib diunggah';
    if (Object.keys(err).length) throw Gagal('Periksa kembali isian yang ditandai.', 'VALIDATION', err);
    var fileId = '';
    if (bukti) { var b = bagWIB(ctx.now); fileId = ctx.env.simpanBerkas({ nama: 'bukti-' + ctx.env.acak(6) + '.' + s(bukti.nama).split('.').pop().toLowerCase(), mime: bukti.mime, base64: bukti.base64, folder: 'BuktiBayar/' + b.y + '-' + p2(b.m) }).id; }
    data.peserta_tambahan = tambahan;
    var row = { id: idBaru(ctx, 'Pendaftaran_Masuk'), token: l.token, tipe: l.tipe, enr_lama: l.enr_id, form_versi: f.versi, data_json: JSON.stringify(data), bukti_file_id: fileId, persetujuan_data_at: kini(ctx), status: 'Baru', catatan: '', enr_baru: '', diverifikasi_oleh: '', diverifikasi_at: '', dibuat_at: kini(ctx) };
    tambah(ctx, 'Pendaftaran_Masuk', [row]);
    if (l.sekali_pakai === 'Y') ubah(ctx, 'Link_Pendaftaran', [{ token: l.token, dipakai: 'Y' }]);
    return { id: row.id, pesan: 'Pendaftaran terkirim. Admin akan memverifikasi dan mengirim kode akses portal lewat WhatsApp.' };
  }
  /* Perpanjangan: peserta paket lama memang sudah terdaftar — bukan duplikat */
  function duplikatPendaftaran(ctx, data, enrLama) {
    var hasil = [], sw = semua(ctx, 'Siswa'), lewati = {};
    if (enrLama) (pesertaPeta(ctx).enr[enrLama] || []).forEach(function (id) { lewati[id] = 1; });
    [{ nama: data.nama, tgl_lahir: data.tgl_lahir }].concat(data.peserta_tambahan || []).forEach(function (ps) {
      sw.forEach(function (x) {
        if (lewati[x.siswa_id]) return;
        if (s(x.nama).toLowerCase() !== s(ps.nama).toLowerCase() || x.tgl_lahir !== ps.tgl_lahir) return;
        var e = enrTerbaruSiswa(ctx, x.siswa_id), samaPaket = e && e.paket_id === data.paket && statusEfektif(ctx, e).status === 'Aktif';
        hasil.push({ siswa_id: x.siswa_id, nama: x.nama, kode_akses: x.kode_akses, paket_aktif_sama: !!samaPaket, pesan: samaPaket ? 'Nama, tanggal lahir, dan paket aktif sama dengan siswa ' + x.kode_akses : 'Mirip siswa terdaftar ' + x.kode_akses });
      });
    });
    return hasil;
  }
  function svcMasukList(ctx, d) {
    var st = d.status || 'Baru', pk = peta(ctx, 'Paket'), kl = peta(ctx, 'Kolam'), semuaRow = semua(ctx, 'Pendaftaran_Masuk'), hitung = { Baru: 0, Diverifikasi: 0, Ditolak: 0 };
    semuaRow.forEach(function (r) { hitung[r.status] = (hitung[r.status] || 0) + 1; });
    var rows = urut(semuaRow.filter(function (r) { return r.status === st; }), function (r) { return r.dibuat_at; }, true).slice(0, 100).map(function (r) {
      var data = jsonAman(r.data_json, {}), p = pk[data.paket], h = p ? hargaBerlaku(ctx, p.paket_id, ctx.hariIni) : null, lama = r.enr_lama ? cari(ctx, 'Paket_Aktif', r.enr_lama) : null;
      var n = 1 + (data.peserta_tambahan || []).length, ekstra = p ? Math.max(0, n - (num(p.peserta_termasuk) || 1)) : 0;
      return { id: r.id, tipe: r.tipe, status: r.status, dibuat_at: r.dibuat_at, persetujuan_data_at: r.persetujuan_data_at, data: data, bukti_file_id: r.bukti_file_id, bukti_url: r.bukti_file_id ? ctx.env.urlBerkas(r.bukti_file_id) : '',
        paket: p ? { paket_id: p.paket_id, nama: p.nama, kategori: kategoriSesi(p), jumlah_sesi: num(p.jumlah_sesi) } : null, kolam: kl[data.kolam] ? kl[data.kolam].nama_resmi : '-',
        tagihan: h ? h.harga + ekstra * h.biaya_tambahan : 0, ekstra: ekstra, duplikat: r.status === 'Baru' ? duplikatPendaftaran(ctx, data, r.enr_lama) : [], catatan: r.catatan, enr_baru: r.enr_baru,
        lama: lama ? ringkasEnr(ctx, lama) : null, diverifikasi_oleh: namaPengguna(ctx, r.diverifikasi_oleh), diverifikasi_at: r.diverifikasi_at };
    });
    return { rows: rows, hitung: hitung, pelatih: aktif(semua(ctx, 'Pelatih')).map(function (c) { return { coach_id: c.coach_id, nama: c.nama }; }), kolam: aktif(semua(ctx, 'Kolam')).map(function (k) { return { kolam_id: k.kolam_id, nama: k.nama_resmi }; }), aturan: aturan(ctx), rataMenit: rataVerifikasi(ctx, semuaRow) };
  }
  function rataVerifikasi(ctx, rows) { var v = rows.filter(function (r) { return r.status === 'Diverifikasi' && r.diverifikasi_at; }).slice(-30); if (!v.length) return 0; return Math.round(jumlah(v, function (r) { return (msDariWaktu(r.diverifikasi_at) - msDariWaktu(r.dibuat_at)) / 60000; }) / v.length); }
  function svcVerifikasi(ctx, d) {
    var r = wajibAda(ctx, 'Pendaftaran_Masuk', d.id, 'Pendaftaran');
    if (r.status !== 'Baru') throw Gagal('Pendaftaran ini sudah ' + r.status.toLowerCase() + '.');
    var data = jsonAman(r.data_json, {}), lamaNama = data.nama, lamaTgl = data.tgl_lahir, k = d.koreksi || {};
    if (k.nama && s(k.nama) !== data.nama) data.nama = s(k.nama).slice(0, 80);
    if (k.tgl_lahir && k.tgl_lahir !== data.tgl_lahir) { if (!tglValid(k.tgl_lahir)) throw Gagal('Tanggal lahir koreksi tidak valid.', 'VALIDATION', { tgl_lahir: 'Tidak valid' }); data.tgl_lahir = k.tgl_lahir; }
    if (data.nama !== lamaNama || data.tgl_lahir !== lamaTgl) audit(ctx, 'KOREKSI_PENDAFTARAN', 'Pendaftaran:' + r.id, { nama: lamaNama, tgl_lahir: lamaTgl }, { nama: data.nama, tgl_lahir: data.tgl_lahir });
    var kolam = d.kolam_id || data.kolam, coach = d.coach_id || '';
    if (!coach) throw Gagal('Pilih pelatih untuk paket ini.', 'VALIDATION', { coach_id: 'Wajib' });
    var induk = r.enr_lama ? cari(ctx, 'Paket_Aktif', r.enr_lama) : null;
    if (induk && induk.status === 'Selesai') induk = null;
    var lamaPeserta = induk ? pesertaDari(ctx, induk.enr_id) : [], ids = [], kodeBaru = [];
    [{ nama: data.nama, tgl_lahir: data.tgl_lahir, kategori: data.kategori, jenis_kelamin: data.jenis_kelamin }].concat(data.peserta_tambahan || []).forEach(function (ps, i) {
      var ada = lamaPeserta.filter(function (x) { return s(x.nama).toLowerCase() === s(ps.nama).toLowerCase(); })[0] || (i === 0 && lamaPeserta[0]) || null;
      if (ada) { ubah(ctx, 'Siswa', [{ siswa_id: ada.siswa_id, nama: ps.nama, tgl_lahir: ps.tgl_lahir || ada.tgl_lahir, kontak_ortu: data.kontak || ada.kontak_ortu }]); ids.push(ada.siswa_id); kodeBaru.push({ nama: ps.nama, kode_akses: ada.kode_akses }); return; }
      var v = validasiSiswa(ctx, ps).o, tam = {};
      if (i === 0) Object.keys(data).forEach(function (kk) { if (['nama', 'tgl_lahir', 'kategori', 'jenis_kelamin', 'nama_ortu', 'kontak', 'email', 'paket', 'kolam', 'jam', 'peserta_tambahan', 'bukti'].indexOf(kk) < 0) tam[kk] = data[kk]; });
      var sw = { siswa_id: idBaru(ctx, 'Siswa') + (i ? i : ''), nama: v.nama, kategori: v.kategori, tgl_lahir: v.tgl_lahir, jenis_kelamin: v.jenis_kelamin, nama_ortu: s(data.nama_ortu), kontak_ortu: data.kontak, email_ortu: s(data.email), catatan: s(data.catatan_kesehatan), data_tambahan: JSON.stringify(tam), kode_akses: kodeAksesBaru(ctx), aktif: 'Y', dibuat_at: kini(ctx) };
      tambah(ctx, 'Siswa', [sw]); ids.push(sw.siswa_id); kodeBaru.push({ nama: sw.nama, kode_akses: sw.kode_akses });
    });
    var akun = akunOrtu(ctx, data.kontak, data.nama_ortu, data.email, ids);
    var hasil = buatPaketAktif(ctx, { paket_id: data.paket, siswa_ids: ids, coach_id: coach, kolam_id: kolam, jam: d.jam || data.jam, tgl_mulai: d.tgl_mulai, induk: induk, bukti_file_id: r.bukti_file_id, nama_pembayar: s(data.nama_ortu) || data.nama });
    if (d.jadwal && d.jadwal.hari && !(induk && jadwalEnr(ctx, hasil.enr.enr_id).length)) simpanJadwalBaris(ctx, { coach_id: coach, hari: d.jadwal.hari, jam_mulai: d.jadwal.jam_mulai, jam_selesai: d.jadwal.jam_selesai, enr_id: hasil.enr.enr_id, kolam_id: kolam, status_slot: 'Terisi' });
    ubah(ctx, 'Pendaftaran_Masuk', [{ id: r.id, status: 'Diverifikasi', enr_baru: hasil.enr.enr_id, diverifikasi_oleh: oleh(ctx), diverifikasi_at: kini(ctx), data_json: JSON.stringify(data) }]);
    hasil.trx.forEach(function (t) { audit(ctx, 'KAS_INPUT', 'Transaksi:' + t.trx_id, '', { nominal: t.nominal, penjelasan: t.penjelasan, sumber: 'verifikasi ' + r.id }); });
    audit(ctx, 'VERIFIKASI_PENDAFTARAN', 'Pendaftaran:' + r.id, '', { enr: hasil.enr.enr_id, siswa: ids.join(',') });
    var p = cari(ctx, 'Paket', data.paket), id = atur(ctx, 'identitas'), peserta = kodeBaru.map(function (x) { return x.nama; }).join(' & ');
    var linkPortal = /^https?:\/\/[^\s]{4,200}$/.test(s(d.portal)) ? s(d.portal) : '';   /* alamat situs dikirim frontend */
    var teks = 'Halo ' + (data.nama_ortu || '') + ', pendaftaran *' + peserta + '* di ' + id.nama_app + ' sudah aktif.\nPaket: ' + (p ? p.nama : '') + '\n' + kodeBaru.map(function (x) { return 'Kode akses ' + x.nama + ': *' + x.kode_akses + '*'; }).join('\n') + (akun.pin ? '\nPIN portal: *' + akun.pin + '*' : '\nPIN: gunakan PIN yang sudah Anda miliki.') + (linkPortal ? '\nPortal: ' + linkPortal : '');
    return { enr_id: hasil.enr.enr_id, siswa: kodeBaru, pin: akun.pin, ortu_baru: akun.baru, sesi_bawaan: hasil.sesi_bawaan, trx: hasil.trx.map(function (t) { return { trx_id: t.trx_id, nominal: t.nominal, penjelasan: t.penjelasan }; }), wa: { nomor: hp62(data.kontak), teks: teks } };
  }
  function svcTolak(ctx, d) {
    var r = wajibAda(ctx, 'Pendaftaran_Masuk', d.id, 'Pendaftaran');
    if (r.status !== 'Baru') throw Gagal('Pendaftaran ini sudah ' + r.status.toLowerCase() + '.');
    if (s(d.alasan).length < 3) throw Gagal('Alasan penolakan wajib diisi.', 'VALIDATION', { alasan: 'Wajib' });
    ubah(ctx, 'Pendaftaran_Masuk', [{ id: r.id, status: 'Ditolak', catatan: s(d.alasan).slice(0, 300), diverifikasi_oleh: oleh(ctx), diverifikasi_at: kini(ctx) }]);
    audit(ctx, 'TOLAK_PENDAFTARAN', 'Pendaftaran:' + r.id, '', s(d.alasan));
    var data = jsonAman(r.data_json, {});
    return { ok: true, wa: { nomor: hp62(data.kontak), teks: 'Halo ' + (data.nama_ortu || '') + ', mohon maaf pendaftaran ' + data.nama + ' belum dapat kami proses: ' + s(d.alasan) + '. Silakan hubungi Admin.' } };
  }

  /* ---------- 10. Jadwal pelatih ---------- */
  function jadwalBentrok(ctx, row, semuaRows) {
    if (row.status_slot === 'Libur' || row.aktif === 'T') return [];
    var a = menitDari(row.jam_mulai), b = menitDari(row.jam_selesai);
    return (semuaRows || semua(ctx, 'Jadwal')).filter(function (j) {
      if (j.jadwal_id === row.jadwal_id || j.aktif === 'T' || j.status_slot === 'Libur' || j.coach_id !== row.coach_id || num(j.hari) !== num(row.hari)) return false;
      return menitDari(j.jam_mulai) < b && a < menitDari(j.jam_selesai);
    });
  }
  function simpanJadwalBaris(ctx, x) {
    var f = {}, o = { coach_id: s(x.coach_id), hari: Math.round(num(x.hari)), jam_mulai: s(x.jam_mulai), jam_selesai: s(x.jam_selesai), enr_id: s(x.enr_id), kolam_id: s(x.kolam_id), status_slot: ['Terisi', 'Libur', 'Kosong'].indexOf(x.status_slot) >= 0 ? x.status_slot : (x.enr_id ? 'Terisi' : 'Kosong'), catatan: s(x.catatan).slice(0, 200), aktif: x.aktif === 'T' ? 'T' : 'Y' };
    if (!cari(ctx, 'Pelatih', o.coach_id)) f.coach_id = 'Pilih pelatih';
    if (o.hari < 1 || o.hari > 7) f.hari = 'Pilih hari';
    if (!jamValid(o.jam_mulai)) f.jam_mulai = 'Format HH:MM'; if (!jamValid(o.jam_selesai)) f.jam_selesai = 'Format HH:MM';
    if (!f.jam_mulai && !f.jam_selesai && menitDari(o.jam_selesai) <= menitDari(o.jam_mulai)) f.jam_selesai = 'Harus setelah jam mulai';
    if (o.status_slot === 'Terisi') { var e = cari(ctx, 'Paket_Aktif', o.enr_id); if (!e) f.enr_id = 'Pilih paket siswa'; else if (!o.kolam_id) o.kolam_id = e.kolam_id; }
    else o.enr_id = '';
    if (o.kolam_id && !cari(ctx, 'Kolam', o.kolam_id)) f.kolam_id = 'Kolam tidak valid';
    if (Object.keys(f).length) throw Gagal('Periksa kembali jadwal.', 'VALIDATION', f);
    if (x.jadwal_id) { wajibAda(ctx, 'Jadwal', x.jadwal_id, 'Jadwal'); o.jadwal_id = x.jadwal_id; ubah(ctx, 'Jadwal', [o]); }
    else { o.jadwal_id = idBaru(ctx, 'Jadwal'); tambah(ctx, 'Jadwal', [o]); }
    return { jadwal: o, bentrok: jadwalBentrok(ctx, o) };
  }
  function itemJadwal(ctx, j, semuaRows) {
    var e = j.enr_id ? cari(ctx, 'Paket_Aktif', j.enr_id) : null, r = e ? ringkasEnr(ctx, e) : null, c = cari(ctx, 'Pelatih', j.coach_id) || {}, k = cari(ctx, 'Kolam', j.kolam_id) || {};
    return { jadwal_id: j.jadwal_id, coach_id: j.coach_id, pelatih: c.nama || '-', jenis_kelamin: c.jenis_kelamin, hari: num(j.hari), nama_hari: NAMA_HARI[num(j.hari)], jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai,
      kolam_id: j.kolam_id, kolam: k.nama_resmi || '-', kolam_singkat: k.singkatan || '', status_slot: j.status_slot, catatan: j.catatan, enr: r, bentrok: jadwalBentrok(ctx, j, semuaRows).map(function (b) { return b.jadwal_id; }) };
  }
  function svcJadwalList(ctx, d) {
    var rows = semua(ctx, 'Jadwal').filter(function (j) { return j.aktif !== 'T'; }), me = ctx.me;
    if (me.peran === 'pelatih') rows = rows.filter(function (j) { return j.coach_id === me.coach_id; });
    else if (me.peran === 'ortu') { var enrs = {}; me.siswa_ids.forEach(function (id) { (pesertaPeta(ctx).siswa[id] || []).forEach(function (x) { enrs[x] = 1; }); }); rows = rows.filter(function (j) { return enrs[j.enr_id]; }); }
    var semuaJ = semua(ctx, 'Jadwal');
    var items = rows.map(function (j) { return itemJadwal(ctx, j, semuaJ); }).filter(function (x) {
      if (x.enr && x.enr.status === 'Selesai') return false;
      if (d.coach_id && x.coach_id !== d.coach_id) return false;
      if (d.jenis_kelamin && x.jenis_kelamin !== d.jenis_kelamin) return false;
      if (d.kolam_id && x.kolam_id !== d.kolam_id) return false;
      return true;
    });
    items = urut(items, function (x) { return x.hari * 10000 + menitDari(x.jam_mulai); });
    var beban = {}, co = aktif(semua(ctx, 'Pelatih'));
    co.forEach(function (c) { beban[c.coach_id] = { coach_id: c.coach_id, nama: c.nama, jenis_kelamin: c.jenis_kelamin, sesi: 0, bentrok: 0 }; });
    items.forEach(function (x) { if (beban[x.coach_id] && x.status_slot === 'Terisi') beban[x.coach_id].sesi++; if (beban[x.coach_id] && x.bentrok.length) beban[x.coach_id].bentrok++; });
    var o = { rows: items, ringkas: { sesi: items.filter(function (x) { return x.status_slot === 'Terisi'; }).length, kosong: items.filter(function (x) { return x.status_slot === 'Kosong'; }).length, bentrok: items.filter(function (x) { return x.bentrok.length; }).length,
      pelatih: unik(items.filter(function (x) { return x.status_slot === 'Terisi'; }).map(function (x) { return x.coach_id; })).length }, hariIni: hariKe(ctx.hariIni), tanggal: ctx.hariIni };
    if (me.peran === 'owner' || me.peran === 'admin') {
      o.beban = Object.keys(beban).map(function (k) { return beban[k]; });
      o.pelatih = co.map(function (c) { return { coach_id: c.coach_id, nama: c.nama, jenis_kelamin: c.jenis_kelamin }; });
      o.kolam = aktif(semua(ctx, 'Kolam')).map(function (k) { return { kolam_id: k.kolam_id, nama: k.nama_resmi, singkatan: k.singkatan }; });
      o.paket = semua(ctx, 'Paket_Aktif').filter(function (e) { return e.status !== 'Selesai'; }).map(function (e) { var r = ringkasEnr(ctx, e); return { enr_id: e.enr_id, label: r.peserta.map(function (p) { return p.nama; }).join(' & ') + ' · ' + r.paket, coach_id: e.coach_id, kolam_id: e.kolam_id }; });
      o.bolehKelola = punya(ctx, 'jadwal.kelola');
    }
    return o;
  }
  function svcJadwalSimpan(ctx, d) {
    var lama = d.jadwal && d.jadwal.jadwal_id ? cari(ctx, 'Jadwal', d.jadwal.jadwal_id) : null;
    var r = simpanJadwalBaris(ctx, d.jadwal || {});
    audit(ctx, lama ? 'JADWAL_UBAH' : 'JADWAL_TAMBAH', 'Jadwal:' + r.jadwal.jadwal_id, lama, r.jadwal);
    return { jadwal: itemJadwal(ctx, cari(ctx, 'Jadwal', r.jadwal.jadwal_id)), peringatan: r.bentrok.length ? 'Bentrok: pelatih ini sudah dijadwalkan pada jam yang sama (' + r.bentrok.map(function (b) { return NAMA_HARI[num(b.hari)] + ' ' + b.jam_mulai + '–' + b.jam_selesai; }).join(', ') + ').' : '' };
  }
  function svcJadwalHapus(ctx, d) { var j = wajibAda(ctx, 'Jadwal', d.jadwal_id, 'Jadwal'); ubah(ctx, 'Jadwal', [{ jadwal_id: j.jadwal_id, aktif: 'T' }]); audit(ctx, 'JADWAL_HAPUS', 'Jadwal:' + j.jadwal_id, j, ''); return { ok: true }; }

  /* ---------- 11. Absensi & batas waktu (jam server WIB) ---------- */
  function infoBatas(ctx, tanggal, coachId) {
    var cfg = atur(ctx, 'absensi'), o = { tanggal: tanggal, jam_batas: cfg.jam_batas, batas_aktif: !!cfg.batas_aktif, sekarang_ms: ctx.now, boleh: false };
    if (!tglValid(tanggal)) { o.alasan = 'Tanggal tidak valid.'; return o; }
    o.batas_ms = msWIB(tanggal, cfg.jam_batas + ':00');
    if (tanggal > ctx.hariIni) { o.alasan = 'Tanggal di masa depan tidak dapat diabsen.'; return o; }
    var detik = Math.floor(ctx.now / 1000) * 1000;              // 22:00:00 masih diterima, 22:00:01 ditolak
    if (!cfg.batas_aktif || detik <= o.batas_ms) { o.boleh = true; o.sisa_ms = Math.max(0, o.batas_ms - ctx.now); return o; }
    var bk = semua(ctx, 'Buka_Kunci').filter(function (b) { return b.coach_id === coachId && b.tanggal === tanggal && msDariWaktu(b.berlaku_hingga) >= ctx.now; })[0];
    if (bk) { o.boleh = true; o.via_buka_kunci = true; o.buka_hingga = bk.berlaku_hingga; return o; }
    o.terkunci = true; o.alasan = 'Batas waktu absensi ' + cfg.jam_batas + ' WIB untuk ' + tglIndo(tanggal) + ' sudah lewat. Hubungi Admin untuk buka kunci.';
    return o;
  }
  function absensiAktifEnr(ctx, enrId) { return semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.enr_id === enrId && a.status_rekam !== 'dikoreksi'; }); }
  function ringkasAbsen(ctx, a) {
    if (!a) return null;
    var sw = peta(ctx, 'Siswa');
    return { absen_id: a.absen_id, pertemuan_ke: num(a.pertemuan_ke), dihitung: a.dihitung === 'Y', sesi_lebih: a.sesi_lebih === 'Y', waktu_server: a.waktu_server, via_buka_kunci: a.via_buka_kunci === 'Y', oleh: namaPengguna(ctx, a.dibuat_oleh), koreksi: !!a.koreksi_dari,
      peserta: semua(ctx, 'Absensi_Peserta').filter(function (p) { return p.absen_id === a.absen_id; }).map(function (p) { return { siswa_id: p.siswa_id, nama: (sw[p.siswa_id] || {}).nama || p.siswa_id, status: p.status }; }) };
  }
  function sesiTanggal(ctx, tanggal, coachFilter) {
    var hari = hariKe(tanggal), hasil = [], sudah = {};
    var absHari = semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.tanggal === tanggal && a.status_rekam !== 'dikoreksi'; });
    var absPeta = {}; absHari.forEach(function (a) { absPeta[a.enr_id] = a; });
    semua(ctx, 'Jadwal').forEach(function (j) {
      if (j.aktif === 'T' || num(j.hari) !== hari || j.status_slot !== 'Terisi') return;
      var e = cari(ctx, 'Paket_Aktif', j.enr_id); if (!e || e.tgl_mulai > tanggal) return;
      if (e.status === 'Selesai' && !absPeta[e.enr_id]) return;
      if (coachFilter && j.coach_id !== coachFilter) return;
      if (sudah[e.enr_id]) return; sudah[e.enr_id] = 1;
      hasil.push({ enr_id: e.enr_id, jadwal_id: j.jadwal_id, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, coach_id: j.coach_id });
    });
    absHari.forEach(function (a) { if (sudah[a.enr_id]) return; if (coachFilter && a.coach_id !== coachFilter) return; sudah[a.enr_id] = 1; hasil.push({ enr_id: a.enr_id, jadwal_id: '', jam_mulai: '', jam_selesai: '', coach_id: a.coach_id }); });
    return urut(hasil.map(function (x) {
      var e = cari(ctx, 'Paket_Aktif', x.enr_id), r = ringkasEnr(ctx, e), c = cari(ctx, 'Pelatih', x.coach_id) || {};
      x.enr = r; x.pelatih = c.nama || r.pelatih; x.absen = ringkasAbsen(ctx, absPeta[x.enr_id]); x.batas = infoBatas(ctx, tanggal, x.coach_id || e.coach_id);
      return x;
    }), function (x) { return (x.jam_mulai || '99') + x.enr_id; });
  }
  function svcAbsensiHari(ctx, d) {
    var tanggal = tglValid(d.tanggal) ? d.tanggal : ctx.hariIni, me = ctx.me;
    if (me.peran === 'pelatih') wajibIzin(ctx, 'absensi.input');
    else if (!punya(ctx, 'absensi.input') && !punya(ctx, 'absensi.riwayat')) throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
    var list = sesiTanggal(ctx, tanggal, me.peran === 'pelatih' ? me.coach_id : (d.coach_id || ''));
    var koreksi = semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.tanggal === tanggal && a.koreksi_dari; }).length + semua(ctx, 'Buka_Kunci').filter(function (b) { return b.tanggal === tanggal; }).length;
    return { tanggal: tanggal, hariIni: ctx.hariIni, sesi: list, batas: infoBatas(ctx, tanggal, me.coach_id || ''), aturan: { status_dihitung: aturan(ctx).status_dihitung, absensi_paket_habis: aturan(ctx).absensi_paket_habis },
      ringkas: { total: list.length, sudah: list.filter(function (x) { return x.absen; }).length, belum: list.filter(function (x) { return !x.absen; }).length, koreksi: koreksi },
      bisa: { input: punya(ctx, 'absensi.input'), koreksi: punya(ctx, 'absensi.koreksi'), buka: punya(ctx, 'absensi.buka_kunci'), batas: punya(ctx, 'absensi.atur_batas') },
      pelatih: me.peran === 'pelatih' ? [] : aktif(semua(ctx, 'Pelatih')).map(function (c) { return { coach_id: c.coach_id, nama: c.nama }; }) };
  }
  function hitungUlangEnr(ctx, enrId) {
    var e = cari(ctx, 'Paket_Aktif', enrId), rows = absensiAktifEnr(ctx, enrId);
    var pakai = rows.filter(function (a) { return a.dihitung === 'Y' && a.sesi_lebih !== 'Y'; }).length, lebih = rows.filter(function (a) { return a.dihitung === 'Y' && a.sesi_lebih === 'Y'; }).length;
    var o = { enr_id: enrId, sesi_terpakai: pakai, sesi_lebih: lebih };
    if (e.status !== 'Selesai') {
      if (pakai >= num(e.sesi_total)) { if (e.status !== 'HABIS') { o.status = 'HABIS'; o.alasan_habis = 'sesi penuh'; o.habis_at = kini(ctx); } }
      else if (e.status === 'HABIS' && e.alasan_habis === 'sesi penuh') { o.status = 'Aktif'; o.alasan_habis = ''; o.habis_at = ''; }
    }
    ubah(ctx, 'Paket_Aktif', [o]);
    return cari(ctx, 'Paket_Aktif', enrId);
  }
  function svcAbsensiSimpan(ctx, d) {
    var e = wajibAda(ctx, 'Paket_Aktif', d.enr_id, 'Paket'); wajibEnrSendiri(ctx, e);
    var tanggal = s(d.tanggal) || ctx.hariIni;
    if (!tglValid(tanggal)) throw Gagal('Tanggal tidak valid.');
    var b = infoBatas(ctx, tanggal, e.coach_id);
    if (!b.boleh) throw Gagal(b.alasan, b.terkunci ? 'LOCKED' : 'VALIDATION');
    if (tanggal < e.tgl_mulai) throw Gagal('Tanggal sebelum paket dimulai (' + tglIndo(e.tgl_mulai) + ').');
    if (bulanTertutup(ctx, tanggal) && ctx.me.peran !== 'owner') throw Gagal('Bulan ' + namaBulan(bulanDari(tanggal)) + ' sudah ditutup.', 'FORBIDDEN');
    if (absensiAktifEnr(ctx, e.enr_id).some(function (a) { return a.tanggal === tanggal; })) throw Gagal('Sesi tanggal ini sudah diabsen. Gunakan koreksi bila perlu mengubah.', 'DUPLIKAT');
    if (e.status === 'Selesai') throw Gagal('Paket ini sudah selesai.', 'HABIS');
    if (e.status === 'Aktif' && e.tgl_kedaluwarsa && tanggal > e.tgl_kedaluwarsa) {
      ubah(ctx, 'Paket_Aktif', [{ enr_id: e.enr_id, status: 'HABIS', alasan_habis: 'kedaluwarsa', habis_at: kini(ctx) }]); e = cari(ctx, 'Paket_Aktif', e.enr_id);
    }
    var a = aturan(ctx), lebih = false;
    if (e.status === 'HABIS') {
      if (a.absensi_paket_habis !== 'sesi_lebih') throw Gagal('Paket sudah HABIS (' + (e.alasan_habis || 'sesi penuh') + '). Absensi ditolak sesuai Aturan Bisnis — minta orang tua memperpanjang paket.', 'HABIS');
      lebih = true;
    }
    var peserta = pesertaDari(ctx, e.enr_id), input = {}, f = {};
    (d.peserta || []).forEach(function (p) { input[p.siswa_id] = p.status; });
    peserta.forEach(function (p) { if (STATUS_HADIR.indexOf(input[p.siswa_id]) < 0) f['p_' + p.siswa_id] = 'Pilih status ' + p.nama; });
    if (Object.keys(f).length) throw Gagal('Tandai status setiap peserta.', 'VALIDATION', f);
    var dihitung = peserta.some(function (p) { return a.status_dihitung.indexOf(input[p.siswa_id]) >= 0; });
    var p = cari(ctx, 'Paket', e.paket_id);
    var row = { absen_id: idBaru(ctx, 'Absensi_Sesi'), enr_id: e.enr_id, pertemuan_ke: absensiAktifEnr(ctx, e.enr_id).length + 1, tanggal: tanggal, coach_id: e.coach_id, kategori_sesi: kategoriSesi(p), kolam_id: e.kolam_id,
      dihitung: dihitung ? 'Y' : 'T', sesi_lebih: lebih && dihitung ? 'Y' : 'T', dibuat_oleh: oleh(ctx), waktu_server: kini(ctx), via_buka_kunci: b.via_buka_kunci ? 'Y' : 'T', status_rekam: 'aktif', koreksi_dari: '', catatan: s(d.catatan).slice(0, 200) };
    tambah(ctx, 'Absensi_Sesi', [row]);
    tambah(ctx, 'Absensi_Peserta', peserta.map(function (x) { return { ap_id: row.absen_id + ':' + x.siswa_id, absen_id: row.absen_id, siswa_id: x.siswa_id, status: input[x.siswa_id] }; }));
    e = hitungUlangEnr(ctx, e.enr_id);
    var r = ringkasEnr(ctx, e);
    return { absen: ringkasAbsen(ctx, cari(ctx, 'Absensi_Sesi', row.absen_id)), enr: r, dihitung: dihitung, sesi_lebih: lebih };
  }
  function svcAbsensiKoreksi(ctx, d) {
    var a0 = wajibAda(ctx, 'Absensi_Sesi', d.absen_id, 'Absensi');
    if (a0.status_rekam === 'dikoreksi') throw Gagal('Data ini sudah dikoreksi sebelumnya. Muat ulang halaman.');
    var e = wajibAda(ctx, 'Paket_Aktif', a0.enr_id, 'Paket'), admin = punya(ctx, 'absensi.koreksi'), b = infoBatas(ctx, a0.tanggal, a0.coach_id);
    if (!admin) {
      wajibIzin(ctx, 'absensi.input'); wajibEnrSendiri(ctx, e);
      if (!b.boleh) throw Gagal('Batas waktu sudah lewat. Koreksi hanya oleh Admin atau Owner dengan alasan.', 'LOCKED');
    } else if (!b.boleh && s(d.alasan).length < 5) throw Gagal('Alasan koreksi wajib diisi (min. 5 karakter).', 'VALIDATION', { alasan: 'Wajib diisi' });
    wajibBulanTerbuka(ctx, a0.tanggal, d.alasan);
    var lamaRingkas = ringkasAbsen(ctx, a0), a = aturan(ctx);
    ubah(ctx, 'Absensi_Sesi', [{ absen_id: a0.absen_id, status_rekam: 'dikoreksi' }]);
    var baru = null;
    if (!d.hapus) {
      var peserta = pesertaDari(ctx, e.enr_id), input = {}, f = {};
      (d.peserta || []).forEach(function (p) { input[p.siswa_id] = p.status; });
      peserta.forEach(function (p) { if (STATUS_HADIR.indexOf(input[p.siswa_id]) < 0) f['p_' + p.siswa_id] = 'Pilih status'; });
      if (Object.keys(f).length) throw Gagal('Tandai status setiap peserta.', 'VALIDATION', f);
      var dihitung = peserta.some(function (p) { return a.status_dihitung.indexOf(input[p.siswa_id]) >= 0; });
      baru = salin(a0); baru.absen_id = idBaru(ctx, 'Absensi_Sesi'); baru.dihitung = dihitung ? 'Y' : 'T'; baru.sesi_lebih = a0.sesi_lebih === 'Y' && dihitung ? 'Y' : 'T';
      baru.dibuat_oleh = oleh(ctx); baru.waktu_server = kini(ctx); baru.status_rekam = 'aktif'; baru.koreksi_dari = a0.absen_id; baru.catatan = s(d.alasan).slice(0, 200);
      tambah(ctx, 'Absensi_Sesi', [baru]);
      tambah(ctx, 'Absensi_Peserta', peserta.map(function (x) { return { ap_id: baru.absen_id + ':' + x.siswa_id, absen_id: baru.absen_id, siswa_id: x.siswa_id, status: input[x.siswa_id] }; }));
    }
    var e2 = hitungUlangEnr(ctx, e.enr_id);
    audit(ctx, 'KOREKSI_ABSENSI', 'Absensi:' + a0.absen_id + ' (' + a0.tanggal + ')', lamaRingkas.peserta.map(function (p) { return p.nama + '=' + p.status; }).join(', '),
      (d.hapus ? 'DIBATALKAN' : (baru ? ringkasAbsen(ctx, baru).peserta.map(function (p) { return p.nama + '=' + p.status; }).join(', ') : '')) + (d.alasan ? ' · alasan: ' + s(d.alasan) : ''));
    return { absen: baru ? ringkasAbsen(ctx, baru) : null, enr: ringkasEnr(ctx, e2) };
  }
  function svcAbsensiRiwayat(ctx, d) {
    wajibIzin(ctx, 'absensi.riwayat');
    var e = wajibAda(ctx, 'Paket_Aktif', d.enr_id, 'Paket'); wajibEnrSendiri(ctx, e);
    return { enr: ringkasEnr(ctx, e), riwayat: riwayatEnr(ctx, e.enr_id) };
  }
  function svcAturBatas(ctx, d) {
    var lama = atur(ctx, 'absensi'), jam = s(d.jam_batas);
    if (!jamValid(jam)) throw Gagal('Jam batas harus format HH:MM.', 'VALIDATION', { jam_batas: 'Format HH:MM' });
    var baru = { jam_batas: jam, batas_aktif: d.batas_aktif !== false };
    setAtur(ctx, 'absensi', baru); audit(ctx, 'ATUR_BATAS_ABSENSI', 'Pengaturan.absensi', lama, baru);
    return { absensi: baru };
  }
  function svcBukaKunci(ctx, d) {
    var c = wajibAda(ctx, 'Pelatih', d.coach_id, 'Pelatih'), tgl = s(d.tanggal);
    if (!tglValid(tgl) || tgl > ctx.hariIni) throw Gagal('Tanggal tidak valid (tidak boleh di masa depan).', 'VALIDATION', { tanggal: 'Tidak valid' });
    if (s(d.alasan).length < 5) throw Gagal('Alasan wajib diisi (min. 5 karakter).', 'VALIDATION', { alasan: 'Wajib diisi' });
    var row = { id: idBaru(ctx, 'Buka_Kunci'), coach_id: c.coach_id, tanggal: tgl, alasan: s(d.alasan).slice(0, 300), dibuat_oleh: oleh(ctx), dibuat_at: kini(ctx), berlaku_hingga: waktuWIB(ctx.now + 24 * 3600e3) };
    tambah(ctx, 'Buka_Kunci', [row]);
    audit(ctx, 'BUKA_KUNCI', 'Pelatih:' + c.coach_id + ' ' + tgl, '', row.alasan);
    emailOwner(ctx, 'Kunci absensi dibuka', ctx.me.nama + ' membuka kunci absensi ' + c.nama + ' untuk tanggal ' + tglIndo(tgl) + '. Alasan: ' + row.alasan);
    return { buka: row };
  }
  function svcBukaKunciList(ctx) {
    if (!punya(ctx, 'absensi.buka_kunci') && !punya(ctx, 'absensi.koreksi')) throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
    return { rows: urut(semua(ctx, 'Buka_Kunci'), function (b) { return b.dibuat_at; }, true).slice(0, 40).map(function (b) { var o = salin(b); o.pelatih = (cari(ctx, 'Pelatih', b.coach_id) || {}).nama; o.oleh = namaPengguna(ctx, b.dibuat_oleh); o.aktif = msDariWaktu(b.berlaku_hingga) >= ctx.now; return o; }) };
  }

  /* ---------- 12. Arus kas ---------- */
  function trxAktif(ctx) { return semua(ctx, 'Transaksi').filter(function (t) { return t.status !== 'batal'; }); }
  function ringkasKas(rows) { var m = 0, k = 0; rows.forEach(function (t) { if (t.tipe === 'Pemasukan') m += num(t.nominal); else k += num(t.nominal); }); return { masuk: m, keluar: k, saldo: m - k }; }
  function svcKasList(ctx, d) {
    var bulan = bulanValid(d.bulan) ? d.bulan : bulanDari(ctx.hariIni), kk = peta(ctx, 'Kategori_Kas'), q = s(d.q).toLowerCase(), aktifT = trxAktif(ctx);
    var bulanIni = semua(ctx, 'Transaksi').filter(function (t) { return bulanDari(t.tanggal) === bulan; });
    var rows = bulanIni.filter(function (t) {
      if (d.tipe && t.tipe !== d.tipe) return false; if (d.kategori_id && t.kategori_id !== d.kategori_id) return false;
      if (d.status === 'batal' ? t.status !== 'batal' : (d.status === 'aktif' && t.status === 'batal')) return false;
      return !q || (t.trx_id + ' ' + t.nama + ' ' + t.penjelasan).toLowerCase().indexOf(q) >= 0;
    });
    rows = urut(rows, function (t) { return t.tanggal + t.dibuat_at; }, true).map(function (t) { var o = salin(t); o.kategori = (kk[t.kategori_id] || {}).nama || '-'; o.oleh = namaPengguna(ctx, t.dibuat_oleh); o.bukti_url = t.bukti_file_id ? ctx.env.urlBerkas(t.bukti_file_id) : ''; return o; });
    var r = ringkasKas(bulanIni.filter(function (t) { return t.status !== 'batal'; })), awal = ringkasKas(aktifT.filter(function (t) { return bulanDari(t.tanggal) < bulan; })).saldo;
    var komposisi = {}; bulanIni.forEach(function (t) { if (t.status === 'batal' || t.tipe !== 'Pemasukan') return; var n = (kk[t.kategori_id] || {}).nama || 'Lainnya'; komposisi[n] = (komposisi[n] || 0) + num(t.nominal); });
    var tren = []; for (var i = 5; i >= 0; i--) { var b = geserBulan(bulan, -i), x = ringkasKas(aktifT.filter(function (t) { return bulanDari(t.tanggal) === b; })); x.bulan = b; tren.push(x); }
    return { bulan: bulan, rows: rows, ringkas: { masuk: r.masuk, keluar: r.keluar, saldo_bulan: r.saldo, saldo_awal: awal, saldo_akhir: awal + r.saldo, jumlah: bulanIni.length },
      komposisi: Object.keys(komposisi).map(function (k) { return { nama: k, nilai: komposisi[k] }; }).sort(function (a, b) { return b.nilai - a.nilai; }), tren: tren,
      kategori: semua(ctx, 'Kategori_Kas'), bolehInput: punya(ctx, 'kas.input'), bolehUbah: ctx.me.peran === 'owner', bolehEkspor: punya(ctx, 'laporan.ekspor'), tertutup: bulanTertutup(ctx, bulan + '-01') };
  }
  function validasiTrx(ctx, x, lama) {
    var f = {}, o = {};
    o.tanggal = s(x.tanggal) || ctx.hariIni; if (!tglValid(o.tanggal) || o.tanggal > ctx.hariIni) f.tanggal = 'Tanggal tidak valid';
    o.tipe = x.tipe === 'Pengeluaran' ? 'Pengeluaran' : 'Pemasukan';
    var k = cari(ctx, 'Kategori_Kas', x.kategori_id); if (!k || (k.aktif === 'T' && !(lama && lama.kategori_id === k.kategori_id))) f.kategori_id = 'Pilih kategori'; else if (k.tipe !== o.tipe) f.kategori_id = 'Kategori untuk ' + k.tipe;
    else if (k.sistem === 'Y' && !(lama && lama.kategori_id === k.kategori_id)) f.kategori_id = 'Kategori otomatis — dicatat sistem saat verifikasi pendaftaran';
    o.kategori_id = s(x.kategori_id); o.nama = s(x.nama).slice(0, 100); if (!o.nama) f.nama = 'Wajib diisi';
    o.nominal = rp(x.nominal); if (o.nominal <= 0) f.nominal = 'Nominal harus lebih dari 0';
    o.penjelasan = s(x.penjelasan).slice(0, 300);
    if (Object.keys(f).length) throw Gagal('Periksa kembali transaksi.', 'VALIDATION', f);
    return o;
  }
  function svcKasInput(ctx, d) {
    var o = validasiTrx(ctx, d.trx || {});
    wajibBulanTerbuka(ctx, o.tanggal, d.alasan);
    if (d.bukti && d.bukti.base64) { validasiBerkas(d.bukti, 5); var b = bagWIB(ctx.now); o.bukti_file_id = ctx.env.simpanBerkas({ nama: 'kas-' + ctx.env.acak(6) + '.' + s(d.bukti.nama).split('.').pop().toLowerCase(), mime: d.bukti.mime, base64: d.bukti.base64, folder: 'BuktiBayar/' + b.y + '-' + p2(b.m) }).id; }
    o.trx_id = idBaru(ctx, 'Transaksi'); o.status = 'aktif'; o.alasan_batal = ''; o.enr_id = s((d.trx || {}).enr_id); o.dibuat_oleh = oleh(ctx); o.dibuat_at = kini(ctx); o.diubah_oleh = ''; o.diubah_at = ''; o.bukti_file_id = o.bukti_file_id || '';
    tambah(ctx, 'Transaksi', [o]);
    audit(ctx, 'KAS_INPUT', 'Transaksi:' + o.trx_id, '', { tipe: o.tipe, nominal: o.nominal, nama: o.nama });
    return { trx_id: o.trx_id };
  }
  function svcKasUbah(ctx, d) {
    var t = wajibAda(ctx, 'Transaksi', d.trx_id, 'Transaksi');
    if (t.status === 'batal') throw Gagal('Transaksi yang dibatalkan tidak dapat diubah.');
    if (s(d.alasan).length < 5) throw Gagal('Alasan perubahan wajib diisi (min. 5 karakter).', 'VALIDATION', { alasan: 'Wajib diisi' });
    var o = validasiTrx(ctx, gabung(t, d.trx || {}), t);
    o.trx_id = t.trx_id; o.diubah_oleh = oleh(ctx); o.diubah_at = kini(ctx);
    ubah(ctx, 'Transaksi', [o]);
    audit(ctx, 'KAS_UBAH', 'Transaksi:' + t.trx_id, { tanggal: t.tanggal, nominal: num(t.nominal), nama: t.nama, kategori_id: t.kategori_id }, { tanggal: o.tanggal, nominal: o.nominal, nama: o.nama, kategori_id: o.kategori_id, alasan: s(d.alasan) });
    return { trx_id: t.trx_id };
  }
  function svcKasBatal(ctx, d) {
    var t = wajibAda(ctx, 'Transaksi', d.trx_id, 'Transaksi');
    if (t.status === 'batal') throw Gagal('Transaksi sudah dibatalkan.');
    if (s(d.alasan).length < 5) throw Gagal('Alasan pembatalan wajib diisi (min. 5 karakter).', 'VALIDATION', { alasan: 'Wajib diisi' });
    ubah(ctx, 'Transaksi', [{ trx_id: t.trx_id, status: 'batal', alasan_batal: s(d.alasan).slice(0, 300), diubah_oleh: oleh(ctx), diubah_at: kini(ctx) }]);
    audit(ctx, 'KAS_BATAL', 'Transaksi:' + t.trx_id, { status: 'aktif', nominal: num(t.nominal) }, { status: 'batal', alasan: s(d.alasan) });
    return { trx_id: t.trx_id };
  }

  /* ---------- 13. Honor pelatih (PRD 4.3) ---------- */
  function rekapHonor(ctx, bulan, coachFilter) {
    var cariTarif = pencariTarif(ctx), co = peta(ctx, 'Pelatih'), kl = peta(ctx, 'Kolam'), hasil = {};
    var sesi = semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.status_rekam !== 'dikoreksi' && a.dihitung === 'Y' && bulanDari(a.tanggal) === bulan && (!coachFilter || a.coach_id === coachFilter); });
    var nama = {}; semua(ctx, 'Absensi_Peserta').forEach(function (p) { (nama[p.absen_id] = nama[p.absen_id] || []).push(p); });
    var sw = peta(ctx, 'Siswa');
    sesi.forEach(function (a) {
      var h = hasil[a.coach_id] = hasil[a.coach_id] || { coach_id: a.coach_id, nama: (co[a.coach_id] || {}).nama || a.coach_id, lisensi: (co[a.coach_id] || {}).lisensi || '', jenis_kelamin: (co[a.coach_id] || {}).jenis_kelamin || '', kategori: {}, total_sesi: 0, total: 0, rincian: [] };
      var t = cariTarif(a.kategori_sesi, a.coach_id, a.tanggal), k = h.kategori[a.kategori_sesi] = h.kategori[a.kategori_sesi] || { kategori: a.kategori_sesi, sesi: 0, subtotal: 0, tarif: t.tarif, khusus: t.khusus };
      k.sesi++; k.subtotal += t.tarif; h.total_sesi++; h.total += t.tarif;
      h.rincian.push({ tanggal: a.tanggal, kategori: a.kategori_sesi, kolam: (kl[a.kolam_id] || {}).nama_resmi || '-', tarif: t.tarif, sesi_lebih: a.sesi_lebih === 'Y', peserta: (nama[a.absen_id] || []).map(function (p) { return ((sw[p.siswa_id] || {}).nama || '') + ' (' + p.status + ')'; }).join(', ') });
    });
    return Object.keys(hasil).map(function (k) { var h = hasil[k]; h.kategori = Object.keys(h.kategori).map(function (x) { return h.kategori[x]; }); h.rincian = urut(h.rincian, function (r) { return r.tanggal; }, true); return h; }).sort(function (a, b) { return b.total - a.total; });
  }
  function svcHonorRekap(ctx, d) {
    var bulan = bulanValid(d.bulan) ? d.bulan : bulanDari(ctx.hariIni), semuaBoleh = punya(ctx, 'honor.rekap_lihat');
    if (semuaBoleh) {
      var data = rekapHonor(ctx, bulan, d.coach_id || '');
      return { bulan: bulan, nominal: true, semua: true, pelatih: data, total: jumlah(data, function (x) { return x.total; }), total_sesi: jumlah(data, function (x) { return x.total_sesi; }), kategori: daftarKategori(ctx), tertutup: bulanTertutup(ctx, bulan + '-01'), bolehTarif: ctx.me.peran === 'owner' };
    }
    if (ctx.me.peran === 'pelatih' && punya(ctx, 'honor.rekap_sendiri')) {
      var nominal = punya(ctx, 'honor.nominal_sendiri'), x = rekapHonor(ctx, bulan, ctx.me.coach_id)[0] || { coach_id: ctx.me.coach_id, nama: ctx.me.nama, kategori: [], total_sesi: 0, total: 0, rincian: [] };
      if (!nominal) { delete x.total; x.kategori.forEach(function (k) { delete k.tarif; delete k.subtotal; delete k.khusus; }); x.rincian.forEach(function (r) { delete r.tarif; }); }
      return { bulan: bulan, nominal: nominal, semua: false, pelatih: [x], tertutup: bulanTertutup(ctx, bulan + '-01') };
    }
    throw Gagal('Anda tidak memiliki izin melihat rekap honor.', 'FORBIDDEN');
  }

  /* ---------- 14. Tutup bulan (P2) ---------- */
  function svcTutupList(ctx) {
    var b0 = bulanDari(ctx.hariIni), aktifT = trxAktif(ctx), o = [];
    for (var i = 0; i < 12; i++) {
      var b = geserBulan(b0, -i), t = cari(ctx, 'Tutup_Bulan', b), k = ringkasKas(aktifT.filter(function (x) { return bulanDari(x.tanggal) === b; }));
      o.push({ periode: b, nama: namaBulan(b), tertutup: !!t, ditutup_oleh: t ? namaPengguna(ctx, t.ditutup_oleh) : '', waktu: t ? t.waktu : '', ringkasan: t ? jsonAman(t.ringkasan_json, {}) : null, kas: k, bisaTutup: !t && b < b0 });
    }
    return { rows: o, boleh: punya(ctx, 'tutup_bulan') };
  }
  function svcTutupBulan(ctx, d) {
    var b = s(d.periode); if (!bulanValid(b)) throw Gagal('Periode tidak valid.');
    if (b >= bulanDari(ctx.hariIni)) throw Gagal('Hanya bulan yang sudah berlalu yang dapat ditutup.');
    if (cari(ctx, 'Tutup_Bulan', b)) throw Gagal('Bulan ini sudah ditutup.');
    var k = ringkasKas(trxAktif(ctx).filter(function (x) { return bulanDari(x.tanggal) === b; })), h = rekapHonor(ctx, b, '');
    var ring = { kas: k, honor_total: jumlah(h, function (x) { return x.total; }), sesi: jumlah(h, function (x) { return x.total_sesi; }), honor: h.map(function (x) { return { coach_id: x.coach_id, nama: x.nama, sesi: x.total_sesi, total: x.total }; }) };
    tambah(ctx, 'Tutup_Bulan', [{ periode: b, ditutup_oleh: oleh(ctx), waktu: kini(ctx), ringkasan_json: JSON.stringify(ring) }]);
    audit(ctx, 'TUTUP_BULAN', 'Periode ' + b, '', ring);
    return { periode: b, ringkasan: ring };
  }

  /* ---------- 15. Materi latihan ---------- */
  function svcMateriList(ctx, d) {
    var kelola = punya(ctx, 'materi.kelola'), q = s(d.q).toLowerCase();
    var rows = semua(ctx, 'Materi').filter(function (m) { return (kelola || m.aktif !== 'T') && (!d.kategori || m.kategori === d.kategori) && (!d.jenis || m.jenis === d.jenis) && (!q || (m.judul + ' ' + m.tag + ' ' + m.deskripsi).toLowerCase().indexOf(q) >= 0); });
    return { rows: urut(rows, function (m) { return m.dibuat_at; }, true).map(function (m) { var o = salin(m); o.url = m.drive_id ? ctx.env.urlBerkas(m.drive_id, true) : m.link; return o; }), kategori: unik(semua(ctx, 'Materi').map(function (m) { return m.kategori; }).filter(Boolean)), kelola: kelola };
  }
  function svcMateriSimpan(ctx, d) {
    var x = d.materi || {}, lama = x.materi_id ? wajibAda(ctx, 'Materi', x.materi_id, 'Materi') : null, f = {};
    var o = { judul: s(x.judul).slice(0, 120), kategori: s(x.kategori).slice(0, 40) || 'Umum', jenis: ['PDF', 'Video', 'Gambar', 'Teks'].indexOf(x.jenis) >= 0 ? x.jenis : 'Teks', link: s(x.link).slice(0, 500), tag: s(x.tag).slice(0, 120), deskripsi: s(x.deskripsi).slice(0, 2000), aktif: x.aktif === 'T' ? 'T' : 'Y' };
    if (!o.judul) f.judul = 'Wajib diisi';
    if (o.link && !/^https:\/\//i.test(o.link)) f.link = 'Harus diawali https://';
    if (d.berkas && d.berkas.base64) {
      var okM = { PDF: /pdf/, Gambar: /image\/(png|jpe?g|webp)/, Video: /video\// }[o.jenis];
      if (!okM || !okM.test(s(d.berkas.mime))) f.berkas = 'Tipe berkas tidak sesuai jenis';
      else if (Math.floor(d.berkas.base64.length * 3 / 4) > 20 * 1024 * 1024) f.berkas = 'Maksimal 20 MB';
    }
    if (Object.keys(f).length) throw Gagal('Periksa kembali materi.', 'VALIDATION', f);
    if (d.berkas && d.berkas.base64) o.drive_id = ctx.env.simpanBerkas({ nama: s(d.berkas.nama) || 'materi', mime: d.berkas.mime, base64: d.berkas.base64, folder: 'Materi' }).id;
    if (lama) { o.materi_id = lama.materi_id; ubah(ctx, 'Materi', [o]); } else { o.materi_id = idBaru(ctx, 'Materi'); o.dibuat_at = kini(ctx); o.drive_id = o.drive_id || ''; tambah(ctx, 'Materi', [o]); }
    return { materi_id: o.materi_id };
  }

  /* ---------- 16. Laporan PDF (GAS HTML → PDF; demo: cetak dari browser) ---------- */
  function svcLaporan(ctx, d) {
    wajibIzin(ctx, 'laporan.ekspor');
    var bulan = bulanValid(d.bulan) ? d.bulan : bulanDari(ctx.hariIni), id = atur(ctx, 'identitas'), judul, kepala, baris;
    function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    if (d.jenis === 'honor') {
      if (!punya(ctx, 'honor.rekap_lihat')) throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
      var h = rekapHonor(ctx, bulan, ''); judul = 'Rekap Honor Pelatih — ' + namaBulan(bulan); kepala = ['Pelatih', 'Rincian kategori', 'Sesi', 'Total'];
      baris = h.map(function (x) { return [x.nama, x.kategori.map(function (k) { return k.kategori + ': ' + k.sesi + ' × ' + rupiah(k.tarif); }).join('<br>'), x.total_sesi, rupiah(x.total)]; });
      baris.push(['<b>Total</b>', '', jumlah(h, function (x) { return x.total_sesi; }), '<b>' + rupiah(jumlah(h, function (x) { return x.total; })) + '</b>']);
    } else {
      wajibIzin(ctx, 'kas.lihat');
      var k = svcKasList(ctx, { bulan: bulan, status: 'aktif' }); judul = 'Laporan Arus Kas — ' + namaBulan(bulan); kepala = ['Tanggal', 'Kategori', 'Uraian', 'Masuk', 'Keluar'];
      baris = k.rows.slice().reverse().map(function (t) { return [tglIndo(t.tanggal), esc(t.kategori), esc(t.nama) + (t.penjelasan ? '<br><small>' + esc(t.penjelasan) + '</small>' : ''), t.tipe === 'Pemasukan' ? rupiah(t.nominal) : '', t.tipe === 'Pengeluaran' ? rupiah(t.nominal) : '']; });
      baris.push(['', '', '<b>Total</b>', '<b>' + rupiah(k.ringkas.masuk) + '</b>', '<b>' + rupiah(k.ringkas.keluar) + '</b>']);
      baris.push(['', '', 'Saldo awal ' + rupiah(k.ringkas.saldo_awal) + ' · Saldo akhir <b>' + rupiah(k.ringkas.saldo_akhir) + '</b>', '', '']);
    }
    var html = '<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11px;color:#1E293B;margin:28px}h1{font-size:16px;margin:0}p{color:#475569;margin:4px 0 14px}table{width:100%;border-collapse:collapse}th{background:#1E2A4A;color:#fff;text-align:left;padding:6px}td{border-bottom:1px solid #E2E8F0;padding:6px;vertical-align:top}td:nth-child(n+4){text-align:right}</style></head><body>' +
      '<h1>' + esc(id.nama_app) + ' · ' + esc(judul) + '</h1><p>Dicetak ' + tglIndo(ctx.hariIni) + ' oleh ' + esc(ctx.me.nama) + '</p><table><thead><tr>' + kepala.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      baris.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></body></html>';
    var pdf = ctx.env.htmlKePdf ? ctx.env.htmlKePdf(html, judul) : null;
    return { judul: judul, html: html, pdf: pdf, nama_berkas: judul.replace(/[^\w]+/g, '_') + '.pdf' };
  }

  /* ---------- 17. Dashboard per peran ---------- */
  function versiData(ctx) { return ctx.env.versiTabel ? ctx.env.versiTabel(['Paket_Aktif', 'Absensi_Sesi', 'Jadwal', 'Siswa', 'Pengaturan', 'Info_Kolam']) : String(ctx.now); }
  function aktivitasTerbaru(ctx, maks) {
    var a = [], sw = peta(ctx, 'Siswa'), co = peta(ctx, 'Pelatih'), kk = peta(ctx, 'Kategori_Kas'), ap = kelompok(semua(ctx, 'Absensi_Peserta'), function (p) { return p.absen_id; });
    urut(semua(ctx, 'Absensi_Sesi'), function (x) { return x.waktu_server; }, true).slice(0, 12).forEach(function (x) {
      if (x.status_rekam === 'dikoreksi') return;
      var ps = (ap[x.absen_id] || []).map(function (p) { return ((sw[p.siswa_id] || {}).nama || '').split(' ')[0] + ' ' + p.status; }).join(', ');
      a.push({ jenis: x.koreksi_dari ? 'koreksi' : 'absensi', waktu: x.waktu_server, judul: x.koreksi_dari ? 'Absensi dikoreksi' : 'Absensi sesi disimpan', teks: ((co[x.coach_id] || {}).nama || '') + ' · ' + ps, ref: x.absen_id });
    });
    urut(semua(ctx, 'Pendaftaran_Masuk'), function (x) { return x.dibuat_at; }, true).slice(0, 8).forEach(function (x) { var dd = jsonAman(x.data_json, {}); a.push({ jenis: 'daftar', waktu: x.dibuat_at, judul: x.tipe === 'perpanjangan' ? 'Perpanjangan masuk' : 'Pendaftaran masuk', teks: (dd.nama || '') + ' · ' + x.status, ref: x.id }); });
    if (punya(ctx, 'kas.lihat')) urut(semua(ctx, 'Transaksi'), function (x) { return x.dibuat_at; }, true).slice(0, 8).forEach(function (x) { a.push({ jenis: x.tipe === 'Pemasukan' ? 'masuk' : 'keluar', waktu: x.dibuat_at, judul: (x.tipe === 'Pemasukan' ? 'Kas masuk' : 'Kas keluar') + (x.status === 'batal' ? ' (batal)' : ''), teks: rupiah(x.nominal) + ' · ' + ((kk[x.kategori_id] || {}).nama || '') + ' · ' + x.nama, ref: x.trx_id }); });
    urut(semua(ctx, 'Buka_Kunci'), function (x) { return x.dibuat_at; }, true).slice(0, 5).forEach(function (x) { a.push({ jenis: 'kunci', waktu: x.dibuat_at, judul: 'Kunci absensi dibuka', teks: ((co[x.coach_id] || {}).nama || '') + ' · ' + tglIndo(x.tanggal) + ' — ' + x.alasan, ref: x.id }); });
    return urut(a, function (x) { return x.waktu; }, true).slice(0, maks || 8);
  }
  function svcDashAdmin(ctx) {
    if (ctx.me.peran !== 'owner' && ctx.me.peran !== 'admin') throw Gagal('Tidak diizinkan.', 'FORBIDDEN');
    var enrs = semua(ctx, 'Paket_Aktif').filter(function (e) { return e.status !== 'Selesai'; }).map(function (e) { return ringkasEnr(ctx, e); });
    var aktifSiswa = {}; enrs.forEach(function (e) { if (e.status === 'Aktif') e.peserta.forEach(function (p) { aktifSiswa[p.siswa_id] = 1; }); });
    var bulan = bulanDari(ctx.hariIni), baruBulan = semua(ctx, 'Paket_Aktif').filter(function (e) { return e.tipe === 'Pendaftaran' && bulanDari(e.tgl_mulai) === bulan; }).length;
    var habis = enrs.filter(function (e) { return e.status === 'HABIS'; }), sisa1 = enrs.filter(function (e) { return e.status === 'Aktif' && e.sisa === 1; });
    var perlu = urut(habis, function (e) { return e.hari_habis; }, true).concat(sisa1);
    var sesi = sesiTanggal(ctx, ctx.hariIni, ''), kas = null;
    if (punya(ctx, 'kas.lihat')) {
      var t = trxAktif(ctx), k = ringkasKas(t.filter(function (x) { return bulanDari(x.tanggal) === bulan; })), tren = [];
      for (var i = 5; i >= 0; i--) { var b = geserBulan(bulan, -i); tren.push(ringkasKas(t.filter(function (x) { return bulanDari(x.tanggal) === b; })).masuk); }
      kas = { masuk: k.masuk, keluar: k.keluar, saldo: k.saldo, saldo_total: ringkasKas(t).saldo, tren_masuk: tren };
    }
    return {
      nama: ctx.me.nama, hariIni: ctx.hariIni, kpi: { siswa_aktif: Object.keys(aktifSiswa).length, baru_bulan_ini: baruBulan, perlu: perlu.length, habis: habis.length, sisa1: sisa1.length, habis_lama: habis.filter(function (e) { return e.hari_habis > 3; }).length,
        sesi_total: sesi.length, sesi_sudah: sesi.filter(function (x) { return x.absen; }).length, sesi_belum: sesi.filter(function (x) { return !x.absen; }).length },
      perlu: perlu.slice(0, 12), sesi: sesi, batas: infoBatas(ctx, ctx.hariIni, ''), kas: kas,
      pendaftaran: urut(semua(ctx, 'Pendaftaran_Masuk').filter(function (r) { return r.status === 'Baru'; }), function (r) { return r.dibuat_at; }, true).slice(0, 5).map(function (r) { var dd = jsonAman(r.data_json, {}), p = cari(ctx, 'Paket', dd.paket); return { id: r.id, tipe: r.tipe, nama: dd.nama, paket: p ? p.nama : '-', kategori: kategoriSesi(p), dibuat_at: r.dibuat_at, bukti: !!r.bukti_file_id }; }),
      pendaftaran_baru: semua(ctx, 'Pendaftaran_Masuk').filter(function (r) { return r.status === 'Baru'; }).length,
      aktivitas: aktivitasTerbaru(ctx, 8),
      perhatian: perhatianCepat(ctx, enrs, sesi), info_kolam: infoKolamUntuk(ctx, ctx.hariIni, null), kolam: aktif(semua(ctx, 'Kolam')).map(function (k) { return { kolam_id: k.kolam_id, nama: k.nama_resmi }; }),
      bisa: { link: punya(ctx, 'pendaftaran.link'), verifikasi: punya(ctx, 'pendaftaran.verifikasi'), kas: punya(ctx, 'kas.input'), buka: punya(ctx, 'absensi.buka_kunci'), input: punya(ctx, 'absensi.input'), info_kolam: punya(ctx, 'jadwal.kelola') }
    };
  }
  function kejadianMendatang(ctx, enrId, nHari) {
    var rows = semua(ctx, 'Jadwal').filter(function (j) { return j.enr_id === enrId && j.aktif !== 'T' && j.status_slot === 'Terisi'; }), o = [], b = bagWIB(ctx.now), menitKini = b.H * 60 + b.M;
    var sudah = {}; absensiAktifEnr(ctx, enrId).forEach(function (a) { sudah[a.tanggal] = 1; });
    for (var i = 0; i < nHari; i++) {
      var t = geserTgl(ctx.hariIni, i), h = hariKe(t);
      rows.forEach(function (j) { if (num(j.hari) !== h || sudah[t]) return; if (i === 0 && menitDari(j.jam_selesai) < menitKini) return; o.push({ tanggal: t, hari: NAMA_HARI[h], jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, pelatih: (cari(ctx, 'Pelatih', j.coach_id) || {}).nama || '-', kolam: (cari(ctx, 'Kolam', j.kolam_id) || {}).nama_resmi || '-' }); });
    }
    return o;
  }
  function svcDashPelatih(ctx) {
    if (ctx.me.peran !== 'pelatih') throw Gagal('Portal ini khusus pelatih.', 'FORBIDDEN');
    var sesi = sesiTanggal(ctx, ctx.hariIni, ctx.me.coach_id), bulan = bulanDari(ctx.hariIni), besok = sesiTanggal(ctx, geserTgl(ctx.hariIni, 1), ctx.me.coach_id);
    var dihitung = semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.coach_id === ctx.me.coach_id && a.status_rekam !== 'dikoreksi' && a.dihitung === 'Y' && bulanDari(a.tanggal) === bulan; }).length;
    var kemarin = geserTgl(ctx.hariIni, -1), kunciKemarin = sesiTanggal(ctx, kemarin, ctx.me.coach_id).filter(function (x) { return !x.absen; });
    return { nama: ctx.me.nama, hariIni: ctx.hariIni, sesi: sesi, besok: besok.length, info_kolam: infoKolamUntuk(ctx, ctx.hariIni, null), batas: infoBatas(ctx, ctx.hariIni, ctx.me.coach_id), sesi_bulan_ini: dihitung,
      belum_kemarin: kunciKemarin.map(function (x) { return { enr_id: x.enr_id, peserta: x.enr.peserta.map(function (p) { return p.nama; }).join(' & '), batas: x.batas }; }),
      aturan: { status_dihitung: aturan(ctx).status_dihitung, absensi_paket_habis: aturan(ctx).absensi_paket_habis },
      materi: punya(ctx, 'materi.lihat') ? urut(aktif(semua(ctx, 'Materi')), function (m) { return m.dibuat_at; }, true).slice(0, 4).map(function (m) { return { materi_id: m.materi_id, judul: m.judul, jenis: m.jenis, kategori: m.kategori }; }) : [] };
  }
  function svcDashOrtu(ctx) {
    if (ctx.me.peran !== 'ortu') throw Gagal('Portal ini khusus orang tua.', 'FORBIDDEN');
    var id = atur(ctx, 'identitas'), anak = [], jadwal = [], riwayat = [], kolamAnak = {};
    ctx.me.siswa_ids.forEach(function (sid) {
      var sw = cari(ctx, 'Siswa', sid); if (!sw) return;
      var e = enrTerbaruSiswa(ctx, sid), r = e ? ringkasEnr(ctx, e) : null, nxt = e ? kejadianMendatang(ctx, e.enr_id, 21) : [];
      if (e) { kolamAnak[e.kolam_id] = 1; semua(ctx, 'Jadwal').forEach(function (j) { if (j.enr_id === e.enr_id && j.aktif !== 'T') kolamAnak[j.kolam_id] = 1; }); }
      anak.push({ siswa_id: sid, nama: sw.nama, kategori: sw.kategori, usia: usia(sw.tgl_lahir, ctx.hariIni), kode_akses: sw.kode_akses, paket: r, berikutnya: nxt[0] || null });
      nxt.slice(0, 6).forEach(function (x) { x.siswa = sw.nama; x.kategori = r ? r.kategori : ''; jadwal.push(x); });
      (pesertaPeta(ctx).siswa[sid] || []).forEach(function (enrId) {
        riwayatEnr(ctx, enrId).forEach(function (a) { var me = a.peserta.filter(function (p) { return p.siswa_id === sid; })[0]; if (me) riwayat.push({ siswa: sw.nama, tanggal: a.tanggal, pertemuan_ke: a.pertemuan_ke, pelatih: a.pelatih, kolam: a.kolam, kategori: a.kategori, status: me.status, dihitung: a.dihitung }); });
      });
    });
    return { nama: ctx.me.nama, anak: anak, jadwal: urut(jadwal, function (x) { return x.tanggal + x.jam_mulai; }), riwayat: urut(riwayat, function (x) { return x.tanggal; }, true).slice(0, 80),
      kontak_admin: id.kontak_admin, nama_app: id.nama_app, versi: versiData(ctx), info_kolam: infoKolamUntuk(ctx, ctx.hariIni, Object.keys(kolamAnak)) };
  }
  function svcOrtuVersi(ctx) { return { versi: versiData(ctx) }; }

  /* ---------- 18. Analitik (menu baru) ---------- */
  function svcAnalitik(ctx, d) {
    var n = num(d.bulan_ke) === 6 ? 6 : 12, b0 = bulanDari(ctx.hariIni), bulanList = [];
    for (var i = n - 1; i >= 0; i--) bulanList.push(geserBulan(b0, -i));
    var awal = bulanList[0], pk = peta(ctx, 'Paket'), kl = peta(ctx, 'Kolam'), kk = peta(ctx, 'Kategori_Kas'), pe = peta(ctx, 'Paket_Aktif');
    var trx = trxAktif(ctx).filter(function (t) { return bulanDari(t.tanggal) >= awal; }), enrs = semua(ctx, 'Paket_Aktif');
    var sesi = semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.status_rekam !== 'dikoreksi' && bulanDari(a.tanggal) >= awal; });
    var ap = kelompok(semua(ctx, 'Absensi_Peserta'), function (p) { return p.absen_id; });
    var perBulan = bulanList.map(function (b) {
      var t = trx.filter(function (x) { return bulanDari(x.tanggal) === b; }), k = ringkasKas(t), sb = sesi.filter(function (a) { return bulanDari(a.tanggal) === b; }), siswa = {}, hadir = 0, totalP = 0;
      sb.forEach(function (a) { (ap[a.absen_id] || []).forEach(function (p) { siswa[p.siswa_id] = 1; totalP++; if (p.status === 'Hadir') hadir++; }); });
      var eb = enrs.filter(function (e) { return bulanDari(e.tgl_mulai) === b; });
      return { bulan: b, label: NAMA_BULAN[Number(b.slice(5)) - 1].slice(0, 3) + ' ' + b.slice(2, 4), masuk: k.masuk, keluar: k.keluar, laba: k.saldo,
        baru: eb.filter(function (e) { return e.tipe === 'Pendaftaran' && (pk[e.paket_id] || {}).jenis !== 'Trial'; }).length, perpanjangan: eb.filter(function (e) { return e.tipe === 'Perpanjangan'; }).length,
        trial: eb.filter(function (e) { return (pk[e.paket_id] || {}).jenis === 'Trial'; }).length, sesi: sb.filter(function (a) { return a.dihitung === 'Y'; }).length, siswa_aktif: Object.keys(siswa).length, kehadiran: totalP ? Math.round(hadir / totalP * 1000) / 10 : 0 };
    });
    var perKategori = {}, perJenis = {}, perKolam = {}, perPaket = {};
    trx.filter(function (t) { return t.tipe === 'Pemasukan'; }).forEach(function (t) {
      var e = pe[t.enr_id], p = e ? pk[e.paket_id] : null, kat = p ? kategoriSesi(p) : ((kk[t.kategori_id] || {}).nama || 'Lainnya'), jen = p ? p.jenis : 'Non-paket', kol = e ? ((kl[e.kolam_id] || {}).nama_resmi || '-') : 'Non-paket';
      perKategori[kat] = (perKategori[kat] || 0) + num(t.nominal); perJenis[jen] = (perJenis[jen] || 0) + num(t.nominal); perKolam[kol] = (perKolam[kol] || 0) + num(t.nominal);
      if (p) { var x = perPaket[p.paket_id] = perPaket[p.paket_id] || { nama: p.nama, kategori: kategoriSesi(p), nilai: 0, jumlah: 0 }; x.nilai += num(t.nominal); if (!/^Biaya tambahan/.test(t.penjelasan)) x.jumlah++; }
    });
    function keDaftar(m) { var tot = jumlah(Object.keys(m), function (k) { return m[k]; }); return Object.keys(m).map(function (k) { return { nama: k, nilai: m[k], persen: tot ? Math.round(m[k] / tot * 1000) / 10 : 0 }; }).sort(function (a, b) { return b.nilai - a.nilai; }); }
    var selesai = enrs.filter(function (e) { var st = statusEfektif(ctx, e).status, j = (pk[e.paket_id] || {}).jenis; return j !== 'Trial' && (st === 'HABIS' || st === 'Selesai') && bulanDari(e.habis_at || e.selesai_at || e.tgl_mulai) >= awal; });
    var anak = {}; enrs.forEach(function (e) { if (e.induk_enr_id) anak[e.induk_enr_id] = 1; });
    var diperpanjang = selesai.filter(function (e) { return anak[e.enr_id]; }).length;
    var pp = pesertaPeta(ctx), trialSiswa = {}, konversi = 0;
    enrs.forEach(function (e) { if ((pk[e.paket_id] || {}).jenis === 'Trial' && bulanDari(e.tgl_mulai) >= awal) (pp.enr[e.enr_id] || []).forEach(function (sid) { trialSiswa[sid] = e.tgl_mulai; }); });
    Object.keys(trialSiswa).forEach(function (sid) { if ((pp.siswa[sid] || []).some(function (id) { var e = pe[id]; return e && (pk[e.paket_id] || {}).jenis !== 'Trial' && e.tgl_mulai >= trialSiswa[sid]; })) konversi++; });
    var co = peta(ctx, 'Pelatih'), bLalu = geserBulan(b0, -1), perPelatih = {};
    sesi.forEach(function (a) { if (a.dihitung !== 'Y') return; var b = bulanDari(a.tanggal); if (b !== b0 && b !== bLalu) return; var x = perPelatih[a.coach_id] = perPelatih[a.coach_id] || { nama: (co[a.coach_id] || {}).nama || a.coach_id, ini: 0, lalu: 0 }; if (b === b0) x.ini++; else x.lalu++; });
    var ini = perBulan[perBulan.length - 1], lalu = perBulan[perBulan.length - 2] || { masuk: 0, siswa_aktif: 0 }, totalMasuk = jumlah(perBulan, function (x) { return x.masuk; });
    var habisLama = enrs.filter(function (e) { var r = ringkasEnr(ctx, e); return r.status === 'HABIS' && r.hari_habis > 3; }).length;
    var siswaAktifKini = {}; enrs.forEach(function (e) { if (statusEfektif(ctx, e).status === 'Aktif') (pp.enr[e.enr_id] || []).forEach(function (sid) { siswaAktifKini[sid] = 1; }); });
    var kategoriL = keDaftar(perKategori), kpi = {
      pendapatan_periode: totalMasuk, rata_bulanan: Math.round(totalMasuk / n), laba_periode: jumlah(perBulan, function (x) { return x.laba; }),
      pendapatan_bulan_ini: ini.masuk, tumbuh: lalu.masuk ? Math.round((ini.masuk - lalu.masuk) / lalu.masuk * 1000) / 10 : null,
      siswa_aktif: Object.keys(siswaAktifKini).length, arpu: ini.siswa_aktif ? Math.round(ini.masuk / ini.siswa_aktif) : 0,
      tingkat_perpanjangan: selesai.length ? Math.round(diperpanjang / selesai.length * 1000) / 10 : null, paket_berakhir: selesai.length, diperpanjang: diperpanjang,
      konversi_trial: Object.keys(trialSiswa).length ? Math.round(konversi / Object.keys(trialSiswa).length * 1000) / 10 : null, trial: Object.keys(trialSiswa).length, trial_lanjut: konversi,
      kehadiran: (function () { var a = 0, b = 0; perBulan.forEach(function (x) { if (x.kehadiran) { a += x.kehadiran; b++; } }); return b ? Math.round(a / b * 10) / 10 : 0; })(), habis_lama: habisLama
    };
    var wawasan = [];
    if (kpi.tumbuh != null) wawasan.push({ jenis: kpi.tumbuh >= 0 ? 'naik' : 'turun', teks: 'Pendapatan ' + namaBulan(b0) + ' ' + (kpi.tumbuh >= 0 ? 'naik ' : 'turun ') + String(Math.abs(kpi.tumbuh)).replace('.', ',') + '% dibanding bulan lalu.' });
    if (kategoriL[0]) wawasan.push({ jenis: 'info', teks: 'Kategori penyumbang terbesar: ' + kategoriL[0].nama + ' (' + String(kategoriL[0].persen).replace('.', ',') + '% pendapatan periode ini).' });
    if (kpi.tingkat_perpanjangan != null) wawasan.push({ jenis: kpi.tingkat_perpanjangan >= 60 ? 'naik' : 'waspada', teks: diperpanjang + ' dari ' + selesai.length + ' paket yang berakhir diperpanjang (' + String(kpi.tingkat_perpanjangan).replace('.', ',') + '%).' });
    if (habisLama) wawasan.push({ jenis: 'waspada', teks: habisLama + ' paket HABIS belum ditindaklanjuti lebih dari 3 hari — target 0.' });
    if (kpi.konversi_trial != null) wawasan.push({ jenis: 'info', teks: konversi + ' dari ' + kpi.trial + ' peserta Trial lanjut ke paket reguler (' + String(kpi.konversi_trial).replace('.', ',') + '%).' });
    return { bulan: bulanList, perBulan: perBulan, kpi: kpi, perKategori: kategoriL, perJenis: keDaftar(perJenis), perKolam: keDaftar(perKolam),
      perPaket: Object.keys(perPaket).map(function (k) { return perPaket[k]; }).sort(function (a, b) { return b.nilai - a.nilai; }).slice(0, 8),
      perPelatih: Object.keys(perPelatih).map(function (k) { return perPelatih[k]; }).sort(function (a, b) { return b.ini - a.ini; }), wawasan: wawasan, periode: n };
  }
  /* ---------- 19. Halaman masuk (slideshow) & email ringkas ke Owner (PRD 4.5, P2) ---------- */
  /* Email Owner dikumpulkan dulu, lalu dikirim SETELAH kunci dilepas (lihat jalankan) */
  function emailOwner(ctx, subjek, pesan) {
    try {
      var id = atur(ctx, 'identitas');
      if (!emailValid(id.email_owner)) return;
      ctx._email.push({ ke: s(id.email_owner), subjek: '[' + id.nama_app + '] ' + subjek, pesan: pesan, nama: id.nama_app });
    } catch (e) { }
  }
  function kirimEmailTertunda(ctx) {
    if (!ctx._email.length || !ctx.env.emailKirim) return;
    ctx._email.forEach(function (m) { try { ctx.env.emailKirim(m); } catch (e) { } });
    ctx._email = [];
  }

  /* Tautan Google Drive (berbagi/unduh/buka) → URL gambar langsung */
  function urlGambarSlide(u) {
    u = s(u);
    var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=|thumbnail\?id=)([-\w]{25,})/) || u.match(/docs\.google\.com\/uc\?(?:export=\w+&)?id=([-\w]{25,})/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1920';
    return u;
  }
  function validasiLogin(ctx, v) {
    var o = salin(PENGATURAN_BAWAAN.login), f = {};
    var daftar = (Array.isArray(v.slides) ? v.slides : []).map(urlGambarSlide).filter(Boolean);
    if (daftar.length > LOGIN_MAKS_SLIDE) f.slides = 'Maksimal ' + LOGIN_MAKS_SLIDE + ' gambar';
    daftar.forEach(function (u) {
      var ok = /^https:\/\/[^\s"'<>]{8,600}$/.test(u) || (ctx.env.mode === 'demo' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(u)) || /^assets\/[\w\/.-]{3,120}$/.test(u);
      if (!ok) f.slides = 'Alamat gambar harus diawali https:// (atau tautan Google Drive yang dibagikan publik).';
    });
    o.slides = daftar.slice(0, LOGIN_MAKS_SLIDE);
    o.headline = s(v.headline).slice(0, 90); if (!o.headline) f.headline = 'Judul wajib diisi';
    o.subjudul = s(v.subjudul).slice(0, 180);
    var d = Math.round(num(v.durasi));
    if (d < 3000 || d > 15000) f.durasi = 'Antara 3.000 dan 15.000 ms'; else o.durasi = d;
    if (Object.keys(f).length) throw Gagal('Periksa kembali pengaturan halaman masuk.', 'VALIDATION', f);
    return o;
  }
  /* Unggah satu gambar slide → Drive (publik, folder Logo/Masuk). Daftar slide baru tersimpan saat "Simpan". */
  function svcUnggahSlide(ctx, d) {
    wajibIzin(ctx, 'pengaturan.tampilan');
    var b = d.berkas || {};
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(b.mime) < 0) throw Gagal('Format gambar harus JPG, PNG, atau WEBP.', 'VALIDATION', { slide: 'JPG/PNG/WEBP' });
    if (Math.floor(String(b.base64 || '').length * 3 / 4) > 3 * 1024 * 1024) throw Gagal('Ukuran gambar maksimal 3 MB.', 'VALIDATION', { slide: 'Maks 3 MB' });
    var ext = b.mime === 'image/png' ? 'png' : b.mime === 'image/webp' ? 'webp' : 'jpg';
    var f = ctx.env.simpanBerkas({ nama: 'masuk-' + ctx.env.acak(8) + '.' + ext, mime: b.mime, base64: b.base64, folder: 'Logo/Masuk', publik: true, lebar: 1920 });
    audit(ctx, 'PENGATURAN', 'login.unggah', '', f.id);
    return { url: f.url };
  }
  /* ---------- 20. Perhatian cepat (dashboard) & info kondisi kolam harian ---------- */
  var STATUS_ABSEN_TIDAK = ['Izin', 'Hangus'];
  /* Tiga filter sekali klik di dashboard Admin/Owner */
  function perhatianCepat(ctx, enrs, sesiHari) {
    var b = bagWIB(ctx.now), menitKini = b.H * 60 + b.M;
    var habis3 = enrs.filter(function (e) { return e.status === 'HABIS' && e.hari_habis > 3; }).sort(function (a, c) { return c.hari_habis - a.hari_habis; }).map(function (e) {
      return { enr_id: e.enr_id, siswa_id: (e.peserta[0] || {}).siswa_id, nama: e.peserta.map(function (p) { return p.nama; }).join(' & '), paket: e.paket, kategori: e.kategori, hari_habis: e.hari_habis };
    });
    /* Izin/Hangus pada 2 pertemuan terakhir berturut-turut (per peserta, paket yang masih berjalan) */
    var ap = kelompok(semua(ctx, 'Absensi_Peserta'), function (p) { return p.absen_id; }), absen2 = [];
    var perEnr = kelompok(semua(ctx, 'Absensi_Sesi').filter(function (a) { return a.status_rekam !== 'dikoreksi'; }), function (a) { return a.enr_id; });
    enrs.forEach(function (e) {
      var rows = urut(perEnr[e.enr_id] || [], function (a) { return a.tanggal + a.waktu_server; }, true);
      if (rows.length < 2) return;
      e.peserta.forEach(function (p) {
        var st = [];
        rows.some(function (a) { var x = (ap[a.absen_id] || []).filter(function (q) { return q.siswa_id === p.siswa_id; })[0]; if (x) st.push({ status: x.status, tanggal: a.tanggal }); return st.length >= 2; });
        if (st.length === 2 && STATUS_ABSEN_TIDAK.indexOf(st[0].status) >= 0 && STATUS_ABSEN_TIDAK.indexOf(st[1].status) >= 0)
          absen2.push({ enr_id: e.enr_id, siswa_id: p.siswa_id, nama: p.nama, paket: e.paket, kategori: e.kategori, status: [st[0].status, st[1].status], terakhir: st[0].tanggal });
      });
    });
    var belum = (sesiHari || []).filter(function (x) { return !x.absen && x.jam_mulai && menitDari(x.jam_mulai) <= menitKini; }).map(function (x) {
      return { enr_id: x.enr_id, jam_mulai: x.jam_mulai, jam_selesai: x.jam_selesai, pelatih: x.pelatih, coach_id: x.coach_id, nama: x.enr.peserta.map(function (p) { return p.nama; }).join(' & '), kategori: x.enr.kategori, kolam: x.enr.kolam };
    });
    return { habis3: habis3, absen2: urut(absen2, function (x) { return x.terakhir; }, true), belum_absen: belum };
  }

  /* Info kolam: per tanggal & per kolam ('' = semua kolam); otomatis tidak tampil setelah tanggalnya lewat */
  var LEVEL_INFO = ['info', 'waspada', 'penting'];
  function infoKolamUntuk(ctx, tanggal, kolamIds) {
    var kl = peta(ctx, 'Kolam'), rows;
    /* sheet Info_Kolam dibuat setupAppEnvironment v1.2; bila belum dijalankan, dashboard tetap tampil tanpa banner */
    try { rows = semua(ctx, 'Info_Kolam'); } catch (e) { return []; }
    return urut(rows.filter(function (i) {
      return i.aktif !== 'T' && i.tanggal === tanggal && (!kolamIds || !i.kolam_id || kolamIds.indexOf(i.kolam_id) >= 0);
    }), function (i) { return LEVEL_INFO.indexOf(i.level) * -1 + '|' + i.dibuat_at; }).map(function (i) {
      return { info_id: i.info_id, tanggal: i.tanggal, kolam_id: i.kolam_id, kolam: i.kolam_id ? ((kl[i.kolam_id] || {}).nama_resmi || i.kolam_id) : 'Semua kolam', level: i.level, pesan: i.pesan };
    });
  }
  function svcInfoKolamList(ctx, d) {
    var dari = tglValid(d.tanggal) ? d.tanggal : ctx.hariIni, sampai = geserTgl(dari, 14), kl = peta(ctx, 'Kolam');
    var rows = semua(ctx, 'Info_Kolam').filter(function (i) { return i.aktif !== 'T' && i.tanggal >= dari && i.tanggal <= sampai; });
    return { rows: urut(rows, function (i) { return i.tanggal + i.dibuat_at; }).map(function (i) { var o = salin(i); o.kolam = i.kolam_id ? ((kl[i.kolam_id] || {}).nama_resmi || i.kolam_id) : 'Semua kolam'; o.oleh = namaPengguna(ctx, i.dibuat_oleh); return o; }),
      kolam: aktif(semua(ctx, 'Kolam')).map(function (k) { return { kolam_id: k.kolam_id, nama: k.nama_resmi }; }), hariIni: ctx.hariIni, bisa: punya(ctx, 'jadwal.kelola') };
  }
  function svcInfoKolamSimpan(ctx, d) {
    var f = {}, o = { tanggal: s(d.tanggal) || ctx.hariIni, kolam_id: s(d.kolam_id), level: LEVEL_INFO.indexOf(d.level) >= 0 ? d.level : 'info', pesan: s(d.pesan).slice(0, 200) };
    if (!tglValid(o.tanggal) || o.tanggal < ctx.hariIni || o.tanggal > geserTgl(ctx.hariIni, 30)) f.tanggal = 'Hari ini sampai 30 hari ke depan';
    if (o.kolam_id && !cari(ctx, 'Kolam', o.kolam_id)) f.kolam_id = 'Kolam tidak dikenal';
    if (o.pesan.length < 4) f.pesan = 'Tulis catatan (min. 4 karakter)';
    if (Object.keys(f).length) throw Gagal('Periksa kembali catatan kolam.', 'VALIDATION', f);
    var lama = d.info_id ? wajibAda(ctx, 'Info_Kolam', d.info_id, 'Catatan') : null;
    if (lama) { o.info_id = lama.info_id; o.aktif = 'Y'; o.dibuat_oleh = lama.dibuat_oleh; o.dibuat_at = lama.dibuat_at; ubah(ctx, 'Info_Kolam', [o]); }
    else { o.info_id = idBaru(ctx, 'Info_Kolam'); o.aktif = 'Y'; o.dibuat_oleh = oleh(ctx); o.dibuat_at = kini(ctx); tambah(ctx, 'Info_Kolam', [o]); }
    audit(ctx, lama ? 'INFO_KOLAM_UBAH' : 'INFO_KOLAM_TAMBAH', 'Info_Kolam:' + o.info_id, lama ? { pesan: lama.pesan } : '', { tanggal: o.tanggal, kolam_id: o.kolam_id, pesan: o.pesan });
    return { info: cari(ctx, 'Info_Kolam', o.info_id) };
  }
  function svcInfoKolamHapus(ctx, d) {
    var i = wajibAda(ctx, 'Info_Kolam', d.info_id, 'Catatan');
    ubah(ctx, 'Info_Kolam', [{ info_id: i.info_id, aktif: 'T' }]);
    audit(ctx, 'INFO_KOLAM_HAPUS', 'Info_Kolam:' + i.info_id, { pesan: i.pesan }, '');
    return { ok: true };
  }

  /* ---------- 22. Tabel rute: aksi → izin → layanan ---------- */
  var OA = ['owner', 'admin'];
  var RUTE = {
    'auth.masuk': { fn: svcMasuk, publik: true, tulis: true },
    'auth.masukOrtu': { fn: svcMasukOrtu, publik: true, tulis: true },
    'auth.saya': { fn: svcSaya },
    'auth.gantiSandi': { fn: svcGantiSandi, tulis: true },
    'pub.config': { fn: svcPubConfig, publik: true },
    'pub.formDaftar': { fn: svcPubFormDaftar, publik: true },
    'pub.kirimDaftar': { fn: svcPubKirimDaftar, publik: true, tulis: true },
    'sync.ack': { fn: svcSyncAck, publik: true, tulis: true },

    'dash.admin': { fn: svcDashAdmin, peran: OA },
    'dash.pelatih': { fn: svcDashPelatih, peran: ['pelatih'] },
    'dash.ortu': { fn: svcDashOrtu, peran: ['ortu'] },
    'dash.ortuVersi': { fn: svcOrtuVersi, peran: ['ortu'] },
    'analitik.data': { fn: svcAnalitik, izin: ['analitik.lihat'] },

    'daftar.linkBuat': { fn: svcLinkBuat, izin: ['pendaftaran.link'], tulis: true },
    'daftar.linkList': { fn: svcLinkList, izin: ['pendaftaran.link'] },
    'daftar.masukList': { fn: svcMasukList, izin: ['pendaftaran.verifikasi'] },
    'daftar.verifikasi': { fn: svcVerifikasi, izin: ['pendaftaran.verifikasi'], tulis: true },
    'daftar.tolak': { fn: svcTolak, izin: ['pendaftaran.verifikasi'], tulis: true },

    'siswa.list': { fn: svcSiswaList, izin: ['siswa.lihat'] },
    'siswa.detail': { fn: svcSiswaDetail, izin: ['siswa.lihat'] },
    'siswa.simpan': { fn: svcSiswaSimpan, izin: ['siswa.kelola'], tulis: true },
    'paket.buat': { fn: svcPaketBuat, izin: ['siswa.kelola'], tulis: true },
    'paket.ubah': { fn: svcPaketUbah, izin: ['siswa.kelola'], tulis: true },
    'paket.selesai': { fn: svcPaketSelesai, izin: ['siswa.kelola'], tulis: true },

    'jadwal.list': { fn: svcJadwalList, izin: ['jadwal.lihat'] },
    'jadwal.simpan': { fn: svcJadwalSimpan, izin: ['jadwal.kelola'], tulis: true },
    'jadwal.hapus': { fn: svcJadwalHapus, izin: ['jadwal.kelola'], tulis: true },
    'kolam.info': { fn: svcInfoKolamList, peran: OA },
    'kolam.infoSimpan': { fn: svcInfoKolamSimpan, izin: ['jadwal.kelola'], tulis: true },
    'kolam.infoHapus': { fn: svcInfoKolamHapus, izin: ['jadwal.kelola'], tulis: true },

    'absensi.hari': { fn: svcAbsensiHari, peran: ['owner', 'admin', 'pelatih'] },
    'absensi.simpan': { fn: svcAbsensiSimpan, izin: ['absensi.input'], tulis: true },
    'absensi.koreksi': { fn: svcAbsensiKoreksi, izin: ['absensi.koreksi', 'absensi.input'], tulis: true },
    'absensi.riwayat': { fn: svcAbsensiRiwayat, izin: ['absensi.riwayat'] },
    'absensi.aturBatas': { fn: svcAturBatas, izin: ['absensi.atur_batas'], tulis: true },
    'absensi.bukaKunci': { fn: svcBukaKunci, izin: ['absensi.buka_kunci'], tulis: true },
    'absensi.bukaKunciList': { fn: svcBukaKunciList, peran: OA },

    'materi.list': { fn: svcMateriList, izin: ['materi.lihat'] },
    'materi.simpan': { fn: svcMateriSimpan, izin: ['materi.kelola'], tulis: true },

    'kas.list': { fn: svcKasList, izin: ['kas.lihat'] },
    'kas.input': { fn: svcKasInput, izin: ['kas.input'], tulis: true },
    'kas.ubah': { fn: svcKasUbah, owner: true, tulis: true },
    'kas.batal': { fn: svcKasBatal, owner: true, tulis: true },
    'laporan.buat': { fn: svcLaporan, izin: ['laporan.ekspor'] },
    'honor.rekap': { fn: svcHonorRekap, peran: ['owner', 'admin', 'pelatih'] },
    'tutup.list': { fn: svcTutupList, izin: ['tutup_bulan', 'kas.lihat'] },
    'tutup.tutup': { fn: svcTutupBulan, izin: ['tutup_bulan'], tulis: true },

    'atur.ambil': { fn: svcAturAmbil, peran: OA },
    'atur.simpan': { fn: svcAturSimpan, peran: OA, tulis: true },
    'atur.unggah': { fn: svcUnggahIdentitas, peran: OA, tulis: true },
    'atur.unggahSlide': { fn: svcUnggahSlide, peran: OA, tulis: true },
    'atur.kembalikan': { fn: svcAturKembalikan, peran: OA, tulis: true },
    'atur.sinkron': { fn: svcSinkronUlang, izin: ['pengaturan.sinkron'], tulis: true },
    'master.simpan': { fn: svcMasterSimpan, izin: ['pengaturan.master'], tulis: true },
    'form.simpan': { fn: svcFormSimpan, izin: ['pengaturan.form'], tulis: true },

    'owner.harga': { fn: svcHargaAmbil, peran: OA },
    'owner.rekening': { fn: svcRekeningSimpan, owner: true, tulis: true },
    'owner.hargaSimpan': { fn: svcHargaSimpan, owner: true, tulis: true },
    'owner.tarif': { fn: svcTarifSimpan, owner: true, tulis: true },
    'owner.aturan': { fn: svcAturanSimpan, owner: true, tulis: true },
    'hak.ambil': { fn: svcHakAmbil, owner: true },
    'hak.simpan': { fn: svcHakSimpan, owner: true, tulis: true },
    'hak.reset': { fn: svcHakReset, owner: true, tulis: true },
    'akun.list': { fn: svcAkunList, peran: OA },
    'akun.simpan': { fn: svcAkunSimpan, peran: OA, tulis: true },
    'akun.reset': { fn: svcAkunReset, peran: OA, tulis: true },
    'log.list': { fn: svcLogList, owner: true },

    'berkas.ambil': { fn: function (ctx, d) { if (!ctx.env.ambilBerkas) throw Gagal('Tidak tersedia.'); return ctx.env.ambilBerkas(s(d.id)); }, peran: OA }
  };

  /* ---------- 23. Titik masuk tunggal ---------- */
  function jalankan(env, req) {
    var t0 = env.sekarang(), ctx = buatKonteks(env, t0), aksi = s(req && req.action), r = RUTE[aksi];
    try {
      if (!r) throw Gagal('Aksi tidak dikenal: ' + aksi, 'NOT_FOUND');
      if (!r.publik) { ctx.me = verifikasiToken(ctx, req.token); if (!ctx.me) throw Gagal('Sesi Anda berakhir. Silakan masuk kembali.', 'AUTH'); }
      var jalan = function () {
        if (r.tulis) { ctx._peta = {}; ctx._matriks = null; ctx._pp = null; }
        if (r.owner) wajibOwner(ctx);
        if (r.peran && r.peran.indexOf(ctx.me.peran) < 0) throw Gagal('Menu ini bukan untuk peran Anda.', 'FORBIDDEN');
        if (r.izin && !r.izin.some(function (i) { return punya(ctx, i); })) throw Gagal('Anda tidak memiliki izin untuk tindakan ini.', 'FORBIDDEN');
        return r.fn(ctx, (req && req.payload) || {});
      };
      var data = r.tulis ? env.kunci(jalan) : jalan();
      kirimEmailTertunda(ctx);   // di luar kunci: tidak menahan penulis lain
      return { ok: true, data: data, ms: env.sekarang() - t0, t: env.sekarang(), v: VERSI_APP, hv: ctx.me ? num(atur(ctx, 'hak_akses_versi')) : undefined };
    } catch (e) {
      if (e && e.__inti) {
        if (e.code === 'FORBIDDEN' && ctx.me) { try { env.kunci(function () { audit(ctx, 'DITOLAK', aksi, '', e.message); }); } catch (x) { } }
        return { ok: false, error: { message: e.message, code: e.code, fields: e.fields || null, data: e.data || null }, ms: env.sekarang() - t0, t: env.sekarang(), v: VERSI_APP, hv: ctx.me ? num(atur(ctx, 'hak_akses_versi')) : undefined };
      }
      return { ok: false, error: { message: 'Terjadi kesalahan di server: ' + (e && e.message ? e.message : String(e)), code: 'SERVER' }, ms: env.sekarang() - t0, v: VERSI_APP };
    }
  }
  function konteksSistem(env) { var ctx = buatKonteks(env, env.sekarang()); ctx.me = { user_id: 'sistem', peran: 'owner', nama: 'Sistem', siswa_ids: [] }; return ctx; }

  /* Setup awal idempoten: hanya MENAMBAH yang belum ada (dipakai setup GAS & seed demo) */
  function setupAwal(env, o) {
    o = o || {};
    var ctx = konteksSistem(env), log = [], hasil = {};
    env.kunci(function () {
      if (!semua(ctx, 'Kategori_Kas').length) {
        tambah(ctx, 'Kategori_Kas', [['Pendaftaran', 'Pemasukan', 'Y'], ['Perpanjangan', 'Pemasukan', 'Y'], ['Penambahan Biaya', 'Pemasukan', 'Y'], ['Trial', 'Pemasukan', 'Y'], ['Tiket Kolam', 'Pengeluaran', 'T'], ['Honor Pelatih', 'Pengeluaran', 'T'], ['Lainnya', 'Pengeluaran', 'T'], ['Pemasukan Lain', 'Pemasukan', 'T']]
          .map(function (x, i) { return { kategori_id: 'KK-' + p2(i + 1), nama: x[0], tipe: x[1], aktif: 'Y', sistem: x[2] }; }));
        log.push('+ Kategori_Kas bawaan');
      }
      /* v1.2: input manual tidak boleh memakai kategori otomatis → pastikan ada kategori Pemasukan manual */
      if (!semua(ctx, 'Kategori_Kas').some(function (k) { return k.tipe === 'Pemasukan' && k.sistem !== 'Y'; })) { tambah(ctx, 'Kategori_Kas', [{ kategori_id: idBaru(ctx, 'Kategori_Kas'), nama: 'Pemasukan Lain', tipe: 'Pemasukan', aktif: 'Y', sistem: 'T' }]); log.push('+ Kategori_Kas Pemasukan Lain'); }
      if (!semua(ctx, 'Hak_Akses').length) { var m = { admin: {}, pelatih: {}, ortu: {} }; IZIN.forEach(function (i) { i.bawaan.forEach(function (p) { m[p][i.k] = true; }); }); tulisMatriks(ctx, m, 'Matriks bawaan'); log.push('+ Hak_Akses bawaan'); }
      if (!semua(ctx, 'Aturan_Bisnis').length) { tambah(ctx, 'Aturan_Bisnis', Object.keys(ATURAN_BAWAAN).map(function (k) { return { key: k, value: JSON.stringify(ATURAN_BAWAAN[k]), versi: 1, updated_by: 'sistem', updated_at: kini(ctx) }; })); log.push('+ Aturan_Bisnis bawaan'); }
      if (!semua(ctx, 'Form_Def').length) { tambah(ctx, 'Form_Def', [{ form_id: 'FRM-0001', versi: 1, skema_json: JSON.stringify(FORM_BAWAAN), status: 'aktif', updated_by: 'sistem', updated_at: kini(ctx) }]); log.push('+ Form_Def v1'); }
      if (o.identitas && !cari(ctx, 'Pengaturan', 'identitas')) { setAtur(ctx, 'identitas', gabung(PENGATURAN_BAWAAN.identitas, o.identitas)); log.push('+ identitas'); }
      if (!semua(ctx, 'Pengguna').some(function (u) { return u.peran === 'owner'; })) {
        var sandi = (o.owner && o.owner.sandi) || sandiAcak(ctx), salt = env.acak(16);
        tambah(ctx, 'Pengguna', [{ user_id: 'USR-OWNER', nama: (o.owner && o.owner.nama) || 'Owner', peran: 'owner', username: (o.owner && o.owner.username) || 'owner', hash_sandi: hashRahasia(ctx, sandi, salt), salt: salt, versi_token: 1, gagal_login: 0, kunci_hingga: '', coach_id: '', siswa_ids: '', kontak: '', email: (o.owner && o.owner.email) || '', aktif: 'Y', login_terakhir: '', dibuat_at: kini(ctx) }]);
        hasil.owner = { username: (o.owner && o.owner.username) || 'owner', sandi: sandi }; log.push('+ akun Owner');
      }
    });
    hasil.log = log; return hasil;
  }
  /* Tugas latar (trigger GAS) */
  function tugasHarian(env) {
    var ctx = konteksSistem(env), n = 0;
    env.kunci(function () {
      var habis = semua(ctx, 'Paket_Aktif').filter(function (e) { return e.status === 'Aktif' && e.tgl_kedaluwarsa && e.tgl_kedaluwarsa < ctx.hariIni; });
      ubah(ctx, 'Paket_Aktif', habis.map(function (e) { return { enr_id: e.enr_id, status: 'HABIS', alasan_habis: 'kedaluwarsa', habis_at: kini(ctx) }; })); n = habis.length;
    });
    return { kedaluwarsa: n };
  }
  function snapshotPublikEnv(env) { var ctx = konteksSistem(env), snap = snapshotPublik(ctx); return { snapshot: snap, cek: cekSnapshot(ctx, snap) }; }

  return {
    VERSI: VERSI_APP, SKEMA: SKEMA, IZIN: IZIN, NAMA_PERAN: NAMA_PERAN, FORM_BAWAAN: FORM_BAWAAN, LOGIN_BAWAAN: PENGATURAN_BAWAAN.login,
    TEMA_BAWAAN: TEMA_BAWAAN, ATURAN_BAWAAN: ATURAN_BAWAAN, WARNA_KATEGORI: WARNA_KATEGORI, NAMA_HARI: NAMA_HARI, NAMA_BULAN: NAMA_BULAN, RUTE: Object.keys(RUTE),
    jalankan: jalankan, setupAwal: setupAwal, tugasHarian: tugasHarian, snapshotPublikEnv: snapshotPublikEnv,
    hashRahasia: function (env, r, salt) { return hashRahasia({ env: env }, r, salt); },
    util: { tglWIB: tglWIB, waktuWIB: waktuWIB, msWIB: msWIB, msDariWaktu: msDariWaktu, geserTgl: geserTgl, hariKe: hariKe, geserBulan: geserBulan, bulanDari: bulanDari, rupiah: rupiah, tglIndo: tglIndo, namaBulan: namaBulan,
      kontras: kontras, ujiKontras: ujiKontras, hp08: hp08, hp62: hp62, hpValid: hpValid, urlGambarSlide: urlGambarSlide, kategoriSesi: kategoriSesi, b64e: b64e, b64d: b64d, usia: usia, menitDari: menitDari, samarkan: samarkan }
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Inti;
