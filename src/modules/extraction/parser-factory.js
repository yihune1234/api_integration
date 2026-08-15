import { parseCsv } from "./parsers/csv-parser.js";
import { parseExcel } from "./parsers/excel-parser.js";
import { parseJson } from "./parsers/json-parser.js";
import { parseXml } from "./parsers/xml-parser.js";

export function parseDocument(type, buffer) {
  switch (type) {
    case "json":
      return parseJson(buffer);
    case "xml":
      return parseXml(buffer);
    case "csv":
      return parseCsv(buffer);
    case "xls":
    case "xlsx":
      return parseExcel(buffer);
    default:
      throw new Error(`Unsupported parser type: ${type}`);
  }
}