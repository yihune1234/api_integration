import { useLocation } from "wouter";
import { FileCode2 } from "lucide-react";
import { Button } from "@/components/app/basic";

export function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="center-state-page">
      <div className="center-state-mark">
        <FileCode2 size={26} />
      </div>
      <div className="eyebrow">404 / NOT FOUND</div>
      <h1>That route wandered off.</h1>
      <p>The page you requested is not part of this workspace.</p>
      <Button
        onClick={() => setLocation("/login")}
        data-testid="button-back-home"
      >
        Back to sign in
      </Button>
    </div>
  );
}
