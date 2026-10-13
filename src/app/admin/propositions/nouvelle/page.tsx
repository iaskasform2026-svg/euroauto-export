import { prisma } from "@/lib/prisma";
import { createProposalAction } from "@/app/actions/admin";
import { computeProposedPrice, formatMoney } from "@/lib/pricing";
import { matchScore } from "@/lib/matching";

export default async function NewProposalPage() {
  const requests = await prisma.vehicleRequest.findMany({ include: { client: true } });
  const vehicles = await prisma.vehicle.findMany({ where: { available: true } });
  return (
    <div>
      <h1 className="font-display text-3xl">Créer une proposition</h1>

      <div className="mt-8 space-y-3">
        <h2 className="font-semibold">Aperçu des scores</h2>
        {requests.slice(0, 3).map((r) => (
          <div key={r.id} className="card text-sm">
            <p className="font-semibold">
              {r.make} {r.model}
            </p>
            {vehicles.map((v) => {
              const proposed = computeProposedPrice(v.sellerPrice).proposed;
              const m = matchScore(
                {
                  make: r.make,
                  model: r.model,
                  yearMin: r.yearMin,
                  yearMax: r.yearMax,
                  mileageMax: r.mileageMax,
                  fuel: r.fuel,
                  gearbox: r.gearbox,
                  budgetMax: r.budgetMax,
                  currency: r.currency,
                },
                {
                  make: v.make,
                  model: v.model,
                  year: v.year,
                  mileage: v.mileage,
                  fuel: v.fuel,
                  transmission: v.transmission,
                  sellerPrice: v.sellerPrice,
                  currency: v.currency,
                  available: v.available,
                },
                proposed,
              );
              return (
                <p key={v.id}>
                  {v.make} {v.model} : {m.score}/100 {m.gaps[0] ?? ""}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
