/* =====================================================================
 * Dokumen.gs — renderer gas-doc-engine untuk Swim Academy
 * Template = Google Docs (kwitansi, slip honor), Sheets (laporan kas),
 * Slides (sertifikat). Placeholder {{KUNCI|pengubah}}, blok {{#DAFTAR}}.
 * Master template TIDAK pernah disentuh: selalu makeCopy → isi → PDF.
 * Fungsi murni (pindai, pengubah, terbilang) ada di Inti.de (Inti.gs).
 * ===================================================================== */

/* ---------- Pindai template ---------- */
function pindaiTemplate_(fileId) {
  var f = DriveApp.getFileById(fileId), mime = f.getMimeType(), bagian = [];
  if (mime === MimeType.GOOGLE_DOCS) {
    var d = DocumentApp.openById(fileId); bagian.push(d.getBody().getText());
    if (d.getHeader()) bagian.push(d.getHeader().getText()); if (d.getFooter()) bagian.push(d.getFooter().getText());
    return { engine: 'docs', teks: bagian.join('\n') };
  }
  if (mime === MimeType.GOOGLE_SHEETS) {
    SpreadsheetApp.openById(fileId).getSheets().forEach(function (sh) { var r = sh.getDataRange(); bagian.push(r.getDisplayValues().map(function (b) { return b.join('\t'); }).join('\n')); });
    return { engine: 'sheets', teks: bagian.join('\n') };
  }
  if (mime === MimeType.GOOGLE_SLIDES) {
    SlidesApp.openById(fileId).getSlides().forEach(function (sl) { sl.getShapes().forEach(function (sp) { bagian.push(sp.getText().asString()); }); });
    return { engine: 'slides', teks: bagian.join('\n') };
  }
  throw new Error('Format belum didukung (' + mime + '). Simpan sebagai Google Docs/Sheets/Slides.');
}

/* ---------- Render satu dokumen (dipanggil antrean DE_Antrean) ---------- */
function renderDokumen_(o) {
  var dok = o.dok, tpl = o.template;
  if (!tpl || !tpl.file_id || /^demo-/.test(tpl.file_id)) throw new Error('Template ' + dok.template_kode + ' belum diatur (menu Dokumen → Template).');
  var data = Object.assign({}, o.isian), ttd = o.penandatangan[0] || {}, bl = String(dok.terbit || '').slice(0, 10);
  data.NOMOR = dok.nomor; data.TANGGAL = Inti.util.tglIndo(bl); data.TAHUN = bl.slice(0, 4); data.KODE_VERIFIKASI = dok.kode_verifikasi; data.URL_VERIFIKASI = o.url_verifikasi;
  data.NAMA_PEJABAT_1 = data.NAMA_PEJABAT = ttd.nama || ''; data.JABATAN_1 = data.JABATAN = ttd.jabatan || '';
  var qr = qrBlob_(o.url_verifikasi || dok.kode_verifikasi), gambar = { QR: { blob: qr, lebar: 86 }, QR_1: { blob: qr, lebar: 86 }, TTD_1: { blob: qr, lebar: 70 }, TTD: { blob: qr, lebar: 70 } };
  var bulan = bl.slice(0, 7), folder = folderApp_('Dokumen/' + bulan), nama = (dok.nomor || dok.id).replace(/[\/\\]/g, '-') + ' ' + dok.judul;
  var skema = { bidang: JSON.parse(tpl.bidang || '[]') }, salinan, pdf;
  if (tpl.engine === 'docs') salinan = renderDocs_(tpl.file_id, folder, nama, data, skema, gambar);
  else if (tpl.engine === 'sheets') salinan = renderSheets_(tpl.file_id, folder, nama, data, skema);
  else salinan = renderSlides_(tpl.file_id, folder, nama, data, gambar);
  pdf = tpl.engine === 'sheets' ? eksporSheetsPdf_(salinan.getId()) : salinan.getAs(MimeType.PDF);
  var berkas = folder.createFile(pdf.setName(nama + '.pdf'));
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, berkas.getBlob().getBytes()).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
  salinan.setTrashed(true);
  return { berkas: { pdf: berkas.getId(), nama: nama + '.pdf' }, hash: hash };
}
function qrBlob_(teks) {
  var q = qrcode(0, 'M'); q.addData(String(teks)); q.make();
  return Utilities.newBlob(Utilities.base64Decode(q.createDataURL(6, 8).split(',')[1]), 'image/gif', 'qr.gif');
}

