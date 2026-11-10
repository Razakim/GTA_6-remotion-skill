# Assets GTA VI

Les images téléchargées depuis les galeries GTA VI sont rangées dans l’arborescence fonctionnelle :

- `characters/<personnage>/screenshots/` et `characters/shared/screenshots/`
- `gangs/<groupe>/screenshots/`
- `vehicles/<type>/<modèle>/`
- `weapons/<type>/`
- `map/regions/<lieu>/screenshots/`
- `scenes/` et `editorials/` pour les images sans destination plus précise

Chaque fichier image n’existe qu’à un seul endroit. Le catalogue [catalog/gta6-screenshots.json](catalog/gta6-screenshots.json) permet de le retrouver par tous ses sujets et catégories, avec son URL source, son empreinte SHA-256 et sa taille. Les chemins du catalogue sont relatifs à `assets/`. Les index `by_category` et `by_subject` couvrent les images à sujets multiples. `metadata_status` distingue les sujets vérifiés visuellement, inférés du nom ou indexés sous leur série/source lorsque le personnage n’est pas identifié avec certitude.

Les URLs d’origine sont dans `sources/gta6-screenshots.txt`. Pour importer de nouvelles captures, lancer `python3 scripts/archive_gta6_assets.py` depuis le projet après les avoir placées dans `public/assets/_incoming/gta6/`. Le script de téléchargement `gta6.py` le fait automatiquement.
