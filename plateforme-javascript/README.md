# EuropAuto — JavaScript / React

Plateforme avec espace client, portail fournisseurs et rapprochement. Application/API JavaScript et JSX, base D1, socle Vinext/Sites.

## Recherche dans les flux fournisseurs publics

Le bouton principal **Rechercher les fournisseurs** consulte les connecteurs de fiches publiques et les stocks JSON/CSV configurés, puis affiche les dix premières correspondances par prix vendeur croissant. Le connecteur Auto Export Marseille est ajouté à la première recherche ; les autres flux restent à configurer. Aucun serveur SearXNG ni clé d’API n’est nécessaire. Il faut des URL de stocks publics accessibles en HTTPS ; une page d’annonce ou de comparateur n’est pas un flux.

1. Ouvrir **Fournisseurs**.
2. Ajouter un fournisseur ou utiliser **Modifier** sur sa ligne.
3. Renseigner **URL du flux public JSON ou CSV** avec une URL fournie par ce professionnel.
4. Dans **Rapprochement**, choisir une demande, puis cliquer **Rechercher les fournisseurs**.
5. Saisir le prix proposé au client et cocher la publication.

Aucun flux JSON/CSV réel n’a été fourni. Auto Export Marseille est une source HTML distincte, prête à être consultée au premier clic de recherche. Un flux non configuré n’est jamais présenté comme un stock consulté. Le catalogue manuel n’est pas présenté comme une recherche de flux. Le bouton secondaire **Catalogue enregistré** consulte séparément les données déjà enregistrées et signale que les prix peuvent dater de leur dernière importation.

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

## Connecteurs de fiches publiques

**Auto Export Marseille** est intégré comme source au premier clic Rechercher les fournisseurs. Le connecteur consulte l’accueil et le catalogue public, puis jusqu’à 16 fiches distinctes, avec trois lectures simultanées au maximum. Les rapports signalent les limites et les échecs : la lecture est partielle si davantage de fiches sont découvertes. Seuls les faits utiles sont conservés (marque, modèle, moteur lorsqu’explicite, année, prix, régime HT/TTC, disponibilité et URL), sans photos, descriptions commerciales ou textes complets. Le moteur peut être extrait d’une mention explicite du titre ; aucune valeur manquante n’est remplacée par un souhait client.

Les fiches marquées rupture, vendu, indisponible ou réservé sont exclues. Les prix de cette source sont HT lorsqu’annoncés comme tels. Le régime est affiché dans l’administration. Le régime du prix proposé au client est choisi séparément ; Non précisé n’est pas transformé en TTC. Les fourchettes comparent les montants affichés sans conversion de TVA.

**leboncoin** dispose d’un lecteur de données structurées publiques et d’un formulaire dans Fournisseurs → Importer une fiche leboncoin. Il est possible de coller manuellement le HTML de la fiche ouverte dans le navigateur. Seul le bloc correspondant à l’identifiant de l’annonce est lu ; les recommandations, contacts privés et messages ne sont pas importés. Le lecteur repose sur la présence d’un bloc JSON public contenant prix et attributs ; sans ce bloc, l’import échoue explicitement et l’ajout manuel des champs reste possible.

Une tentative de lecture directe vérifie robots.txt, n’emprunte aucune session connectée et s’arrête en cas d’interdiction ou HTTP 403. Le test réel a constaté que leboncoin refuse les accès automatisés et exige une permission spécifique. Aucune collecte automatique leboncoin n’est donc activée, aucun contournement, proxy ou usurpation de robot n’est utilisé. Une automatisation future exige un accès fourni/autorisé par leboncoin.

Les prix vendeur, liens originaux et détails de source restent dans l’administration. Le client voit uniquement le montant proposé et son régime explicitement choisi. Le catalogue enregistré permet de rapprocher les fiches importées manuellement.

Validation du connecteur AEM : huit fiches publiques réellement téléchargées, leurs champs analysés, dont une rupture exclue et sept fiches avec prix HT. Tests du scan limité et des échecs avec ces pages sauvegardées ; lecture directe depuis le Worker publié non vérifiée. leboncoin : refus réel HTTP 403 observé ; arrêt sur la politique robots et import HTML testés sur un exemple de structure, sans fiche leboncoin réelle accessible pour une validation de bout en bout. Vérifier avec le vendeur la disponibilité et le prix avant engagement.

## Assistant de collecte dans le navigateur

La page **Analyser du HTML** propose **Ouvrir, copier et analyser**. Elle dialogue avec l’extension Manifest V3 fournie dans `browser-extension/`. Le ZIP téléchargeable sur la page est `public/downloads/europauto-assistant-navigateur.zip` ; les instructions détaillées figurent dans `browser-extension/INSTALLATION.md`. Chrome/Edge : décompresser, ouvrir la gestion des extensions, activer le mode développeur, charger le dossier contenant manifest.json puis recharger EuropAuto.

L’extension ouvre un onglet visible sur une liste Auto Export Marseille `/annonces/` ou `/annonces/page/N/`, lit le DOM rendu et renvoie le HTML à l’onglet EuropAuto. Le HTML est placé dans la zone puis analysé immédiatement. L’onglet source reste ouvert et la capture est datée. Le pont est limité à l’origine exacte d’EuropAuto et aux messages de la page principale. Aucune session serveur, aucun cookie ou mot de passe n’est lu. Les champs de formulaires sont retirés du HTML retourné. Aucun ajout au catalogue et aucun envoi du HTML à l’API.

La collecte nécessite l’extension installée par l’utilisateur ; il ne s’agit pas d’un navigateur distant exécuté dans le Worker. Une seule page est collectée à chaque clic, sans parcours de pagination, connexion, résolution de CAPTCHA ou contournement d’un blocage. Les autres sources, dont leboncoin, restent en import manuel. L’extension vérifie la politique d’accès de la source et abandonne si aucune carte lisible n’est présente.

Validation : syntaxe JS, restrictions d’origine/URL, refus de domaines non autorisés, retour du HTML du fichier réel et focalisation de l’onglet initial avec API navigateur simulée. Le parcours réel d’installation et d’exécution Chrome/Edge n’a pas été vérifié. Aucun navigateur de test disponible dans cette session.
