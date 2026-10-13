import { Header, Footer } from "@/components/Header";
import { MAIN_STATUSES, STATUS_LABELS, CLIENT_NEXT_ACTION } from "@/lib/workflow";

export default function HowPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl">Comment ça marche</h1>
        <p className="mt-4 text-navy-700">
          L’acceptation d’une proposition déclenche la vérification du vendeur. Elle n’est pas une vente définitive.
        </p>
        <ol className="mt-8 space-y-4">
          {MAIN_STATUSES.map((s, i) => (
            <li key={s} className="card">
              <p className="text-xs text-gold-600">Étape {i + 1}</p>
              <h2 className="font-semibold">{STATUS_LABELS[s]}</h2>
              <p className="mt-1 text-sm text-navy-700">{CLIENT_NEXT_ACTION[s]}</p>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  );
}
