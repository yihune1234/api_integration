import multer from "multer";
import { ExtractionError } from "../modules/extraction/extraction-error.js";

const allowedExtensions = new Set([".json", ".xml", ".csv", ".xls", ".xlsx"]);

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter(_request, file, callback) {
    const extension = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();

    if (!allowedExtensions.has(extension)) {
      callback(
        new ExtractionError(
          "UNSUPPORTED_FORMAT",
          "Only JSON, XML, CSV, XLS, and XLSX files are supported.",
          415,
        ),
      );
      return;
    }

    callback(null, true);
  },
});