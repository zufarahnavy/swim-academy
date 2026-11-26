/* =====================================================================
 * ARUS KAS, HONOR PELATIH, TUTUP BULAN (laporan PDF/Excel sesuai PRD 4.5)
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router, OA = ['owner', 'admin'];

  function unduhPdf(r) {
    if (r.pdf) { UI2.unduhDataUrl('data:application/pdf;base64,' + r.pdf, r.nama_berkas); MR.UI.toast('PDF diunduh.', 'ok'); }
    else UI2.cetakHtml(r.html);
  }

  /* ================= Arus kas ================= */
  R.daftar('kas', {
    judul: 'Arus Kas', kerangka: 'dashboard', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.bulan = st.bulan || UI2.bulanIni(); st.tab = st.tab || 'semua';
      return API.Q('kas.list', { bulan: st.bulan }).then(function (d) {
        if (ctx.basi()) return;
        var rg = d.ringkas, kat = {}; d.kategori.forEach(function (k) { kat[k.kategori_id] = k; });
        var hitung = { semua: d.rows.length, Pemasukan: d.rows.filter(function (t) { return t.tipe === 'Pemasukan' && t.status !== 'batal'; }).length, Pengeluaran: d.rows.filter(function (t) { return t.tipe === 'Pengeluaran' && t.status !== 'batal'; }).length, batal: d.rows.filter(function (t) { return t.status === 'batal'; }).length };
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Arus Kas</h1><p>' + e(F.bulan(d.bulan)) + ' · ' + rg.jumlah + ' transaksi' + (d.tertutup ? ' · <b class="teks-bahaya">bulan sudah ditutup</b>' : '') + '</p></div><div class="aksi">' + UI2.pilihBulan(st.bulan) +
          (d.bolehEkspor ? '<button type="button" class="btn" data-a="excel">' + ik('unduh') + 'Excel</button><button type="button" class="btn" data-a="pdf">' + ik('cetak') + 'PDF</button>' : '') +
          (d.bolehInput ? '<button type="button" class="btn primer" data-a="input" data-kunci="n">' + ik('plus') + 'Input transaksi</button>' : '') + '</div></div>' +
          (d.tertutup ? '<div class="peringatan bahaya">' + ik('gembok') + '<div><b>Bulan ' + e(F.bulan(d.bulan)) + ' sudah ditutup</b>Transaksi baru atau perubahan hanya bisa dilakukan Owner dengan alasan, dan tercatat di log audit.</div></div>' : '') +
          '<div class="grid g4 kpi-baris stagger mt16">' +
            UI2.kpi({ i: 0, label: 'Saldo awal', nilai: F.rpR(rg.saldo_awal), rp: true, ikon: 'dompet', warna: 'navy', sub: 'Akumulasi sampai akhir bulan lalu' }) +
            UI2.kpi({ i: 1, label: 'Pemasukan', nilai: F.rpR(rg.masuk), rp: true, ikon: 'naik', warna: 'hijau', sub: '<span class="naik">' + F.rp(rg.masuk) + '</span>' }) +
            UI2.kpi({ i: 2, label: 'Pengeluaran', nilai: F.rpR(rg.keluar), rp: true, ikon: 'turun', warna: 'merah', sub: '<span class="turun">' + F.rp(rg.keluar) + '</span>' }) +
            UI2.kpi({ i: 3, label: 'Saldo akhir', nilai: F.rpR(rg.saldo_akhir), rp: true, ikon: 'koin', sub: 'Arus bulan ini <b class="' + (rg.saldo_bulan >= 0 ? 'naik' : 'turun') + '">' + (rg.saldo_bulan >= 0 ? '+' : '') + F.rpR(rg.saldo_bulan) + '</b>' }) + '</div>' +
          '<div class="grid g-2-1 mt16"><section class="kartu masuk-2"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Tren 6 bulan</h2><p>Pemasukan & pengeluaran aktif</p></div></div><div class="kartu-isi"><div id="g-tren"></div></div></section>' +
            '<section class="kartu masuk-3"><div class="kartu-kepala"><div class="tumpuk tumbuh"><h2>Komposisi pemasukan</h2><p>' + e(F.bulan(d.bulan)) + '</p></div></div><div class="kartu-isi">' + (d.komposisi.length ? Grafik.batangH(d.komposisi.map(function (x) { return { nama: x.nama, nilai: x.nilai, warna: 'var(--merek)' }; }), { fmt: F.rpR }) : MR.UI.kosong('Belum ada pemasukan')) + '</div></section></div>' +
          '<section class="kartu mt16 masuk-3"><div class="pad" style="padding:14px 16px"><div class="baris bungkus" style="gap:10px">' + UI2.seg('tab', [{ v: 'semua', label: 'Semua', n: hitung.semua }, { v: 'Pemasukan', label: 'Masuk', n: hitung.Pemasukan }, { v: 'Pengeluaran', label: 'Keluar', n: hitung.Pengeluaran }, { v: 'batal', label: 'Dibatalkan', n: hitung.batal }], st.tab) + '<span class="tumbuh"></span>' +
            '<select class="inp" data-f="kat" style="width:auto"><option value="">Semua kategori</option>' + d.kategori.map(function (k) { return '<option value="' + e(k.kategori_id) + '"' + (st.kat === k.kategori_id ? ' selected' : '') + '>' + e(k.nama) + ' (' + (k.tipe === 'Pemasukan' ? 'masuk' : 'keluar') + ')</option>'; }).join('') + '</select>' +
            '<div class="inp-ikon" style="min-width:200px">' + ik('cari') + '<input class="inp" data-f="q" placeholder="Cari nama/uraian/ID…" value="' + e(st.q || '') + '"></div></div></div><div id="kas-isi"></div></section>';
        function saring() { var q = (st.q || '').toLowerCase(); return d.rows.filter(function (t) { if (st.tab === 'batal' ? t.status !== 'batal' : (st.tab !== 'semua' && (t.tipe !== st.tab || t.status === 'batal'))) return false; if (st.kat && t.kategori_id !== st.kat) return false; return !q || (t.trx_id + ' ' + t.nama + ' ' + t.penjelasan).toLowerCase().indexOf(q) >= 0; }); }
        function gambar() {
          ctx.el.querySelector('#kas-isi').innerHTML = UI2.tabel({ klik: 'buka', id: 'trx_id', baris: saring(), kosong: 'Tidak ada transaksi', kosongSub: 'Ubah filter atau input transaksi baru.', kelasBaris: function (t) { return t.status === 'batal' ? 'batal' : ''; }, kolom: [
            { label: 'Transaksi', f: function (t) { return '<div class="sel-utama"><span class="ubin ' + (t.tipe === 'Pemasukan' ? 'hijau' : 'merah') + '" style="width:34px;height:34px">' + ik(t.tipe === 'Pemasukan' ? 'naik' : 'turun', 'k') + '</span><span class="tumpuk" style="min-width:0"><b class="satu-baris">' + e(t.nama) + '</b><small class="satu-baris">' + e(t.penjelasan || t.trx_id) + '</small></span></div>'; } },
            { label: 'Tanggal', f: function (t) { return e(F.tgl(t.tanggal)); } }, { label: 'Kategori', f: function (t) { return '<span class="tag-kecil">' + e(t.kategori) + '</span>'; } },
            { label: 'Nominal', kanan: true, f: function (t) { return '<span class="nominal ' + (t.tipe === 'Pemasukan' ? 'masuk' : 'keluar') + '">' + (t.tipe === 'Pemasukan' ? '+' : '−') + F.rp(t.nominal) + '</span>'; } },
            { label: 'Bukti', f: function (t) { return t.bukti_url ? '<span class="status ok polos">' + ik('struk', 'k') + 'Ada</span>' : '<span class="redup kecil">—</span>'; } },
            { label: 'Dicatat', f: function (t) { return '<span class="kecil">' + e(t.oleh) + '</span>' + (t.status === 'batal' ? ' <span class="status habis polos">Batal</span>' : t.diubah_at ? ' <span class="status netral polos">diubah</span>' : ''); } }
          ] });
        }
        ctx.grafik(function () { Grafik.kolom(ctx.el.querySelector('#g-tren'), { label: d.tren.map(function (x) { return Inti.NAMA_BULAN[Number(x.bulan.slice(5)) - 1].slice(0, 3); }), seri: [{ nama: 'Pemasukan', warna: W.WARNA_GRAFIK.masuk, nilai: d.tren.map(function (x) { return x.masuk; }) }, { nama: 'Pengeluaran', warna: W.WARNA_GRAFIK.keluar, nilai: d.tren.map(function (x) { return x.keluar; }) }], fmt: F.rp, tinggi: 220, ekstra: function (i) { return '<div class="r" style="margin-top:4px;border-top:1px solid #334155;padding-top:4px"><span>Saldo</span><b style="display:inline;margin:0">' + F.rp(d.tren[i].saldo) + '</b></div>'; } }); });
        ctx.on('seg', '.seg', function (s, ev) { st.tab = ev.detail.v; gambar(); });
        ctx.on('change', '[name=bulan]', function (i) { if (i.value) { st.bulan = i.value; R.tampilkan({ diam: true, bingkai: true }); } });
        ctx.on('change', '[data-f=kat]', function (s) { st.kat = s.value; gambar(); });
        ctx.on('input', '[data-f=q]', MR.U.debounce(function (i) { st.q = i.value; gambar(); }, 120));
        ctx.aksi({
          input: function () { formTrx(d, null); },
          buka: function (t) { var x = d.rows.filter(function (y) { return y.trx_id === t.dataset.id; })[0]; if (x) detailTrx(x, d); },
          excel: function () { Xlsx.unduh('Arus_Kas_' + d.bulan, [{ nama: 'Transaksi ' + d.bulan, kolom: ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nama', 'Uraian', 'Nominal', 'Status', 'Dicatat oleh', 'Alasan batal'], baris: saring().slice().reverse().map(function (t) { return [t.trx_id, t.tanggal, t.tipe, t.kategori, t.nama, t.penjelasan, t.tipe === 'Pemasukan' ? t.nominal : -t.nominal, t.status, t.oleh, t.alasan_batal]; }) }, { nama: 'Ringkasan', kolom: ['Keterangan', 'Nilai'], baris: [['Saldo awal', rg.saldo_awal], ['Pemasukan', rg.masuk], ['Pengeluaran', rg.keluar], ['Saldo akhir', rg.saldo_akhir]] }]); },
          pdf: function (b) { MR.UI.kerja(b, function () { return API.Q('laporan.buat', { jenis: 'kas', bulan: d.bulan }, { segar: true }); }).then(unduhPdf).catch(function () { }); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); if (ctx.q.input && d.bolehInput && !st._i) { st._i = 1; formTrx(d, null); } });
      });
    }
  });
  function formTrx(d, t) {
    var ubah = !!t, tipe = t ? t.tipe : 'Pemasukan', bukti = null, owner = Sesi.peran() === 'owner';
    function opsiKat() { return d.kategori.filter(function (k) { return k.tipe === tipe && k.aktif !== 'T'; }).map(function (k) { return '<option value="' + e(k.kategori_id) + '"' + (t && t.kategori_id === k.kategori_id ? ' selected' : '') + '>' + e(k.nama) + '</option>'; }).join(''); }
    var m = MR.UI.modal({ judul: ubah ? 'Ubah transaksi ' + t.trx_id : 'Input transaksi', sub: ubah ? 'Hanya Owner. Nilai lama dan baru tercatat di log audit.' : 'Pendaftaran & perpanjangan sudah tercatat otomatis saat verifikasi.', isi: '<form class="form">' +
      '<div class="fld">' + UI2.seg('tipe', [{ v: 'Pemasukan', label: 'Pemasukan', ikon: 'naik' }, { v: 'Pengeluaran', label: 'Pengeluaran', ikon: 'turun' }], tipe, 'lebar') + '</div>' +
      UI2.fld({ k: 'tanggal', label: 'Tanggal', tipe: 'date', v: t ? t.tanggal : UI2.hariIni(), l: 'l3', attr: ' max="' + UI2.hariIni() + '"' }) +
      '<div class="fld l3" data-k="kategori_id"><label>Kategori <span class="wajib">*</span></label><select class="inp" name="kategori_id"><option value="">— Pilih —</option>' + opsiKat() + '</select><span class="galat"></span></div>' +
      UI2.fld({ k: 'nama', label: 'Nama (pembayar / penerima)', v: t ? t.nama : '', wajib: true }) +
      UI2.fld({ k: 'nominal', label: 'Nominal (Rp)', v: t ? F.ribuan(t.nominal) : '', mode: 'numeric', wajib: true, ph: '0', attr: ' data-rupiah' }) +
      UI2.fld({ k: 'penjelasan', label: 'Uraian', tipe: 'area', baris: 2, v: t ? t.penjelasan : '' }) +
      (ubah ? '' : '<div class="fld" data-k="bukti"><label>Bukti (opsional)</label><input class="inp" type="file" name="bukti_f" accept="image/png,image/jpeg,application/pdf"><span class="galat"></span></div>') +
      (ubah || (d.tertutup && owner) ? UI2.fld({ k: 'alasan', label: ubah ? 'Alasan perubahan' : 'Alasan (bulan sudah ditutup)', tipe: 'area', baris: 2, wajib: true }) : '') + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + (ubah ? 'Simpan perubahan' : 'Simpan transaksi') + '</button>' });
    var f = m.el.querySelector('form');
    UI2.hidupkanSeg(m.el); m.el.addEventListener('seg', function (ev) { tipe = ev.detail.v; f.kategori_id.innerHTML = '<option value="">— Pilih —</option>' + opsiKat(); });
    f.nominal.addEventListener('input', function () { var n = f.nominal.value.replace(/\D/g, ''); f.nominal.value = n ? F.ribuan(Number(n)) : ''; });
    if (f.bukti_f) f.bukti_f.addEventListener('change', function () { UI2.bacaBerkas(f.bukti_f.files[0]).then(function (b) { bukti = b; }, function (er) { MR.UI.tandaiGalat(f, { bukti: er.message }); }); });
    m.el.querySelector('[data-ok]').onclick = function () {
      var v = UI2.baca(f), trx = { tipe: tipe, tanggal: v.tanggal, kategori_id: v.kategori_id, nama: v.nama, nominal: Number(String(v.nominal).replace(/\D/g, '')), penjelasan: v.penjelasan };
      var aksi = ubah ? ['kas.ubah', { trx_id: t.trx_id, trx: trx, alasan: v.alasan }] : ['kas.input', { trx: trx, alasan: v.alasan, bukti: bukti ? { nama: bukti.nama, mime: bukti.mime, base64: bukti.base64 } : null }];
      MR.UI.kerja(this, function () { return API.T(aksi[0], aksi[1]); }, { form: f }).then(function (r) { m.tutup(); MR.UI.tutupSemua(); MR.UI.toast((ubah ? 'Transaksi diperbarui · ' : 'Tersimpan · ') + r.trx_id, 'ok'); R.muatUlang(); }).catch(function () { });
    };
  }
  function detailTrx(t, d) {
    var owner = d.bolehUbah;
    var m = MR.UI.laci({ judul: t.nama, sub: e(t.trx_id) + ' · ' + e(F.tglPanjang(t.tanggal)), isi:
      '<div class="kartu pad tengah" style="background:' + (t.tipe === 'Pemasukan' ? '#F0FDF4' : '#FEF2F2') + '"><div class="kecil redup">' + e(t.tipe) + ' · ' + e(t.kategori) + '</div><div class="kpi-nilai mt8 ' + (t.tipe === 'Pemasukan' ? 'teks-ok' : 'teks-bahaya') + '">' + (t.tipe === 'Pemasukan' ? '+' : '−') + F.rp(t.nominal) + '</div><div class="kecil redup mt8">' + e(Inti.de.terbilang(t.nominal)) + ' rupiah</div></div>' +
      (t.status === 'batal' ? '<div class="peringatan bahaya mt12">' + ik('xBulat') + '<div><b>Dibatalkan</b>' + e(t.alasan_batal) + '</div></div>' : '') +
      '<div class="grid g2 mt16">' + [['Uraian', t.penjelasan || '-'], ['Paket terkait', t.enr_id || '-'], ['Dicatat oleh', t.oleh + ' · ' + F.waktu(t.dibuat_at)], ['Diubah', t.diubah_at ? F.waktu(t.diubah_at) : '-']].map(function (x) { return '<div><div class="kecil redup">' + x[0] + '</div><b class="kecil putus">' + e(x[1]) + '</b></div>'; }).join('') + '</div>' +
      '<div id="bukti-trx" class="mt16">' + (t.bukti_url ? UI2.muatSebaris('Memuat bukti…') : '') + '</div>',
      kaki: (owner && t.status !== 'batal' ? '<button type="button" class="btn bahaya" data-x="batal">Batalkan</button><button type="button" class="btn primer" data-x="ubah">' + ik('pensil', 'k') + 'Ubah</button>' : '<button type="button" class="btn" data-tutup>Tutup</button>') });
    if (t.bukti_url) API.berkas(t.bukti_url).then(function (u) { var w = m.el.querySelector('#bukti-trx'); if (w) w.innerHTML = '<div class="kecil redup">Bukti</div>' + (/pdf/.test(u) ? '<a class="btn kecil mt8" href="' + e(u) + '" target="_blank" rel="noopener">Buka PDF</a>' : '<img src="' + e(u) + '" alt="Bukti" style="width:100%;border-radius:12px;margin-top:6px;border:1px solid var(--garis)">'); }).catch(function () { });
    m.on('click', '[data-x=ubah]', function () { formTrx(d, t); });
    m.on('click', '[data-x=batal]', function () { UI2.mintaTeks({ judul: 'Batalkan transaksi?', pesan: 'Transaksi tidak dihapus — ditandai batal dan tidak dihitung di saldo.', label: 'Alasan pembatalan', ok: 'Batalkan transaksi', bahaya: true }).then(function (al) { if (al) API.T('kas.batal', { trx_id: t.trx_id, alasan: al }).then(function () { m.tutup(); MR.UI.toast('Transaksi dibatalkan.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); }); });
  }

  /* ================= Honor pelatih ================= */
  R.daftar('honor', {
    judul: 'Honor Pelatih', kerangka: 'dashboard', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.bulan = st.bulan || UI2.bulanIni();
      return API.Q('honor.rekap', { bulan: st.bulan }).then(function (d) {
        if (ctx.basi()) return;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Rekap Honor Pelatih</h1><p>Dihitung otomatis dari absensi yang dihitung × tarif per kategori sesi (tarif khusus pelatih diutamakan).</p></div><div class="aksi">' + UI2.pilihBulan(st.bulan) +
          (Sesi.punya('laporan.ekspor') ? '<button type="button" class="btn" data-a="excel">' + ik('unduh') + 'Excel</button><button type="button" class="btn" data-a="pdf">' + ik('cetak') + 'PDF</button>' : '') +
          '</div></div>' +
          (d.tertutup ? '<div class="peringatan info">' + ik('gembok') + '<div><b>Bulan sudah ditutup</b>Rekap ini terkunci dan sesuai ringkasan tutup bulan.</div></div>' : '') +
          '<div class="grid g4 kpi-baris stagger mt16">' + UI2.kpi({ i: 0, label: 'Total honor', nilai: F.rpR(d.total), rp: true, ikon: 'koin', warna: 'hijau' }) + UI2.kpi({ i: 1, label: 'Sesi dihitung', nilai: d.total_sesi, ikon: 'absen' }) + UI2.kpi({ i: 2, label: 'Pelatih bertugas', nilai: d.pelatih.length, ikon: 'peluit', warna: 'ungu' }) + UI2.kpi({ i: 3, label: 'Rata-rata per pelatih', nilai: F.rpR(d.pelatih.length ? d.total / d.pelatih.length : 0), rp: true, ikon: 'orang' }) + '</div>' +
          (d.bolehTarif ? '<p class="kecil redup mt12">' + ik('info', 'k') + ' Ubah tarif di <a href="#/harga">Harga, Tarif & Aturan</a>. Perubahan berlaku sesuai tanggal mulai, bukan mundur.</p>' : '') +
          (d.pelatih.length ? '<div class="grid g2 mt16 stagger">' + d.pelatih.map(function (p, i) {
            return '<div class="kartu pad klik" data-a="buka" data-id="' + e(p.coach_id) + '" tabindex="0" role="button" style="--i:' + i + '"><div class="baris">' + UI2.avatar(p.nama) + '<div class="tumpuk tumbuh"><b>' + e(p.nama) + '</b><span class="kecil redup">' + e(p.lisensi || 'Tanpa lisensi') + ' · ' + p.total_sesi + ' sesi</span></div><b class="nominal" style="font:800 18px var(--f-judul)">' + F.rp(p.total) + '</b></div>' +
              '<div class="tumpuk mt12" style="gap:6px">' + p.kategori.map(function (k) { return '<div class="baris ujung kecil"><span class="baris" style="gap:6px">' + UI2.lencana(k.kategori) + (k.khusus ? '<span class="status ungu polos">Tarif khusus</span>' : '') + '</span><span class="angka">' + k.sesi + ' × ' + F.rp(k.tarif) + ' = <b>' + F.rp(k.subtotal) + '</b></span></div>'; }).join('') + '</div></div>';
          }).join('') + '</div>' : '<div class="kartu pad mt16">' + MR.UI.kosong('Belum ada sesi dihitung', 'Rekap muncul setelah pelatih mengisi absensi.') + '</div>');
        ctx.on('change', '[name=bulan]', function (i) { if (i.value) { st.bulan = i.value; R.tampilkan({ diam: true, bingkai: true }); } });
        ctx.aksi({
          buka: function (t) { var p = d.pelatih.filter(function (x) { return x.coach_id === t.dataset.id; })[0]; if (p) rincianHonor(p, d); },
          excel: function () { Xlsx.unduh('Honor_Pelatih_' + d.bulan, [{ nama: 'Rekap', kolom: ['Pelatih', 'Lisensi', 'Sesi', 'Total'], baris: d.pelatih.map(function (p) { return [p.nama, p.lisensi, p.total_sesi, p.total]; }) }, { nama: 'Rincian', kolom: ['Pelatih', 'Tanggal', 'Kategori', 'Kolam', 'Peserta', 'Tarif', 'Sesi lebih'], baris: [].concat.apply([], d.pelatih.map(function (p) { return p.rincian.map(function (r) { return [p.nama, r.tanggal, r.kategori, r.kolam, r.peserta, r.tarif, r.sesi_lebih ? 'Ya' : '']; }); })) }]); },
          pdf: function (b) { MR.UI.kerja(b, function () { return API.Q('laporan.buat', { jenis: 'honor', bulan: d.bulan }, { segar: true }); }).then(unduhPdf).catch(function () { }); },
        });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });
  function rincianHonor(p, d) {
    var m = MR.UI.laci({ lebar: true, judul: p.nama, sub: 'Rincian honor ' + e(F.bulan(d.bulan)) + ' · ' + p.total_sesi + ' sesi · ' + F.rp(p.total), isi:
      UI2.tabel({ baris: p.rincian, kolom: [{ label: 'Tanggal', f: function (r) { return e(F.tglHari(r.tanggal)); } }, { label: 'Kategori', f: function (r) { return UI2.lencana(r.kategori) + (r.sesi_lebih ? ' <span class="status warn polos">lebih</span>' : ''); } }, { label: 'Peserta', k: 'peserta' }, { label: 'Kolam', k: 'kolam' }, { label: 'Tarif', kanan: true, f: function (r) { return '<span class="nominal">' + F.rp(r.tarif) + '</span>'; } }] }),
      kaki: '<button type="button" class="btn" data-tutup>Tutup</button>' });
  }

  /* ================= Tutup bulan ================= */
  R.daftar('tutup-bulan', {
    judul: 'Tutup Bulan', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      return API.Q('tutup.list').then(function (d) {
        if (ctx.basi()) return;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Tutup Bulan</h1><p>Setelah ditutup, transaksi kas dan koreksi absensi bulan tersebut hanya bisa diubah Owner dengan alasan. Ringkasan kas & honor disimpan sebagai arsip.</p></div></div>' +
          '<div class="grid g3 stagger">' + d.rows.map(function (r, i) {
            return '<div class="kartu pad" style="--i:' + i + '"><div class="baris ujung"><b style="font:700 16px var(--f-judul)">' + e(r.nama) + '</b>' + (r.tertutup ? '<span class="status ok">' + ik('gembok', 'k') + 'Ditutup</span>' : r.bisaTutup ? '<span class="status warn">Belum ditutup</span>' : '<span class="status info">Berjalan</span>') + '</div>' +
              '<div class="tumpuk mt12 kecil" style="gap:6px"><div class="baris ujung"><span class="redup">Pemasukan</span><b class="nominal masuk">' + F.rp(r.kas.masuk) + '</b></div><div class="baris ujung"><span class="redup">Pengeluaran</span><b class="nominal keluar">' + F.rp(r.kas.keluar) + '</b></div><div class="baris ujung"><span class="redup">Saldo</span><b class="nominal">' + F.rp(r.kas.saldo) + '</b></div>' +
              (r.ringkasan ? '<div class="baris ujung"><span class="redup">Honor (' + r.ringkasan.sesi + ' sesi)</span><b class="nominal">' + F.rp(r.ringkasan.honor_total) + '</b></div>' : '') + '</div>' +
              (r.tertutup ? '<p class="kecil redup mt12">Oleh ' + e(r.ditutup_oleh) + ' · ' + e(F.waktu(r.waktu)) + '</p>' : r.bisaTutup && d.boleh ? '<button type="button" class="btn primer lebar mt12" data-a="tutup" data-p="' + e(r.periode) + '">' + ik('gembok', 'k') + 'Tutup ' + e(r.nama) + '</button>' : '') + '</div>';
          }).join('') + '</div>';
        ctx.aksi({ tutup: function (b) {
          var r = d.rows.filter(function (x) { return x.periode === b.dataset.p; })[0];
          MR.UI.konfirmasi({ judul: 'Tutup ' + r.nama + '?', pesan: 'Saldo bulan ini ' + F.rp(r.kas.saldo) + '. Setelah ditutup, perubahan hanya oleh Owner dengan alasan. Tindakan ini tidak bisa dibatalkan.', ok: 'Tutup bulan' }).then(function (y) {
            if (y) MR.UI.kerja(b, function () { return API.T('tutup.tutup', { periode: r.periode }); }).then(function () { MR.UI.toast(r.nama + ' ditutup.', 'ok'); R.muatUlang(); }).catch(function () { });
          });
        } });
      });
    }
  });

})(window, document);
