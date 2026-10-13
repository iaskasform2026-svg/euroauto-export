import { createRequestAction } from "@/app/actions/requests";
import { RequestForm } from "@/components/RequestForm";

export default function NewRequestPage() {
  return (
    <div>
      <h1 className="font-display text-3xl">Nouvelle demande</h1>
      <p className="mt-2 mb-6 text-sm text-navy-700">Vous pourrez modifier vos critères et suivre l’avancement.</p>
      <div className="card">
        <RequestForm action={createRequestAction} />
      </div>
    </div>
  );
}
