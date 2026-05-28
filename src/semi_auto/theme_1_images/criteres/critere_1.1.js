// src/automatique/criteres/theme_1_images/critere_1.1.js

/**
 * Juge Syntaxe RGAA - Critère 1.1
 * Évalue EXCLUSIVEMENT les images qualifiées de [INFORMATIVES].
 * Vérifie la présence stricte d'alternatives valides selon la balise HTML.
 * 
 * @param {Object} img - L'objet image extrait par evaluate_dom.js
 * @returns {Object} { statut, raison, texte_a_evaluer_par_ia, alerte }
 */
export function evaluerCritere1_1(img) {
    let resultat = {
        critere: "1.1",
        statut: "INCONNU",
        raison: "",
        texte_a_evaluer_par_ia: null, // Si valide, ce texte sera envoyé au Juge Sémantique (1.3)
        alerte: null
    };

    switch (img.tagName) {
        
        // ==========================================
        // 1. BALISES CLASSIQUES (<img>, <input>, <area>)
        // ==========================================
        case 'IMG':
        case 'INPUT':
        case 'AREA':
            // Règle 6 : evaluate_dom.js a déjà filtré les attributs interdits (ex: title sur area)
            if (img.accessibleName) {
                resultat.statut = "VALIDE";
                resultat.raison = "Alternative textuelle trouvée et conforme à la balise.";
                resultat.texte_a_evaluer_par_ia = img.accessibleName;
                
                // Règle 10 : L'exception ismap (Test 1.1.4)
                if (img.isMap) {
                    resultat.alerte = "VÉRIFICATION MANUELLE (1.1.4) : Image 'ismap' détectée. Vérifiez qu'une liste de liens adjacente existe pour la navigation.";
                    resultat.texte_a_evaluer_par_ia = null; // Pas d'IA pour les ismap
                }
            } else {
                resultat.statut = "INVALIDE";
                resultat.raison = "Aucune alternative textuelle valide trouvée (alt, aria-label, etc. absents ou vides).";
            }
            break;

        // ==========================================
        // 2. IMAGES VECTORIELLES (<svg>)
        // ==========================================
        case 'SVG':
            // Règle 15 : L'Obligation role="img" (Test 1.1.5)
            if (img.role !== 'img') {
                resultat.statut = "INVALIDE";
                resultat.raison = "ÉCHEC 1.1.5 : Le SVG informatif ne possède pas l'attribut obligatoire role=\"img\".";
                break;
            }

            if (img.accessibleName) {
                resultat.statut = "VALIDE";
                resultat.raison = "SVG valide avec role=\"img\" et alternative (<title> ou ARIA) présente.";
                resultat.texte_a_evaluer_par_ia = img.accessibleName;
            } else {
                resultat.statut = "INVALIDE";
                resultat.raison = "Le SVG possède role=\"img\" mais aucune alternative textuelle valide (<title> ou ARIA).";
            }
            break;

        // ==========================================
        // 3. OBJETS COMPLEXES (<canvas>, <object>, <embed>)
        // ==========================================
        case 'CANVAS':
        case 'OBJECT':
        case 'EMBED':
            // 1er cas : L'élément possède un nom accessible ARIA
            if (img.accessibleName) {
                resultat.statut = "VALIDE";
                resultat.raison = "Alternative ARIA trouvée sur l'objet complexe.";
                resultat.texte_a_evaluer_par_ia = img.accessibleName;
            } 
            // 2ème cas : Règle 16 - Le paradoxe canvas/role="img"
            else if (img.role === 'img') {
                resultat.statut = "INVALIDE";
                resultat.raison = `L'élément <${img.tagName.toLowerCase()}> possède role="img" mais aucun attribut ARIA. Son contenu interne est donc ignoré par les lecteurs d'écran.`;
            }
            // 3ème cas : Contenu alternatif interne (ex: entre <canvas> et </canvas>)
            else if (img.innerText) {
                resultat.statut = "VALIDE";
                resultat.raison = `Contenu alternatif interne trouvé dans la balise <${img.tagName.toLowerCase()}>.`;
                resultat.texte_a_evaluer_par_ia = img.innerText;
                
                // Règle 19 (Rappel) : Le canvas nécessite une vérification de restitution (Test 1.3.8)
                if (img.tagName === 'CANVAS') {
                    resultat.alerte = "VÉRIFICATION MANUELLE (1.3.8) : Vérifiez avec un lecteur d'écran que le texte interne du <canvas> est bien vocalisé.";
                }
            }
            // 4ème cas : Contenu alternatif adjacent (Lien ou Bouton juste après)
           else if (img.adjacentText) {
                resultat.statut = "VALIDE";
                resultat.raison = `Lien adjacent trouvé servant d'alternative.`;
                resultat.texte_a_evaluer_par_ia = null; // 👈 On annule l'IA pour le 1.3 !
                resultat.alerte = "VÉRIFICATION MANUELLE : Vérifier que la page ciblée par le lien adjacent contient bien la description de l'image complexe.";
            }
            // 5ème cas : Règle 17 - Le mécanisme de remplacement
            else {
                resultat.statut = "A_VERIFIER";
                resultat.raison = `Aucune alternative directe trouvée. VÉRIFICATION MANUELLE REQUISE : Un bouton ou script permet-il de remplacer ce <${img.tagName.toLowerCase()}> par du texte ?`;
            }
            break;

        default:
            resultat.statut = "A_VERIFIER";
            resultat.raison = `Balise <${img.tagName}> non gérée spécifiquement. Vérification manuelle requise.`;
            break;
    }

    return resultat;
}