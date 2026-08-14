import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Filter,
  KeyRound,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  RefreshCw,
  X,
  Ban,
} from "lucide-react";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  regenerateApiKey,
  type ApiKeyMetadata,
} from "@/lib/api/apiKeysApi";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { formatDate } from "@/lib/utils";

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyMetadata[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await listApiKeys();
      setKeys(data.apiKeys);
      setError("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async () => {
    setError("");
    try {
      const data = await createApiKey(plan);
      setKeys((prev) => [data.apiKey, ...prev]);
      setRawKey(data.key);
      setCopied(false);
      setShowCreate(false);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create API key.");
    }
  };

  const handleRevoke = async (id: string) => {
    setError("");
    try {
      const data = await revokeApiKey(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? data.apiKey : k)));
    } catch (err: any) {
      setError(err?.message ?? "Failed to revoke API key.");
    }
  };

  const handleRegenerate = async (id: string) => {
    setError("");
    try {
      const data = await regenerateApiKey(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? data.apiKey : k)));
      setRawKey(data.key);
      setCopied(false);
    } catch (err: any) {
      setError(err?.message ?? "Failed to regenerate API key.");
    }
  };

  const copyRawKey = () => {
    if (rawKey) navigator.clipboard?.writeText(rawKey);
    setCopied(true);
  };

  return (
    <Shell role="user">
      <PageHeader
        eyebrow="ACCESS CONTROL"
        title="API keys"
        description="Create a credential, add it to your system securely, and use it to send extraction requests."
        action={
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-api-key">
            <Plus size={16} /> Create API key
          </Button>
        }
      />
      {error && <div className="field-error" data-testid="status-api-keys-error">{error}</div>}
      <Card className="notice-card">
        <div className="notice-icon"><LockKeyhole size={17} /></div>
        <div>
          <strong>Treat keys like passwords</strong>
          <p>EthioBridge never stores or displays the raw value after this session. Use environment variables in production.</p>
        </div>
        <Link href="/app/docs#authentication" className="text-link ml-auto" data-testid="link-key-security-docs">
          Security guide <ArrowRight size={14} />
        </Link>
      </Card>
      <Card className="table-card">
        <div className="table-card-header">
          <div>
            <div className="section-kicker">CREDENTIALS</div>
            <h2>Your API keys <span className="count-pill">{keys.length}</span></h2>
          </div>
          <button className="filter-button" data-testid="button-filter-api-keys">
            <Filter size={15} /> Filter
          </button>
        </div>
        <div className="table-scroll">
          <table className="eb-table eb-table-wide">
            <thead>
              <tr>
                <th>Key</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="muted">Loading…</td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={5} className="muted">No API keys yet. Create one to get started.</td></tr>
              ) : keys.map((key) => (
                <tr key={key.id} data-testid={`row-api-key-${key.id}`}>
                  <td>
                    <div className="key-cell">
                      <span className="key-symbol"><KeyRound size={15} /></span>
                      <span className="mono">{key.keyPrefix}••••••••</span>
                    </div>
                  </td>
                  <td><span className="plan-name">{key.plan}</span></td>
                  <td><Badge tone={key.status === "active" ? "success" : "neutral"}>{key.status}</Badge></td>
                  <td className="muted">{formatDate(key.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="row-action-button"
                        disabled={key.status !== "active"}
                        onClick={() => void handleRegenerate(key.id)}
                        aria-label={`Regenerate ${key.keyPrefix}`}
                        data-testid={`button-regenerate-${key.id}`}
                      >
                        <RefreshCw size={15} />
                      </button>
                      <button
                        className="row-action-button danger-hover"
                        disabled={key.status !== "active"}
                        onClick={() => void handleRevoke(key.id)}
                        aria-label={`Revoke ${key.keyPrefix}`}
                        data-testid={`button-revoke-${key.id}`}
                      >
                        <Ban size={15} />
                      </button>
                      <button className="row-action-button" aria-label={`More actions for ${key.keyPrefix}`} data-testid={`button-more-${key.id}`}>
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {showCreate && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-key-title">
            <button className="modal-close" onClick={() => setShowCreate(false)} aria-label="Close create key dialog" data-testid="button-close-create-key">
              <X size={18} />
            </button>
            <div className="modal-icon"><KeyRound size={20} /></div>
            <div className="section-kicker">NEW CREDENTIAL</div>
            <h2 id="create-key-title">Create an API key</h2>
            <p className="modal-description">Choose a plan for this credential. The raw key will be displayed once after creation.</p>
            <label className="field-label" htmlFor="key-plan">Plan</label>
            <select id="key-plan" className="eb-input" value={plan} onChange={(event) => setPlan(event.target.value)} data-testid="select-key-plan">
              <option value="free">Free · 100 requests/day</option>
              <option value="business">Business · 10,000 requests/day</option>
              <option value="enterprise">Enterprise · Custom limit</option>
            </select>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowCreate(false)} data-testid="button-cancel-create-key">Cancel</Button>
              <Button onClick={() => void handleCreate()} data-testid="button-confirm-create-key"><Plus size={16} /> Create key</Button>
            </div>
          </div>
        </div>
      )}
      {rawKey && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal raw-key-modal" role="dialog" aria-modal="true" aria-labelledby="raw-key-title">
            <div className="modal-icon success-icon"><CheckCircle2 size={20} /></div>
            <div className="section-kicker">SAVE THIS NOW</div>
            <h2 id="raw-key-title">Your raw key is ready</h2>
            <p className="modal-description">Copy this value into your server environment as <code>ETHIOBRIDGE_API_KEY</code>. This is the only time you will see the full key.</p>
            <div className="raw-key-box">
              <code data-testid="text-raw-api-key">{rawKey}</code>
              <button onClick={copyRawKey} aria-label="Copy raw API key" data-testid="button-copy-raw-key">
                {copied ? <ClipboardCheck size={17} /> : <Copy size={17} />}
              </button>
            </div>
            {copied && <div className="copy-feedback"><Check size={14} /> Copied to clipboard</div>}
            <div className="modal-actions">
              <Link href="/app/docs#connect" className="eb-button eb-button-secondary eb-button-md" onClick={() => setRawKey(null)} data-testid="link-raw-key-docs">
                View connection docs <ArrowRight size={15} />
              </Link>
              <Button onClick={() => setRawKey(null)} data-testid="button-close-raw-key">I have saved it</Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
