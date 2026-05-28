import { COLORS } from '../../../utils/terminalColors.js';

export default async function testerCritere10_3(suspicionsOrdre) {
    console.log(`\n ℹ️  [critere_10.3] Ordre de lecture et compréhension sans CSS...`);

    // 1️⃣ Analyse Heuristique (Manipulations CSS de l'ordre)
    if (suspicionsOrdre && suspicionsOrdre.length > 0) {
        console.log(`    👁️  Analyse Heuristique : ${suspicionsOrdre.length} manipulation(s) de l'ordre de lecture détectée(s).`);
        
        let violations = [];
        
        suspicionsOrdre.forEach((susp, idx) => {
            violations.push({
                ...susp,
                raison: `[10.3] Manipulation CSS suspecte ('order' ou 'flex-direction: reverse') : ${susp.cssCause}`
            });
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION${COLORS.RESET} (Élément n°${idx + 1}) : ${susp.cssCause}`);
            console.log(`         Texte impacté : "${susp.texte}"`);
        });

        console.log(`       ${COLORS.CYAN}👀 VALIDATION MANUELLE REQUISE : Un humain doit désactiver le CSS et vérifier si l'ordre d'affichage naturel du HTML (de haut en bas) reste compréhensible pour ces éléments.${COLORS.RESET}`);
        
        return { statut: "⚠️ À VÉRIFIER MANUELLEMENT", violations: violations };
    } 
    // 2️⃣ Bilan Parfait
    else {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : L'ordre visuel semble correspondre à l'ordre naturel du HTML. Aucune manipulation CSS ('order', 'reverse') détectée.`);
        return { 
            statut: "✅ CONFORME", 
            violations: [], 
            conformites: [{
                raison: "Aucune manipulation CSS de l'ordre de lecture ('order', 'flex-direction: reverse') n'a été détectée sur la page.",
                html: "N/A", selecteur_css: "N/A", xpath: "N/A", bounding_box: null
            }] 
        };
    }
}