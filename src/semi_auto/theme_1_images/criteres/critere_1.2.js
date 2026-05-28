// src/automatique/criteres/theme_1_images/critere_1.2.js

/**
 * Juge Syntaxe RGAA - Critère 1.2
 * Évalue EXCLUSIVEMENT les images qualifiées de [DECORATIVES].
 * Vérifie l'absence absolue de texte et la présence stricte de masques (ARIA ou alt vide).
 * 
 * @param {Object} img - L'objet image extrait par evaluate_dom.js
 * @returns {Object} { statut, raison }
 */
export function evaluerCritere1_2(img) {
    let resultat = {
        critere: "1.2",
        statut: "INCONNU",
        raison: ""
    };

    // Règle 13b : La traque des attributs parasites (Échec immédiat)
    // Si l'image possède un nom accessible (aria-label, aria-labelledby, title, ou <title> enfant pour SVG)
    if (img.accessibleName && img.accessibleName.trim() !== "") {
        resultat.statut = "INVALIDE";
        resultat.raison = `ÉCHEC 1.2 : L'image est décorative mais possède un attribut textuel parasite qui sera lu par la synthèse vocale ("${img.accessibleName}").`;
        return resultat; // On arrête l'analyse ici
    }

    // Vérification des masques ARIA ou HTML standard
    const isAriaHidden = img.ariaHidden === "true";
    const isRolePresentation = img.role === "presentation" || img.role === "none";
    const isAltEmpty = img.alt === ""; // Doit être strictement une chaîne vide (présent mais vide)

    switch (img.tagName) {
        
        // ==========================================
        // 1. BALISES CLASSIQUES (<img>, <area>)
        // ==========================================
        case 'IMG':
        case 'AREA':
            // Règle 13 : Masque autorisé = alt="" OU aria-hidden="true" OU role="presentation/none"
            if (isAltEmpty || isAriaHidden || isRolePresentation) {
                resultat.statut = "VALIDE";
                resultat.raison = `Balise <${img.tagName.toLowerCase()}> correctement ignorée (présence de alt="", aria-hidden="true" ou role="presentation").`;
            } else {
                resultat.statut = "INVALIDE";
                resultat.raison = `ÉCHEC 1.2 : La balise <${img.tagName.toLowerCase()}> n'a aucun attribut pour masquer l'image aux lecteurs d'écran.`;
            }
            break;

        // ==========================================
        // 2. IMAGES VECTORIELLES (<svg>)
        // ==========================================
        case 'SVG':
            // Le SVG n'a pas d'attribut alt. Il doit être masqué via ARIA.
            if (isAriaHidden || isRolePresentation) {
                resultat.statut = "VALIDE";
                resultat.raison = "Balise <svg> correctement ignorée via ARIA (aria-hidden=\"true\" ou role=\"presentation\").";
            } else {
                resultat.statut = "INVALIDE";
                resultat.raison = "ÉCHEC 1.2.4 : La balise <svg> n'a pas d'attribut aria-hidden=\"true\" (ou role=\"presentation\").";
            }
            break;

        // ==========================================
        // 3. OBJETS COMPLEXES (<canvas>, <object>, <embed>)
        // ==========================================
        case 'CANVAS':
        case 'OBJECT':
        case 'EMBED':
            // Règle 14 : Le vide intérieur ! 
            // Ces balises doivent être masquées ET ne contenir aucun texte.
            if (!isAriaHidden && !isRolePresentation) {
                resultat.statut = "INVALIDE";
                resultat.raison = `ÉCHEC 1.2 : La balise <${img.tagName.toLowerCase()}> n'a pas d'attribut aria-hidden="true".`;
            } 
            else if (img.innerText && img.innerText.trim() !== "") {
                resultat.statut = "INVALIDE";
                resultat.raison = `ÉCHEC 1.2 : L'élément est masqué, mais contient du texte parasite ("${img.innerText}") à l'intérieur de la balise <${img.tagName.toLowerCase()}>.`;
            } 
            else {
                resultat.statut = "VALIDE";
                resultat.raison = `Balise <${img.tagName.toLowerCase()}> décorative correctement masquée et dépourvue de contenu interne.`;
            }
            break;

        // ==========================================
        // 4. LES BOUTONS (<input type="image">)
        // ==========================================
        case 'INPUT':
            // Un bouton <input type="image"> soumet un formulaire.
            // Le RGAA et le W3C considèrent qu'un bouton NE PEUT PAS être décoratif. Il a toujours une fonction.
            resultat.statut = "INVALIDE";
            resultat.raison = "ÉCHEC CRITIQUE : Un bouton <input type=\"image\"> ne peut JAMAIS être décoratif. Il doit toujours avoir une alternative décrivant son action.";
            break;

        default:
            resultat.statut = "A_VERIFIER";
            resultat.raison = `Balise <${img.tagName}> décorative non reconnue. Vérification manuelle requise.`;
            break;
    }

    return resultat;
}