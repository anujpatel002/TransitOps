import KpiCard from '../../components/KpiCard';

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-text-primary text-xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Vehicles" value="—" />
        <KpiCard label="Active Trips" value="—" />
        <KpiCard label="Drivers Available" value="—" />
        <KpiCard label="Open Maintenance" value="—" />
      </div>
    </div>
  );
}
