import { Header, Footer } from "@/components/Header";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl">Inscription adhérent</h1>
        <p className="mt-2 text-sm text-navy-700">E-mail vérifié, consentements CGU et données personnelles obligatoires.</p>
      </main>
      <Footer />
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
