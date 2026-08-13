import { apiFetch } from "./client";

export interface ExtractResponse {
  status: string;
  format: "json" | "xml" | "csv" | "xls" | "xlsx";
  records: Record<string, unknown>[];
  recordCount: number;
}

export async function extractDocument(
  file: File,
  apiKey: string,
): Promise<ExtractResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ExtractResponse>("/v1/extract", {
    method: "POST",
    form,
    token: apiKey,
  });
}
