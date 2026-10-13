# EuropAuto Export

Plateforme web (français, responsive) de recherche et de vente de véhicules européens destinés à l’exportation.

Trois espaces :

- **Site public** — présentation, inscription, vérification d’e-mail, mentions
- **Espace client** — demandes, propositions, workflow, documents, RDV, messagerie, paiement
- **Administration** — import d’annonces, matching, propositions, journal fournisseurs, audit

## Démarrage

```bash
cd europauto-export
copy .env.example .env   # déjà présent en démo
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Ouvrez http://localhost:3000

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Client | `client@demo.europauto.local` | `DemoClient123!` |
| Autre client (isolation) | `autre.client@demo.europauto.local` | `DemoClient123!` |
| Commercial | `commercial@demo.europauto.local` | `DemoCom123!` |
| Admin | `admin@demo.europauto.local` | `DemoAdmin123!` |

Toutes les données sont marquées **[DÉMO]**. Aucune annonce réelle n’est inventée.

## Règle de prix

`prix proposé = prix vendeur × 1,25`

Exemple : 10 000 € → majoration 2 500 € → **12 500 €** (frais à part).

Les frais (transport, inspection, démarches, taxes, assurance) sont listés séparément, **confirmés** ou **à vérifier**.

## Contrôles de sécurité de cette version

- Un client ne voit que ses dossiers (`notFound` sinon).
- L’espace client n’expose pas e-mail / téléphone / adresse vendeur, lien original, notes internes.
- Les descriptions sont filtrées (e-mails, téléphones, URL).
- Le contact affiché au client est celui de la **plateforme**.
- Un paiement n’est passé à « payé » que par **webhook Stripe vérifié**. Aucun bouton admin « marquer payé ».
- L’acceptation d’une proposition déclenche la **vérification vendeur**, pas une vente définitive.
- Confirmation vendeur bloquée sans **preuve** + conditions. Un changement de prix exige une nouvelle acceptation.
- Un e-mail n’est marqué envoyé que si l’envoi réel a lieu (SMTP) ou si un opérateur journalise un envoi manuel.
- Un rendez-vous n’est `CONFIRME` que lorsque tous les participants ont accepté.
- Rôles : ADMIN, COMMERCIAL, GESTIONNAIRE, CLIENT — permissions côté serveur.
- Pas de stockage de données de carte.

## Schéma de base

Fichier : `prisma/schema.prisma` (SQLite par défaut, `DATABASE_URL`).

Tables principales : `User`, `Consent`, `VehicleRequest`, `Vendor`, `Vehicle`, `Proposal`, `ExtraFee`, `SaleCase`, `StatusHistory`, `ChecklistItem`, `RegulatoryRule`, `ContactLog`, `CallReport`, `Document`, `Appointment`, `Payment`, `Message`, `Notification`, `AuditLog`, `PlatformSettings`.

Pour PostgreSQL : changez le provider Prisma et `DATABASE_URL`.

## Paiement test (Stripe)

1. Clés **test** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
2. Webhook local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Le rôle commercial et `contractsEnabled` doivent être validés avant tout contrat réel.

Sans clés Stripe, le paiement affiche un message d’indisponibilité — le statut payé ne peut pas être forcé.

## Intégrations

Voir `INTEGRATIONS.md`. Opérationnelles : import manuel / CSV. AutoScout24, Mobile.de, Leboncoin : partenariat ou import manuel, **pas de contournement**.

## Avant les intégrations réelles

Il ne sera demandé que :

- nom et coordonnées de la plateforme
- pays européens ciblés
- pays de destination
- rôle commercial (intermédiaire / mandataire / revendeur)
- devise
- prestataire de paiement
- sources d’annonces souhaitées

## Conservation et sauvegardes

- Journal d’audit (`/admin/audit`)
- Fichier SQLite `prisma/dev.db` à sauvegarder régulièrement
- Documents internes (`visibility=INTERNE`) inaccessibles au client
