/* =====================================================================
 * CRM & WHATSAPP — kontak (Nama·Email·WA), blast per batch (Fonnte, opsional),
 * antrean notifikasi, konfigurasi (Owner). WA manual (wa.me) selalu tersedia.
 * ===================================================================== */
(function (W, D) {
  'use strict';
  var e = MR.U.e, ik = W.ik, F = W.F, R = MR.Router, OA = ['owner', 'admin'];

  R.daftar('crm', {
    judul: 'CRM & WhatsApp', kerangka: 'tabel', peran: OA,
    render: function (ctx) {
      var st = ctx.st, owner = Sesi.peran() === 'owner', bisaCrm = Sesi.punya('crm.kelola'), bisaBlast = Sesi.punya('wa.blast');
      st.tab = st.tab || (bisaCrm ? 'kontak' : 'blast'); st.hal = st.hal || 1; st.pilih = st.pilih || {};
      var tabs = (bisaCrm ? [{ v: 'kontak', label: 'Kontak', ikon: 'orang2' }] : []).concat(bisaBlast ? [{ v: 'blast', label: 'Blast WA', ikon: 'kirim' }] : []).concat(bisaCrm ? [{ v: 'antrean', label: 'Antrean', ikon: 'daftar' }] : []).concat(owner ? [{ v: 'konfig', label: 'Konfigurasi', ikon: 'slider' }] : []);
      var muat = st.tab === 'kontak' ? API.Q('crm.list', { cari: st.q || '', segmen: st.segmen || '', status_wa: st.status_wa || '', masalah: !!st.masalah, opt_out: !!st.opt_out, halaman: st.hal })
        : st.tab === 'blast' ? API.Q('wa.blastList') : st.tab === 'antrean' ? API.Q('notif.queue', { status: st.qs || '' }) : API.Q('notif.config');
      return Promise.all([muat, API.Q('notif.config').catch(function () { return null; })]).then(function (h) {
        if (ctx.basi()) return;
        var d = h[0], cfg = h[1], waAktif = cfg ? cfg.wa_aktif && cfg.token_ada : (d.wa_aktif || false);
        ctx.el.innerHTML = '<div class="kepala-hal"><div class="judul"><h1>CRM & WhatsApp</h1><p>Satu daftar kontak orang tua, calon siswa, dan pelatih — tersinkron otomatis dari data siswa & pendaftaran.</p></div><div class="aksi">' +
          (st.tab === 'kontak' ? '<button type="button" class="btn" data-a="sinkron">' + ik('segar') + 'Sinkron</button><button type="button" class="btn" data-a="impor">' + ik('unggah') + 'Impor</button><button type="button" class="btn" data-a="ekspor">' + ik('unduh') + 'Excel</button>' : '') +
          (st.tab === 'blast' && bisaBlast ? '<button type="button" class="btn primer" data-a="blastBaru"' + (waAktif ? '' : ' disabled') + '>' + ik('kirim') + 'Blast baru</button>' : '') + '</div></div>' +
          (!waAktif ? '<div class="peringatan info">' + ik('wa') + '<div class="tumbuh"><b>WhatsApp otomatis (Fonnte) belum aktif — mode manual</b>Semua tombol WA membuka WhatsApp Anda (wa.me) dengan pesan siap kirim. ' + (owner ? 'Aktifkan pengiriman otomatis & blast di tab Konfigurasi dengan token Fonnte.' : 'Owner dapat mengaktifkan pengiriman otomatis.') + '</div>' + (owner && st.tab !== 'konfig' ? '<button type="button" class="btn kecil" data-a="keKonfig">Atur</button>' : '') + '</div>' : '<div class="peringatan ok">' + ik('cekBulat') + '<div><b>WhatsApp otomatis aktif</b>Notifikasi dikirim lewat Fonnte per batch dengan jeda, tanpa menahan respons aplikasi.</div></div>') +
          '<div class="mt16">' + UI2.seg('tab', tabs, st.tab) + '</div><div id="crm-isi" class="mt16"></div>';
        var w = ctx.el.querySelector('#crm-isi');
        if (st.tab === 'kontak') tabKontak(ctx, w, d, st, waAktif);
        else if (st.tab === 'blast') tabBlast(ctx, w, d, waAktif);
        else if (st.tab === 'antrean') tabAntrean(ctx, w, d, st);
        else tabKonfig(ctx, w, d);
        ctx.on('seg', '.seg[data-seg=tab]', function (s, ev) { st.tab = ev.detail.v; R.tampilkan({ diam: true, bingkai: true }); });
        ctx.aksi({
          keKonfig: function () { st.tab = 'konfig'; R.tampilkan({ diam: true, bingkai: true }); },
          sinkron: function (b) { MR.UI.kerja(b, function () { return API.T('crm.sync', {}); }).then(function (r) { MR.UI.toast('Sinkron selesai · ' + r.ditambah + ' kontak baru, ' + r.diperbarui + ' diperbarui.', 'ok'); R.muatUlang(); }).catch(function () { }); },
          ekspor: function (b) { MR.UI.kerja(b, function () { return API.T('crm.ekspor', {}); }).then(function (r) { var k = Object.keys(r.rows[0] || { Nama: '' }); Xlsx.unduh('CRM_Kontak_' + UI2.hariIni(), [{ nama: 'Kontak', kolom: k, baris: r.rows.map(function (x) { return k.map(function (c) { return x[c]; }); }) }]); }).catch(function () { }); },
          impor: function () { formImpor(); },
          blastBaru: function () { formBlast(cfg); }
        });
        ctx.nanti(function () { UI2.hidupkan(ctx.el); });
      });
    }
  });

  function tabKontak(ctx, w, d, st, waAktif) {
    var s = d.stat;
    w.innerHTML = '<div class="grid g4 kpi-baris stagger">' + UI2.kpi({ i: 0, label: 'Total kontak', nilai: s.total, ikon: 'orang2', sub: '+' + s.baru7 + ' dalam 7 hari' }) + UI2.kpi({ i: 1, label: 'WA valid', nilai: s.wa_valid, ikon: 'wa', warna: 'hijau', sub: s.terdaftar + ' terdeteksi aktif · ' + s.belum_cek + ' belum dicek' }) + UI2.kpi({ i: 2, label: 'Email valid', nilai: s.email_valid, ikon: 'surat', warna: 'ungu' }) + UI2.kpi({ i: 3, label: 'Perlu dibenahi', nilai: s.duplikat + s.tak_terjangkau, ikon: 'segitiga', warna: 'oranye', sub: s.duplikat + ' duplikat · ' + s.tak_terjangkau + ' tak terjangkau · ' + s.opt_out + ' opt-out' }) + '</div>' +
      '<section class="kartu mt16"><div class="pad" style="padding:14px 16px"><div class="baris bungkus" style="gap:10px"><div class="inp-ikon tumbuh" style="min-width:220px">' + ik('cari') + '<input class="inp" data-f="q" placeholder="Cari nama, email, nomor, atau nama anak…" value="' + e(st.q || '') + '"></div>' +
        '<select class="inp" data-f="status_wa" style="width:auto"><option value="">Status WA</option>' + [['Terdaftar', 'Terdaftar di WA'], ['Tidak Terdaftar', 'Tidak terdaftar'], ['belum', 'Belum dicek']].map(function (o) { return '<option value="' + o[0] + '"' + (st.status_wa === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
        '<label class="cek" style="align-items:center"><input type="checkbox" data-f="masalah"' + (st.masalah ? ' checked' : '') + '><span class="kecil">Bermasalah</span></label><label class="cek" style="align-items:center"><input type="checkbox" data-f="opt_out"' + (st.opt_out ? ' checked' : '') + '><span class="kecil">Opt-out</span></label></div>' +
        '<div class="deret-chip mt12">' + [''].concat(Object.keys(d.segmen)).map(function (g) { return '<button type="button" class="chip' + ((st.segmen || '') === g ? ' aktif' : '') + '" data-a="segmen" data-v="' + e(g) + '">' + e(g || 'Semua segmen') + '<span class="n">' + (g ? d.segmen[g] : s.total) + '</span></button>'; }).join('') + '</div>' +
        '<div class="baris bungkus mt12" id="bulk" style="gap:8px" hidden><b class="kecil" id="bulk-n"></b><button type="button" class="btn kecil" data-a="bulk" data-x="tag">' + ik('tag', 'k') + 'Beri tag</button><button type="button" class="btn kecil" data-a="bulk" data-x="optout">Opt-out</button><button type="button" class="btn kecil" data-a="bulk" data-x="optin">Opt-in</button><button type="button" class="btn kecil" data-a="cekWa">' + ik('wa', 'k') + 'Cek nomor WA</button></div></div>' +
      UI2.tabel({ baris: d.rows, kosong: 'Tidak ada kontak', kolom: [
        { label: '', bukanUtama: true, f: function (k) { return '<input type="checkbox" data-pilih="' + e(k.kontak_id) + '"' + (st.pilih[k.kontak_id] ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:var(--merek)" aria-label="Pilih ' + e(k.nama) + '">'; } },
        { label: 'Kontak', f: function (k) { return '<div class="sel-utama item-klik" data-a="detail" data-id="' + e(k.kontak_id) + '" style="cursor:pointer">' + UI2.avatar(k.nama, 'kecil') + '<span class="tumpuk" style="min-width:0"><b class="satu-baris">' + e(k.nama) + '</b><small class="satu-baris">' + e(k.info.anak ? 'Anak: ' + k.info.anak : k.info.calon ? 'Calon: ' + k.info.calon : k.info.status || '') + '</small></span></div>'; } },
        { label: 'Segmen', f: function (k) { return '<span class="tag-kecil">' + e(k.segmen) + '</span>' + (k.tag ? ' ' + k.tag.split(',').map(function (t) { return '<span class="tag-kecil">#' + e(t) + '</span>'; }).join(' ') : ''); } },
        { label: 'WhatsApp', f: function (k) { return k.no_wa ? '<span class="tumpuk"><span class="angka kecil">' + e(F.hp(k.no_wa)) + '</span><small class="' + (k.status_wa === 'Terdaftar' ? 'teks-ok' : k.status_wa ? 'teks-bahaya' : 'redup') + '">' + e(k.status_wa || 'belum dicek') + '</small></span>' : '<span class="redup">—</span>'; } },
        { label: 'Email', f: function (k) { return k.email ? '<span class="kecil putus">' + e(k.email) + '</span>' : '<span class="redup">—</span>'; } },
        { label: 'Catatan', f: function (k) { return (k.masalah.length ? k.masalah.map(function (m) { return '<span class="status warn polos">' + e(m) + '</span>'; }).join(' ') : '') + (k.opt_out === 'YA' ? ' <span class="status netral polos">Opt-out</span>' : '') + (k.terakhir_dihubungi ? '<div class="kecil redup">Dihubungi ' + e(F.relatif(k.terakhir_dihubungi)) + '</div>' : ''); } },
        { label: 'Aksi', f: function (k) { return k.no_wa && Inti.util.hpValid(k.no_wa) ? '<a class="btn kecil wa" target="_blank" rel="noopener" data-a="waManual" data-id="' + e(k.kontak_id) + '" href="' + UI2.waLink(k.no_wa, 'Halo ' + k.nama + ', ') + '">' + ik('wa', 'k') + 'Chat</a>' : ''; } }
      ] }) +
      (d.total > d.per ? '<div class="halaman-nav"><span>Menampilkan ' + ((d.halaman - 1) * d.per + 1) + '–' + Math.min(d.total, d.halaman * d.per) + ' dari ' + d.total + '</span><div class="baris"><button type="button" class="btn kecil" data-a="hal" data-n="-1"' + (d.halaman <= 1 ? ' disabled' : '') + '>' + ik('kiri', 'k') + '</button><button type="button" class="btn kecil" data-a="hal" data-n="1"' + (d.halaman * d.per >= d.total ? ' disabled' : '') + '>' + ik('kanan', 'k') + '</button></div></div>' : '') + '</section>';
    function perbaruiBulk() { var n = Object.keys(st.pilih).filter(function (k) { return st.pilih[k]; }).length, b = w.querySelector('#bulk'); b.hidden = !n; w.querySelector('#bulk-n').textContent = n + ' dipilih'; }
    perbaruiBulk();
    var muat = function () { st.hal = 1; R.tampilkan({ diam: true, bingkai: true }); };
    ctx.on('input', '[data-f=q]', MR.U.debounce(function (i) { st.q = i.value; muat(); }, 350));
    ctx.on('change', '[data-f=status_wa]', function (x) { st.status_wa = x.value; muat(); });
    ctx.on('change', 'input[data-f=masalah], input[data-f=opt_out]', function (x) { st[x.dataset.f] = x.checked; muat(); });
    ctx.on('change', '[data-pilih]', function (x) { st.pilih[x.dataset.pilih] = x.checked; perbaruiBulk(); });
    ctx.aksi({
      segmen: function (b) { st.segmen = b.dataset.v; muat(); },
      hal: function (b) { st.hal = Math.max(1, st.hal + Number(b.dataset.n)); R.tampilkan({ diam: true, bingkai: true }); },
      detail: function (t) { detailKontak(t.dataset.id); },
      waManual: function (t) { W.open(t.href, '_blank', 'noopener'); API.T('crm.interaksi', { kontak_id: t.dataset.id, kanal: 'WA Manual', ringkasan: 'Membuka chat WhatsApp manual' }).catch(function () { }); },
      bulk: function (b) {
        var ids = Object.keys(st.pilih).filter(function (k) { return st.pilih[k]; }), x = b.dataset.x;
        var jalan = function (nilai) { API.T('crm.bulk', { ids: ids, aksi: x, nilai: nilai }).then(function (r) { MR.UI.toast(r.diubah + ' kontak diperbarui.', 'ok'); st.pilih = {}; R.muatUlang(); }).catch(MR.UI.galat); };
        if (x === 'tag') UI2.mintaTeks({ judul: 'Beri tag', label: 'Nama tag', tipe: 'text', ph: 'mis. promo-liburan', ok: 'Terapkan', min: 2 }).then(function (t) { if (t) jalan(t.replace(/,/g, ' ')); }); else jalan('');
      },
      cekWa: function (b) {
        var ids = Object.keys(st.pilih).filter(function (k) { return st.pilih[k]; }), nomor = d.rows.filter(function (k) { return ids.indexOf(k.kontak_id) >= 0; }).map(function (k) { return k.no_wa; });
        MR.UI.kerja(b, function () { return API.T('wa.validate', { nomor: nomor }); }).then(function (r) { MR.UI.toast(Object.keys(r.hasil).length + ' nomor diperiksa.', 'ok'); R.muatUlang(); }).catch(function () { });
      }
    });
  }
  function detailKontak(id) {
    var m = MR.UI.laci({ judul: 'Kontak', isi: UI2.muatSebaris(), kaki: false });
    API.Q('crm.detail', { kontak_id: id }, { segar: true }).then(function (d) {
      var k = d.kontak, manual = k.sumber === 'manual';
      m.el.querySelector('.ov-kepala h2').textContent = k.nama;
      m.isi.innerHTML = '<div class="baris">' + UI2.avatar(k.nama, 'besar') + '<div class="tumpuk tumbuh"><b style="font:700 17px var(--f-judul)">' + e(k.nama) + '</b><span class="kecil redup">' + e(k.segmen) + ' · sumber ' + e(k.sumber) + '</span>' + (k.no_wa ? '<span class="kecil angka">' + e(F.hp(k.no_wa)) + ' · ' + e(k.status_wa || 'belum dicek') + '</span>' : '') + '</div>' + (k.no_wa ? '<a class="btn wa kecil" target="_blank" rel="noopener" href="' + UI2.waLink(k.no_wa, 'Halo ' + k.nama + ', ') + '">' + ik('wa', 'k') + '</a>' : '') + '</div>' +
        '<form class="form mt16" id="f-k">' + (manual ? UI2.fld({ k: 'nama', label: 'Nama', v: k.nama, l: 'l3' }) + UI2.fld({ k: 'no_wa', label: 'WhatsApp', v: k.no_wa, l: 'l3' }) + UI2.fld({ k: 'email', label: 'Email', v: k.email }) : '') +
        UI2.fld({ k: 'tag', label: 'Tag (pisahkan koma)', v: k.tag }) + UI2.fld({ k: 'catatan', label: 'Catatan internal', tipe: 'area', v: k.catatan, baris: 2 }) +
        '<div class="fld"><label class="saklar"><input type="checkbox" name="opt_out"' + (k.opt_out === 'YA' ? ' checked' : '') + '><i></i><span>Opt-out (jangan kirim blast)</span></label></div><div class="fld"><button type="submit" class="btn primer">Simpan kontak</button></div></form>' +
        '<div class="judul-seksi"><h2>Riwayat komunikasi</h2><span class="tumbuh"></span><button type="button" class="btn kecil" data-x="catat">' + ik('plus', 'k') + 'Catat</button></div>' +
        '<ul class="linimasa">' + (d.timeline.length ? d.timeline.map(function (t) { return '<li><span class="titik ' + (t.jenis === 'catatan' ? 'ungu' : t.status === 'Terkirim' ? 'ok' : t.status === 'Gagal' ? 'bahaya' : '') + '">' + ik(t.kanal === 'EMAIL' ? 'surat' : t.jenis === 'catatan' ? 'pensil' : 'wa') + '</span><div class="tumbuh" style="min-width:0"><div class="baris ujung"><b class="kecil">' + e(t.kanal) + (t.status ? ' · ' + e(t.status) : '') + '</b><time>' + e(F.relatif(t.waktu)) + '</time></div><p class="putus">' + e(t.ringkasan) + (t.oleh ? ' — ' + e(t.oleh) : '') + '</p></div></li>'; }).join('') : '<li>' + MR.UI.kosong('Belum ada riwayat') + '</li>') + '</ul>';
      m.isi.querySelector('#f-k').addEventListener('submit', function (ev) { ev.preventDefault(); var f = ev.target, v = UI2.baca(f); v.kontak_id = k.kontak_id; MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('crm.save', v); }, { form: f }).then(function () { MR.UI.toast('Kontak tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { }); });
      m.on('click', '[data-x=catat]', function () {
        var mm = MR.UI.modal({ judul: 'Catat interaksi', sempit: true, isi: '<form class="form">' + UI2.fld({ k: 'kanal', label: 'Kanal', tipe: 'select', opsi: ['Telepon', 'WA Manual', 'Kunjungan', 'Catatan'], kosong: false }) + UI2.fld({ k: 'ringkasan', label: 'Ringkasan', tipe: 'area', baris: 3, wajib: true }) + '</form>', kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>Simpan</button>' });
        mm.el.querySelector('[data-ok]').onclick = function () { var f = mm.el.querySelector('form'), v = UI2.baca(f); v.kontak_id = k.kontak_id; MR.UI.kerja(this, function () { return API.T('crm.interaksi', v); }, { form: f }).then(function () { mm.tutup(); m.tutup(); detailKontak(id); }).catch(function () { }); };
      });
    }).catch(function (er) { m.isi.innerHTML = MR.UI.kosong('Gagal memuat', er.message); });
  }
  function formImpor() {
    var m = MR.UI.modal({ judul: 'Impor kontak manual', sub: 'Tempel dari Excel/CSV: satu baris per kontak — Nama, WhatsApp, Email, Segmen, Tag.', isi: '<form class="form">' + UI2.fld({ k: 'teks', label: 'Data', tipe: 'area', baris: 8, ph: 'Rina Kartika, 081234567890, rina@mail.com, Prospek, pameran\nDodi, 0857..., , Prospek, ' }) + '<div class="fld"><span class="bantu">Kontak dengan nomor/email yang sudah ada dilewati. Maks 2.000 baris.</span></div></form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-ok>' + ik('unggah', 'k') + 'Impor</button>' });
    m.el.querySelector('[data-ok]').onclick = function () {
      var rows = m.el.querySelector('[name=teks]').value.split('\n').map(function (l) { var p = l.split(/[,;\t]/).map(function (x) { return x.trim(); }); return { nama: p[0], wa: p[1], email: p[2], segmen: p[3], tag: p[4] }; }).filter(function (r) { return r.nama || r.wa || r.email; });
      if (!rows.length) return MR.UI.toast('Belum ada data.', 'warn');
      MR.UI.kerja(this, function () { return API.T('crm.import', { rows: rows }); }).then(function (r) { m.tutup(); MR.UI.toast(r.ditambah + ' kontak ditambahkan, ' + r.dilewati + ' dilewati.', 'ok'); R.muatUlang(); }).catch(function () { });
    };
  }

  function tabBlast(ctx, w, d, waAktif) {
    w.innerHTML = d.rows.length ? '<div class="grid g2 stagger">' + d.rows.map(function (b, i) {
      return '<div class="kartu pad" style="--i:' + i + '"><div class="baris ujung"><b>' + e(b.judul) + '</b>' + UI2.status(b.status) + '</div><p class="kecil redup mt8" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + e(b.pesan) + '</p>' +
        '<div class="progres-label mt12"><span>' + b.terkirim + ' terkirim · ' + b.gagal + ' gagal · ' + b.sisa + ' antre</span><b>' + b.persen + '%</b></div><div class="progres merek"><i data-p="' + (b.persen / 100) + '"></i></div>' +
        '<div class="baris ujung mt12"><span class="kecil redup">Batch ' + b.ukuran_batch + ' · jeda ' + e(b.jeda) + ' dtk · ' + e(F.relatif(b.dibuat_at)) + '</span>' + (b.status === 'Berjalan' ? '<div class="baris"><button type="button" class="btn kecil primer" data-b="proses" data-id="' + e(b.blast_id) + '"' + (waAktif ? '' : ' disabled') + '>' + ik('kirim', 'k') + 'Kirim batch</button><button type="button" class="btn kecil bahaya" data-b="stop" data-id="' + e(b.blast_id) + '">Stop</button></div>' : '') + '</div></div>';
    }).join('') + '</div>' : '<div class="kartu pad">' + MR.UI.kosong('Belum ada blast', waAktif ? 'Kirim pesan ke banyak kontak per batch 10/20/50 dengan jeda aman.' : 'Aktifkan Fonnte untuk memakai blast. Tanpa Fonnte, gunakan tombol Chat (wa.me) per kontak.') + '</div>';
    ctx.on('click', '[data-b]', function (t) {
      var id = t.dataset.id;
      if (t.dataset.b === 'stop') return MR.UI.konfirmasi({ judul: 'Hentikan blast?', pesan: 'Pesan yang belum terkirim dibatalkan.', ok: 'Hentikan', bahaya: true }).then(function (y) { if (y) API.T('wa.blastStop', { blast_id: id }).then(function (r) { MR.UI.toast(r.dibatalkan + ' pesan dibatalkan.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); });
      jalankanBlast(id, t);
    });
  }
  /* Kirim blast batch demi batch; tiap panggilan = satu batch (server menahan jeda) */
  function jalankanBlast(id, tombol) {
    var p = MR.UI.proses('Mengirim blast WhatsApp', ['Mengambil batch berikutnya', 'Mengirim lewat Fonnte', 'Mencatat hasil']), total = 0, n = 0;
    (function lagi() {
      p.langkah(1);
      API.T('wa.blastProses', { blast_id: id }).then(function (r) {
        total += r.terkirim; n++; p.langkah(2);
        if (r.sisa > 0 && n < 50) setTimeout(lagi, 350); else { p.selesai(); MR.UI.toast(total + ' pesan terkirim' + (r.sisa ? ', ' + r.sisa + ' masih antre' : '') + '.', 'ok'); R.muatUlang(); }
      }).catch(function (er) { p.gagal(); MR.UI.galat(er); });
    })();
  }
  function formBlast(cfg) {
    var st = { sumber: 'crm' }, aud = null;
    var m = MR.UI.modal({ lebar: true, judul: 'Blast WhatsApp baru', sub: 'Gunakan {nama} dan {institusi} untuk personalisasi. Nomor ganda & opt-out otomatis dilewati.', isi: '<form class="form">' +
      UI2.fld({ k: 'judul', label: 'Judul (internal)', ph: 'mis. Promo libur sekolah', l: 'l3' }) + UI2.fld({ k: 'ukuran_batch', label: 'Ukuran batch', tipe: 'select', opsi: [10, 20, 50], v: cfg ? cfg.batch : 20, l: 'l2', kosong: false }) + UI2.fld({ k: 'jeda', label: 'Jeda (dtk)', v: cfg ? cfg.jeda : '5', l: 'l1', ph: '5 atau 3-8' }) +
      '<div class="fld"><label>Penerima</label>' + UI2.seg('sumber', [{ v: 'crm', label: 'Dari CRM', ikon: 'orang2' }, { v: 'manual', label: 'Nomor manual', ikon: 'hp' }], 'crm', 'lebar') + '</div>' +
      '<div class="fld" data-s="crm"><div class="baris bungkus"><select class="inp" name="segmen" style="width:auto"><option value="">Semua segmen</option><option>Orang Tua</option><option>Calon Siswa</option><option>Pelatih</option><option>Manual</option></select><select class="inp" name="status_wa" style="width:auto"><option value="">Semua status WA</option><option value="Terdaftar">Hanya terdaftar WA</option></select><input class="inp" name="tag" placeholder="Tag (opsional)" style="width:auto"></div></div>' +
      '<div class="fld" data-s="manual" hidden><textarea class="inp" name="manual" rows="4" placeholder="0812xxxx|Nama\n0857xxxx|Nama"></textarea></div>' +
      '<div class="fld"><button type="button" class="btn kecil" data-x="cek">' + ik('cari', 'k') + 'Hitung penerima</button><div id="aud" class="mt8"></div></div>' +
      UI2.fld({ k: 'pesan', label: 'Pesan', tipe: 'area', baris: 5, wajib: true, v: 'Halo {nama}, ada jadwal kelas renang baru di {institusi}! Balas pesan ini untuk info lebih lanjut.' }) + '</form>',
      kaki: '<button type="button" class="btn" data-tutup>Batal</button><button type="button" class="btn primer" data-x="kirim">' + ik('kirim', 'k') + 'Buat & kirim</button>' });
    var f = m.el.querySelector('form');
    UI2.hidupkanSeg(m.el); m.el.addEventListener('seg', function (ev) { st.sumber = ev.detail.v; MR.qsa('[data-s]', f).forEach(function (x) { x.hidden = x.dataset.s !== st.sumber; }); aud = null; m.el.querySelector('#aud').innerHTML = ''; });
    function hitungAud(t) {
      var v = UI2.baca(f);
      return MR.UI.kerja(t, function () { return API.T('wa.audience', { sumber: st.sumber, segmen: v.segmen, status_wa: v.status_wa, tag: v.tag, manual: v.manual }); }).then(function (r) {
        aud = r; var g = r.ringkas;
        m.el.querySelector('#aud').innerHTML = '<div class="baris bungkus" style="gap:6px"><span class="status ok">' + g.valid + ' siap dikirim</span><span class="status netral">' + g.ganda + ' ganda</span><span class="status warn">' + g.tidakValid + ' tidak valid</span><span class="status netral">' + g.optOut + ' opt-out</span></div>';
        return r;
      });
    }
    m.on('click', '[data-x=cek]', function (t) { hitungAud(t).catch(function () { }); });
    m.on('click', '[data-x=kirim]', function (t) {
      (aud ? Promise.resolve(aud) : hitungAud(t)).then(function (a) {
        var v = UI2.baca(f), penerima = a.rows.filter(function (x) { return x.valid && !x.ganda && !x.opt_out; }).map(function (x) { return { nama: x.nama, hp: x.hp }; });
        return MR.UI.kerja(t, function () { return API.T('wa.blastBuat', { judul: v.judul, pesan: v.pesan, ukuran_batch: Number(v.ukuran_batch), jeda: v.jeda, penerima: penerima, sasaran: st.sumber === 'crm' ? (v.segmen || 'Semua') : 'Manual' }); }, { form: f });
      }).then(function (r) { m.tutup(); MR.UI.toast('Blast dibuat: ' + r.total + ' penerima dalam ' + r.batch + ' batch.', 'ok'); R.muatUlang(); setTimeout(function () { jalankanBlast(r.blast_id); }, 500); }).catch(function () { });
    });
  }

  function tabAntrean(ctx, w, d, st) {
    var g = d.ringkas;
    w.innerHTML = '<div class="grid g4 kpi-baris stagger">' + UI2.kpi({ i: 0, label: 'Antre', nilai: g.Antri || 0, ikon: 'jam' }) + UI2.kpi({ i: 1, label: 'Terkirim', nilai: g.Terkirim || 0, ikon: 'cekBulat', warna: 'hijau' }) + UI2.kpi({ i: 2, label: 'Gagal', nilai: g.Gagal || 0, ikon: 'xBulat', warna: 'merah' }) + UI2.kpi({ i: 3, label: 'Batal', nilai: g.Batal || 0, ikon: 'x', warna: 'navy' }) + '</div>' +
      '<section class="kartu mt16"><div class="pad baris bungkus" style="padding:14px 16px;gap:10px"><select class="inp" data-f="qs" style="width:auto"><option value="">Semua status</option>' + ['Antri', 'Terkirim', 'Gagal', 'Batal'].map(function (x) { return '<option' + (st.qs === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select><span class="tumbuh"></span><button type="button" class="btn kecil" data-q="ulang"' + (g.Gagal ? '' : ' disabled') + '>' + ik('segar', 'k') + 'Ulangi yang gagal</button><button type="button" class="btn kecil primer" data-q="proses"' + (g.Antri ? '' : ' disabled') + '>' + ik('kirim', 'k') + 'Proses sekarang</button></div>' +
      UI2.tabel({ baris: d.rows.slice(0, 150), kosong: 'Antrean kosong', kolom: [{ label: 'Penerima', f: function (r) { return '<span class="tumpuk"><b class="kecil">' + e(r.nama_penerima || '-') + '</b><small class="redup angka">' + e(r.tujuan) + '</small></span>'; } }, { label: 'Kanal', f: function (r) { return '<span class="tag-kecil">' + e(r.kanal) + '</span>'; } }, { label: 'Event', f: function (r) { return '<span class="kecil">' + e(r.event) + '</span>'; } }, { label: 'Pesan', f: function (r) { return '<span class="kecil satu-baris" style="max-width:320px;display:block">' + e(r.subjek ? r.subjek + ' — ' : '') + e(r.pesan) + '</span>'; } }, { label: 'Status', f: function (r) { return UI2.status(r.status) + (r.respon ? '<div class="kecil redup">' + e(r.respon).slice(0, 60) + '</div>' : ''); } }, { label: 'Waktu', f: function (r) { return e(F.relatif(r.dikirim_at || r.dibuat_at)); } }] }) + '</section>';
    ctx.on('change', '[data-f=qs]', function (x) { st.qs = x.value; R.tampilkan({ diam: true, bingkai: true }); });
    ctx.on('click', '[data-q]', function (t) { MR.UI.kerja(t, function () { return API.T(t.dataset.q === 'ulang' ? 'notif.retry' : 'notif.proses', {}); }).then(function (r) { MR.UI.toast(t.dataset.q === 'ulang' ? r.diulang + ' pesan dijadwalkan ulang.' : r.terkirim + ' terkirim, ' + r.gagal + ' gagal.', 'ok'); R.muatUlang(); }).catch(function () { }); });
  }

  function tabKonfig(ctx, w, c) {
    var ev = Object.keys(c.matriks).map(function (k) { return c.matriks[k]; });
    w.innerHTML = '<div class="grid g-2-1"><form class="kartu pad" id="f-notif"><div class="baris"><span class="ubin hijau">' + ik('wa') + '</span><div class="tumpuk"><b>WhatsApp (Fonnte) & Email</b><span class="kecil redup">Token disimpan di Script Properties — tidak pernah dikirim balik ke browser.</span></div></div><div class="form mt16">' +
      '<div class="fld" data-k="token"><label>Token Fonnte</label><div class="baris"><input class="inp" type="password" name="token" autocomplete="off" placeholder="' + e(c.token_ada ? c.token_samar + ' (tersimpan — kosongkan bila tidak diganti)' : 'Tempel token dari dashboard Fonnte') + '">' + (c.token_ada ? '<button type="button" class="btn kecil bahaya" data-k2="hapusToken">Hapus</button>' : '') + '</div><span class="bantu">Dapatkan di fonnte.com → Device → Token. Kosongkan = tidak berubah.</span><span class="galat"></span></div>' +
      '<div class="fld l3"><label class="saklar"><input type="checkbox" name="wa_aktif"' + (c.wa_aktif ? ' checked' : '') + '><i></i><span>Kirim WhatsApp otomatis</span></label></div><div class="fld l3"><label class="saklar"><input type="checkbox" name="email_aktif"' + (c.email_aktif ? ' checked' : '') + '><i></i><span>Kirim email otomatis</span></label></div>' +
      UI2.fld({ k: 'batch', label: 'Batch blast bawaan', tipe: 'select', opsi: [10, 20, 50], v: c.batch, l: 'l2', kosong: false }) + UI2.fld({ k: 'jeda', label: 'Jeda (detik)', v: c.jeda, l: 'l2' }) + UI2.fld({ k: 'nama_pengirim', label: 'Nama pengirim email', v: c.nama_pengirim, l: 'l2' }) +
      UI2.fld({ k: 'app_url', label: 'URL aplikasi (untuk link di pesan)', v: c.app_url, ph: 'https://username.github.io/swim-academy/', bantu: 'Dipakai untuk link portal orang tua & verifikasi QR.' }) +
      '<div class="fld"><label class="saklar"><input type="checkbox" name="deteksi_otomatis"' + (c.deteksi_otomatis ? ' checked' : '') + '><i></i><span>Deteksi nomor WA aktif otomatis (butuh paket Fonnte yang mendukung)</span></label></div>' +
      '<div class="fld"><b class="kecil">Matriks notifikasi</b><div class="tabel-wadah mt8"><table class="tabel responsif"><thead><tr><th>Kejadian</th><th>WA</th><th>Email</th><th></th></tr></thead><tbody>' + ev.map(function (x) { return '<tr><td data-l="Kejadian"><b class="kecil">' + e(x.label) + '</b><div class="kecil redup">' + (x.ke === 'owner' ? 'ke Owner' : 'ke orang tua/kontak') + '</div></td><td data-l="WA">' + UI2.saklar('wa_' + x.kode, x.wa, '', x.ke === 'owner') + '</td><td data-l="Email">' + UI2.saklar('em_' + x.kode, x.email) + '</td><td data-l=""><button type="button" class="btn kecil hantu" data-k2="tpl" data-ev="' + x.kode + '">' + ik('pensil', 'k') + 'Template</button></td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="fld"><button type="submit" class="btn primer">Simpan konfigurasi</button></div></div></form>' +
      '<div class="tumpuk" style="gap:16px"><div class="kartu pad"><b>Uji coba</b><div class="form mt12">' + UI2.fld({ k: 'tes_nomor', label: 'Nomor WA', ph: '08xxxxxxxxxx' }) + '<div class="fld"><div class="baris"><button type="button" class="btn kecil" data-k2="tesWa"' + (c.token_ada ? '' : ' disabled') + '>' + ik('wa', 'k') + 'Tes WA</button><button type="button" class="btn kecil" data-k2="device"' + (c.token_ada ? '' : ' disabled') + '>' + ik('hp', 'k') + 'Status device</button></div></div>' + UI2.fld({ k: 'tes_email', label: 'Email', v: c.email_owner, tipe: 'email' }) + '<div class="fld"><button type="button" class="btn kecil" data-k2="tesEmail">' + ik('surat', 'k') + 'Tes email</button><span class="bantu">Kuota email Google hari ini: ' + (c.email_kuota == null ? '-' : c.email_kuota) + '</span></div></div><div id="hasil-tes" class="mt8"></div></div>' +
      '<div class="kartu pad"><b>Cara kerja</b><ul class="kecil redup" style="padding-left:18px;margin:8px 0 0;line-height:1.7"><li>Pesan masuk antrean lalu dikirim di latar — aksi simpan tidak pernah menunggu WhatsApp.</li><li>Pemicu tiap 1 menit memproses antrean bila ada.</li><li>Gagal kirim tidak menggagalkan transaksi; bisa diulang dari tab Antrean.</li><li>Tanpa token, semua tombol WA tetap berfungsi lewat wa.me (manual).</li></ul></div></div></div>';
    var f = w.querySelector('#f-notif'), tpl = {};
    f.addEventListener('submit', function (ev2) {
      ev2.preventDefault(); var v = UI2.baca(f), mat = {};
      ev.forEach(function (x) { mat[x.kode] = { wa: !!v['wa_' + x.kode], email: !!v['em_' + x.kode], pesan: (tpl[x.kode] || {}).pesan || x.pesan, subjek: (tpl[x.kode] || {}).subjek || x.subjek }; });
      MR.UI.kerja(f.querySelector('[type=submit]'), function () { return API.T('notif.configSave', { token: v.token, wa_aktif: v.wa_aktif, email_aktif: v.email_aktif, batch: Number(v.batch), jeda: v.jeda, nama_pengirim: v.nama_pengirim, app_url: v.app_url, deteksi_otomatis: v.deteksi_otomatis, matriks: mat }); }, { form: f })
        .then(function () { MR.UI.toast('Konfigurasi notifikasi tersimpan.', 'ok'); R.muatUlang(); }).catch(function () { });
    });
    w.addEventListener('click', function (ev2) {
      var b = ev2.target.closest('[data-k2]'); if (!b) return; var k = b.dataset.k2, hasil = w.querySelector('#hasil-tes');
      if (k === 'hapusToken') MR.UI.konfirmasi({ judul: 'Hapus token Fonnte?', pesan: 'WhatsApp otomatis & blast dimatikan. Tombol WA manual tetap berfungsi.', ok: 'Hapus token', bahaya: true }).then(function (y) { if (y) API.T('notif.configSave', { token: '__HAPUS__', wa_aktif: false, email_aktif: c.email_aktif, batch: c.batch, jeda: c.jeda, nama_pengirim: c.nama_pengirim, app_url: c.app_url }).then(function () { MR.UI.toast('Token dihapus.', 'ok'); R.muatUlang(); }).catch(MR.UI.galat); });
      if (k === 'tesWa') MR.UI.kerja(b, function () { return API.T('wa.tes', { nomor: w.querySelector('[name=tes_nomor]').value }); }).then(function () { hasil.innerHTML = '<div class="peringatan ok">' + ik('cekBulat') + '<div><b>Pesan tes terkirim</b>Periksa WhatsApp tujuan.</div></div>'; }).catch(function () { });
      if (k === 'tesEmail') MR.UI.kerja(b, function () { return API.T('email.tes', { email: w.querySelector('[name=tes_email]').value }); }).then(function () { hasil.innerHTML = '<div class="peringatan ok">' + ik('cekBulat') + '<div><b>Email tes terkirim</b></div></div>'; }).catch(function () { });
      if (k === 'device') MR.UI.kerja(b, function () { return API.Q('wa.device', {}, { segar: true }); }).then(function (r) { hasil.innerHTML = '<div class="peringatan ' + (r.device_status === 'connect' ? 'ok' : 'warn') + '">' + ik('hp') + '<div><b>Device ' + e(r.device || '-') + ' · ' + e(r.device_status || r.pesan || '-') + '</b>Paket ' + e(r.package || '-') + ' · kuota ' + e(r.quota || '-') + ' · berlaku ' + e(r.expired || '-') + '</div></div>'; }).catch(function () { });
      if (k === 'tpl') {
        var x = c.matriks[b.dataset.ev], cur = tpl[x.kode] || { pesan: x.pesan, subjek: x.subjek };
        var m = MR.UI.modal({ judul: 'Template · ' + x.label, isi: '<form class="form">' + UI2.fld({ k: 'subjek', label: 'Subjek email', v: cur.subjek }) + UI2.fld({ k: 'pesan', label: 'Pesan', tipe: 'area', baris: 6, v: cur.pesan }) + '<div class="fld"><span class="bantu">Variabel: {nama} {institusi} {peserta} {paket} {kode} {pin} {link} {terpakai} {total} {tanggal} {pelatih} {sisa} {nomor} {nominal}</span></div></form>',
          kaki: '<button type="button" class="btn" data-x="bawaan">Kembalikan bawaan</button><button type="button" class="btn primer" data-ok>Pakai template</button>' });
        m.on('click', '[data-x=bawaan]', function () { m.el.querySelector('[name=pesan]').value = x.pesanBawaan; m.el.querySelector('[name=subjek]').value = x.subjekBawaan; });
        m.el.querySelector('[data-ok]').onclick = function () { tpl[x.kode] = UI2.baca(m.el.querySelector('form')); m.tutup(); MR.UI.toast('Template diubah — klik Simpan konfigurasi untuk menyimpan.', 'info'); };
      }
    });
  }
})(window, document);
