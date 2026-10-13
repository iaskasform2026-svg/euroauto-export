import Link from "next/link";
import { Header, Footer } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const unread = await prisma.notification.count({ where: { userId: session.id, readAt: null } });
  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-52">
          <p className="text-xs uppercase tracking-wide text-navy-700">Espace sécurisé</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/espace">Tableau de bord</Link>
            <Link href="/espace/demandes/nouvelle">Nouvelle demande</Link>
            <Link href="/espace/notifications">Notifications {unread > 0 ? `(${unread})` : ""}</Link>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <Footer />
    </>
  );
}
