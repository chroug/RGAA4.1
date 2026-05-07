// theme_5_tableaux/index.js

import { COLORS } from '../../utils/terminalColors.js';
import extraireTableauxDOM from './evaluate_dom.js';
import testerCritere5_1 from './criteres/critere_5.1.js';
import testerCritere5_2 from './criteres/critere_5.2.js';
import testerCritere5_3 from './criteres/critere_5.3.js';
import testerCritere5_4 from './criteres/critere_5.4.js';
import testerCritere5_5 from './criteres/critere_5.5.js';
import testerCritere5_7 from './criteres/critere_5.7.js';
import testerCritere5_8 from './criteres/critere_5.8.js';

export default async function runTheme5(page, resultats_globaux) {
    // 1. Extraction des données
    const data = await page.evaluate(extraireTableauxDOM);

    if (!data) return;

    const nbData = data.tableaux ? data.tableaux.length : 0;
    const nbLayout = data.tableauxMiseEnForme ? data.tableauxMiseEnForme.length : 0;
    
    console.log(`  ${COLORS.BLUE}ℹ️  INFO${COLORS.RESET} : Analyse de ${nbData} tableau(x) de données et ${nbLayout} tableau(x) de mise en forme...`);

    // 2. Évaluation des critères (Tableaux de données)
    if (data.tableaux && data.tableaux.length > 0) {
        // resultats_globaux["critere_5.1"] = await testerCritere5_1(data.tableaux);
        // resultats_globaux["critere_5.2"] = await testerCritere5_2(data.tableaux);
        // resultats_globaux["critere_5.4"] = await testerCritere5_4(data.tableaux);
        // resultats_globaux["critere_5.5"] = await testerCritere5_5(data.tableaux);
        // resultats_globaux["critere_5.7"] = await testerCritere5_7(data.tableaux);
    } else {
        const naResult = { statut: "➖ Non Applicable (NA)", violations: [] };
        // resultats_globaux["critere_5.1"] = naResult;
        // resultats_globaux["critere_5.2"] = naResult;
        // resultats_globaux["critere_5.4"] = naResult;
        // resultats_globaux["critere_5.5"] = naResult; 
        // resultats_globaux["critere_5.7"] = naResult;
    }

    // 3. Évaluation des critères (Tableaux de mise en forme)
    if (data.tableauxMiseEnForme && data.tableauxMiseEnForme.length > 0) {
        resultats_globaux["critere_5.3"] = await testerCritere5_3(data.tableauxMiseEnForme);
        resultats_globaux["critere_5.8"] = await testerCritere5_8(data.tableauxMiseEnForme);
    } else {
        resultats_globaux["critere_5.3"] = { statut: "➖ Non Applicable (NA)", violations: [] };
        resultats_globaux["critere_5.8"] = { statut: "➖ Non Applicable (NA)", violations: [] };
    }
}