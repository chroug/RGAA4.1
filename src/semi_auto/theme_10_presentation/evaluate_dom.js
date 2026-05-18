export default function extraireTheme10DOM() {
    // ==========================================
    // 📦 INITIALISATION DES RETOURS
    // ==========================================
    // Pour le 10.2 (Injections CSS)
    const textesCSSAAnalyser = [];
    const imagesDeFondAVerifier = [];
    
    // Pour le 10.3 (Ordre de lecture)
    const suspicionsOrdre = [];

    // Pour le 10.5 (Couleurs et Fonds)
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

    function aUneCouleurDeTexteExplicite(el) {
        let noeudCourant = el;
        while (noeudCourant && noeudCourant.nodeType === Node.ELEMENT_NODE) {
            if (noeudCourant.style && noeudCourant.style.getPropertyValue('color')) return true;
            
            try {
                const sheets = Array.from(document.styleSheets);
                for (let sheet of sheets) {
                    try {
                        const rules = Array.from(sheet.cssRules || []);
                        for (let rule of rules) {
                            if (rule.type === 1 && noeudCourant.matches(rule.selectorText)) {
                                if (rule.style.getPropertyValue('color')) {
                                    return true;
                                }
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {}
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
                                    
                                    if ((erreurCode === "10.5.2" || erreurCode === "10.5.3") && aUnFondDefiniDansLaCascade(el)) {
                                        return; 
                                    }

                                    if (erreurCode === "10.5.1") {
                                        const textColor = window.getComputedStyle(el).color;
                                        
                                        if (textColor !== 'rgb(0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
                                            return;
                                        } else {
                                            if (aUneCouleurDeTexteExplicite(el)) {
                                                return;
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

    // ==========================================
    // 🟢 PARTIE 3 : ANALYSE DES LIENS (CRITÈRE 10.6)
    // ==========================================
    const liensAAnalyser106 = [];

    try {
        const liens = document.querySelectorAll('a, [role="link"]');
        
        liens.forEach(lien => {
            // 1. Ignorer les liens invisibles dans le DOM ou vides
            if (!lien.offsetParent || lien.innerText.trim().length === 0) return;

            // 🚀 FILTRE V10 : Le radar spatial (Ignore les liens cachés hors écran)
            const rect = lien.getBoundingClientRect();
            if (rect.width <= 2 || rect.height <= 2 || rect.left < -900 || rect.top < -900) return;

            if (lien.closest('nav, footer, header, [role="navigation"], [role="banner"]')) return;
            
            const style = window.getComputedStyle(lien);
            if (lien.className.match(/btn|button/i) || 
               ((style.display === 'block' || style.display === 'inline-block') && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseInt(style.paddingTop) > 2)) {
                return;
            }

            if (style.textDecoration && style.textDecoration.includes('underline')) return;
            if (lien.closest('h1, h2, h3, h4, h5, h6')) return;
            if (lien.innerText.trim() === lien.parentElement.innerText.trim()) return;

            // 7. FILTRE V8 : Détection des groupes de liens (Menus, listes de contacts, footers...)
            const parent = lien.parentElement;
            const parentText = parent.innerText ? parent.innerText.trim() : '';
            
            if (parentText.length > 0) {
                const tousLesLiens = Array.from(parent.querySelectorAll('a, [role="link"]'));
                let longueurTotaleLiens = 0;
                tousLesLiens.forEach(l => {
                    longueurTotaleLiens += (l.innerText ? l.innerText.trim().length : 0);
                });
                
                if ((longueurTotaleLiens / parentText.length) > 0.8) {
                    return; 
                }
            }

            // 8. FILTRE V9 : La règle du "Vrai Texte"
            const tagParent = parent.tagName.toLowerCase();
            const balisesDeTexte = ['p', 'li', 'blockquote', 'q', 'figcaption', 'dd', 'dt'];

            if (!balisesDeTexte.includes(tagParent)) {
                if (parentText.length > 0 && parentText.length < 150) {
                    return; 
                }
            }

            // 🎯 On tient un "Lien dans un texte, non souligné" !
            const parentStyle = window.getComputedStyle(lien.parentElement);
            if (style.color === parentStyle.color) return;

            liensAAnalyser106.push({
                texte: lien.innerText.substring(0, 60).replace(/\n/g, ' ') + '...',
                chemin: typeof genererCheminCSS === 'function' ? genererCheminCSS(lien) : 'N/A',
                html: lien.outerHTML.substring(0, 100),
                couleurLien: style.color,
                couleurTexte: parentStyle.color,
                baseTextDec: style.textDecoration,
                baseOutline: style.outline,
                baseBorder: style.border,
                baseBg: style.backgroundColor
            });
        });
    } catch (e) {
        console.error("Erreur 10.6:", e);
    }

    // ==========================================
    // 📦 RETOUR GLOBAL DU SCRIPT
    // ==========================================
    return { 
        textesCSSAAnalyser, 
        imagesDeFondAVerifier, 
        suspicionsOrdre: uniquesSuspicionsOrdre,
        suspicionsCouleurs,
        liensAAnalyser106
    };
}