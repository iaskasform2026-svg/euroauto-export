import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { estimateTotal, formatMoney } from "@/lib/pricing";
import { stripeConfigured } from "@/lib/stripe";
import { toClientProposal } from "@/lib/public-vehicle";
import { PayButtons } from "./PayButtons";

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;
  const saleCase = await prisma.saleCase.findUnique({
    where: { id },
    include: {
      request: true,
      proposals: { include: { fees: true, vehicle: { include: { photos: true } } } },
      payments: true,
    },
  });
  if (!saleCase || (session.role === "CLIENT" && saleCase.clientId !== session.id)) notFound();
  if (!["OFFRE_FINALE_VALIDEE", "PAIEMENT"].includes(saleCase.status)) {
    redirect(`/espace/dossiers/${id}`);
  }
  const settings = await getSettings();
  const proposal = saleCase.proposals[0];
  if (!proposal) notFound();
  const view = toClientProposal(proposal, settings);
  const totals = estimateTotal(proposal.proposedPrice, proposal.fees);
  const confirmedOnly = estimateTotal(
    proposal.proposedPrice,
    proposal.fees.filter((f) => f.confirmed),
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Récapitulatif de commande</h1>
      <div className="card text-sm space-y-2">
        <p>
          {view.vehicle.make} {view.vehicle.model} {view.vehicle.year} — {view.vehicle.mileage} km
        </p>
        <p>Prix véhicule proposé : {view.pricing.proposedFormatted}</p>
        <p>Frais confirmés : {formatMoney(confirmedOnly.extras.confirmed, proposal.currency)}</p>
        <p>Frais à vérifier (non inclus au paiement) : {formatMoney(totals.extras.unconfirmed, proposal.currency)}</p>
        <p className="font-semibold">Montant payable maintenant (frais confirmés) : {formatMoney(confirmedOnly.estimatedTotal, proposal.currency)}</p>
        <p>Rôle affiché de la plateforme : {settings.commercialRole} (contrats réels {settings.contractsEnabled ? "activés" : "désactivés — démo"})</p>
        <p>Délai indicatif selon votre demande : {saleCase.request.desiredDelay ?? "à confirmer"}</p>
        <p>Conditions : {saleCase.agreedConditions}</p>
        <p className="text-xs">Aucun numéro de carte n’est stocké par la plateforme. Confirmation uniquement via Stripe.</p>
      </div>
      {stripeConfigured() ? (
        <PayButtons caseId={id} depositRate={settings.depositRate} />
      ) : (
        <div className="card bg-amber-50 text-sm">
          Prestataire de paiement non configuré. Le statut « payé » ne peut pas être forcé depuis l’application. Renseignez
          STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET (mode test) pour activer le paiement test.
        </div>
      )}
      <ul className="text-sm">
        {saleCase.payments.map((p) => (
          <li key={p.id}>
            {p.kind} {formatMoney(p.amount, p.currency)} — {p.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
