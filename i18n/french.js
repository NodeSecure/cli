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
  stat: tS`${0}${1} en ${2}`,
  tarballStats: {
    path: tS`Chemin: ${0}`,
    filesCount: tS`Nombre de fichiers: ${0}`
  },
  error: {
    name: tS`Nom ${0}: ${1}`,
    message: tS`Message: ${0}`,
    phase: tS`L'erreur s'est produite pendant la phase ${0}`,
    statusCode: tS`Code statut HTTP: ${0}`,
    executionTime: tS`L'erreur s'est produite à ${0} pendant l'exécution`,
    stack: tS`Stack: ${0}`
  },
  cache: {
    found: tS`${0} trouvé dans le cache`
  },
  commands: {
    option_depth: "Niveau de profondeur de dépendances maximum à aller chercher",
    option_output: "Nom de sortie du fichier json",
    option_silent: "Activer le mode silencieux qui désactive les spinners du CLI",
    option_contacts: "Liste des contacts à mettre en évidence",
    option_packages: "Liste des packages à mettre en évidence",
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
      option_ws_port: "Port du serveur WebSocket",
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
      cacheTitle: "Cache NodeSecure:",
      cleared: "Cache nettoyé avec succès !"
    },
    extractIntegrity: {
      desc: "Extraire l'intégrité d'un paquet à partir de son manifeste et du tarball et comparer les deux intégrités si elles sont différentes.",
      missingSpecVersion: tS`Vous devez spécifier une version pour le package '${0}'.`,
      invalidSpec: tS`La spécification '${0}' est invalide.`,
      specNotFound: tS`La spécification '${0}' n'a pas pu être trouvée dans le registre npm.`
    },
    stats: {
      desc: "Afficher les statistiques d'un scan.",
      elapsed: tS`Durée du scan: ${0}`,
      stats: tS`Nombre d'appels API: ${0}`,
      error: "Un scan doit être effectué avant d'afficher les statistiques.",
      errors: tS`Nombre d'erreurs: ${0}`,
      option_min: "Filtrer les appels API avec un temps d'exécution supérieur au plafond spécifié (en ms)",
      minNotANumber: "Erreur: --min doit être un nombre.",
      statsCeiling: tS`Nombre d'appels API au-dessus de ${0}: ${1}`
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
      lock: "Verrouiller/Déverrouiller le réseau",
      views: {
        home: "vue Home",
        network: "vue Réseau",
        search: "vue Recherche",
        settings: "vue Paramètres",
        tree: "vue Arbre",
        warnings: "vue Avertissements"
      }
    }
  },
  network: {
    childOf: "enfant de",
    parentOf: "parent de",
    unlocked: "Déverrouillé",
    locked: "Verrouillé",
    switchPayload: "Changer de payload",
    removeFromCache: "Retirer du cache"
  },
  search: {
    packagesCache: "Packages disponibles dans le cache",
    noPackageFound: "Aucun package trouvé",
    packageLengthErr: "Le nom du package doit être compris entre 2 et 64 caractères.",
    registryPlaceholder: "Nom ou spec (ex: fastify@5.8.0)",
    scanning: "Analyse en cours",
    heroTitle: "Scanner un package",
    emptyHint: "Recherchez dans le registre npm ou saisissez une spec directement.",
    scan: "Scanner"
  },
  tree: {
    root: "Racine",
    depth: "Profondeur",
    deps: "dépendances",
    direct: "directes",
    modeDepth: "Profondeur",
    modeTree: "Arbre",
    modeActivity: "Activité",
    activityFresh: "< 1 semaine",
    activityRecent: "< 1 mois",
    activityActive: "< 6 mois",
    activityStable: "< 1 an",
    activitySlow: "< 2 ans",
    activityStale: "Abandonné"
  },
  search_command: {
    placeholder: "Rechercher des packages...",
    placeholder_filter_hint: "ou utiliser",
    placeholder_refine: "Ajouter un autre filtre...",
    section_actions: "Actions",
    action_toggle_theme_to_dark: "Passer en thème sombre",
    action_toggle_theme_to_light: "Passer en thème clair",
    action_reset_view: "Réinitialiser la vue",
    action_copy_packages: "Copier les packages",
    action_export_payload: "Exporter le payload",
    section_presets: "Filtres rapides",
    preset_has_vulnerabilities: "Contient des vulnérabilités",
    preset_has_scripts: "Scripts d'installation",
    preset_no_license: "Sans licence",
    preset_deprecated: "Déprécié",
    preset_large: "Volumineux (> 100ko)",
    section_filters: "Filtres",
    section_flags: "Flags - cliquer pour activer",
    section_size: "Taille - choisir un préréglage ou saisir ci-dessus",
    section_version: "Version - choisir un préréglage ou saisir ci-dessus",
    section_packages: "Packages",
    section_licenses: "Licences disponibles",
    section_extensions: "Extensions de fichiers",
    section_builtins: "Modules Node.js natifs",
    section_authors: "Auteurs",
    hint_size: "ex. >50kb, 10kb..200kb",
    hint_version: "ex. ^1.0.0, >=2.0.0",
    empty: "Aucun résultat trouvé",
    empty_after_filter: "Aucun package ne correspond aux filtres actifs",
    preset_empty_has_vulnerabilities: "Aucun package avec des vulnérabilités connues",
    preset_empty_has_scripts: "Aucun package avec des scripts d'installation",
    preset_empty_no_license: "Tous les packages ont une licence",
    preset_empty_deprecated: "Aucun package déprécié",
    preset_empty_large: "Aucun package ne dépasse 100ko",
    section_ignore_flags: "Ignorer les flags",
    section_ignore_warnings: "Ignorer les avertissements",
    nav_navigate: "naviguer",
    nav_select: "sélectionner",
    nav_remove: "supprimer le filtre",
    nav_close: "fermer",
    filter_hints: {
      package: "nom",
      version: "range semver",
      flag: "cliquer pour sélectionner",
      license: "identifiant SPDX",
      author: "nom ou email",
      ext: "extension de fichier",
      builtin: "module node.js",
      size: "ex. >50kb",
      highlighted: "all"
    }
  },
  legend: {
    default: "Rien à signaler.",
    warn: "La dépendance contient des menaces.",
    friendly: "La dépendance est maintenu par des auteurs du package principal.",
    highlighted: "Le package fait partie des packages mis en évidence"
  },
  lockedNavigation: {
    next: "Suivant",
    prev: "Précédent"
  },
  warnings: {
    title: "Avertissements",
    totalWarnings: "avertissements",
    totalPackages: "packages concernés",
    noWarnings: "Aucun avertissement trouvé",
    docs: "docs",
    packages: "packages",
    occurrences: "occurrences",
    critical: "Critique",
    warning: "Avertissement",
    information: "Information"
  }
};

export default { cli, ui };
