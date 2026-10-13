"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, isStaff } from "@/lib/auth";
import { computeProposedPrice } from "@/lib/pricing";
import { fingerprint, matchScore } from "@/lib/matching";
import { changeStatus } from "@/lib/cases";
import { getSettings } from "@/lib/settings";
import { sendMail, vendorAvailabilityTemplate } from "@/lib/email";
import { parseVehicleCsv } from "@/lib/connectors";
import { notify } from "@/lib/notify";
import { generateChecklist } from "@/lib/checklist";

async function requireStaff() {
  const session = await getSession();
  if (!session || !isStaff(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function importVehicleAction(formData: FormData) {
  const session = await requireStaff();
  const sellerPrice = Number(formData.get("sellerPrice"));
  if (!sellerPrice || sellerPrice <= 0) return { error: "Prix vendeur invalide." };
  const make = String(formData.get("make") ?? "");
  const model = String(formData.get("model") ?? "");
  const fp = fingerprint({
    make,
    model,
    year: Number(formData.get("year") || 0) || null,
    mileage: Number(formData.get("mileage") || 0) || null,
    sellerPrice,
    locationCity: String(formData.get("locationCity") ?? ""),
  });
  const dup = await prisma.vehicle.findFirst({ where: { fingerprint: fp } });
  const vendor = await prisma.vendor.create({
    data: {
      type: String(formData.get("sellerType") ?? "PROFESSIONNEL"),
      legalName: String(formData.get("vendorName") ?? "Vendeur"),
      email: String(formData.get("vendorEmail") ?? "") || null,
      phone: String(formData.get("vendorPhone") ?? "") || null,
      address: String(formData.get("vendorAddress") ?? "") || null,
      country: String(formData.get("locationCountry") ?? "") || null,
    },
  });
  const vehicle = await prisma.vehicle.create({
    data: {
      source: "import-manuel",
      originalUrl: String(formData.get("originalUrl") ?? "") || null,
      externalId: String(formData.get("externalId") ?? "") || `MAN-${Date.now()}`,
      make,
      model,
      version: String(formData.get("version") ?? "") || null,
      year: Number(formData.get("year") || 0) || null,
      mileage: Number(formData.get("mileage") || 0) || null,
      fuel: String(formData.get("fuel") ?? "") || null,
      transmission: String(formData.get("transmission") ?? "") || null,
      powerHp: Number(formData.get("powerHp") || 0) || null,
      options: String(formData.get("options") ?? "") || null,
      condition: String(formData.get("condition") ?? "") || null,
      sellerPrice,
      currency: String(formData.get("currency") ?? "EUR"),
      taxInfo: String(formData.get("taxInfo") ?? "") || null,
      locationCity: String(formData.get("locationCity") ?? "") || null,
      locationCountry: String(formData.get("locationCountry") ?? "") || null,
      locationAddress: String(formData.get("vendorAddress") ?? "") || null,
      description: String(formData.get("description") ?? "") || null,
      sellerType: String(formData.get("sellerType") ?? "PROFESSIONNEL"),
      history: String(formData.get("history") ?? "") || null,
      missingFields: String(formData.get("missingFields") ?? "") || null,
      unverifiedFields: String(formData.get("unverifiedFields") ?? "") || null,
      internalNotes: String(formData.get("internalNotes") ?? "") || null,
      fingerprint: fp,
      isDemo: true,
      vendorId: vendor.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: session.id,
      action: "VEHICLE_IMPORT",
      entity: "Vehicle",
      entityId: vehicle.id,
      meta: JSON.stringify({ duplicateFingerprint: Boolean(dup) }),
    },
  });
  revalidatePath("/admin/vehicules");
  return { ok: true, id: vehicle.id, duplicateWarning: dup ? `Doublon possible avec ${dup.id}` : undefined };
}

export async function importCsvAction(formData: FormData) {
  await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Fichier manquant." };
  const text = await file.text();
  const rows = parseVehicleCsv(text);
  let count = 0;
  for (const row of rows) {
    const fd = new FormData();
    Object.entries(row).forEach(([k, v]) => fd.set(k, v));
    await importVehicleAction(fd);
    count++;
  }
  return { ok: true, count };
}

export async function createProposalAction(formData: FormData) {
  const session = await requireStaff();
  const requestId = String(formData.get("requestId"));
  const vehicleId = String(formData.get("vehicleId"));
  const request = await prisma.vehicleRequest.findUnique({ where: { id: requestId } });
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!request || !vehicle) return { error: "Demande ou véhicule introuvable." };
  const settings = await getSettings();
  const pricing = computeProposedPrice(vehicle.sellerPrice, settings.markupRate);
  const saleCase = await prisma.saleCase.findFirst({ where: { requestId } });
  const validUntil = new Date(Date.now() + 7 * 86400000);
  const proposal = await prisma.proposal.create({
    data: {
      requestId,
      vehicleId,
      caseId: saleCase?.id,
      status: "ENVOYEE",
      sellerPrice: pricing.sellerPrice,
      markupRate: pricing.markupRate,
      proposedPrice: pricing.proposed,
      currency: vehicle.currency,
      validUntil,
      createdById: session.id,
      fees: {
        create: [
          { label: "Transport (estimation)", amount: Number(formData.get("feeTransport") || 0), confirmed: false },
          { label: "Inspection", amount: Number(formData.get("feeInspect") || 0), confirmed: Boolean(formData.get("feeInspectConfirmed")) },
          { label: "Démarches", amount: Number(formData.get("feeAdmin") || 0), confirmed: false },
          { label: "Assurance", amount: Number(formData.get("feeInsurance") || 0), confirmed: false },
          { label: "Taxes / autres", amount: Number(formData.get("feeTax") || 0), confirmed: false },
        ].filter((f) => f.amount > 0),
      },
    },
  });
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
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      sellerPrice: vehicle.sellerPrice,
      currency: vehicle.currency,
      available: vehicle.available,
    },
    pricing.proposed,
  );
  await prisma.vehicleMatch.upsert({
    where: { requestId_vehicleId: { requestId, vehicleId } },
    create: { requestId, vehicleId, score: match.score, gaps: JSON.stringify(match.gaps) },
    update: { score: match.score, gaps: JSON.stringify(match.gaps) },
  });
  if (saleCase) {
    await changeStatus({
      caseId: saleCase.id,
      toStatus: "PROPOSITION_ENVOYEE",
      actorId: session.id,
      note: `Prix proposé ${pricing.proposed} ${vehicle.currency} (majoration ${pricing.markupRate * 100} %)`,
    });
  }
  await prisma.vehicleRequest.update({ where: { id: requestId }, data: { status: "PROPOSITION_ENVOYEE" } });
  await notify({
    userId: request.clientId,
    title: "Nouvelle proposition commerciale",
    body: `${vehicle.make} ${vehicle.model} — ${pricing.proposed} ${vehicle.currency}`,
    href: `/espace/dossiers/${saleCase?.id}`,
  });
  redirect(`/admin/propositions/${proposal.id}`);
}

