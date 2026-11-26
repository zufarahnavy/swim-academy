/* =====================================================================
 * ARUS KAS, HONOR PELATIH, TUTUP BULAN, DOKUMEN (kwitansi · slip · laporan · sertifikat)
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
    var owner = d.bolehUbah, bisaDok = Sesi.punya('dokumen.kelola') && t.tipe === 'Pemasukan' && t.status !== 'batal';
    var m = MR.UI.laci({ judul: t.nama, sub: e(t.trx_id) + ' · ' + e(F.tglPanjang(t.tanggal)), isi:
      '<div class="kartu pad tengah" style="background:' + (t.tipe === 'Pemasukan' ? '#F0FDF4' : '#FEF2F2') + '"><div class="kecil redup">' + e(t.tipe) + ' · ' + e(t.kategori) + '</div><div class="kpi-nilai mt8 ' + (t.tipe === 'Pemasukan' ? 'teks-ok' : 'teks-bahaya') + '">' + (t.tipe === 'Pemasukan' ? '+' : '−') + F.rp(t.nominal) + '</div><div class="kecil redup mt8">' + e(Inti.de.terbilang(t.nominal)) + ' rupiah</div></div>' +
      (t.status === 'batal' ? '<div class="peringatan bahaya mt12">' + ik('xBulat') + '<div><b>Dibatalkan</b>' + e(t.alasan_batal) + '</div></div>' : '') +
      '<div class="grid g2 mt16">' + [['Uraian', t.penjelasan || '-'], ['Paket terkait', t.enr_id || '-'], ['Dicatat oleh', t.oleh + ' · ' + F.waktu(t.dibuat_at)], ['Diubah', t.diubah_at ? F.waktu(t.diubah_at) : '-']].map(function (x) { return '<div><div class="kecil redup">' + x[0] + '</div><b class="kecil putus">' + e(x[1]) + '</b></div>'; }).join('') + '</div>' +
      '<div id="bukti-trx" class="mt16">' + (t.bukti_url ? UI2.muatSebaris('Memuat bukti…') : '') + '</div>',
      kaki: (bisaDok ? '<button type="button" class="btn" data-x="kwitansi">' + ik('struk', 'k') + 'Kwitansi</button>' : '') + (owner && t.status !== 'batal' ? '<button type="button" class="btn bahaya" data-x="batal">Batalkan</button><button type="button" class="btn primer" data-x="ubah">' + ik('pensil', 'k') + 'Ubah</button>' : '<button type="button" class="btn" data-tutup>Tutup</button>') });
    if (t.bukti_url) API.berkas(t.bukti_url).then(function (u) { var w = m.el.querySelector('#bukti-trx'); if (w) w.innerHTML = '<div class="kecil redup">Bukti</div>' + (/pdf/.test(u) ? '<a class="btn kecil mt8" href="' + e(u) + '" target="_blank" rel="noopener">Buka PDF</a>' : '<img src="' + e(u) + '" alt="Bukti" style="width:100%;border-radius:12px;margin-top:6px;border:1px solid var(--garis)">'); }).catch(function () { });
    m.on('click', '[data-x=ubah]', function () { formTrx(d, t); });
    m.on('click', '[data-x=batal]', function () { UI2.mintaTeks({ judul: 'Batalkan transaksi?', pesan: 'Transaksi tidak dihapus — ditandai batal dan tidak dihitung di saldo.', label: 'Alasan pembatalan', ok: 'Batalkan transaksi', bahaya: true }).then(function (al) { if (al) API.T('kas.batal', { trx_id: t.trx_id, alasan: al }).then(function () { m.tutup(); MR.UI.toast('Transaksi dibatalkan.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); }); });
    m.on('click', '[data-x=kwitansi]', function (b) { MR.UI.kerja(b, function () { return API.T('dok.buat', { jenis: 'KWITANSI', ref: { trx_id: t.trx_id } }); }).then(function (r) { m.tutup(); W.detailDokumen(r.dokumen[0].id); }).catch(function () { }); });
  }

  /* ================= Honor pelatih ================= */
  R.daftar('honor', {
    judul: 'Honor Pelatih', kerangka: 'dashboard', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.bulan = st.bulan || UI2.bulanIni();
      return API.Q('honor.rekap', { bulan: st.bulan }).then(function (d) {
        if (ctx.basi()) return;
        var bisaDok = Sesi.punya('dokumen.kelola');
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Rekap Honor Pelatih</h1><p>Dihitung otomatis dari absensi yang dihitung × tarif per kategori sesi (tarif khusus pelatih diutamakan).</p></div><div class="aksi">' + UI2.pilihBulan(st.bulan) +
          (Sesi.punya('laporan.ekspor') ? '<button type="button" class="btn" data-a="excel">' + ik('unduh') + 'Excel</button><button type="button" class="btn" data-a="pdf">' + ik('cetak') + 'PDF</button>' : '') +
          (bisaDok && d.pelatih.length ? '<button type="button" class="btn primer" data-a="slipSemua">' + ik('struk') + 'Slip semua</button>' : '') + '</div></div>' +
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
          slipSemua: function (b) { MR.UI.kerja(b, function () { return API.T('dok.buat', { jenis: 'SLIP_HONOR', refs: d.pelatih.map(function (p) { return { coach_id: p.coach_id, bulan: d.bulan }; }) }); }).then(function (r) { MR.UI.toast(r.dokumen.length + ' slip honor dibuat · menunggu persetujuan Owner.', 'ok', { aksi: { label: 'Lihat', fn: function () { location.hash = '#/dokumen'; } } }); }).catch(function () { }); }
        });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });
  function rincianHonor(p, d) {
    var m = MR.UI.laci({ lebar: true, judul: p.nama, sub: 'Rincian honor ' + e(F.bulan(d.bulan)) + ' · ' + p.total_sesi + ' sesi · ' + F.rp(p.total), isi:
      UI2.tabel({ baris: p.rincian, kolom: [{ label: 'Tanggal', f: function (r) { return e(F.tglHari(r.tanggal)); } }, { label: 'Kategori', f: function (r) { return UI2.lencana(r.kategori) + (r.sesi_lebih ? ' <span class="status warn polos">lebih</span>' : ''); } }, { label: 'Peserta', k: 'peserta' }, { label: 'Kolam', k: 'kolam' }, { label: 'Tarif', kanan: true, f: function (r) { return '<span class="nominal">' + F.rp(r.tarif) + '</span>'; } }] }),
      kaki: Sesi.punya('dokumen.kelola') ? '<button type="button" class="btn primer" data-x="slip">' + ik('struk', 'k') + 'Buat slip honor</button>' : '<button type="button" class="btn" data-tutup>Tutup</button>' });
    m.on('click', '[data-x=slip]', function (b) { MR.UI.kerja(b, function () { return API.T('dok.buat', { jenis: 'SLIP_HONOR', ref: { coach_id: p.coach_id, bulan: d.bulan } }); }).then(function (r) { m.tutup(); W.detailDokumen(r.dokumen[0].id); }).catch(function () { }); });
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

  /* ================= Dokumen ================= */
  var NAMA_ST = { MENUNGGU_TTD: 'Menunggu TTD', TERBIT: 'Terbit', DITARIK: 'Ditarik', DRAF: 'Draf' };
  R.daftar('dokumen', {
    judul: 'Dokumen', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st; st.status = st.status || '';
      return API.Q('dok.ambil').then(function (d) {
        if (ctx.basi()) return;
        var owner = d.owner, pj = d.pejabat;
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>Dokumen Resmi</h1><p>Kwitansi, slip honor, laporan kas, dan sertifikat — bernomor otomatis, ber-QR verifikasi, disetujui Owner dengan PIN.</p></div><div class="aksi">' + '<button type="button" class="btn primer" data-a="buat" data-kunci="n">' + ik('plus') + 'Buat dokumen</button></div></div>' +
          (d.menunggu ? '<div class="peringatan warn">' + ik('jam') + '<div class="tumbuh"><b>' + d.menunggu + ' dokumen menunggu persetujuan Owner</b>' + (owner ? 'Setujui sekaligus dengan PIN tanda tangan Anda.' : 'Owner akan menyetujui dengan PIN.') + '</div>' + (owner ? '<button type="button" class="btn kecil primer" data-a="setujui">' + ik('cekBulat', 'k') + 'Setujui</button>' : '') + '</div>' : '') +
          '<div class="grid g4 kpi-baris stagger mt16">' + d.jenis.map(function (j, i) { return '<div class="kartu pad" style="--i:' + i + '"><div class="baris"><span class="ubin ' + ['', 'ungu', 'hijau', 'oranye'][i] + '">' + ik(['struk', 'koin', 'grafik', 'piala'][i]) + '</span><div class="tumpuk tumbuh" style="min-width:0"><b class="kecil">' + e(j.nama) + '</b><span class="kecil redup">' + (j.ada ? 'Template v' + j.versi + ' · ' + (j.aktif ? 'aktif' : 'nonaktif') : 'Pratinjau bawaan') + '</span></div></div><div class="baris bungkus mt12" style="gap:6px"><span class="tag-kecil">Google ' + ({ docs: 'Docs', sheets: 'Sheets', slides: 'Slides' }[j.engine]) + '</span>' + (j.wajibSetuju ? '<span class="tag-kecil kunci">' + ik('kunci', 'k') + 'Perlu PIN Owner</span>' : '<span class="tag-kecil">Terbit otomatis</span>') + '</div>' + (owner && j.ada ? '<button type="button" class="btn kecil hantu mt8" data-a="template" data-k="' + j.kode + '">' + ik('slider', 'k') + 'Atur</button>' : '') + '</div>'; }).join('') + '</div>' +
          (owner ? '<div class="kartu pad mt16 baris bungkus"><span class="ubin">' + ik('kunci') + '</span><div class="tumpuk tumbuh"><b class="kecil">Penandatangan: ' + e(pj.nama) + ' · ' + e(pj.jabatan) + '</b><span class="kecil redup">' + (pj.pin_ada ? 'PIN tanda tangan sudah diatur.' : 'PIN tanda tangan belum diatur — wajib sebelum menyetujui dokumen.') + '</span></div><button type="button" class="btn kecil" data-a="pin">' + (pj.pin_ada ? 'Ubah PIN' : 'Atur PIN') + '</button>' + (API.mode === 'live' ? '<button type="button" class="btn kecil" data-a="bawaan">' + ik('dokumen', 'k') + 'Buat template bawaan</button>' : '') + '</div>' : '') +
          '<section class="kartu mt16"><div class="pad" style="padding:14px 16px"><div class="baris bungkus" style="gap:10px">' + UI2.seg('status', [{ v: '', label: 'Semua' }, { v: 'MENUNGGU_TTD', label: 'Menunggu', n: d.menunggu }, { v: 'TERBIT', label: 'Terbit' }, { v: 'DITARIK', label: 'Ditarik' }], st.status) + '<span class="tumbuh"></span><select class="inp" data-f="jenis" style="width:auto"><option value="">Semua jenis</option>' + d.jenis.map(function (j) { return '<option value="' + j.kode + '"' + (st.jenis === j.kode ? ' selected' : '') + '>' + e(j.nama) + '</option>'; }).join('') + '</select></div></div><div id="dok-isi"></div></section>';
        function gambar() {
          ctx.el.querySelector('#dok-isi').innerHTML = UI2.tabel({ klik: 'buka', id: 'id', baris: d.dokumen.filter(function (x) { return (!st.status || x.status === st.status) && (!st.jenis || x.jenis === st.jenis); }), kosong: 'Belum ada dokumen', kolom: [
            { label: 'Dokumen', f: function (x) { return '<div class="sel-utama"><span class="ubin" style="width:34px;height:34px">' + ik({ KWITANSI: 'struk', SLIP_HONOR: 'koin', LAPORAN_KAS: 'grafik', SERTIFIKAT: 'piala' }[x.jenis], 'k') + '</span><span class="tumpuk" style="min-width:0"><b class="satu-baris">' + e(x.judul) + '</b><small>' + e(x.nama_jenis) + '</small></span></div>'; } },
            { label: 'Nomor', f: function (x) { return x.nomor ? '<code class="kecil">' + e(x.nomor) + '</code>' : '<span class="redup kecil">belum bernomor</span>'; } },
            { label: 'Status', f: function (x) { return UI2.status(x.status); } }, { label: 'Dibuat', f: function (x) { return e(F.waktu(x.dibuat)) + '<br><small class="redup">' + e(x.oleh) + '</small>'; } }
          ] });
        }
        ctx.on('seg', '.seg', function (s, ev) { st.status = ev.detail.v; gambar(); });
        ctx.on('change', '[data-f=jenis]', function (s) { st.jenis = s.value; gambar(); });
        ctx.aksi({
          buka: function (t) { W.detailDokumen(t.dataset.id); },
          buat: function () { formDokumen(d); },
          setujui: function () { setujuiDokumen(d.dokumen.filter(function (x) { return x.status === 'MENUNGGU_TTD'; })); },
          pin: function () { aturPin(pj); },
          bawaan: function (b) { MR.UI.kerja(b, function () { return API.T('dok.templateBawaan', {}); }).then(function (r) { MR.UI.toast(r.template.length + ' template bawaan dibuat di Google Drive.', 'ok'); R.muatUlang(); }).catch(function () { }); },
          template: function (b) { aturTemplate(d.jenis.filter(function (j) { return j.kode === b.dataset.k; })[0]); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); if (ctx.q.id && st._id !== ctx.q.id) { st._id = ctx.q.id; W.detailDokumen(ctx.q.id); } });
      });
    }
  });
  function formDokumen(d) {
    var jenis = d.jenis.filter(function (j) { return j.boleh; }), sm = d.sumber;
    var m = MR.UI.modal({ judul: 'Buat dokumen', sub: 'Data diisi otomatis dari sistem; nomor & QR terbit saat disetujui.', isi: '<form class="form">' +
      UI2.fld({ k: 'jenis', label: 'Jenis dokumen', tipe: 'select', opsi: jenis.map(function (j) { return { v: j.kode, l: j.nama }; }), kosong: false }) +
      '<div class="fld" data-k="trx_id" data-j="KWITANSI"><label>Transaksi pemasukan</label><select class="inp" name="trx_id">' + sm.trx.map(function (t) { return '<option value="' + e(t.trx_id) + '">' + e(t.label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="fld" data-k="coach_id" data-j="SLIP_HONOR"><label>Pelatih</label><select class="inp" name="coach_id"><option value="*">Semua pelatih (massal)</option>' + sm.pelatih.map(function (c) { return '<option value="' + e(c.coach_id) + '">' + e(c.nama) + '</option>'; }).join('') + '</select></div>' +
      '<div class="fld" data-k="bulan" data-j="SLIP_HONOR LAPORAN_KAS"><label>Periode</label><input class="inp" type="month" name="bulan" value="' + Inti.util.geserBulan(UI2.bulanIni(), -1) + '" max="' + UI2.bulanIni() + '"></div>' +
      '<div class="fld" data-k="enr_id" data-j="SERTIFIKAT"><label>Paket siswa</label><select class="inp" name="enr_id">' + sm.enr.map(function (x) { return '<option value="' + e(x.enr_id) + '">' + e(x.label) + '</option>'; }).join('') + '</select></div>' +
      '<div class="fld" data-k="siswa_id" data-j="SERTIFIKAT"><label>Peserta</label><select class="inp" name="siswa_id"></select></div></form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Buat dokumen</button>' });
    var f = m.el.querySelector('form');
    function sesuaikan() { var j = f.jenis.value; MR.qsa('[data-j]', f).forEach(function (x) { x.hidden = x.dataset.j.split(' ').indexOf(j) < 0; }); var e0 = sm.enr.filter(function (x) { return x.enr_id === f.enr_id.value; })[0]; f.siswa_id.innerHTML = (e0 ? e0.peserta : []).map(function (p) { return '<option value="' + e(p.siswa_id) + '">' + e(p.nama) + '</option>'; }).join(''); }
    f.addEventListener('change', sesuaikan); sesuaikan();
    m.el.querySelector('[data-ok]').onclick = function () {
      var v = UI2.baca(f), muatan = { jenis: v.jenis };
      if (v.jenis === 'KWITANSI') muatan.ref = { trx_id: v.trx_id };
      if (v.jenis === 'LAPORAN_KAS') muatan.ref = { bulan: v.bulan };
      if (v.jenis === 'SERTIFIKAT') muatan.ref = { enr_id: v.enr_id, siswa_id: v.siswa_id };
      if (v.jenis === 'SLIP_HONOR') { if (v.coach_id === '*') muatan.refs = sm.pelatih.map(function (c) { return { coach_id: c.coach_id, bulan: v.bulan }; }); else muatan.ref = { coach_id: v.coach_id, bulan: v.bulan }; }
      var p = MR.UI.proses('Menyusun dokumen', ['Mengambil data', 'Mengisi template', 'Menyimpan']);
      setTimeout(function () { p.langkah(1); }, 200); setTimeout(function () { p.langkah(2); }, 450);
      MR.UI.kerja(this, function () { return API.T('dok.buat', muatan); }).then(function (r) { p.selesai(); m.tutup(); MR.UI.toast(r.dokumen.length + ' dokumen dibuat.', 'ok'); R.muatUlang(); if (r.dokumen.length === 1) setTimeout(function () { W.detailDokumen(r.dokumen[0].id); }, 350); }, function () { p.gagal(); });
    };
  }
  function aturPin(pj) {
    var m = MR.UI.modal({ judul: 'PIN tanda tangan Owner', sempit: true, sub: 'PIN 6 angka dipakai saat menyetujui dokumen. Konfirmasi dengan sandi login.', isi: '<form class="form">' + UI2.fld({ k: 'nama', label: 'Nama penandatangan', v: pj.nama }) + UI2.fld({ k: 'jabatan', label: 'Jabatan', v: pj.jabatan }) + UI2.fld({ k: 'sandi', label: 'Sandi login', tipe: 'password', wajib: true }) + '<div class="fld" data-k="pin"><label>PIN baru (6 angka)</label><div class="pin-kotak">' + [0, 1, 2, 3, 4, 5].map(function () { return '<input inputmode="numeric" maxlength="1" autocomplete="off">'; }).join('') + '</div><span class="galat"></span></div></form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan PIN</button>' });
    W.pasangPin(m.el);
    m.el.querySelector('[data-ok]').onclick = function () { var f = m.el.querySelector('form'), v = UI2.baca(f); v.pin = MR.qsa('.pin-kotak input', f).map(function (x) { return x.value; }).join(''); MR.UI.kerja(this, function () { return API.T('dok.aturPin', v); }, { form: f }).then(function () { m.tutup(); MR.UI.toast('PIN tanda tangan tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { }); };
  }
  function setujuiDokumen(list) {
    var m = MR.UI.modal({ judul: 'Setujui & terbitkan', sub: 'Dokumen terpilih mendapat nomor resmi, QR verifikasi, dan tanda tangan elektronik.', isi:
      '<div class="daftar-ikon">' + list.map(function (x) { return '<label class="item-ikon"><input type="checkbox" checked value="' + e(x.id) + '" style="width:18px;height:18px;accent-color:var(--merek)"><div class="tumbuh" style="min-width:0"><b class="kecil satu-baris">' + e(x.judul) + '</b><div class="kecil redup">' + e(x.nama_jenis) + '</div></div></label>'; }).join('') + '</div>' +
      '<div class="fld mt16" data-k="pin"><label class="tengah">PIN tanda tangan</label><div class="pin-kotak">' + [0, 1, 2, 3, 4, 5].map(function () { return '<input inputmode="numeric" maxlength="1" type="password" autocomplete="off">'; }).join('') + '</div><span class="galat tengah"></span></div>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + ik('cekBulat', 'k') + 'Setujui</button>' });
    W.pasangPin(m.el);
    m.el.querySelector('[data-ok]').onclick = function () {
      var ids = MR.qsa('input[type=checkbox]:checked', m.el).map(function (x) { return x.value; }), pin = MR.qsa('.pin-kotak input', m.el).map(function (x) { return x.value; }).join('');
      if (!ids.length) return MR.UI.toast('Pilih minimal satu dokumen.', 'warn');
      MR.UI.kerja(this, function () { return API.T('dok.setujui', { ids: ids, pin: pin }); }, { form: m.el }).then(function (r) { m.tutup(); MR.UI.toast(r.dokumen.length + ' dokumen terbit: ' + r.dokumen.map(function (x) { return x.nomor; }).join(', '), 'ok', { durasi: 7000 }); R.muatUlang(); })
        .catch(function (er) { if (er && er.code === 'NO_PIN') { m.tutup(); aturPin({ nama: Sesi.me.nama, jabatan: 'Owner' }); } });
    };
  }
  function aturTemplate(j) {
    var m = MR.UI.modal({ judul: 'Template ' + j.nama, sempit: true, isi: '<form class="form"><div class="fld"><label class="saklar"><input type="checkbox" name="aktif"' + (j.aktif ? ' checked' : '') + '><i></i><span>Template aktif</span></label></div><div class="fld"><label class="saklar"><input type="checkbox" name="wajibSetuju"' + (j.wajibSetuju ? ' checked' : '') + '><i></i><span>Wajib persetujuan PIN Owner</span></label></div>' +
      '<div class="fld"><span class="bantu">Bidang terdeteksi: ' + e((j.bidang || []).map(function (b) { return b.kunci; }).join(', ') || '-') + '</span></div>' + UI2.fld({ k: 'url', label: 'Pindai ulang dari URL Google Docs/Sheets/Slides', ph: 'https://docs.google.com/…' }) + '</form>',
      kaki: '<button type="button" class="btn" data-x="pindai">' + ik('segar', 'k') + 'Pindai</button><button type="button" class="btn primer" data-x="simpan">Simpan</button>' });
    var f = m.el.querySelector('form');
    m.on('click', '[data-x=simpan]', function (b) { var v = UI2.baca(f); MR.UI.kerja(b, function () { return API.T('dok.templateAtur', { kode: j.kode, aktif: v.aktif, wajibSetuju: v.wajibSetuju }); }).then(function () { m.tutup(); MR.UI.toast('Template diperbarui.', 'ok'); R.muatUlang(); }).catch(function () { }); });
    m.on('click', '[data-x=pindai]', function (b) { MR.UI.kerja(b, function () { return API.T('dok.templatePindai', { kode: j.kode, url: f.url.value }); }, { form: f }).then(function (r) { MR.UI.toast('Template v' + r.versi + ' · ' + r.bidang.length + ' bidang.', 'ok'); m.tutup(); R.muatUlang(); }).catch(function () { }); });
  }

  /* Pratinjau dokumen (kertas) — sama dengan isi template bawaan */
  function htmlKertas(o) {
    var x = o.isian, ttd = o.penandatangan[0], terbit = o.status === 'TERBIT', url = location.href.split('#')[0] + '#/v/' + o.kode_verifikasi;
    var kop = '<div class="kop"><div class="baris" style="gap:12px"><img src="' + e(MR.logo) + '" alt="" style="width:44px;height:44px"><div><h3>' + e(x.INSTITUSI_NAMA) + '</h3><div style="color:#475569;font-size:11.5px">' + e(x.INSTITUSI_ALAMAT || 'Sekolah renang') + (x.INSTITUSI_KONTAK ? ' · WA ' + e(x.INSTITUSI_KONTAK) : '') + '</div></div></div><div style="text-align:right"><b style="font:800 15px var(--f-judul);letter-spacing:.08em;color:#1E2A4A">' + e(o.nama_jenis.toUpperCase()) + '</b><div style="font-size:12px;color:#475569">' + (o.nomor ? 'No. ' + e(o.nomor) : '<span style="color:#B45309;font-weight:700">DRAF — belum bernomor</span>') + '</div></div></div>';
    var kakiTtd = '<div class="ttd"><div class="qr">' + (terbit ? UI2.qr(url) + '<div style="font-size:10px;color:#64748B;margin-top:4px;max-width:140px">Pindai untuk cek keaslian · ' + e(o.kode_verifikasi) + '</div>' : '<div style="width:96px;height:96px;border:1.5px dashed #CBD5E1;border-radius:8px;display:grid;place-items:center;font-size:10px;color:#94A3B8;text-align:center">QR terbit<br>setelah disetujui</div>') + '</div>' +
      '<div style="text-align:center;min-width:190px"><div style="font-size:12px;color:#475569">' + e(F.tglPanjang((o.terbit || o.dibuat || '').slice(0, 10))) + '</div><div style="height:54px;display:grid;place-items:center">' + (terbit ? '<span style="font:italic 600 20px Georgia,serif;color:#075985">' + e(ttd ? ttd.nama : '') + '</span>' : '') + '</div><b style="border-top:1px solid #1E293B;padding-top:4px;display:block">' + e(ttd ? ttd.nama : 'Owner') + '</b><div style="font-size:11.5px;color:#475569">' + e(ttd ? ttd.jabatan : 'Owner') + (ttd ? ' · ' + e(ttd.metode) : '') + '</div></div></div>';
    if (o.jenis === 'KWITANSI') return '<div class="kertas">' + kop + '<table><tbody>' + [['Telah terima dari', x.NAMA_PEMBAYAR], ['Uang sejumlah', '<i>' + e(Inti.de.terbilang(x.NOMINAL)) + ' rupiah</i>'], ['Untuk pembayaran', x.PERUNTUKAN], ['Peserta', x.PESERTA], ['Paket', x.PAKET + ' (' + x.KATEGORI + ')'], ['Metode', x.METODE], ['Tanggal bayar', F.tglPanjang(x.TANGGAL_BAYAR)], ['ID transaksi', x.ID_TRANSAKSI]].map(function (r) { return '<tr><td style="width:34%;color:#475569">' + r[0] + '</td><td><b>' + (r[0] === 'Uang sejumlah' ? r[1] : e(r[1])) + '</b></td></tr>'; }).join('') + '</tbody></table><div style="display:inline-block;margin-top:8px;padding:10px 18px;border:2px solid #1E2A4A;border-radius:8px;font:800 20px var(--f-judul);color:#1E2A4A">' + F.rp(x.NOMINAL) + '</div>' + kakiTtd + '</div>';
    if (o.jenis === 'SLIP_HONOR') return '<div class="kertas">' + kop + '<table><tbody><tr><td style="color:#475569;width:34%">Nama pelatih</td><td><b>' + e(x.NAMA_PELATIH) + '</b></td></tr><tr><td style="color:#475569">Lisensi</td><td>' + e(x.LISENSI) + '</td></tr><tr><td style="color:#475569">Periode</td><td><b>' + e(x.PERIODE) + '</b></td></tr></tbody></table><table><thead><tr><th>Kategori sesi</th><th style="text-align:right">Sesi</th><th style="text-align:right">Tarif</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>' + (x.RINCIAN || []).map(function (r) { return '<tr><td>' + e(r.KATEGORI) + '</td><td style="text-align:right">' + r.SESI + '</td><td style="text-align:right">' + F.rp(r.TARIF) + '</td><td style="text-align:right">' + F.rp(r.SUBTOTAL) + '</td></tr>'; }).join('') + '<tr><td><b>Total</b></td><td style="text-align:right"><b>' + x.TOTAL_SESI + '</b></td><td></td><td style="text-align:right"><b>' + F.rp(x.TOTAL) + '</b></td></tr></tbody></table><p style="font-size:11.5px;color:#475569">Terbilang: <i>' + e(Inti.de.terbilang(x.TOTAL)) + ' rupiah</i></p>' + kakiTtd + '</div>';
    if (o.jenis === 'LAPORAN_KAS') return '<div class="kertas">' + kop + '<p><b>Periode ' + e(x.PERIODE) + '</b> · saldo awal ' + F.rp(x.SALDO_AWAL) + ' · saldo akhir <b>' + F.rp(x.SALDO_AKHIR) + '</b></p><table><thead><tr><th>Tanggal</th><th>Kategori</th><th>Uraian</th><th style="text-align:right">Masuk</th><th style="text-align:right">Keluar</th></tr></thead><tbody>' + (x.TRX || []).map(function (r) { return '<tr><td>' + e(F.tgl(r.TANGGAL)) + '</td><td>' + e(r.KATEGORI) + '</td><td>' + e(r.URAIAN) + '</td><td style="text-align:right">' + (r.MASUK ? F.rp(r.MASUK) : '') + '</td><td style="text-align:right">' + (r.KELUAR ? F.rp(r.KELUAR) : '') + '</td></tr>'; }).join('') + '<tr><td colspan="3"><b>Total</b></td><td style="text-align:right"><b>' + F.rp(x.MASUK) + '</b></td><td style="text-align:right"><b>' + F.rp(x.KELUAR) + '</b></td></tr></tbody></table>' + kakiTtd + '</div>';
    return '<div class="kertas sertifikat"><img src="' + e(MR.logo) + '" alt="" style="width:56px;height:56px;margin:0 auto"><div style="font:700 12px var(--f-isi);letter-spacing:.3em;color:#0369A1;margin-top:12px">SERTIFIKAT</div><div style="color:#475569;margin-top:4px">' + (o.nomor ? 'No. ' + e(o.nomor) : 'DRAF') + '</div><p style="margin-top:18px;color:#475569">Diberikan kepada</p><div class="nama-besar">' + e(x.NAMA_SISWA) + '</div><p>' + e(x.PREDIKAT) + '</p><p style="margin-top:6px"><b>' + e(x.PAKET) + '</b> · ' + e(x.KATEGORI) + ' · ' + x.JUMLAH_HADIR + ' sesi hadir</p><p style="color:#475569;font-size:12px">Pelatih ' + e(x.PELATIH) + ' · ' + e(x.KOLAM) + ' · ' + e(x.PERIODE) + '</p>' + kakiTtd + '</div>';
  }
  W.detailDokumen = function (id) {
    var m = MR.UI.laci({ lebar: true, judul: 'Dokumen', isi: UI2.muatSebaris('Menyiapkan pratinjau…'), kaki: false });
    API.Q('dok.detail', { id: id }, { segar: true }).then(function (o) {
      var owner = Sesi.peran() === 'owner', url = location.href.split('#')[0] + '#/v/' + o.kode_verifikasi;
      m.el.querySelector('.ov-kepala h2').textContent = o.judul;
      m.isi.innerHTML = '<div class="baris bungkus" style="gap:8px">' + UI2.status(o.status) + (o.nomor ? '<code class="kecil">' + e(o.nomor) + '</code>' : '') + '<span class="kecil redup">' + e(o.nama_jenis) + ' · dibuat ' + e(F.waktu(o.dibuat)) + ' oleh ' + e(o.oleh) + '</span></div>' +
        (o.status === 'DITARIK' ? '<div class="peringatan bahaya mt12">' + ik('xBulat') + '<div><b>Ditarik</b>' + e(o.alasan_tarik) + '</div></div>' : '') +
        '<div class="mt16" style="background:#E9EEF4;padding:18px;border-radius:16px;overflow-x:auto">' + htmlKertas(o) + '</div>';
      var kaki = D.createElement('div'); kaki.className = 'ov-kaki';
      kaki.innerHTML = (o.status === 'TERBIT' ? '<button type="button" class="btn" data-x="link">' + ik('qr', 'k') + 'Salin link verifikasi</button>' : '') + (owner && o.status === 'TERBIT' ? '<button type="button" class="btn bahaya" data-x="tarik">Tarik</button>' : '') + (owner && o.status === 'MENUNGGU_TTD' ? '<button type="button" class="btn primer" data-x="setujui">' + ik('cekBulat', 'k') + 'Setujui dengan PIN</button>' : '') +
        (o.berkas && o.berkas.pdf ? '<button type="button" class="btn primer" data-x="unduh">' + ik('unduh', 'k') + 'Unduh PDF</button>' : '<button type="button" class="btn" data-x="cetak">' + ik('cetak', 'k') + 'Cetak / simpan PDF</button>');
      m.el.appendChild(kaki);
      m.on('click', '[data-x=link]', function () { UI2.salin(url, 'Link verifikasi disalin.'); });
      m.on('click', '[data-x=cetak]', function () { UI2.cetakHtml('<html><head><meta charset="utf-8"><title>' + e(o.judul) + '</title><link rel="stylesheet" href="' + location.href.split('#')[0].replace(/[^/]*$/, '') + 'css/app.css"><style>body{margin:0;padding:24px;font-family:Inter,Arial,sans-serif;--f-judul:"Plus Jakarta Sans",Arial,sans-serif;--f-isi:Inter,Arial,sans-serif}.kertas{box-shadow:none!important;max-width:none}.baris{display:flex;align-items:center}@page{size:A4;margin:14mm}</style></head><body>' + htmlKertas(o) + '</body></html>'); });
      m.on('click', '[data-x=unduh]', function (b) { MR.UI.kerja(b, function () { return API.Q('dok.detail', { id: id, unduh: true }, { segar: true }); }).then(function (r) { if (r.unduhan) UI2.unduhDataUrl('data:' + r.unduhan.mime + ';base64,' + r.unduhan.base64, r.unduhan.nama); }).catch(function () { }); });
      m.on('click', '[data-x=setujui]', function () { m.tutup(); setujuiDokumen([o]); });
      m.on('click', '[data-x=tarik]', function () { UI2.mintaTeks({ judul: 'Tarik dokumen?', pesan: 'Verifikasi QR akan menampilkan status DITARIK beserta alasannya.', label: 'Alasan', ok: 'Tarik dokumen', bahaya: true }).then(function (al) { if (al) API.T('dok.tarik', { id: id, alasan: al }).then(function () { m.tutup(); MR.UI.toast('Dokumen ditarik.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); }); });
    }).catch(function (er) { m.isi.innerHTML = MR.UI.kosong('Gagal memuat', er.message); });
  };
})(window, document);
