import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/app/basic";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header animate-rise">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "teal",
}: {
  label: string;
  value: string;
  detail: ReactNode;
  icon: any;
  accent?: string;
}) {
  return (
    <Card className="stat-card animate-rise">
      <div className={`stat-icon stat-icon-${accent}`}>
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <div
        className="stat-value"
        data-testid={`text-stat-${label.toLowerCase().replaceAll(" ", "-")}`}
      >
        {value}
      </div>
      <div className="stat-detail">{detail}</div>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
