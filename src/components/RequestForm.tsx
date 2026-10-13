export function RequestForm({
  action,
  defaults,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Record<string, string | number | null | undefined>;
}) {
  const d = defaults ?? {};
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field name="destinationCountry" label="Pays de destination" defaultValue={d.destinationCountry ?? "MA"} required />
      <Field name="make" label="Marque" defaultValue={d.make} required />
      <Field name="model" label="Modèle" defaultValue={d.model} required />
      <Field name="version" label="Version" defaultValue={d.version} />
      <Field name="yearMin" label="Année min." type="number" defaultValue={d.yearMin} />
      <Field name="yearMax" label="Année max." type="number" defaultValue={d.yearMax} />
      <Field name="mileageMax" label="Kilométrage max." type="number" defaultValue={d.mileageMax} />
      <Field name="engine" label="Motorisation" defaultValue={d.engine} />
      <div>
        <label className="label">Carburant</label>
        <select name="fuel" className="input" defaultValue={String(d.fuel ?? "")}>
          <option value="">Indifférent</option>
          {["Essence", "Diesel", "Hybride", "Électrique", "GPL"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Boîte</label>
        <select name="gearbox" className="input" defaultValue={String(d.gearbox ?? "")}>
          <option value="">Indifférent</option>
          <option>Manuelle</option>
          <option>Automatique</option>
        </select>
      </div>
      <Field name="body" label="Carrosserie" defaultValue={d.body} />
      <Field name="mustHaveOptions" label="Options indispensables" defaultValue={d.mustHaveOptions} />
      <Field name="color" label="Couleur souhaitée" defaultValue={d.color} />
      <Field name="seats" label="Nombre de places" type="number" defaultValue={d.seats} />
      <Field name="budgetMax" label="Budget maximal" type="number" defaultValue={d.budgetMax} required />
      <div>
        <label className="label">Devise</label>
        <select name="currency" className="input" defaultValue={String(d.currency ?? "EUR")}>
          <option>EUR</option>
          <option>USD</option>
          <option>MAD</option>
        </select>
      </div>
      <div>
        <label className="label">Précision du budget</label>
        <select name="budgetScope" className="input" defaultValue={String(d.budgetScope ?? "COUT_TOTAL")}>
          <option value="VEHICULE_SEUL">Véhicule seul</option>
          <option value="COUT_TOTAL">Coût total (commission, transport, démarches)</option>
        </select>
      </div>
      <Field name="desiredDelay" label="Délai souhaité" defaultValue={d.desiredDelay} />
      <div className="md:col-span-2">
        <label className="label">Préférences / commentaires</label>
        <textarea name="comments" className="input min-h-24" defaultValue={String(d.comments ?? d.otherPreferences ?? "")} />
        <input type="hidden" name="otherPreferences" defaultValue={String(d.otherPreferences ?? "")} />
      </div>
      <div className="md:col-span-2">
        <button className="btn-primary">Enregistrer la demande</button>
      </div>
    </form>
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
  defaultValue?: string | number | null | undefined;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" name={name} type={type} required={required} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
