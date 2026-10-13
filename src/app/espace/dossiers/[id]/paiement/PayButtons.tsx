"use client";

import { useState } from "react";

export function PayButtons({ caseId, depositRate }: { caseId: string; depositRate: number }) {
  const [error, setError] = useState<string | null>(null);
  async function pay(kind: "ACOMPTE" | "SOLDE" | "TOTAL") {
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, kind }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Erreur");
    else if (data.url) window.location.href = data.url;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-primary" onClick={() => pay("ACOMPTE")}>
        Payer l’acompte ({Math.round(depositRate * 100)} %)
      </button>
      <button className="btn-secondary" onClick={() => pay("TOTAL")}>
        Payer le total confirmé
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}
