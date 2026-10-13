import { prisma } from "./prisma";

export async function generateChecklist(caseId: string) {
  const saleCase = await prisma.saleCase.findUnique({
    where: { id: caseId },
    include: { client: true, request: true },
  });
  if (!saleCase) return;

  const rules = await prisma.regulatoryRule.findMany({
    where: {
      active: true,
      OR: [
        {
          purchaseCountry: saleCase.purchaseCountry ?? "",
          destinationCountry: saleCase.destinationCountry ?? saleCase.request.destinationCountry,
          clientType: saleCase.client.accountType,
        },
        {
          purchaseCountry: "*",
          destinationCountry: "*",
          clientType: saleCase.client.accountType,
        },
        {
          purchaseCountry: "*",
          destinationCountry: "*",
          clientType: "*",
        },
      ],
    },
  });

  await prisma.checklistItem.deleteMany({ where: { caseId, status: "A_FAIRE" } });

  let order = 0;
  for (const rule of rules) {
    if (rule.transportMode && saleCase.transportMode && rule.transportMode !== saleCase.transportMode) {
      continue;
    }
    await prisma.checklistItem.create({
      data: {
        caseId,
        category: rule.category,
        title: rule.title,
        description: rule.description,
        owner: rule.owner,
        expectedDocs: rule.expectedDocs,
        estimatedCost: rule.estimatedCost,
        certainty: rule.certainty,
        sourceName: rule.sourceName,
        sourceUrl: rule.sourceUrl,
        sourceDatedAt: rule.sourceDatedAt,
        sortOrder: order++,
      },
    });
  }
}

export const CERTAINTY_LABELS: Record<string, string> = {
  SOURCE_OFFICIELLE: "Source officielle datée",
  A_VERIFIER: "À vérifier — ne pas considérer comme une obligation certaine",
};
