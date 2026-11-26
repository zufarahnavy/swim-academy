/* =====================================================================
 * SWIM ACADEMY — Backend Google Apps Script (REST API JSON)
 * Kode.gs : pintu masuk doPost/doGet, adaptor Google Sheets ber-cache,
 *           lingkungan (env) untuk Inti, setup idempoten, trigger, backup.
 * Semua aturan bisnis ada di Inti.gs (identik dengan js/inti.js di frontend).
 *
 * Deploy  : Web App · Execute as: Me · Who has access: Anyone
 * Rahasia : HANYA di Script Properties (lihat Panduan). Tidak ada rahasia di kode ini.
 * ===================================================================== */

var PROPS = PropertiesService.getScriptProperties();
var _PROP_MEMO = null;
function prop_(k, d) { if (!_PROP_MEMO) _PROP_MEMO = PROPS.getProperties(); var v = _PROP_MEMO[k]; return v === undefined || v === null || v === '' ? (d === undefined ? '' : d) : v; }
function setProp_(k, v) { PROPS.setProperty(k, String(v)); if (_PROP_MEMO) _PROP_MEMO[k] = String(v); }
function delProp_(k) { PROPS.deleteProperty(k); if (_PROP_MEMO) delete _PROP_MEMO[k]; }

/* ---------- Pintu masuk HTTP ---------- */
function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); }
  catch (err) { return json_({ ok: false, error: { message: 'Permintaan tidak valid.', code: 'BAD_REQUEST' } }); }
  if (!prop_('SPREADSHEET_ID')) return json_({ ok: false, error: { message: 'Backend belum di-setup. Jalankan setupAppEnvironment() di editor Apps Script.', code: 'SETUP' } });
  return json_(Inti.jalankan(env_(), { action: req.action, payload: req.payload || {}, token: req.token || '' }));
}
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.w) { hangatkan_(); return json_({ ok: true, hangat: true, v: Inti.VERSI }); }
    if (p.action === 'publicSettings') {
      var s = Inti.snapshotPublikEnv(env_());
      if (!s.cek.ok) return json_({ ok: false, error: { message: 'Snapshot ditolak server: ' + s.cek.pesan, code: 'SNAPSHOT' } });
      return json_({ ok: true, data: s.snapshot });
    }
    if (p.action === 'publicAset') return json_(asetPublik_(p.jenis));
    return json_({ ok: true, app: 'Swim Academy API', v: Inti.VERSI, waktu: Inti.util.waktuWIB(Date.now()) });
  } catch (err) { return json_({ ok: false, error: { message: err.message, code: 'SERVER' } }); }
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- Cache besar dipecah (batas 100 KB per nilai) ---------- */
var CacheX = {
  SZ: 90000,
  c: function () { return CacheService.getScriptCache(); },
  get: function (key) {
    try {
      var c = this.c(), head = c.get(key); if (head == null) return null;
      if (head.indexOf('__chunks:') !== 0) return JSON.parse(head);
      var n = +head.slice(9), keys = []; for (var i = 0; i < n; i++) keys.push(key + '#' + i);
      var parts = c.getAll(keys), s = '';
      for (var j = 0; j < n; j++) { if (parts[keys[j]] == null) return null; s += parts[keys[j]]; }
      return JSON.parse(s);
    } catch (e) { return null; }
  },
  put: function (key, val, ttl) {
    try {
      var s = JSON.stringify(val), c = this.c();
      if (s.length <= this.SZ) { c.put(key, s, ttl); return true; }
      var n = Math.ceil(s.length / this.SZ); if (n > 25) return false;
      var m = {}; for (var i = 0; i < n; i++) m[key + '#' + i] = s.substr(i * this.SZ, this.SZ);
      c.putAll(m, ttl); c.put(key, '__chunks:' + n, ttl);   // kepala ditulis TERAKHIR
      return true;
    } catch (e) { return false; }
  }
};

