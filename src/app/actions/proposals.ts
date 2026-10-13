"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { changeStatus } from "@/lib/cases";
import { notify } from "@/lib/notify";
import { redirect } from "next/navigation";

export async function respondProposalAction(proposalId: string, action: string, message?: string) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { request: true, saleCase: true },
  });
  if (!proposal) return { error: "Proposition introuvable." };
  if (session.role === "CLIENT" && proposal.request.clientId !== session.id) return { error: "Accès refusé." };

  if (action === "accept") {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTEE", acceptedAt: new Date(), clientMessage: message },
    });
    if (proposal.caseId) {
      await changeStatus({
        caseId: proposal.caseId,
        toStatus: "VERIFICATION_VENDEUR",
        actorId: session.id,
        note: "Intérêt client confirmé — ce n’est pas une vente définitive. Vérification vendeur requise.",
      });
      await prisma.saleCase.update({
        where: { id: proposal.caseId },
        data: { status: "VERIFICATION_VENDEUR" },
      });
    }
    await notify({
      userId: proposal.createdById,
      title: "Intérêt client",
      body: "Le client a accepté une proposition. Contacter le vendeur (preuve obligatoire).",
      href: `/admin/dossiers/${proposal.caseId}`,
    });
  } else if (action === "reject") {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "REFUSEE", rejectedAt: new Date(), clientMessage: message },
    });
  } else if (action === "question") {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "QUESTION", clientMessage: message },
    });
    if (proposal.caseId && message) {
      await prisma.message.create({ data: { caseId: proposal.caseId, senderId: session.id, body: message } });
    }
  } else if (action === "alternative") {
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "ALTERNATIVE_DEMANDEE", clientMessage: message },
    });
  }

  redirect(`/espace/dossiers/${proposal.caseId}`);
}

export async function acceptFinalOfferAction(caseId: string) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const saleCase = await prisma.saleCase.findUnique({ where: { id: caseId } });
  if (!saleCase) return { error: "Dossier introuvable." };
  if (session.role === "CLIENT" && saleCase.clientId !== session.id) return { error: "Accès refusé." };
  if (!saleCase.vendorConfirmed) {
    return { error: "L’offre finale n’est pas disponible tant que le vendeur n’est pas confirmé avec preuve." };
  }
  await changeStatus({
    caseId,
    toStatus: "OFFRE_FINALE_VALIDEE",
    actorId: session.id,
    note: "Offre finale validée par le client.",
  });
  redirect(`/espace/dossiers/${caseId}/paiement`);
}
