# Panduan Instalasi — Swim Academy: Dashboard Terintegrasi

Versi aplikasi 1.1.0 · mengikuti PRD v1.1 (26 Nov 2026)

Aplikasi terdiri dari dua bagian:

| Bagian | Isi | Tempat |
| --- | --- | --- |
| **Frontend** (tampilan) | `index.html`, `css/`, `js/`, `assets/`, `config/`, `sw.js`, `manifest.webmanifest` | GitHub Pages (gratis) |
| **Backend** (data & logika) | isi folder `apps-script/` | Google Apps Script milik akun Google **Owner** |

Data disimpan di Google Sheets "Database — Swim Academy" dan folder Google Drive `SwimAcademy/` milik Owner. Tidak ada biaya server.

---

## 0. Coba dulu tanpa backend (mode demo)

Frontend sudah bisa dipakai penuh tanpa backend. `js/config.js` berisi `MODE: 'demo'`, sehingga data contoh dibuat di browser dan logikanya **sama persis** dengan server (berkas `js/inti.js` identik dengan `apps-script/Inti.gs`).

Akun demo:

| Peran | Masuk dengan |
| --- | --- |
| Owner | `owner` / `demo1234` |
| Admin | `admin` / `demo1234` |
| Pelatih | `budi`, `meilin`, `hendra`, `doni`, `rina`, `sari` / `demo1234` |
| Orang tua | kode akses `SA-8829` + PIN `123456` (2 anak: Kenzo & Aisyah) |
| Formulir pendaftaran contoh | `#/daftar/DEMO-BARU` |

Data demo tersimpan di browser dan **dibuat ulang setiap hari** supaya tanggal jadwal & absensi selalu relevan. Tombol **Reset data** di pita atas mengembalikannya kapan saja.

---

## 1. Pasang backend (Google Apps Script)

> Lakukan dengan akun Google **Owner**. Semua file Drive dan Sheets akan dimiliki akun ini.

1. Buka <https://script.google.com> → **Proyek baru**. Beri nama `Swim Academy API`.
2. Buka **Setelan Proyek** (ikon gerigi) → centang **Tampilkan file manifes "appsscript.json" di editor**.
3. Kembali ke **Editor**. Buat file-file berikut (tombol **+** → **Skrip**) lalu tempel isinya dari folder `apps-script/`:

   | File di editor | Sumber |
   | --- | --- |
   | `Kode.gs` (ganti isi `Code.gs`, lalu ganti namanya) | `apps-script/Kode.gs` |
   | `Inti.gs` | `apps-script/Inti.gs` |
   | `DemoSeed.gs` | `apps-script/DemoSeed.gs` |
   | `appsscript.json` | `apps-script/appsscript.json` (ganti seluruh isinya) |

4. Klik **Simpan** (ikon disket).
5. Pilih fungsi **`setupAppEnvironment`** di bilah atas → **Jalankan** → izinkan akses (Google akan menampilkan peringatan "aplikasi belum diverifikasi" karena ini skrip milik Anda sendiri: klik **Lanjutan → Buka Swim Academy API**).
6. Buka **Log eksekusi**. Catat **sandi Owner awal** yang hanya tampil sekali. Fungsi ini otomatis:
   - membuat folder `SwimAcademy/{Logo, Logo/Masuk, BuktiBayar, Materi, Backup}` dan spreadsheet `Database — Swim Academy` berisi 26 sheet;
   - memasang proteksi pada sheet terkunci (`Config_Terkunci`, `Harga_Paket`, `Tarif_Honor`, `Aturan_Bisnis`, `Hak_Akses`, `Log_Audit`, `Pengguna`);
   - mengisi matriks Hak Akses, Aturan Bisnis, kategori kas, dan form pendaftaran;
   - membuat rahasia di Script Properties dan memasang satu pemicu harian (00:10 WIB: paket kedaluwarsa + backup 30 hari).

   Aman dijalankan ulang: rahasia yang sudah ada **tidak ditimpa**, sheet/kolom hanya ditambah bila belum ada.

7. *(Opsional)* Jalankan **`isiDataDemo`** bila ingin database berisi data contoh (hanya untuk database kosong).
8. **Deploy → Deployment baru** → jenis **Aplikasi web**:
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**

   Klik **Deploy**, lalu salin URL yang berakhiran `/exec`.

### Script Properties (rahasia)

Rahasia hanya disimpan di **Setelan Proyek → Properti skrip**, tidak pernah di kode, Sheets, atau GitHub.

