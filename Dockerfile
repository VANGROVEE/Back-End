# 1. Base Image: Gunakan debian-slim (oven/bun:1-slim) 
# Jauh lebih stabil untuk Prisma Engine dan Bcrypt dibanding Alpine.
FROM oven/bun:1-slim AS base
WORKDIR /app

# 2. Stage Dependencies & Prisma Generation
FROM base AS install
# Copy package dan lockfile
COPY package.json bun.lock* ./

# 🌟 PENTING: Copy folder prisma SEBELUM generate
COPY prisma ./prisma

# Install dependencies (akan menggunakan bun.lock untuk konsistensi)
RUN bun install --frozen-lockfile

# Generate Prisma Client (hasilnya masuk ke node_modules/.prisma/client)
RUN bunx prisma generate

# 3. Stage Release (Production Image)
FROM base AS release
# Set environment ke production
ENV NODE_ENV=production

# Copy node_modules (yang sudah berisi Prisma Client) dari stage install
COPY --from=install /app/node_modules ./node_modules
COPY --from=install /app/package.json ./package.json

# Copy source code dan entry point
COPY src ./src
COPY index.ts ./
COPY --from=install /app/src/generated ./src/generated

# 🌟 SANGAT WAJIB: Copy tsconfig agar Bun bisa membaca path alias @/
COPY tsconfig.json ./

# Copy folder prisma (opsional, tapi disarankan jika kamu butuh run migration di production)
COPY prisma ./prisma 

# Set Port (sesuai Railway/Vercel standard)
ENV PORT=8000
EXPOSE 8000

# Eksekusi server menggunakan script start dari package.json
CMD ["bun", "run", "start"]