import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isStaff } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { roundMoney } from "@/lib/pricing";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { caseId, kind } = (await req.json()) as { caseId: string; kind: "ACOMPTE" | "SOLDE" | "TOTAL" };
  const saleCase = await prisma.saleCase.findUnique({
    where: { id: caseId },
    include: { proposals: { where: { status: { in: ["ACCEPTEE", "ENVOYEE"] } }, include: { fees: true } } },
  });
  if (!saleCase) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
  if (!isStaff(session.role) && saleCase.clientId !== session.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (saleCase.status !== "OFFRE_FINALE_VALIDEE" && saleCase.status !== "PAIEMENT") {
    return NextResponse.json({ error: "Paiement indisponible à ce stade." }, { status: 400 });
  }
  if (!saleCase.vendorConfirmed) {
    return NextResponse.json({ error: "Vendeur non confirmé." }, { status: 400 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe n’est pas configuré. Aucun paiement ne peut être confirmé artificiellement." },
      { status: 400 },
    );
  }
  const proposal = saleCase.proposals[0];
  if (!proposal) return NextResponse.json({ error: "Aucune proposition" }, { status: 400 });
  const settings = await getSettings();
  const extras = proposal.fees.filter((f) => f.confirmed).reduce((s, f) => s + f.amount, 0);
  const total = roundMoney(proposal.proposedPrice + extras);
  const amount = kind === "ACOMPTE" ? roundMoney(total * settings.depositRate) : kind === "SOLDE" ? roundMoney(total * (1 - settings.depositRate)) : total;

  const stripe = getStripe()!;
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/espace/dossiers/${caseId}?pay=ok`,
    cancel_url: `${origin}/espace/dossiers/${caseId}/paiement?pay=cancel`,
    customer_email: session.email,
    metadata: { caseId, kind },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: proposal.currency.toLowerCase(),
          unit_amount: Math.round(amount * 100),
          product_data: { name: `${kind} dossier ${saleCase.reference}` },
        },
      },
    ],
  });

  await prisma.payment.create({
    data: {
      caseId,
      kind,
      amount,
      currency: proposal.currency,
      status: "EN_ATTENTE",
      stripeSessionId: checkout.id,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
