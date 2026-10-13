export type RequestCriteria = {
  make: string;
  model: string;
  version?: string | null;
  yearMin?: number | null;
  yearMax?: number | null;
  mileageMax?: number | null;
  fuel?: string | null;
  gearbox?: string | null;
  budgetMax: number;
  currency: string;
};

export type VehicleCriteria = {
  make: string;
  model: string;
  version?: string | null;
  year?: number | null;
  mileage?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  sellerPrice: number;
  currency: string;
  available: boolean;
};

function norm(s?: string | null) {
  return (s ?? "").trim().toLowerCase();
}

export function matchScore(request: RequestCriteria, vehicle: VehicleCriteria, proposedPrice: number) {
  const gaps: string[] = [];
  let score = 0;

  if (norm(vehicle.make) === norm(request.make)) score += 25;
  else gaps.push(`Marque différente (${vehicle.make} au lieu de ${request.make}).`);

  if (norm(vehicle.model) === norm(request.model)) score += 20;
  else if (norm(vehicle.model).includes(norm(request.model)) || norm(request.model).includes(norm(vehicle.model))) {
    score += 10;
    gaps.push(`Modèle proche mais non identique (${vehicle.model}).`);
  } else gaps.push(`Modèle différent (${vehicle.model} au lieu de ${request.model}).`);

  if (request.yearMin && vehicle.year && vehicle.year < request.yearMin) {
    gaps.push(`Année ${vehicle.year} inférieure au minimum ${request.yearMin}.`);
  } else if (request.yearMax && vehicle.year && vehicle.year > request.yearMax) {
    gaps.push(`Année ${vehicle.year} supérieure au maximum ${request.yearMax}.`);
  } else if (vehicle.year) score += 15;
  else gaps.push("Année non renseignée.");

  if (request.mileageMax && vehicle.mileage != null) {
    if (vehicle.mileage <= request.mileageMax) score += 10;
    else gaps.push(`Kilométrage ${vehicle.mileage} km supérieur au maximum ${request.mileageMax} km.`);
  } else if (vehicle.mileage == null) gaps.push("Kilométrage non renseigné.");
  else score += 5;

  if (request.fuel) {
    if (norm(vehicle.fuel) === norm(request.fuel)) score += 10;
    else gaps.push(`Carburant ${vehicle.fuel ?? "inconnu"} au lieu de ${request.fuel}.`);
  } else score += 5;

  if (request.gearbox) {
    if (norm(vehicle.transmission) === norm(request.gearbox)) score += 5;
    else gaps.push(`Boîte ${vehicle.transmission ?? "inconnue"} au lieu de ${request.gearbox}.`);
  } else score += 3;

  if (proposedPrice <= request.budgetMax) score += 15;
  else gaps.push(`Prix proposé ${proposedPrice} ${vehicle.currency} supérieur au budget ${request.budgetMax} ${request.currency}.`);

  if (!vehicle.available) {
    score = Math.min(score, 20);
    gaps.push("Annonce marquée indisponible.");
  }

  return { score: Math.max(0, Math.min(100, score)), gaps };
}

export function fingerprint(parts: {
  make: string;
  model: string;
  year?: number | null;
  mileage?: number | null;
  sellerPrice: number;
  locationCity?: string | null;
}) {
  return [
    norm(parts.make),
    norm(parts.model),
    parts.year ?? "",
    parts.mileage ?? "",
    parts.sellerPrice,
    norm(parts.locationCity),
  ].join("|");
}
