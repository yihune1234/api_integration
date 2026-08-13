import { useEffect, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Code2,
  Copy,
  FileText,
  Play,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import { listApiKeys, type ApiKeyMetadata } from "@/lib/api/apiKeysApi";
import { extractDocument, type ExtractResponse } from "@/lib/api/extractApi";
import { ApiError } from "@/lib/api/client";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader, EmptyState } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { cn } from "@/lib/utils";

export function PlaygroundPage() {
  const [keys, setKeys] = useState<ApiKeyMetadata[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [rawKeyInput, setRawKeyInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [response, setResponse] = useState<ExtractResponse | null>(null);
  const [requestError, setRequestError] = useState("");
  const [running, setRunning] = useState(false);
  const allowed = ["json", "xml", "csv", "xls", "xlsx"];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listApiKeys();
        if (!cancelled) {
          const active = data.apiKeys.filter((k) => k.status === "active");
          setKeys(active);
          setSelectedKey(active[0]?.id ?? "");
        }
      } catch (err: any) {
        if (!cancelled) setRequestError(err?.message ?? "Failed to load API keys.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (!chosen) return;
    const extension = chosen.name.split(".").pop()?.toLowerCase() || "";
    if (!allowed.includes(extension)) {
      setFile(null);
      setFileError("Unsupported format. Choose JSON, XML, CSV, XLS, or XLSX.");
      return;
    }
    if (chosen.size > 10 * 1024 * 1024) {
      setFile(null);
      setFileError("This file is larger than the 10 MB limit.");
      return;
    }
    setFile(chosen);
    setFileError("");
    setRequestError("");
    setResponse(null);
  };

  const runExtraction = async () => {
    setRequestError("");
    setResponse(null);
    if (!selectedKey) {
      setRequestError("MISSING_API_KEY — Select an active API key before sending.");
      return;
    }
    const key = keys.find((item) => item.id === selectedKey);
    if (!file) {
      setRequestError("EMPTY_FILE — Add a supported file before sending.");
      return;
    }
    if (!key || key.status !== "active") {
      setRequestError("INVALID_API_KEY — This credential is no longer active.");
      return;
    }
    if (!rawKeyInput.trim()) {
      setRequestError("MISSING_API_KEY — Paste your raw API key (eb_live_...) to send the request.");
      return;
    }
    setRunning(true);
    try {
      const result = await extractDocument(file, rawKeyInput.trim());
      setResponse(result);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setRequestError(`${err.errorCode} — ${err.message}`);
      } else {
        setRequestError(err?.message ?? "Request failed.");
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <Shell role="user">
      <PageHeader
        eyebrow="INTERACTIVE REQUEST BUILDER"
        title="Playground"
        description="Test the extraction endpoint with a local file. Nothing is uploaded until you press send."
        action={<Badge tone="success"><span className="status-dot" /> Live backend</Badge>}
      />
      <div className="playground-layout">
        <Card className="request-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">REQUEST</div>
              <h2>Build an extraction call</h2>
            </div>
            <span className="method-pill">POST</span>
          </div>
          <label className="field-label" htmlFor="playground-key">API key</label>
          <div className="select-wrap">
            <select id="playground-key" className="eb-input" value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)} data-testid="select-playground-key">
              <option value="">Select an active key</option>
              {keys.map((key) => (
                <option value={key.id} key={key.id}>{key.keyPrefix} · {key.plan}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
          <div className="field-space">
            <label className="field-label" htmlFor="playground-raw-key">Raw API key</label>
            <input
              id="playground-raw-key"
              type="password"
              className="eb-input"
              value={rawKeyInput}
              onChange={(event) => setRawKeyInput(event.target.value)}
              placeholder="Paste your eb_live_... key here"
              autoComplete="off"
              data-testid="input-playground-raw-key"
            />
            <span className="field-hint">The raw key is shown only once at creation. Paste it here to send a real request.</span>
          </div>
          <div className="field-space">
            <label className="field-label" htmlFor="playground-file">Document</label>
            <label className={cn("dropzone", file && "dropzone-ready")} htmlFor="playground-file">
              <input id="playground-file" type="file" accept=".json,.xml,.csv,.xls,.xlsx" onChange={onFile} data-testid="input-playground-file" />
              {file ? (
                <>
                  <div className="dropzone-file-icon"><FileText size={20} /></div>
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024).toFixed(1)} KB · {(file.name.split(".").pop() || "").toUpperCase()}</span>
                  <button type="button" className="dropzone-remove" onClick={(event) => { event.preventDefault(); setFile(null); }} aria-label="Remove selected file" data-testid="button-remove-playground-file">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <div className="dropzone-icon"><UploadCloud size={22} /></div>
                  <strong>Drop a document here</strong>
                  <span>or click to browse · JSON, XML, CSV, XLS, XLSX</span>
                </>
              )}
            </label>
            {fileError && (
              <div className="field-error" data-testid="status-file-error">
                <AlertTriangle size={14} />
                {fileError}
              </div>
            )}
          </div>
          <div className="endpoint-line">
            <span>Endpoint</span>
            <code>POST /v1/extract</code>
          </div>
          <Button className="w-full" size="lg" onClick={() => void runExtraction()} disabled={running} data-testid="button-run-extraction">
            {running ? (<><RefreshCw size={16} className="spin" /> Sending request…</>) : (<><Play size={16} /> Send extraction request</>)}
          </Button>
          {requestError && (
            <div className="request-error" data-testid="status-playground-error">
              <AlertTriangle size={16} />
              <div>
                <strong>Request could not be completed</strong>
                <span>{requestError}</span>
              </div>
            </div>
          )}
        </Card>
        <Card className="response-card">
          <div className="card-heading">
            <div>
              <div className="section-kicker">RESPONSE</div>
              <h2>Extraction result</h2>
            </div>
            {response && <Badge tone="success">200 · Success</Badge>}
          </div>
          {running ? (
            <div className="response-loading">
              <div className="skeleton-line long" />
              <div className="skeleton-line medium" />
              <div className="skeleton-line short" />
              <div className="skeleton-block" />
            </div>
          ) : response ? (
            <div className="json-viewer" data-testid="text-playground-response">
              <div className="json-toolbar">
                <span><span className="json-dot" /> application/json</span>
                <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(response, null, 2))} data-testid="button-copy-playground-response">
                  <Copy size={14} /> Copy JSON
                </button>
              </div>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          ) : (
            <EmptyState
              icon={Code2}
              title="Your response will appear here"
              description="Select an API key and a supported document, then send the request to see the real extraction response."
            />
          )}
        </Card>
      </div>
    </Shell>
  );
}
