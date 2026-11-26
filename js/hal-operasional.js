/* =====================================================================
 * JADWAL PELATIH, ABSENSI (monitoring + lembar absen bersama), MATERI
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router, OA = ['owner', 'admin'];
  var HARI = [1, 2, 3, 4, 5, 6, 7];

  /* ================= Lembar absensi (bottom sheet di HP) ================= */
  /* x = item sesi (dari absensi.hari / dash.pelatih), aturan = { status_dihitung, absensi_paket_habis } */
  W.lembarAbsen = function (x, aturan, o) {
    o = o || {}; var r = x.enr, a = x.absen, koreksi = !!a, b = x.batas, nama = r.peserta.map(function (p) { return p.nama; }).join(' & ');
    var habis = r.status === 'HABIS', tolak = habis && aturan.absensi_paket_habis !== 'sesi_lebih' && !koreksi;
    var pilihan = {}; (a ? a.peserta : r.peserta.map(function (p) { return { siswa_id: p.siswa_id, status: '' }; })).forEach(function (p) { pilihan[p.siswa_id] = p.status; });
    var dihitungTeks = aturan.status_dihitung.join(' & ');
    var m = MR.UI.modal({ judul: (koreksi ? 'Koreksi absensi · ' : '') + nama, sub: e(x.jam_mulai ? x.jam_mulai + '–' + x.jam_selesai + ' · ' : '') + e(r.paket) + ' · ' + e(F.tglHari(b.tanggal)), isi:
      '<div class="baris bungkus" style="gap:6px">' + UI2.lencana(r.kategori) + UI2.sisaChip(r) + '<span class="kecil redup">' + ik('pin', 'k') + ' ' + e(r.kolam) + '</span></div>' +
      '<div class="mt12">' + UI2.progres(r, { label: 'Sesi terpakai sebelum disimpan' }) + '</div>' +
      (tolak ? '<div class="peringatan bahaya mt12">' + ik('gembok') + '<div><b>Paket sudah HABIS</b>Absensi ditolak sesuai Aturan Bisnis. Minta orang tua memperpanjang paket lewat Admin.</div></div>' :
        habis && !koreksi ? '<div class="peringatan warn mt12">' + ik('segitiga') + '<div><b>Paket HABIS — dicatat sebagai sesi lebih</b>Sesi tetap tercatat dan perlu ditagihkan saat perpanjangan.</div></div>' : '') +
      (b.via_buka_kunci ? '<div class="peringatan info mt12">' + ik('buka') + '<div><b>Kunci dibuka Admin</b>Berlaku sampai ' + e(F.waktu(b.buka_hingga)) + ' WIB.</div></div>' : '') +
      '<div class="tumpuk mt16" style="gap:10px">' + r.peserta.map(function (p) {
        return '<div class="peserta-absen" data-sid="' + e(p.siswa_id) + '"><div class="baris">' + UI2.avatar(p.nama, 'kecil') + '<b class="tumbuh kecil">' + e(p.nama) + '</b><span class="kecil redup">' + e(p.kategori || '') + '</span></div>' +
          '<div class="status-pilih" role="radiogroup" aria-label="Status ' + e(p.nama) + '">' + ['Hadir', 'Izin', 'Hangus'].map(function (sx) { return '<button type="button" role="radio" data-st="' + sx + '" class="' + (pilihan[p.siswa_id] === sx ? 'on-' + sx : '') + '" aria-checked="' + (pilihan[p.siswa_id] === sx) + '"' + (tolak ? ' disabled' : '') + '>' + ik(sx === 'Hadir' ? 'cek' : sx === 'Izin' ? 'info' : 'x', 'k') + sx + '</button>'; }).join('') + '</div>' +
          '<div class="fld" data-k="p_' + e(p.siswa_id) + '"><span class="galat"></span></div></div>';
      }).join('') + '</div>' +
      '<div class="info-aturan mt12">' + ik('info') + '<span><b>' + e(dihitungTeks) + '</b> memotong sisa sesi. Izin tidak dihitung. Couple/Kelas: satu pertemuan dipotong sekali walau peserta berbeda status.</span></div>' +
      (koreksi && o.wajibAlasan ? UI2.fld({ k: 'alasan', label: 'Alasan koreksi (wajib setelah batas waktu)', tipe: 'area', baris: 2, wajib: true }) : koreksi ? UI2.fld({ k: 'alasan', label: 'Alasan koreksi (opsional)', tipe: 'area', baris: 2 }) : UI2.fld({ k: 'catatan', label: 'Catatan sesi (opsional)', ph: 'mis. latihan gaya bebas 25 m', tipe: 'text' })),
      kaki: (koreksi && o.bolehHapus ? '<button type="button" class="btn bahaya" data-x="hapus">' + ik('sampah', 'k') + 'Batalkan absensi</button>' : '<button type="button" class="btn" data-tutup>Batal</button>') +
        '<button type="button" class="btn primer" data-x="simpan"' + (tolak ? ' disabled' : '') + '>' + ik('cekBulat', 'k') + (koreksi ? 'Simpan koreksi' : 'Simpan absensi') + '</button>' });
    m.on('click', '[data-st]', function (t) {
      var w = t.closest('[data-sid]'), sid = w.dataset.sid; pilihan[sid] = t.dataset.st;
      MR.qsa('[data-st]', w).forEach(function (bt) { var on = bt === t; bt.className = on ? 'on-' + bt.dataset.st : ''; bt.setAttribute('aria-checked', on); });
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (z) { }
    });
    m.on('click', '[data-x=simpan]', function (t) {
      var kosong = {}; r.peserta.forEach(function (p) { if (!pilihan[p.siswa_id]) kosong['p_' + p.siswa_id] = 'Pilih status untuk ' + p.nama; });
      if (Object.keys(kosong).length) return MR.UI.tandaiGalat(m.el, kosong);
      var peserta = r.peserta.map(function (p) { return { siswa_id: p.siswa_id, status: pilihan[p.siswa_id] }; }), al = m.el.querySelector('[name=alasan]'), ct = m.el.querySelector('[name=catatan]');
      var aksi = koreksi ? ['absensi.koreksi', { absen_id: a.absen_id, peserta: peserta, alasan: al ? al.value.trim() : '' }] : ['absensi.simpan', { enr_id: x.enr_id, tanggal: b.tanggal, peserta: peserta, catatan: ct ? ct.value.trim() : '' }];
      /* Optimistik: kartu langsung berubah, dikembalikan bila server menolak */
      if (o.optimistik) o.optimistik(peserta);
      MR.UI.kerja(t, function () { return API.T(aksi[0], aksi[1]); }, { form: m.el }).then(function (h) {
        m.tutup();
        var e2 = h.enr, pesan = koreksi ? 'Koreksi tersimpan.' : (h.dihitung ? 'Absensi tersimpan · pertemuan ke-' + h.absen.pertemuan_ke : 'Tercatat Izin — sesi tidak dipotong.');
        if (!koreksi && e2.status === 'HABIS') pesan += ' Paket kini HABIS (' + e2.sesi_terpakai + '/' + e2.sesi_total + ').'; else if (!koreksi && e2.sisa === 1) pesan += ' Sisa 1 sesi.';
        MR.UI.toast(pesan, e2.status === 'HABIS' && !koreksi ? 'warn' : 'ok', { judul: h.sesi_lebih ? 'Sesi lebih' : '' });
        if (o.selesai) o.selesai(h); else R.muatUlang();
      }).catch(function () { if (o.batalOptimistik) o.batalOptimistik(); });
    });
    m.on('click', '[data-x=hapus]', function () {
      UI2.mintaTeks({ judul: 'Batalkan absensi ini?', pesan: 'Data lama ditandai "dikoreksi" (tidak dihapus permanen) dan sisa sesi dihitung ulang.', label: 'Alasan', ok: 'Batalkan absensi', bahaya: true }).then(function (al) {
        if (!al) return; API.T('absensi.koreksi', { absen_id: a.absen_id, hapus: true, alasan: al }).then(function () { m.tutup(); MR.UI.toast('Absensi dibatalkan.', 'ok'); if (o.selesai) o.selesai(); else R.muatUlang(); }).catch(MR.UI.galat);
      });
    });
    return m;
  };

  /* ================= Jadwal pelatih ================= */
  R.daftar('jadwal', {
    judul: 'Jadwal Pelatih', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.view = st.view || (W.innerWidth < 860 ? 'harian' : 'minggu');
      return API.Q('jadwal.list').then(function (d) {
        if (ctx.basi()) return;
        st.hari = st.hari || d.hariIni;
        var rg = d.ringkas;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Jadwal Pelatih</h1><p>Slot mingguan per pelatih. Bentrok jam pelatih yang sama ditandai merah.</p></div><div class="aksi">' + (d.bolehKelola ? '<button type="button" class="btn primer" data-a="tambah" data-kunci="n">' + ik('plus') + 'Tambah slot</button>' : '') + '</div></div>' +
          '<div class="grid g4 kpi-baris stagger">' + UI2.kpi({ i: 0, label: 'Sesi per minggu', nilai: rg.sesi, ikon: 'kalender' }) + UI2.kpi({ i: 1, label: 'Pelatih bertugas', nilai: rg.pelatih, ikon: 'peluit', warna: 'ungu' }) + UI2.kpi({ i: 2, label: 'Slot kosong', nilai: rg.kosong, ikon: 'plus', warna: 'hijau', sub: 'Siap diisi siswa baru' }) + UI2.kpi({ i: 3, label: 'Bentrok', nilai: rg.bentrok, ikon: 'segitiga', warna: rg.bentrok ? 'merah' : 'navy', sub: rg.bentrok ? 'Periksa slot merah' : 'Tidak ada bentrok' }) + '</div>' +
          '<div class="kartu pad mt16"><div class="baris bungkus" style="gap:10px">' + UI2.seg('view', [{ v: 'minggu', label: 'Mingguan', ikon: 'grid' }, { v: 'harian', label: 'Harian', ikon: 'daftar' }, { v: 'pelatih', label: 'Beban pelatih', ikon: 'peluit' }], st.view) + '<span class="tumbuh"></span>' +
            '<select class="inp" data-f="coach" style="width:auto"><option value="">Semua pelatih</option>' + d.pelatih.map(function (c) { return '<option value="' + e(c.coach_id) + '"' + (st.coach === c.coach_id ? ' selected' : '') + '>' + e(c.nama) + '</option>'; }).join('') + '</select>' +
            '<select class="inp" data-f="kolam" style="width:auto"><option value="">Semua kolam</option>' + d.kolam.map(function (k) { return '<option value="' + e(k.kolam_id) + '"' + (st.kolam === k.kolam_id ? ' selected' : '') + '>' + e(k.nama) + '</option>'; }).join('') + '</select>' +
            '<select class="inp" data-f="jk" style="width:auto"><option value="">Pelatih L/P</option><option value="L"' + (st.jk === 'L' ? ' selected' : '') + '>Pelatih laki-laki</option><option value="P"' + (st.jk === 'P' ? ' selected' : '') + '>Pelatih perempuan</option></select></div></div>' +
          '<div id="jadwal-isi" class="mt16"></div>';
        function saring() { return d.rows.filter(function (x) { return (!st.coach || x.coach_id === st.coach) && (!st.kolam || x.kolam_id === st.kolam) && (!st.jk || x.jenis_kelamin === st.jk); }); }
        function slot(x) {
          var r = x.enr, nama = r ? r.peserta.map(function (p) { return p.nama.split(' ')[0]; }).join(' & ') : '';
          var cls = x.status_slot === 'Libur' ? 'libur' : x.status_slot === 'Kosong' ? 'kosong' : UI2.jenis(r && r.kategori);
          return '<div class="slot ' + cls + (x.bentrok.length ? ' bentrok' : '') + (d.bolehKelola ? ' item-klik' : '') + '" data-a="slot" data-id="' + e(x.jadwal_id) + '">' +
            '<span class="jam">' + e(x.jam_mulai) + '–' + e(x.jam_selesai) + '</span>' +
            (x.status_slot === 'Terisi' ? '<b class="satu-baris">' + e(nama) + '</b>' + UI2.lencana(r.kategori) : '<b>' + (x.status_slot === 'Libur' ? 'Libur' : 'Slot kosong') + '</b>') +
            '<span class="redup satu-baris">' + e(x.pelatih.split(' ')[0]) + ' · ' + e(x.kolam_singkat || '-') + '</span>' + (x.bentrok.length ? '<span class="teks-bahaya tebal">' + ik('segitiga', 'k') + ' Bentrok</span>' : '') + '</div>';
        }
        function gambar() {
          var rows = saring(), w = ctx.el.querySelector('#jadwal-isi');
          if (st.view === 'minggu') {
            w.innerHTML = '<div class="kartu pad"><div class="minggu">' + HARI.map(function (h) { var isi = rows.filter(function (x) { return x.hari === h; }); return '<div class="hari-kolom"><div class="hari-kepala' + (h === d.hariIni ? ' ini' : '') + '">' + Inti.NAMA_HARI[h] + '<small>' + isi.filter(function (x) { return x.status_slot === 'Terisi'; }).length + ' sesi</small></div>' + (isi.length ? isi.map(slot).join('') : '<div class="slot kosong">—</div>') + '</div>'; }).join('') + '</div></div>';
          } else if (st.view === 'harian') {
            var isi = rows.filter(function (x) { return x.hari === Number(st.hari); });
            w.innerHTML = '<div class="kartu pad"><div class="deret-chip">' + HARI.map(function (h) { return '<button type="button" class="chip' + (Number(st.hari) === h ? ' aktif' : '') + '" data-a="hari" data-h="' + h + '">' + Inti.NAMA_HARI[h] + (h === d.hariIni ? ' · hari ini' : '') + '</button>'; }).join('') + '</div>' +
              (isi.length ? '<div class="grid g3 mt16 stagger">' + isi.map(function (x, i) { return slot(x).replace('class="slot', 'style="--i:' + i + '" class="slot'); }).join('') + '</div>' : '<div class="mt16">' + MR.UI.kosong('Tidak ada slot', 'Belum ada jadwal pada hari ini.') + '</div>') + '</div>';
          } else {
            var beban = d.beban.filter(function (b) { return (!st.coach || b.coach_id === st.coach) && (!st.jk || b.jenis_kelamin === st.jk); }).sort(function (a, b) { return b.sesi - a.sesi; }), maks = Math.max.apply(null, beban.map(function (b) { return b.sesi; }).concat([1]));
            w.innerHTML = '<div class="grid g2 stagger">' + beban.map(function (b, i) {
              var isi = rows.filter(function (x) { return x.coach_id === b.coach_id; });
              return '<div class="kartu pad" style="--i:' + i + '"><div class="baris">' + UI2.avatar(b.nama) + '<div class="tumpuk tumbuh"><b>' + e(b.nama) + '</b><span class="kecil redup">' + (b.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki') + ' · ' + b.sesi + ' sesi/minggu</span></div>' + (b.bentrok ? '<span class="status habis">' + b.bentrok + ' bentrok</span>' : '<span class="status ok">Aman</span>') + '</div>' +
                '<div class="progres merek mt12"><i data-p="' + (b.sesi / maks) + '"></i></div><div class="baris bungkus mt12" style="gap:6px">' + HARI.map(function (h) { var n = isi.filter(function (x) { return x.hari === h && x.status_slot === 'Terisi'; }).length; return '<span class="chip" style="height:26px;cursor:default">' + Inti.NAMA_HARI[h].slice(0, 3) + ' <span class="n">' + n + '</span></span>'; }).join('') + '</div></div>';
            }).join('') + '</div>';
          }
          UI2.hidupkan(w);
        }
        ctx.on('seg', '.seg', function (s, ev) { st.view = ev.detail.v; gambar(); });
        ctx.on('change', 'select[data-f]', function (s) { st[s.dataset.f] = s.value; gambar(); });
        ctx.aksi({
          hari: function (b) { st.hari = Number(b.dataset.h); gambar(); },
          tambah: function () { formSlot(d, {}); },
          slot: function (t) { if (!d.bolehKelola) return; var x = d.rows.filter(function (y) { return y.jadwal_id === t.dataset.id; })[0]; if (x) formSlot(d, x); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); });
      });
    }
  });
  function formSlot(d, x) {
    var baru = !x.jadwal_id;
    var m = MR.UI.modal({ judul: baru ? 'Tambah slot jadwal' : 'Ubah slot jadwal', sub: 'Slot "Terisi" terhubung ke paket siswa; jam memakai format 24 jam.', isi: '<form class="form">' +
      UI2.fld({ k: 'coach_id', label: 'Pelatih', tipe: 'select', wajib: true, opsi: d.pelatih.map(function (c) { return { v: c.coach_id, l: c.nama }; }), v: x.coach_id, l: 'l3' }) +
      UI2.fld({ k: 'hari', label: 'Hari', tipe: 'select', wajib: true, opsi: HARI.map(function (h) { return { v: h, l: Inti.NAMA_HARI[h] }; }), v: x.hari, l: 'l3' }) +
      UI2.fld({ k: 'jam_mulai', label: 'Jam mulai', tipe: 'time', v: x.jam_mulai || '08:00', l: 'l2' }) + UI2.fld({ k: 'jam_selesai', label: 'Jam selesai', tipe: 'time', v: x.jam_selesai || '09:00', l: 'l2' }) +
      UI2.fld({ k: 'status_slot', label: 'Status', tipe: 'select', opsi: ['Terisi', 'Kosong', 'Libur'], v: x.status_slot || 'Terisi', l: 'l2', kosong: false }) +
      UI2.fld({ k: 'enr_id', label: 'Paket siswa', tipe: 'select', opsi: d.paket.map(function (p) { return { v: p.enr_id, l: p.label }; }), v: x.enr ? x.enr.enr_id : '', l: 'l4' }) +
      UI2.fld({ k: 'kolam_id', label: 'Kolam', tipe: 'select', opsi: d.kolam.map(function (k) { return { v: k.kolam_id, l: k.nama }; }), v: x.kolam_id, l: 'l2', ph: 'Ikuti paket' }) +
      UI2.fld({ k: 'catatan', label: 'Catatan', v: x.catatan }) + '</form>',
      kaki: (baru ? '' : '<button type="button" class="btn bahaya" data-x="hapus">' + ik('sampah', 'k') + 'Hapus</button>') + '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-x="simpan">Simpan slot</button>' });
    var f = m.el.querySelector('form');
    function ubahStatus() { var terisi = f.status_slot.value === 'Terisi'; f.querySelector('[data-k=enr_id]').hidden = !terisi; }
    f.status_slot.addEventListener('change', ubahStatus); ubahStatus();
    f.enr_id.addEventListener('change', function () { var p = d.paket.filter(function (y) { return y.enr_id === f.enr_id.value; })[0]; if (p) { if (!f.coach_id.value) f.coach_id.value = p.coach_id; if (!f.kolam_id.value) f.kolam_id.value = p.kolam_id; } });
    m.on('click', '[data-x=simpan]', function (t) {
      var v = UI2.baca(f); v.jadwal_id = x.jadwal_id; v.hari = Number(v.hari);
      MR.UI.kerja(t, function () { return API.T('jadwal.simpan', { jadwal: v }); }, { form: f }).then(function (r) { m.tutup(); if (r.peringatan) MR.UI.toast(r.peringatan, 'warn', { judul: 'Tersimpan dengan bentrok', durasi: 7000 }); else MR.UI.toast('Slot jadwal tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { });
    });
    m.on('click', '[data-x=hapus]', function () { MR.UI.konfirmasi({ judul: 'Hapus slot ini?', pesan: 'Slot dinonaktifkan dan tidak lagi muncul di absensi.', ok: 'Hapus', bahaya: true }).then(function (y) { if (y) API.T('jadwal.hapus', { jadwal_id: x.jadwal_id }).then(function () { m.tutup(); MR.UI.toast('Slot dihapus.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); }); });
  }

  /* ================= Absensi (monitoring Owner/Admin) ================= */
  R.daftar('absensi', {
    judul: 'Absensi', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st; if (ctx.q.tanggal && !st._q) { st.tanggal = ctx.q.tanggal; st._q = 1; }
      st.tanggal = st.tanggal || UI2.hariIni(); st.saring = st.saring || 'semua';
      var bisaBK = Sesi.punya(['absensi.buka_kunci', 'absensi.koreksi']);
      return Promise.all([API.Q('absensi.hari', { tanggal: st.tanggal, coach_id: st.coach || '' }), bisaBK ? API.Q('absensi.bukaKunciList') : Promise.resolve({ rows: [] })]).then(function (h) {
        if (ctx.basi()) return;
        var d = h[0], bk = h[1], b = d.batas, rg = d.ringkas; API.setJamServer(b.sekarang_ms);
        var sisa = b.batas_aktif ? b.batas_ms - API.jamServer() : null, hariIni = d.tanggal === d.hariIni;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Monitoring Absensi</h1><p>Semua waktu memakai jam server WIB. Jam di perangkat pelatih tidak berpengaruh.</p></div><div class="aksi">' +
          (d.bisa.batas ? '<button type="button" class="btn" data-a="batas">' + ik('jam') + 'Jam batas</button>' : '') + (d.bisa.buka ? '<button type="button" class="btn primer" data-a="buka">' + ik('buka') + 'Buka kunci</button>' : '') + '</div></div>' +
          '<div class="peringatan ' + (!b.batas_aktif ? 'info' : b.boleh ? 'ok' : 'bahaya') + '">' + ik(!b.batas_aktif ? 'info' : b.boleh ? 'jam' : 'gembok') + '<div><b>' + (!b.batas_aktif ? 'Batas waktu absensi nonaktif' : b.boleh ? (hariIni ? 'Absensi terbuka sampai ' + e(b.jam_batas) + ' WIB' : 'Absensi ' + e(F.tgl(d.tanggal)) + ' masih terbuka') : 'Absensi ' + e(F.tgl(d.tanggal)) + ' terkunci') + '</b>' +
            (b.batas_aktif && b.boleh && hariIni && sisa > 0 ? 'Sisa <b class="angka" data-hitung="' + b.batas_ms + '">' + F.durasi(sisa) + '</b> · ' : '') + 'Batas ' + e(b.jam_batas) + ':00 WIB masih diterima; ' + e(b.jam_batas) + ':01 ditolak otomatis oleh server.</div></div>' +
          '<div class="grid g4 kpi-baris stagger mt16">' + UI2.kpi({ i: 0, label: 'Total sesi', nilai: rg.total, ikon: 'kalender' }) + UI2.kpi({ i: 1, label: 'Sudah diabsen', nilai: rg.sudah, ikon: 'cekBulat', warna: 'hijau' }) + UI2.kpi({ i: 2, label: 'Belum diabsen', nilai: rg.belum, ikon: 'jam', warna: rg.belum ? 'oranye' : 'navy' }) + UI2.kpi({ i: 3, label: 'Koreksi & buka kunci', nilai: rg.koreksi, ikon: 'pensil', warna: 'ungu' }) + '</div>' +
          '<div class="kartu pad mt16"><div class="baris bungkus" style="gap:10px"><input class="inp" type="date" data-f="tanggal" value="' + e(d.tanggal) + '" max="' + e(d.hariIni) + '" style="width:auto">' +
            '<button type="button" class="btn kecil" data-a="geser" data-n="-1" aria-label="Hari sebelumnya">' + ik('kiri', 'k') + '</button><button type="button" class="btn kecil" data-a="geser" data-n="1" aria-label="Hari berikutnya"' + (hariIni ? ' disabled' : '') + '>' + ik('kanan', 'k') + '</button>' + (!hariIni ? '<button type="button" class="btn kecil lembut" data-a="kini">Hari ini</button>' : '') +
            '<select class="inp" data-f="coach" style="width:auto"><option value="">Semua pelatih</option>' + d.pelatih.map(function (c) { return '<option value="' + e(c.coach_id) + '"' + (st.coach === c.coach_id ? ' selected' : '') + '>' + e(c.nama) + '</option>'; }).join('') + '</select><span class="tumbuh"></span>' +
            UI2.seg('saring', [{ v: 'semua', label: 'Semua', n: rg.total }, { v: 'belum', label: 'Belum', n: rg.belum }, { v: 'sudah', label: 'Sudah', n: rg.sudah }], st.saring) + '</div></div>' +
          '<div id="absen-isi" class="mt16"></div>' +
          (bk.rows.length ? '<section class="kartu mt16"><div class="kartu-kepala"><span class="ubin ungu">' + ik('buka') + '</span><div class="tumpuk tumbuh"><h2>Riwayat buka kunci</h2><p>Berlaku 24 jam per pelatih & tanggal · tercatat di log audit</p></div></div>' +
            UI2.tabel({ baris: bk.rows.slice(0, 10), kolom: [{ label: 'Pelatih', f: function (x) { return '<b>' + e(x.pelatih) + '</b>'; } }, { label: 'Tanggal absensi', f: function (x) { return e(F.tgl(x.tanggal)); } }, { label: 'Alasan', k: 'alasan' }, { label: 'Dibuka oleh', f: function (x) { return e(x.oleh) + ' · ' + e(F.relatif(x.dibuat_at)); } }, { label: 'Status', f: function (x) { return x.aktif ? '<span class="status ok">Berlaku s/d ' + e(F.jam(x.berlaku_hingga)) + '</span>' : '<span class="status netral">Berakhir</span>'; } }] }) + '</section>' : '');
        function gambar() {
          var rows = d.sesi.filter(function (x) { return st.saring === 'semua' || (st.saring === 'sudah' ? !!x.absen : !x.absen); }), w = ctx.el.querySelector('#absen-isi');
          w.innerHTML = rows.length ? '<div class="grid g3 stagger">' + rows.map(function (x, i) {
            var aksi = '';
            if (!x.absen && d.bisa.input) aksi = x.batas.boleh ? '<button type="button" class="btn kecil primer" data-a="input" data-enr="' + e(x.enr_id) + '">' + ik('absen', 'k') + 'Input atas nama pelatih</button>' : (d.bisa.buka ? '<button type="button" class="btn kecil" data-a="bukaUntuk" data-coach="' + e(x.coach_id) + '">' + ik('buka', 'k') + 'Buka kunci</button>' : '');
            if (x.absen && (d.bisa.koreksi || (d.bisa.input && x.batas.boleh))) aksi = '<button type="button" class="btn kecil" data-a="koreksi" data-enr="' + e(x.enr_id) + '">' + ik('pensil', 'k') + 'Koreksi</button>';
            return '<div style="--i:' + i + '" class="tumpuk">' + W.kartuSesi(x, { klik: 'riwayat' }) + (aksi ? '<div class="baris mt8">' + aksi + '</div>' : '') + '</div>';
          }).join('') + '</div>'
            : '<div class="kartu pad">' + MR.UI.kosong(st.saring === 'belum' ? 'Semua sesi sudah diabsen' : 'Tidak ada sesi', 'Jadwal terisi pada tanggal ini akan muncul di sini.') + '</div>';
          UI2.hidupkan(w);
        }
        function sesiDari(t) { return d.sesi.filter(function (x) { return x.enr_id === t.dataset.enr; })[0]; }
        ctx.on('seg', '.seg', function (s, ev) { st.saring = ev.detail.v; gambar(); });
        ctx.on('change', '[data-f=tanggal]', function (i) { if (i.value) { st.tanggal = i.value; R.tampilkan({ diam: true, bingkai: true }); } });
        ctx.on('change', '[data-f=coach]', function (s) { st.coach = s.value; R.tampilkan({ diam: true, bingkai: true }); });
        ctx.aksi({
          geser: function (b) { st.tanggal = Inti.util.geserTgl(st.tanggal, Number(b.dataset.n)); if (st.tanggal > d.hariIni) st.tanggal = d.hariIni; R.tampilkan({ diam: true, bingkai: true }); },
          kini: function () { st.tanggal = d.hariIni; R.tampilkan({ diam: true, bingkai: true }); },
          input: function (t) { W.lembarAbsen(sesiDari(t), d.aturan); },
          koreksi: function (t) { var x = sesiDari(t); W.lembarAbsen(x, d.aturan, { wajibAlasan: !x.batas.boleh, bolehHapus: d.bisa.koreksi }); },
          riwayat: function (t) { W.riwayatPaket(t.dataset.enr); },
          batas: function () { aturBatas(b); },
          buka: function () { bukaKunci(d, {}); },
          bukaUntuk: function (t) { bukaKunci(d, { coach_id: t.dataset.coach, tanggal: d.tanggal }); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); W.hitungMundur(ctx.el); });
      });
    }
  });
  /* Hitung mundur langsung (jam server) untuk elemen [data-hitung] */
  W.hitungMundur = function (root) {
    var els = MR.qsa('[data-hitung]', root); if (!els.length) return;
    var t = setInterval(function () {
      if (!D.body.contains(els[0])) return clearInterval(t);
      els.forEach(function (el) { var s = Number(el.dataset.hitung) - API.jamServer(); el.textContent = F.durasi(s); if (s <= 0) { clearInterval(t); setTimeout(function () { API.bersihkan(); R.muatUlang(); }, 1200); } });
    }, 1000);
  };
  W.riwayatPaket = function (enrId) {
    var m = MR.UI.laci({ judul: 'Riwayat kehadiran', isi: UI2.muatSebaris(), kaki: false });
    API.Q('absensi.riwayat', { enr_id: enrId }).then(function (d) {
      var r = d.enr; m.el.querySelector('.ov-kepala h2').textContent = r.peserta.map(function (p) { return p.nama; }).join(' & ');
      m.isi.innerHTML = '<div class="baris bungkus">' + UI2.lencana(r.kategori) + '<b>' + e(r.paket) + '</b>' + UI2.sisaChip(r) + '</div><div class="mt12">' + UI2.progres(r) + '</div>' +
        '<ul class="linimasa mt16">' + (d.riwayat.length ? d.riwayat.map(function (a) { return '<li><span class="titik ' + (a.dihitung ? 'ok' : '') + '">' + ik(a.dihitung ? 'cek' : 'info') + '</span><div class="tumbuh"><div class="baris ujung"><b>Pertemuan ke-' + a.pertemuan_ke + ' · ' + e(F.tglHari(a.tanggal)) + '</b><time>' + e(F.jam(a.waktu_server)) + '</time></div><p>' + a.peserta.map(function (p) { return e(p.nama.split(' ')[0]) + ': ' + e(p.status); }).join(' · ') + ' · ' + e(a.pelatih) + (a.koreksi ? ' · dikoreksi' : '') + (a.sesi_lebih ? ' · sesi lebih' : '') + (a.via_buka_kunci ? ' · via buka kunci' : '') + '</p>' + (a.catatan ? '<p class="kecil">“' + e(a.catatan) + '”</p>' : '') + '</div></li>'; }).join('') : '<li>' + MR.UI.kosong('Belum ada kehadiran') + '</li>') + '</ul>';
      UI2.hidupkan(m.el);
    }).catch(function (er) { m.isi.innerHTML = MR.UI.kosong('Gagal memuat', er.message); });
  };
  function aturBatas(b) {
    var m = MR.UI.modal({ judul: 'Jam batas absensi', sempit: true, sub: 'Berlaku untuk semua pelatih, dihitung dari jam server WIB. Perubahan tercatat di log audit.', isi: '<form class="form">' +
      UI2.fld({ k: 'jam_batas', label: 'Jam batas (WIB)', tipe: 'time', v: b.jam_batas }) + '<div class="fld"><label class="saklar"><input type="checkbox" name="batas_aktif"' + (b.batas_aktif ? ' checked' : '') + '><i></i><span>Aktifkan batas waktu</span></label><span class="bantu">Bila nonaktif, pelatih dapat mengisi absensi hari lampau kapan saja.</span></div></form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan</button>' });
    m.el.querySelector('[data-ok]').onclick = function () { var f = m.el.querySelector('form'), v = UI2.baca(f); MR.UI.kerja(this, function () { return API.T('absensi.aturBatas', v); }, { form: f }).then(function (r) { m.tutup(); MR.UI.toast('Batas absensi: ' + r.absensi.jam_batas + ' WIB (' + (r.absensi.batas_aktif ? 'aktif' : 'nonaktif') + ').', 'ok'); R.muatUlang(); }).catch(function () { }); };
  }
  function bukaKunci(d, x) {
    var m = MR.UI.modal({ judul: 'Buka kunci absensi', sempit: true, sub: 'Pelatih dapat mengisi absensi tanggal tersebut selama 24 jam. Owner menerima notifikasi.', isi: '<form class="form">' +
      UI2.fld({ k: 'coach_id', label: 'Pelatih', tipe: 'select', wajib: true, opsi: d.pelatih.map(function (c) { return { v: c.coach_id, l: c.nama }; }), v: x.coach_id }) +
      UI2.fld({ k: 'tanggal', label: 'Tanggal absensi', tipe: 'date', v: x.tanggal || Inti.util.geserTgl(d.hariIni, -1), attr: ' max="' + d.hariIni + '"' }) +
      UI2.fld({ k: 'alasan', label: 'Alasan', tipe: 'area', baris: 2, wajib: true, ph: 'mis. sinyal di kolam mati, pelatih lupa mengisi' }) + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + ik('buka', 'k') + 'Buka kunci 24 jam</button>' });
    m.el.querySelector('[data-ok]').onclick = function () { var f = m.el.querySelector('form'), v = UI2.baca(f); MR.UI.kerja(this, function () { return API.T('absensi.bukaKunci', v); }, { form: f }).then(function () { m.tutup(); MR.UI.toast('Kunci dibuka untuk 24 jam.', 'ok'); R.muatUlang(); }).catch(function () { }); };
  }

  /* ================= Materi latihan ================= */
  var THUMB = { PDF: 'assets/ilustrasi/materi-pdf.svg', Video: 'assets/ilustrasi/materi-video.svg', Gambar: 'assets/ilustrasi/materi-gambar.svg', Teks: 'assets/ilustrasi/materi-teks.svg' };
  R.daftar('materi', {
    judul: 'Materi Latihan', kerangka: 'tabel', peran: ['owner', 'admin', 'pelatih'],
    render: function (ctx) {
      var st = ctx.st; st.jenis = st.jenis || '';
      return API.Q('materi.list').then(function (d) {
        if (ctx.basi()) return;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Materi Latihan</h1><p>Panduan teknik, program latihan, dan video untuk pelatih.</p></div><div class="aksi">' + (d.kelola ? '<button type="button" class="btn primer" data-a="tambah" data-kunci="n">' + ik('plus') + 'Tambah materi</button>' : '') + '</div></div>' +
          '<div class="kartu pad"><div class="baris bungkus" style="gap:10px"><div class="inp-ikon tumbuh" style="min-width:200px">' + ik('cari') + '<input class="inp" data-f="q" placeholder="Cari judul, tag, atau isi…" value="' + e(st.q || '') + '"></div>' + UI2.seg('jenis', [{ v: '', label: 'Semua' }, { v: 'PDF', label: 'PDF' }, { v: 'Video', label: 'Video' }, { v: 'Gambar', label: 'Gambar' }, { v: 'Teks', label: 'Teks' }], st.jenis) + '</div>' +
          '<div class="deret-chip mt12">' + [''].concat(d.kategori).map(function (k) { return '<button type="button" class="chip' + ((st.kat || '') === k ? ' aktif' : '') + '" data-a="kat" data-v="' + e(k) + '">' + e(k || 'Semua kategori') + '</button>'; }).join('') + '</div></div><div id="materi-isi" class="mt16"></div>';
        function gambar() {
          var q = (st.q || '').toLowerCase(), rows = d.rows.filter(function (m) { return (!st.jenis || m.jenis === st.jenis) && (!st.kat || m.kategori === st.kat) && (!q || (m.judul + ' ' + m.tag + ' ' + m.deskripsi).toLowerCase().indexOf(q) >= 0); });
          ctx.el.querySelector('#materi-isi').innerHTML = rows.length ? '<div class="grid g3 stagger">' + rows.map(function (m, i) {
            return '<div class="kartu klik" data-a="buka" data-id="' + e(m.materi_id) + '" tabindex="0" role="button" style="--i:' + i + ';overflow:hidden"><div style="aspect-ratio:16/8;background:#EAF2FA;overflow:hidden"><img src="' + e(m.jenis === 'Gambar' && /^(data:|assets\/)/.test(m.url) ? m.url : THUMB[m.jenis] || THUMB.Teks) + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>' +
              '<div class="pad" style="padding:14px 16px"><div class="baris bungkus" style="gap:6px"><span class="status info polos">' + e(m.jenis) + '</span><span class="kecil redup">' + e(m.kategori) + '</span>' + (m.aktif === 'T' ? '<span class="status netral polos">Nonaktif</span>' : '') + '</div><b class="mt8" style="display:block">' + e(m.judul) + '</b><p class="kecil redup mt8" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + e(m.deskripsi) + '</p>' + (m.tag ? '<div class="baris bungkus mt8" style="gap:4px">' + m.tag.split(',').filter(Boolean).slice(0, 3).map(function (t) { return '<span class="tag-kecil">#' + e(t.trim()) + '</span>'; }).join('') + '</div>' : '') + '</div></div>';
          }).join('') + '</div>' : '<div class="kartu pad">' + MR.UI.kosong('Materi tidak ditemukan', 'Coba kata kunci lain.') + '</div>';
        }
        ctx.on('input', '[data-f=q]', MR.U.debounce(function (i) { st.q = i.value; gambar(); }, 120));
        ctx.on('seg', '.seg', function (s, ev) { st.jenis = ev.detail.v; gambar(); });
        ctx.aksi({
          kat: function (b) { st.kat = b.dataset.v; MR.qsa('.chip', ctx.el).forEach(function (c) { c.classList.toggle('aktif', c === b); }); gambar(); },
          buka: function (t) { var m = d.rows.filter(function (x) { return x.materi_id === t.dataset.id; })[0]; if (m) bukaMateri(m, d); },
          tambah: function () { formMateri({}, d); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); });
      });
    }
  });
  function bukaMateri(x, d) {
    var m = MR.UI.modal({ lebar: true, judul: x.judul, sub: e(x.jenis) + ' · ' + e(x.kategori), isi:
      (x.jenis === 'Gambar' && x.url ? '<img src="' + e(x.url) + '" alt="' + e(x.judul) + '" style="width:100%;border-radius:12px;margin-bottom:12px">' : '') +
      '<p style="white-space:pre-line">' + e(x.deskripsi || '') + '</p>' + (x.tag ? '<div class="baris bungkus mt12" style="gap:4px">' + x.tag.split(',').filter(Boolean).map(function (t) { return '<span class="tag-kecil">#' + e(t.trim()) + '</span>'; }).join('') + '</div>' : ''),
      kaki: (d.kelola ? '<button type="button" class="btn" data-x="ubah">' + ik('pensil', 'k') + 'Ubah</button>' : '') + (x.url ? '<a class="btn primer" href="' + e(x.url) + '" target="_blank" rel="noopener">' + ik(x.jenis === 'Video' ? 'video' : 'unduh', 'k') + (x.jenis === 'Video' ? 'Tonton video' : 'Buka materi') + '</a>' : '<button type="button" class="btn" data-tutup>Tutup</button>') });
    m.on('click', '[data-x=ubah]', function () { m.tutup(); formMateri(x, d); });
  }
  function formMateri(x, d) {
    var baru = !x.materi_id, berkas = null;
    var m = MR.UI.modal({ judul: baru ? 'Tambah materi' : 'Ubah materi', isi: '<form class="form">' + UI2.fld({ k: 'judul', label: 'Judul', v: x.judul, wajib: true }) +
      UI2.fld({ k: 'kategori', label: 'Kategori', v: x.kategori, l: 'l3', attr: ' list="dl-kat"' }) + '<datalist id="dl-kat">' + d.kategori.map(function (k) { return '<option value="' + e(k) + '">'; }).join('') + '</datalist>' +
      UI2.fld({ k: 'jenis', label: 'Jenis', tipe: 'select', opsi: ['PDF', 'Video', 'Gambar', 'Teks'], v: x.jenis || 'PDF', l: 'l3', kosong: false }) +
      UI2.fld({ k: 'link', label: 'Tautan (opsional)', tipe: 'url', v: x.link, ph: 'https://…', bantu: 'Mis. video YouTube atau dokumen Google Drive.' }) +
      '<div class="fld" data-k="berkas"><label>Atau unggah berkas</label><input class="inp" type="file" name="berkas_f" accept="application/pdf,image/png,image/jpeg,video/*"><span class="bantu">PDF/gambar/video maks. 20 MB, disimpan di folder Materi.</span><span class="galat"></span></div>' +
      UI2.fld({ k: 'tag', label: 'Tag (pisahkan koma)', v: x.tag, ph: 'pemula, gaya bebas' }) + UI2.fld({ k: 'deskripsi', label: 'Isi / deskripsi', tipe: 'area', v: x.deskripsi, baris: 5 }) +
      (baru ? '' : UI2.fld({ k: 'aktif', label: 'Status', tipe: 'select', opsi: [{ v: 'Y', l: 'Aktif' }, { v: 'T', l: 'Nonaktif' }], v: x.aktif || 'Y', kosong: false })) + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan materi</button>' });
    var f = m.el.querySelector('form');
    f.berkas_f.addEventListener('change', function () { UI2.bacaBerkas(f.berkas_f.files[0], { maksMB: 20, tipe: /^(application\/pdf|image\/(png|jpe?g)|video\/)/, kompres: false, pesanTipe: 'Format harus PDF, gambar, atau video.' }).then(function (b) { berkas = b; }, function (er) { MR.UI.tandaiGalat(f, { berkas: er.message }); }); });
    m.el.querySelector('[data-ok]').onclick = function () { var v = UI2.baca(f); delete v.berkas_f; v.materi_id = x.materi_id; MR.UI.kerja(this, function () { return API.T('materi.simpan', { materi: v, berkas: berkas ? { nama: berkas.nama, mime: berkas.mime, base64: berkas.base64 } : null }); }, { form: f }).then(function () { m.tutup(); MR.UI.toast('Materi tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { }); };
  }
})(window, document);
