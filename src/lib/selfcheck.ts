import { computeProposedPrice } from "./pricing";
import { sanitizePublicText } from "./sanitize";
import { toClientProposal } from "./public-vehicle";

const p = computeProposedPrice(10000, 0.25);
if (p.markup !== 2500 || p.proposed !== 12500) {
  throw new Error("Calcul de majoration incorrect");
}

const leak = "Contact:  jean@vendeur.test tel +49 221 000000 http://vendeur.test";
const clean = sanitizePublicText(leak);
if (clean.includes("jean@") || clean.includes("http://") || clean.includes("221")) {
  throw new Error("Fuite de coordonnées dans la sanitisation");
}

const view = toClientProposal(
  {
    id: "1",
    status: "ENVOYEE",
    sellerPrice: 10000,
    markupRate: 0.25,
    proposedPrice: 12500,
    currency: "EUR",
    validUntil: new Date(),
    clientMessage: null,
    fees: [],
    vehicle: {
      make: "Volkswagen",
      model: "Golf",
      version: null,
      year: 2021,
      mileage: 1,
      fuel: null,
      transmission: null,
      powerHp: null,
      options: null,
      condition: null,
      locationCity: "Cologne",
      locationCountry: "DE",
      description: leak,
      sellerType: "PROFESSIONNEL",
      missingFields: null,
      unverifiedFields: null,
      history: null,
      maintenance: null,
      technicalInspection: null,
      warranty: null,
      photos: [],
    },
  },
  { name: "Plateforme", email: "p@x", phone: "1", address: "a" },
);

if (JSON.stringify(view).includes("jean@vendeur") || JSON.stringify(view).includes("originalUrl")) {
  throw new Error("Vue client trop permissive");
}

console.log("selfcheck ok", p);
