import { prisma } from "./prisma";

export async function notify(opts: { userId: string; title: string; body: string; href?: string }) {
  await prisma.notification.create({ data: opts });
}
