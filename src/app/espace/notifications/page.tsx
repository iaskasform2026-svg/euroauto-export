import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const items = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  await prisma.notification.updateMany({ where: { userId: session.id, readAt: null }, data: { readAt: new Date() } });
  return (
    <div>
      <h1 className="font-display text-3xl">Notifications</h1>
      <ul className="mt-6 space-y-3">
        {items.map((n) => (
          <li key={n.id} className="card">
            <p className="font-semibold">{n.title}</p>
            <p className="text-sm">{n.body}</p>
            {n.href && (
              <Link href={n.href} className="text-sm text-gold-600">
                Ouvrir
              </Link>
            )}
          </li>
        ))}
        {items.length === 0 && <p>Aucune notification.</p>}
      </ul>
    </div>
  );
}