/* ---------- Docs ---------- */
function reDocs_(kunci) { return '(?i)\\{\\{\\s*[#?/]?\\s*' + kunci.replace(/\./g, '\\.') + '\\s*(\\|[^}]*)?\\}\\}'; }
function gaya_(el, off) { var a = el.getAttributes(off), o = {}; Object.keys(a).forEach(function (k) { if (a[k] !== null && a[k] !== undefined) o[k] = a[k]; }); return o; }
function gantiDocs_(wilayah, data) {
  var r, guard = 0;
  while ((r = wilayah.findText('\\{\\{[^}]+\\}\\}')) && guard++ < 5000) {
    var el = r.getElement().asText(), a = r.getStartOffset(), b = r.getEndOffsetInclusive(), p = Inti.de.pindai(el.getText().slice(a, b + 1))[0];
    var nilai = (!p || p.jenis) ? '' : Inti.de.pengubah(data[p.kunci], p.pengubah), g = gaya_(el, a);
    el.deleteText(a, b);
    if (nilai) { el.insertText(a, nilai); el.setAttributes(a, a + nilai.length - 1, g); }
  }
}
function sisipGambarDocs_(wilayah, kunci, blob, lebar) {
  var r;
  while ((r = wilayah.findText(reDocs_(kunci)))) {
    var el = r.getElement().asText(), a = r.getStartOffset(); el.deleteText(a, r.getEndOffsetInclusive());
    var par = el.getParent(); while (par.getType() !== DocumentApp.ElementType.PARAGRAPH && par.getType() !== DocumentApp.ElementType.LIST_ITEM) par = par.getParent();
    var img = par.insertInlineImage(par.getChildIndex(el) + (a > 0 ? 1 : 0), blob), rasio = img.getHeight() / img.getWidth();
    img.setWidth(lebar || 72).setHeight(Math.round((lebar || 72) * rasio));
  }
}
function barisBerulangDocs_(body, kunci, daftar, umum) {
  var r = body.findText(reDocs_(kunci)); if (!r) return;
  var row = r.getElement(); while (row && row.getType() !== DocumentApp.ElementType.TABLE_ROW) row = row.getParent(); if (!row) return;
  var tabel = row.getParent(), idx = tabel.getChildIndex(row);
  (daftar || []).forEach(function (item, i) {
    var salin = tabel.insertTableRow(idx + 1 + i, row.copy()), d = Object.assign({}, umum);
    Object.keys(item).forEach(function (k) { d[kunci + '.' + k.toUpperCase()] = item[k]; }); d.NO = String(i + 1); d[kunci] = '';
    gantiDocs_(salin, d);
  });
  tabel.removeRow(idx);
}
function renderDocs_(templateId, folder, nama, data, skema, gambar) {
  var salinan = DriveApp.getFileById(templateId).makeCopy(nama, folder), doc = DocumentApp.openById(salinan.getId()), body = doc.getBody();
  (skema.bidang || []).forEach(function (b) { if (b.tipe === 'daftar') barisBerulangDocs_(body, b.kunci, data[b.kunci] || [], data); });
  [body, doc.getHeader(), doc.getFooter()].filter(function (x) { return x; }).forEach(function (w) {
    Object.keys(gambar || {}).forEach(function (k) { sisipGambarDocs_(w, k, gambar[k].blob, gambar[k].lebar); });
    gantiDocs_(w, data);
  });
  doc.saveAndClose(); return salinan;
}

