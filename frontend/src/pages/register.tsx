import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Users } from "lucide-react";
import { Button, Logo } from "@/components/app/basic";
import { ApiError, register, type Session } from "@/lib/api/authApi";

export function RegisterPage({ onRegister }: { onRegister: (session: Session) => void }) {
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!organizationName.trim()) return setError("Enter your organization name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) return setError("Enter a valid work email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      const result = await register({ organizationName, contactEmail, password });
      onRegister({
        role: "user",
        id: result.user.id,
        organizationName: result.user.organizationName,
        contactEmail: result.user.contactEmail,
        status: result.user.status,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create your workspace. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="login-page">
    <div className="login-decoration"><div className="login-grid" /><div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" /><div className="login-brand"><Logo /><div className="login-quote">Start extracting value<br /><em>from every document.</em></div></div></div>
    <main className="login-panel"><div className="login-panel-inner">
      <div className="login-mobile-brand"><Logo compact /></div>
      <div className="login-eyebrow">CREATE YOUR WORKSPACE</div>
      <h1>Register your<br /><span>organization.</span></h1>
      <p className="login-description">Create an organization account to securely use EthioBridge&apos;s document extraction tools.</p>
      <form onSubmit={submit} className="login-form">
        <div><label className="field-label" htmlFor="register-organization">Organization name</label><input id="register-organization" className="eb-input" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} autoComplete="organization" maxLength={255} required /></div>
        <div><label className="field-label" htmlFor="register-email">Work email</label><input id="register-email" type="email" className="eb-input" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} autoComplete="email" required /></div>
        <div><label className="field-label" htmlFor="register-password">Password</label><input id="register-password" type="password" className="eb-input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required /><div className="form-success"><CheckCircle2 size={14} /> Use at least 8 characters.</div></div>
        <div><label className="field-label" htmlFor="register-password-confirm">Confirm password</label><input id="register-password-confirm" type="password" className="eb-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required /></div>
        {error && <div className="field-error"><AlertTriangle size={14} />{error}</div>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>{submitting ? "Creating workspace…" : <>Create workspace <ArrowRight size={16} /></>}</Button>
      </form>
      <p className="login-legal">Already have an account? <a href="/login">Sign in</a></p>
      <p className="demo-hint"><Users size={15} /><span>Organization accounts are separate from administrator accounts.</span></p>
    </div></main>
  </div>;
}
