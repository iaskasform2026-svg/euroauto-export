import { NextResponse } from "next/server";
import { getSession, isStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !isStaff(session.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const cases = await prisma.saleCase.findMany({
    include: {
      client: { select: { email: true, legalName: true, country: true } },
      request: true,
      proposals: { include: { fees: true, vehicle: { select: { make: true, model: true, sellerPrice: true } } } },
      payments: true,
    },
  });
  const rows = [
    "reference;client;pays;statut;prixVendeur;prixPropose;majoration;fraisConfirmes;paiements",
    ...cases.map((c) => {
      const p = c.proposals[0];
      const markup = p ? p.proposedPrice - p.sellerPrice : 0;
      const fees = p ? p.fees.filter((f) => f.confirmed).reduce((s, f) => s + f.amount, 0) : 0;
      const paid = c.payments.filter((x) => x.status === "PAYE" || x.status === "ACOMPTE_RECU").reduce((s, x) => s + x.amount, 0);
      return [c.reference, c.client.legalName, c.destinationCountry, c.status, p?.sellerPrice ?? "", p?.proposedPrice ?? "", markup, fees, paid].join(";");
    }),
  ];
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=europauto-export-demo.csv",
    },
  });
}
