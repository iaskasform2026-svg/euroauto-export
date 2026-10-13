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
