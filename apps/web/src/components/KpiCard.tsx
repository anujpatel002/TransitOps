interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-panel border border-border rounded-lg p-5">
      <p className="text-text-muted text-sm">{label}</p>
      <p className="text-text-primary text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}
