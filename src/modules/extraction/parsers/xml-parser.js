import { XMLParser } from "fast-xml-parser";
import { ExtractionError } from "../extraction-error.js";

export function parseXml(buffer) {
  try {
    const parsed = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: true,
      trimValues: true,
    }).parse(buffer.toString("utf8"));
    if (!parsed || Object.keys(parsed).length === 0) {
      throw new ExtractionError(
        "EMPTY_FILE",
        "The XML file contains no records.",
        400,
      );
    }
    return [parsed];
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "The uploaded XML content is invalid.",
      415,
    );
  }
}