| Kunci | Diisi oleh | Fungsi |
| --- | --- | --- |
| `TOKEN_SECRET` | otomatis | Kunci tanda tangan token sesi (HMAC, 12 jam) |
| `PEPPER` | otomatis | Bumbu hash sandi/PIN |
| `SYNC_SECRET` | otomatis | Rahasia laporan balik GitHub Actions → salin ke GitHub Secret |
| `SPREADSHEET_ID`, `ROOT_FOLDER_ID` | otomatis | Lokasi database & folder Drive |
| `GITHUB_TOKEN` | **Anda** | Token GitHub *fine-grained*, hanya repo ini, izin **Contents: Read and write** |
| `GITHUB_REPO` | **Anda** | `username/nama-repo` |

Jangan menambah editor proyek Apps Script sembarangan: setiap editor bisa melihat Script Properties.

---

## 2. Pasang frontend di GitHub Pages

1. Edit `js/config.js`:

   ```js
   MODE: 'live',
   GAS_API_URL: 'https://script.google.com/macros/s/ID_ANDA/exec',
   ```

   URL `/exec` bukan rahasia; keamanan dijaga token sesi dan cek izin di server.

2. Buat repository **Public** baru di GitHub (jangan centang README).
3. Dari folder proyek di komputer, kirim lewat terminal. **Jangan** pakai "Upload files" di web GitHub karena struktur folder akan rusak.

   ```bash
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```

   Saat diminta password, tempel **Personal Access Token** (layar memang tidak menampilkan karakter apa pun saat menempel).

4. Di GitHub: **Settings → Pages → Source: GitHub Actions**.
5. **Settings → Secrets and variables → Actions → New repository secret**: nama `SYNC_SECRET`, isi dengan nilai `SYNC_SECRET` dari Script Properties.
6. Buka tab **Actions**: workflow **Sinkron & Deploy** berjalan. Situs tayang di `https://USERNAME.github.io/NAMA-REPO/`.
7. Di Apps Script, isi `GITHUB_TOKEN` dan `GITHUB_REPO` (lihat tabel di atas).

Folder `apps-script/` ikut tersimpan di repository sebagai arsip, tetapi **tidak ikut dipublikasikan** ke Pages (workflow hanya menerbitkan berkas frontend).

### Cara kerja sinkronisasi pengaturan

Saat Admin/Owner menyimpan identitas, tema, halaman masuk, paket, atau form:

1. Backend menyimpan ke sheet `Pengaturan` (versi naik) lalu memeriksa snapshot publik. Snapshot ditolak bila memuat kunci di luar whitelist, nomor rekening, atau nominal harga.
2. Backend memanggil GitHub `repository_dispatch` (event `settings-updated`).
3. Workflow mengambil `?action=publicSettings`, menggagalkan diri bila **nama kunci** memuat `rekening/harga/tarif/nominal/honor`, menulis `config/app-config.json` + logo/favicon + foto slide halaman masuk (file Drive disalin ke `assets/brand/`), commit sebagai `github-actions[bot]`, deploy, lalu lapor balik (`sync.ack`).
4. Status **Menunggu publikasi / Tersinkron / Gagal** tampil di **Pengaturan → Sinkronisasi**. Bila gagal, aplikasi tetap memakai pengaturan langsung dari backend, jadi tidak ada perubahan yang hilang.

---

## 3. Langkah pertama setelah tayang (Owner)

1. Masuk dengan `owner` dan sandi awal dari log → **Akun Saya → Ganti sandi**.
2. **Harga, Tarif & Aturan**: isi rekening resmi, harga paket & biaya tambahan per peserta, tarif honor 7 kategori sesi, tarif khusus pelatih, dan Aturan Bisnis. Setiap simpan menampilkan ringkasan perubahan dan tercatat di Log Audit.
3. **Pengaturan**: identitas (isi **Email Owner** bila ingin diberi tahu saat kunci absensi dibuka atau sinkron gagal berulang), logo, tema (dengan uji kontras otomatis), **halaman masuk**, kolam, pelatih, paket, form pendaftaran.
4. **Akun Pengguna**: buat akun Admin dan Pelatih (sandi sementara tampil sekali).
5. **Hak Akses**: sesuaikan izin peran bila perlu.

---

## 4. Mengganti foto halaman masuk (tanpa menyentuh kode)

Admin/Owner: **Pengaturan → Halaman masuk**.

1. **Unggah foto** (JPG/PNG/WEBP, maks. 3 MB, otomatis diperkecil ke 1920 px) atau **tempel URL** gambar / tautan Google Drive. File Drive harus dibagikan ke "Siapa saja yang memiliki link".
2. Atur urutan dengan ↑ ↓, isi **judul** dan **teks pendukung**, lalu **durasi** tiap gambar (3.000–15.000 ms, bawaan 5.000).
3. Klik **Simpan halaman masuk**. Pratinjau di kanan langsung memutar slideshow.

Maksimal 6 gambar. Bila daftar dikosongkan, 4 ilustrasi bawaan yang tampil. Saat sinkron, gambar dari Drive disalin ke situs (`assets/brand/masuk-N.jpg`) supaya cepat dimuat dan tidak bergantung pada Drive.

