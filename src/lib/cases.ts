import { prisma } from "./prisma";
import { generateChecklist } from "./checklist";
import { notify } from "./notify";

export async function changeStatus(opts: {
  caseId: string;
  toStatus: string;
  actorId?: string;
  note?: string;
}) {
  const current = await prisma.saleCase.findUnique({ where: { id: opts.caseId } });
  if (!current) throw new Error("Dossier introuvable");

  const updated = await prisma.saleCase.update({
    where: { id: opts.caseId },
    data: { status: opts.toStatus },
  });

  await prisma.statusHistory.create({
    data: {
      caseId: opts.caseId,
      fromStatus: current.status,
      toStatus: opts.toStatus,
      note: opts.note,
      actorId: opts.actorId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: "STATUS_CHANGE",
      entity: "SaleCase",
      entityId: opts.caseId,
      meta: JSON.stringify({ from: current.status, to: opts.toStatus, note: opts.note }),
    },
  });

  await notify({
    userId: current.clientId,
    title: "Mise à jour de votre dossier",
    body: `Nouveau statut : ${opts.toStatus.replaceAll("_", " ").toLowerCase()}.`,
    href: `/espace/dossiers/${current.id}`,
  });

  return updated;
}

export async function ensureCaseForRequest(requestId: string, actorId?: string) {
  const existing = await prisma.saleCase.findFirst({ where: { requestId } });
  if (existing) return existing;
  const request = await prisma.vehicleRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new Error("Demande introuvable");
  const count = await prisma.saleCase.count();
  const reference = `EA-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  const created = await prisma.saleCase.create({
    data: {
      reference,
      clientId: request.clientId,
      requestId: request.id,
      status: "DEMANDE_ENREGISTREE",
      destinationCountry: request.destinationCountry,
    },
  });
  await prisma.statusHistory.create({
    data: {
      caseId: created.id,
      toStatus: "DEMANDE_ENREGISTREE",
      note: "Création automatique du dossier",
      actorId,
    },
  });
  await generateChecklist(created.id);
  return created;
}
