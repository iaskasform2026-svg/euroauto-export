import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "@/app/actions/admin";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div>
      <h1 className="font-display text-3xl">Paramètres plateforme</h1>
      <p className="text-sm mt-2 mb-4">
        Les contrats et paiements réels restent conditionnés à CONTRACTS_ENABLED et au rôle commercial validé.
      </p>
      <form action={saveSettingsAction} className="card grid gap-3 md:grid-cols-2">
        <F name="name" label="Nom" defaultValue={s.name} />
        <F name="email" label="E-mail" defaultValue={s.email} />
        <F name="phone" label="Téléphone" defaultValue={s.phone} />
        <F name="address" label="Adresse" defaultValue={s.address} />
        <F name="country" label="Pays" defaultValue={s.country} />
        <div>
          <label className="label">Rôle commercial</label>
          <select name="commercialRole" className="input" defaultValue={s.commercialRole}>
            <option value="INTERMEDIAIRE">Intermédiaire</option>
            <option value="MANDATAIRE">Mandataire</option>
            <option value="REVENDEUR">Revendeur</option>
          </select>
        </div>
        <F name="defaultCurrency" label="Devise" defaultValue={s.defaultCurrency} />
        <F name="targetCountries" label="Pays européens ciblés" defaultValue={s.targetCountries} />
        <F name="destinationCountries" label="Pays de destination" defaultValue={s.destinationCountries} />
        <label className="md:col-span-2 flex gap-2 text-sm">
          <input type="checkbox" name="contractsEnabled" defaultChecked={s.contractsEnabled} /> Activer contrats / paiements
          réels (interdit tant que le rôle n’est pas validé juridiquement)
        </label>
        <button className="btn-primary">Enregistrer</button>
      </form>
    </div>
  );
}

function F({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" name={name} defaultValue={defaultValue} />
    </div>
  );
}
