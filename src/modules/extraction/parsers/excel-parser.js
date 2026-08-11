import ExcelJS from "exceljs";
import { ExtractionError } from "../extraction-error.js";

export async function parseExcel(buffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const records = [];

    workbook.eachSheet((sheet) => {
      const rows = [];
      sheet.eachRow((row) => {
        const record = {};
        row.eachCell({ includeEmpty: true }, (cell) => {
          record[cell.address] = cell.value;
        });
        rows.push(record);
      });
      if (rows.length > 0) {
        records.push(...rows.map((row) => ({ ...row, _sheet: sheet.name })));
      }
    });

    if (records.length === 0) {
      throw new ExtractionError(
        "EMPTY_FILE",
        "The Excel file contains no records.",
        400,
      );
    }
    return records;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    throw new ExtractionError(
      "UNSUPPORTED_FORMAT",
      "The uploaded Excel content is invalid.",
      415,
    );
  }
}