import type { ReactNode } from "react";
import { MarketingNav } from "./nav";
import { MarketingFooter } from "./footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mark-shell">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
