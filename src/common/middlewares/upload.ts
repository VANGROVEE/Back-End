import multer from "multer";
import { ApiError } from "../utils/api-error";

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv",
        ),
      );
    }
  },
});
