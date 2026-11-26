/* =====================================================================
 * KONFIGURASI FRONTEND — satu-satunya nilai yang boleh ada di repositori.
 * MODE 'demo' : aplikasi berjalan penuh di browser dengan data contoh
 *               (tanpa backend). Cocok untuk pratinjau & pelatihan.
 * MODE 'live' : semua data dari Google Apps Script (URL /exec di bawah).
 * URL /exec BUKAN rahasia; keamanan dijaga token sesi + cek izin di server.
 * ===================================================================== */
window.CONFIG = {
  MODE: 'live',
  GAS_API_URL: 'https://script.google.com/macros/s/AKfycbz4x2uUS1njSmiWVn2rE8Mpra_7l75dn1kvp5WN6B13li_8mvlkcGyRAiZpw7liEgR1/exec',
  APP_ID: 'swimacademy',
  VERSI: '1.0.0'
};
