import { Header, Footer } from "@/components/Header";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl">Connexion</h1>
        <LoginForm next={next} />
        <div className="mt-6 text-xs text-navy-700 space-y-1">
          <p>Comptes de démonstration :</p>
          <p>Client : client@demo.europauto.local / DemoClient123!</p>
          <p>Admin : admin@demo.europauto.local / DemoAdmin123!</p>
          <p>Commercial : commercial@demo.europauto.local / DemoCom123!</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
