import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Kicker } from "../shared";

export function CtaBand() {
  return (
    <section className="mark-cta-band">
      <div className="mark-cta-grid" />
      <div className="mark-cta-inner">
        <div>
          <Kicker>READY WHEN YOU ARE</Kicker>
          <h2>Turn your first document into structured data today.</h2>
        </div>
        <div className="mark-cta-actions">
          <Link
            href="/login"
            className="eb-button eb-button-primary eb-button-lg"
            data-testid="mark-cta-band-primary"
          >
            Get started free <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="mark-cta-secondary"
            data-testid="mark-cta-band-secondary"
          >
            Talk to the team
          </Link>
        </div>
      </div>
    </section>
  );
}
