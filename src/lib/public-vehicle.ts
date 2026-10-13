import { platformContactBlock, sanitizePublicText } from "./sanitize";
import { computeProposedPrice, estimateTotal, formatMoney } from "./pricing";

type Settings = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export function toClientProposal(proposal: {
  id: string;
  status: string;
  sellerPrice: number;
  markupRate: number;
  proposedPrice: number;
  currency: string;
  validUntil: Date;
  clientMessage: string | null;
  fees: { id: string; label: string; amount: number; currency: string; confirmed: boolean }[];
  vehicle: {
    make: string;
    model: string;
    version: string | null;
    year: number | null;
    mileage: number | null;
    fuel: string | null;
    transmission: string | null;
    powerHp: number | null;
    options: string | null;
    condition: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    description: string | null;
    sellerType: string;
    missingFields: string | null;
    unverifiedFields: string | null;
    history: string | null;
    maintenance: string | null;
    technicalInspection: string | null;
    warranty: string | null;
    photos: { id: string; url: string; caption: string | null; usable: boolean }[];
  };
}, settings: Settings) {
  const pricing = computeProposedPrice(proposal.sellerPrice, proposal.markupRate);
  const totals = estimateTotal(proposal.proposedPrice, proposal.fees);
  return {
    id: proposal.id,
    status: proposal.status,
    validUntil: proposal.validUntil,
    clientMessage: proposal.clientMessage,
    vehicle: {
      make: proposal.vehicle.make,
      model: proposal.vehicle.model,
      version: proposal.vehicle.version,
      year: proposal.vehicle.year,
      mileage: proposal.vehicle.mileage,
      fuel: proposal.vehicle.fuel,
      transmission: proposal.vehicle.transmission,
      powerHp: proposal.vehicle.powerHp,
      options: proposal.vehicle.options,
      condition: proposal.vehicle.condition,
      locationCity: proposal.vehicle.locationCity,
      locationCountry: proposal.vehicle.locationCountry,
      description: sanitizePublicText(proposal.vehicle.description),
      sellerType: proposal.vehicle.sellerType,
      missingFields: proposal.vehicle.missingFields,
      unverifiedFields: proposal.vehicle.unverifiedFields,
      history: sanitizePublicText(proposal.vehicle.history),
      maintenance: sanitizePublicText(proposal.vehicle.maintenance),
      technicalInspection: sanitizePublicText(proposal.vehicle.technicalInspection),
      warranty: sanitizePublicText(proposal.vehicle.warranty),
      photos: proposal.vehicle.photos
        .filter((p) => p.usable)
        .map((p) => ({ id: p.id, url: p.url, caption: sanitizePublicText(p.caption) })),
    },
    pricing: {
      proposedPrice: pricing.proposed,
      markupRate: pricing.markupRate,
      currency: proposal.currency,
      proposedFormatted: formatMoney(pricing.proposed, proposal.currency),
      fees: proposal.fees.map((f) => ({
        id: f.id,
        label: f.label,
        amount: f.amount,
        currency: f.currency,
        confirmed: f.confirmed,
        formatted: formatMoney(f.amount, f.currency),
      })),
      extrasConfirmed: totals.extras.confirmed,
      extrasUnconfirmed: totals.extras.unconfirmed,
      estimatedTotal: totals.estimatedTotal,
      estimatedTotalFormatted: formatMoney(totals.estimatedTotal, proposal.currency),
    },
    contact: platformContactBlock(settings),
  };
}
