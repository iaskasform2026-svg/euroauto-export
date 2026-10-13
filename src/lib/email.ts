export type MailPayload = { to: string; subject: string; text: string };

export async function sendMail(payload: MailPayload): Promise<{ sent: boolean; reason?: string }> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    return { sent: false, reason: "SMTP non configuré : aucun e-mail n’a été envoyé." };
  }
  return {
    sent: false,
    reason: "Connecteur SMTP présent mais non activé dans cette version : aucun envoi réel.",
  };
}

export function vendorAvailabilityTemplate(opts: {
  platformName: string;
  vehicleLabel: string;
  sellerPrice: number;
  currency: string;
}) {
  return {
    subject: `[${opts.platformName}] Disponibilité et conditions — ${opts.vehicleLabel}`,
    body: `Bonjour,

Nous représentons un client intéressé par le véhicule suivant : ${opts.vehicleLabel}, au prix annoncé de ${opts.sellerPrice} ${opts.currency}.

Pouvez-vous confirmer :
1. la disponibilité actuelle du véhicule ;
2. le prix final et les éventuelles conditions de réservation ;
3. les documents en votre possession (carte grise, contrôle technique, factures d’entretien, certificat de conformité) ;
4. la possibilité d’une exportation hors du pays d’immatriculation.

Merci de répondre à cet e-mail. Cet envoi n’est effectué qu’après validation humaine.

Cordialement,
${opts.platformName}`,
  };
}

export function phoneScript(opts: { vehicleLabel: string; sellerPrice: number; currency: string }) {
  return `Script d’appel (à adapter, ne pas cocher « appelé » sans appel réel)

1. Se présenter au nom de la plateforme, pas au nom du client.
2. Identifier le véhicule : ${opts.vehicleLabel}.
3. Demander la disponibilité aujourd’hui.
4. Confirmer le prix : ${opts.sellerPrice} ${opts.currency} — noter toute modification.
5. Documents : CG, CT, historique, garantie, certificat de conformité.
6. Export possible ? Délai d’enlèvement ?
7. Conditions de réservation / acompte vendeur.
8. Recueillir un accord écrit (e-mail) comme preuve avant de confirmer le dossier.`;
}
