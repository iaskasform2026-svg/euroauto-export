export const MAIN_STATUSES = [
  "DEMANDE_ENREGISTREE",
  "RECHERCHE_EN_COURS",
  "VEHICULES_SELECTIONNES",
  "PROPOSITION_ENVOYEE",
  "INTERET_CLIENT_CONFIRME",
  "VERIFICATION_VENDEUR",
  "OFFRE_FINALE_VALIDEE",
  "PAIEMENT",
  "RDV_ENLEVEMENT",
  "FORMALITES_EXPORT",
  "TRANSPORT",
  "LIVRAISON",
  "CLOTURE",
] as const;

export const EXCEPTION_STATUSES = [
  "VEHICULE_INDISPONIBLE",
  "REFUS_VENDEUR",
  "CHANGEMENT_PRIX",
  "PAIEMENT_ECHOUE",
  "SUSPENDU",
  "ANNULE",
  "REMBOURSE",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DEMANDE_ENREGISTREE: "Demande enregistrée",
  RECHERCHE_EN_COURS: "Recherche en cours",
  VEHICULES_SELECTIONNES: "Véhicules sélectionnés",
  PROPOSITION_ENVOYEE: "Proposition envoyée",
  INTERET_CLIENT_CONFIRME: "Intérêt du client confirmé",
  VERIFICATION_VENDEUR: "Vérification et confirmation du vendeur",
  OFFRE_FINALE_VALIDEE: "Offre finale validée par le client",
  PAIEMENT: "Paiement",
  RDV_ENLEVEMENT: "Rendez-vous et enlèvement",
  FORMALITES_EXPORT: "Formalités d’exportation",
  TRANSPORT: "Transport",
  LIVRAISON: "Livraison",
  CLOTURE: "Dossier clôturé",
  VEHICULE_INDISPONIBLE: "Véhicule indisponible",
  REFUS_VENDEUR: "Refus du vendeur",
  CHANGEMENT_PRIX: "Changement de prix",
  PAIEMENT_ECHOUE: "Paiement échoué",
  SUSPENDU: "Dossier suspendu",
  ANNULE: "Annulation",
  REMBOURSE: "Remboursement",
};

export const CLIENT_NEXT_ACTION: Record<string, string> = {
  DEMANDE_ENREGISTREE: "Aucune action : la plateforme démarre la recherche.",
  RECHERCHE_EN_COURS: "Attendez la sélection de véhicules par nos équipes.",
  VEHICULES_SELECTIONNES: "Attendez l’envoi de la proposition commerciale.",
  PROPOSITION_ENVOYEE: "Examinez la proposition : accepter, refuser, poser une question ou demander une alternative.",
  INTERET_CLIENT_CONFIRME: "Ce n’est pas une vente définitive. La plateforme vérifie le vendeur.",
  VERIFICATION_VENDEUR: "Attendez la confirmation du vendeur et des conditions.",
  OFFRE_FINALE_VALIDEE: "Procédez au paiement sécurisé lorsque le récapitulatif est disponible.",
  PAIEMENT: "Finalisez le paiement (acompte puis solde si applicable).",
  RDV_ENLEVEMENT: "Confirmez votre disponibilité pour l’inspection ou l’enlèvement.",
  FORMALITES_EXPORT: "Déposez les documents demandés dans votre espace.",
  TRANSPORT: "Suivez le transport ; aucune action urgente sauf notification.",
  LIVRAISON: "Contrôlez le véhicule à la réception à l’aide de la checklist.",
  CLOTURE: "Dossier terminé. Conservez vos documents.",
  VEHICULE_INDISPONIBLE: "Attendez une alternative ou contactez-nous.",
  REFUS_VENDEUR: "Attendez une alternative.",
  CHANGEMENT_PRIX: "Examinez la nouvelle offre avant toute acceptation.",
  PAIEMENT_ECHOUE: "Vérifiez le moyen de paiement et réessayez.",
  SUSPENDU: "Le dossier est en pause. Consultez les messages.",
  ANNULE: "Dossier annulé.",
  REMBOURSE: "Remboursement enregistré selon le prestataire de paiement.",
};

export const PLATFORM_ACTION: Record<string, string> = {
  DEMANDE_ENREGISTREE: "Lancer la recherche et qualifier la demande.",
  RECHERCHE_EN_COURS: "Importer ou rapprocher des annonces, noter les écarts.",
  VEHICULES_SELECTIONNES: "Valider les véhicules et préparer la proposition.",
  PROPOSITION_ENVOYEE: "Répondre aux questions du client.",
  INTERET_CLIENT_CONFIRME: "Contacter le vendeur (e-mail / appel) et collecter une preuve.",
  VERIFICATION_VENDEUR: "Enregistrer la preuve vendeur avant de confirmer.",
  OFFRE_FINALE_VALIDEE: "Ouvrir le paiement (Stripe test) sans forcer le statut.",
  PAIEMENT: "Suivre les webhooks Stripe uniquement.",
  RDV_ENLEVEMENT: "Proposer un créneau ; ne confirmer qu’après accord des participants.",
  FORMALITES_EXPORT: "Avancer la checklist selon les règles sourcées.",
  TRANSPORT: "Mettre à jour le suivi et les coûts confirmés.",
  LIVRAISON: "Accompagner la réception.",
  CLOTURE: "Archiver selon la politique de conservation.",
};

export function isException(status: string) {
  return EXCEPTION_STATUSES.includes(status as (typeof EXCEPTION_STATUSES)[number]);
}
