export default function extraireTheme10DOM() {
    // ==========================================
    // 📦 INITIALISATION DES RETOURS
    // ==========================================
    // Pour le 10.2 (Injections CSS)
    const textesCSSAAnalyser = [];
    const imagesDeFondAVerifier = [];
    
    // Pour le 10.3 (Ordre de lecture)
    const suspicionsOrdre = [];

    // NOUVEAU : Pour le 10.5 (Couleurs et Fonds)
    const suspicionsCouleurs = [];

    // ==========================================
    // 🟡 PARTIE 1 : ANALYSE DES ÉLÉMENTS (DOM)
    // ==========================================
    const tousLesElements = document.querySelectorAll('body *');

    tousLesElements.forEach((el) => {
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'META', 'LINK', 'SVG', 'PATH'].includes(el.tagName)) return;

        const styleEl = window.getComputedStyle(el);
        const texteBrut = el.innerText ? el.innerText.trim() : '';

        // --- 🟣 CRITÈRE 10.2 : INJECTIONS CSS & BACKGROUNDS ---
        const stylesBefore = window.getComputedStyle(el, '::before');
        const stylesAfter = window.getComputedStyle(el, '::after');

        [stylesBefore, stylesAfter].forEach(pseudo => {
            const content = pseudo.getPropertyValue('content');
            if (content && content !== 'none' && content !== 'normal' && content !== '""' && content !== "''") {
                const textePropre = content.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
                if (textePropre.length > 1 && /[a-zA-Z0-9]/.test(textePropre)) {
                    textesCSSAAnalyser.push({
                        texte: textePropre, html: el.outerHTML.substring(0, 150), tagName: el.tagName
                    });
                }
            }
        });

        const bgImage = styleEl.getPropertyValue('background-image');
        if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            if (texteBrut.length === 0) {
                imagesDeFondAVerifier.push({
                    css: bgImage.substring(0, 80) + '...', html: el.outerHTML.substring(0, 150)
                });
            }
        }

        // --- 🟠 CRITÈRE 10.3 : ORDRE DE LECTURE (CSS) ---
        if (texteBrut.length > 0) {
            const order = styleEl.order;
            const flexDir = styleEl.flexDirection;
            const position = styleEl.position;
            const gridRow = styleEl.gridRow;
            const gridColumn = styleEl.gridColumn;

            let estSuspect = false;
            let raison = "";

            if (order && order !== '0' && order !== '') {
                estSuspect = true; raison = `Propriété 'order: ${order}'. L'élément est déplacé visuellement hors de son ordre HTML.`;
            } else if (flexDir === 'row-reverse' || flexDir === 'column-reverse') {
                estSuspect = true; raison = `Propriété 'flex-direction: ${flexDir}'. Le contenu de ce bloc est lu à l'envers.`;
            } else if ((gridRow && gridRow !== 'auto' && !gridRow.includes('auto')) || (gridColumn && gridColumn !== 'auto' && !gridColumn.includes('auto'))) {
                estSuspect = true; raison = `Placement CSS Grid explicite. L'élément peut être affiché dans un ordre totalement différent.`;
            } else if ((position === 'absolute' || position === 'fixed') && texteBrut.length > 30) {
                if (!['HEADER', 'NAV', 'FOOTER'].includes(el.tagName) && !el.closest('header, nav, footer')) {
                    estSuspect = true; raison = `Positionnement '${position}' sur un bloc de texte. Il est retiré du flux naturel.`;
                }
            }

            if (estSuspect) {
                suspicionsOrdre.push({
                    texte: texteBrut.substring(0, 60).replace(/\n/g, ' ') + '...', html: el.outerHTML.substring(0, 150), cssCause: raison
                });
            }
        }
    });

    const uniquesSuspicionsOrdre = [];
    const textesVus = new Set();
    suspicionsOrdre.forEach(susp => {
        if (!textesVus.has(susp.texte)) { textesVus.add(susp.texte); uniquesSuspicionsOrdre.push(susp); }
    });