/* ---------- Sheets ---------- */
function renderSheets_(templateId, folder, nama, data, skema) {
  var salinan = DriveApp.getFileById(templateId).makeCopy(nama, folder), ss = SpreadsheetApp.openById(salinan.getId()), POLA = Inti.de.POLA;
  ss.getSheets().forEach(function (sh) {
    (skema.bidang || []).filter(function (b) { return b.tipe === 'daftar'; }).forEach(function (b) { barisBerulangSheets_(sh, b.kunci, data[b.kunci] || []); });
    var rg = sh.getDataRange(), nilai = rg.getValues(), ubah = false;
    var hasil = nilai.map(function (baris) { return baris.map(function (v) {
      if (typeof v !== 'string' || v.indexOf('{{') < 0) return v; ubah = true;
      var p = Inti.de.pindai(v);
      if (p.length === 1 && p[0].mentah === v.trim() && !p[0].pengubah && typeof data[p[0].kunci] === 'number') return data[p[0].kunci];
      return v.replace(POLA, function (m, j, k, peng) { return j ? '' : Inti.de.pengubah(data[k.toUpperCase()], peng); });
    }); });
    if (ubah) rg.setValues(hasil);
  });
  SpreadsheetApp.flush(); return salinan;
}
function barisBerulangSheets_(sh, kunci, daftar) {
  var tf = sh.createTextFinder('{{#' + kunci).matchCase(false).findNext(); if (!tf) return;
  var r0 = tf.getRow(), kol = sh.getLastColumn(), pola = sh.getRange(r0, 1, 1, kol), isi = pola.getValues()[0];
  if (daftar.length > 1) sh.insertRowsAfter(r0, daftar.length - 1);
  var keluar = daftar.map(function (item, i) { return isi.map(function (sel) {
    if (typeof sel !== 'string') return sel;
    var p = Inti.de.pindai(sel), satu = p.length === 1 || (p.length === 2 && p[0].jenis === '#');
    var tunggal = p.filter(function (x) { return !x.jenis; })[0];
    if (satu && tunggal && tunggal.kunci.indexOf(kunci + '.') === 0 && !tunggal.pengubah) { var v = item[tunggal.kunci.slice(kunci.length + 1)]; if (typeof v === 'number') return v; }
    return sel.replace(Inti.de.POLA, function (m, j, k, peng) { k = k.toUpperCase(); if (j) return ''; if (k === 'NO') return String(i + 1); var sub = k.indexOf(kunci + '.') === 0 ? k.slice(kunci.length + 1) : null; return sub ? Inti.de.pengubah(item[sub], peng) : m; });
  }); });
  if (daftar.length > 1) pola.copyTo(sh.getRange(r0 + 1, 1, daftar.length - 1, kol), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  if (keluar.length) sh.getRange(r0, 1, keluar.length, kol).setValues(keluar); else sh.deleteRow(r0);
}
function eksporSheetsPdf_(id) {
  var url = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=pdf&size=A4&portrait=true&fitw=true&gridlines=false&printtitle=false&sheetnames=false';
  var r = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Ekspor PDF gagal (' + r.getResponseCode() + ').');
  return r.getBlob();
}

/* ---------- Slides ---------- */
function renderSlides_(templateId, folder, nama, data, gambar) {
  var salinan = DriveApp.getFileById(templateId).makeCopy(nama, folder), pres = SlidesApp.openById(salinan.getId()), semuaP = {};
  pres.getSlides().forEach(function (sl) { sl.getShapes().forEach(function (sp) {
    var t = sp.getText().asString().trim(), p = Inti.de.pindai(t);
    if (p.length === 1 && p[0].mentah === t && gambar[p[0].kunci]) { sp.replaceWithImage(gambar[p[0].kunci].blob); return; }
    p.forEach(function (x) { semuaP[x.mentah] = x; });
  }); });
  Object.keys(semuaP).forEach(function (m) { var x = semuaP[m]; pres.replaceAllText(m, Inti.de.pengubah(data[x.kunci], x.pengubah)); });
  pres.saveAndClose(); return salinan;
}

/* ---------- Template bawaan (dibuat saat setup; Owner boleh mengedit desainnya di Drive) ---------- */
function buatTemplateBawaan_(lewatiBilaAda) {
  var folder = folderApp_('Template'), hasil = {};
  function ada(nama) { var it = folder.getFilesByName(nama); return it.hasNext() ? it.next() : null; }
  var NAVY = '#1E2A4A';
  /* Kwitansi (Docs) */
  var fK = ada('Template Kwitansi');
  if (!fK) {
    var d = DocumentApp.create('Template Kwitansi'), b = d.getBody(); DriveApp.getFileById(d.getId()).moveTo(folder);
    b.appendParagraph('{{INSTITUSI_NAMA}}').setHeading(DocumentApp.ParagraphHeading.HEADING1).editAsText().setForegroundColor(NAVY);
    b.appendParagraph('{{INSTITUSI_ALAMAT}} · {{INSTITUSI_KONTAK}}').editAsText().setFontSize(9).setForegroundColor('#475569');
    b.appendParagraph('KWITANSI PEMBAYARAN').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    b.appendParagraph('Nomor: {{NOMOR}}    Tanggal: {{TANGGAL}}');
    b.appendTable([['Telah terima dari', '{{NAMA_PEMBAYAR}}'], ['Uang sejumlah', '{{NOMINAL|rupiah}}'], ['Terbilang', '{{NOMINAL|terbilang:rupiah|judul}}'], ['Untuk pembayaran', '{{PERUNTUKAN}}'],
      ['Peserta', '{{PESERTA}}'], ['Paket', '{{PAKET}} ({{KATEGORI}})'], ['Metode', '{{METODE}}'], ['Tanggal bayar', '{{TANGGAL_BAYAR|tanggal}}'], ['ID transaksi', '{{ID_TRANSAKSI}}']]);
    b.appendParagraph('');
    b.appendParagraph('{{QR}}'); b.appendParagraph('{{NAMA_PEJABAT_1}}').editAsText().setBold(true); b.appendParagraph('{{JABATAN_1}}');
    b.appendParagraph('Pindai QR atau buka halaman verifikasi dengan kode {{KODE_VERIFIKASI}} untuk memastikan keaslian kwitansi ini.').editAsText().setFontSize(8).setForegroundColor('#475569');
    d.saveAndClose(); fK = DriveApp.getFileById(d.getId());
  }
  /* Slip honor (Docs) */
  var fS = ada('Template Slip Honor');
  if (!fS) {
    var d2 = DocumentApp.create('Template Slip Honor'), b2 = d2.getBody(); DriveApp.getFileById(d2.getId()).moveTo(folder);
    b2.appendParagraph('{{INSTITUSI_NAMA}} · SLIP HONOR PELATIH').setHeading(DocumentApp.ParagraphHeading.HEADING1).editAsText().setForegroundColor(NAVY);
    b2.appendParagraph('Nomor {{NOMOR}} · Periode {{PERIODE}}');
    b2.appendParagraph('Pelatih: {{NAMA_PELATIH}} ({{LISENSI}})').editAsText().setBold(true);
    var tb = b2.appendTable([['Kategori sesi', 'Sesi', 'Tarif', 'Subtotal'], ['{{#RINCIAN}}{{RINCIAN.KATEGORI}}', '{{RINCIAN.SESI}}', '{{RINCIAN.TARIF|rupiah}}', '{{RINCIAN.SUBTOTAL|rupiah}}']]);
    tb.getRow(0).editAsText().setBold(true);
    b2.appendParagraph('Total sesi dihitung: {{TOTAL_SESI}}'); b2.appendParagraph('Total honor: {{TOTAL|rupiah}} ({{TOTAL|terbilang:rupiah}})').editAsText().setBold(true);
    b2.appendParagraph('{{TANGGAL}}'); b2.appendParagraph('{{QR}}'); b2.appendParagraph('{{NAMA_PEJABAT_1}} — {{JABATAN_1}}');
    d2.saveAndClose(); fS = DriveApp.getFileById(d2.getId());
  }
  /* Laporan kas (Sheets) */
  var fL = ada('Template Laporan Kas');
  if (!fL) {
    var ss = SpreadsheetApp.create('Template Laporan Kas'), sh = ss.getSheets()[0]; DriveApp.getFileById(ss.getId()).moveTo(folder);
    sh.getRange('A1:E1').merge().setValue('{{INSTITUSI_NAMA}} — LAPORAN ARUS KAS {{PERIODE}}').setFontWeight('bold').setFontSize(14).setFontColor(NAVY);
    sh.getRange('A2:E2').merge().setValue('Nomor {{NOMOR}} · dicetak {{TANGGAL}}');
    sh.getRange('A3').setValue('Saldo awal'); sh.getRange('B3').setValue('{{SALDO_AWAL}}').setNumberFormat('"Rp"#,##0');
    sh.getRange('A5:E5').setValues([['Tanggal', 'Kategori', 'Uraian', 'Masuk', 'Keluar']]).setFontWeight('bold').setBackground(NAVY).setFontColor('#FFFFFF');
    sh.getRange('A6:E6').setValues([['{{#TRX}}{{TRX.TANGGAL|tanggal}}', '{{TRX.KATEGORI}}', '{{TRX.URAIAN}}', '{{TRX.MASUK}}', '{{TRX.KELUAR}}']]);
    sh.getRange('D6:E6').setNumberFormat('"Rp"#,##0');
    sh.getRange('C8:E8').setValues([['Total', '{{MASUK}}', '{{KELUAR}}']]).setFontWeight('bold'); sh.getRange('D8:E8').setNumberFormat('"Rp"#,##0');
    sh.getRange('C9:D9').setValues([['Saldo akhir', '{{SALDO_AKHIR}}']]).setFontWeight('bold'); sh.getRange('D9').setNumberFormat('"Rp"#,##0');
    sh.getRange('A11').setValue('Disetujui: {{NAMA_PEJABAT_1}} ({{JABATAN_1}}) · kode verifikasi {{KODE_VERIFIKASI}}');
    sh.setColumnWidth(3, 320); fL = DriveApp.getFileById(ss.getId());
  }
  /* Sertifikat (Slides) */
  var fT = ada('Template Sertifikat');
  if (!fT) {
    var pr = SlidesApp.create('Template Sertifikat'), sl = pr.getSlides()[0]; DriveApp.getFileById(pr.getId()).moveTo(folder);
    sl.getPageElements().forEach(function (e) { e.remove(); });
    sl.getBackground().setSolidFill('#F1F5F9');
    var W = pr.getPageWidth(), H = pr.getPageHeight();
    var band = sl.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, W, 70); band.getFill().setSolidFill(NAVY); band.getBorder().setTransparent();
    function teks(t, x, y, w, h, ukuran, tebal, warna) { var s = sl.insertTextBox(t, x, y, w, h), r = s.getText().getTextStyle(); r.setFontSize(ukuran).setBold(!!tebal).setForegroundColor(warna || '#1E293B').setFontFamily('Plus Jakarta Sans'); s.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER); return s; }
    teks('{{INSTITUSI_NAMA}}', 0, 18, W, 40, 20, true, '#FFFFFF');
    teks('SERTIFIKAT', 0, 95, W, 40, 30, true, '#0369A1');
    teks('Nomor {{NOMOR}}', 0, 135, W, 24, 11, false, '#475569');
    teks('diberikan kepada', 0, 165, W, 24, 13, false, '#475569');
    teks('{{NAMA_SISWA|kapital}}', 0, 190, W, 50, 32, true, NAVY);
    teks('{{PREDIKAT}} — {{PAKET}} ({{KATEGORI}}), {{JUMLAH_HADIR}} sesi hadir bersama {{PELATIH}} di {{KOLAM}}, {{PERIODE}}.', 60, 245, W - 120, 50, 13, false, '#1E293B');
    teks('{{TANGGAL}}\n{{NAMA_PEJABAT_1}}\n{{JABATAN_1}}', W - 260, H - 120, 220, 70, 11, false, '#1E293B');
    var q = sl.insertTextBox('{{QR}}', 50, H - 125, 85, 85); q.getText().getTextStyle().setFontSize(8);
    pr.saveAndClose(); fT = DriveApp.getFileById(pr.getId());
  }
  [['KWITANSI', fK], ['SLIP_HONOR', fS], ['LAPORAN_KAS', fL], ['SERTIFIKAT', fT]].forEach(function (x) { var p = pindaiTemplate_(x[1].getId()); hasil[x[0]] = { file_id: x[1].getId(), engine: p.engine, teks: p.teks }; });
  return hasil;
}
