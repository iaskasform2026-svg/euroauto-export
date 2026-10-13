import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { actor: true } });
  return (
    <div>
      <h1 className="font-display text-3xl">Journal d’audit</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {logs.map((l) => (
          <li key={l.id} className="card">
            {l.createdAt.toLocaleString("fr-FR")} · {l.actor?.email ?? "système"} · {l.action} · {l.entity} {l.entityId}{" "}
            {l.meta}
          </li>
        ))}
      </ul>
    </div>
  );
}
