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
    // 📖 SECTION 4 : POUR LE CRITÈRE 8.10 (Sens de lecture)
    // Objectif : Trouver les erreurs algo strictes et les cas suspects pour l'IA
    // ==========================================
    const erreursAlgo8_10 = [];
    const suspicionsIA8_10 = [];
    
    // Regex pour l'Arabe, l'Hébreu, etc.
    const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

    function getClosestDirAttribute(element) {
        let current = element;
        while (current && current.nodeType === 1) {
            if (current.hasAttribute('dir')) {
                return current.getAttribute('dir').toLowerCase().trim();
            }
            current = current.parentElement;
        }
        return document.documentElement.dir || 'ltr';
    }

    // Test A : Valeurs dir invalides et Hack Visuel
    document.querySelectorAll('[dir]').forEach(el => {
        const dirValue = el.getAttribute('dir').toLowerCase().trim();
        
        if (dirValue !== 'ltr' && dirValue !== 'rtl') {
            erreursAlgo8_10.push({
                html: el.outerHTML.substring(0, 150),
                raison: `Valeur d'attribut "dir" non conforme : '${dirValue}'. Le RGAA exige 'ltr' ou 'rtl'.`
            });
        }

        if (dirValue === 'rtl') {
            const texte = el.textContent || "";
            // Si dir="rtl" MAIS aucun alphabet oriental détecté -> Suspicion de hack visuel
            if (texte.trim().length > 0 && !rtlRegex.test(texte)) {
                suspicionsIA8_10.push({
                    html: el.outerHTML.substring(0, 150),
                    texte: texte.trim().substring(0, 100)
                });
            }
        }
    });

    // Test B : Texte oriental sans attribut dir
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (text.length > 0 && rtlRegex.test(text)) {
            const parentElement = node.parentElement;
            const inheritedDir = getClosestDirAttribute(parentElement);
            if (inheritedDir !== 'rtl') {
                erreursAlgo8_10.push({
                    html: parentElement.outerHTML.substring(0, 150),
                    raison: `Texte s'écrivant de droite à gauche détecté, mais sans attribut dir="rtl".`
                });
            }
        }
    }

// ==========================================
    // 🏷️ SECTION 3 BIS : POUR LE CRITÈRE 8.8 (Validité des codes ISO)
    // ==========================================
    const erreursAlgo8_8 = [];
    // Regex améliorée (Accepte "en", "fr-CA", mais rejette les underscores ou les mots entiers)
    const regexCodeLangueValide = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?(-[a-zA-Z0-9]+)*$/;
    
    document.querySelectorAll('[lang], [xml\\:lang]').forEach(el => {
        const attr = el.hasAttribute('lang') ? 'lang' : 'xml:lang';
        const langValue = el.getAttribute(attr).trim();
        
        // 1. Détection de l'attribut vide (lang="")
        if (langValue === "") {
            erreursAlgo8_8.push({
                html: el.outerHTML.substring(0, 150),
                raison: `L'attribut ${attr} est vide.`
            });
        } 
        // 2. Détection du mauvais séparateur (lang="en_US")
        else if (langValue.includes('_')) {
            erreursAlgo8_8.push({
                html: el.outerHTML.substring(0, 150),
                raison: `Le code langue '${langValue}' contient un underscore '_'. Le W3C exige un tiret '-' (ex: en-US).`
            });
        }
        // 3. Détection des codes totalement invalides (lang="english")
        else if (!regexCodeLangueValide.test(langValue)) {
            erreursAlgo8_8.push({
                html: el.outerHTML.substring(0, 150),
                raison: `Le code langue '${langValue}' est syntaxiquement invalide (format ISO attendu, ex: 'en' ou 'fr-CA').`
            });
        }
    });

    // 📦 LE RETOUR FINAL DOIT INCLURE erreursAlgo8_8 :
    return { 
        langueDefaut, 
        textePrincipal, 
        blocsTexte: blocsUniques,
        erreursAlgo8_8,      // 🔥 Indispensable pour le 8.8
        erreursAlgo8_10,     
        suspicionsIA8_10     
    };
}