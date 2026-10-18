# Héberger la recherche SearXNG sans clé API

Ce service s’installe sur votre serveur Docker. Le site EuropAuto reste hébergé séparément : son environnement Cloudflare Workers ne lance pas de conteneur Python/Docker. Aucune instance SearXNG n’a encore été déployée par ce projet.

## Installation sur un VPS Linux

Préparer un serveur avec Docker Compose et Node.js, un sous-domaine pointant sur ce serveur et les ports 80/443 ouverts pour HTTPS.

```bash
cd plateforme-javascript/deployment/searxng
node setup.mjs
```

Modifier `SEARXNG_DOMAIN` dans le fichier `.env` créé, puis lancer :

```bash
docker compose config --quiet
docker compose up -d
```

Caddy termine HTTPS et transmet les requêtes à SearXNG sur le réseau Docker. L’application SearXNG n’expose pas directement son port 8080. Le secret de session est généré localement et ignoré par Git : il n’est pas une clé d’API commerciale et ne doit pas être committé.

## Connecter EuropAuto

1. Dans Rapprochement, cliquer sur **Configurer SearXNG**.
2. Saisir `https://votre-sous-domaine`.
3. Cliquer **Tester et enregistrer**. Le serveur vérifie la réponse JSON avant de sauvegarder l’adresse.
4. Sélectionner une commande et lancer **Rechercher sur les sites**.

La recherche accepte jusqu’à 10 annonces distinctes sur les quatre domaines autorisés, dans l’ordre retourné par SearXNG. Les prix manquants restent à vérifier. Le bouton Catalogue / flux reste indépendant.

## Exploitation

```bash
docker compose ps
docker compose logs --tail 100 engine
docker compose pull
docker compose up -d
```

Le tag `latest` suit l’image officielle. Pour un serveur de production, choisir une version testée dans `SEARXNG_VERSION` et vérifier les changements avant chaque mise à jour. Sauvegarder `.env` de façon privée ; ne pas partager son contenu.

Cette configuration simple rend la recherche accessible par HTTPS et désactive le limiteur applicatif SearXNG pour permettre les appels JSON du site. Sur un serveur exposé, configurer des limites au niveau du reverse proxy ou une politique d’accès adaptée. Les instances publiques tierces ne sont pas utilisées comme service de secours automatique.

L’absence de clé ne garantit ni disponibilité des moteurs amont ni autorisation de collecter toutes les annonces. Les erreurs des moteurs, pages bloquées et prix non récupérables sont signalés.

Documentation officielle : https://docs.searxng.org/admin/installation-docker.html et https://docs.searxng.org/dev/search_api.html.
