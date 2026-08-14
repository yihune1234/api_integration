import {
  BarChart3,
  Globe2,
  KeyRound,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { SectionHead } from "../shared";

export const features = [
  {
    icon: Zap,
    title: "One endpoint, every format",
    text: "Send JSON, XML, CSV, XLS, or XLSX and get clean, structured records back every time. No bespoke parsers to build or maintain.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    text: "Keys are treated like passwords. Server-side authentication, no raw key storage, and full audit logging on every action.",
  },
  {
    icon: KeyRound,
    title: "Simple key management",
    text: "Create, rotate, and revoke credentials from one console. Per-key plans make it easy to route work by team or workload.",
  },
  {
    icon: Workflow,
    title: "Built to integrate",
    text: "A plain REST contract your servers already understand. cURL, Node.js, and Python examples are ready in the docs.",
  },
  {
    icon: BarChart3,
    title: "Usage you can read",
    text: "Daily and monthly volume, success and failure rates, and latency — the numbers that matter, without the noise.",
  },
  {
    icon: Globe2,
    title: "Operated for Africa",
    text: "Reliable infrastructure, local reliability, and a team focused on the operators building on the continent.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mark-section">
      <SectionHead
        kicker="WHY ETHIOBRIDGE"
        title="Everything you need to extract, nothing you don't."
        sub="A focused platform that removes the fiddly parts of document processing so your team can ship."
      />
      <div className="mark-feature-grid">
        {features.map((feature) => (
          <article className="mark-feature-card" key={feature.title}>
            <div className="mark-feature-icon">
              <feature.icon size={19} />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
