import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ pays?: string; statut?: string }>;
}) {
  const { pays, statut } = await searchParams;
  const cases = await prisma.saleCase.findMany({
    where: {
      destinationCountry: pays || undefined,
      status: statut || undefined,
    },
    include: {
      client: true,
      request: true,
      proposals: true,
      assignee: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  const vehicles = await prisma.vehicle.count();
  const clients = await prisma.user.count({ where: { role: "CLIENT" } });
  const proposed = cases.flatMap((c) => c.proposals).reduce((s, p) => s + p.proposedPrice, 0);
  const markup = cases.flatMap((c) => c.proposals).reduce((s, p) => s + (p.proposedPrice - p.sellerPrice), 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Pilotage</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card"><p className="text-xs">Clients</p><p className="text-2xl font-display">{clients}</p></div>
        <div className="card"><p className="text-xs">Véhicules</p><p className="text-2xl font-display">{vehicles}</p></div>
        <div className="card"><p className="text-xs">CA proposé</p><p className="text-2xl font-display">{formatMoney(proposed)}</p></div>
        <div className="card"><p className="text-xs">Majorations 25 %</p><p className="text-2xl font-display">{formatMoney(markup)}</p></div>
      </div>
      <form className="flex flex-wrap gap-2">
        <input className="input max-w-32" name="pays" placeholder="Pays dest." defaultValue={pays} />
        <input className="input max-w-48" name="statut" placeholder="Statut" defaultValue={statut} />
        <button className="btn-secondary">Filtrer</button>
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-navy-700">
            <th className="py-2">Réf.</th>
            <th>Client</th>
            <th>Véhicule recherché</th>
            <th>Pays</th>
            <th>Statut</th>
            <th>Resp.</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="py-2">
                <Link href={`/admin/dossiers/${c.id}`} className="text-gold-600">
                  {c.reference}
                </Link>
              </td>
              <td>{c.client.legalName}</td>
              <td>
                {c.request.make} {c.request.model}
              </td>
              <td>{c.destinationCountry}</td>
              <td>
                <StatusBadge status={c.status} />
              </td>
              <td>{c.assignee?.legalName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
