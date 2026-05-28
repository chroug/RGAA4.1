import { COLORS } from '../../../utils/terminalColors.js';

function parseRGB(rgbString) {
    const match = rgbString.match(/\d+/g);
    return match ? [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])] : [0,0,0];
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

export default async function testerCritere10_6(page, liensAAnalyser) { // 👈 On reçoit 'page' de Puppeteer
    console.log(`\n ℹ️  [critere_10.6] Visibilité des liens (Simulation Hover / Focus active)...`);
    let violations = [];
    let conformites = [];
    let statutFinal = "✅ CONFORME";

    if (!liensAAnalyser || liensAAnalyser.length === 0) {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Aucun lien suspect au milieu du texte.`);
        conformites.push({
            html: "N/A",
            selecteur_css: "N/A",
            xpath: "N/A",
            bounding_box: null,
            raison: "Aucun lien suspect au milieu du texte détecté sur la page."
        });
        return { statut: statutFinal, violations, conformites };
    }

    for (const lien of liensAAnalyser) {
        const cLien = parseRGB(lien.couleurLien);
        const cTexte = parseRGB(lien.couleurTexte);
        const ratio = getContrast(cLien, cTexte).toFixed(2);

        // 1️⃣ CAS DU CONTRASTE RATÉ (< 3:1) -> Échec immédiat
        if (Number(ratio) < 3) {
            statutFinal = "❌ NON CONFORME";
            violations.push({
                ...lien,
                raison: `[10.6.1] Contraste insuffisant (${ratio}:1) avec le texte environnant.`
            });
            console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Contraste raté : ${ratio}:1)`);
            console.log(`         Chemin DOM : ${COLORS.CYAN}${lien.chemin}${COLORS.RESET}`);
            console.log(`         Texte : "${lien.texte}"`);
            continue;
        }

        // 2️⃣ CAS DU CONTRASTE OK -> SIMULATION DES ÉTATS DYNAMIQUES
        try {
            // 🖱️ A. Simulation du Hover (Survol)
            await page.hover(lien.chemin);
            const styleHover = await page.evaluate(chemin => {
                const el = document.querySelector(chemin);
                const s = window.getComputedStyle(el);
                return { textDecoration: s.textDecoration, outline: s.outline, border: s.border, bg: s.backgroundColor };
            }, lien.chemin);

            // 🧹 NETTOYAGE VITAL : On enlève la souris du lien avant de tester le clavier !
            await page.mouse.move(0, 0);
            // On attend 50ms pour laisser le navigateur retirer l'effet :hover
            await new Promise(r => setTimeout(r, 50)); 

            // ⌨️ B. Simulation du Focus (Clavier)
            await page.focus(lien.chemin);
            const styleFocus = await page.evaluate(chemin => {
                const el = document.querySelector(chemin);
                const s = window.getComputedStyle(el);
                return { textDecoration: s.textDecoration, outline: s.outline, border: s.border, bg: s.backgroundColor };
            }, lien.chemin);

            // 🧹 NETTOYAGE 2 : On retire le focus pour ne pas polluer le lien suivant
            await page.evaluate(chemin => {
                const el = document.querySelector(chemin);
                if(el) el.blur();
            }, lien.chemin);

// C. Analyse chirurgicale des changements (On exclut strictement les couleurs !)
            
            // Pour le soulignement, on regarde uniquement si la ligne (underline) apparaît ou disparaît
            const textDecLine_Hover = styleHover.textDecoration.split(' ')[0];
            const textDecLine_Base = lien.baseTextDec.split(' ')[0];
            const textDecChangeHover = textDecLine_Hover !== textDecLine_Base;
            
            const textDecLine_Focus = styleFocus.textDecoration.split(' ')[0];
            const textDecChangeFocus = textDecLine_Focus !== textDecLine_Base;

            // Pour l'outline, on vérifie si un trait devient visible
            const outlineVisibleHover = !styleHover.outline.includes('none') && !styleHover.outline.includes('0px');
            const outlineVisibleBase = !lien.baseOutline.includes('none') && !lien.baseOutline.includes('0px');
            const outlineChangeHover = outlineVisibleHover !== outlineVisibleBase;

            const outlineVisibleFocus = !styleFocus.outline.includes('none') && !styleFocus.outline.includes('0px');
            const outlineChangeFocus = outlineVisibleFocus !== outlineVisibleBase;

            // Pour le background, on vérifie si on passe de transparent à autre chose (ou inversement)
            const bgVisibleHover = styleHover.bg !== 'rgba(0, 0, 0, 0)' && styleHover.bg !== 'transparent';
            const bgVisibleBase = lien.baseBg !== 'rgba(0, 0, 0, 0)' && lien.baseBg !== 'transparent';
            const bgChangeHover = bgVisibleHover !== bgVisibleBase;
            
            const bgVisibleFocus = styleFocus.bg !== 'rgba(0, 0, 0, 0)' && styleFocus.bg !== 'transparent';
            const bgChangeFocus = bgVisibleFocus !== bgVisibleBase;

            // VERDICT FINAL : Il faut qu'au moins UNE forme visuelle change.
            const aChangeAuHover = textDecChangeHover || outlineChangeHover || bgChangeHover;
            const aChangeAuFocus = textDecChangeFocus || outlineChangeFocus || bgChangeFocus;

            // (Les 3 lignes dupliquées ont été supprimées d'ici)

            if (aChangeAuHover && aChangeAuFocus) {
                // Le développeur a tout géré, on valide automatiquement !
                // Le développeur a tout géré, on valide automatiquement !
                console.log(`       ${COLORS.GREEN}✅ CONFORME AUTOMATIQUE${COLORS.RESET} (Contraste OK : ${ratio}:1)`);
                conformites.push({
                    ...lien,
                    raison: `[10.6.1] Contraste OK (${ratio}:1) et modification de forme (soulignement/outline/fond) validée au survol et au focus.`
                });
                console.log(`         Forme modifiée validée au survol et au focus.`);
            } else {
                // Il manque un des deux effets visuels de forme
                statutFinal = "❌ NON CONFORME";
                let raison = `[10.6.1] Lien sans indication de forme au `;
                if (!aChangeAuHover && !aChangeAuFocus) raison += "survol ET au focus.";
                else if (!aChangeAuHover) raison += "survol (:hover).";
                else raison += "focus (:focus).";

                violations.push({ ...lien, raison });
                console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Contraste OK : ${ratio}:1)`);
                console.log(`         ${COLORS.YELLOW}👉 ${raison.split('] ')[1]}${COLORS.RESET}`);
                console.log(`         Chemin DOM : ${COLORS.CYAN}${lien.chemin}${COLORS.RESET}`);
            }

        } catch (error) {
            // Si l'élément est masqué ou impossible à survoler, on applique la sécurité : Suspicion
            if (statutFinal === "✅ CONFORME") statutFinal = "⚠️ À VÉRIFIER MANUELLEMENT";
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION (Simulation impossible)${COLORS.RESET} (Contraste OK : ${ratio}:1)`);
            console.log(`         Chemin DOM : ${COLORS.CYAN}${lien.chemin}${COLORS.RESET}`);
        }
    }

    return { statut: statutFinal, violations, conformites };
}