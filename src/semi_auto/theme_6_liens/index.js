// theme_6_liens/index.js

import extraireLiensDOM from './evaluate_dom.js';
import testerCritere6_2 from './criteres/critere_6.2.js';

export default async function runTheme6(page, resultats_globaux) {
    // 1. On lance le script dans le navigateur pour récupérer les liens
    const data = await page.evaluate(extraireLiensDOM);

    if (!data || !data.liens) return;

    console.log(`   🔗 Analyse de ${data.liens.length} liens...`);

    // 2. On évalue le critère SEULEMENT s'il y a des liens
    if (data.liens.length > 0) {
        const res6_2 = await testerCritere6_2(data.liens);
        // 3. On range le résultat dans le rapport global (C'est ce qu'il te manquait !)
        resultats_globaux["critere_6.2"] = res6_2;
    } else {
        // S'il n'y a aucun lien, on met "Non Applicable" direct
        resultats_globaux["critere_6.2"] = { statut: "➖ Non Applicable (NA)", violations: [] };
    }
}