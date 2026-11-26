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
          (Sesi.punya('pengaturan.master') ? '<button type="button" class="btn" data-a="kategori">' + ik('tag') + 'Kelola kategori</button>' : '') +
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
            { label: 'Dicatat', f: function (t) { return t._sinkron ? '<span class="status netral polos sinkron">' + ik('segar', 'k') + 'Menyinkron…</span>' : '<span class="kecil">' + e(t.oleh) + '</span>' + (t.status === 'batal' ? ' <span class="status habis polos">Batal</span>' : t.diubah_at ? ' <span class="status netral polos">diubah</span>' : ''); } }
          ] });
        }
        ctx.grafik(function () { Grafik.kolom(ctx.el.querySelector('#g-tren'), { label: d.tren.map(function (x) { return Inti.NAMA_BULAN[Number(x.bulan.slice(5)) - 1].slice(0, 3); }), seri: [{ nama: 'Pemasukan', warna: W.WARNA_GRAFIK.masuk, nilai: d.tren.map(function (x) { return x.masuk; }) }, { nama: 'Pengeluaran', warna: W.WARNA_GRAFIK.keluar, nilai: d.tren.map(function (x) { return x.keluar; }) }], fmt: F.rp, tinggi: 220, ekstra: function (i) { return '<div class="r" style="margin-top:4px;border-top:1px solid #334155;padding-top:4px"><span>Saldo</span><b style="display:inline;margin:0">' + F.rp(d.tren[i].saldo) + '</b></div>'; } }); });
        ctx.on('seg', '.seg', function (s, ev) { st.tab = ev.detail.v; gambar(); });
        ctx.on('change', '[name=bulan]', function (i) { if (i.value) { st.bulan = i.value; R.tampilkan({ diam: true, bingkai: true }); } });
        ctx.on('change', '[data-f=kat]', function (s) { st.kat = s.value; gambar(); });
        ctx.on('input', '[data-f=q]', MR.U.debounce(function (i) { st.q = i.value; gambar(); }, 120));
        ctx.aksi({
          input: function () { formTrx(d, null); },
          kategori: function () { W.kelolaKategoriKas(d.kategori, function () { R.segarkanDiam(); }); },
          buka: function (t) { var x = d.rows.filter(function (y) { return y.trx_id === t.dataset.id; })[0]; if (x && x._sinkron) { MR.UI.toast('Transaksi sedang disinkronkan ke server…', 'info'); return; } if (x) detailTrx(x, d); },
          excel: function () { Xlsx.unduh('Arus_Kas_' + d.bulan, [{ nama: 'Transaksi ' + d.bulan, kolom: ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nama', 'Uraian', 'Nominal', 'Status', 'Dicatat oleh', 'Alasan batal'], baris: saring().slice().reverse().map(function (t) { return [t.trx_id, t.tanggal, t.tipe, t.kategori, t.nama, t.penjelasan, t.tipe === 'Pemasukan' ? t.nominal : -t.nominal, t.status, t.oleh, t.alasan_batal]; }) }, { nama: 'Ringkasan', kolom: ['Keterangan', 'Nilai'], baris: [['Saldo awal', rg.saldo_awal], ['Pemasukan', rg.masuk], ['Pengeluaran', rg.keluar], ['Saldo akhir', rg.saldo_akhir]] }]); },
          pdf: function (b) { MR.UI.kerja(b, function () { return API.Q('laporan.buat', { jenis: 'kas', bulan: d.bulan }, { segar: true }); }).then(unduhPdf).catch(function () { }); }
        });
        ctx.nanti(function () { gambar(); UI2.hidupkan(ctx.el); if (ctx.q.input && d.bolehInput && !st._i) { st._i = 1; formTrx(d, null); } });
      });
    }
  });
  function formTrx(d, t, isian) {
    var ubah = !!t, tipe = t ? t.tipe : (isian && isian.tipe) || 'Pemasukan', bukti = null, owner = Sesi.peran() === 'owner', bisaKat = Sesi.punya('pengaturan.master');
    /* Kategori otomatis (Pendaftaran, Perpanjangan, Penambahan Biaya, Trial) dicatat sistem saat verifikasi → tidak ditawarkan di input manual */
    function opsiKat(pilih) { pilih = pilih || (t ? t.kategori_id : isian && isian.kategori_id); return d.kategori.filter(function (k) { return k.tipe === tipe && ((k.aktif !== 'T' && k.sistem !== 'Y') || (t && t.kategori_id === k.kategori_id)); }).map(function (k) { return '<option value="' + e(k.kategori_id) + '"' + (pilih === k.kategori_id ? ' selected' : '') + '>' + e(k.nama) + '</option>'; }).join('') + (bisaKat ? '<option value="__baru">＋ Tambah kategori baru…</option>' : ''); }
    var m = MR.UI.modal({ judul: ubah ? 'Ubah transaksi ' + t.trx_id : 'Input transaksi', sub: ubah ? 'Hanya Owner. Nilai lama dan baru tercatat di log audit.' : 'Pendaftaran & perpanjangan sudah tercatat otomatis saat verifikasi.', isi: '<form class="form">' +
      '<div class="fld">' + UI2.seg('tipe', [{ v: 'Pemasukan', label: 'Pemasukan', ikon: 'naik' }, { v: 'Pengeluaran', label: 'Pengeluaran', ikon: 'turun' }], tipe, 'lebar') + '</div>' +
      UI2.fld({ k: 'tanggal', label: 'Tanggal', tipe: 'date', v: t ? t.tanggal : (isian && isian.tanggal) || UI2.hariIni(), l: 'l3', attr: ' max="' + UI2.hariIni() + '"' }) +
      '<div class="fld l3" data-k="kategori_id"><label>Kategori <span class="wajib">*</span></label><select class="inp" name="kategori_id"><option value="">— Pilih —</option>' + opsiKat() + '</select>' +
        '<div class="kat-baru" hidden><input class="inp" name="kat_baru" maxlength="40" placeholder="Nama kategori baru" autocomplete="off"><button type="button" class="btn primer kecil" data-x="katSimpan">Tambah</button><button type="button" class="btn hantu kecil" data-x="katBatal">Batal</button></div><span class="galat"></span></div>' +
      UI2.fld({ k: 'nama', label: 'Nama (pembayar / penerima)', v: t ? t.nama : (isian && isian.nama) || '', wajib: true }) +
      UI2.fld({ k: 'nominal', label: 'Nominal (Rp)', v: t ? F.ribuan(t.nominal) : isian && isian.nominal ? F.ribuan(isian.nominal) : '', mode: 'numeric', wajib: true, ph: '0', attr: ' data-rupiah' }) +
      UI2.fld({ k: 'penjelasan', label: 'Uraian', tipe: 'area', baris: 2, v: t ? t.penjelasan : (isian && isian.penjelasan) || '' }) +
      (ubah ? '' : '<div class="fld" data-k="bukti"><label>Bukti (opsional)</label><input class="inp" type="file" name="bukti_f" accept="image/png,image/jpeg,application/pdf"><span class="galat"></span></div>') +
      (ubah || (d.tertutup && owner) ? UI2.fld({ k: 'alasan', label: ubah ? 'Alasan perubahan' : 'Alasan (bulan sudah ditutup)', tipe: 'area', baris: 2, wajib: true }) : '') + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + (ubah ? 'Simpan perubahan' : 'Simpan transaksi') + '</button>' });
    var f = m.el.querySelector('form');
    UI2.hidupkanSeg(m.el); m.el.addEventListener('seg', function (ev) { tipe = ev.detail.v; f.kategori_id.innerHTML = '<option value="">— Pilih —</option>' + opsiKat(''); tutupKatBaru(); });
    /* Pintasan: tambah kategori tanpa keluar dari form */
    var kb = f.querySelector('.kat-baru');
    function tutupKatBaru() { kb.hidden = true; f.kategori_id.hidden = false; }
    f.kategori_id.addEventListener('change', function () { if (f.kategori_id.value !== '__baru') return; f.kategori_id.hidden = true; kb.hidden = false; f.kat_baru.value = ''; f.kat_baru.focus(); });
    f.kat_baru.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); kb.querySelector('[data-x=katSimpan]').click(); } if (ev.key === 'Escape') { ev.stopPropagation(); kb.querySelector('[data-x=katBatal]').click(); } });
    kb.querySelector('[data-x=katBatal]').addEventListener('click', function () { tutupKatBaru(); f.kategori_id.value = ''; });
    kb.querySelector('[data-x=katSimpan]').addEventListener('click', function () {
      var nama = f.kat_baru.value.trim(); if (nama.length < 2) { MR.UI.tandaiGalat(f, { kategori_id: 'Tulis nama kategori (min. 2 huruf)' }); return; }
      MR.UI.kerja(this, function () { return API.T('master.simpan', { tabel: 'Kategori_Kas', baris: { nama: nama, tipe: tipe } }, { basi: ['atur.'] }); }).then(function (r) {
        d.kategori.push(r.baris); f.kategori_id.innerHTML = '<option value="">— Pilih —</option>' + opsiKat(r.baris.kategori_id); tutupKatBaru();
        MR.UI.toast('Kategori "' + r.baris.nama + '" ditambahkan', 'ok');
      }).catch(function (er) { if (er && er.fields && er.fields.nama) MR.UI.tandaiGalat(f, { kategori_id: er.fields.nama }); });
    });
    f.nominal.addEventListener('input', function () { var n = f.nominal.value.replace(/\D/g, ''); f.nominal.value = n ? F.ribuan(Number(n)) : ''; });
    if (f.bukti_f) f.bukti_f.addEventListener('change', function () { UI2.bacaBerkas(f.bukti_f.files[0], UI2.KOMPRES_BUKTI).then(function (b) { bukti = b; }, function (er) { MR.UI.tandaiGalat(f, { bukti: er.message }); }); });
    m.el.querySelector('[data-ok]').onclick = function () {
      var v = UI2.baca(f), trx = { tipe: tipe, tanggal: v.tanggal, kategori_id: v.kategori_id, nama: v.nama, nominal: Number(String(v.nominal).replace(/\D/g, '')), penjelasan: v.penjelasan };
      var aksi = ubah ? ['kas.ubah', { trx_id: t.trx_id, trx: trx, alasan: v.alasan }] : ['kas.input', { trx: trx, alasan: v.alasan, bukti: bukti ? { nama: bukti.nama, mime: bukti.mime, base64: bukti.base64 } : null }];
      if (!ubah && !d.tertutup) { simpanOptimistik(d, trx, aksi, f, m, v); return; }
      MR.UI.kerja(this, function () { return API.T(aksi[0], aksi[1]); }, { form: f }).then(function (r) { m.tutup(); MR.UI.tutupSemua(); MR.UI.toast((ubah ? 'Transaksi diperbarui · ' : 'Tersimpan · ') + r.trx_id, 'ok'); R.muatUlang(); }).catch(function () { });
    };
  }
  /* ---------- Kelola kategori kas: dipakai di Arus Kas (laci) & Pengaturan → Kategori kas ---------- */
  W.panelKategoriKas = function (el, daftar, o) {
    o = o || {}; var tipe = o.tipe || 'Pengeluaran';
    function n(t) { return daftar.filter(function (k) { return k.tipe === t; }).length; }
    function item(k) {
      var oto = k.sistem === 'Y', mati = k.aktif === 'T';
      return '<div class="kat-item' + (mati ? ' nonaktif' : '') + '" data-id="' + e(k.kategori_id) + '"><span class="ubin ' + (k.tipe === 'Pemasukan' ? 'hijau' : 'merah') + '" style="width:34px;height:34px">' + ik(k.tipe === 'Pemasukan' ? 'naik' : 'turun', 'k') + '</span>' +
        '<div class="tumbuh tumpuk" style="min-width:0"><b class="satu-baris">' + e(k.nama) + '</b><span class="kecil redup">' + (oto ? 'Diisi otomatis saat verifikasi pendaftaran' : mati ? 'Nonaktif · tidak muncul di input transaksi' : 'Muncul di input transaksi') + '</span></div>' +
        (oto ? '<span class="tag-kecil kunci">' + ik('gembok', 'k') + 'Otomatis</span>' :
          '<button type="button" class="btn ikon kecil hantu" data-x="ganti" aria-label="Ganti nama ' + e(k.nama) + '">' + ik('pensil', 'k') + '</button>' + UI2.saklar('aktif', !mati, '', false)) + '</div>';
    }
    function gambar() {
      var rows = daftar.filter(function (k) { return k.tipe === tipe; }).sort(function (a, b) { return (a.sistem === 'Y') - (b.sistem === 'Y') || (a.aktif === 'T') - (b.aktif === 'T') || a.nama.localeCompare(b.nama); });
      el.innerHTML = UI2.seg('kk-tipe', [{ v: 'Pengeluaran', label: 'Pengeluaran', ikon: 'turun', n: n('Pengeluaran') }, { v: 'Pemasukan', label: 'Pemasukan', ikon: 'naik', n: n('Pemasukan') }], tipe, 'lebar') +
        '<form class="kat-tambah mt12" novalidate><div class="fld tumbuh" data-k="nama" style="margin:0"><input class="inp" name="nama" maxlength="40" placeholder="Kategori ' + tipe.toLowerCase() + ' baru, mis. ' + (tipe === 'Pengeluaran' ? 'Beli Pelampung' : 'Sewa Lajur') + '" autocomplete="off"><span class="galat"></span></div><button type="submit" class="btn primer">' + ik('plus') + 'Tambah</button></form>' +
        '<div class="kat-daftar mt12">' + (rows.length ? rows.map(item).join('') : '<p class="kecil redup tengah" style="padding:18px">Belum ada kategori ' + tipe.toLowerCase() + '.</p>') + '</div>' +
        '<p class="kecil redup mt12">' + ik('info', 'k') + ' Kategori yang sudah dipakai transaksi hanya bisa dinonaktifkan agar laporan lama tetap utuh.</p>';
      UI2.hidupkanSeg(el);
    }
    function simpan(baris) { return API.T('master.simpan', { tabel: 'Kategori_Kas', baris: baris }, o.basi ? { basi: o.basi } : undefined).then(function (r) { var i = daftar.map(function (k) { return k.kategori_id; }).indexOf(r.baris.kategori_id); if (i >= 0) daftar[i] = r.baris; else daftar.push(r.baris); if (o.berubah) o.berubah(r.baris); return r; }); }
    el.addEventListener('seg', function (ev) { if (ev.detail.seg !== 'kk-tipe') return; tipe = ev.detail.v; gambar(); });
    el.addEventListener('submit', function (ev) {
      ev.preventDefault(); var f = ev.target, nama = f.nama.value.trim();
      if (nama.length < 2) { MR.UI.tandaiGalat(f, { nama: 'Min. 2 huruf' }); return; }
      MR.UI.kerja(f.querySelector('[type=submit]'), function () { return simpan({ nama: nama, tipe: tipe }); }, { form: f }).then(function (r) { gambar(); MR.UI.toast('Kategori "' + r.baris.nama + '" ditambahkan', 'ok'); var i = el.querySelector('[name=nama]'); if (i) i.focus(); }).catch(function () { });
    });
    el.addEventListener('change', function (ev) {
      var cb = ev.target; if (cb.name !== 'aktif') return; var it = cb.closest('.kat-item'), k = daftar.filter(function (x) { return x.kategori_id === it.dataset.id; })[0]; if (!k) return;
      var on = cb.checked; it.classList.toggle('nonaktif', !on);   /* optimistis: tampil seketika, kembali bila gagal */
      simpan({ kategori_id: k.kategori_id, nama: k.nama, tipe: k.tipe, aktif: on ? 'Y' : 'T' }).then(function () { gambar(); MR.UI.toast('"' + k.nama + '" ' + (on ? 'diaktifkan' : 'dinonaktifkan'), 'ok'); }, function (er) { cb.checked = !on; it.classList.toggle('nonaktif', on); MR.UI.galat(er); });
    });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-x=ganti]'); if (!b) return; var k = daftar.filter(function (x) { return x.kategori_id === b.closest('.kat-item').dataset.id; })[0];
      UI2.mintaTeks({ judul: 'Ganti nama kategori', label: 'Nama baru', tipe: 'text', ok: 'Simpan', ph: k.nama }).then(function (v) { if (!v || v.trim() === k.nama) return; simpan({ kategori_id: k.kategori_id, nama: v.trim(), tipe: k.tipe, aktif: k.aktif }).then(function () { gambar(); MR.UI.toast('Nama kategori diperbarui', 'ok'); }, MR.UI.galat); });
    });
    gambar();
  };
  W.kelolaKategoriKas = function (daftar, selesai) {
    var berubah = false;
    var m = MR.UI.laci({ judul: 'Kelola kategori kas', sub: 'Tambah, ganti nama, aktifkan atau nonaktifkan kategori.', isi: '<div id="kk-panel"></div>', saatTutup: function () { if (berubah && selesai) selesai(); } });
    W.panelKategoriKas(m.el.querySelector('#kk-panel'), daftar, { berubah: function () { berubah = true; }, basi: ['atur.'] });
  };

  /* Optimistic UI: baris & ringkasan diperbarui seketika (<100 ms), server disinkronkan di latar.
     Gagal → kembali ke data semula + toast dengan tombol "Buka lagi" (isian tidak hilang). */
  function simpanOptimistik(d, trx, aksi, f, m, v) {
    var lokal = {};
    if (!trx.kategori_id || trx.kategori_id === '__baru') lokal.kategori_id = 'Pilih kategori';
    if (!trx.nama) lokal.nama = 'Wajib diisi';
    if (!(trx.nominal > 0)) lokal.nominal = 'Nominal harus lebih dari 0';
    if (!trx.tanggal || trx.tanggal > UI2.hariIni()) lokal.tanggal = 'Tanggal tidak valid';
    if (Object.keys(lokal).length) { MR.UI.tandaiGalat(f, lokal); return; }
    var kat = d.kategori.filter(function (k) { return k.kategori_id === trx.kategori_id; })[0] || {}, bulan = trx.tanggal.slice(0, 7), masuk = trx.tipe === 'Pemasukan';
    var baris = { trx_id: 'Menyinkron…', _sinkron: true, tanggal: trx.tanggal, tipe: trx.tipe, kategori_id: trx.kategori_id, kategori: kat.nama || '-', nama: trx.nama, nominal: trx.nominal, penjelasan: trx.penjelasan, status: 'aktif', oleh: (Sesi.me || {}).nama || '', dibuat_at: '' };
    var pulihkan = API.ubahCache(function (k) { return k.indexOf('kas.list|') === 0; }, function (x) {
      if (x.bulan !== bulan) return;   /* hanya bulan yang sama dengan tanggal transaksi */
      x.rows.unshift(baris); var r = x.ringkas; r.jumlah = (r.jumlah || 0) + 1;
      if (masuk) r.masuk += trx.nominal; else r.keluar += trx.nominal;
      r.saldo_bulan = r.masuk - r.keluar; r.saldo_akhir = (r.saldo_awal || 0) + r.saldo_bulan;
    });
    m.tutup(); MR.UI.tutupSemua(); R.tampilkan({ diam: true });   /* langsung, tanpa debounce */
    MR.UI.toast('Transaksi dicatat · ' + F.rp(trx.nominal), 'ok');
    API.T(aksi[0], aksi[1], { diam: true }).then(function () { R.segarkanDiam(); }, function (er) {
      pulihkan(); R.segarkanDiam();
      MR.UI.toast((er && er.message) || 'Gagal menyimpan transaksi.', 'bahaya', { judul: 'Transaksi belum tersimpan', durasi: 9000, aksi: { label: 'Buka lagi', fn: function () { formTrx(d, null, { tipe: trx.tipe, tanggal: trx.tanggal, kategori_id: trx.kategori_id, nama: trx.nama, nominal: trx.nominal, penjelasan: trx.penjelasan }); } } });
    });
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
