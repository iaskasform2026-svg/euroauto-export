import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { CLIENT_NEXT_ACTION } from "@/lib/workflow";
import { formatMoney } from "@/lib/pricing";

export default async function ClientHome() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const cases = await prisma.saleCase.findMany({
    where: { clientId: session.id },
    include: {
      request: true,
      proposals: { orderBy: { createdAt: "desc" }, take: 3 },
      payments: true,
      appointments: { where: { status: { in: ["PROPOSE", "CONFIRME"] } } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Bonjour {session.legalName}</h1>
        <p className="text-sm text-navy-700">Vos dossiers uniquement. Les coordonnées des vendeurs ne sont pas affichées ici.</p>
      </div>
      {cases.length === 0 && (
        <div className="card">
          <p>Aucune demande pour le moment.</p>
          <Link href="/espace/demandes/nouvelle" className="btn-primary mt-4 inline-flex">
            Créer une demande
          </Link>
        </div>
      )}
      {cases.map((c) => {
        const paid = c.payments.filter((p) => p.status === "PAYE" || p.status === "ACOMPTE_RECU");
        return (
          <Link key={c.id} href={`/espace/dossiers/${c.id}`} className="card block hover:border-gold-400">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-navy-700">{c.reference}</p>
                <h2 className="font-semibold">
                  {c.request.make} {c.request.model}
                </h2>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-3 text-sm">{CLIENT_NEXT_ACTION[c.status]}</p>
            <p className="mt-2 text-xs text-navy-700">
              Propositions : {c.proposals.length} · Paiements enregistrés : {paid.length} · RDV : {c.appointments.length}
              {c.proposals[0] ? ` · Dernier prix proposé ${formatMoney(c.proposals[0].proposedPrice, c.proposals[0].currency)}` : ""}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
