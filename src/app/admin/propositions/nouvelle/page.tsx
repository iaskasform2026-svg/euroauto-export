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
      <form action={createProposalAction} className="card mt-6 space-y-3">
        <div>
          <label className="label">Demande client</label>
          <select name="requestId" className="input" required>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.client.legalName} — {r.make} {r.model} (budget {r.budgetMax} {r.currency})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Véhicule validé</label>
          <select name="vehicleId" className="input" required>
            {vehicles.map((v) => {
              const p = computeProposedPrice(v.sellerPrice);
              return (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} {v.year} — vendeur {formatMoney(v.sellerPrice)} → {formatMoney(p.proposed)}
                </option>
              )}
            )}
          </select>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <input className="input" name="feeTransport" type="number" placeholder="Transport estimé" defaultValue="1200" />
          <input className="input" name="feeInspect" type="number" placeholder="Inspection" defaultValue="250" />
          <label className="flex gap-2 text-sm items-center">
            <input type="checkbox" name="feeInspectConfirmed" defaultChecked /> Inspection confirmée
          </label>
          <input className="input" name="feeAdmin" type="number" placeholder="Démarches" defaultValue="180" />
          <input className="input" name="feeInsurance" type="number" placeholder="Assurance" defaultValue="180" />
          <input className="input" name="feeTax" type="number" placeholder="Taxes / autres" />
        </div>
        <button className="btn-primary">Envoyer au client (sans coordonnées vendeur)</button>
      </form>
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
