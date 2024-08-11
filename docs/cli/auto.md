# Commande `auto`

La commande `auto` permet d'automatiser le scan d'un package ou du projet courant avec des options spécifiques.

## Syntaxe

```bash
nsecure auto [package] [options]
```

## Options

- **`-k, --keep`** : Conserver les fichiers temporaires après l'exécution. Par défaut : `false`.

## Description

La commande `auto` permet d'automatiser le scan d'un package ou du projet courant avec des options spécifiques. Cette commande exécute une analyse automatique en combinant les commandes `cwd` et `from`, et peut ensuite ouvrir les résultats dans un serveur HTTP. Elle est utile pour effectuer une analyse rapide et complète en une seule commande.
