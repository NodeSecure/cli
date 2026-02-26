/* eslint-disable @stylistic/max-len */

// Import Third-party Dependencies
import { taggedString as tS } from "@nodesecure/i18n";

const cli = {
  executing_at: "Exécution de node-secure à",
  min_nodejs_version: tS`node-secure nécessite au moins Node.js ${0} pour fonctionner ! Merci de mettre à jour votre version de Node.js.`,
  no_dep_to_proceed: "Aucune dépendance pour continuer !",
  successfully_written_json: tS`Ecriture du fichier de résultats réalisée avec succès ici : ${0}`,
  http_server_started: "Serveur HTTP démarré sur :",
  missingEnv: tS`La variable d'environnement ${0} est manquante!`,
  stat: tS`${0} ${1} en ${2}`,
  error: {
    name: tS`Nom ${0}: ${1}`,
    message: tS`Message: ${0}`,
    phase: tS`L'erreur s'est produite pendant la phase ${0}`,
    statusCode: tS`Code statut HTTP: ${0}`,
    executionTime: tS`L'erreur s'est produite à ${0} pendant l'exécution`,
    stack: tS`Stack: ${0}`
  },
  commands: {
    option_depth: "Niveau de profondeur de dépendances maximum à aller chercher",
    option_output: "Nom de sortie du fichier json",
    option_silent: "Activer le mode silencieux qui désactive les spinners du CLI",
    option_contacts: "Liste des contacts à mettre en évidence",
    option_verbose: "Définir le niveau de log CLI à verbeux, ce qui amènera la CLI à générer des logs plus détaillés.",
    strategy: "Source de vulnérabilités à utiliser",
    cwd: {
      desc: "Démarre une analyse de sécurité sur le dossier courant",
      option_nolock: "Désactive l'utilisation du package-lock.json",
      option_full: "Active l'analyse complète des packages présents dans le package-lock.json"
    },
    from: {
      desc: "Démarre une analyse de sécurité sur un package donné du registre npm",
      searching: tS`Recherche du manifest '${0}' dans le registre npm...`,
      fetched: tS`Manifest du package ${0} importé de npm en ${1}`
    },
    auto: {
      desc: "Démarre une analyse de sécurité sur le dossier courant ou sur un package donné et ouvre automatiquement l'interface web",
      option_keep: "Conserve le fichier nsecure-result.json sur le systeme après l'exécution"
    },
    open: {
      desc: "Démarre un serveur HTTP avec un fichier .json nsecure donné",
      option_port: "Port à utiliser",
      option_fresh_start: "Lance le serveur à partir de zéro, en ignorant tout fichier de payload existant",
      option_developer: "Lance le serveur en mode développeur, permettant le rafraîchissement automatique des composants HTML"
    },
    verify: {
      desc: "Démarre une analyse AST avancée pour un package npm donné",
      option_json: "Affiche le résultat d'analyse dans la sortie standard"
    },
    summary: {
      desc: "Afficher le résultat de votre analyse",
      warnings: "Menaces"
    },
    lang: {
      desc: "Configure le langage par défaut du CLI",
      question_text: "Quel langage souhaitez-vous utiliser ?",
      new_selection: tS`'${0}' a été selectionné comme étant le nouveau langage du CLI !`
    },
    scorecard: {
      desc: "Afficher la fiche de score OSSF du repo donné ou du repertoire actuel (Github uniquement ex. fastify/fastify)",
      option_vcs: "Logiciel de gestion de versions (GitHub, GitLab)"
    },
    report: {
      desc: "Générer un rapport à partir d'un package",
      option_includesAllDeps: "Inclure toutes les dépendances, true par défaut",
      option_theme: "Thème du rapport ('dark', 'light'), 'light' par défaut",
      option_title: "Titre du rapport",
      option_reporters: "Liste des reporters à utiliser 'html', 'pdf'"
    },
    config: {
      desc: "Modifier le fichier de configuration NodeSecure"
    },
    configCreate: {
      desc: "Initialiser le fichier de configuration Nodesecure",
      option_cwd: "Créer le fichier dans le dossier courant"
    },
    cache: {
      desc: "Gérer le cache de NodeSecure",
      missingAction: "Aucune action valide spécifiée. Utilisez --help pour voir les options.",
      option_list: "Lister les fichiers du cache",
      option_clear: "Nettoyer le cache",
      option_full: "Nettoyer ou lister le cache complet, y compris les payloads",
      cacheTitle: "Cache NodeSecure:",
      scannedPayloadsTitle: "Payloads scannés disponibles sur le disque:",
      cleared: "Cache nettoyé avec succès !"
    },
    extractIntegrity: {
      desc: "Extraire l'intégrité d'un paquet à partir de son manifeste et du tarball et comparer les deux intégrités si elles sont différentes.",
      missingSpecVersion: tS`Vous devez spécifier une version pour le package '${0}'.`,
      invalidSpec: tS`La spécification '${0}' est invalide.`,
      specNotFound: tS`La spécification '${0}' n'a pas pu être trouvée dans le registre npm.`
    }
  },
  startHttp: {
    invalidScannerVersion: tS`le fichier d'analyse correspond à la version '${0}' du scanner et ne satisfait pas la range '${1}' attendu par la CLI`,
    regenerate: "veuillez re-générer un nouveau fichier d'analyse JSON en utilisant votre CLI"
  }
};

