import { COLORS } from '../../../utils/terminalColors.js';
// critere en full auto juste a besoin de la validation du evalutation DOM pour savoir si le tableau et decoratif ou non.
export default async function testerCritere5_8(tableauxMiseEnForme) {
    let violations = [];
    let conformites = [];
    let nbConformes = 0;

    for (const [index, tab] of tableauxMiseEnForme.entries()) {
        
        console.log(`\n  --- (Tableau ${index + 1}) ---`);
        console.log(`  ⚡ ANALYSE ALGO [Critère 5.8] (Tableau ${index + 1}) : Vérification des balises et attributs interdits...`);

        if (tab.erreurs58 && tab.erreurs58.length > 0) {
            const raisons = tab.erreurs58.join(' | ');
            violations.push({
                ...tab,
                raison: `Le tableau de mise en forme utilise des éléments propres aux tableaux de données : ${raisons}.`
            });
            console.log(`  ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} [Critère 5.8] (Tableau ${index + 1}) : Éléments interdits détectés (${raisons}).`);
        } else {
            console.log(`  ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} [Critère 5.8] (Tableau ${index + 1}) : Aucun élément de données trouvé.`);
            nbConformes++;
            conformites.push({
                ...tab,
                raison: "Aucun élément de données n'a été trouvé dans le tableau de mise en forme."
            });
        }
    }

    console.log(""); // Séparateur de fin de boucle

    if (violations.length > 0) return { statut: "❌ Non Conforme", violations, conformites };
    if (nbConformes > 0) return { statut: "✅ Conforme", violations: [], conformites };
    
    return { statut: "➖ Non Applicable (NA)", violations: [], conformites };
}