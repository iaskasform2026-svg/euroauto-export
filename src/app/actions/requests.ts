"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureCaseForRequest } from "@/lib/cases";
import { redirect } from "next/navigation";

const schema = z.object({
  destinationCountry: z.string().min(2),
  make: z.string().min(1),
  model: z.string().min(1),
  version: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  mileageMax: z.coerce.number().optional(),
  engine: z.string().optional(),
  fuel: z.string().optional(),
  gearbox: z.string().optional(),
  body: z.string().optional(),
  mustHaveOptions: z.string().optional(),
  color: z.string().optional(),
  seats: z.coerce.number().optional(),
  otherPreferences: z.string().optional(),
  budgetMax: z.coerce.number().positive(),
  currency: z.string().default("EUR"),
  budgetScope: z.enum(["VEHICULE_SEUL", "COUT_TOTAL"]),
  desiredDelay: z.string().optional(),
  comments: z.string().optional(),
});

export async function createRequestAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Veuillez compléter les champs obligatoires (destination, véhicule, budget)." };

  const request = await prisma.vehicleRequest.create({
    data: { ...parsed.data, clientId: session.id, status: "DEMANDE_ENREGISTREE" },
  });
  await ensureCaseForRequest(request.id, session.id);
  redirect(`/espace/demandes/${request.id}`);
}

export async function updateRequestAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const existing = await prisma.vehicleRequest.findUnique({ where: { id } });
  if (!existing) return { error: "Demande introuvable." };
  if (session.role === "CLIENT" && existing.clientId !== session.id) return { error: "Accès refusé." };
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "Champs invalides." };
  await prisma.vehicleRequest.update({ where: { id }, data: parsed.data });
  redirect(`/espace/demandes/${id}`);
}
