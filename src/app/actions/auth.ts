"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { randomBytes } from "crypto";

const registerSchema = z.object({
  accountType: z.enum(["PARTICULIER", "ENTREPRISE"]),
  legalName: z.string().min(2),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().min(3),
  country: z.string().min(2),
  email: z.string().email(),
  phoneCountryCode: z.string().min(1),
  phone: z.string().min(6),
  password: z.string().min(8),
  cgu: z.literal("on"),
  rgpd: z.literal("on"),
});

export async function registerAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: "Veuillez vérifier les champs obligatoires et les consentements." };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return { error: "Un compte existe déjà avec cet e-mail." };

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      role: "CLIENT",
      accountType: parsed.data.accountType,
      legalName: parsed.data.legalName,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      address: parsed.data.address,
      country: parsed.data.country.toUpperCase(),
      phoneCountryCode: parsed.data.phoneCountryCode,
      phone: parsed.data.phone,
      consents: {
        create: [
          { type: "CGU", accepted: true, text: "Acceptation des CGU" },
          { type: "RGPD", accepted: true, text: "Consentement au traitement des données pour la recherche et l’accompagnement export" },
        ],
      },
    },
  });

  const token = randomBytes(24).toString("hex");
  await prisma.emailToken.create({
    data: {
      userId: user.id,
      token,
      type: "VERIFY",
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
    },
  });

  redirect(`/verification?token=${token}&demo=1`);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Identifiants incorrects." };
  }
  if (!user.emailVerifiedAt) {
    return { error: "Adresse e-mail non vérifiée. Consultez le lien de vérification." };
  }
  await createSession({
    id: user.id,
    email: user.email,
    role: user.role,
    legalName: user.legalName,
    emailVerifiedAt: user.emailVerifiedAt.toISOString(),
  });
  if (user.role !== "CLIENT") redirect(next.startsWith("/admin") ? next : "/admin");
  redirect(next.startsWith("/espace") ? next : "/espace");
}

export async function verifyEmailAction(token: string) {
  const row = await prisma.emailToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return { error: "Lien invalide ou expiré." };
  await prisma.emailToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  await prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (user) {
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      legalName: user.legalName,
      emailVerifiedAt: new Date().toISOString(),
    });
  }
  redirect("/espace?welcome=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
