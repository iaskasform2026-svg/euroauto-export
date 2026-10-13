export function Flash({ message, type = "info" }: { message?: string; type?: "info" | "error" | "ok" }) {
  if (!message) return null;
  const cls =
    type === "error"
      ? "bg-red-50 text-red-800 border-red-200"
      : type === "ok"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-amber-50 text-navy-800 border-amber-200";
  return <div className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{message}</div>;
}
