"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => loginAction(formData),
    null,
  );
  return (
    <form action={action} className="card mt-6 space-y-3">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label">E-mail</label>
        <input className="input" name="email" type="email" required defaultValue="client@demo.europauto.local" />
      </div>
      <div>
        <label className="label">Mot de passe</label>
        <input className="input" name="password" type="password" required defaultValue="DemoClient123!" />
      </div>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button className="btn-primary w-full">Se connecter</button>
    </form>
  );
}
