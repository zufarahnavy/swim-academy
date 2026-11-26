/* =====================================================================
 * Notifikasi.gs — Fonnte (WhatsApp) untuk antrean notifikasi & blast.
 * OPSIONAL dan MATI secara bawaan: aktif hanya bila Owner mengisi token
 * Fonnte (disimpan di Script Properties, tidak pernah ke browser) dan
 * menyalakan saklar di menu CRM & WhatsApp → Konfigurasi.
 * Tombol wa.me manual di aplikasi tetap tersedia tanpa Fonnte.
 * ===================================================================== */
var FONNTE_API = 'https://api.fonnte.com';

function fonnte_(path, payload) {
  var token = prop_('FONNTE_TOKEN');
  if (!token) return { status: false, reason: 'Token Fonnte belum diisi.' };
  try {
    var r = UrlFetchApp.fetch(FONNTE_API + path, { method: 'post', headers: { Authorization: token }, payload: payload || {}, muteHttpExceptions: true });
    try { return JSON.parse(r.getContentText()); } catch (e) { return { status: false, reason: r.getContentText().substring(0, 120) }; }
  } catch (e) { return { status: false, reason: 'Koneksi Fonnte gagal: ' + e.message }; }
}

/* 1 request per batch (parameter data); bila ditolak → fallback 1 request per pesan secara paralel */
function fonnteKirimBanyak_(pesan, jeda) {
  if (!pesan.length) return [];
  var data = pesan.map(function (m) { return { target: m.target, message: m.message, delay: String(jeda || '2'), countryCode: '62' }; });
  var res = fonnte_('/send', { data: JSON.stringify(data) });
  if (res && res.status) return pesan.map(function (m, i) { return { ok: true, respon: 'OK ' + ([].concat(res.id || [])[i] || '') }; });
  var token = prop_('FONNTE_TOKEN');
  var resps = UrlFetchApp.fetchAll(pesan.map(function (m) {
    return { url: FONNTE_API + '/send', method: 'post', headers: { Authorization: token }, payload: { target: m.target, message: m.message, countryCode: '62' }, muteHttpExceptions: true };
  }));
  return resps.map(function (r) {
    try { var j = JSON.parse(r.getContentText()); return { ok: !!j.status, respon: j.status ? 'OK' : (j.reason || 'Ditolak') }; }
    catch (e) { return { ok: false, respon: 'HTTP ' + r.getResponseCode() }; }
  });
}

/* Deteksi nomor terdaftar WhatsApp (maks 50 per panggilan; tergantung paket Fonnte) */
function fonnteValidasi_(nomor62) {
  var r = fonnte_('/validate', { target: nomor62.join(','), countryCode: '62' });
  if (!r || !r.status) return { ok: false, pesan: (r && r.reason) || 'Fitur validasi tidak tersedia di paket Fonnte Anda.' };
  return { ok: true, terdaftar: r.registered || [], tidak: r.not_registered || [] };
}
function fonnteDevice_() {
  var r = fonnte_('/device', {});
  return { ok: !!(r && (r.status || r.device)), device: r.device || '', device_status: r.device_status || '', package: r.package || '', quota: r.quota || '', expired: r.expired || '', pesan: r.reason || '' };
}
