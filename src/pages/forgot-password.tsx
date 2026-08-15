import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, Logo } from "@/components/app/basic";
import { ApiError, requestPasswordReset } from "@/lib/api/authApi";

export function ForgotPasswordPage() {
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) return setError("Enter a valid work email.");
    setSubmitting(true);
    try { const result = await requestPasswordReset({ contactEmail }); setMessage(result.message); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Unable to request a reset. Please try again."); }
    finally { setSubmitting(false); }
  };

  return <div className="login-page"><div className="login-decoration"><div className="login-grid" /><div className="login-brand"><Logo /><div className="login-quote">Get back to the work<br /><em>that matters.</em></div></div></div><main className="login-panel"><div className="login-panel-inner"><div className="login-mobile-brand"><Logo compact /></div><div className="login-eyebrow">ACCOUNT RECOVERY</div><h1>Reset your<br /><span>password.</span></h1><p className="login-description">Enter your organization&apos;s work email and we&apos;ll issue password reset instructions.</p><form onSubmit={submit} className="login-form"><div><label className="field-label" htmlFor="reset-email">Work email</label><input id="reset-email" type="email" className="eb-input" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} autoComplete="email" required /></div>{error && <div className="field-error"><AlertTriangle size={14} />{error}</div>}{message && <div className="form-success"><CheckCircle2 size={14} />{message}</div>}<Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Requesting reset…" : <>Request reset <ArrowRight size={16} /></>}</Button></form><p className="login-legal"><a href="/reset-password">I have a reset token</a> · <a href="/login">Back to sign in</a></p></div></main></div>;
}
