import { Header, Footer } from "@/components/Header";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl">Inscription adhérent</h1>
        <p className="mt-2 text-sm text-navy-700">E-mail vérifié, consentements CGU et données personnelles obligatoires.</p>
        <form action={registerAction} className="card mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Type de client</label>
            <select name="accountType" className="input" defaultValue="PARTICULIER">
              <option value="PARTICULIER">Particulier</option>
              <option value="ENTREPRISE">Entreprise</option>
            </select>
          </div>
          <Field name="legalName" label="Nom, prénom ou raison sociale" required />
          <Field name="firstName" label="Prénom" />
          <Field name="lastName" label="Nom" />
          <div className="md:col-span-2">
            <Field name="address" label="Adresse" required />
          </div>
          <Field name="country" label="Pays de résidence (code ISO)" defaultValue="MA" required />
          <Field name="email" label="E-mail" type="email" required />
          <Field name="phoneCountryCode" label="Indicatif" defaultValue="+212" required />
          <Field name="phone" label="Téléphone" required />
          <Field name="password" label="Mot de passe (8 caractères min.)" type="password" required />
          <label className="md:col-span-2 flex gap-2 text-sm">
            <input type="checkbox" name="cgu" required /> J’accepte les conditions générales d’utilisation.
          </label>
          <label className="md:col-span-2 flex gap-2 text-sm">
            <input type="checkbox" name="rgpd" required /> J’accepte le traitement de mes données pour la recherche de
            véhicules et l’accompagnement à l’export.
          </label>
          <div className="md:col-span-2">
            <button className="btn-primary">Créer le compte</button>
          </div>
        </form>
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
