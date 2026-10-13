import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ClientsAdminPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { requests: true, cases: true, consents: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="font-display text-3xl">Clients</h1>
      <div className="mt-6 space-y-3">
        {clients.map((c) => (
          <div key={c.id} className="card text-sm">
            <p className="font-semibold">
              {c.legalName} {c.isDemo ? "[DÉMO]" : ""} — {c.accountType}
            </p>
            <p>
              {c.email} · {c.phoneCountryCode} {c.phone} · {c.country}
            </p>
            <p>
              E-mail vérifié : {c.emailVerifiedAt ? "oui" : "non"} · Consentements : {c.consents.length} · Demandes :{" "}
              {c.requests.length}
            </p>
            {c.cases[0] && (
              <Link className="text-gold-600" href={`/admin/dossiers/${c.cases[0].id}`}>
                Dossier {c.cases[0].reference}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
