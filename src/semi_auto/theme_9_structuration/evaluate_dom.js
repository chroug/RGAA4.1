export default function extraireStructureDOM() {
    // ====================================================================
    // 📦 INITIALISATION DES RETOURS
    // ====================================================================
    const erreursAlgo9_1 = [];
    const titresAAnalyser = [];
    const fauxTitresPotentiels = []; 
    
    const erreursAlgo9_2 = [];
    const navsAAnalyser = [];
    const suspicions9_2 = [];

    // ====================================================================
    // 🟣 CRITÈRE 9.1 : LES TITRES (Hiérarchie et Pertinence)
    // ====================================================================
    const elementsTitres = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]'));
    let niveauPrecedent = 0;

    elementsTitres.forEach((el, index) => {
        const numeroElement = index + 1; 
        let niveau = 0;
        const tagName = el.tagName.toLowerCase();
        
        if (tagName.startsWith('h') && tagName.length === 2) {
            niveau = parseInt(tagName.substring(1));
        } else if (el.getAttribute('role') === 'heading') {
            const ariaLevel = el.getAttribute('aria-level');
            if (ariaLevel && !isNaN(parseInt(ariaLevel))) {
                niveau = parseInt(ariaLevel);
            } else {
                const errData = window.RGAA_UTILS.extraireDonneesSaaS(el);
                errData.index = numeroElement;
                errData.niveau = 'ARIA';
                errData.raison = `Titre ARIA détecté mais l'attribut 'aria-level' est manquant ou invalide.`;
                erreursAlgo9_1.push(errData);
                niveau = 2; 
            }
        }

        if (niveauPrecedent > 0 && niveau > niveauPrecedent + 1) {
            const errData = window.RGAA_UTILS.extraireDonneesSaaS(el);
            errData.index = numeroElement;
            errData.niveau = niveau;
            errData.raison = `Saut de niveau de titre illogique : passage d'un niveau ${niveauPrecedent} à ${niveau}.`;
            erreursAlgo9_1.push(errData);
        }
        niveauPrecedent = niveau;

        const texteTitre = el.textContent.replace(/\s+/g, ' ').trim();
        let texteSuivant = "";
        let currentNode = el;

        while (currentNode && !currentNode.nextElementSibling && currentNode.tagName !== 'BODY') {
            currentNode = currentNode.parentElement;
        }

        if (currentNode && currentNode.nextElementSibling) {
            let sibling = currentNode.nextElementSibling;
            let blocsScannes = 0;
            while (sibling && blocsScannes < 3) {
                if (sibling.tagName.match(/^H[1-6]$/) || sibling.getAttribute('role') === 'heading') break;
                if (sibling.textContent) {
                    texteSuivant += sibling.textContent.replace(/\s+/g, ' ').trim() + " ";
                }
                if (sibling.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]')) break;
                sibling = sibling.nextElementSibling;
                blocsScannes++;
            }
        }

        const dataTitre = window.RGAA_UTILS.extraireDonneesSaaS(el);
        dataTitre.index = numeroElement;
        dataTitre.niveau = niveau;
        dataTitre.label = tagName.startsWith('h') ? `H${niveau}` : 'ARIA';
        dataTitre.titre = texteTitre;
        dataTitre.texteSuivant = texteSuivant.substring(0, 500).trim();
        titresAAnalyser.push(dataTitre);
    });

    const elementsSuspects = Array.from(document.querySelectorAll('p, div, span, strong, b'));
    elementsSuspects.forEach(el => {
        if (el.closest('h1, h2, h3, h4, h5, h6, [role="heading"]')) return;
        
        const texte = el.textContent.trim();
        if (texte.length < 3 || texte.length > 80) return;

        let estSuspect = false;
        let raison = "";

        const className = (el.className || '').toString().toLowerCase();
        const role = el.getAttribute('role');
        const style = window.getComputedStyle(el);
        const fontSizePx = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        const isBold = fontWeight === 'bold' || fontWeight === 'bolder' || parseInt(fontWeight) >= 600;
        const display = style.display;

        if (className.includes('title') || className.includes('titre') || className.includes('heading')) {
            estSuspect = true; raison = "Classe CSS suspecte ('title', 'titre'...)";
        } else if (fontSizePx > 20) {
            estSuspect = true; raison = `Taille de police anormalement grande (${Math.round(fontSizePx)}px)`;
        } else if (isBold && (display === 'block' || el.tagName === 'P' || el.tagName === 'DIV')) {
            estSuspect = true; raison = "Texte court, de type bloc, et entièrement en gras";
        } else if (role === 'header' || role === 'title') {
            estSuspect = true; raison = `Attribut role="${role}" invalide (devrait être role="heading")`;
        }

        if (estSuspect) {
            const dataFauxTitre = window.RGAA_UTILS.extraireDonneesSaaS(el);
            dataFauxTitre.texte = texte.substring(0, 60);
            dataFauxTitre.raison = raison;
            fauxTitresPotentiels.push(dataFauxTitre);
        }
    });

    const uniquesFauxTitres = [];
    const textesVus = new Set();
    fauxTitresPotentiels.forEach(ft => {
        if (!textesVus.has(ft.texte)) { textesVus.add(ft.texte); uniquesFauxTitres.push(ft); }
    });

    // ====================================================================
    // 🟠 CRITÈRE 9.2 : STRUCTURE GLOBALE
    // ====================================================================
    
    const headers = document.querySelectorAll('header');
    if (headers.length === 0) erreursAlgo9_2.push({ element: "En-tête", raison: "Aucune balise <header> trouvée." });

    const footers = document.querySelectorAll('footer');
    if (footers.length === 0) erreursAlgo9_2.push({ element: "Pied de page", raison: "Aucune balise <footer> trouvée." });

    const mains = document.querySelectorAll('main');
    if (mains.length === 0) {
        erreursAlgo9_2.push({ element: "Contenu principal", raison: "Aucune balise <main> trouvée." });
    } else {
        const mainsVisibles = Array.from(mains).filter(main => {
            const style = window.getComputedStyle(main);
            return style.display !== 'none' && style.visibility !== 'hidden' && !main.hasAttribute('hidden');
        });
        if (mainsVisibles.length > 1) {
            const errMain = window.RGAA_UTILS.extraireDonneesSaaS(mainsVisibles[1]);
            errMain.element = "Contenu principal";
            errMain.raison = `Présence de ${mainsVisibles.length} balises <main> visibles. Il ne doit y en avoir qu'une seule.`;
            erreursAlgo9_2.push(errMain);
        }
    }

    const navs = document.querySelectorAll('nav');
    navs.forEach((nav, index) => {
        const liens = Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim()).join(' | ');
        const texteBrut = nav.textContent.replace(/\s+/g, ' ').trim().substring(0, 300);
        
        const navData = window.RGAA_UTILS.extraireDonneesSaaS(nav);
        navData.index = index + 1;
        navData.labelAria = nav.getAttribute('aria-label') || 'Non défini';
        navData.liens = liens || 'Aucun lien trouvé';
        navData.texte = texteBrut;
        
        navsAAnalyser.push(navData);
    });

    const faussesZones = document.querySelectorAll('div, span, section');
    faussesZones.forEach(el => {
        const id = (el.id || '').toLowerCase();
        const className = (el.className || '').toString().toLowerCase();

        if ((id.includes('header') || className.includes('header')) && headers.length === 0) {
            const d = window.RGAA_UTILS.extraireDonneesSaaS(el); d.zone = "En-tête"; d.raison = "Utilisation d'une div/class 'header' au lieu de la balise <header>."; suspicions9_2.push(d);
        }
        if ((id.includes('footer') || className.includes('footer')) && footers.length === 0) {
            const d = window.RGAA_UTILS.extraireDonneesSaaS(el); d.zone = "Pied de page"; d.raison = "Utilisation d'une div/class 'footer' au lieu de la balise <footer>."; suspicions9_2.push(d);
        }
        if ((id.includes('main') || className.includes('main') || id.includes('content')) && mains.length === 0) {
            const d = window.RGAA_UTILS.extraireDonneesSaaS(el); d.zone = "Contenu principal"; d.raison = "Utilisation d'une div/class 'main' au lieu de la balise <main>."; suspicions9_2.push(d);
        }
        if ((id.includes('menu') || id.includes('nav') || className.includes('menu') || className.includes('nav')) && el.tagName !== 'NAV') {
            if (!el.closest('nav')) {
                const d = window.RGAA_UTILS.extraireDonneesSaaS(el); d.zone = "Navigation"; d.raison = "Ce conteneur ressemble à un menu mais n'utilise pas la balise <nav>."; suspicions9_2.push(d);
            }
        }
    });

    return { 
        erreursAlgo9_1,
        titresAAnalyser,
        fauxTitresPotentiels: uniquesFauxTitres,
        erreursAlgo9_2,
        navsAAnalyser,
        suspicions9_2
    };
}