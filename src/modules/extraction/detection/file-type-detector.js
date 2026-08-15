import path from "node:path";
import { ExtractionError } from "../extraction-error.js";

function textContent(buffer) {
  return buffer.toString("utf8").replace(/^\uFEFF/, "").trim();
}

export function detectFileType(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const buffer = file.buffer;

  if (!buffer || buffer.length === 0) {
    throw new ExtractionError("EMPTY_FILE", "The uploaded file is empty.", 400);
  }

  const content = textContent(buffer);
  if (!content) {
    throw new ExtractionError("EMPTY_FILE", "The uploaded file is empty.", 400);
  }

  if (buffer.subarray(0, 4).toString("hex") === "504b0304") {
    if (extension !== ".xlsx") {
      throw new ExtractionError(
        "UNSUPPORTED_FORMAT",
        "The file content does not match a supported format.",
        415,
      );
    }
    return "xlsx";
  }

  if (buffer.subarray(0, 8).toString("hex") === "d0cf11e0a1b11ae1") {
    if (extension !== ".xls") {
      throw new ExtractionError(
        "UNSUPPORTED_FORMAT",
        "The file content does not match a supported format.",
        415,
      );
    }
    return "xls";
  }

  if (extension === ".json") {
    try {
      JSON.parse(content);
    } catch {
      throw new ExtractionError(
        "UNSUPPORTED_FORMAT",
        "The uploaded JSON content is invalid.",
        415,
      );
    }
    return "json";
  }

  if (extension === ".xml" || content.startsWith("<")) {
    if (!content.startsWith("<")) {
      throw new ExtractionError(
        "UNSUPPORTED_FORMAT",
        "The uploaded XML content is invalid.",
        415,
      );
    }
    return "xml";
  }

  if (extension === ".csv" || content.includes(",") || content.includes("\t")) {
    return "csv";
  }

  throw new ExtractionError(
    "UNSUPPORTED_FORMAT",
    "The file content does not match a supported format.",
    415,
  );
}