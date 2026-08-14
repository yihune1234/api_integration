import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";
import { SectionHead } from "../shared";
import { cn } from "../brand";

export const planFeatures = {
  free: [
    "100 requests / day",
    "All 5 document formats",
    "1 active API key",
    "7-day usage history",
    "Community support",
  ],
  business: [
    "10,000 requests / day",
    "All 5 document formats",
    "Unlimited API keys",
    "Usage dashboards & alerts",
    "Priority email support",
  ],
  enterprise: [
    "Unlimited requests",
    "Custom limits & quotas",
    "Dedicated environment",
    "99.99% uptime SLA",
    "Named support engineer",
  ],
};

export function PlanCard({
  name,
  price,
  note,
  cta,
  featured,
}: {
  name: string;
  price: string;
  note: string;
  cta: string;
  featured?: boolean;
}) {
  return (
    <article className={cn("mark-plan", featured && "mark-plan-featured")}>
      {featured && <div className="mark-plan-flag">MOST POPULAR</div>}
      <div className="mark-plan-head">
        <h3>{name}</h3>
        <div className="mark-plan-price">
          {price}
          <span>{note}</span>
        </div>
      </div>
      <ul className="mark-plan-list">
        {planFeatures[name as keyof typeof planFeatures].map((item) => (
          <li key={item}>
            <Check size={13} />
            {item}
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={
          featured
            ? "eb-button eb-button-primary eb-button-md"
            : "eb-button eb-button-secondary eb-button-md"
        }
        data-testid={`mark-plan-${name}`}
      >
        {cta} <ArrowRight size={14} />
      </Link>
    </article>
  );
}

export function PricingGrid() {
  return (
    <section className="mark-section mark-section-alt">
      <SectionHead
        kicker="SIMPLE PRICING"
        title="Plans that scale with your workload."
        sub="Start free, move up when the volume does. Every plan includes the same dependable API."
      />
      <div className="mark-pricing-grid">
        <PlanCard name="free" price="$0" note="forever" cta="Start free" />
        <PlanCard
          name="business"
          price="$49"
          note="per month"
          cta="Upgrade now"
          featured
        />
        <PlanCard
          name="enterprise"
          price="Custom"
          note="tailored"
          cta="Talk to sales"
        />
      </div>
    </section>
  );
}