// ==========================================
    // 🔵 PARTIE 2 : ANALYSE DES FEUILLES DE STYLE (CRITÈRE 10.5) - 100% STRICT
    // ==========================================
    const elementsVus105 = new Set(); 

    function genererCheminCSS(el) {
        if (!(el instanceof Element)) return;
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector) nth++;
                }
                if (nth != 1) selector += ":nth-of-type("+nth+")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
    }

    function aUnFondDefiniDansLaCascade(el) {
        let noeudCourant = el;
        while (noeudCourant) {
            const bg = window.getComputedStyle(noeudCourant).backgroundColor;
            if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return true; 
            noeudCourant = noeudCourant.parentElement;
        }
        return false;
    }

    // 🧠 NOUVEAU : Ton idée ! On fouille TOUT le CSS appliqué à l'élément pour trouver la couleur.
    function aUneCouleurDeTexteExplicite(el) {
        let noeudCourant = el;
        while (noeudCourant && noeudCourant.nodeType === Node.ELEMENT_NODE) {
            // 1. On vérifie le style "inline" (<div style="color: black;">)
            if (noeudCourant.style && noeudCourant.style.getPropertyValue('color')) return true;
            
            // 2. On scanne toutes les règles CSS de la page
            try {
                const sheets = Array.from(document.styleSheets);
                for (let sheet of sheets) {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        for (let rule of rules) {
                            // Si la règle s'applique à notre élément (ex: .text-black)
                            if (rule.type === 1 && noeudCourant.matches(rule.selectorText)) {
                                // Et qu'elle contient une couleur
                                if (rule.style.getPropertyValue('color')) {
                                    return true; // Bingo ! Le développeur a codé la couleur.
                                }
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {}
            // On remonte au parent pour voir s'il a transmis sa couleur explicite
            noeudCourant = noeudCourant.parentElement;
        }
        return false;
    }

    try {
        const stylesheets = Array.from(document.styleSheets);
        
        stylesheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || []);
                rules.forEach(rule => {
                    if (rule.type === 1) { 
                        const style = rule.style;
                        
                        const bgColorDec = style.getPropertyValue('background-color');
                        const colorDec = style.getPropertyValue('color');
                        const bgImgDec = style.getPropertyValue('background-image');

                        const hasBgColor = bgColorDec && bgColorDec !== 'transparent' && bgColorDec !== 'initial';
                        const hasColor = colorDec && colorDec !== 'initial';
                        const hasBgImage = bgImgDec && bgImgDec !== 'none' && bgImgDec !== 'initial';

                        let erreurCode = null;
                        let erreurMsg = "";

                        if (hasBgColor && !hasColor) {
                            erreurCode = "10.5.1"; erreurMsg = `Couleur de fond définie, mais sans couleur de texte.`;
                        } else if (hasColor && !hasBgColor) {
                            erreurCode = "10.5.2"; erreurMsg = `Couleur de texte définie, mais sans couleur de fond.`;
                        } else if (hasBgImage && !hasBgColor) {
                            erreurCode = "10.5.3"; erreurMsg = `Image de fond définie sans couleur de fond de secours.`;
                        }

                        if (erreurCode) {
                            const elementsImpactes = document.querySelectorAll(rule.selectorText);
                            elementsImpactes.forEach(el => {
                                const texteBrut = el.innerText ? el.innerText.trim() : '';
                                
                                if (texteBrut.length > 0 && !elementsVus105.has(el)) {
                                    
                                    // ⚖️ FILTRE 1 : Héritage du fond (10.5.2 et 10.5.3)
                                    if ((erreurCode === "10.5.2" || erreurCode === "10.5.3") && aUnFondDefiniDansLaCascade(el)) {
                                        return; 
                                    }

                                    // ⚖️ FILTRE 2 : Gestion de l'erreur 10.5.1 (Fond sans texte)
                                    if (erreurCode === "10.5.1") {
                                        const textColor = window.getComputedStyle(el).color;
                                        
                                        if (textColor !== 'rgb(0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
                                            return; // Couleur gérée par une autre classe (ex: .text-blue-800)
                                        } else {
                                            // 🚀 C'EST ICI QUE TON IDÉE INTERVIENT !
                                            // Le texte est noir. Est-ce un noir par défaut, ou un vrai .text-black ?
                                            if (aUneCouleurDeTexteExplicite(el)) {
                                                return; // Le développeur a bien écrit la couleur noir. C'est validé !
                                            }
                                        }
                                    }

                                    elementsVus105.add(el);
                                    suspicionsCouleurs.push({
                                        test: erreurCode,
                                        css: rule.selectorText,
                                        cheminExact: genererCheminCSS(el),
                                        html: el.outerHTML.substring(0, 100),
                                        texte: texteBrut.substring(0, 60).replace(/\n/g, ' ') + "...",
                                        erreur: erreurMsg
                                    });
                                }
                            });
                        }
                    }
                });
            } catch (e) {}
        });
    } catch (e) { console.error("Erreur 10.5:", e); }

    // On retourne toutes les variables !
    return { 
        textesCSSAAnalyser, 
        imagesDeFondAVerifier, 
        suspicionsOrdre: uniquesSuspicionsOrdre,
        suspicionsCouleurs // 👈 Nouvel export
    };
}