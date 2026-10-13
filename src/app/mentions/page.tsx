import { Header, Footer } from "@/components/Header";

export default function MentionsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 space-y-4">
        <h1 className="font-display text-3xl">Mentions et protection des données</h1>
        <p>
          Cette instance est une démonstration. Les comptes, véhicules et vendeurs marqués [DÉMO] sont fictifs.
        </p>
        <p>
          Les données clients sont utilisées uniquement pour la recherche de véhicules, les propositions, le suivi du
          dossier et les obligations légales. Consentements CGU et RGPD collectés à l’inscription.
        </p>
        <p>
          Les coordonnées des vendeurs, liens d’annonces originales et notes internes ne sont pas exposés à l’espace
          client. Ils restent dans l’administration et les documents contractuels lorsque la loi l’exige.
        </p>
        <p>Conservation : dossiers clôturés archivés, journaux d’audit conservés, pas de stockage de cartes bancaires.</p>
      </main>
      <Footer />
    </>
  );
}
