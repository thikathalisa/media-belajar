# MATH ADVENTURE — Firebase + GitHub Pages

Website HTML asli dipertahankan dan CMS guru dihubungkan ke Cloud Firestore. Hosting tetap statis melalui GitHub Pages, tanpa server tambahan atau proses build.

## Isi folder
- `index.html` — website asli dengan integrasi Firebase.
- `firebase-config.js` — konfigurasi Firebase placeholder.
- `firebase.js` — autentikasi, Firestore, realtime listener, dan Storage.
- `firestore.rules` — aturan keamanan Firestore.
- `storage.rules` — aturan keamanan Storage.
- `README.md` — panduan instalasi.

## 1. Buat proyek Firebase
1. Buka https://console.firebase.google.com/ lalu Add project.
2. Project Overview → ikon Web (`</>`) → daftarkan aplikasi web.
3. Salin konfigurasi yang diberikan.
4. Isi nilai pada `firebase-config.js`. Jangan menaruh password, private key, atau service-account JSON di website.

## 2. Aktifkan Firebase Authentication
1. Build → Authentication → Get started.
2. Sign-in method → aktifkan Email/Password.
3. Users → Add user untuk membuat akun guru.
4. Salin User UID akun tersebut.

## 3. Aktifkan Firestore dan daftarkan guru
1. Build → Firestore Database → Create database.
2. Setelah database dibuat, tab Data → Start collection `teachers`.
3. Buat document ID persis sama dengan User UID guru.
4. Tambahkan field `active` (boolean) = `true` dan `role` (string) = `teacher`.
5. Setiap guru harus memiliki document `teachers/{UID}`. Akun Authentication tanpa dokumen tersebut ditolak.

## 4. Pasang Firestore Rules
Firestore Database → Rules → salin isi `firestore.rules` → Publish. Aturan memberi akses baca publik untuk konten pembelajaran, tetapi hanya guru terotorisasi yang dapat membuat, mengubah, atau menghapus konten.

## 5. Aktifkan Storage untuk foto pengembang
1. Build → Storage → Get started.
2. Tab Rules → salin isi `storage.rules` → Publish.
3. Foto pengembang diunggah ke Storage; Firestore menyimpan URL. Batas ukuran awal 5 MB.
Storage opsional untuk fitur yang tidak mengunggah gambar.

## 6. Isi konfigurasi
Firebase Console → Project settings → General → Your apps → SDK setup and configuration. Isi `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, dan `appId` pada `firebase-config.js`. Ganti semua placeholder `ISI_...`.

## 7. Publikasikan melalui GitHub Pages
1. Buat repository GitHub.
2. Upload semua file ke root repository (index.html harus di root).
3. Repository → Settings → Pages.
4. Build and deployment → Deploy from a branch → `main` → `/(root)` → Save.
5. Tunggu deployment dan buka URL GitHub Pages.

## 8. Migrasi data awal
Login pertama oleh guru akan memeriksa koleksi cloud. Jika koleksi konten masih kosong, aplikasi mengirim data lokal yang tersedia atau seed bawaan ke Firestore. Koleksi yang sudah berisi data tidak ditimpa. Unduh backup JSON sebelum migrasi sebagai tindakan pencegahan.

## 9. Uji dua perangkat
1. Login sebagai guru pada laptop menggunakan email/password yang UID-nya telah diotorisasi.
2. Ubah materi pada Portal Guru dan simpan.
3. Buka website di HP/browser lain sebagai siswa dan periksa materi.
4. Tutup lalu buka kembali browser siswa.
5. Pastikan siswa tidak dapat masuk ke CMS; akun yang tidak ada di allowlist `teachers` harus ditolak.

## Batasan versi ini
- Data bersama: materi, bank soal, contoh, profil pengembang, dan pengaturan institusi.
- Foto profil pengembang: Firebase Storage.
- `onSnapshot` memperbarui koleksi konten pada perangkat yang sedang membuka website.
- Profil personal siswa, preferensi suara, roster multiplayer, dan riwayat nilai masih menggunakan penyimpanan lokal seperti implementasi asli. Sinkronisasi nilai dan sesi multiplayer lintas perangkat memerlukan identitas siswa/kelas serta rancangan aturan tulis khusus; anonymous write tidak dibuka.
- Data cloud memerlukan koneksi internet. Cache Firestore membantu saat offline; perubahan lintas perangkat terlihat setelah koneksi tersedia.
- Placeholder Firebase bukan koneksi aktif. Pengujian end-to-end memerlukan proyek Firebase milik pengguna.

## Troubleshooting
- `Belum dikonfigurasi`: periksa placeholder pada `firebase-config.js`.
- `auth/unauthorized-domain`: Authentication → Settings → Authorized domains → tambahkan domain `username.github.io`.
- `Permission denied`: pastikan rules dipublikasikan dan document `teachers/{UID}` tersedia serta `active=true`.
- Foto gagal: pastikan Storage aktif, `storageBucket` benar, dan `storage.rules` sudah dipublikasikan.
- SDK gagal dimuat: periksa koneksi ke `www.gstatic.com`.