/* ---------- Adaptor Google Sheets: baca 1× per tabel, cache berversi, tulis blok ---------- */
var DB = {
  _ss: null, _memo: {}, _sh: {}, _hdr: {}, _sentuh: {}, _kedalaman: 0,
  ss: function () { return this._ss || (this._ss = SpreadsheetApp.openById(prop_('SPREADSHEET_ID'))); },
  sheet: function (t) {
    if (this._sh[t]) return this._sh[t];
    var sh = this.ss().getSheetByName(t); if (!sh) throw new Error('Sheet "' + t + '" belum ada. Jalankan setupAppEnvironment().');
    return (this._sh[t] = sh);
  },
  header: function (t) {
    if (this._hdr[t]) return this._hdr[t];
    var sh = this.sheet(t), h = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
    return (this._hdr[t] = h);
  },
  versi: function (t) { var c = CacheService.getScriptCache(), v = c.get('ver_' + t); if (!v) { v = String(Date.now()); c.put('ver_' + t, v, 21600); } return v; },
  naikkan_: function (t) { CacheService.getScriptCache().put('ver_' + t, String(Date.now()) + Math.floor(Math.random() * 1000), 21600); },
  normalisasi_: function (t, nilai) {
    var sk = Inti.SKEMA[t], angka = sk.angka || [];
    if (angka.indexOf(arguments[2]) >= 0) return nilai === '' || nilai === null ? 0 : Number(nilai) || 0;
    if (nilai instanceof Date) {
      var jam = nilai.getHours() + nilai.getMinutes() + nilai.getSeconds();
      if (nilai.getFullYear() < 1900) return Utilities.formatDate(nilai, 'Asia/Jakarta', 'HH:mm');
      return Utilities.formatDate(nilai, 'Asia/Jakarta', jam ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd');
    }
    return nilai === null || nilai === undefined ? '' : String(nilai);
  },
  keObjek_: function (t, h, baris, mulai) {
    var self = this, sk = Inti.SKEMA[t], angka = sk.angka || [];
    return baris.map(function (r, i) {
      var o = { _r: mulai + i };
      h.forEach(function (k, j) { if (!k) return; var v = r[j];
        if (angka.indexOf(k) >= 0) o[k] = v === '' || v === null ? 0 : Number(v) || 0;
        else if (v instanceof Date) o[k] = self.normalisasi_(t, v);
        else o[k] = v === null || v === undefined ? '' : String(v);
        if (/kontak|no_wa|tujuan/.test(k) && /^8\d{7,}$/.test(o[k])) o[k] = '0' + o[k];   // Sheets menghapus 0 di depan
      });
      return o;
    }).filter(function (o) { return o[sk.id] !== '' && o[sk.id] !== undefined; });
  },
  semua: function (t, opsi) {
    if (opsi && opsi.ekor) {
      var sh = this.sheet(t), last = sh.getLastRow(); if (last < 2) return [];
      var mulai = Math.max(2, last - opsi.ekor + 1), h = this.header(t);
      return this.keObjek_(t, h, sh.getRange(mulai, 1, last - mulai + 1, h.length).getValues(), mulai);
    }
    if (this._memo[t]) return this._memo[t].map(function (r) { return Object.assign({}, r); });
    var tersentuh = !!this._sentuh[t], key = 'tbl_' + t + '_' + this.versi(t), rows = tersentuh ? null : CacheX.get(key);   // tabel yang sudah ditulis di eksekusi ini dibaca langsung dari sheet
    if (!rows) {
      var s2 = this.sheet(t), l = s2.getLastRow(), hh = this.header(t);
      rows = l < 2 ? [] : this.keObjek_(t, hh, s2.getRange(2, 1, l - 1, hh.length).getValues(), 2);
      if (!Inti.SKEMA[t].besar && !tersentuh) CacheX.put(key, rows, 21600);
    }
    this._memo[t] = rows;
    return rows.map(function (r) { return Object.assign({}, r); });
  },
  nilaiTulis_: function (v) { if (typeof v === 'string' && /^[=+\-@]/.test(v) && !/^[+-]?\d/.test(v)) return "'" + v; return v === undefined || v === null ? '' : v; },
  tambah: function (t, rows) {
    if (!rows.length) return;
    var sh = this.sheet(t), h = this.header(t), self = this, last = sh.getLastRow(), sk = Inti.SKEMA[t];
    var m = rows.map(function (r) { return h.map(function (k) { var v = r[k]; if (v === undefined) v = (sk.angka || []).indexOf(k) >= 0 ? 0 : ''; return self.nilaiTulis_(v); }); });
    sh.getRange(last + 1, 1, m.length, h.length).setValues(m);
    if (this._memo[t]) rows.forEach(function (r, i) { var o = { _r: last + 1 + i }; h.forEach(function (k) { o[k] = r[k] === undefined ? ((sk.angka || []).indexOf(k) >= 0 ? 0 : '') : ((sk.angka || []).indexOf(k) >= 0 ? Number(r[k]) || 0 : String(r[k])); }); self._memo[t].push(o); });
    if (t === 'AntrianNotif' || t === 'DE_Antrean') tandaiAntrian_(true);
    this._sentuh[t] = 1;
  },
  ubah: function (t, rows) {
    if (!rows.length) return;
    var sk = Inti.SKEMA[t], h = this.header(t), sh = this.sheet(t), self = this;
    var data = sk.besar ? this.semua(t, { ekor: 6000 }) : (this.semua(t), this._memo[t]);
    var idx = {}; data.forEach(function (r) { idx[r[sk.id]] = r; });
    var ubahan = [];
    rows.forEach(function (r) {
      var lama = idx[r[sk.id]]; if (!lama) return;
      Object.keys(r).forEach(function (k) { if (h.indexOf(k) >= 0) lama[k] = (sk.angka || []).indexOf(k) >= 0 ? Number(r[k]) || 0 : String(r[k] == null ? '' : r[k]); });
      ubahan.push(lama);
    });
    if (!ubahan.length) return;
    ubahan.sort(function (a, b) { return a._r - b._r; });
    var grup = [], g = [ubahan[0]];
    for (var i = 1; i < ubahan.length; i++) { if (ubahan[i]._r - g[g.length - 1]._r <= 40) g.push(ubahan[i]); else { grup.push(g); g = [ubahan[i]]; } }
    grup.push(g);
    grup.forEach(function (gg) {
      var r0 = gg[0]._r, r1 = gg[gg.length - 1]._r, blok = sh.getRange(r0, 1, r1 - r0 + 1, h.length).getValues();
      gg.forEach(function (o) { blok[o._r - r0] = h.map(function (k) { return self.nilaiTulis_(o[k] === undefined ? '' : o[k]); }); });
      sh.getRange(r0, 1, blok.length, h.length).setValues(blok);
    });
    this._sentuh[t] = 1;
  },
  ganti: function (t, rows) {
    var sh = this.sheet(t), h = this.header(t), self = this, last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, h.length).clearContent();
    delete this._memo[t];
    if (rows.length) sh.getRange(2, 1, rows.length, h.length).setValues(rows.map(function (r) { return h.map(function (k) { return self.nilaiTulis_(r[k] === undefined ? '' : r[k]); }); }));
    this._sentuh[t] = 1;
  },
  segarkan: function () { this._memo = {}; },
  selesaiTulis_: function () {
    var t = Object.keys(this._sentuh); if (!t.length) return;
    SpreadsheetApp.flush();
    var self = this; t.forEach(function (x) { self.naikkan_(x); delete self._memo[x]; });
    this._sentuh = {};
  }
};

