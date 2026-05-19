import { COLORS } from '../../../utils/terminalColors.js';

function parseRGB(rgbString) {
    const match = rgbString.match(/\d+/g);
    return match ? [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])] : [255,255,255];
}
function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function getContrast(rgb1, rgb2) {
    const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export default async function testerCritere10_7(page, elementsFocusables) {
    console.log(`\n ℹ️  [critere_10.7] Visibilité du Focus (Simulation Clavier active)...`);
    let violations = [];
    let statutFinal = "✅ CONFORME";
    let alertesManuelles = 0;

    if (!elementsFocusables || elementsFocusables.length === 0) {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Aucun élément interactif détecté.`);
        return { statut: statutFinal, violations };
    }

    for (const el of elementsFocusables) {
        try {
            // 🍯 DÉTECTION DU POT DE MIEL (Honeypot)
            if (el.estHoneypotPiege) {
                statutFinal = "❌ NON CONFORME";
                violations.push({ html: el.html, xpath: el.chemin, raison: "[10.7.1] Piège Clavier : Un champ caché (Honeypot) reçoit le focus car il manque tabindex='-1'." });
                console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Piège clavier : champ caché focusable)`);
                console.log(`         Texte : "🍯 ${el.texte}"`);
                continue; // On passe à l'élément suivant sans faire l'analyse visuelle !
            }
// 1. Capture de l'état de base
            const styleBase = await page.evaluate(chemin => {
                const node = document.querySelector(chemin);
                if (!node) return null;
                const s = window.getComputedStyle(node);
                return { 
                    outline: s.outlineWidth, bg: s.backgroundColor, shadow: s.boxShadow, 
                    borderWidth: s.borderWidth, borderColor: s.borderColor // 👈 Ajout de la couleur
                };
            }, el.chemin);

            if (!styleBase) continue;

// 2. Simulation de la prise de focus (FORCÉE EN MODE CLAVIER)
            await page.evaluate(chemin => {
                const node = document.querySelector(chemin);
                if (node) {
                    // Cette option magique force le déclenchement du :focus-visible !
                    node.focus({ focusVisible: true }); 
                }
            }, el.chemin);
            
            await new Promise(r => setTimeout(r, 20)); 

            // 3. Capture de l'état au focus (En incluant les pseudo-éléments utilisés par les frameworks modernes)
            const styleFocus = await page.evaluate(chemin => {
                const node = document.querySelector(chemin);
                const s = window.getComputedStyle(node);
                const sAfter = window.getComputedStyle(node, '::after');
                const sBefore = window.getComputedStyle(node, '::before');

                // On vérifie si un framework a caché le focus dans un ::after/::before (ex: Material UI, DSFR)
                const hasPseudoFocus = (sAfter.outlineWidth !== '0px' && sAfter.outlineStyle !== 'none') || 
                                       (sAfter.boxShadow !== 'none' && sAfter.boxShadow !== '') ||
                                       (sBefore.outlineWidth !== '0px' && sBefore.outlineStyle !== 'none') || 
                                       (sBefore.boxShadow !== 'none' && sBefore.boxShadow !== '');

                return { 
                    outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, 
                    bg: s.backgroundColor, shadow: s.boxShadow, 
                    borderWidth: s.borderWidth, borderColor: s.borderColor,
                    hasPseudoFocus: hasPseudoFocus // 👈 L'info vitale
                };
            }, el.chemin);

            // 4. Nettoyage
            await page.evaluate(chemin => { document.querySelector(chemin)?.blur(); }, el.chemin);

            // --- ANALYSE DES CHANGEMENTS ---
            // On valide si le focus est sur l'élément principal OU sur un pseudo-élément
            const aChangeOutline = (styleFocus.outlineStyle !== 'none' && styleFocus.outlineWidth !== '0px') || styleFocus.hasPseudoFocus;
            const aChangeBg = styleFocus.bg !== styleBase.bg;
            const aChangeShadow = styleFocus.shadow !== styleBase.shadow && styleFocus.shadow !== 'none';
            const aChangeBorder = (styleFocus.borderWidth !== styleBase.borderWidth && styleFocus.borderWidth !== '0px') || (styleFocus.borderColor !== styleBase.borderColor);
            // ERREUR 1 : La suppression totale (outline: none sans compensation)
            if (!aChangeOutline && !aChangeBg && !aChangeShadow && !aChangeBorder) {
                statutFinal = "❌ NON CONFORME";
                violations.push({ html: el.html, xpath: el.chemin, raison: "[10.7.1] Focus supprimé (outline: none) sans alternative visuelle." });
                console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Focus supprimé et non compensé)`);
                console.log(`         Texte : "${el.texte}"`);
                continue;
            }

            // ERREUR 2 : Le Camouflage & Contraste (Prise en compte des doubles focus : Outline + Shadow)
            let meilleurRatio = 0;
            let typeIndicateur = "";

            const cFond = parseRGB(el.fondParent);

            // 1. Test du contraste de l'outline
            if (aChangeOutline) {
                const cOutline = parseRGB(styleFocus.outlineColor);
                const ratioOutline = getContrast(cOutline, cFond);
                if (ratioOutline > meilleurRatio) { 
                    meilleurRatio = ratioOutline; 
                    typeIndicateur = "outline"; 
                }
            }

            // 2. Test du contraste de la bordure
            if (aChangeBorder) {
                const cBorder = parseRGB(styleFocus.borderColor);
                const ratioBorder = getContrast(cBorder, cFond);
                if (ratioBorder > meilleurRatio) { 
                    meilleurRatio = ratioBorder; 
                    typeIndicateur = "bordure"; 
                }
            }

            // 3. Test du contraste de l'ombre (box-shadow) - L'arme secrète d'Access42 !
            // 3. Test du contraste de l'ombre (box-shadow) - Multi-ombres gérées !
            if (aChangeShadow) {
                // On ajoute le 'g' à la fin de la Regex pour extraire TOUTES les couleurs d'un coup (tableau)
                const matchesShadow = styleFocus.shadow.match(/rgba?\([^)]+\)/g);
                
                if (matchesShadow) {
                    // On boucle sur toutes les ombres trouvées (ex: le noir ET le jaune)
                    matchesShadow.forEach(colorString => {
                        // 🛑 NOUVEAU : On ignore les couleurs transparentes (alpha = 0)
                        const valeurs = colorString.match(/\d+(\.\d+)?/g);
                        if (valeurs && valeurs.length === 4 && parseFloat(valeurs[3]) === 0) {
                            return; // C'est transparent, on passe au suivant !
                        }

                        const cShadow = parseRGB(colorString);
                        const ratioShadow = getContrast(cShadow, cFond);
                        
                        if (ratioShadow > meilleurRatio) { 
                            meilleurRatio = ratioShadow; 
                            typeIndicateur = `box-shadow (${colorString})`; 
                        }
                    });
                }
            }

            // 🎯 Le Verdict
            // On a au moins un indicateur visuel, mais on vérifie si LE MEILLEUR des 3 est suffisant
            if ((aChangeOutline || aChangeBorder || aChangeShadow) && meilleurRatio > 0 && meilleurRatio < 3) {
                statutFinal = "❌ NON CONFORME";
                violations.push({ 
                    html: el.html, 
                    xpath: el.chemin, 
                    raison: `[10.7.1] Contraste du focus insuffisant (${meilleurRatio.toFixed(2)}:1). L'indicateur le plus fort était : ${typeIndicateur}.` 
                });
                
                console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Contraste raté : ${meilleurRatio.toFixed(2)}:1 via ${typeIndicateur})`);
                console.log(`         Texte : "${el.texte}"`);
                continue;
            }

        } catch (error) {
            // Elément intraitable
        }
    }

    if (statutFinal === "✅ CONFORME") {
        console.log(`       ${COLORS.GREEN}✅ CONFORME (Test automatisé réussi)${COLORS.RESET}`);
    }
    
    console.log(`\n       ${COLORS.CYAN}👀 VALIDATION MANUELLE : Naviguez sur la page avec la touche TAB pour vérifier visuellement que le focus est toujours bien visible.${COLORS.RESET}`);

    return { statut: statutFinal, violations };
}