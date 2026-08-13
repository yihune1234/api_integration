import { useEffect, useState } from "react";
import { KeyRound, Search, Ban } from "lucide-react";
import { listAdminApiKeys, revokeAdminApiKey, type AdminApiKey } from "@/lib/api/adminApi";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { formatDate } from "@/lib/utils";

export function AdminApiKeysPage() {
  const [keys, setKeys] = useState<AdminApiKey[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");
    try {
      const data = await listAdminApiKeys();
      setKeys(data.apiKeys);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleRevoke = async (id: string) => {
    setError("");
    try {
      await revokeAdminApiKey(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" } : k)));
    } catch (err: any) {
      setError(err?.message ?? "Failed to revoke API key.");
    }
  };

  const filtered = keys.filter((key) =>
    `${key.key_prefix} ${key.user_id} ${key.plan}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Shell role="admin">
      <PageHeader
        eyebrow="CREDENTIAL OVERSIGHT"
        title="All API keys"
        description="Inspect credential health and force-revoke compromised keys."
      />
      {error && <div className="field-error" data-testid="status-admin-keys-error">{error}</div>}
      <Card className="table-card">
        <div className="table-card-header">
          <div>
            <div className="section-kicker">PLATFORM CREDENTIALS</div>
            <h2>API key inventory <span className="count-pill">{filtered.length}</span></h2>
          </div>
          <div className="search-field">
            <Search size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search key or workspace" aria-label="Search API keys" data-testid="input-search-admin-keys" />
          </div>
        </div>
        <div className="table-scroll">
          <table className="eb-table eb-table-wide">
            <thead>
              <tr>
                <th>Key prefix</th>
                <th>Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="muted">Loading…</td></tr>
              ) : filtered.map((key) => (
                <tr key={key.id} data-testid={`row-admin-key-${key.id}`}>
                  <td>
                    <div className="key-cell">
                      <span className="key-symbol"><KeyRound size={15} /></span>
                      <span className="mono">{key.key_prefix}••••</span>
                    </div>
                  </td>
                  <td className="mono muted">{key.user_organization || key.user_email}</td>
                  <td className="plan-name">{key.plan}</td>
                  <td><Badge tone={key.status === "active" ? "success" : "neutral"}>{key.status}</Badge></td>
                  <td className="muted">{formatDate(key.created_at)}</td>
                  <td className="text-right">
                    <Button size="sm" variant="danger" disabled={key.status !== "active"} onClick={() => void handleRevoke(key.id)} data-testid={`button-admin-revoke-${key.id}`}>
                      <Ban size={14} /> Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
