import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { toClientProposal } from "@/lib/public-vehicle";
import { StatusBadge } from "@/components/StatusBadge";
import { CLIENT_NEXT_ACTION, PLATFORM_ACTION, STATUS_LABELS } from "@/lib/workflow";
import { CERTAINTY_LABELS } from "@/lib/checklist";
import { formatMoney } from "@/lib/pricing";
import { respondProposalAction, acceptFinalOfferAction } from "@/app/actions/proposals";
import { confirmAppointmentAction, sendMessageAction, uploadDocumentAction } from "@/app/actions/admin";
import Link from "next/link";

export default async function ClientCasePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;
  const saleCase = await prisma.saleCase.findUnique({
    where: { id },
    include: {
      request: true,
      history: { orderBy: { createdAt: "asc" } },
      checklist: { orderBy: { sortOrder: "asc" } },
      messages: { include: { sender: { select: { legalName: true, role: true } } }, orderBy: { createdAt: "asc" } },
      documents: true,
      appointments: { include: { participants: true }, orderBy: { startsAt: "asc" } },
      payments: true,
      proposals: {
        include: {
          fees: true,
          vehicle: { include: { photos: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!saleCase) notFound();
  if (session.role === "CLIENT" && saleCase.clientId !== session.id) notFound();
  const settings = await getSettings();
  const publicProposals = saleCase.proposals.map((p) => toClientProposal(p, settings));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs">{saleCase.reference}</p>
          <h1 className="font-display text-3xl">
            {saleCase.request.make} {saleCase.request.model}
          </h1>
          <Link href={`/espace/demandes/${saleCase.requestId}`} className="text-sm text-gold-600">
            Modifier les critères
          </Link>
        </div>
        <StatusBadge status={saleCase.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <h2 className="font-semibold">Étape actuelle</h2>
          <p className="mt-2">{CLIENT_NEXT_ACTION[saleCase.status]}</p>
          <p className="mt-2 text-sm text-navy-700">La plateforme : {PLATFORM_ACTION[saleCase.status]}</p>
          {saleCase.status === "INTERET_CLIENT_CONFIRME" || saleCase.status === "VERIFICATION_VENDEUR" ? (
            <p className="mt-3 rounded bg-amber-50 p-2 text-sm">
              L’intérêt confirmé n’est pas une vente définitive. Une preuve vendeur est exigée, puis votre validation de
              l’offre finale.
            </p>
          ) : null}
        </div>
        <div className="card">
          <h2 className="font-semibold">Contact plateforme</h2>
          <p className="text-sm mt-2">{settings.name}</p>
          <p className="text-sm">{settings.email}</p>
          <p className="text-sm">{settings.phone}</p>
        </div>
      </div>

      <section className="card space-y-6">
        <h2 className="font-display text-2xl">Propositions</h2>
        {publicProposals.map((p) => (
          <article key={p.id} className="border-t pt-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold">
                {p.vehicle.make} {p.vehicle.model} {p.vehicle.version} {p.vehicle.year}
              </h3>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
                <p>Kilométrage : {p.vehicle.mileage ?? "non renseigné"} km</p>
                <p>
                  {p.vehicle.fuel} · {p.vehicle.transmission} · {p.vehicle.powerHp ?? "?"} ch
                </p>
                <p>
                  Localisation : {p.vehicle.locationCity}, {p.vehicle.locationCountry}
                </p>
                <p>Type de vendeur : {p.vehicle.sellerType} (identité gérée par la plateforme)</p>
                <p>Options : {p.vehicle.options}</p>
                <p className="text-amber-800">Informations manquantes : {p.vehicle.missingFields ?? "—"}</p>
                <p className="text-amber-800">Non vérifié : {p.vehicle.unverifiedFields ?? "—"}</p>
                <p className="mt-2">{p.vehicle.description}</p>
              </div>
              <div className="rounded-lg bg-navy-50 p-4 text-sm">
                <p>Prix proposé du véhicule</p>
                <p className="font-display text-2xl">{p.pricing.proposedFormatted}</p>
                <p className="text-xs">Majoration de 25 % du prix d’achat, hors frais.</p>
                <p className="mt-2 text-xs">Valable jusqu’au {p.validUntil.toLocaleString("fr-FR")}</p>
                <ul className="mt-3 space-y-1">
                  {p.pricing.fees.map((f) => (
                    <li key={f.id} className="flex justify-between">
                      <span>
                        {f.label} {f.confirmed ? "" : "(à vérifier)"}
                      </span>
                      <span>{f.formatted}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between font-semibold">
                  <span>Total estimatif</span>
                  <span>{p.pricing.estimatedTotalFormatted}</span>
                </p>
                <p className="text-xs mt-1">
                  Confirmé : {formatMoney(p.pricing.extrasConfirmed, "EUR")} · À vérifier :{" "}
                  {formatMoney(p.pricing.extrasUnconfirmed, "EUR")}
                </p>
                <p className="mt-3 text-xs">
                  Contact : {p.contact.email} · {p.contact.phone}
                </p>
              </div>
            </div>
            {p.vehicle.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.vehicle.photos[0].url} alt="" className="mt-3 h-48 w-full rounded object-cover" />
            )}
            {p.status === "ENVOYEE" || p.status === "QUESTION" ? (
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <form
                  action={async () => {
                    "use server";
                    await respondProposalAction(p.id, "accept");
                  }}
                >
                  <button className="btn-primary w-full">Accepter (vérification vendeur)</button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await respondProposalAction(p.id, "reject");
                  }}
                >
                  <button className="btn-secondary w-full">Refuser</button>
                </form>
                <form
                  action={async (fd) => {
                    "use server";
                    await respondProposalAction(p.id, "question", String(fd.get("message")));
                  }}
                  className="md:col-span-2 flex gap-2"
                >
                  <input name="message" className="input" placeholder="Votre question" />
                  <button className="btn-secondary">Poser une question</button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await respondProposalAction(p.id, "alternative");
                  }}
                >
                  <button className="btn-secondary">Demander une alternative</button>
                </form>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      {saleCase.vendorConfirmed && saleCase.status === "VERIFICATION_VENDEUR" && (
        <form
          action={async () => {
            "use server";
            await acceptFinalOfferAction(id);
          }}
          className="card"
        >
          <h2 className="font-semibold">Offre finale</h2>
          <p className="text-sm mt-2">Le vendeur a confirmé. Validez pour accéder au paiement.</p>
          <p className="text-xs mt-1">Conditions : {saleCase.agreedConditions}</p>
          <button className="btn-primary mt-3">Valider l’offre finale</button>
        </form>
      )}

      {(saleCase.status === "OFFRE_FINALE_VALIDEE" || saleCase.status === "PAIEMENT") && (
        <Link href={`/espace/dossiers/${id}/paiement`} className="btn-primary inline-flex">
          Récapitulatif et paiement
        </Link>
      )}

      <section className="card">
        <h2 className="font-display text-xl">Montants et paiements</h2>
        <ul className="mt-3 text-sm space-y-1">
          {saleCase.payments.map((p) => (
            <li key={p.id}>
              {p.kind} · {formatMoney(p.amount, p.currency)} · {p.status}
            </li>
          ))}
          {saleCase.payments.length === 0 && <li>Aucun paiement confirmé par le prestataire.</li>}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-xl">Formalités</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {saleCase.checklist.map((item) => (
            <li key={item.id} className="rounded border border-navy-100 p-3">
              <p className="font-semibold">{item.title}</p>
              <p>{item.description}</p>
              <p className="text-xs mt-1">
                Responsable : {item.owner} · Documents : {item.expectedDocs ?? "—"} · Statut : {item.status} ·{" "}
                {CERTAINTY_LABELS[item.certainty] ?? item.certainty}
                {item.sourceName ? ` · Source : ${item.sourceName}` : ""}
                {item.sourceDatedAt ? ` (${item.sourceDatedAt.toLocaleDateString("fr-FR")})` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-xl">Rendez-vous</h2>
        {saleCase.appointments.map((a) => (
          <div key={a.id} className="mt-3 border-t pt-3 text-sm">
            <p>
              {a.type} · {a.startsAt.toLocaleString("fr-FR")} ({a.timezone}) · {STATUS_LABELS[a.status] ?? a.status}
            </p>
            <p>
              Participants : {a.participants.map((p) => `${p.roleLabel}${p.confirmed ? " ✓" : " …"}`).join(", ")}
            </p>
            {a.status !== "CONFIRME" && (
              <form
                action={async () => {
                  "use server";
                  await confirmAppointmentAction(a.id);
                }}
              >
                <button className="btn-secondary mt-2">Confirmer ma présence</button>
              </form>
            )}
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="font-display text-xl">Documents</h2>
        <ul className="mt-2 text-sm">
          {saleCase.documents
            .filter((d) => d.visibility !== "INTERNE")
            .map((d) => (
              <li key={d.id}>
                <a className="text-gold-600" href={`/api/documents/${d.id}`}>
                  {d.title}
                </a>
              </li>
            ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-xl">Messagerie</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {saleCase.messages.map((m) => (
            <li key={m.id}>
              <strong>{m.sender.legalName}</strong> · {m.createdAt.toLocaleString("fr-FR")}
              <p>{m.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-xl">Checklist de réception</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>Contrôler l’identité du véhicule (plaque, documents) sans diffuser de données vendeur.</li>
          <li>État carrosserie, pneus, intérieur, fonctionnement moteur.</li>
          <li>Documents remis : vente, export, assurance, clés.</li>
          <li>Signaler tout écart avant déchargement définitif.</li>
        </ul>
      </section>

      <section className="card">
        <h2 className="font-display text-xl">Historique</h2>
        <ol className="mt-2 text-sm space-y-1">
          {saleCase.history.map((h) => (
            <li key={h.id}>
              {h.createdAt.toLocaleString("fr-FR")} — {STATUS_LABELS[h.toStatus] ?? h.toStatus}
              {h.note ? ` (${h.note})` : ""}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