export async function sendVendorEmailAction(formData: FormData) {
  const session = await requireStaff();
  const vehicleId = String(formData.get("vehicleId"));
  const caseId = String(formData.get("caseId"));
  const confirm = formData.get("humanConfirm");
  if (confirm !== "on") return { error: "Validation humaine obligatoire avant envoi." };
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { vendor: true } });
  if (!vehicle?.vendor?.email) return { error: "E-mail vendeur manquant." };
  const settings = await getSettings();
  const tpl = vendorAvailabilityTemplate({
    platformName: settings.name,
    vehicleLabel: `${vehicle.make} ${vehicle.model} ${vehicle.year ?? ""}`,
    sellerPrice: vehicle.sellerPrice,
    currency: vehicle.currency,
  });
  const result = await sendMail({ to: vehicle.vendor.email, subject: tpl.subject, text: tpl.body });
  await prisma.contactLog.create({
    data: {
      caseId,
      vendorId: vehicle.vendorId,
      authorId: session.id,
      channel: "EMAIL",
      direction: "SORTANT",
      subject: tpl.subject,
      body: tpl.body,
      actuallySent: result.sent,
      sentAt: result.sent ? new Date() : null,
    },
  });
  return {
    ok: result.sent,
    message: result.sent
      ? "E-mail envoyé."
      : `E-mail NON envoyé. ${result.reason} Le journal a enregistré un brouillon, pas un envoi.`,
  };
}

export async function logManualEmailAction(formData: FormData) {
  const session = await requireStaff();
  await prisma.contactLog.create({
    data: {
      caseId: String(formData.get("caseId")),
      vendorId: String(formData.get("vendorId") || "") || null,
      authorId: session.id,
      channel: "EMAIL_MANUEL",
      direction: "SORTANT",
      subject: String(formData.get("subject")),
      body: String(formData.get("body")),
      actuallySent: true,
      sentAt: new Date(),
    },
  });
  revalidatePath("/admin/dossiers/" + String(formData.get("caseId")));
}

