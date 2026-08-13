import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Copy,
  KeyRound,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";

import { CodeWindow } from "./code-window";
import { DocsNav } from "./docs-nav";
import { docSnippets, responseJson } from "./snippets";

type CheckName = "key" | "environment" | "request" | "response";

export function DocsPage() {
  const [copied, setCopied] = useState("");
  const [checks, setChecks] = useState<Record<CheckName, boolean>>({
    key: false,
    environment: false,
    request: false,
    response: false,
  });
  const copySnippet = (name: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(name);
    window.setTimeout(() => setCopied(""), 1600);
  };
  const toggleCheck = (name: CheckName) =>
    setChecks({ ...checks, [name]: !checks[name] });
  return (
    <Shell role="user">
      <PageHeader
        eyebrow="DEVELOPER CENTRE"
        title="Documentation"
        description="Generate a key, connect your system, and verify your first extraction request step by step."
        action={
          <a
            href="#connect"
            className="eb-button eb-button-secondary eb-button-md"
            data-testid="link-jump-quickstart"
          >
            <BookOpen size={16} /> Start integrating
          </a>
        }
      />
      <div className="docs-layout">
        <DocsNav />
        <article className="docs-article">
          <div id="overview" className="doc-section">
            <div className="doc-tag">01 / OVERVIEW</div>
            <h2>
              Connect your application to dependable extraction infrastructure.
            </h2>
            <p>
              EthioBridge turns JSON, XML, CSV, XLS, and XLSX files into
              structured records through one endpoint. The integration has three
              parts: create an API key, keep it on your server, and send a
              multipart request with the document.
            </p>
            <div className="doc-callout">
              <Zap size={18} />
              <div>
                <strong>Production base URL</strong>
                <code>https://api.ethiobridge.example</code>
                <span className="callout-note">
                  Use the same base URL for every extraction request.
                </span>
              </div>
            </div>
            <div className="connection-flow">
              <div>
                <span className="flow-number">1</span>
                <strong>Your server</strong>
                <small>Stores the key</small>
              </div>
              <ArrowRight size={16} />
              <div>
                <span className="flow-number">2</span>
                <strong>EthioBridge</strong>
                <small>POST /v1/extract</small>
              </div>
              <ArrowRight size={16} />
              <div>
                <span className="flow-number">3</span>
                <strong>Your records</strong>
                <small>JSON response</small>
              </div>
            </div>
          </div>
          <div id="generate-key" className="doc-section">
            <div className="doc-tag">02 / GENERATE A KEY</div>
            <h3>Create your connection credential</h3>
            <p>
              API keys identify your organization when your system sends a
              document. Create one from the API keys page, select the plan that
              matches your daily volume, and copy the raw value immediately.
            </p>
            <div className="doc-steps">
              <div>
                <span>01</span>
                <strong>Open API keys</strong>
                <p>Go to API keys in the workspace navigation.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Create a key</strong>
                <p>Choose Free, Business, or Enterprise and confirm.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Save the raw key</strong>
                <p>
                  Copy it once. It cannot be retrieved after the dialog closes.
                </p>
              </div>
            </div>
            <Link
              href="/app/api-keys"
              className="eb-button eb-button-primary eb-button-md"
              data-testid="link-generate-api-key-from-docs"
            >
              <KeyRound size={16} /> Generate an API key{" "}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div id="authentication" className="doc-section">
            <div className="doc-tag">03 / AUTHENTICATION</div>
            <h3>Use the key as a Bearer token</h3>
            <p>
              Send the raw API key in the <code>Authorization</code> header. Put
              it in a server-side environment variable named{" "}
              <code>ETHIOBRIDGE_API_KEY</code>. Never expose it in frontend
              JavaScript, mobile app bundles, public repositories, or logs.
            </p>
            <div className="auth-detail-grid">
              <div>
                <span>Header name</span>
                <code>Authorization</code>
              </div>
              <div>
                <span>Header value</span>
                <code>Bearer YOUR_API_KEY</code>
              </div>
              <div>
                <span>Credential type</span>
                <code>API key</code>
              </div>
            </div>
            <div className="inline-code">
              Authorization: Bearer eb_live_your_key
            </div>
          </div>
          <div id="connect" className="doc-section">
            <div className="doc-tag">04 / CONNECT YOUR SYSTEM</div>
            <h3>Copy the example for your stack</h3>
            <p>
              All examples call the same endpoint. Your server sends the file as
              multipart form data using the exact field name <code>file</code>.
            </p>
            <div className="integration-callout">
              <ShieldCheck size={18} />
              <div>
                <strong>Keep this server-side</strong>
                <span>
                  The API key belongs in your backend or job worker. Browser
                  code should call your own server, not EthioBridge directly.
                </span>
              </div>
            </div>
            <CodeWindow
              label="cURL"
              testId="curl"
              copied={copied}
              onCopy={() => copySnippet("curl", docSnippets.curl)}
            >
              {docSnippets.curl}
            </CodeWindow>
            <CodeWindow
              label="Node.js"
              testId="node"
              copied={copied}
              onCopy={() => copySnippet("node", docSnippets.node)}
            >
              {docSnippets.node}
            </CodeWindow>
            <CodeWindow
              label="Python"
              testId="python"
              copied={copied}
              onCopy={() => copySnippet("python", docSnippets.python)}
            >
              {docSnippets.python}
            </CodeWindow>
          </div>
          <div id="quickstart" className="doc-section">
            <div className="doc-tag">05 / QUICKSTART REQUEST</div>
            <h3>Request contract</h3>
            <p>
              Use <code>POST /v1/extract</code> with a{" "}
              <code>multipart/form-data</code> body. Supported formats are JSON,
              XML, CSV, XLS, and XLSX. The demo playground lets you test the
              same flow before wiring your own server.
            </p>
            <div className="request-contract">
              <div>
                <span>Method</span>
                <code>POST</code>
              </div>
              <div>
                <span>Path</span>
                <code>/v1/extract</code>
              </div>
              <div>
                <span>Auth</span>
                <code>Bearer API key</code>
              </div>
              <div>
                <span>File field</span>
                <code>file</code>
              </div>
            </div>
            <Link
              href="/app/playground"
              className="text-link"
              data-testid="link-open-playground-from-docs"
            >
              Test this request in Playground <ArrowRight size={14} />
            </Link>
          </div>
          <div id="response" className="doc-section">
            <div className="doc-tag">06 / RESPONSE SHAPE</div>
            <h3>Check the response before saving records</h3>
            <p>
              Check <code>status</code> first, then read the extracted records
              from <code>data.records</code>. The response also includes the
              detected file type, record count, and processing time.
            </p>
            <div className="code-window response-window">
              <div className="code-window-top">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <button
                  onClick={() => copySnippet("response", responseJson)}
                  data-testid="button-copy-doc-response"
                >
                  {copied === "response" ? (
                    <ClipboardCheck size={15} />
                  ) : (
                    <Copy size={15} />
                  )}{" "}
                  {copied === "response" ? "Copied" : "Copy JSON"}
                </button>
              </div>
              <pre>{responseJson}</pre>
            </div>
          </div>
          <div id="errors" className="doc-section">
            <div className="doc-tag">07 / ERRORS & CHECKS</div>
            <h3>Verify your integration</h3>
            <p>
              Use this checklist while connecting. A successful HTTP request
              should also have <code>status: "success"</code> in the JSON
              envelope.
            </p>
            <div className="integration-checklist">
              <label>
                <input
                  type="checkbox"
                  checked={checks.key}
                  onChange={() => toggleCheck("key")}
                />
                <span>
                  <strong>Key created and saved</strong>
                  <small>
                    The raw key is stored in your server environment.
                  </small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checks.environment}
                  onChange={() => toggleCheck("environment")}
                />
                <span>
                  <strong>Key is not exposed</strong>
                  <small>
                    It is not in browser code, source control, or logs.
                  </small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checks.request}
                  onChange={() => toggleCheck("request")}
                />
                <span>
                  <strong>First request works</strong>
                  <small>
                    Your server sends Bearer auth and a <code>file</code>{" "}
                    multipart field.
                  </small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={checks.response}
                  onChange={() => toggleCheck("response")}
                />
                <span>
                  <strong>Response is handled</strong>
                  <small>
                    Your system checks <code>status</code> and reads{" "}
                    <code>data.records</code>.
                  </small>
                </span>
              </label>
            </div>
            <div className="error-list">
              <div>
                <code>INVALID_API_KEY</code>
                <span>
                  Key is missing, revoked, or expired. Create or regenerate a
                  key.
                </span>
              </div>
              <div>
                <code>RATE_LIMIT_EXCEEDED</code>
                <span>
                  Your plan's daily request limit has been reached. Check Usage
                  or upgrade your plan.
                </span>
              </div>
              <div>
                <code>UNSUPPORTED_FORMAT</code>
                <span>File must be JSON, XML, CSV, XLS, or XLSX.</span>
              </div>
              <div>
                <code>FILE_TOO_LARGE</code>
                <span>File exceeds the configured size limit.</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </Shell>
  );
}
