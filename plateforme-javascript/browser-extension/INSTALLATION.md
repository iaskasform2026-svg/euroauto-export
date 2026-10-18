# Assistant navigateur EuropAuto 1.0.0

1. Décompressez le ZIP dans un dossier que vous conserverez.
2. Dans Chrome, ouvrez chrome://extensions (Edge : edge://extensions).
3. Activez le mode développeur puis « Charger l’extension non empaquetée ».
4. Sélectionnez le dossier qui contient manifest.json.
5. Rechargez EuropAuto, ouvrez « Analyser du HTML », saisissez l’URL de la liste puis cliquez « Ouvrir, copier et analyser ».

La collecte est déclenchée uniquement par ce bouton. Un nouvel onglet visible est ouvert, puis le HTML rendu revient dans la zone et remplit le tableau. L’onglet source reste ouvert pour vérification. Seule la page demandée est lue, sans pagination automatique.

Version initiale : listes publiques Auto Export Marseille /annonces/ et /annonces/page/N/. Les sites nécessitant un autre connecteur, dont leboncoin, restent en import manuel. Aucun contournement des blocages, connexion automatique, saisie de mot de passe ou résolution de CAPTCHA.

Les permissions permettent une lecture du DOM uniquement sur Auto Export Marseille. Le pont est limité à https://europauto-portail.sharprain32.chatgpt.site. Aucun accès aux cookies, mots de passe ou stockage du navigateur, aucun service IA externe, aucune collecte en arrière-plan et aucun enregistrement au catalogue. Le HTML est transmis à l’onglet EuropAuto pour analyse locale et n’est pas envoyé à son API.

L’extension est fournie en code source, non publiée dans un magasin. Vérification : syntaxe, protocole et restrictions d’URL testés ; installation réelle et parcours Chrome/Edge non encore vérifiés. La compatibilité peut évoluer si le site source modifie sa structure.
