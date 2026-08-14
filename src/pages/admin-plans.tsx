import { useEffect, useState } from "react";
import { Check, Pencil, ShieldCheck, Users } from "lucide-react";
import { listAdminPlans, updateAdminPlan, type AdminPlan } from "@/lib/api/adminApi";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell, CircleHelpIcon } from "@/components/app/shell";

export function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setError("");
    try {
      const data = await listAdminPlans();
      setPlans(data.plans);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async (planId: string) => {
    setError("");
    const value = Number(draft);
    if (!Number.isInteger(value) || value <= 0) {
      setError("maxRequests must be a positive integer.");
      return;
    }
    try {
      const data = await updateAdminPlan(planId, value);
      setPlans(data.plans);
      setEditing(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update plan.");
    }
  };

  return (
    <Shell role="admin">
      <PageHeader
        eyebrow="PRODUCT CONFIGURATION"
        title="Plans & limits"
        description="Set request ceilings that keep usage predictable for every organization."
        action={
          <Button variant="secondary" onClick={() => setEditing(null)} data-testid="button-plan-help">
            <CircleHelpIcon /> How limits work
          </Button>
        }
      />
      {error && <div className="field-error" data-testid="status-admin-plans-error">{error}</div>}
      <div className="plan-grid">
        {loading ? (
          <div className="empty-state"><h3>Loading…</h3></div>
        ) : plans.map((plan) => (
          <Card className={`plan-card plan-${plan.name}`} key={plan.id}>
            <div className="plan-card-top">
              <div>
                <div className="plan-mark">{plan.name[0].toUpperCase()}</div>
                <h2>{plan.name}</h2>
              </div>
              <Badge tone={plan.name === "enterprise" ? "info" : plan.name === "business" ? "success" : "neutral"}>
                {plan.name === "enterprise" ? "Custom" : plan.name === "business" ? "Popular" : "Starter"}
              </Badge>
            </div>
            <p>
              {plan.name === "free"
                ? "For testing and light document workloads."
                : plan.name === "business"
                  ? "For teams processing documents every day."
                  : "For critical, high-volume operations."}
            </p>
            <div className="plan-limit-label">DAILY REQUEST LIMIT</div>
            {editing === plan.id ? (
              <div className="edit-limit">
                <input className="eb-input" type="number" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="No limit" aria-label={`${plan.name} daily request limit`} data-testid={`input-plan-limit-${plan.name}`} />
                <Button size="sm" onClick={() => void save(plan.id)} data-testid={`button-save-plan-${plan.name}`}>
                  <Check size={14} /> Save
                </Button>
              </div>
            ) : (
              <div className="plan-limit">
                {plan.max_requests >= 2147483647 ? "No limit" : plan.max_requests.toLocaleString()}
                <span>requests / day</span>
              </div>
            )}
            <div className="plan-card-footer">
              {editing !== plan.id && (
                <button
                  className="text-button"
                  onClick={() => {
                    setEditing(plan.id);
                    setDraft(plan.max_requests >= 2147483647 ? "" : String(plan.max_requests));
                  }}
                  data-testid={`button-edit-plan-${plan.name}`}
                >
                  <Pencil size={14} /> Edit limit
                </button>
              )}
              <span><Users size={14} /> Per API key</span>
            </div>
          </Card>
        ))}
      </div>
      <Card className="plan-note">
        <div className="notice-icon"><ShieldCheck size={17} /></div>
        <div>
          <strong>Limits are applied per API key</strong>
          <p>Changing a plan limit affects new extraction requests immediately. Existing usage is not reset.</p>
        </div>
      </Card>
    </Shell>
  );
}
