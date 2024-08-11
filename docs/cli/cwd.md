# Commande `cwd`

La commande `cwd` permet d'analyser le projet situé dans le répertoire courant en utilisant les stratégies définies dans l'outil.

## Syntaxe

```bash
nsecure cwd [options]
```
## Options

- **`-n, --nolock`** : Ne pas utiliser de fichier lock (`package-lock.json` ou `yarn.lock`) pour l'analyse. Par défaut : `false`.
- **`-f, --full`** : Effectuer une analyse complète du projet, y compris toutes les dépendances. Par défaut : `false`.
- **`-d, --depth <niveau>`** : Spécifie la profondeur d'analyse des dépendances. Par défaut : `4`.
- **`--silent`** : Supprime les sorties console, rendant l'exécution silencieuse. Par défaut : `false`.
- **`-o, --output <chemin>`** : Spécifie le fichier de sortie pour les résultats. Par défaut : `nsecure-result`.
- **`-s, --vulnerabilityStrategy <stratégie>`** : Définir la stratégie de vulnérabilité à utiliser. Par défaut : `NPM_AUDIT`.


## Description

La commande `cwd` scanne les dépendances du projet situé dans le répertoire courant en utilisant les options spécifiées pour détecter les vulnérabilités potentielles. Cette commande est utile pour évaluer la sécurité d'un projet Node.js en analysant les packages installés localement dans le répertoire de travail actuel.
