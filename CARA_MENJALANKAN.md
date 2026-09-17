# 🚀 Panduan & Catatan Cara Menjalankan Aplikasi JagaRaya

Dokumen ini berisi panduan lengkap untuk memasang (*setup*), mengonfigurasi, dan menjalankan aplikasi **JagaRaya** (Sistem AI Pemindai Plat Nomor CCTV / ALPR, Deskripsi Visual, dan Pelacak Rute Kendaraan berbasis Neural Network).

---

## 🏗️ Arsitektur Aplikasi

Aplikasi JagaRaya terdiri dari dua bagian utama:
1. **Backend AI (Python FastAPI)**:
   - **YOLOv8n (Ultralytics)**: Deteksi *bounding box* seluruh kendaraan (mobil, motor, bus, truk).
   - **MobileNetV3-Small (PyTorch)**: Klasifikasi jenis kendaraan berbasis fitur *neural network*.
   - **EasyOCR (CRAFT + CRNN)**: Pembacaan karakter plat nomor otomatis (ALPR).
   - **HSV Histogram Analysis**: Klasifikasi warna kendaraan dominan.
   - **Route Tracker Engine**: Pelacak pergerakan rute kendaraan di peta GIS.
2. **Frontend Web App (React + Vite + TailwindCSS)**:
   - Dashboard analitik real-time.
   - Video player rekaman CCTV & Pemutar Video Hasil AI terannotasi.
   - Lightbox Zoom Inspector Modal untuk memperbesar *bounding box*.
   - Interactive Leaflet GIS Map tracking.

---

## 📋 Prasyarat Sistem (*Prerequisites*)

Sebelum menjalankan aplikasi, pastikan perangkat Anda telah terpasang:
- **Python 3.10+** (Pastikan centang *"Add Python to PATH"* saat instalasi).
- **Node.js v18+** & **npm**.
- **Git** (Opsional, untuk *version control*).

---

## ⚡ 1. Cara Cepat Menjalankan (One-Click Script)

Kami telah menyediakan skrip otomatis untuk menjalankan backend dan frontend secara bersamaan.

### Menggunakan Windows PowerShell:
1. Buka PowerShell pada direktori utama proyek `JagaRaya`.
2. Jalankan perintah:
   ```powershell
   .\start.ps1
   ```

### Menggunakan Command Prompt (CMD):
1. Klik dua kali file `start.bat` atau jalankan dari CMD:
   ```cmd
   start.bat
   ```

*Skrip otomatis ini akan secara otomatis membuka dua jendela terminal (Backend FastAPI & Frontend React Vite).*

---

## 🛠️ 2. Cara Menjalankan Secara Manual (Langkah demi Langkah)

Jika Anda ingin menjalankan backend dan frontend secara terpisah pada dua jendela terminal:

### Langkah A: Menjalankan Backend Server (FastAPI)

1. Buka terminal baru dan masuk ke direktori `backend`:
   ```bash
   cd backend
   ```

2. Aktifkan *Virtual Environment* Python:
   - **Windows (PowerShell/CMD)**:
     ```powershell
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. *(Opsional)* Jika dependencies belum terpasang:
   ```bash
   pip install -r requirements.txt
   ```

4. Jalankan server backend:
   ```bash
   python main.py
   ```
   *Atau menggunakan Uvicorn langsung:*
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. Server Backend akan berjalan di `http://127.0.0.1:8000`.

---

### Langkah B: Menjalankan Frontend Web App (React + Vite)

1. Buka terminal baru dan masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```

2. *(Opsional)* Jika modul Node.js belum terpasang:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```

4. Frontend Web App akan berjalan di `http://localhost:5173`.

---

## 🌐 Alamat Port & Dokumentasi API

| Komponen | URL / Alamat | Keterangan |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Antarmuka pengguna (UI Dashboard & Video CCTV) |
| **Backend REST API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Endpoint utama AI Engine |
| **Swagger API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Dokumentasi interaktif API Swagger UI |
| **Health Check API** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) | Status kesehatan backend & database |

---

## 🎯 Panduan Fitur Utama & Penggunaan

### 1. Deteksi & Analisis Video CCTV AI Multi-Kendaraan
- Pilih node CCTV (misal: *CAM-001 Simpang Semanggi*) dan atur timestamp rekaman.
- Tentukan **Interval Sampling Frame** (misal: `0.5s/frame`, `1.0s/frame`, `5.0s/frame`, atau `0s - Semua Frame`).
- Unggah berkas video CCTV (`MP4`, `AVI`, `MOV`, `WEBM`) atau pilih *Sample Video*.
- Klik **"Jalankan Deteksi Video AI"**.

### 2. Memutar Video Hasil AI vs Video Raw CCTV
- Pada panel hasil, pilih tab **"Hasil AI Video Bounding Box"** untuk memutar video terannotasi lengkap dengan bounding box Cyan (Kendaraan) & Hijau (Plat Nomor).
- Gunakan kontrol **Play/Pause**, **Scrubber Timeline Slider**, serta pengatur kecepatan putar (1 FPS - 10 FPS).

### 3. Pemilih Plat & Inspeksi Frame (Multi-Vehicle Selector)
- Jika satu frame berisi banyak kendaraan, gunakan baris tombol pill `[ #1: B 1234 XYZ ] [ #2: D 9999 SS ]` untuk memilih kendaraan mana yang ingin diinspeksi secara rinci.
- Pada tabel **"Daftar Seluruh Kendaraan & Plat Nomor Terdeteksi di Video"**, klik tombol **`🔍 Inspeksi Frame`** atau **`📍 Lacak di GIS`**.

### 4. Perbesar Gambar Bounding Box (Lightbox Zoom Modal)
- Klik tombol **`Perbesar Bounding Box`** (`<Maximize2 />`) pada gambar hasil AI.
- Gunakan kontrol **Zoom In (`+`)**, **Zoom Out (`-`)**, atau lihat daftar bounding box `[x, y, w, h]` pada panel samping modal.

### 5. Pelacakan Rute GIS Peta Interaktif
- Klik tombol **"Lacak Pergerakan Rute Plat di Peta GIS"** pada kendaraan mana pun.
- Sistem akan berpindah ke tab **Pelacakan GIS (Neural Route Tracker)** dan menampilkan garis rute, node-node CCTV yang dilalui, timestamp pergerakan, serta estimasi kecepatan.

---

## ❓ Troubleshooting / Solusi Masalah Umum

### 1. Port 8000 / 5173 Sudah Digunakan (*Port Already in Use*)
- Hentikan proses yang menggunakan port tersebut atau ubah port di `main.py` / `vite.config.js`.
- Di Windows CMD/PowerShell:
  ```cmd
  netstat -ano | findstr :8000
  taskkill /PID <PID_NUMBER> /F
  ```

### 2. Model PyTorch / EasyOCR / YOLO Pertama Kali Download Berjalan Lama
- Saat pertama kali dijalankan, PyTorch dan EasyOCR akan mengunduh file bobot (*weights*) model (`yolov8n.pt`, model EasyOCR CRAFT).
- Pastikan koneksi internet aktif pada saat eksekusi pertama. Setelah terunduh, model akan tersimpan di *cache* lokal komputer Anda.

### 3. Gagal Mengunggah Video Ukuran Besar
- Pastikan format video yang diunggah adalah `.mp4`, `.avi`, `.mov`, `.webm`, atau `.mkv`.

---

*Hak Cipta © 2026 Tim Pengembang JagaRaya — Advanced AI CCTV ALPR & Traffic Intelligence System.*
