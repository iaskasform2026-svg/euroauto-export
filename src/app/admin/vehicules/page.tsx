import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/pricing";

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: { vendor: true, photos: true },
    orderBy: { collectedAt: "desc" },
  });
  return (
    <div>
      <div className="flex justify-between">
        <h1 className="font-display text-3xl">Véhicules</h1>
        <Link href="/admin/vehicules/nouveau" className="btn-primary">
          Import
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="card text-sm">
            <div className="flex justify-between gap-2">
              <strong>
                {v.make} {v.model} {v.version} {v.year} {v.isDemo ? "[DÉMO]" : ""}
              </strong>
              <span>{v.available ? "Disponible" : "Indisponible"}</span>
            </div>
            <p>
              {formatMoney(v.sellerPrice, v.currency)} vendeur → {formatMoney(v.sellerPrice * 1.25, v.currency)} proposé
            </p>
            <p>
              Source {v.source} · id {v.externalId} · {v.locationCity} {v.locationCountry}
            </p>
            <p>Vendeur : {v.vendor?.legalName} · {v.vendor?.email} · {v.vendor?.phone}</p>
            <p>Lien original : {v.originalUrl ?? "—"}</p>
            <p className="text-amber-800">Manquant : {v.missingFields} · Non vérifié : {v.unverifiedFields}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
