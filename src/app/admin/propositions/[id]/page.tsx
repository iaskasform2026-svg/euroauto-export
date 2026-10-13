import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/pricing";

export default async function ProposalAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.proposal.findUnique({
    where: { id },
    include: { vehicle: true, request: { include: { client: true } }, fees: true },
  });
  if (!p) notFound();
  return (
    <div className="card space-y-2">
      <h1 className="font-display text-2xl">Proposition envoyée</h1>
      <p>
        {p.request.client.legalName} — {p.vehicle.make} {p.vehicle.model}
      </p>
      <p>
        {formatMoney(p.sellerPrice)} × 1,25 = {formatMoney(p.proposedPrice)}
      </p>
      {p.caseId && (
        <Link className="btn-primary inline-flex mt-4" href={`/admin/dossiers/${p.caseId}`}>
          Ouvrir le dossier
        </Link>
      )}
    </div>
  );
}
