/* =====================================================================
 * PORTAL PELATIH (Hari ini · Jadwal saya · Rekap saya) &
 * PORTAL ORANG TUA (Anak saya · Jadwal · Riwayat hadir)
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router;

  /* ================= Pelatih: Hari ini ================= */
  R.daftar('hari-ini', {
    judul: 'Hari Ini', kerangka: 'dashboard', peran: ['pelatih'],
    render: function (ctx) {
      /* Tahan sinyal lemah di pinggir kolam: tampil seketika dari cache perangkat, disegarkan di latar */
      return API.Q('dash.pelatih', {}, { lokal: true }).then(function (d) {
        if (ctx.basi()) return;
        var b = d.batas;
        var sisa = b.batas_aktif ? b.batas_ms - API.jamServer() : null, belum = d.sesi.filter(function (x) { return !x.absen; }).length;
        ctx.el.innerHTML = '<div class="banner masuk">' + W.bannerOmbak() +
          '<span class="label-atas">' + ik('kalender', 'k') + e(F.tglHari(d.hariIni)) + '</span><h1>' + F.salam() + ', Coach ' + e(d.nama.split(' ')[0]) + '.</h1>' +
          '<p>' + (d.sesi.length ? d.sesi.length + ' sesi hari ini · ' + (belum ? belum + ' belum diabsen' : 'semua sudah tercatat ✓') : 'Tidak ada sesi terjadwal hari ini.') + (d.besok ? ' Besok ' + d.besok + ' sesi.' : '') + '</p>' +
          (b.batas_aktif ? (b.boleh ? '<div class="hitung-mundur">' + ik('jam') + '<span>Batas absensi ' + e(b.jam_batas) + ' WIB<br><small style="opacity:.8;font-weight:500">jam server, bukan jam HP</small></span><b data-hitung="' + b.batas_ms + '">' + F.durasi(sisa) + '</b></div>' : '<div class="hitung-mundur">' + ik('gembok') + '<span>Absensi hari ini sudah terkunci (' + e(b.jam_batas) + ' WIB). Minta Admin membuka kunci bila perlu.</span></div>') : '') + '</div>' +
          (API.offline ? '<div class="peringatan warn mt16 offline">' + ik('awan') + '<div><b>Mode offline</b>Menampilkan jadwal tersimpan ' + e(F.relatif(Inti.util.waktuWIB(API.offline))) + '. Data diperbarui otomatis saat sinyal kembali.</div></div>' : '') +
          W.bannerInfoKolam(d.info_kolam || []) +
          (d.belum_kemarin.length ? '<div class="peringatan bahaya mt16">' + ik('segitiga') + '<div><b>' + d.belum_kemarin.length + ' sesi kemarin belum diabsen</b>' + d.belum_kemarin.map(function (x) { return e(x.peserta) + (x.batas.boleh ? (x.batas.via_buka_kunci ? ' — kunci dibuka Admin' : '') : ' — terkunci'); }).join(' · ') + (d.belum_kemarin.some(function (x) { return x.batas.boleh; }) ? '<br><button type="button" class="btn kecil mt8" data-a="kemarin">Isi absensi kemarin</button>' : '') + '</div></div>' : '') +
          '<div class="grid g4 kpi-baris stagger mt16">' + UI2.kpi({ i: 0, label: 'Sesi hari ini', nilai: d.sesi.length, ikon: 'kalender' }) + UI2.kpi({ i: 1, label: 'Sudah diabsen', nilai: d.sesi.length - belum, ikon: 'cekBulat', warna: 'hijau' }) + UI2.kpi({ i: 2, label: 'Sesi bulan ini', nilai: d.sesi_bulan_ini, ikon: 'absen', warna: 'ungu', sub: 'Sesi dihitung untuk honor' }) + UI2.kpi({ i: 3, label: 'Besok', nilai: d.besok, ikon: 'jam', warna: 'oranye' }) + '</div>' +
          '<div class="judul-seksi"><h2>Sesi hari ini</h2><span class="tumbuh"></span><span class="kecil redup">Ketuk kartu untuk mengisi absensi</span></div>' +
          (d.sesi.length ? '<div class="grid g3 stagger" id="sesi-hari">' + d.sesi.map(function (x, i) { return W.kartuSesi(x, { klik: 'absen', i: i }); }).join('') + '</div>' : '<div class="kartu pad">' + MR.UI.kosong('Hari ini kosong', 'Nikmati istirahat Anda, Coach!') + '</div>') +
          '<div class="info-aturan mt16">' + ik('info') + '<span><b>' + e(d.aturan.status_dihitung.join(' & ')) + '</b> memotong sisa sesi · Izin tidak dihitung · ' + (d.aturan.absensi_paket_habis === 'tolak' ? 'paket HABIS tidak bisa diabsen' : 'paket HABIS dicatat sebagai sesi lebih') + '.</span></div>' +
          (d.materi.length ? '<div class="judul-seksi"><h2>Materi terbaru</h2><span class="tumbuh"></span><a class="btn kecil hantu" href="#/materi">Semua ' + ik('kanan', 'k') + '</a></div><div class="daftar-ikon">' + d.materi.map(function (m) { return '<a class="item-ikon item-klik" href="#/materi" style="color:inherit"><span class="ubin">' + ik(m.jenis === 'Video' ? 'video' : m.jenis === 'Gambar' ? 'gambar' : 'buku') + '</span><div class="tumbuh"><b class="kecil">' + e(m.judul) + '</b><div class="kecil redup">' + e(m.kategori) + ' · ' + e(m.jenis) + '</div></div>' + ik('kanan') + '</a>'; }).join('') + '</div>' : '');
        function sesiDari(id) { return d.sesi.filter(function (x) { return x.enr_id === id; })[0]; }
        ctx.aksi({
          absen: function (t) {
            var x = sesiDari(t.dataset.enr); if (!x) return;
            if (x.absen && !x.batas.boleh) return MR.UI.toast('Absensi sesi ini sudah tercatat dan terkunci. Hubungi Admin untuk koreksi.', 'info');
            if (!x.absen && !x.batas.boleh) return MR.UI.toast(x.batas.alasan, 'warn', { judul: 'Terkunci' });
            var asli = t.outerHTML;
            W.lembarAbsen(x, d.aturan, {
              optimistik: function (ps) { t.classList.add('selesai'); var s = t.querySelector('.status'); if (s) { s.className = 'status info'; s.innerHTML = '<span class="titik-air"><i></i><i></i><i></i></span>Menyimpan'; } },
              batalOptimistik: function () { if (t.isConnected) t.outerHTML = asli; },
              selesai: function () { R.segarkanDiam(); }
            });
          },
          kemarin: function () {
            var tgl = Inti.util.geserTgl(d.hariIni, -1);
            API.Q('absensi.hari', { tanggal: tgl }, { segar: true }).then(function (h) {
              var list = h.sesi.filter(function (x) { return !x.absen && x.batas.boleh; });
              if (!list.length) return MR.UI.toast('Tidak ada sesi kemarin yang bisa diisi.', 'info');
              W.lembarAbsen(list[0], h.aturan, { selesai: function () { R.muatUlang(); } });
            }).catch(MR.UI.galat);
          }
        });
        ctx.on('keydown', '[role=button]', function (t, ev) { if (ev.key === 'Enter') t.click(); });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); W.hitungMundur(ctx.el); });
      });
    }
  });

  /* ================= Pelatih: Jadwal saya ================= */
  R.daftar('jadwal-saya', {
    judul: 'Jadwal Saya', kerangka: 'tabel', peran: ['pelatih'],
    render: function (ctx) {
      return API.Q('jadwal.list').then(function (d) {
        if (ctx.basi()) return;
        var urutan = [1, 2, 3, 4, 5, 6, 7].map(function (i) { return ((d.hariIni - 1 + i - 1) % 7) + 1; });
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Jadwal Saya</h1><p>' + d.ringkas.sesi + ' sesi per minggu, dimulai dari hari ini.</p></div></div>' +
          '<div class="tumpuk stagger" style="gap:14px">' + urutan.map(function (h, i) {
            var isi = d.rows.filter(function (x) { return x.hari === h; }), tgl = Inti.util.geserTgl(d.tanggal, i);
            return '<section class="kartu" style="--i:' + i + '"><div class="kartu-kepala"><span class="ubin ' + (i === 0 ? '' : 'abu') + '">' + ik('kalender') + '</span><div class="tumpuk tumbuh"><h2>' + Inti.NAMA_HARI[h] + (i === 0 ? ' · hari ini' : i === 1 ? ' · besok' : '') + '</h2><p>' + e(F.tgl(tgl)) + ' · ' + isi.filter(function (x) { return x.status_slot === 'Terisi'; }).length + ' sesi</p></div></div><div class="kartu-isi">' +
              (isi.length ? '<div class="daftar-sesi">' + isi.map(function (x) { var r = x.enr; return x.status_slot !== 'Terisi' ? '<div class="sesi" style="opacity:.7"><span class="jam">' + e(x.jam_mulai) + '–' + e(x.jam_selesai) + '</span><span class="meta">' + e(x.status_slot) + (x.catatan ? ' · ' + e(x.catatan) : '') + '</span></div>' : '<div class="sesi ' + UI2.jenis(r.kategori) + '"><div class="baris ujung"><span class="jam">' + e(x.jam_mulai) + '<span class="redup" style="font-weight:500;font-size:13px"> – ' + e(x.jam_selesai) + '</span></span>' + UI2.sisaChip(r) + '</div><div class="baris bungkus" style="gap:6px">' + UI2.lencana(r.kategori) + '<span class="nama">' + e(r.peserta.map(function (p) { return p.nama; }).join(' & ')) + '</span></div><div class="meta">' + ik('pin', 'k') + ' ' + e(x.kolam) + ' · ' + r.sesi_terpakai + '/' + r.sesi_total + ' sesi</div></div>'; }).join('') + '</div>' : '<p class="kecil redup">Tidak ada jadwal.</p>') + '</div></section>';
          }).join('') + '</div>';
      });
    }
  });

  /* ================= Pelatih: Rekap saya ================= */
  R.daftar('rekap-saya', {
    judul: 'Rekap Saya', kerangka: 'dashboard', peran: ['pelatih'],
    render: function (ctx) {
      var st = ctx.st; st.bulan = st.bulan || UI2.bulanIni();
      return API.Q('honor.rekap', { bulan: st.bulan }).then(function (d) {
        if (ctx.basi()) return;
        var p = d.pelatih[0] || { kategori: [], rincian: [], total_sesi: 0 };
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Rekap Saya</h1><p>Sesi yang dihitung untuk honor ' + e(F.bulan(d.bulan)) + '.</p></div><div class="aksi">' + UI2.pilihBulan(st.bulan) + '</div></div>' +
          '<div class="grid g2 kpi-baris stagger">' + UI2.kpi({ i: 0, label: 'Sesi dihitung', nilai: p.total_sesi, ikon: 'absen', warna: 'ungu' }) + (d.nominal ? UI2.kpi({ i: 1, label: 'Estimasi honor', nilai: F.rpR(p.total || 0), rp: true, ikon: 'koin', warna: 'hijau', sub: F.rp(p.total || 0) }) : UI2.kpi({ i: 1, label: 'Nominal honor', nilai: '—', ikon: 'gembok', warna: 'navy', sub: 'Ditampilkan bila Owner mengizinkan' })) + '</div>' +
          '<section class="kartu mt16"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Per kategori sesi</h2></div></div><div class="kartu-isi"><div class="daftar-ikon">' + (p.kategori.length ? p.kategori.map(function (k) { return '<div class="item-ikon">' + UI2.lencana(k.kategori) + '<span class="tumbuh"></span><b class="angka">' + k.sesi + ' sesi' + (d.nominal ? ' · ' + F.rp(k.subtotal) : '') + '</b></div>'; }).join('') : '<p class="kecil redup">Belum ada sesi dihitung bulan ini.</p>') + '</div></div></section>' +
          (p.rincian.length ? '<section class="kartu mt16"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Rincian</h2></div></div>' + UI2.tabel({ baris: p.rincian, kolom: [{ label: 'Tanggal', f: function (r) { return e(F.tglHari(r.tanggal)); } }, { label: 'Kategori', f: function (r) { return UI2.lencana(r.kategori); } }, { label: 'Peserta', k: 'peserta' }, { label: 'Kolam', k: 'kolam' }].concat(d.nominal ? [{ label: 'Tarif', kanan: true, f: function (r) { return F.rp(r.tarif); } }] : []) }) + '</section>' : '');
        ctx.on('change', '[name=bulan]', function (i) { if (i.value) { st.bulan = i.value; R.tampilkan({ diam: true, bingkai: true }); } });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });

  /* ================= Orang tua: Anak saya ================= */
  function waAdmin(d, teks) { return d.kontak_admin ? UI2.waLink(d.kontak_admin, teks) : ''; }
  R.daftar('anak', {
    judul: 'Anak Saya', kerangka: 'dashboard', peran: ['ortu'],
    render: function (ctx) {
      var st = ctx.st;
      return API.Q('dash.ortu').then(function (d) {
        if (ctx.basi()) return;
        st.anak = st.anak && d.anak.some(function (a) { return a.siswa_id === st.anak; }) ? st.anak : (d.anak[0] || {}).siswa_id;
        ctx.el.innerHTML = '<div class="banner masuk">' + W.bannerOmbak() + '<span class="label-atas">' + ik('renang', 'k') + 'Portal Orang Tua</span><h1>Halo, ' + e(d.nama.split(' ')[0]) + '!</h1><p>' + (d.anak.length > 1 ? d.anak.length + ' anak terhubung ke akun ini. ' : '') + 'Sisa sesi, jadwal, dan kehadiran diperbarui otomatis setiap pelatih mengisi absensi.</p>' +
          (d.kontak_admin ? '<div class="banner-aksi"><a class="btn putih" target="_blank" rel="noopener" href="' + waAdmin(d, 'Halo Admin ' + d.nama_app + ', saya orang tua dari ' + d.anak.map(function (a) { return a.nama; }).join(' & ') + '.') + '">' + ik('wa') + 'Hubungi Admin</a></div>' : '') + '</div>' +
          W.bannerInfoKolam(d.info_kolam || []) +
          (d.anak.length > 1 ? '<div class="mt16">' + UI2.seg('anak', d.anak.map(function (a) { return { v: a.siswa_id, label: a.nama.split(' ')[0] }; }), st.anak) + '</div>' : '') + '<div id="anak-isi" class="mt16"></div>';
        function gambar() {
          var a = d.anak.filter(function (x) { return x.siswa_id === st.anak; })[0], w = ctx.el.querySelector('#anak-isi');
          if (!a) { w.innerHTML = '<div class="kartu pad">' + MR.UI.kosong('Belum ada data anak') + '</div>'; return; }
          var p = a.paket, nx = a.berikutnya, jd = d.jadwal.filter(function (j) { return j.siswa === a.nama; }), rw = d.riwayat.filter(function (r) { return r.siswa === a.nama; });
          w.innerHTML = '<div class="grid g-2-1"><section class="kartu pad masuk"><div class="baris">' + UI2.avatar(a.nama, 'besar') + '<div class="tumpuk tumbuh" style="min-width:0"><b style="font:700 19px var(--f-judul)">' + e(a.nama) + '</b><span class="kecil redup">' + e(a.kategori) + (a.usia != null ? ' · ' + a.usia + ' tahun' : '') + ' · kode ' + e(a.kode_akses) + '</span></div></div>' +
            (p ? '<div class="baris bungkus mt16" style="gap:8px">' + UI2.lencana(p.kategori) + '<b>' + e(p.paket) + '</b>' + UI2.sisaChip(p) + '</div>' +
              '<div class="tengah mt16"><div class="kpi-nilai" style="font-size:44px">' + p.sisa + '<small> sesi tersisa</small></div><div class="kecil redup">' + p.sesi_terpakai + ' dari ' + p.sesi_total + ' sesi sudah dipakai</div></div><div class="mt12">' + UI2.progres(p, { tanpaLabel: true }) + '</div>' +
              '<div class="grid g2 mt16 kecil">' + [['Pelatih', p.pelatih], ['Lokasi', (p.lokasi === 'Home Visit' ? 'Home Visit · ' : '') + p.kolam], ['Mulai paket', F.tgl(p.tgl_mulai)], ['Berlaku sampai', p.tgl_kedaluwarsa ? F.tgl(p.tgl_kedaluwarsa) : 'Sampai sesi habis']].map(function (x) { return '<div><div class="redup">' + x[0] + '</div><b>' + e(x[1]) + '</b></div>'; }).join('') + '</div>' +
              (p.status === 'HABIS' ? '<div class="peringatan bahaya mt16">' + ik('segitiga') + '<div><b>Paket sudah HABIS</b>Perpanjang agar jadwal latihan ' + e(a.nama.split(' ')[0]) + ' tetap aman.' + (d.kontak_admin ? '<br><a class="btn wa kecil mt8" target="_blank" rel="noopener" href="' + waAdmin(d, 'Halo Admin, saya ingin memperpanjang paket ' + p.paket + ' untuk ' + a.nama + ' (kode ' + a.kode_akses + ').') + '">' + ik('wa', 'k') + 'Minta link perpanjangan</a>' : '') + '</div></div>' : p.sisa === 1 ? '<div class="peringatan warn mt16">' + ik('jam') + '<div><b>Tinggal 1 sesi</b>Hubungi Admin untuk perpanjangan lebih awal.</div></div>' : '')
              : '<p class="redup mt16">Belum ada paket aktif.</p>') + '</section>' +
            '<div class="tumpuk" style="gap:16px"><section class="kartu pad masuk-2"><b>Latihan berikutnya</b>' + (nx ? '<div class="sesi mt12 ' + UI2.jenis(p && p.kategori) + '"><span class="jam">' + e(nx.jam_mulai) + ' – ' + e(nx.jam_selesai) + '</span><span class="nama">' + e(F.tglHari(nx.tanggal)) + '</span><span class="meta">' + ik('peluit', 'k') + ' ' + e(nx.pelatih) + ' · ' + e(nx.kolam) + '</span></div>' : '<p class="kecil redup mt8">Belum ada jadwal mendatang.</p>') + '</section>' +
            '<section class="kartu pad masuk-3"><div class="baris ujung"><b>Kehadiran terakhir</b><a class="kecil" href="#/riwayat">Semua</a></div><ul class="linimasa mt12">' + (rw.length ? rw.slice(0, 4).map(function (r) { return '<li><span class="titik ' + (r.status === 'Hadir' ? 'ok' : r.status === 'Izin' ? '' : 'warn') + '">' + ik(r.status === 'Hadir' ? 'cek' : r.status === 'Izin' ? 'info' : 'x') + '</span><div class="tumbuh"><div class="baris ujung"><b>' + e(r.status) + ' · ke-' + r.pertemuan_ke + '</b><time>' + e(F.tgl(r.tanggal)) + '</time></div><p>' + e(r.pelatih) + (r.dihitung ? '' : ' · tidak memotong sesi') + '</p></div></li>'; }).join('') : '<li class="kecil redup">Belum ada kehadiran.</li>') + '</ul></section></div></div>' +
            (jd.length > 1 ? '<div class="judul-seksi"><h2>Jadwal 3 minggu ke depan</h2></div><div class="gulir-x">' + jd.map(function (j) { return '<div class="sesi ' + UI2.jenis(j.kategori) + '"><span class="jam">' + e(j.jam_mulai) + '</span><span class="nama">' + e(F.tglHari(j.tanggal)) + '</span><span class="meta">' + e(j.pelatih) + ' · ' + e(j.kolam) + '</span></div>'; }).join('') + '</div>' : '');
          UI2.hidupkan(w);
        }
        ctx.on('seg', '.seg', function (s, ev) { st.anak = ev.detail.v; gambar(); });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); });
      });
    }
  });

  /* ================= Orang tua: Jadwal ================= */
  R.daftar('jadwal-anak', {
    judul: 'Jadwal', kerangka: 'tabel', peran: ['ortu'],
    render: function (ctx) {
      return API.Q('dash.ortu').then(function (d) {
        if (ctx.basi()) return;
        var grup = {}; d.jadwal.forEach(function (j) { (grup[j.tanggal] = grup[j.tanggal] || []).push(j); });
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Jadwal Latihan</h1><p>3 minggu ke depan untuk ' + e(d.anak.map(function (a) { return a.nama.split(' ')[0]; }).join(' & ')) + '. Hubungi Admin untuk mengubah jadwal.</p></div></div>' +
          (Object.keys(grup).length ? '<div class="tumpuk stagger" style="gap:12px">' + Object.keys(grup).map(function (t, i) { return '<section class="kartu pad" style="--i:' + i + '"><b>' + e(F.tglHari(t)) + '</b><div class="daftar-sesi mt12">' + grup[t].map(function (j) { return '<div class="sesi ' + UI2.jenis(j.kategori) + '"><div class="baris ujung"><span class="jam">' + e(j.jam_mulai) + '<span class="redup" style="font-weight:500;font-size:13px"> – ' + e(j.jam_selesai) + '</span></span>' + UI2.lencana(j.kategori) + '</div><span class="nama">' + e(j.siswa) + '</span><span class="meta">' + ik('peluit', 'k') + ' ' + e(j.pelatih) + ' · ' + ik('pin', 'k') + ' ' + e(j.kolam) + '</span></div>'; }).join('') + '</div></section>'; }).join('') + '</div>' : '<div class="kartu pad">' + MR.UI.kosong('Belum ada jadwal', 'Jadwal muncul setelah Admin mengatur slot latihan.') + '</div>');
      });
    }
  });

  /* ================= Orang tua: Riwayat ================= */
  R.daftar('riwayat', {
    judul: 'Riwayat Hadir', kerangka: 'tabel', peran: ['ortu'],
    render: function (ctx) {
      var st = ctx.st;
      return API.Q('dash.ortu').then(function (d) {
        if (ctx.basi()) return;
        st.anak = st.anak || '';
        var rows = d.riwayat.filter(function (r) { return !st.anak || r.siswa === st.anak; }), hit = { Hadir: 0, Izin: 0, Hangus: 0 };
        rows.forEach(function (r) { hit[r.status] = (hit[r.status] || 0) + 1; });
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Riwayat Kehadiran</h1><p>Dicatat pelatih dengan jam server — tidak bisa diubah tanpa jejak.</p></div></div>' +
          (d.anak.length > 1 ? UI2.seg('anak', [{ v: '', label: 'Semua' }].concat(d.anak.map(function (a) { return { v: a.nama, label: a.nama.split(' ')[0] }; })), st.anak) : '') +
          '<div class="grid g3 kpi-baris stagger mt16">' + UI2.kpi({ i: 0, label: 'Hadir', nilai: hit.Hadir, ikon: 'cekBulat', warna: 'hijau' }) + UI2.kpi({ i: 1, label: 'Izin', nilai: hit.Izin, ikon: 'info' }) + UI2.kpi({ i: 2, label: 'Hangus', nilai: hit.Hangus, ikon: 'x', warna: 'oranye', sub: 'Tidak hadir tanpa izin' }) + '</div>' +
          '<section class="kartu mt16">' + UI2.tabel({ baris: rows, kosong: 'Belum ada riwayat', kolom: [{ label: 'Tanggal', f: function (r) { return '<b>' + e(F.tglHari(r.tanggal)) + '</b>'; } }, { label: 'Anak', k: 'siswa' }, { label: 'Pertemuan', f: function (r) { return 'ke-' + r.pertemuan_ke; } }, { label: 'Status', f: function (r) { return UI2.status(r.status) + (r.dihitung ? '' : ' <small class="redup">tidak dihitung</small>'); } }, { label: 'Pelatih', k: 'pelatih' }, { label: 'Lokasi', k: 'kolam' }] }) + '</section>';
        ctx.on('seg', '.seg', function (s, ev) { st.anak = ev.detail.v; R.tampilkan({ diam: true }); });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });
})(window, document);
