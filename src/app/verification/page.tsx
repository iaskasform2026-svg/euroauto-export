import { Header, Footer } from "@/components/Header";
import { verifyEmailAction } from "@/app/actions/auth";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; demo?: string }>;
}) {
  const { token, demo } = await searchParams;
  async function confirm() {
    "use server";
    if (!token) return;
    await verifyEmailAction(token);
  }
  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="card">
          <h1 className="font-display text-2xl">Vérification de l’e-mail</h1>
          {demo && (
            <p className="mt-3 text-sm text-navy-700">
              Mode démonstration : le lien de vérification est affiché ici car aucun SMTP n’est connecté. En
              production, il serait envoyé uniquement par e-mail.
            </p>
          )}
          {token ? (
            <form action={confirm} className="mt-6">
              <button className="btn-primary">Confirmer mon adresse</button>
            </form>
          ) : (
            <p className="mt-4 text-sm">Lien manquant.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
