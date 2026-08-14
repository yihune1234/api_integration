import { ExtractionError } from "../extraction-error.js";

export function parseJson(buffer) {
  try {
    const parsed = JSON.parse(buffer.toString("utf8").replace(/^\uFEFF/, ""));
    const records = Array.isArray(parsed) ? parsed : [parsed];
    if (records.length === 0) {
      throw new ExtractionError(
        "EMPTY_FILE",
        "The JSON file contains no records.",
        400,
      );
    }
    return records;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "The uploaded JSON content is invalid.",
      415,
    );
  }
}