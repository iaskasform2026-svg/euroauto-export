import { CONNECTORS } from "@/lib/connectors";

export default function ConnectorsPage() {
  return (
    <div>
      <h1 className="font-display text-3xl">Intégrations</h1>
      <div className="mt-6 space-y-3">
        {CONNECTORS.map((c) => (
          <div key={c.id} className="card">
            <div className="flex justify-between">
              <h2 className="font-semibold">{c.name}</h2>
              <span className="text-xs uppercase">{c.status.replace("_", " ")}</span>
            </div>
            <p className="text-sm mt-1">{c.region}</p>
            <p className="text-sm text-navy-700">{c.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
