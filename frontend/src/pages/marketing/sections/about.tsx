import { HeartHandshake, Layers, Lock, Terminal } from "lucide-react";
import { SectionHead } from "../shared";

export const values = [
  {
    icon: HeartHandshake,
    title: "Built with operators",
    text: "We design around the teams running logistics, fintech, health, and retail — not demo slides.",
  },
  {
    icon: Lock,
    title: "Security by default",
    text: "Keys, logs, and access are audited and minimal by design. No raw key storage, ever.",
  },
  {
    icon: Layers,
    title: "Focused scope",
    text: "One protocol, one endpoint, five formats. Depth over breadth keeps reliability high.",
  },
  {
    icon: Terminal,
    title: "Developer honesty",
    text: "Plain REST, readable errors, and documentation that matches the shipped product.",
  },
];

export function AboutSection() {
  return (
    <section className="mark-section">
      <SectionHead
        kicker="THE TEAM"
        title="Why we built EthioBridge."
        sub="Operators across Africa carry real work in ordinary documents — invoices, patient lists, freight manifests, ledgers. We built the extraction layer that makes that work usable."
      />
      <div className="mark-values-grid">
        {values.map((value) => (
          <article className="mark-value-card" key={value.title}>
            <div className="mark-feature-icon">
              <value.icon size={18} />
            </div>
            <h3>{value.title}</h3>
            <p>{value.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
