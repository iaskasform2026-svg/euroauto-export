import { importVehicleAction, importCsvAction } from "@/app/actions/admin";

export default function ImportVehiclePage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Import manuel d’annonce</h1>
      <p className="text-sm">N’importez que des sources autorisées. N’inventez jamais d’annonce.</p>
      <form action={importVehicleAction} className="card grid gap-3 md:grid-cols-2">
        <F name="make" label="Marque" required />
        <F name="model" label="Modèle" required />
        <F name="version" label="Version" />
        <F name="year" label="Année" type="number" />
        <F name="mileage" label="Kilométrage" type="number" />
        <F name="fuel" label="Carburant" />
        <F name="transmission" label="Boîte" />
        <F name="powerHp" label="Puissance ch" type="number" />
        <F name="sellerPrice" label="Prix vendeur" type="number" required />
        <F name="currency" label="Devise" defaultValue="EUR" />
        <F name="locationCity" label="Ville" />
        <F name="locationCountry" label="Pays" defaultValue="DE" />
        <F name="sellerType" label="Type vendeur PROFESSIONNEL/PARTICULIER" defaultValue="PROFESSIONNEL" />
        <F name="vendorName" label="Nom vendeur" required />
        <F name="vendorEmail" label="E-mail vendeur" />
        <F name="vendorPhone" label="Téléphone vendeur" />
        <F name="vendorAddress" label="Adresse vendeur" />
        <F name="originalUrl" label="Lien original" />
        <F name="externalId" label="Identifiant annonce" />
        <F name="missingFields" label="Champs manquants" />
        <F name="unverifiedFields" label="Champs non vérifiés" />
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" className="input min-h-24" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Notes internes</label>
          <textarea name="internalNotes" className="input" />
        </div>
        <button className="btn-primary">Enregistrer</button>
      </form>
      <form action={importCsvAction} className="card space-y-3">
        <h2 className="font-semibold">Import CSV (séparateur ;)</h2>
        <p className="text-xs">
          En-têtes : make;model;year;mileage;sellerPrice;fuel;transmission;locationCity;locationCountry;vendorName;vendorEmail;originalUrl;externalId
        </p>
        <input type="file" name="file" accept=".csv,text/csv" required />
        <button className="btn-secondary">Importer le fichier</button>
      </form>
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
