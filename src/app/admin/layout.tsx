import Link from "next/link";
import { Header, Footer } from "@/components/Header";

const links = [
  ["/admin", "Tableau de bord"],
  ["/admin/clients", "Clients"],
  ["/admin/dossiers", "Dossiers"],
  ["/admin/vehicules", "Véhicules"],
  ["/admin/vehicules/nouveau", "Import manuel"],
  ["/admin/propositions/nouvelle", "Nouvelle proposition"],
  ["/admin/parametres", "Paramètres"],
  ["/admin/connecteurs", "Intégrations"],
  ["/admin/audit", "Audit"],
  ["/api/admin/export", "Export CSV"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <p className="text-xs uppercase tracking-wide text-navy-700">Administration</p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            {links.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <Footer />
    </>
  );
}
