import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRequestAction } from "@/app/actions/requests";
import { RequestForm } from "@/components/RequestForm";
import { StatusBadge } from "@/components/StatusBadge";

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;
  const request = await prisma.vehicleRequest.findUnique({ where: { id } });
  if (!request) notFound();
  if (session.role === "CLIENT" && request.clientId !== session.id) notFound();

  async function save(formData: FormData) {
    "use server";
    await updateRequestAction(id, formData);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-3xl">Demande</h1>
        <StatusBadge status={request.status} />
      </div>
      <div className="card">
      </div>
    </div>
  );
}
