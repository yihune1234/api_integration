import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Logo } from "@/components/app/basic";

export function UnauthorizedPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="center-state-page">
      <div className="center-state-mark">
        <ShieldCheck size={26} />
      </div>
      <div className="eyebrow">ACCESS CONTROL</div>
      <h1>This door is for another role.</h1>
      <p>
        Your current demo account does not have permission to view this
        workspace. Switch roles to continue.
      </p>
      <div className="center-state-actions">
        <Button onClick={onBack} data-testid="button-return-login">
          <ArrowRight size={16} /> Return to sign in
        </Button>
      </div>
      <div className="center-state-brand">
        <Logo compact />
      </div>
    </div>
  );
}
