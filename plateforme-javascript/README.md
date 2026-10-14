# EuropAuto — JavaScript / React

Plateforme de sourcing automobile à trois espaces. Le code de l'application est en JavaScript (.js et .jsx), avec CSS pour la présentation. Vinext assure le serveur React et les API ; D1 conserve les données.

## Parcours

1. Connexion via ChatGPT, puis inscription (nom et téléphone).
2. Plusieurs choix de véhicule avec marque, modèle, motorisation exacte, année et prix proposé.
3. Portail administratif de sources européennes ; ajout manuel de concessionnaires et véhicules.
4. Recherches externes ciblées par demande et rapprochement du catalogue enregistré.
5. Prix vendeur visible dans le rapprochement ; saisie séparée du prix proposé au client. Ce dernier montant est le seul transmis à l’espace client.
6. Bouton Modifier sur chaque commande : mise à jour des critères et retrait atomique des anciennes propositions.
7. Bouton Rechercher : rapprochement du catalogue et import des flux JSON fournisseurs connectés, avec rapport des erreurs et horodatage.
8. Case à cocher pour publier ou retirer chaque proposition. La colonne client est vide tant qu'aucune proposition n'est publiée.

Le rapprochement impose les quatre critères exacts (insensibles à la casse et aux espaces en début/fin) et un prix inférieur ou égal au budget. Les portails de petites annonces ne sont pas collectés automatiquement. Chaque fournisseur peut renseigner un flux de stock JSON HTTPS public. Le bouton Rechercher lit ces flux et importe les véhicules et leurs prix vendeur, sans calcul ni majoration. Sans flux connecté, seule la base enregistrée est consultée et l’interface le signale. Les flux défaillants sont exclus des résultats de la recherche. Un flux complet remplace le stock importé de la même source.

## Accès

Le site est publié en privé pour son propriétaire. Le premier compte authentifié qui ouvre l'API est enregistré comme administrateur ; les autres comptes ont un rôle client et voient seulement leurs demandes et les propositions publiées pour eux. Ouvrir une première fois avec le compte propriétaire avant toute extension d'accès. Ne pas rendre le site public sans remplacer cet amorçage par une attribution explicite des rôles administrateurs.

## Fichiers

- app/portal.jsx : interface et formulaires
- app/api/data/route.js : API, validation et contrôle d'accès
- app/matching.js : règles de rapprochement
- app/chatgpt-auth.js : connexion
- db/schema.js : tables
- drizzle/ : migrations

## Vérification

La compilation de production a été validée. Les règles de rapprochement ont été vérifiées sur un cas positif et cinq cas négatifs. Aucun test de navigateur ni test de connexion réelle n'a été effectué dans cet environnement.

## Flux fournisseur et prix

Dans Fournisseurs, ajoutez un professionnel avec le champ « Flux de stock JSON ». La réponse du flux doit être une liste JSON ou un objet contenant `vehicles`. Format :

```json
{"vehicles":[{"brand":"Peugeot","model":"308","engine":"1.6 HDi","year":2015,"price":7999.95,"currency":"EUR","km":120000,"url":"https://concessionnaire.example/annonce-308"}]}
```

L'exemple décrit le format et n'est pas une annonce réelle. `price` et `km` doivent être numériques, la devise EUR, les critères renseignés et le lien une URL HTTPS publique. Les lignes incomplètes sont ignorées, jamais complétées par des prix estimés. Huit sources maximum sont consultées par recherche ; limite de 2 Mo et 1 000 véhicules par flux. Redirections non suivies. Le prix fournisseur n’est pas garanti à jour : contrôler le stock et le prix avec le vendeur.

Le prix proposé au client est saisi manuellement dans la ligne de rapprochement et sauvegardé. La case Publier n’est activable qu’avec un montant positif. L’API client ne transmet ni le prix vendeur, ni le contact fournisseur, ni le lien original.

La modification d'une commande conserve son identifiant et sa date de création, puis retire les propositions précédentes dans la même transaction. Un autre client ne peut pas modifier cette commande.

## Recherche Internet : 10 premières annonces

Le bouton principal « Rechercher sur les sites » utilise une API Brave Search côté serveur avec les critères d’une commande et une restriction à mobile.de, AutoScout24 France, La Centrale et leboncoin. Configurez le secret runtime `BRAVE_SEARCH_API_KEY` avec une clé valide de https://api-dashboard.search.brave.com/ ; aucun secret ne doit être enregistré dans Git. Sans clé, une erreur explicite indique que la recherche web n’est pas activée. Aucun retour au catalogue n’est présenté comme une recherche Internet.

Le moteur demande jusqu’à 20 liens à l’API, conserve uniquement les annonces des quatre domaines, supprime les doublons et affiche les 10 premières dans l’ordre de pertinence. Il peut afficher moins de 10 liens si les sources n’en retournent pas assez. Les prix EUR proviennent des offres structurées JSON-LD de l’annonce lorsque la page est accessible. Aucun prix n’est déduit du budget ni inventé à partir d’un extrait. Si la page bloque l’accès ou ne publie pas de prix exploitable, « À vérifier » est affiché.

Ces résultats sont des annonces candidates : un résultat du moteur ne garantit pas tous les critères ni la disponibilité. « Vérifier l’annonce » permet de confirmer les données réelles et de l’ajouter au catalogue. Le prix proposé peut ensuite être enregistré et publié au client par la case à cocher. Le prix vendeur et les liens originaux restent dans l’administration.

« Catalogue / flux » conserve le rapprochement de la base et des flux JSON comme une action secondaire explicitement distincte. La recherche Internet et les prix sur des sites réels ne sont pas vérifiés de bout en bout tant qu’une clé API valide n’est pas connectée ; les contrats et cas d’échec sont testés avec des réponses de test.
