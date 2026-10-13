import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Page introuvable</h1>
      <p className="mt-3 text-sm">Cette ressource n’existe pas ou vous n’y avez pas accès.</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Accueil
      </Link>
    </main>
  );
}
