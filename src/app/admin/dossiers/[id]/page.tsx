import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { MAIN_STATUSES, EXCEPTION_STATUSES, STATUS_LABELS } from "@/lib/workflow";
import { formatMoney, computeProposedPrice } from "@/lib/pricing";
import { vendorAvailabilityTemplate, phoneScript } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import {
  confirmVendorAction,
  createAppointmentAction,
  logManualEmailAction,
  priceChangeAction,
  saveCallReportAction,
  sendVendorEmailAction,
  updateCaseStatusAction,
} from "@/app/actions/admin";

export default async function AdminCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saleCase = await prisma.saleCase.findUnique({
    where: { id },
    include: {
      client: true,
      request: true,
      proposals: { include: { vehicle: { include: { vendor: true } }, fees: true } },
      contactLogs: { orderBy: { createdAt: "desc" } },
      callReports: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "desc" } },
      appointments: { include: { participants: true } },
    },
  });
  if (!saleCase) notFound();
  const settings = await getSettings();
  const proposal = saleCase.proposals[0];
  const vehicle = proposal?.vehicle;
  const tpl = vehicle
    ? vendorAvailabilityTemplate({
        platformName: settings.name,
        vehicleLabel: `${vehicle.make} ${vehicle.model} ${vehicle.year ?? ""}`,
        sellerPrice: vehicle.sellerPrice,
        currency: vehicle.currency,
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-xs">{saleCase.reference}</p>
          <h1 className="font-display text-3xl">{saleCase.client.legalName}</h1>
          <p className="text-sm">
            {saleCase.client.email} · {saleCase.client.phoneCountryCode} {saleCase.client.phone} · dest.{" "}
            {saleCase.destinationCountry}
          </p>
        </div>
        <StatusBadge status={saleCase.status} />
      </div>

      {proposal && (
        <div className="card text-sm space-y-1">
          <p>
            {proposal.vehicle.make} {proposal.vehicle.model} — vendeur {formatMoney(proposal.sellerPrice)} → proposé{" "}
            {formatMoney(proposal.proposedPrice)} ({proposal.markupRate * 100} %)
          </p>
          <p>Vendeur : {proposal.vehicle.vendor?.legalName} · {proposal.vehicle.vendor?.email} · {proposal.vehicle.vendor?.phone}</p>
          <p>Lien original : {proposal.vehicle.originalUrl}</p>
          <p>Notes internes : {proposal.vehicle.internalNotes}</p>
        </div>
      )}

      {vehicle && tpl && (
        <section className="card space-y-4">
          <h2 className="font-display text-xl">Contact fournisseur</h2>
          <pre className="whitespace-pre-wrap rounded bg-navy-50 p-3 text-xs">{tpl.body}</pre>
          {vehicle.vendor?.phone && (
            <div>
              <a className="btn-secondary" href={`tel:${vehicle.vendor.phone}`}>
                Appeler {vehicle.vendor.phone}
              </a>
              <pre className="mt-2 whitespace-pre-wrap text-xs">{phoneScript({
                vehicleLabel: `${vehicle.make} ${vehicle.model}`,
                sellerPrice: vehicle.sellerPrice,
                currency: vehicle.currency,
              })}</pre>
            </div>
          )}
          <form action={logManualEmailAction} className="space-y-2 border-t pt-3">
            <p className="text-sm font-semibold">Enregistrer un envoi manuel réellement effectué</p>
            <input type="hidden" name="caseId" value={id} />
            <input type="hidden" name="vendorId" value={vehicle.vendorId ?? ""} />
            <input className="input" name="subject" defaultValue={tpl.subject} />
            <textarea className="input min-h-20" name="body" defaultValue={tpl.body} />
            <button className="btn-secondary">Journaliser un envoi réel</button>
          </form>
          <form action={saveCallReportAction} className="space-y-2 border-t pt-3">
            <p className="font-semibold text-sm">Compte rendu d’appel</p>
            <input type="hidden" name="caseId" value={id} />
            <input type="hidden" name="vendorId" value={vehicle.vendorId ?? ""} />
            <label className="flex gap-2 text-sm">
              <input type="checkbox" name="actuallyCalled" /> Appel réellement effectué
            </label>
            <input className="input" name="outcome" placeholder="Résultat" required />
            <input className="input" name="availability" placeholder="Disponibilité" />
            <input className="input" name="finalPrice" type="number" placeholder="Prix final" />
            <input className="input" name="documents" placeholder="Documents" />
            <label className="flex gap-2 text-sm">
              <input type="checkbox" name="exportPossible" /> Export possible
            </label>
            <textarea className="input" name="notes" placeholder="Notes" />
            <button className="btn-secondary">Enregistrer le CR</button>
          </form>
          <ul className="text-xs space-y-1">
            {saleCase.contactLogs.map((l) => (
              <li key={l.id}>
                {l.createdAt.toLocaleString("fr-FR")} · {l.channel} · envoyé réellement : {l.actuallySent ? "oui" : "non"} —{" "}
                {l.subject}
              </li>
            ))}
            {saleCase.callReports.map((c) => (
              <li key={c.id}>
                {c.createdAt.toLocaleString("fr-FR")} · appelé réellement : {c.actuallyCalled ? "oui" : "non"} — {c.outcome}
              </li>
            ))}
          </ul>
        </section>
      )}

      {proposal && (
        <p className="text-xs text-navy-700">
          Vérification calcul : {proposal.sellerPrice} × 1,25 = {computeProposedPrice(proposal.sellerPrice).proposed}
        </p>
      )}
    </div>
  );
}