/* ---------- Lingkungan untuk Inti ---------- */
var _ENV = null;
function env_() {
  if (_ENV) return _ENV;
  var IZIN_RAHASIA_TULIS = ['FONNTE_TOKEN'], IZIN_RAHASIA_BACA = ['PEPPER', 'SYNC_SECRET', 'FONNTE_TOKEN', 'GITHUB_TOKEN'];
  _ENV = {
    mode: 'gas', db: DB,
    sekarang: function () { return Date.now(); },
    sha256: function (s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); },
    hmac: function (s) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, tokenSecret_(), Utilities.Charset.UTF_8)).replace(/=+$/, ''); },
    acak: acak_,
    kunci: function (fn) {
      if (DB._kedalaman > 0) return fn();
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(25000)) throw new Error('Server sedang sibuk menyimpan data lain. Coba lagi beberapa detik lagi.');
      DB._kedalaman++; DB.segarkan();
      try { return fn(); } finally { DB._kedalaman--; try { DB.selesaiTulis_(); } finally { lock.releaseLock(); } }
    },
    rahasia: function (k) { return IZIN_RAHASIA_BACA.indexOf(k) >= 0 ? prop_(k) : ''; },
    setRahasia: function (k, v) { if (IZIN_RAHASIA_TULIS.indexOf(k) < 0) throw new Error('Kunci rahasia tidak diizinkan.'); if (v) setProp_(k, v); else delProp_(k); },
    cacheGet: function (k) { return CacheService.getScriptCache().get(k); },
    cachePut: function (k, v, ttl) { CacheService.getScriptCache().put(k, String(v), ttl || 600); },
    versiTabel: function (list) { return list.map(function (t) { return DB.versi(t); }).join('.'); },
    simpanBerkas: simpanBerkas_,
    urlBerkas: function (id, publik) { return !id ? '' : publik ? 'https://drive.google.com/file/d/' + id + '/view' : 'berkas:' + id; },
    ambilBerkas: ambilBerkas_,
    dispatchGitHub: dispatchGitHub_,
    waKirim: fonnteKirimBanyak_, waValidasi: fonnteValidasi_, waDevice: fonnteDevice_,
    emailKirim: kirimEmail_, emailKuota: function () { return MailApp.getRemainingDailyQuota(); },
    htmlKePdf: function (html, judul) { var b = Utilities.newBlob(html, 'text/html', 'laporan.html').getAs('application/pdf'); return Utilities.base64Encode(b.getBytes()); },
    renderDokumen: renderDokumen_, pindaiTemplate: pindaiTemplate_, buatTemplateBawaan: buatTemplateBawaan_,
    pasangTriggerNotif: function () { pasangTrigger_(); }
  };
  return _ENV;
}
function tokenSecret_() { var s = prop_('TOKEN_SECRET'); if (!s) { s = acak_(64); setProp_('TOKEN_SECRET', s); } return s; }
function acak_(n, huruf) {
  huruf = huruf || 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  var s = '';
  while (s.length < n) Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid()).forEach(function (b) { if (s.length < n) s += huruf[(b & 0xff) % huruf.length]; });
  return s;
}
function tandaiAntrian_(ada) { CacheService.getScriptCache().put('ANTRIAN_ADA', ada ? '1' : '0', 21600); if (ada) setProp_('ANTRIAN_ADA', '1'); else delProp_('ANTRIAN_ADA'); }

