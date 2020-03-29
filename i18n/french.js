/* eslint-disable max-len */
"use strict";

// Require Internal Dependencies
const { taggedString: tS } = require("../src/utils");

module.exports = {
    lang: "fr",
    cli: {
        executing_at: "Exécution de node-secure à",
        min_nodejs_version: tS`node-secure demande au moins Node.js ${0} pour fonctionner! Merci de mettre à jour votre version de Node.js.`,
        no_dep_to_proceed: "Aucune dépendance pour continuer !",
        successfully_written_json: tS`Ecriture du fichier .json à ${0} réalisé avec succes`,
        http_server_started: "Serveur HTTP démarré",
        commands: {
            option_depth: "Niveau de profondeur de dépendances maximum à aller chercher",
            option_output: "Nom de sortie du fichier json",
            hydrate_db: {
                desc: "Mise à jour de la base de vulnérabilité",
                running: tS`Mise à jour local des vulnérabilités avec la base '${0}'!`,
                success: tS`Base de vulnérabilités mise à jour avec succes en ${0}`
            },
            cwd: {
                desc: "Démarre une analyse de sécurité sur le cwd"
            },
            from: {
                desc: "Démarre une analyse de sécurité sur un package donné du registre npm",
                searching: tS`Recherche du manifest '${0}' dans le registre npm!`,
                fetched: tS`Manifest de ${0} importé de npm en ${1}`
            },
            auto: {
                desc: "Démarre une analyse de sécurité sur le cwd ou sur un package donné et ouvre automatiquement l'interface web",
                option_keep: "Conserve le fichier nsecure-result.json sur le systeme après l'exécution"
            },
            open: {
                desc: "Démarre un Serveur HTTP avec un fichier json nsecure donné."
            },
            verify: {
                desc: "Démarre une analyse avancé complete pour un package npm donné!",
                option_json: "Affiche le résultat d'analyse dans la sortie standard"
            },
            lang: {
                desc: "Configure le langage par défaut du CLI.",
                question_text: "Quel langage voulez-vous?",
                new_selection: tS`'${0}' a été selectionné comme étant le nouveau langage du CLI!`
            }
        }
    },
    depWalker: {
        fetch_and_walk_deps: "Fetching and walking through all dependencies ...",
        fetch_on_registry: "En attente de l'importation des packages du registre npm!",
        waiting_tarball: "En attente de l'analyse des tarballs!",
        fetch_metadata: "Metadata package importé:",
        analyzed_tarball: "Npm tarballs analysés:",
        success_fetch_deptree: tS`Successfully navigated through the ${0} in ${1}`,
        success_tarball: tS`${0} packages tarball en ${1} analysés avec succes`,
        success_registry_metadata: "Metadata requis pour tous les packages importé avec succes!",
        failed_rmdir: tS`Suppression du dossier ${0} échoué`
    },
    ui: {
        stats: {
            title: "Stats Globales",
            total_packages: "Total des packages",
            total_size: "Poid total",
            indirect_deps: "Packages avec des dépendances indirectes",
            extensions: "Extensions",
            licenses: "Licences",
            maintainers: "Mainteneurs"
        },
        package_info: {
            hide_children: "Cacher les enfants",
            vuln: "Vuln",
            files_extensions: "extensions des fichiers",
            unused_deps: "dépendances non utilisées ",
            missing_deps: "dépendances manquantes",
            minified_files: "Fichiers minifiées",
            node_deps: "dépendances node.js",
            third_party_deps: "dépendances tierces",
            required_files: "Fichiers requis"
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
                linkhere: "lien ici",
                type: "type",
                file: "fichier",
                errorMsg: "message d'erreur",
                position: "position"
            }
        },
        searchbar_placeholder: "Recherche",
        btn_emojis_legends: "Legendes des Emojis",
        show_complete_desc: "Cliquer sur un package pour voir une description complète ici",
        loading_nodes: "... Chargement des noeuds ...",
        please_wait: "(Merci de patienter)"
    }
};
