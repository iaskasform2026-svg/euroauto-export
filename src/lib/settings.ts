import { prisma } from "./prisma";

export async function getSettings() {
  const existing = await prisma.platformSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.platformSettings.create({
    data: {
      id: "default",
      name: process.env.PLATFORM_NAME ?? "EuropAuto Export [DÉMO]",
      email: process.env.PLATFORM_EMAIL ?? "contact@europauto-export.demo",
      phone: process.env.PLATFORM_PHONE ?? "+33 1 00 00 00 00",
      address: process.env.PLATFORM_ADDRESS ?? "Adresse de démonstration",
      country: process.env.PLATFORM_COUNTRY ?? "FR",
      commercialRole: process.env.PLATFORM_COMMERCIAL_ROLE ?? "INTERMEDIAIRE",
      contractsEnabled: process.env.CONTRACTS_ENABLED === "true",
      defaultCurrency: process.env.DEFAULT_CURRENCY ?? "EUR",
      markupRate: 0.25,
      depositRate: 0.3,
      targetCountries: "DE,FR,BE,NL,IT,ES,AT,PL",
      destinationCountries: "MA,TN,SN,CI,CM,GA,FR",
    },
  });
}
