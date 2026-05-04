// theme_5_tableaux/index.js

import extraireTableauxDOM from './evaluate_dom.js';
import testerCritere5_1 from './criteres/critere_5.1.js';
import testerCritere5_2 from './criteres/critere_5.2.js';
import testerCritere5_7 from './criteres/critere_5.7.js';

export default async function runTheme5(page, resultats_globaux) {
    // 1. Extraction des données
    const data = await page.evaluate(extraireTableauxDOM);

    if (!data || !data.tableaux) return;

    console.log(`   📊 Analyse de ${data.tableaux.length} tableau(x)...`);

    // 2. Évaluation des critères
    if (data.tableaux.length > 0) {
        resultats_globaux["critere_5.1"] = await testerCritere5_1(data.tableaux);
        resultats_globaux["critere_5.2"] = await testerCritere5_2(data.tableaux);
        resultats_globaux["critere_5.7"] = await testerCritere5_7(data.tableaux);
    } else {
        // Si aucun tableau, tout est Non Applicable
        const naResult = { statut: "➖ Non Applicable (NA)", violations: [] };
        resultats_globaux["critere_5.1"] = naResult;
        resultats_globaux["critere_5.2"] = naResult;
        resultats_globaux["critere_5.7"] = naResult;
    }
}