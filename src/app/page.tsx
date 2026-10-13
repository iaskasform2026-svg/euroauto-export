import Link from "next/link";
import { Header, Footer } from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-navy-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400">Véhicules européens à l’export</p>
              <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                Trouvez, sécurisez et faites livrer le bon véhicule.
              </h1>
              <p className="mt-6 text-lg text-navy-100">
                Inscription, recherche à l’échelle européenne, proposition avec majoration transparente de 25 %,
                confirmation du vendeur, paiement sécurisé et accompagnement jusqu’à la livraison.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/inscription" className="btn-primary">
                  Créer un compte
                </Link>
                <Link href="/comment-ca-marche" className="btn-secondary !bg-transparent !text-white !border-white/30">
                  Voir le parcours
                </Link>
              </div>
              <p className="mt-6 text-xs text-navy-100/70">Version de démonstration — aucune annonce réelle n’est inventée.</p>
            </div>
            <div className="card bg-white/95 text-navy-900">
              <h2 className="font-display text-xl">Prix clair</h2>
              <p className="mt-2 text-sm">Prix proposé du véhicule = prix vendeur × 1,25</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Prix vendeur</span><strong>10 000 €</strong></div>
                <div className="flex justify-between"><span>Majoration 25 %</span><strong>2 500 €</strong></div>
                <div className="flex justify-between border-t pt-2"><span>Prix proposé</span><strong>12 500 €</strong></div>
                <p className="text-xs text-navy-700">Les frais de transport, inspection, démarches et taxes sont affichés à part, confirmés ou à vérifier.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl">Trois espaces</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["Site public", "Présentation, inscription, consentements et vérification d’e-mail."],
              ["Espace client", "Demandes, propositions sans coordonnées vendeur, paiements, documents, rendez-vous, messagerie."],
              ["Administration", "Import d’annonces, matching, journal fournisseurs, workflow, audit et export."],
            ].map(([t, d]) => (
              <div key={t} className="card">
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-navy-700">{d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