export async function saveCallReportAction(formData: FormData) {
  const session = await requireStaff();
  const actually = formData.get("actuallyCalled") === "on";
  await prisma.callReport.create({
    data: {
      caseId: String(formData.get("caseId")),
      vendorId: String(formData.get("vendorId") || "") || null,
      authorId: session.id,
      actuallyCalled: actually,
      calledAt: actually ? new Date() : null,
      outcome: String(formData.get("outcome")),
      availability: String(formData.get("availability") ?? ""),
      finalPrice: Number(formData.get("finalPrice") || 0) || null,
      documents: String(formData.get("documents") ?? ""),
      exportPossible: formData.get("exportPossible") === "on",
      notes: String(formData.get("notes") ?? ""),
    },
  });
  revalidatePath("/admin/dossiers/" + String(formData.get("caseId")));
}

export async function confirmVendorAction(formData: FormData) {
  const session = await requireStaff();
  const caseId = String(formData.get("caseId"));
  const proof = String(formData.get("vendorProof") ?? "").trim();
  const conditions = String(formData.get("agreedConditions") ?? "").trim();
  if (!proof || !conditions) {
    return { error: "Preuve de confirmation vendeur et conditions convenues obligatoires." };
  }
  await prisma.saleCase.update({
    where: { id: caseId },
    data: { vendorConfirmed: true, vendorProof: proof, agreedConditions: conditions },
  });
  await changeStatus({
    caseId,
    toStatus: "VERIFICATION_VENDEUR",
    actorId: session.id,
    note: "Preuve vendeur enregistrée. Le client doit valider l’offre finale.",
  });
  const c = await prisma.saleCase.findUnique({ where: { id: caseId } });
  if (c) {
    await notify({
      userId: c.clientId,
      title: "Vendeur confirmé",
      body: "Les conditions sont enregistrées. Merci de valider l’offre finale.",
      href: `/espace/dossiers/${caseId}`,
    });
  }
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function priceChangeAction(formData: FormData) {
  const session = await requireStaff();
  const proposalId = String(formData.get("proposalId"));
  const newSeller = Number(formData.get("sellerPrice"));
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return { error: "Proposition introuvable." };
  const settings = await getSettings();
  const pricing = computeProposedPrice(newSeller, settings.markupRate);
  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      sellerPrice: pricing.sellerPrice,
      proposedPrice: pricing.proposed,
      status: "ENVOYEE",
      acceptedAt: null,
    },
  });
  if (proposal.caseId) {
    await prisma.saleCase.update({
      where: { id: proposal.caseId },
      data: { vendorConfirmed: false },
    });
    await changeStatus({
      caseId: proposal.caseId,
      toStatus: "CHANGEMENT_PRIX",
      actorId: session.id,
      note: `Nouveau prix vendeur ${pricing.sellerPrice} → proposé ${pricing.proposed}. Nouvelle acceptation client requise.`,
    });
  }
  revalidatePath("/admin");
}

