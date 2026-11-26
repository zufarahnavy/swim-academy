/* =====================================================================
 * UI KIT SWIM ACADEMY — ikon, format, komponen, grafik, ekspor Excel, berkas.
 * Semua komponen mengembalikan string HTML; animasi dipasang lewat UI2.hidupkan().
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = function (s) { return MR.U.e(s); };

  /* ---------- Ikon (sprite SVG, garis 2px) ---------- */
  var IKON = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    grafik: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>', naik: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>', turun: '<path d="m3 7 6 6 4-4 8 8"/><path d="M14 17h7v-7"/>',
    tambahOrang: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/>', orang2: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    orang: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', kalender: '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    absen: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="m8.5 12 2.5 2.5 5-5"/>', buku: '<path d="M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/><path d="M8 7h8M8 11h6"/>',
    dompet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15v13a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5"/><circle cx="16.5" cy="14" r="1.5"/>', struk: '<path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    gembok: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', buka: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>', tameng: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    slider: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>', akun: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 11-5.7"/><circle cx="18" cy="17" r="2.5"/><path d="M18 13v1.5M18 19.5V21M14.5 17H16M20 17h1.5"/>',
    riwayat: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>', lonceng: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    cari: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    kanan: '<path d="m9 18 6-6-6-6"/>', kiri: '<path d="m15 18-6-6 6-6"/>', bawah: '<path d="m6 9 6 6 6-6"/>', atas: '<path d="m18 15-6-6-6 6"/>', panah: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', pensil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>', sampah: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    mata: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>', mataTutup: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>',
    unduh: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', unggah: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    tautan: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>', salin: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    wa: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/><path d="M9 10c.5 2 2 3.5 4 4"/>', surat: '<rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-10 6L2 7"/>',
    jam: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', segitiga: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>', seru: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>', cek: '<path d="M20 6 9 17l-5-5"/>',
    cekBulat: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', xBulat: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    segar: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>', rumah: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    ombak: '<path d="M2 7c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 13c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 19c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>',
    renang: '<circle cx="16" cy="6" r="2"/><path d="m4 11 5-3 4 2 3-1M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5S8 21 10 21s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/>',
    bintang: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>', dokumen: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    gambar: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', video: '<rect x="2" y="5" width="14" height="14" rx="2.5"/><path d="m22 8-6 4 6 4z"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    kunci: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M15 8l2 2"/>', keluar: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    awan: '<path d="M17.5 19H8a6 6 0 1 1 5.7-8h.3a4.5 4.5 0 0 1 3.5 8z"/>', kilau: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>', pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    piala: '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.4 7 22l5-3 5 3-1.2-8.6"/>', cetak: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    kirim: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', lapis: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    uang: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>', daftar: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    lain: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', gedung: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    peluit: '<circle cx="9" cy="14" r="6"/><path d="M12.5 9.2 20 6v4l-6 2"/><circle cx="9" cy="14" r="1.5"/>', seret: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    palet: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7h2A5.6 5.6 0 0 0 22 11c0-5-4.5-9-10-9z"/>',
    formulir: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3V2h6v1M9 9h6M9 13h6M9 17h3"/>', data: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    hp: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>', pasang: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', koin: '<circle cx="9" cy="9" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.4 18"/><path d="M9 6v6M7 8h3.5a1.5 1.5 0 0 1 0 3H7"/>'
  };
  function ikon(n, kelas) { return '<svg class="ik' + (kelas ? ' ' + kelas : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IKON[n] || IKON.info) + '</svg>'; }
  MR.UI.ikon = function (n) { var p = { 'circle-check': 'cekBulat', 'circle-x': 'xBulat', 'triangle-alert': 'segitiga', info: 'info' }; return ikon(p[n] || n); };
  MR.ikonTutup = ikon('x');

  /* ---------- Format ---------- */
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var F = {
    rp: function (n) { return Inti.util.rupiah(n || 0); },
    rpR: function (n) { n = Number(n) || 0; var a = Math.abs(n), s = n < 0 ? '-' : ''; if (a >= 1e9) return s + 'Rp' + (a / 1e9).toFixed(1).replace('.', ',').replace(',0', '') + ' M'; if (a >= 1e6) return s + 'Rp' + (a / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' jt'; if (a >= 1e3) return s + 'Rp' + Math.round(a / 1e3) + ' rb'; return s + 'Rp' + a; },
    ribuan: function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); },
    tgl: function (t) { if (!t) return '-'; var a = String(t).slice(0, 10).split('-'); return a.length < 3 ? t : Number(a[2]) + ' ' + BULAN[Number(a[1]) - 1] + ' ' + a[0]; },
    tglPanjang: function (t) { return t ? Inti.util.tglIndo(String(t).slice(0, 10)) : '-'; },
    hari: function (t) { var d = new Date(Inti.util.msWIB(String(t).slice(0, 10), '12:00:00') + 7 * 3600e3); return HARI[d.getUTCDay()]; },
    tglHari: function (t) { return F.hari(t) + ', ' + F.tgl(t); },
    waktu: function (w) { if (!w) return '-'; var p = String(w).split(' '); return F.tgl(p[0]) + (p[1] ? ', ' + p[1].slice(0, 5) : ''); },
    jam: function (w) { return w ? String(w).split(' ')[1].slice(0, 5) : ''; },
    relatif: function (w) {
      if (!w) return '-'; var d = (API.jamServer() - Inti.util.msDariWaktu(w)) / 60000;
      if (d < 1) return 'baru saja'; if (d < 60) return Math.floor(d) + ' mnt lalu'; if (d < 1440) return Math.floor(d / 60) + ' jam lalu'; if (d < 2880) return 'kemarin ' + F.jam(w); return F.waktu(w);
    },
    bulan: function (b) { var a = String(b).split('-'); return Inti.NAMA_BULAN[Number(a[1]) - 1] + ' ' + a[0]; },
    inisial: function (n) { return String(n || '?').replace(/[^A-Za-z\s]/g, ' ').trim().split(/\s+/).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase() || '?'; },
    durasi: function (ms) { ms = Math.max(0, ms); var j = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60000), s = Math.floor(ms % 60000 / 1000); return (j < 10 ? '0' : '') + j + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; },
    hp: function (h) { return String(h || '').replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3'); },
    salam: function () { var h = new Date(API.jamServer() + 7 * 3600e3).getUTCHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam'; }
  };

  /* ---------- Komponen ---------- */
  function jenisDari(kat) { var k = String(kat || ''); return /Couple/.test(k) ? 'couple' : /Kelas/.test(k) ? 'kelas' : /Trial/.test(k) ? 'trial' : 'privat'; }
  var UI2 = {
    ikon: ikon, F: F, jenis: jenisDari,
    gambarPaket: function (kat) { var k = String(kat || ''); return 'assets/ilustrasi/paket-' + (/^HV /.test(k) ? 'hv' : UI2.jenis(k)) + '.svg'; },
    lencana: function (kat) { if (!kat) return ''; var hv = /^HV /.test(kat), j = jenisDari(kat); return '<span class="lencana ' + j + (hv ? ' hv' : '') + '">' + (hv ? ikon('rumah') : '') + e(kat.replace(/^HV /, hv ? 'HV ' : '')) + '</span>'; },
    status: function (st, teks) {
      var m = { Aktif: 'ok', HABIS: 'habis', Selesai: 'netral', 'Tanpa paket': 'netral', Nonaktif: 'netral', Baru: 'info', Diverifikasi: 'ok', Ditolak: 'habis', TERBIT: 'ok', SAH: 'ok', MENUNGGU_TTD: 'warn', DITARIK: 'habis', DRAF: 'netral', Terkirim: 'ok', Antri: 'info', Gagal: 'habis', Batal: 'netral', Berjalan: 'info', Dihentikan: 'netral', aktif: 'ok', batal: 'habis', Terpakai: 'netral', Kedaluwarsa: 'habis', Hadir: 'ok', Izin: 'info', Hangus: 'warn', Terisi: 'ok', Kosong: 'netral', Libur: 'netral' };
      var label = teks || { MENUNGGU_TTD: 'Menunggu TTD', TERBIT: 'Terbit', DITARIK: 'Ditarik', aktif: 'Aktif', batal: 'Batal' }[st] || st;
      return '<span class="status ' + (m[st] || 'netral') + '">' + e(label) + '</span>';
    },
    sisaChip: function (r) { if (!r) return ''; if (r.status === 'HABIS') return '<span class="status habis">HABIS' + (r.alasan_habis === 'kedaluwarsa' ? ' · kedaluwarsa' : '') + '</span>'; if (r.status === 'Aktif' && r.sisa === 1) return '<span class="status warn">Sisa 1 sesi</span>'; return UI2.status(r.status); },
    avatar: function (nama, kelas) { return '<span class="avatar ' + (kelas || '') + '" aria-hidden="true">' + e(F.inisial(nama)) + '</span>'; },
    progres: function (r, opsi) {
      opsi = opsi || {}; var p = r.sesi_total ? Math.min(1, r.sesi_terpakai / r.sesi_total) : 0, habis = r.status === 'HABIS';
      return '<div class="progres-wadah">' + (opsi.tanpaLabel ? '' : '<div class="progres-label"><span>' + e(opsi.label || 'Pemakaian paket') + '</span><b class="' + (habis ? 'habis' : '') + '">' + r.sesi_terpakai + ' / ' + r.sesi_total + ' sesi' + (habis ? ' (penuh)' : '') + '</b></div>') +
        '<div class="progres ' + (habis ? 'habis' : jenisDari(r.kategori)) + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + r.sesi_total + '" aria-valuenow="' + r.sesi_terpakai + '"><i data-p="' + p + '"></i></div></div>';
    },
    kpi: function (o) {
      return '<div class="kartu kpi' + (o.rp ? ' rp' : '') + (o.klik ? ' klik' : '') + '"' + (o.klik ? ' data-a="' + o.klik + '" tabindex="0" role="button"' : '') + ' style="--i:' + (o.i || 0) + '">' +
        '<div class="kpi-atas"><span class="kpi-label">' + e(o.label) + '</span>' + (o.ikon ? '<span class="kpi-ikon ' + (o.warna || '') + '">' + ikon(o.ikon) + '</span>' : '') + '</div>' +
        '<div class="kpi-nilai' + (o.rahasia ? ' rahasia' : '') + '">' + o.nilai + (o.satuan ? '<small>' + e(o.satuan) + '</small>' : '') + '</div>' + (o.sub ? '<div class="kpi-sub">' + o.sub + '</div>' : '') + (o.spark || '') + '</div>';
    },
    seg: function (id, items, aktif, kelas) {
      return '<div class="seg ' + (kelas || '') + '" data-seg="' + id + '" role="tablist">' + items.map(function (x) { var v = x.v != null ? x.v : x; return '<button type="button" role="tab" data-v="' + e(v) + '" class="' + (String(v) === String(aktif) ? 'aktif' : '') + '" aria-selected="' + (String(v) === String(aktif)) + '">' + (x.ikon ? ikon(x.ikon, 'k') : '') + e(x.label || x) + (x.n != null ? '<span class="n">' + x.n + '</span>' : '') + '</button>'; }).join('') + '<span class="indikator"></span></div>';
    },
    /* Indikator geser: hanya transform (translateX + scaleX), dipasang setelah elemen tampil */
    hidupkanSeg: function (root, saat) {
      MR.qsa('.seg', root).forEach(function (s) {
        var ind = s.querySelector('.indikator');
        function pos(animasi) { var b = s.querySelector('button.aktif'); if (!b || !ind) return; if (!animasi) ind.style.transition = 'none'; ind.style.transform = 'translateX(' + b.offsetLeft + 'px) scaleX(' + (b.offsetWidth / 100) + ')'; if (!animasi) { void ind.offsetWidth; ind.style.transition = ''; } }
        pos(false);
        if (!s.dataset.terpasang) {
          s.dataset.terpasang = '1';
          s.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (!b || b.classList.contains('aktif')) return; MR.qsa('button', s).forEach(function (x) { x.classList.toggle('aktif', x === b); x.setAttribute('aria-selected', x === b); }); pos(true); if (s.scrollWidth > s.clientWidth) s.scrollTo({ left: Math.max(0, b.offsetLeft - 24), behavior: 'smooth' }); if (saat) saat(s.dataset.seg, b.dataset.v, b); s.dispatchEvent(new CustomEvent('seg', { bubbles: true, detail: { seg: s.dataset.seg, v: b.dataset.v } })); });
          if (W.ResizeObserver) new ResizeObserver(function () { pos(false); }).observe(s);
        }
      });
    },
    hidupkan: function (root) {
      MR.qsa('.progres i[data-p], .trek i[data-p]', root).forEach(function (i) { requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.transform = 'scaleX(' + i.dataset.p + ')'; }); }); });
      UI2.hidupkanSeg(root);
    },
    tabel: function (o) {
      if (!o.baris.length) return MR.UI.kosong(o.kosong || 'Belum ada data', o.kosongSub || '');
      return '<div class="tabel-wadah"><table class="tabel responsif' + (o.kelas ? ' ' + o.kelas : '') + '"><thead><tr>' + o.kolom.map(function (k) { return '<th' + (k.kanan ? ' class="kanan"' : '') + '>' + e(k.label) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        o.baris.map(function (r, i) { return '<tr class="' + (o.klik ? 'klik ' : '') + (o.kelasBaris ? o.kelasBaris(r) : '') + '"' + (o.klik ? ' data-a="' + o.klik + '" data-i="' + i + '"' + (o.id ? ' data-id="' + e(r[o.id]) + '"' : '') : '') + '>' + o.kolom.map(function (k, j) { return '<td data-l="' + e(k.label) + '" class="' + (j === 0 && !k.bukanUtama ? 'utama-m ' : '') + (k.kanan ? 'kanan' : '') + '">' + (k.f ? k.f(r, i) : e(r[k.k])) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    },
    fld: function (o) {
      var id = 'f_' + o.k + '_' + Math.random().toString(36).slice(2, 6), v = o.v == null ? '' : o.v, inp;
      var at = (o.wajib ? ' required' : '') + (o.ro ? ' readonly' : '') + (o.mati ? ' disabled' : '') + (o.attr || '');
      if (o.tipe === 'select') inp = '<select class="inp" id="' + id + '" name="' + o.k + '"' + at + '>' + (o.kosong !== false ? '<option value="">' + e(o.ph || '— Pilih —') + '</option>' : '') + (o.opsi || []).map(function (x) { var val = x.v != null ? x.v : x, lb = x.l != null ? x.l : x; return '<option value="' + e(val) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + e(lb) + '</option>'; }).join('') + '</select>';
      else if (o.tipe === 'area') inp = '<textarea class="inp" id="' + id + '" name="' + o.k + '" rows="' + (o.baris || 3) + '" placeholder="' + e(o.ph || '') + '"' + at + '>' + e(v) + '</textarea>';
      else inp = '<input class="inp" id="' + id + '" name="' + o.k + '" type="' + (o.tipe || 'text') + '" value="' + e(v) + '" placeholder="' + e(o.ph || '') + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + at + '>';
      if (o.ikon) inp = '<div class="inp-ikon">' + ikon(o.ikon) + inp + (o.ujung || '') + '</div>';
      return '<div class="fld ' + (o.l || '') + (o.ro ? ' kunci' : '') + '" data-k="' + o.k + '"><label for="' + id + '">' + e(o.label) + (o.wajib ? ' <span class="wajib">*</span>' : '') + '</label>' + inp + (o.bantu ? '<span class="bantu">' + e(o.bantu) + '</span>' : '') + '<span class="galat"></span></div>';
    },
    baca: function (form) { var o = {}; MR.qsa('input,select,textarea', form).forEach(function (x) { if (!x.name) return; if (x.type === 'checkbox') o[x.name] = x.checked; else if (x.type === 'radio') { if (x.checked) o[x.name] = x.value; } else o[x.name] = x.value.trim(); }); return o; },
    saklar: function (nama, on, label, mati) { return '<label class="saklar"><input type="checkbox" name="' + nama + '"' + (on ? ' checked' : '') + (mati ? ' disabled' : '') + '><i></i>' + (label ? '<span>' + label + '</span>' : '') + '</label>'; },
    waLink: function (nomor, teks) { var n = Inti.util.hp62(nomor); return 'https://wa.me/' + n + (teks ? '?text=' + encodeURIComponent(teks) : ''); },
    salin: function (teks, pesan) {
      var ok = function () { MR.UI.toast(pesan || 'Disalin ke papan klip.', 'ok'); };
      if (navigator.clipboard && W.isSecureContext) navigator.clipboard.writeText(teks).then(ok, function () { cadangan(); }); else cadangan();
      function cadangan() { var t = D.createElement('textarea'); t.value = teks; t.style.position = 'fixed'; t.style.opacity = '0'; D.body.appendChild(t); t.select(); try { D.execCommand('copy'); ok(); } catch (x) { } t.remove(); }
    },
    qr: function (teks, modul) { try { var q = qrcode(0, 'M'); q.addData(String(teks)); q.make(); return q.createSvgTag({ cellSize: modul || 4, margin: 2, scalable: true }); } catch (x) { return ''; } },
    muatSebaris: function (teks) { return '<div class="muat-sebaris"><span class="titik-air"><i></i><i></i><i></i></span>' + e(teks || 'Memuat…') + '</div>'; },
    bulanIni: function () { return Inti.util.bulanDari(Inti.util.tglWIB(API.jamServer())); },
    hariIni: function () { return Inti.util.tglWIB(API.jamServer()); },
    pilihBulan: function (nilai, nama) { return '<input class="inp" type="month" name="' + (nama || 'bulan') + '" value="' + e(nilai) + '" max="' + UI2.bulanIni() + '" style="width:auto;min-width:170px">'; },
    /* Unggah: kompres gambar di browser (maks 1600 px, JPEG 82%), validasi tipe & 5 MB */
    bacaBerkas: function (file, o) {
      o = o || {}; var maks = (o.maksMB || 5) * 1024 * 1024, tipe = o.tipe || /^(image\/(png|jpe?g)|application\/pdf)$/;
      return new Promise(function (ok, tolak) {
        if (!file) return ok(null);
        if (!tipe.test(file.type)) return tolak({ message: o.pesanTipe || 'Format berkas harus JPG, PNG, atau PDF.', code: 'VALIDATION' });
        var baca = function (blob, nama) { var r = new FileReader(); r.onload = function () { var b64 = String(r.result).split(',')[1]; if (b64.length * 3 / 4 > maks) return tolak({ message: 'Ukuran berkas maksimal ' + (o.maksMB || 5) + ' MB.', code: 'VALIDATION' }); ok({ nama: nama, mime: blob.type, base64: b64, ukuran: blob.size, url: r.result }); }; r.onerror = function () { tolak({ message: 'Berkas tidak dapat dibaca.' }); }; r.readAsDataURL(blob); };
        if (!/^image\/(png|jpe?g)$/.test(file.type) || o.kompres === false || file.size < 500 * 1024) return baca(file, file.name);
        var img = new Image(), url = URL.createObjectURL(file);
        img.onload = function () { var s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = D.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(function (b) { baca(b, file.name.replace(/\.\w+$/, '') + '.jpg'); }, 'image/jpeg', 0.82); };
        img.onerror = function () { baca(file, file.name); }; img.src = url;
      });
    },
    unduhDataUrl: function (url, nama) { var a = D.createElement('a'); a.href = url; a.download = nama; D.body.appendChild(a); a.click(); a.remove(); },
    cetakHtml: function (html) { var w = W.open('', '_blank'); if (!w) return MR.UI.toast('Izinkan pop-up untuk mencetak.', 'warn'); w.document.write(html); w.document.close(); setTimeout(function () { w.focus(); w.print(); }, 350); },
    /* Ringkasan perubahan sebelum simpan (PRD 3.5 & I8) */
    konfirmasiPerubahan: function (judul, daftar, okLabel) {
      return new Promise(function (ok) {
        var m = MR.UI.modal({ judul: judul, sub: daftar.length + ' perubahan akan disimpan dan dicatat di Log Audit.', isi: '<div class="daftar-ikon">' + daftar.map(function (x) { return '<div class="item-ikon"><span class="ubin abu">' + ikon('pensil', 'k') + '</span><div class="tumbuh"><b class="kecil">' + e(x.label) + '</b><div class="kecil redup"><s>' + e(x.lama) + '</s> → <b class="teks-merek">' + e(x.baru) + '</b></div></div></div>'; }).join('') + '</div>',
          kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + e(okLabel || 'Simpan perubahan') + '</button>', saatTutup: function (v) { ok(v === true); } });
        m.el.querySelector('[data-ok]').onclick = function () { m.tutup(true); };
      });
    },
    mintaTeks: function (o) {
      return new Promise(function (ok) {
        var m = MR.UI.modal({ judul: o.judul, sempit: true, isi: (o.pesan ? '<p class="redup" style="margin-bottom:12px">' + e(o.pesan) + '</p>' : '') + '<form class="form">' + UI2.fld({ k: 'teks', label: o.label || 'Alasan', tipe: o.tipe || 'area', wajib: true, ph: o.ph || '', baris: 3 }) + '</form>',
          kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn ' + (o.bahaya ? 'bahaya' : 'primer') + '" data-ok>' + e(o.ok || 'Lanjutkan') + '</button>', saatTutup: function (v) { ok(v || null); } });
        m.el.querySelector('[data-ok]').onclick = function () { var v = m.el.querySelector('[name=teks]').value.trim(); if ((o.min || 5) > v.length) { MR.UI.tandaiGalat(m.el.querySelector('form'), { teks: 'Minimal ' + (o.min || 5) + ' karakter' }); return; } m.tutup(v); };
      });
    }
  };

  /* ---------- Tooltip grafik ---------- */
  var tipEl = null;
  function tip(html, x, y) {
    if (!tipEl) { tipEl = D.createElement('div'); tipEl.className = 'tip'; D.body.appendChild(tipEl); }
    if (!html) { tipEl.classList.remove('tampil'); return; }
    tipEl.innerHTML = html; tipEl.classList.add('tampil');
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, px = Math.min(W.innerWidth - w - 8, Math.max(8, x + 14)), py = y - h - 12 < 8 ? y + 16 : y - h - 12;
    tipEl.style.left = px + 'px'; tipEl.style.top = py + 'px';
  }
  W.addEventListener('scroll', function () { tip(null); }, { passive: true });

  /* ---------- Grafik (SVG ringan, satu sumbu, tooltip hover) ---------- */
  function langkah(maks, n) { if (maks <= 0) return 1; var kasar = maks / n, p = Math.pow(10, Math.floor(Math.log10(kasar))), m = kasar / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function ringkas(n) { var a = Math.abs(n); if (a >= 1e9) return (n / 1e9).toFixed(a % 1e9 ? 1 : 0).replace('.', ',') + 'M'; if (a >= 1e6) return (n / 1e6).toFixed(a % 1e6 ? 1 : 0).replace('.', ',') + 'jt'; if (a >= 1e4) return Math.round(n / 1e3) + 'rb'; return F.ribuan(n); }
  function legenda(seri, garis) { return seri.length < 2 ? '' : '<div class="legenda">' + seri.map(function (s) { return '<span><i class="' + (garis ? 'garis-l' : '') + '" style="background:' + s.warna + '"></i>' + e(s.nama) + '</span>'; }).join('') + '</div>'; }
  var Grafik = {
    kolom: function (el, o) {
      if (!el) return; var lebar = Math.max(260, el.clientWidth || 600), tinggi = o.tinggi || 240, kiri = 46, bawah = 26, atas = 14, kanan = 8;
      var semuaNilai = [].concat.apply([], o.seri.map(function (s) { return s.nilai; })), maks = Math.max.apply(null, semuaNilai.concat([0])), st = langkah(maks, 4), yMaks = Math.ceil(maks / st) * st || 1;
      var n = o.label.length, band = (lebar - kiri - kanan) / n, k = o.seri.length, bw = Math.min(24, (band * 0.72 - (k - 1) * 2) / k), tinggiPlot = tinggi - atas - bawah;
      var y = function (v) { return atas + tinggiPlot - v / yMaks * tinggiPlot; }, s = '';
      for (var t = 0; t <= yMaks + 1e-9; t += st) s += '<line class="grid-g" x1="' + kiri + '" x2="' + (lebar - kanan) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text x="' + (kiri - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + ringkas(t) + '</text>';
      var loncat = Math.ceil(n / Math.floor((lebar - kiri) / 46));
      o.label.forEach(function (lb, i) {
        var x0 = kiri + band * i + (band - (bw * k + (k - 1) * 2)) / 2;
        o.seri.forEach(function (sr, j) {
          var v = sr.nilai[i] || 0, x = x0 + j * (bw + 2), yy = y(v), h = tinggi - bawah - yy, r = Math.min(4, h, bw / 2);
          if (h > 0.5) s += '<path fill="' + sr.warna + '" d="M' + x + ' ' + (yy + h) + 'V' + (yy + r) + 'Q' + x + ' ' + yy + ' ' + (x + r) + ' ' + yy + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + yy + ' ' + (x + bw) + ' ' + (yy + r) + 'V' + (yy + h) + 'Z"><animate attributeName="opacity" from="0" to="1" dur=".5s" fill="freeze"/></path>';
        });
        if (i % loncat === 0) s += '<text x="' + (kiri + band * i + band / 2) + '" y="' + (tinggi - 6) + '" text-anchor="middle">' + e(lb) + '</text>';
        s += '<rect class="hit" data-i="' + i + '" x="' + (kiri + band * i) + '" y="' + atas + '" width="' + band + '" height="' + tinggiPlot + '"/>';
      });
      s += '<line class="grid-g" x1="' + kiri + '" x2="' + (lebar - kanan) + '" y1="' + (tinggi - bawah) + '" y2="' + (tinggi - bawah) + '" style="stroke:#CBD5E1"/>';
      el.innerHTML = legenda(o.seri) + '<div class="grafik"><svg viewBox="0 0 ' + lebar + ' ' + tinggi + '" height="' + tinggi + '" role="img" aria-label="' + e(o.judul || 'Grafik') + '">' + s + '</svg></div>';
      Grafik._hover(el, function (i) { return '<b>' + e(o.label[i]) + '</b>' + o.seri.map(function (sr) { return '<div class="r"><span><i style="background:' + sr.warna + '"></i>' + e(sr.nama) + '</span><b style="display:inline;margin:0">' + (o.fmt ? o.fmt(sr.nilai[i] || 0) : F.ribuan(sr.nilai[i])) + '</b></div>'; }).join('') + (o.ekstra ? o.ekstra(i) : ''); });
    },
    garis: function (el, o) {
      if (!el) return; var lebar = Math.max(260, el.clientWidth || 600), tinggi = o.tinggi || 220, kiri = 46, bawah = 26, atas = 16, kanan = 40;
      var semuaNilai = [].concat.apply([], o.seri.map(function (s) { return s.nilai; })), maks = Math.max.apply(null, semuaNilai.concat([0])), min = o.dariNol === false ? Math.min.apply(null, semuaNilai) : 0;
      var st = langkah(maks - min, 4), y0 = Math.floor(min / st) * st, yMaks = Math.ceil(maks / st) * st || 1, n = o.label.length, tp = tinggi - atas - bawah;
      var x = function (i) { return kiri + (n === 1 ? 0 : i * (lebar - kiri - kanan) / (n - 1)); }, y = function (v) { return atas + tp - (v - y0) / (yMaks - y0 || 1) * tp; }, s = '';
      for (var t = y0; t <= yMaks + 1e-9; t += st) s += '<line class="grid-g" x1="' + kiri + '" x2="' + (lebar - kanan) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text x="' + (kiri - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + (o.persen ? Math.round(t) + '%' : ringkas(t)) + '</text>';
      var loncat = Math.ceil(n / Math.floor((lebar - kiri) / 46));
      o.label.forEach(function (lb, i) { if (i % loncat === 0) s += '<text x="' + x(i) + '" y="' + (tinggi - 6) + '" text-anchor="middle">' + e(lb) + '</text>'; });
      o.seri.forEach(function (sr) {
        var d = sr.nilai.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
        if (o.area !== false) s += '<path d="' + d + 'L' + x(n - 1) + ' ' + (tinggi - bawah) + 'L' + x(0) + ' ' + (tinggi - bawah) + 'Z" fill="' + sr.warna + '" opacity=".1"/>';
        s += '<path class="garis-seri" d="' + d + '" stroke="' + sr.warna + '" stroke-width="2"/>';
        var akhir = sr.nilai[n - 1];
        s += '<circle cx="' + x(n - 1) + '" cy="' + y(akhir) + '" r="4.5" fill="' + sr.warna + '" stroke="#fff" stroke-width="2"/>';
      });
      s += '<line class="silang" x1="0" x2="0" y1="' + atas + '" y2="' + (tinggi - bawah) + '" style="display:none"/>';
      for (var i = 0; i < n; i++) { var lb2 = i === 0 ? kiri : (x(i - 1) + x(i)) / 2, rb = i === n - 1 ? lebar - kanan : (x(i) + x(i + 1)) / 2; s += '<rect class="hit" data-i="' + i + '" data-x="' + x(i) + '" x="' + lb2 + '" y="' + atas + '" width="' + Math.max(1, rb - lb2) + '" height="' + tp + '"/>'; }
      el.innerHTML = legenda(o.seri, true) + '<div class="grafik"><svg viewBox="0 0 ' + lebar + ' ' + tinggi + '" height="' + tinggi + '" role="img" aria-label="' + e(o.judul || 'Grafik garis') + '">' + s + '</svg></div>';
      MR.animasiGaris(el.querySelector('.grafik'));
      var silang = el.querySelector('.silang');
      Grafik._hover(el, function (i, r) { silang.style.display = ''; silang.setAttribute('x1', r.dataset.x); silang.setAttribute('x2', r.dataset.x); return '<b>' + e(o.label[i]) + '</b>' + o.seri.map(function (sr) { return '<div class="r"><span><i style="background:' + sr.warna + '"></i>' + e(sr.nama) + '</span><b style="display:inline;margin:0">' + (o.fmt ? o.fmt(sr.nilai[i]) : F.ribuan(sr.nilai[i])) + '</b></div>'; }).join(''); }, function () { silang.style.display = 'none'; });
    },
    _hover: function (el, isi, keluar) {
      MR.qsa('.hit', el).forEach(function (r) {
        var tampil = function (ev) { var p = ev.touches ? ev.touches[0] : ev; tip(isi(Number(r.dataset.i), r), p.clientX, p.clientY); r.style.fill = 'rgba(148,163,184,.08)'; };
        r.addEventListener('mousemove', tampil); r.addEventListener('touchstart', tampil, { passive: true });
        r.addEventListener('mouseleave', function () { tip(null); r.style.fill = ''; if (keluar) keluar(); });
      });
    },
    batangH: function (rows, o) {
      o = o || {}; var maks = Math.max.apply(null, rows.map(function (r) { return r.nilai; }).concat([1]));
      return '<div class="batang-h">' + rows.map(function (r) { return '<div class="r"><span class="lbl">' + (r.lencana || '') + '<span class="satu-baris">' + e(r.nama) + '</span></span><span class="val">' + (o.fmt ? o.fmt(r.nilai, r) : F.ribuan(r.nilai)) + (r.persen != null ? ' <span class="redup kecil">· ' + String(r.persen).replace('.', ',') + '%</span>' : '') + '</span><div class="trek"><i data-p="' + (r.nilai / maks) + '" style="background:' + (r.warna || 'var(--merek)') + '"></i></div></div>'; }).join('') + '</div>';
    },
    spark: function (nilai, warna) {
      if (!nilai || nilai.length < 2) return ''; var mx = Math.max.apply(null, nilai), mn = Math.min.apply(null, nilai), w = 92, h = 30;
      var d = nilai.map(function (v, i) { return (i ? 'L' : 'M') + (i * w / (nilai.length - 1)).toFixed(1) + ' ' + (h - 3 - (v - mn) / (mx - mn || 1) * (h - 6)).toFixed(1); }).join('');
      return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + 'L' + w + ' ' + h + 'L0 ' + h + 'Z" fill="' + (warna || 'var(--merek)') + '" opacity=".1"/><path d="' + d + '" fill="none" stroke="' + (warna || 'var(--merek)') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    },
    warnaJenis: function (kat) { return { privat: '#1D4ED8', couple: '#C2410C', kelas: '#6D28D9', trial: '#0D9488' }[jenisDari(kat)] || '#64748B'; }
  };

  /* ---------- Ekspor Excel (.xlsx asli, dibuat di browser — PRD 4.5) ---------- */
  var Xlsx = (function () {
    var TB = null;
    function crc(b) { if (!TB) { TB = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; TB[n] = c >>> 0; } } var x = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) x = TB[(x ^ b[i]) & 255] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
    function u8(s) { return new TextEncoder().encode(s); }
    function zip(files) {
      var bag = [], pusat = [], off = 0;
      function u16(n) { return [n & 255, n >> 8 & 255]; } function u32(n) { return [n & 255, n >> 8 & 255, n >> 16 & 255, n >>> 24 & 255]; }
      files.forEach(function (f) {
        var nama = u8(f.n), data = u8(f.d), c = crc(data);
        var lok = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(c), u32(data.length), u32(data.length), u16(nama.length), u16(0));
        bag.push(new Uint8Array(lok), nama, data);
        pusat.push([].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(c), u32(data.length), u32(data.length), u16(nama.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)), nama);
        off += lok.length + nama.length + data.length;
      });
      var ukPusat = 0; pusat.forEach(function (p) { ukPusat += p.length; bag.push(p instanceof Uint8Array ? p : new Uint8Array(p)); });
      bag.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(ukPusat), u32(off), u16(0))));
      return new Blob(bag, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
    function kol(i) { var s = ''; i++; while (i) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
    function lembar(sh) {
      var baris = [sh.kolom].concat(sh.baris), lebar = sh.kolom.map(function (k, j) { return Math.min(48, Math.max(10, String(k).length + 2, Math.max.apply(null, sh.baris.slice(0, 200).map(function (r) { return String(r[j] == null ? '' : r[j]).length + 2; })))); });
      return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>' +
        lebar.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>' +
        baris.map(function (r, i) { return '<row r="' + (i + 1) + '">' + r.map(function (v, j) { var ref = kol(j) + (i + 1); if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + (i === 0 ? ' s="1"' : (Math.abs(v) >= 1000 ? ' s="2"' : '')) + '><v>' + v + '</v></c>'; return '<c r="' + ref + '" t="inlineStr"' + (i === 0 ? ' s="1"' : '') + '><is><t xml:space="preserve">' + esc(v == null ? '' : v) + '</t></is></c>'; }).join('') + '</row>'; }).join('') + '</sheetData></worksheet>';
    }
    return {
      unduh: function (namaBerkas, sheets) {
        var files = [
          { n: '[Content_Types].xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>' },
          { n: '_rels/.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
          { n: 'xl/workbook.xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, i) { return '<sheet name="' + esc(String(s.nama).slice(0, 31).replace(/[\\\/?*\[\]:]/g, ' ')) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>' },
          { n: 'xl/_rels/workbook.xml.rels', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
          { n: 'xl/styles.xml', d: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E2A4A"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs></styleSheet>' }
        ].concat(sheets.map(function (s, i) { return { n: 'xl/worksheets/sheet' + (i + 1) + '.xml', d: lembar(s) }; }));
        var url = URL.createObjectURL(zip(files)); UI2.unduhDataUrl(url, namaBerkas.replace(/\.xlsx$/, '') + '.xlsx'); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        MR.UI.toast('Berkas Excel diunduh.', 'ok');
      }
    };
  })();

  W.UI2 = UI2; W.Grafik = Grafik; W.Xlsx = Xlsx; W.F = F; W.ik = ikon;
})(window, document);
