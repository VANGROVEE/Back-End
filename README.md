---

# Vangrove Back-End 🌿

Sistem cerdas manajemen agri-tech Mangrove berbasis **Decision Support System (DSS)**. Menggunakan Bun sebagai runtime utama, Prisma untuk ORM, dan integrasi Google Gemini AI untuk rekomendasi operasional serta efisiensi energi.

## 🚀 Fitur Utama
- **AI Recommendation Engine**: Menggunakan Google Gemini 1.5 Flash untuk analisis data historis dan prediksi cuaca.
- **Weather Integration**: Integrasi *real-time* dengan OpenWeatherMap API.
- **Energy Monitoring**: Pelacakan konsumsi daya pompa air dan efisiensi operasional.
- **Security**: Autentikasi menggunakan Passport JWT dan validasi skema ketat menggunakan Zod.
- **Documentation**: API Auto-generated menggunakan Swagger/OpenAPI.

## 🛠️ Stack Teknologi
- **Runtime**: [Bun](https://bun.sh)
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL dengan Prisma ORM
- **AI**: Google Generative AI (Gemini)
- **Validation**: Zod
- **Logger**: Pino & Pino-pretty

---

## 📋 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- [Bun](https://bun.sh) (v1.1.x atau terbaru)
- PostgreSQL

---

## ⚙️ Instalasi & Setup

1. **Clone repositori**

   ```bash
   git clone https://github.com/VANGROVEE/Back-End.git
   cd back-end
   ```

2. **Instal dependencies**

   ```bash
   bun install

   ```

````

3. **Konfigurasi Environment**
   Buat file `.env` di root direktori dan sesuaikan variabel berikut:
   ```env
   # App
   PORT=8000
   NODE_ENV=development

   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/vangrove"

   # AI & Weather
   GEMINI_API_KEY=your_gemini_key
   OPENWEATHER_API_KEY=your_openweather_key
   OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5/forecast

   # Auth & Supabase
   JWT_SECRET=your_minimal_32_characters_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
````

4. **Prisma Setup**
   Generate client dan jalankan migrasi:
   ```bash
   bunx prisma generate
   bunx prisma migrate dev
   ```

---

## 🏃 Menjalankan Aplikasi

Aplikasi menyediakan dua mode utama sesuai dengan `package.json`:

- **Mode Pengembangan (Hot Reload)**

  ```bash
  bun run dev
  ```

- **Mode Produksi**
  ```bash
  bun run start
  ```

---

## 🧹 Linting & Formatting

Proyek ini menggunakan ESLint dan Prettier untuk menjaga kualitas kode.

- **Check & Fix Lint**: `bun run lint`
- **Auto Format**: `bun run format`

---

## 📑 API Documentation

Setelah server berjalan, Anda dapat mengakses dokumentasi API (Swagger) pada alamat:
`http://localhost:8000/docs` (atau sesuai konfigurasi PORT Anda).

## 🤝 Kontribusi

Proyek ini menggunakan **Commitizen** untuk standarisasi pesan commit. Untuk melakukan commit, gunakan:

```bash
git cz
```

---

**Vangrove Team** - _Membangun masa depan pesisir dengan teknologi._

```

```
