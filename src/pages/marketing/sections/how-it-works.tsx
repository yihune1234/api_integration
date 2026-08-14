import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { SectionHead } from "../shared";

export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Generate a key",
      text: "Create your credential and choose the plan that matches your daily volume. Save the raw key when it appears — it is shown only once.",
    },
    {
      n: "02",
      title: "Connect your system",
      text: "Store the key in your server environment and call POST /v1/extract with the document as a multipart file field.",
    },
    {
      n: "03",
      title: "Read your records",
      text: "Check status, pull data.records, and route them wherever they belong inside your application.",
    },
  ];
  return (
    <section className="mark-section mark-section-alt">
      <SectionHead
        kicker="THE FLOW"
        title="From key to first request in minutes."
        sub="Three steps, one endpoint, and ready-to-use examples for every language your team already runs."
      />
      <div className="mark-step-row">
        {steps.map((step, index) => (
          <div className="mark-step" key={step.n}>
            <span className="mark-step-n">{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {index < steps.length - 1 && (
              <ArrowRight className="mark-step-arrow" size={17} />
            )}
          </div>
        ))}
      </div>
      <div className="mark-cta-center">
        <Link
          href="/login"
          className="eb-button eb-button-primary eb-button-md"
          data-testid="mark-how-cta"
        >
          Start extracting <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
