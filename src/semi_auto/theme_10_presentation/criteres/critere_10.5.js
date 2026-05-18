import { COLORS } from '../../../utils/terminalColors.js';

export default async function testerCritere10_5(suspicionsCouleurs) {
    console.log(`\n ℹ️  [critere_10.5] Déclarations couplées des couleurs CSS (Fond / Texte)...`);
    let violations = [];

    if (suspicionsCouleurs && suspicionsCouleurs.length > 0) {
        console.log(`    👁️  Analyse Heuristique : ${suspicionsCouleurs.length} déclaration(s) CSS orpheline(s) détectée(s) sur du texte.`);
        
        suspicionsCouleurs.forEach((susp, idx) => {
            violations.push({
                html: susp.html,
                css: susp.css,
                xpath: susp.cheminExact, // 👈 On l'ajoute au rapport JSON final
                raison: `[Test ${susp.test}] ${susp.erreur}`
            });
            
            console.log(`       ${COLORS.YELLOW}⚠️ SUSPICION${COLORS.RESET} (Test ${susp.test}) : ${susp.erreur}`);
            console.log(`         Règle CSS : ${susp.css}`);
            console.log(`         Chemin DOM : ${COLORS.CYAN}${susp.cheminExact}${COLORS.RESET}`); // 👈 Affichage clair pour l'auditeur
            console.log(`         Texte impacté : "${susp.texte}"`);
        });

        console.log(`       ${COLORS.CYAN}👀 VALIDATION MANUELLE REQUISE : Vérifiez visuellement si la couleur manquante est héritée d'un élément parent, ou si le texte reste bien lisible même si l'image de fond ne charge pas.${COLORS.RESET}`);
        
        return { statut: "⚠️ À VÉRIFIER MANUELLEMENT", violations };
        
    } else {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Toutes les couleurs de fond et de texte déclarées sont parfaitement couplées.`);
        return { statut: "✅ CONFORME", violations: [] };
    }
}   