# EuropAuto — JavaScript / React

Plateforme avec espace client, portail fournisseurs et rapprochement. Application/API JavaScript et JSX, base D1, socle Vinext/Sites.

## Recherche dans les flux fournisseurs publics

Le bouton principal **Rechercher dans les flux** télécharge les stocks JSON ou CSV des fournisseurs configurés, importe les véhicules et affiche les dix premières correspondances par prix vendeur croissant. Aucun serveur SearXNG ni clé d’API n’est nécessaire. Il faut des URL de stocks publics accessibles en HTTPS ; une page d’annonce ou de comparateur n’est pas un flux.

1. Ouvrir **Fournisseurs**.
2. Ajouter un fournisseur ou utiliser **Modifier** sur sa ligne.
3. Renseigner **URL du flux public JSON ou CSV** avec une URL fournie par ce professionnel.
4. Dans **Rapprochement**, choisir une demande, puis cliquer **Rechercher dans les flux**.
5. Saisir le prix proposé au client et cocher la publication.

Aucun flux réel n’a été fourni ou connecté lors de la création. Sans URL configurée, le résultat indique explicitement l’absence de flux et reste vide. Le catalogue manuel n’est pas présenté comme une recherche de flux. Le bouton secondaire **Catalogue enregistré** consulte séparément les données déjà enregistrées et signale que les prix peuvent dater de leur dernière importation.

Chaque critère renseigné sur la commande est comparé à la donnée correspondante de la fiche : marque, modèle et moteur (égalité après suppression des espaces de bord et de la casse), année minimum et/ou maximum inclusives, prix minimum et/ou maximum inclusifs. Chaque champ vide est ignoré. Une donnée absente de la fiche ne satisfait pas un critère renseigné, mais n’exclut pas le véhicule si ce critère est vide sur la commande. Tous les champs de recherche peuvent rester vides ; dans ce cas les dix premiers véhicules exploitables sont retournés. Les commentaires sont conservés comme texte libre, sans servir de filtre.

L’année minimum et l’année maximum sont indépendamment facultatives et inclusives. Une seule borne filtre uniquement dans ce sens ; deux bornes vides ignorent l’année. Une fourchette inversée est refusée. Les anciennes commandes avec une année unique sont interprétées comme minimum = maximum = cette année. Le prix minimum et le prix maximum sont également indépendamment facultatifs. Les limites invalides ou inversées sont refusées. Les anciennes commandes conservent leur ancien budget comme maximum ; retirer ce maximum dans la modification supprime cette contrainte. Le nombre de critères affiché dans le rapprochement reflète uniquement les champs effectivement renseignés.

Les doublons d’URL d’annonce sont supprimés par commande. Dix lignes maximum sont retournées, avec le nombre total de correspondances.

## Formats de stock

JSON : une liste ou un objet `vehicles`, avec les champs ci-dessous.

```json
{"vehicles":[{"brand":"Peugeot","model":"308","engine":"1.6 HDi","year":2015,"price":7999.95,"currency":"EUR","km":120000,"url":"https://concessionnaire.example/annonce-308"}]}
```

Cet exemple décrit le format ; ce n’est pas une annonce réelle. Les valeurs numériques JSON doivent être des nombres. Seuls les prix EUR sont pris en charge ; les stocks fournis doivent être en euros. Aucune conversion ou estimation de prix n’est faite.

CSV : séparateur virgule ou point-virgule, champs entre guillemets pris en charge. Colonnes obligatoires : `brand,model,price,url`. Les colonnes `engine,year,km` sont facultatives et leurs valeurs absentes restent inconnues. Colonne `currency` facultative, valeur `EUR`. Les noms français `marque,modèle,moteur,année,prix,kilométrage,lien,devise` sont également acceptés. Les prix à virgule décimale sont acceptés, notamment avec le séparateur point-virgule.

```csv
marque;modèle;moteur;année;prix;kilométrage;lien;devise
Peugeot;308;1.6 HDi;2015;7999,95;120000;https://concessionnaire.example/annonce-308;EUR
```

Limites : huit flux par recherche, 2 Mo et 1 000 véhicules par flux ; redirections non suivies. Les téléchargements sont parallèles, puis chaque stock est remplacé dans une transaction indépendante. Un stock vide valide retire les anciennes annonces de cette source. Un flux complètement invalide ou inaccessible conserve les anciennes données en base mais les exclut des résultats de la recherche en cours. Les lignes partiellement invalides sont ignorées et comptées dans le rapport. Aucun prix n’est inventé pour une donnée manquante.

## Commandes et publication

Les clients enregistrent plusieurs choix de véhicule, puis peuvent modifier chaque commande. L’API contrôle la propriété de la commande ; une modification conserve son identifiant et retire atomiquement les propositions précédentes.

Le prix vendeur est affiché dans l’administration et le prix proposé est saisi séparément. La case Publier exige un prix proposé positif. Le client reçoit uniquement le prix proposé, sans prix vendeur, coordonnées fournisseur ni lien original. Sa colonne Propositions est vide tant qu’aucune ligne n’est publiée.

Changer ou retirer l’URL d’un flux fournisseur retire ses anciennes annonces importées pour ne pas présenter une ancienne source comme le nouveau stock.

## Accès et fichiers

Le site reste privé pour son propriétaire. Le premier compte authentifié est administrateur ; avant toute ouverture publique, remplacer cet amorçage par une attribution explicite des rôles.

- `app/portal.jsx` : interfaces et modification fournisseurs/commandes.
- `app/api/search/route.js` : actualisation des flux et rapprochement.
- `app/api/catalog-search/route.js` : catalogue enregistré.
- `app/feed-search.js` et `app/inventory.js` : import JSON/CSV et classement.
- `app/api/data/route.js` : données, contrôles d’accès et publication.
- `db/schema.js` et `drizzle/` : données et migrations.

L’ancienne route de configuration SearXNG est désactivée. Ses fichiers d’installation restent dans le projet à titre d’archive et ne sont pas nécessaires au parcours actuel.

## Validation

Compilation de production ; tests d’import JSON/CSV, prix décimaux, limite de dix, classement, doublons, source invalide/indisponible, absence de flux sans faux retour au catalogue, et accès administrateur. Les tests réseau utilisent des réponses de test. Aucun flux fournisseur réel ni test navigateur n’a été vérifié de bout en bout.
