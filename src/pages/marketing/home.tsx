import { Hero } from "./sections/hero";
import { FeatureGrid } from "./sections/features";
import { HowItWorks } from "./sections/how-it-works";
import { CtaBand } from "./sections/cta-band";
import { MarketingLayout } from "./layout";

export function MarketingHome() {
  return (
    <MarketingLayout>
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <CtaBand />
    </MarketingLayout>
  );
}
