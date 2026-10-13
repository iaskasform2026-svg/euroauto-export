import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { changeStatus } from "@/lib/cases";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook Stripe non configuré" }, { status: 400 });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const existing = await prisma.payment.findFirst({ where: { stripeEventId: event.id } });
  if (existing) return NextResponse.json({ received: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
    if (payment) {
      const status = payment.kind === "ACOMPTE" ? "ACOMPTE_RECU" : "PAYE";
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          stripeEventId: event.id,
        },
      });
      await changeStatus({
        caseId: payment.caseId,
        toStatus: "PAIEMENT",
        note: `Événement Stripe vérifié ${event.id} — ${status}`,
      });
    }
  }

  if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const obj = event.data.object as { id?: string };
    const payment = await prisma.payment.findFirst({
      where: { OR: [{ stripeSessionId: obj.id }, { stripePaymentIntentId: obj.id }] },
    });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "ECHOUE", stripeEventId: event.id, failureReason: event.type },
      });
      await changeStatus({
        caseId: payment.caseId,
        toStatus: "PAIEMENT_ECHOUE",
        note: `Événement Stripe ${event.id}`,
      });
    }
  }

  if (event.type === "charge.refunded") {
    const obj = event.data.object as { payment_intent?: string };
    const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: obj.payment_intent } });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REMBOURSE", stripeEventId: event.id },
      });
      await changeStatus({ caseId: payment.caseId, toStatus: "REMBOURSE", note: `Remboursement Stripe ${event.id}` });
    }
  }

  return NextResponse.json({ received: true });
}
