import extraireFormulairesDOM from './evaluate_dom.js';
import testerCritere11_5 from './criteres/critere_11.5.js';
import testerCritere11_10 from './criteres/critere_11.10.js';
import testerCritere11_13 from './criteres/critere_11.13.js';

export default async function runTheme11(page, resultats_globaux) {
    // 1. Extraction globale depuis le navigateur
    const data = await page.evaluate(extraireFormulairesDOM);
    
    console.log(`   📝 Analyse des formulaires (11.5/Groupes: ${data.champs11_5.length}, 11.10/Requis: ${data.champs11_10.length}, 11.13/Autocomplete: ${data.champsPersos.length})...`);

    // 2. Évaluations ciblées
    const res11_5 = await testerCritere11_5(data.champs11_5);
    const res11_10 = await testerCritere11_10(data.champs11_10);
    const res11_13 = await testerCritere11_13(data.champsPersos);

    // 3. Rangement dans le rapport global
    resultats_globaux["critere_11.5"] = res11_5;
    resultats_globaux["critere_11.10"] = res11_10;
    resultats_globaux["critere_11.13"] = res11_13;
}