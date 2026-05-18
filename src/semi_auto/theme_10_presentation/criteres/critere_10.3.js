import { COLORS } from '../../../utils/terminalColors.js';

export default async function testerCritere10_3(suspicionsOrdre) {
    console.log(`\n ℹ️  [critere_10.3] Ordre de lecture et compréhension sans CSS...`);

    // 1️⃣ Analyse Heuristique (Manipulations CSS de l'ordre)
    if (suspicionsOrdre && suspicionsOrdre.length > 0) {
        console.log(`    👁️  Analyse Heuristique : ${suspicionsOrdre.length} manipulation(s) de l'ordre de lecture détectée(s).`);
        
        suspicionsOrdre.forEach((susp, idx) => {
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION${COLORS.RESET} (Élément n°${idx + 1}) : ${susp.cssCause}`);
            console.log(`         Texte impacté : "${susp.texte}"`);
        });

        console.log(`       ${COLORS.CYAN}👀 VALIDATION MANUELLE REQUISE : Un humain doit désactiver le CSS et vérifier si l'ordre d'affichage naturel du HTML (de haut en bas) reste compréhensible pour ces éléments.${COLORS.RESET}`);
        
        return { statut: "⚠️ À VÉRIFIER MANUELLEMENT", violations: [] };
    } 
    // 2️⃣ Bilan Parfait
    else {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : L'ordre visuel semble correspondre à l'ordre naturel du HTML. Aucune manipulation CSS ('order', 'reverse') détectée.`);
        return { statut: "✅ CONFORME", violations: [] };
    }
}