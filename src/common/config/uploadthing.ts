import { createUploadthing, type FileRouter } from "uploadthing/express";

const f = createUploadthing();

export const uploadRouter = {
  healthReportImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => ({ authorized: true })) // Tambahkan pengecekan JWT di sini
    .onUploadComplete(({ file }) => {
      console.log("Upload selesai di S3:", file.url);
    }),
} satisfies FileRouter;
