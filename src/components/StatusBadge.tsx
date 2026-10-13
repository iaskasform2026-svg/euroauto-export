import { STATUS_LABELS } from "@/lib/workflow";

const colors: Record<string, string> = {
  PROPOSITION_ENVOYEE: "bg-amber-100 text-amber-900",
  INTERET_CLIENT_CONFIRME: "bg-blue-100 text-blue-900",
  PAIEMENT: "bg-emerald-100 text-emerald-900",
  CLOTURE: "bg-navy-100 text-navy-800",
  ANNULE: "bg-red-100 text-red-800",
  PAIEMENT_ECHOUE: "bg-red-100 text-red-800",
  VEHICULE_INDISPONIBLE: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-navy-100 text-navy-800"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