export async function updateCaseStatusAction(formData: FormData) {
  const session = await requireStaff();
  const caseId = String(formData.get("caseId"));
  const toStatus = String(formData.get("toStatus"));
  const note = String(formData.get("note") ?? "");
  const saleCase = await prisma.saleCase.findUnique({ where: { id: caseId } });
  if (toStatus === "PAIEMENT" || toStatus === "CLOTURE") {
    return { error: "Le statut paiement / clôture suit les événements métier (Stripe, livraison), pas un simple clic." };
  }
  if (["OFFRE_FINALE_VALIDEE"].includes(toStatus) && !saleCase?.vendorConfirmed) {
    return { error: "Preuve vendeur requise avant offre finale." };
  }
  await changeStatus({ caseId, toStatus, actorId: session.id, note });
  if (toStatus === "FORMALITES_EXPORT" || toStatus === "RECHERCHE_EN_COURS") {
    await generateChecklist(caseId);
  }
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function createAppointmentAction(formData: FormData) {
  const session = await requireStaff();
  const caseId = String(formData.get("caseId"));
  const saleCase = await prisma.saleCase.findUnique({ where: { id: caseId } });
  if (!saleCase) return { error: "Dossier introuvable." };
  await prisma.appointment.create({
    data: {
      caseId,
      createdById: session.id,
      type: String(formData.get("type")),
      startsAt: new Date(String(formData.get("startsAt"))),
      timezone: String(formData.get("timezone") ?? "Europe/Paris"),
      location: String(formData.get("location") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      status: "PROPOSE",
      participants: {
        create: [
          { userId: saleCase.clientId, roleLabel: "CLIENT", confirmed: false },
          { userId: session.id, roleLabel: "PLATEFORME", confirmed: true, confirmedAt: new Date() },
          { roleLabel: String(formData.get("extraRole") || "VENDEUR"), confirmed: false },
        ],
      },
    },
  });
  await notify({
    userId: saleCase.clientId,
    title: "Rendez-vous proposé",
    body: "Un créneau vous est proposé. Il ne sera confirmé qu’après votre accord.",
    href: `/espace/dossiers/${caseId}`,
  });
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function confirmAppointmentAction(appointmentId: string) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { participants: true, saleCase: true },
  });
  if (!appt) return { error: "Rendez-vous introuvable." };
  if (session.role === "CLIENT" && appt.saleCase.clientId !== session.id) return { error: "Accès refusé." };
  const mine = appt.participants.find((p) => p.userId === session.id);
  if (mine) {
    await prisma.appointmentParticipant.update({
      where: { id: mine.id },
      data: { confirmed: true, confirmedAt: new Date() },
    });
  }
  const fresh = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { participants: true },
  });
  const all = fresh?.participants.every((p) => p.confirmed);
  if (all) {
    await prisma.appointment.update({ where: { id: appointmentId }, data: { status: "CONFIRME" } });
  }
  revalidatePath(`/espace/dossiers/${appt.caseId}`);
}

export async function sendMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const caseId = String(formData.get("caseId"));
  const saleCase = await prisma.saleCase.findUnique({ where: { id: caseId } });
  if (!saleCase) return { error: "Dossier introuvable." };
  if (session.role === "CLIENT" && saleCase.clientId !== session.id) return { error: "Accès refusé." };
  await prisma.message.create({
    data: { caseId, senderId: session.id, body: String(formData.get("body") ?? "") },
  });
  const target = session.role === "CLIENT" ? saleCase.assigneeId : saleCase.clientId;
  if (target) {
    await notify({
      userId: target,
      title: "Nouveau message",
      body: "Un message a été ajouté au dossier.",
      href: session.role === "CLIENT" ? `/espace/dossiers/${caseId}` : `/admin/dossiers/${caseId}`,
    });
  }
  revalidatePath(`/espace/dossiers/${caseId}`);
}

export async function uploadDocumentAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const caseId = String(formData.get("caseId"));
  const saleCase = await prisma.saleCase.findUnique({ where: { id: caseId } });
  if (!saleCase) return { error: "Dossier introuvable." };
  if (session.role === "CLIENT" && saleCase.clientId !== session.id) return { error: "Accès refusé." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Fichier manquant." };
  const buf = Buffer.from(await file.arrayBuffer());
  await prisma.document.create({
    data: {
      caseId,
      uploaderId: session.id,
      title: String(formData.get("title") || file.name),
      category: String(formData.get("category") || "PIECE"),
      visibility: session.role === "CLIENT" ? "CLIENT" : String(formData.get("visibility") || "CLIENT"),
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      content: buf.toString("base64"),
    },
  });
  revalidatePath(`/espace/dossiers/${caseId}`);
}

export async function saveSettingsAction(formData: FormData) {
  const session = await requireStaff();
  if (session.role !== "ADMIN") return { error: "Administrateur uniquement." };
  await prisma.platformSettings.update({
    where: { id: "default" },
    data: {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      phone: String(formData.get("phone")),
      address: String(formData.get("address")),
      country: String(formData.get("country")),
      commercialRole: String(formData.get("commercialRole")),
      contractsEnabled: formData.get("contractsEnabled") === "on",
      defaultCurrency: String(formData.get("defaultCurrency")),
      targetCountries: String(formData.get("targetCountries")),
      destinationCountries: String(formData.get("destinationCountries")),
    },
  });
  revalidatePath("/admin/parametres");
}

export async function markVehicleUnavailableAction(id: string, reason: string) {
  const session = await requireStaff();
  await prisma.vehicle.update({
    where: { id },
    data: { available: false, unavailableReason: reason, lastCheckedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { actorId: session.id, action: "VEHICLE_UNAVAILABLE", entity: "Vehicle", entityId: id, meta: reason },
  });
}
