/* eslint-disable max-len */
"use strict";

// Require Internal Dependencies
const { taggedString: tS } = require("../src/utils");

module.exports = {
    lang: "fr",
    cli: {
        executing_at: "Exécution de node-secure à",
        min_nodejs_version: tS`node-secure nécessite au moins Node.js ${0} pour fonctionner ! Merci de mettre à jour votre version de Node.js.`,
        no_dep_to_proceed: "Aucune dépendance pour continuer !",
        successfully_written_json: tS`Ecriture du fichier de résultats réalisée avec succès ici : ${0}`,
        http_server_started: "Serveur HTTP démarré sur :",
        commands: {
            option_depth: "Niveau de profondeur de dépendances maximum à aller chercher",
            option_output: "Nom de sortie du fichier json",
            hydrate_db: {
                desc: "Mise à jour de la base de vulnérabilité",
                running: tS`Mise à jour locale des vulnérabilités avec la base '${0}'...`,
                success: tS`Base de vulnérabilités mise à jour avec succès en ${0}`
            },
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
                desc: "Démarre un serveur HTTP avec un fichier .json nsecure donné"
            },
            verify: {
                desc: "Démarre une analyse AST avancée pour un package npm donné",
                option_json: "Affiche le résultat d'analyse dans la sortie standard"
            },
            lang: {
                desc: "Configure le langage par défaut du CLI",
                question_text: "Quel langage souhaitez-vous utiliser ?",
                new_selection: tS`'${0}' a été selectionné comme étant le nouveau langage du CLI !`
            }
        }
    },
    depWalker: {
        dep_tree: "arbre de dépendances",
        fetch_and_walk_deps: "Importation et analyse de l'intégralité des dépendances...",
        fetch_on_registry: "En attente de l'importation des packages du registre npm...",
        waiting_tarball: "En attente de l'analyse des tarballs...",
        fetch_metadata: "Metadonnées importées :",
        analyzed_tarball: "Tarballs en cours d'analyse :",
        success_fetch_deptree: tS`Analyse de l'${0} terminée avec succès en ${1}`,
        success_tarball: tS`${0} tarballs analysés avec succès en ${1}`,
        success_registry_metadata: "Metadonnées requises pour tous les packages importées avec succès !",
        failed_rmdir: tS`Suppression du dossier ${0} échouée !`
    },
    ui: {
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
            show_children: "Afficher les enfants",
            hide_children: "Cacher les enfants",
            vuln: "Vuln",
            files_extensions: "extensions des fichiers",
            unused_deps: "dépendances non utilisées ",
            missing_deps: "dépendances manquantes",
            minified_files: "fichiers minifiées",
            node_deps: "dépendances node.js",
            third_party_deps: "dépendances tierces",
            required_files: "fichiers requis",
            used_by: "utilisé par"
        },
        popups: {
            licenses: {
                title: "Licences",
                name: "Nom",
                from: "fichier source"
            },
            warnings: {
                title: "Warnings",
                homepage: "Page d'accueil",
                type: "type",
                file: "fichier",
                errorMsg: "valeur incriminée",
                position: "position",
                inspect: "inspecter"
            }
        },
        searchbar_placeholder: "Recherche",
        btn_emojis_legends: "Légende des émojis",
        show_complete_desc: "Sélectionnez un package pour voir une description complète ici",
        loading_nodes: "... Chargement des noeuds ...",
        please_wait: "(Merci de patienter)"
    },
    warnings: {
        disable_scarf: "Cette dépendance peut récolter des données contre votre volonté, pensez donc à la désactiver en fournissant la variable d'environnement SCARF_ANALYTICS",
        keylogging: "Cette dépendance peut obtenir vos entrées clavier ou de souris. Cette dépendance peut être utilisée en tant que 'keylogging' attacks/malwares."
    }
};
