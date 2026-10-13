export type ConnectorStatus = "operationnel" | "a_connecter" | "manuel";

export const CONNECTORS: {
  id: string;
  name: string;
  region: string;
  status: ConnectorStatus;
  notes: string;
}[] = [
  {
    id: "manual-csv",
    name: "Import manuel CSV / formulaire",
    region: "Europe",
    status: "operationnel",
    notes: "Saisie et import contrôlés par un opérateur. Aucune annonce n’est inventée.",
  },
  {
    id: "json-upload",
    name: "Import JSON partenaire",
    region: "Europe",
    status: "operationnel",
    notes: "Fichier fourni par un partenaire autorisé.",
  },
  {
    id: "autoscout24",
    name: "AutoScout24 API",
    region: "UE",
    status: "a_connecter",
    notes: "Accès partenaire requis. Pas de collecte non autorisée.",
  },
  {
    id: "mobilede",
    name: "Mobile.de / eBay Motors API",
    region: "Allemagne",
    status: "a_connecter",
    notes: "Accès partenaire requis.",
  },
  {
    id: "leboncoin",
    name: "Leboncoin",
    region: "France",
    status: "manuel",
    notes: "Pas d’API publique adaptée : import manuel ou partenariat uniquement.",
  },
];

export function parseVehicleCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(";");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] ?? "").trim();
    });
    return row;
  });
}
