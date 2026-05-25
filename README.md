# Vangrove Back-End 🌿

Sistem cerdas manajemen agri-tech Mangrove berbasis **Decision Support System (DSS)**. Menggunakan Bun sebagai runtime utama, Prisma untuk ORM, Redis untuk Caching, dan integrasi Google Gemini AI.

---

## 1. 🚀 Fitur Utama

- **AI Recommendation Engine**: Analisis data operasional menggunakan Google Gemini 1.5 Flash.
- **High Performance Caching**: Optimasi latensi API menggunakan **Redis** (Response time < 10ms).
- **Energy Monitoring**: Pelacakan konsumsi daya pompa air dan efisiensi energi.
- **Real-time Logging**: Mentoring performa aplikasi menggunakan **Pino**.
- **Automated Docs**: Dokumentasi API interaktif menggunakan Swagger.

---

## 2. 🛠️ Stack Teknologi

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL & Redis
- **ORM**: Prisma
- **AI**: Google Generative AI (Gemini)
- **Validation**: Zod
- **Logger**: Pino

---

## 3. 📋 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- [Bun](https://bun.sh) (v1.1.x atau terbaru)
- **Docker & Docker Compose** (Wajib untuk menjalankan Database & Redis secara lokal)

---

## 4. ⚙️ Instalasi & Setup

1.  **Clone Repositori**
    ```bash
    git clone [https://github.com/VANGROVEE/Back-End.git](https://github.com/VANGROVEE/Back-End.git)
    cd back-end
    ```
2.  **Instal Dependensi**
    ```bash
    bun install
    ```
3.  **Konfigurasi Environment**
    Salin template `.env.example` menjadi `.env` dan isi kredensial yang diperlukan:
    ```bash
    cp .env.example .env
    ```
4.  **Jalankan Infrastruktur (Docker)**
    Jalankan PostgreSQL dan Redis dalam satu perintah:
    ```bash
    docker-compose up -d
    ```
5.  **Setup Database**
    Generate Prisma client dan jalankan migrasi:
    ```bash
    bunx prisma generate
    bunx prisma migrate dev
    ```

---

## 5. 🏃 Menjalankan Aplikasi

- **Mode Pengembangan (Hot Reload)**
  ```bash
  bun run dev
  ```
- **Mode Produksi**
  ```bash
  bun run start
  ```

---

## 6. 📑 Monitoring & Dokumentasi

- **API Documentation**: `http://localhost:8000/api/v1/docs`
- **Health Check**: `http://localhost:8000/api/v1/health`
- **Performance Monitoring**: Pantau durasi request langsung di terminal melalui log Pino yang mencatat response time setiap request secara real-time.

---

**Vangrove Team** - _Membangun masa depan pesisir dengan teknologi._
