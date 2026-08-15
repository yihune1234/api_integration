import { useEffect, useState } from "react";
import { CheckCircle2, Crown, Send } from "lucide-react";
import { Button, Badge, Card } from "@/components/app/basic";
import { PageHeader } from "@/components/app/headers";
import { Shell } from "@/components/app/shell";
import { getPremiumStatus, submitPremiumRequest, type PremiumPlan, type PremiumRequest } from "@/lib/api/premiumApi";
import { formatDate } from "@/lib/utils";

const tone = (status: string) => status === "approved" ? "success" : status === "rejected" ? "danger" : "warning" as const;

export function PremiumPage() {
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [plan, setPlan] = useState<PremiumPlan>("business");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try { setRequests((await getPremiumStatus()).requests); } catch (err: any) { setError(err?.message ?? "Failed to load premium status."); }
  };
  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  const submit = async () => {
    setError(""); setSubmitting(true);
    try {
      await submitPremiumRequest(plan, paymentReference || undefined);
      setPaymentReference("");
      await load();
    } catch (err: any) { setError(err?.message ?? "Could not submit your request."); }
    finally { setSubmitting(false); }
  };

  const pending = requests.some((request) => request.approval_status === "pending");
  const latestRejection = requests.find((request) => request.approval_status === "rejected");
  return <Shell role="user">
    <PageHeader eyebrow="ACCOUNT" title="Premium" description="Request Business or Enterprise access. An administrator reviews each request before your active API keys are upgraded." />
    {error && <div className="field-error">{error}</div>}
    {latestRejection && !pending && <Card className="notice-card"><div className="notice-icon">!</div><div><strong>Your last request was not approved</strong><p>{latestRejection.rejection_reason || "You can submit a new request when you are ready."}</p></div></Card>}
    <div className="premium-layout">
      <Card className="premium-request-card">
        <div className="section-kicker">REQUEST AN UPGRADE</div>
        <h2>Choose a plan</h2>
        <div className="premium-options">
          {(["business", "enterprise"] as PremiumPlan[]).map((item) => <button key={item} className={`premium-option ${plan === item ? "premium-option-active" : ""}`} onClick={() => setPlan(item)} disabled={pending}>
            <Crown size={17} /><span><strong>{item}</strong><small>{item === "business" ? "10,000 requests/day" : "Custom high-volume limits"}</small></span>
          </button>)}
        </div>
        <label className="field-label" htmlFor="payment-reference">Payment reference <span className="muted">(optional in demo mode)</span></label>
        <input id="payment-reference" className="eb-input" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} disabled={pending} placeholder="e.g. transaction reference" />
        <div className="modal-actions"><Button onClick={() => void submit()} disabled={pending || submitting}><Send size={15} /> {submitting ? "Submitting…" : pending ? "Request pending" : "Submit request"}</Button></div>
      </Card>
      <Card className="premium-request-card"><div className="section-kicker">WHAT HAPPENS NEXT</div><h2>Review and activation</h2><p className="card-description">Payment is confirmed by the configured provider, then an administrator approves or rejects the request. Approval immediately updates the plan and daily limit for every active API key in this workspace.</p><div className="premium-info"><CheckCircle2 size={17} /> No new paid keys need to be created after approval.</div></Card>
    </div>
    <Card className="table-card"><div className="table-card-header"><div><div className="section-kicker">REQUEST HISTORY</div><h2>Premium requests</h2></div></div><div className="table-scroll"><table className="eb-table"><thead><tr><th>Plan</th><th>Payment</th><th>Status</th><th>Submitted</th><th>Review note</th></tr></thead><tbody>{requests.length === 0 ? <tr><td colSpan={5} className="muted">No premium requests yet.</td></tr> : requests.map((request) => <tr key={request.id}><td className="plan-name">{request.requested_plan}</td><td>{request.payment_status}</td><td><Badge tone={tone(request.approval_status)}>{request.approval_status}</Badge></td><td>{formatDate(request.created_at)}</td><td>{request.rejection_reason || "—"}</td></tr>)}</tbody></table></div></Card>
  </Shell>;
}