const ui = {
  stats: {
    title: "Stats Globales",
    total_packages: "Total des packages",
    total_size: "Poids total",
    indirect_deps: "Packages avec dépendances indirectes",
    extensions: "Extensions",
    licenses: "Licences",
    maintainers: "Mainteneurs"
  },
  package_info: {
    navigation: {
      overview: "vue d'ensemble",
      files: "fichiers",
      dependencies: "scripts & dépendances",
      warnings: "menaces dans le code",
      vulnerabilities: "vulnérabilités",
      licenses: "conformité des licences (SPDX)",
      dark: "sombre",
      light: "clair"
    },
    title: {
      maintainers: "mainteneurs",
      releases: "versions publiées",
      files: "fichiers",
      files_extensions: "extensions des fichiers",
      unused_deps: "dépendances non utilisées ",
      missing_deps: "dépendances manquantes",
      minified_files: "fichiers minifiés",
      node_deps: "dépendances node.js",
      third_party_deps: "dépendances tierces",
      required_files: "fichiers requis",
      used_by: "utilisé par",
      openSsfScorecard: "Fiche de score de sécurité"
    },
    overview: {
      homepage: "Page d'accueil",
      author: "Auteur",
      size: "Poids sur le système",
      dependencies: "Nombre de dépendances",
      files: "Nombre de fichiers",
      tsTypings: "Typages TS",
      node: "Compatibilité Node.js",
      npm: "Compatibilité NPM",
      type: "Type de module",
      lastReleaseVersion: "Dernière version publiée",
      lastReleaseDate: "Date de la dernière version",
      publishedReleases: "Nombre de versions publiées",
      numberPublishers: "Nombre de contributeur(s)",
      weeklyDownloads: "Téléchargements hebdomadaires",
      weeklyTraffic: "Trafic hebdomadaire",
      downloadsAndTraffic: "Téléchargements et trafic"
    },
    helpers: {
      warnings: "En savoir plus sur les alertes avec le",
      spdx: "En savoir plus sur le projet SPDX",
      here: "ici",
      openSsf: "En savoir plus sur les fiches de score OpenSSF",
      thirdPartyTools: "Outils tiers"
    }
  },
  searchbar_placeholder: "Recherche",
  loading_nodes: "... Chargement des noeuds ...",
  please_wait: "(Merci de patienter)",
  popup: {
    maintainer: {
      intree: "packages dans l'abre de dépendances"
    },
    report: {
      title: "Générer un rapport",
      form: {
        title: "Titre du rapport",
        includesAllDeps: "Inclure toutes les dépendances",
        dark_theme: "Thème sombre",
        light_theme: "Thème clair",
        submit: "Générer"
      }
    }
  },
  home: {
    overview: {
      title: "Vue d'ensemble",
      dependencies: "dépendances",
      totalSize: "poids total",
      directDeps: "dépendances directes",
      transitiveDeps: "dépendances transitives",
      downloadsLastWeek: "téléchargements la semaine dernière",
      generateReport: "Générer un rapport"
    },
    watch: "Packages dans l'arbre de dépendance nécessitant une plus grande attention",
    criticalWarnings: "Avertissements critiques",
    moduleTypes: "Types de modules",
    maintainers: "Mainteneurs",
    showMore: "voir plus",
    showLess: "voir moins"
  },
  settings: {
    general: {
      title: "Général",
      save: "sauvegarder",
      defaultPannel: "Panneau par défaut",
      themePannel: "Thème de l'interface",
      warnings: "Avertissements à ignorer",
      flags: "Drapeau (emojis) à ignorer",
      network: "Réseau",
      showFriendly: "Afficher les dépendances amicales",
      security: "Sécurité",
      disableExternalRequests: "Désactiver les requêtes externes"
    },
    shortcuts: {
      title: "Raccourcis",
      blockquote: "Cliquer sur le raccourci clavier pour mettre à jour",
      goto: "Ouvrir",
      openCloseWiki: "Ouverture/Fermeture du wiki",
      lock: "Verrouiller/Déverrouiller le réseau"
    }
  },
  network: {
    childOf: "enfant de",
    parentOf: "parent de",
    unlocked: "Déverrouillé",
    locked: "Verrouillé"
  },
  search: {
    "File extensions": "Extensions de fichiers",
    "Node.js core modules": "Modules de base de Node.js",
    "Available licenses": "Licences disponibles",
    "Available flags": "Drapeaux disponibles",
    default: "Options de recherche",
    recentPackages: "Packages récents",
    packagesCache: "Packages disponibles dans le cache",
    noPackageFound: "Aucun package trouvé",
    packageLengthErr: "Le nom du package doit être compris entre 2 et 64 caractères.",
    registryPlaceholder: "Recherche de packages"
  },
  legend: {
    default: "Rien à signaler.",
    warn: "La dépendance contient des menaces.",
    friendly: "La dépendance est maintenu par des auteurs du package principal."
  },
  lockedNavigation: {
    next: "Suivant",
    prev: "Précédent"
  }
};

export default { cli, ui };
