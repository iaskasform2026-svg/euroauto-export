# EuropAuto — JavaScript / React

Plateforme automobile avec trois espaces : client, fournisseurs et rapprochement. L’application et ses API utilisent JavaScript/JSX ; le socle Vinext/Sites conserve ses fichiers TypeScript. Les données sont conservées en base D1.

## Fonctionnement

- Connexion via ChatGPT et profil client (nom et téléphone).
- Plusieurs choix par client : marque, modèle, moteur, année et prix proposé.
- Modification d’une commande avec contrôle de propriété. Les anciennes propositions sont retirées atomiquement après modification.
- Portail des sources européennes et base de concessionnaires.
- Recherche web via votre instance SearXNG, sans clé Brave.
- Jusqu’à 10 annonces distinctes sur mobile.de, AutoScout24 France, La Centrale et leboncoin, dans l’ordre retourné par le moteur.
- Prix vendeur dans l’administration ; prix proposé au client saisi séparément, puis publication par case à cocher.
- Le client reçoit uniquement le prix proposé ; coordonnées fournisseur et lien original restent dans l’administration.

## Activer la recherche sans clé

Le moteur SearXNG doit être installé sur un serveur séparé. Les fichiers et instructions se trouvent dans [`deployment/searxng/README.md`](deployment/searxng/README.md).

Dans Rapprochement, cliquer **Configurer SearXNG**, saisir l’URL HTTPS de votre instance et utiliser **Tester et enregistrer**. La plateforme vérifie une réponse JSON avant de sauvegarder l’URL en base. Il est également possible de déclarer `SEARXNG_URL` dans l’environnement serveur ; la valeur enregistrée dans l’administration prend priorité.

Aucune clé de recherche API n’est nécessaire. Aucun serveur SearXNG n’a été créé ni raccordé à la version publiée à ce stade. Docker n’est pas disponible dans l’environnement de création ; les fichiers d’hébergement sont préparés, leur démarrage n’a pas été testé. Le site s’exécute sur Cloudflare Workers et ne peut pas héberger lui-même le service Python/Docker.

La recherche limite les domaines et les chemins aux annonces, supprime les doublons et conserve les dix premières. Elle peut afficher moins de dix résultats. Une annonce candidate doit être vérifiée et ajoutée au catalogue avant de publier un prix proposé. Le classement d’un moteur ne garantit pas à lui seul la motorisation, l’année, la disponibilité ou tous les autres critères.

Les prix EUR proviennent des offres structurées JSON-LD des pages accessibles. Les prix absents restent À vérifier ; aucun budget ou extrait n’est utilisé pour inventer un prix. Les erreurs des moteurs et pages inaccessibles sont signalées. Aucune instance publique tierce n’est utilisée automatiquement comme solution de secours.

## Catalogue et flux fournisseurs

Le bouton secondaire **Catalogue / flux** interroge séparément les véhicules enregistrés et les flux JSON HTTPS renseignés sur les fournisseurs. Format du flux : une liste JSON ou un objet `vehicles`.

```json
{"vehicles":[{"brand":"Peugeot","model":"308","engine":"1.6 HDi","year":2015,"price":7999.95,"currency":"EUR","km":120000,"url":"https://concessionnaire.example/annonce-308"}]}
```

Cet exemple décrit le format et n’est pas une annonce réelle. `price` et `km` doivent être numériques ; la devise doit être EUR. Les données incomplètes sont ignorées. Huit flux au maximum par recherche, 2 Mo et 1 000 véhicules par flux ; redirections non suivies. Les sources défaillantes sont exclues des résultats de cette recherche. Un flux complet remplace le stock importé de la même source.

Le rapprochement du catalogue exige les quatre critères exacts (insensibles à la casse et aux espaces en début/fin) et un prix vendeur inférieur ou égal au budget. Après vérification, le prix proposé au client peut être enregistré et publié s’il est positif.

## Accès

Le site est privé pour son propriétaire. Le premier compte authentifié est enregistré comme administrateur ; les autres comptes ne peuvent accéder qu’à leurs commandes et propositions publiées. Ouvrir d’abord avec le propriétaire avant d’étendre l’accès. Avant une ouverture publique, remplacer cet amorçage par une attribution explicite du rôle administrateur.

## Fichiers principaux

- `app/portal.jsx` : interface et formulaires.
- `app/api/data/route.js` : commandes, fournisseurs, véhicules et prix proposés.
- `app/api/search/route.js` : recherche SearXNG administrative.
- `app/api/search-settings/route.js` : test de connexion et enregistrement de l’URL.
- `app/web-search.js` : adaptation SearXNG, filtrage et lecture des annonces.
- `app/api/catalog-search/route.js` : catalogue et flux JSON.
- `app/matching.js` : règles de rapprochement.
- `db/schema.js` et `drizzle/` : tables et migrations.
- `deployment/searxng/` : hébergement Docker séparé.

## Validation

Compilation de production et tests des critères, prix exacts, isolation client, modification atomique, limite de dix annonces, ordre, déduplication, domaines autorisés, connexion SearXNG et erreurs de JSON. Les tests réseau utilisent des réponses de test. Aucun test navigateur ni recherche de bout en bout sur une instance SearXNG réelle n’a été réalisé.
