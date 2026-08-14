export const stats = [
  { value: "340+", label: "Organizations" },
  { value: "1.4M", label: "Requests / month" },
  { value: "99.99%", label: "Platform uptime" },
  { value: "42", label: "Team members" },
];

export function StatsBand() {
  return (
    <section className="mark-stats">
      {stats.map((stat) => (
        <div key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
