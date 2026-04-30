// src/semi_auto/theme_8_langue/evaluate_dom.js

export default function extraireLangueDOM() {
    
    // ==========================================
    // 🌍 SECTION 1 : POUR LE CRITÈRE 8.4 (Langue principale de la page)
    // Objectif : Récupérer le code langue déclaré sur la balise <html> 
    // et un grand bloc de texte pour que l'IA vérifie la pertinence globale.
    // ==========================================

    const htmlTag = document.documentElement;
    const langueDefaut = htmlTag.getAttribute('lang') || htmlTag.getAttribute('xml:lang') || "";

    const mainContent = document.querySelector('main, [role="main"], body');
    // On extrait jusqu'à 1000 caractères du contenu principal pour donner assez de contexte à l'IA
    const textePrincipal = mainContent ? mainContent.innerText.replace(/\s+/g, ' ').substring(0, 1000) : "";


    // ==========================================
    // 🗣️ SECTION 2 : POUR LE CRITÈRE 8.7 (Changements de langue)
    // Objectif : Parcourir tous les paragraphes et listes de la page, 
    // extraire leur HTML complet et vérifier s'ils ont déjà un attribut "lang".
    // ==========================================

    // On cible les éléments de type "bloc" contenant du texte. 
    // ⚡ On exclut volontairement 'span' pour éviter les doublons et permettre à l'IA 
    // de lire la phrase entière dans son contexte (ex: un <p> qui contient un <span>).
    const elementsTextuels = Array.from(document.querySelectorAll('p, li, blockquote, dd, dt, h1, h2, h3, h4, h5, h6'));
    const blocsTexte = [];

    elementsTextuels.forEach(el => {
        const texte = el.innerText.trim();
        
        // ⚡ Filtre de bruit : On ignore les textes de moins de 3 mots 
        // pour ne pas saturer l'IA avec de petits éléments d'interface isolés.
        if (texte.split(' ').length > 2) { 
            
            // On vérifie si l'élément (ou l'un de ses parents) possède déjà un attribut lang spécifique
            const closestLangAttr = el.closest('[lang]');
            const langDeclareePourCeBloc = closestLangAttr ? closestLangAttr.getAttribute('lang') : langueDefaut;

            blocsTexte.push({
                texte: texte,
                // ⚠️ CRUCIAL POUR LE 8.7 : On garde le code HTML ENTIER (outerHTML) 
                // pour que l'IA puisse voir les balises de changement de langue (ex: <span lang="en">) à l'intérieur de la phrase.
                html: el.outerHTML, 
                langDeclaree: langDeclareePourCeBloc
            });
        }
    });

    // Nettoyage : On supprime les paragraphes identiques (doublons) pour économiser des requêtes IA
    const blocsUniques = Array.from(new Set(blocsTexte.map(b => b.texte)))
        .map(texte => blocsTexte.find(b => b.texte === texte));


    // ==========================================
    // 📦 SECTION 3 : RETOUR DES DONNÉES
    // ==========================================
    
    return { 
        langueDefaut,   // Utilisé par testerCritere8_4.js
        textePrincipal, // Utilisé par testerCritere8_4.js
        blocsTexte: blocsUniques // Utilisé par testerCritere8_7.js
    };
}