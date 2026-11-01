# Vi-Pharma Frontend (Web App)

Aplikasi web modern untuk manajemen apotek jaringan **Vi-Pharma**. Dibangun menggunakan **React 18**, **Vite**, **Tailwind CSS**, dan **Lucide Icons**.

Aplikasi ini menggunakan alur otentikasi aman tanpa input password langsung di browser kasir/apotek, melainkan menggunakan mekanisme **QR Code Pairing Realtime via WebSocket** yang dipindai oleh mobile authenticator **`vi-token`**.

---

## 🚀 Fitur Utama

1. **Dynamic QR Code Pairing**:
   - Menghasilkan kode QR acak dengan Session ID unik berdurasi 120 detik (auto refresh ticker).
   - Terkoneksi secara realtime via WebSocket (`GET /api/v1/auth/qr/ws/:sessionId`).
   - Menerima event push notifikasi `QR_AUTHORIZED` secara instan setelah scanner memverifikasi sesi.

2. **Multi-Branch Selector**:
   - Menampilkan daftar cabang apotek yang terafiliasi dengan user yang berhasil login.
   - Mengikat sesi kerja browser ke satu cabang aktif (`branch_id`).

3. **Workstation Dashboard**:
   - Header workstation apotek aktif (Nama Apotek, Kode Cabang, Status, No. SIA & SIPA).
   - Akses modul berbasis peran pengguna (*Role-Based Access*):
     - **Kasir & Point of Sale (POS)**
     - **Manajemen Resep & Apoteker (SIPA)**
     - **Inventori & Stok Gudang Obat**
     - **Laporan Penjualan & Keuangan Jurnal**
     - **Master Data Cabang & Karyawan**
   - Fitur ganti cabang workstation (*Switch Branch*) dan logout sesi.

---

## 🛠️ Instalasi & Menjalankan

### Prasyarat
- Node.js versi 18+ atau 20+
- Backend `pharma-be` sedang berjalan di port `8080`

### Langkah-langkah:
```bash
# 1. Masuk ke direktori
cd pharma-fe

# 2. Install dependensi
npm install

# 3. Jalankan server development
npm run dev
```

Buka browser di:
`http://localhost:3000`

---

## 📁 Struktur Direktori

```text
pharma-fe/
├── src/
│   ├── components/
│   │   ├── QRLoginCard.jsx          # Komponen login QR + countdown timer + WebSocket client
│   │   ├── BranchSelector.jsx       # Layar pemilihan cabang apotek aktif
│   │   └── WorkstationDashboard.jsx # Dashboard utama workstation apotek
│   ├── services/
│   │   └── api.js                   # Client REST API & WebSocket connection helper
│   ├── App.jsx                      # State machine transisi halaman (LOGIN -> SELECT_BRANCH -> WORKSTATION)
│   ├── main.jsx                     # Vite React entry point
│   └── index.css                    # Tailwind CSS directives
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🔗 Integrasi Backend
Pastikan `pharma-be` aktif pada `http://localhost:8080`.
Jika backend berjalan di host/IP lain, sesuaikan konfigurasi di `src/services/api.js` atau buat file `.env`:
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/api/v1
```
