import Link from "next/link";
import { getSession } from "@/lib/auth";
import { isStaff } from "@/lib/auth";

export async function Header() {
  const session = await getSession();
  return (
    <header className="border-b border-navy-800/30 bg-navy-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-lg tracking-tight">
          EuropAuto <span className="text-gold-400">Export</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <Link href="/comment-ca-marche" className="hover:text-gold-400">
            Comment ça marche
          </Link>
          <Link href="/mentions" className="hover:text-gold-400">
            Mentions
          </Link>
          {session ? (
            <>
              {isStaff(session.role) && (
                <Link href="/admin" className="hover:text-gold-400">
                  Administration
                </Link>
              )}
              <Link href="/espace" className="hover:text-gold-400">
                Espace client
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="text-gold-400">Déconnexion</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion">Connexion</Link>
              <Link href="/inscription" className="btn-primary !py-1.5">
                S’inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-navy-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-navy-700">
        <p className="font-semibold">EuropAuto Export — version de démonstration</p>
        <p className="mt-2 max-w-3xl">
          Les annonces, vendeurs et paiements affichés sont fictifs tant que les intégrations réelles ne sont pas
          connectées. Aucune coordonnée de vendeur n’est transmise aux clients. Les contrats réels restent
          désactivés tant que le rôle commercial n’est pas validé.
        </p>
      </div>
    </footer>
  );
}