### WhatsApp

Semua tombol WhatsApp membuka WhatsApp Admin (wa.me) dengan pesan siap kirim, sesuai PRD v1.1 (pengiriman WA otomatis di luar cakupan).

---

## 5. Pembaruan kode

- **Backend**: tempel kode baru → Simpan → **Deploy → Kelola deployment → ✏️ Edit → Versi baru → Deploy**. Jangan buat deployment baru, karena URL `/exec` akan berubah.
- **Frontend**: salin berkas baru ke folder repo, lalu jalankan:

  ```bash
  git add .
  git commit -m "Pembaruan"
  git push
  ```

  Naikkan juga `?v=` di `index.html` dan `VERSI` di `sw.js` bila mengubah CSS/JS. Bila tampilan belum berubah, tekan **Ctrl+Shift+R**.

## 6. Fungsi darurat (jalankan dari editor Apps Script)

| Fungsi | Kegunaan |
| --- | --- |
| `setupAppEnvironment` | Pasang/perbaiki sheet, folder, rahasia, pemicu (idempoten) |
| `isiDataDemo` | Isi data contoh ke database kosong |
| `resetSandiOwner` | Sandi Owner baru tampil di log (sesi lama Owner dicabut) |
| `rotasiTokenSecret` | Keluarkan semua pengguna dari semua perangkat |
| `cekPerforma` | Memanaskan cache & menampilkan pemicu |

## 7. Kendala umum

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| "Backend belum di-setup" | `setupAppEnvironment` belum dijalankan | Jalankan dari editor |
| "Server tidak dapat dihubungi" | URL `/exec` salah atau akses deployment bukan "Siapa saja" | Periksa `js/config.js` & setelan deployment |
| Status sinkron "Gagal" | `GITHUB_TOKEN`/`GITHUB_REPO` belum diisi, token kedaluwarsa, atau `SYNC_SECRET` beda | Periksa Script Properties & GitHub Secret, lalu klik **Sinkron ulang** |
| Halaman tanpa gaya (CSS 404) | Berkas diunggah lewat web GitHub sehingga folder hilang | Kirim ulang lewat terminal (`git add .`) |
| Absensi ditolak padahal belum jam 22.00 di HP | Batas memakai **jam server WIB**, bukan jam HP | Cek jam di topbar aplikasi; Admin bisa **Buka kunci** 24 jam |
| PIN orang tua terkunci | Salah 5× | Tunggu 15 menit atau Admin **Reset PIN** |

## 8. Pembaruan dari versi 1.0.0

Bila backend versi 1.0.0 sudah terpasang:

1. Di editor Apps Script, **hapus** file `Notifikasi.gs`, `Dokumen.gs`, dan `QrLib.gs`.
2. Tempel ulang `Kode.gs`, `Inti.gs`, `DemoSeed.gs`, dan `appsscript.json` versi baru → Simpan.
3. Jalankan `setupAppEnvironment` sekali. Pemicu antrean 1 menit yang lama otomatis dihapus.
4. **Deploy → Kelola deployment → ✏️ Edit → Versi baru → Deploy**.
5. Hapus juga `FONNTE_TOKEN` dari Script Properties bila pernah diisi.

Sheet lama (`AntrianNotif`, `BlastWA`, `CRM_*`, `DE_*`) dan folder `Dokumen`/`Template` di Drive tidak dipakai lagi. Data lain tidak berubah. Sheet dan folder lama boleh dihapus manual setelah dicadangkan.

## 9. Cakupan & batasan versi ini

- Dibangun: seluruh P0 & P1 PRD, Tutup Bulan (P2), email ringkas ke Owner (P2), dan menu **Analitik** baru. Laporan kas bulanan & rekap honor dapat diunduh PDF/Excel dari halaman Arus Kas dan Honor Pelatih (PRD 4.5).
- Versi 1.1.0 menghapus modul Dokumen (kwitansi, slip, sertifikat, PIN & QR verifikasi) serta CRM & WhatsApp Fonnte, supaya sesuai PRD v1.1.
- Gambar referensi dipakai sebagai acuan gaya. Fitur yang hanya ada di gambar dan tidak ada di PRD **tidak** dibangun: PIN di setiap simpan, pencocokan mutasi BCA, saldo multi-rekening, geo-tagging, alamat IP di log, penjadwal otomatis, kapasitas lajur/suhu kolam, dan aturan "batal < 4 jam = Hangus".
- Belum ada: mode gelap (J4) dan pengecualian izin per akun (A6, P2).
- Sesi login tidak ikut berpindah antarperangkat. Apps Script tidak bisa membaca IP, jadi pembatasan login berlaku per username/kode akses.
