import csv from "csv-parser";
import { Readable } from "node:stream";
import { ExtractionError } from "../extraction-error.js";

export function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const records = [];
    Readable.from([buffer])
      .pipe(csv())
      .on("data", (record) => records.push(record))
      .on("end", () => {
        if (records.length === 0) {
          reject(
            new ExtractionError(
              "EMPTY_FILE",
              "The CSV file contains no records.",
              400,
            ),
          );
          return;
        }
        resolve(records);
      })
      .on("error", () => {
        reject(
          new ExtractionError(
            "UNSUPPORTED_FORMAT",
            "The uploaded CSV content is invalid.",
            415,
          ),
        );
      });
  });
}