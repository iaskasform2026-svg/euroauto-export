import { importVehicleAction, importCsvAction } from "@/app/actions/admin";

export default function ImportVehiclePage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Import manuel d’annonce</h1>
      <p className="text-sm">N’importez que des sources autorisées. N’inventez jamais d’annonce.</p>
    </div>
  );
}

function F({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