/* ---------- Drive ---------- */
function folderApp_(jalur) {
  var root = DriveApp.getFolderById(prop_('ROOT_FOLDER_ID')), f = root;
  String(jalur || '').split('/').filter(String).forEach(function (n) { var it = f.getFoldersByName(n); f = it.hasNext() ? it.next() : f.createFolder(n); });
  return f;
}
function simpanBerkas_(o) {
  var blob = Utilities.newBlob(Utilities.base64Decode(o.base64), o.mime, o.nama), f = folderApp_(o.folder).createFile(blob);
  if (o.publik || /^(Logo|Materi)/.test(o.folder)) f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var publik = o.publik || /^(Logo|Materi)/.test(o.folder);
  return { id: f.getId(), url: publik ? (/^image\//.test(o.mime) ? 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w512' : 'https://drive.google.com/file/d/' + f.getId() + '/view') : 'berkas:' + f.getId() };
}
/* Hanya berkas di dalam folder aplikasi yang boleh diambil (bukti bayar, PDF dokumen) */
function ambilBerkas_(id) {
  var f; try { f = DriveApp.getFileById(id); } catch (e) { throw new Error('Berkas tidak ditemukan.'); }
  var root = prop_('ROOT_FOLDER_ID'), ok = false, antre = [], it = f.getParents();
  while (it.hasNext()) antre.push(it.next());
  for (var i = 0; i < antre.length && i < 30 && !ok; i++) { if (antre[i].getId() === root) ok = true; else { var p = antre[i].getParents(); while (p.hasNext()) antre.push(p.next()); } }
  if (!ok) throw new Error('Berkas di luar folder aplikasi.');
  if (f.getSize() > 8 * 1024 * 1024) throw new Error('Berkas terlalu besar untuk ditampilkan.');
  return { nama: f.getName(), mime: f.getMimeType(), base64: Utilities.base64Encode(f.getBlob().getBytes()) };
}
function asetPublik_(jenis) {
  var id = Inti.snapshotPublikEnv(env_()).snapshot[jenis === 'favicon' ? 'favicon' : 'logo'] || '', m = String(id).match(/[-\w]{25,}/);
  if (!m) return { ok: false, error: { message: 'Aset belum diunggah.', code: 'NOT_FOUND' } };
  var f = DriveApp.getFileById(m[0]);
  return { ok: true, data: { mime: f.getMimeType(), nama: f.getName(), base64: Utilities.base64Encode(f.getBlob().getBytes()) } };
}

/* ---------- GitHub (repository_dispatch) ---------- */
function dispatchGitHub_(info) {
  var tok = prop_('GITHUB_TOKEN'), repo = prop_('GITHUB_REPO');
  if (!tok || !repo) return { belumAtur: true };
  try {
    var r = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/dispatches', { method: 'post', muteHttpExceptions: true, contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      payload: JSON.stringify({ event_type: 'settings-updated', client_payload: { versi: info.versi, alasan: String(info.alasan || '').slice(0, 100) } }) });
    var kode = r.getResponseCode();
    return kode === 204 ? { ok: true } : { ok: false, pesan: 'GitHub menjawab ' + kode + ': ' + r.getContentText().slice(0, 160) };
  } catch (e) { return { ok: false, pesan: 'Koneksi GitHub gagal: ' + e.message }; }
}

/* ---------- Email ---------- */
function kirimEmail_(o) {
  try {
    var html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">' +
      '<div style="background:#1E2A4A;color:#fff;padding:14px 18px;font-weight:bold">' + String(o.nama || 'Swim Academy').replace(/</g, '&lt;') + '</div>' +
      '<div style="padding:18px;color:#1E293B;line-height:1.6">' + String(o.pesan || '').replace(/</g, '&lt;').replace(/\*([^*]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>') + '</div></div>';
    MailApp.sendEmail({ to: o.ke, subject: o.subjek || 'Notifikasi', body: o.pesan, htmlBody: html, name: o.nama || 'Swim Academy' });
    return { ok: true, respon: 'OK' };
  } catch (e) { return { ok: false, respon: e.message }; }
}

/* ---------- Trigger: antrean notifikasi & dokumen (1 menit), harian (00:10) ---------- */
function prosesAntrianLatar() {
  var c = CacheService.getScriptCache().get('ANTRIAN_ADA');
  if (c === '0' || (c === null && !prop_('ANTRIAN_ADA'))) return;   // keluar cepat: hemat kuota trigger
  var env = env_(), n = Inti.prosesNotifLatar(env), d = Inti.prosesDokumenLatar(env);
  if (!n.sisa && !d.sisa) tandaiAntrian_(false);
}
function tugasHarianLatar() {
  var r = Inti.tugasHarian(env_());
  backupHarian_();
  Logger.log('Tugas harian: ' + JSON.stringify(r));
}
function backupHarian_() {
  var folder = folderApp_('Backup'), nama = 'Backup Swim Academy ' + Inti.util.tglWIB(Date.now());
  if (!folder.getFilesByName(nama).hasNext()) DriveApp.getFileById(prop_('SPREADSHEET_ID')).makeCopy(nama, folder);
  var batas = Date.now() - 30 * 864e5, it = folder.getFiles();
  while (it.hasNext()) { var f = it.next(); if (f.getDateCreated().getTime() < batas) f.setTrashed(true); }
}
function pasangTrigger_() {
  var ada = {}; ScriptApp.getProjectTriggers().forEach(function (t) { ada[t.getHandlerFunction()] = 1; });
  if (!ada.prosesAntrianLatar) ScriptApp.newTrigger('prosesAntrianLatar').timeBased().everyMinutes(1).create();
  if (!ada.tugasHarianLatar) ScriptApp.newTrigger('tugasHarianLatar').timeBased().atHour(0).nearMinute(10).everyDays(1).inTimezone('Asia/Jakarta').create();
}
function hangatkan_() {
  var c = CacheService.getScriptCache(); if (c.get('hangat')) return; c.put('hangat', '1', 60);
  ['Pengaturan', 'Pengguna', 'Hak_Akses', 'Paket', 'Kolam', 'Pelatih', 'Siswa', 'Paket_Aktif', 'Paket_Peserta', 'Jadwal', 'Absensi_Sesi', 'Absensi_Peserta'].forEach(function (t) { try { DB.semua(t); } catch (e) { } });
}

/* =====================================================================
 * SETUP — jalankan dari editor. Aman diulang (idempoten).
 * ===================================================================== */
var SHEET_TERKUNCI = ['Config_Terkunci', 'Harga_Paket', 'Tarif_Honor', 'Aturan_Bisnis', 'Hak_Akses', 'Log_Audit', 'Pengguna', 'DE_Pejabat'];
function setupAppEnvironment() {
  var log = [];
  /* 1. Folder Drive */
  var root = prop_('ROOT_FOLDER_ID') ? DriveApp.getFolderById(prop_('ROOT_FOLDER_ID')) : null;
  if (!root) { root = DriveApp.createFolder('SwimAcademy'); setProp_('ROOT_FOLDER_ID', root.getId()); log.push('+ folder SwimAcademy'); }
  ['Logo', 'BuktiBayar', 'Materi', 'Dokumen', 'Template', 'Backup'].forEach(function (n) { folderApp_(n); });
  /* 2. Spreadsheet */
  var ss;
  if (prop_('SPREADSHEET_ID')) ss = SpreadsheetApp.openById(prop_('SPREADSHEET_ID'));
  else { ss = SpreadsheetApp.create('Database — Swim Academy'); DriveApp.getFileById(ss.getId()).moveTo(root); setProp_('SPREADSHEET_ID', ss.getId()); log.push('+ spreadsheet database'); }
  ss.setSpreadsheetTimeZone('Asia/Jakarta');
  /* 3. Sheet + kolom (hanya MENAMBAH) */
  Object.keys(Inti.SKEMA).forEach(function (nama) {
    var sk = Inti.SKEMA[nama], sh = ss.getSheetByName(nama);
    if (!sh) {
      sh = ss.insertSheet(nama); sh.getRange(1, 1, 1, sk.kolom.length).setValues([sk.kolom]).setFontWeight('bold').setBackground('#1E2A4A').setFontColor('#FFFFFF');
      sh.setFrozenRows(1); log.push('+ sheet ' + nama);
    } else {
      var ada = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String), kurang = sk.kolom.filter(function (k) { return ada.indexOf(k) < 0; });
      if (kurang.length) { sh.getRange(1, ada.filter(String).length + 1, 1, kurang.length).setValues([kurang]).setFontWeight('bold'); log.push('+ kolom ' + nama + ': ' + kurang.join(', ')); }
    }
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    hdr.forEach(function (k, i) { if ((sk.angka || []).indexOf(k) < 0) sh.getRange(2, i + 1, Math.max(1, sh.getMaxRows() - 1), 1).setNumberFormat('@'); });
    if (SHEET_TERKUNCI.indexOf(nama) >= 0) {
      var pr = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0] || sh.protect().setDescription('Hanya Owner (lewat aplikasi)');
      pr.removeEditors(pr.getEditors()); if (pr.canDomainEdit()) pr.setDomainEdit(false);
    }
  });
  var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Lembar1'); if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  /* 4. Rahasia internal (dibangkitkan sekali, tidak pernah ditimpa) */
  if (!prop_('TOKEN_SECRET')) { setProp_('TOKEN_SECRET', acak_(64)); log.push('+ TOKEN_SECRET'); }
  if (!prop_('PEPPER')) { setProp_('PEPPER', acak_(32)); log.push('+ PEPPER'); }
  if (!prop_('SYNC_SECRET')) { setProp_('SYNC_SECRET', acak_(40)); log.push('+ SYNC_SECRET (salin ke GitHub Secret SYNC_SECRET)'); }
  /* 5. Data awal + akun Owner + template dokumen bawaan */
  var env = env_(), tpl = {};
  try { tpl = buatTemplateBawaan_(true); } catch (e) { log.push('! template dokumen belum dibuat: ' + e.message); }
  var h = Inti.setupAwal(env, { template: tpl });
  log = log.concat(h.log);
  pasangTrigger_(); log.push('✓ trigger antrean (1 menit) & harian (00:10)');
  /* 6. Catatan baca-saja (Kelas B) */
  var cat = ss.getSheetByName('AppConfig') || ss.insertSheet('AppConfig');
  cat.clear(); cat.getRange(1, 1, 5, 2).setValues([['key', 'value (catatan baca-saja; sumber kebenaran: Script Properties)'], ['SPREADSHEET_ID', ss.getId()], ['ROOT_FOLDER_ID', root.getId()], ['VERSI_APP', Inti.VERSI], ['SETUP_AT', Inti.util.waktuWIB(Date.now())]]);
  Logger.log('✅ Setup selesai.\n' + log.join('\n'));
  Logger.log('Spreadsheet : ' + ss.getUrl());
  Logger.log('Folder Drive: ' + root.getUrl());
  if (h.owner) {
    Logger.log('🔐 AKUN OWNER (catat sekarang — hanya tampil sekali, ganti sandi setelah login pertama)');
    Logger.log('   Username : ' + h.owner.username);
    Logger.log('   Sandi    : ' + h.owner.sandi);
  }
  Logger.log('🔑 SYNC_SECRET untuk GitHub Secret: lihat Script Properties → SYNC_SECRET');
}
/* Isi data demo (43 siswa, 5 bulan riwayat) ke spreadsheet KOSONG — untuk uji coba sebelum go-live */
function isiDataDemo() {
  var env = env_();
  if (DB.semua('Siswa').length) throw new Error('Sheet Siswa sudah berisi data. Data demo hanya untuk database kosong.');
  var r = DemoSeed.seed(Inti, env);
  DB.selesaiTulis_();
  Logger.log('✅ Data demo terisi: ' + JSON.stringify(r) + '. Akun staf demo: admin/budi/meilin/hendra/doni/rina/sari (sandi demo1234). Orang tua: kode SA-8829 PIN 123456.');
}
/* Reset sandi Owner bila lupa (jalankan dari editor) */
function resetSandiOwner() {
  var env = env_(), sandi = acak_(10).replace(/^/, 'S1');
  env.kunci(function () {
    var u = DB.semua('Pengguna').filter(function (x) { return x.peran === 'owner'; })[0]; if (!u) throw new Error('Akun Owner tidak ada.');
    var salt = acak_(16); DB.ubah('Pengguna', [{ user_id: u.user_id, salt: salt, hash_sandi: Inti.hashRahasia(env, sandi, salt), versi_token: Number(u.versi_token) + 1, gagal_login: 0, kunci_hingga: '' }]);
    Logger.log('🔐 Sandi Owner baru untuk "' + u.username + '": ' + sandi);
  });
}
function rotasiTokenSecret() { setProp_('TOKEN_SECRET', acak_(64)); Logger.log('✅ TOKEN_SECRET dirotasi — semua sesi berakhir, semua pengguna perlu masuk ulang.'); }
function cekPerforma() {
  var t = Date.now(); hangatkan_(); Logger.log('Hangatkan: ' + (Date.now() - t) + ' ms');
  Logger.log('Trigger: ' + ScriptApp.getProjectTriggers().map(function (x) { return x.getHandlerFunction(); }).join(', '));
  Logger.log('Antrean: ' + (CacheService.getScriptCache().get('ANTRIAN_ADA') || prop_('ANTRIAN_ADA') || '0'));
}
