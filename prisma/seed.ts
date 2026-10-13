import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeProposedPrice } from "../src/lib/pricing";
import { fingerprint, matchScore } from "../src/lib/matching";

const prisma = new PrismaClient();

async function main() {
  await prisma.appointmentParticipant.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.callReport.deleteMany();
  await prisma.contactLog.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.extraFee.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.vehicleMatch.deleteMany();
  await prisma.vehiclePhoto.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.saleCase.deleteMany();
  await prisma.vehicleRequest.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.emailToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.regulatoryRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();

  const password = await bcrypt.hash("DemoClient123!", 12);
  const adminPass = await bcrypt.hash("DemoAdmin123!", 12);
  const comPass = await bcrypt.hash("DemoCom123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.europauto.local",
      passwordHash: adminPass,
      role: "ADMIN",
      accountType: "ENTREPRISE",
      legalName: "EuropAuto Export [DÉMO]",
      firstName: "Amina",
      lastName: "Admin",
      address: "10 rue de la Démonstration",
      country: "FR",
      phoneCountryCode: "+33",
      phone: "100000000",
      emailVerifiedAt: new Date(),
      isDemo: true,
    },
  });

  const commercial = await prisma.user.create({
    data: {
      email: "commercial@demo.europauto.local",
      passwordHash: comPass,
      role: "COMMERCIAL",
      accountType: "ENTREPRISE",
      legalName: "Service commercial [DÉMO]",
      firstName: "Karim",
      lastName: "Commercial",
      address: "10 rue de la Démonstration",
      country: "FR",
      phoneCountryCode: "+33",
      phone: "100000001",
      emailVerifiedAt: new Date(),
      isDemo: true,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "client@demo.europauto.local",
      passwordHash: password,
      role: "CLIENT",
      accountType: "PARTICULIER",
      legalName: "Sofia Benali [DÉMO]",
      firstName: "Sofia",
      lastName: "Benali",
      address: "12 boulevard Hassan II, Casablanca",
      country: "MA",
      phoneCountryCode: "+212",
      phone: "661000000",
      emailVerifiedAt: new Date(),
      isDemo: true,
      consents: {
        create: [
          {
            type: "CGU",
            accepted: true,
            text: "J’accepte les conditions générales d’utilisation [DÉMO].",
          },
          {
            type: "RGPD",
            accepted: true,
            text: "J’accepte le traitement de mes données pour la recherche et l’accompagnement à l’export [DÉMO].",
          },
        ],
      },
    },
  });

  const otherClient = await prisma.user.create({
    data: {
      email: "autre.client@demo.europauto.local",
      passwordHash: password,
      role: "CLIENT",
      accountType: "ENTREPRISE",
      legalName: "Atlas Logistics SARL [DÉMO]",
      address: "Tunis",
      country: "TN",
      phoneCountryCode: "+216",
      phone: "20000000",
      emailVerifiedAt: new Date(),
      isDemo: true,
    },
  });

  await prisma.platformSettings.create({
    data: {
      name: "EuropAuto Export [DÉMO]",
      email: "contact@europauto-export.demo",
      phone: "+33 1 00 00 00 00",
      address: "Adresse de démonstration — non opérationnelle",
      country: "FR",
      commercialRole: "INTERMEDIAIRE",
      contractsEnabled: false,
      defaultCurrency: "EUR",
      markupRate: 0.25,
      depositRate: 0.3,
      targetCountries: "DE,FR,BE,NL,IT,ES,AT,PL",
      destinationCountries: "MA,TN,SN,CI,CM,GA,FR",
    },
  });

  const rules = [
    {
      purchaseCountry: "*",
      destinationCountry: "*",
      clientType: "*",
      category: "VEHICULE",
      title: "Vérification de l’état du véhicule",
      description: "Contrôle visuel, historique d’entretien et cohérence du kilométrage. Étape interne plateforme.",
      owner: "PLATEFORME",
      expectedDocs: "Rapport d’inspection",
      estimatedCost: 250,
      certainty: "A_VERIFIER",
      sourceName: "Procédure interne [DÉMO]",
    },
    {
      purchaseCountry: "*",
      destinationCountry: "*",
      clientType: "*",
      category: "VENTE",
      title: "Documents de vente",
      description: "Contrat adapté au rôle commercial configuré (intermédiaire / mandataire / revendeur). Non activé tant que les contrats réels sont désactivés.",
      owner: "PLATEFORME",
      expectedDocs: "Contrat, pièce d’identité",
      certainty: "A_VERIFIER",
      sourceName: "À valider par un conseil juridique",
    },
    {
      purchaseCountry: "*",
      destinationCountry: "*",
      clientType: "*",
      category: "PAIEMENT",
      title: "Paiement sécurisé",
      description: "Acompte puis solde via prestataire. Confirmation uniquement par événement vérifié.",
      owner: "CLIENT",
      expectedDocs: "Reçu prestataire",
      certainty: "SOURCE_OFFICIELLE",
      sourceName: "Stripe — documentation paiements",
      sourceUrl: "https://docs.stripe.com/payments",
      sourceDatedAt: new Date("2026-01-15"),
    },
    {
      purchaseCountry: "DE",
      destinationCountry: "MA",
      clientType: "PARTICULIER",
      category: "EXPORT",
      title: "Formalités d’exportation depuis l’Allemagne",
      description: "Les démarches d’export (radiation, documents douaniers) dépendent du statut du vendeur et du régime. À confirmer au cas par cas ; ne pas présenter comme obligation unique.",
      owner: "PLATEFORME",
      expectedDocs: "Export declaration / documents vendeur",
      estimatedCost: 180,
      certainty: "A_VERIFIER",
      sourceName: "Zoll.de — à confirmer selon le dossier",
      sourceUrl: "https://www.zoll.de",
      sourceDatedAt: new Date("2025-11-01"),
    },
    {
      purchaseCountry: "DE",
      destinationCountry: "MA",
      clientType: "PARTICULIER",
      category: "DESTINATION",
      title: "Dédouanement et immatriculation au Maroc",
      description: "Droits, TVA et immatriculation : barèmes officiels variables. Estimation indicative uniquement.",
      owner: "CLIENT",
      expectedDocs: "DUM, quitus, demande d’immatriculation",
      estimatedCost: 0,
      certainty: "A_VERIFIER",
      sourceName: "Administration des douanes Maroc — à vérifier sur le dossier",
      sourceUrl: "https://www.douane.gov.ma",
      sourceDatedAt: new Date("2025-09-01"),
    },
    {
      purchaseCountry: "*",
      destinationCountry: "*",
      clientType: "*",
      transportMode: "ROUTIER",
      category: "TRANSPORT",
      title: "Transport routier",
      description: "Enlèvement, CMR, assurance transport. Coût estimatif à confirmer par le transporteur.",
      owner: "PLATEFORME",
      expectedDocs: "CMR, attestation d’assurance",
      estimatedCost: 1200,
      certainty: "A_VERIFIER",
      sourceName: "Devis transporteur [DÉMO]",
    },
    {
      purchaseCountry: "*",
      destinationCountry: "*",
      clientType: "*",
      category: "ASSURANCE",
      title: "Assurance temporaire / transit",
      description: "Couverture entre enlèvement et livraison. Offre à obtenir auprès d’un assureur.",
      owner: "PLATEFORME",
      expectedDocs: "Attestation",
      estimatedCost: 180,
      certainty: "A_VERIFIER",
      sourceName: "Pratique marché [DÉMO] — non opposable",
    },
  ];

  for (const r of rules) {
    await prisma.regulatoryRule.create({ data: r });
  }

  const vendor = await prisma.vendor.create({
    data: {
      type: "PROFESSIONNEL",
      legalName: "Rhein Auto GmbH [DÉMO]",
      email: "verkauf@rhein-auto.demo",
      phone: "+49 221 000000",
      address: "Köln, Deutschland",
      country: "DE",
      notes: "Vendeur de démonstration. Ne pas contacter réellement.",
      isDemo: true,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      type: "PARTICULIER",
      legalName: "M. Schneider [DÉMO]",
      email: "schneider.prive@demo.local",
      phone: "+49 170 0000000",
      address: "Stuttgart",
      country: "DE",
      isDemo: true,
    },
  });

  const v1Data = {
    make: "Volkswagen",
    model: "Golf",
    year: 2021,
    mileage: 42000,
    sellerPrice: 10000,
    locationCity: "Cologne",
  };

  const vehicle1 = await prisma.vehicle.create({
    data: {
      source: "import-manuel",
      originalUrl: "https://example-partenaire.invalid/annonce/VW-GOLF-DEMO-1",
      externalId: "DEMO-VW-001",
      make: "Volkswagen",
      model: "Golf",
      version: "1.5 TSI Life",
      year: 2021,
      mileage: 42000,
      fuel: "Essence",
      transmission: "Manuelle",
      powerHp: 130,
      options: "Climatisation, GPS, régulateur, LED",
      condition: "Occasion — état annoncé bon",
      sellerPrice: 10000,
      currency: "EUR",
      taxInfo: "TVA allemande — régime non vérifié",
      locationCity: "Cologne",
      locationCountry: "DE",
      locationAddress: "Adresse professionnelle complète — admin seulement",
      description:
        "Véhicule de démonstration. Contact vendeur :  verkauf@rhein-auto.demo  tel +49 221 000000. Ne pas inventer d’autres annonces.",
      sellerType: "PROFESSIONNEL",
      history: "Carnet d’entretien annoncé complet (non vérifié).",
      maintenance: "Dernière révision 2025 (annoncé).",
      technicalInspection: "TÜV annoncé valide jusqu’en 2027 (non vérifié).",
      warranty: "Aucune garantie constructeur restante (annoncé).",
      missingFields: "Numéro VIN, justificatif TVA",
      unverifiedFields: "Kilométrage, historique, TÜV",
      internalNotes: "Priorité commerciale moyenne. Vendeur réactif en démo.",
      fingerprint: fingerprint(v1Data),
      isDemo: true,
      vendorId: vendor.id,
      photos: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&q=80",
            caption: "Photo d’illustration [DÉMO] — pas une annonce réelle",
            usable: true,
            sanitized: true,
          },
        ],
      },
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      source: "import-manuel",
      originalUrl: "https://example-partenaire.invalid/annonce/BMW-320-DEMO-2",
      externalId: "DEMO-BMW-002",
      make: "BMW",
      model: "Série 3",
      version: "320d",
      year: 2019,
      mileage: 89000,
      fuel: "Diesel",
      transmission: "Automatique",
      powerHp: 190,
      options: "Cuir, GPS, attelage",
      condition: "Occasion",
      sellerPrice: 18500,
      currency: "EUR",
      locationCity: "Stuttgart",
      locationCountry: "DE",
      description: "Annonce de démonstration indisponible.",
      sellerType: "PARTICULIER",
      available: false,
      unavailableReason: "Marquée indisponible lors de la dernière vérification [DÉMO].",
      missingFields: "Photos supplémentaires",
      unverifiedFields: "Tout l’historique",
      fingerprint: fingerprint({
        make: "BMW",
        model: "Série 3",
        year: 2019,
        mileage: 89000,
        sellerPrice: 18500,
        locationCity: "Stuttgart",
      }),
      isDemo: true,
      vendorId: vendor2.id,
    },
  });

  const request = await prisma.vehicleRequest.create({
    data: {
      clientId: client.id,
      destinationCountry: "MA",
      make: "Volkswagen",
      model: "Golf",
      version: "Life",
      yearMin: 2019,
      yearMax: 2023,
      mileageMax: 80000,
      engine: "1.5",
      fuel: "Essence",
      gearbox: "Manuelle",
      body: "Berline",
      mustHaveOptions: "Climatisation, GPS",
      color: "Gris ou blanc",
      seats: 5,
      budgetMax: 16000,
      currency: "EUR",
      budgetScope: "COUT_TOTAL",
      desiredDelay: "8 semaines",
      comments: "Usage familial, export Maroc.",
      status: "PROPOSITION_ENVOYEE",
    },
  });

  const otherRequest = await prisma.vehicleRequest.create({
    data: {
      clientId: otherClient.id,
      destinationCountry: "TN",
      make: "Peugeot",
      model: "3008",
      yearMin: 2020,
      budgetMax: 22000,
      currency: "EUR",
      budgetScope: "VEHICULE_SEUL",
      status: "RECHERCHE_EN_COURS",
    },
  });

  const proposed = computeProposedPrice(10000, 0.25);
  const match = matchScore(
    {
      make: request.make,
      model: request.model,
      yearMin: request.yearMin,
      yearMax: request.yearMax,
      mileageMax: request.mileageMax,
      fuel: request.fuel,
      gearbox: request.gearbox,
      budgetMax: request.budgetMax,
      currency: request.currency,
    },
    {
      make: vehicle1.make,
      model: vehicle1.model,
      year: vehicle1.year,
      mileage: vehicle1.mileage,
      fuel: vehicle1.fuel,
      transmission: vehicle1.transmission,
      sellerPrice: vehicle1.sellerPrice,
      currency: vehicle1.currency,
      available: vehicle1.available,
    },
    proposed.proposed,
  );

  await prisma.vehicleMatch.create({
    data: {
      requestId: request.id,
      vehicleId: vehicle1.id,
      score: match.score,
      gaps: JSON.stringify(match.gaps),
    },
  });

  const saleCase = await prisma.saleCase.create({
    data: {
      reference: "EA-2026-00001",
      clientId: client.id,
      requestId: request.id,
      assigneeId: commercial.id,
      status: "PROPOSITION_ENVOYEE",
      purchaseCountry: "DE",
      destinationCountry: "MA",
      transportMode: "ROUTIER",
    },
  });

  await prisma.statusHistory.create({
    data: {
      caseId: saleCase.id,
      toStatus: "DEMANDE_ENREGISTREE",
      note: "Inscription démo",
    },
  });
  await prisma.statusHistory.create({
    data: {
      caseId: saleCase.id,
      fromStatus: "DEMANDE_ENREGISTREE",
      toStatus: "RECHERCHE_EN_COURS",
    },
  });
  await prisma.statusHistory.create({
    data: {
      caseId: saleCase.id,
      fromStatus: "RECHERCHE_EN_COURS",
      toStatus: "VEHICULES_SELECTIONNES",
    },
  });
  await prisma.statusHistory.create({
    data: {
      caseId: saleCase.id,
      fromStatus: "VEHICULES_SELECTIONNES",
      toStatus: "PROPOSITION_ENVOYEE",
      note: "Proposition démo 10 000 × 1,25 = 12 500 €",
    },
  });

  await prisma.proposal.create({
    data: {
      requestId: request.id,
      vehicleId: vehicle1.id,
      caseId: saleCase.id,
      status: "ENVOYEE",
      sellerPrice: 10000,
      markupRate: 0.25,
      proposedPrice: proposed.proposed,
      currency: "EUR",
      validUntil: new Date(Date.now() + 7 * 86400000),
      createdById: commercial.id,
      fees: {
        create: [
          { label: "Transport routier estimé", amount: 1200, confirmed: false, notes: "Devis transporteur à confirmer" },
          { label: "Inspection", amount: 250, confirmed: true },
          { label: "Démarches export (estimation)", amount: 180, confirmed: false },
          { label: "Assurance transit (estimation)", amount: 180, confirmed: false },
        ],
      },
    },
  });

  const otherCase = await prisma.saleCase.create({
    data: {
      reference: "EA-2026-00002",
      clientId: otherClient.id,
      requestId: otherRequest.id,
      status: "RECHERCHE_EN_COURS",
      destinationCountry: "TN",
    },
  });

  await prisma.checklistItem.createMany({
    data: [
      {
        caseId: saleCase.id,
        category: "VEHICULE",
        title: "Vérification de l’état du véhicule",
        description: "Inspection avant engagement définitif.",
        owner: "PLATEFORME",
        expectedDocs: "Rapport d’inspection",
        estimatedCost: 250,
        status: "EN_COURS",
        certainty: "A_VERIFIER",
        sortOrder: 1,
      },
      {
        caseId: saleCase.id,
        category: "PAIEMENT",
        title: "Paiement sécurisé",
        description: "Acompte 30 % puis solde. Confirmation Stripe uniquement.",
        owner: "CLIENT",
        expectedDocs: "Reçu prestataire",
        status: "A_FAIRE",
        certainty: "SOURCE_OFFICIELLE",
        sourceName: "Stripe docs",
        sourceDatedAt: new Date("2026-01-15"),
        sortOrder: 2,
      },
      {
        caseId: saleCase.id,
        category: "DESTINATION",
        title: "Dédouanement Maroc",
        description: "Barèmes à confirmer. Ne pas traiter comme obligation chiffrée certaine.",
        owner: "CLIENT",
        status: "A_FAIRE",
        certainty: "A_VERIFIER",
        sourceName: "douane.gov.ma",
        sourceDatedAt: new Date("2025-09-01"),
        sortOrder: 3,
      },
    ],
  });

  await prisma.message.create({
    data: {
      caseId: saleCase.id,
      senderId: commercial.id,
      body: "[DÉMO] Bonjour Sofia, voici une première proposition. L’acceptation déclenchera uniquement la vérification du vendeur, pas une vente définitive.",
    },
  });

  await prisma.notification.create({
    data: {
      userId: client.id,
      title: "Proposition commerciale disponible",
      body: "Une Golf 2021 vous est proposée. Prix véhicule 12 500 € hors frais à confirmer.",
      href: `/espace/dossiers/${saleCase.id}`,
    },
  });

  await prisma.document.create({
    data: {
      caseId: saleCase.id,
      uploaderId: commercial.id,
      title: "Note d’information [DÉMO]",
      category: "INFORMATION",
      visibility: "CLIENT",
      filename: "note-demo.txt",
      mimeType: "text/plain",
      content:
        "Document de démonstration. Le rôle de la plateforme (intermédiaire) n’est pas encore validé pour des contrats réels.",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED",
      entity: "System",
      meta: JSON.stringify({
        message: "Données de démonstration chargées",
        hiddenOtherCase: otherCase.reference,
        unusedVehicle: vehicle2.externalId,
      }),
    },
  });

  console.log("Seed OK. Comptes démo :");
  console.log("  Admin      admin@demo.europauto.local / DemoAdmin123!");
  console.log("  Commercial commercial@demo.europauto.local / DemoCom123!");
  console.log("  Client     client@demo.europauto.local / DemoClient123!");
  console.log("Prix démo : 10 000 × 1,25 = 12 500 €");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
