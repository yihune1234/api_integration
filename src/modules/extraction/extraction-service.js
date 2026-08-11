import { detectFileType } from "./detection/file-type-detector.js";
import { ExtractionError } from "./extraction-error.js";
import { parseDocument } from "./parser-factory.js";

export { ExtractionError };

export async function extractDocument(file) {
  if (!file) {
    throw new ExtractionError(
      "EMPTY_FILE",
      "A document file is required.",
      400,
    );
  }

  const type = detectFileType(file);
  const records = await parseDocument(type, file.buffer);
  return {
    format: type,
    records,
    recordCount: records.length,
  };
}