import extraireFormulairesDOM from './evaluate_dom.js';
import testerCritere11_2 from './criteres/critere_11.2.js';
import testerCritere11_5 from './criteres/critere_11.5.js';
import testerCritere11_7 from './criteres/critere_11.7.js';
import testerCritere11_10 from './criteres/critere_11.10.js';
import testerCritere11_13 from './criteres/critere_11.13.js';

export default async function runTheme11(page, resultats_globaux) {
    // 1. Extraction globale depuis le navigateur
    const data = await page.evaluate(extraireFormulairesDOM);
    
    // 👈 Ajout du compteur 11.2 dans le log
    console.log(`   📝 Analyse des formulaires (11.2/Pertinence: ${data.champs11_2.length}, 11.5/Groupes: ${data.champs11_5.length}, 11.10/Requis: ${data.champs11_10.length}, 11.13/Autocomplete: ${data.champsPersos.length})...`);

    // 2. Évaluations ciblées
    const res11_2 = await testerCritere11_2(data.champs11_2);
    const res11_5 = await testerCritere11_5(data.champs11_5);
    const res11_7 = await testerCritere11_7(data.champs11_7);
    const res11_10 = await testerCritere11_10(data.champs11_10);
    const res11_13 = await testerCritere11_13(data.champsPersos);

    // 3. Rangement dans le rapport global
    resultats_globaux["critere_11.2"] = res11_2;
    resultats_globaux["critere_11.5"] = res11_5;
    resultats_globaux["critere_11.7"] = res11_7;
    resultats_globaux["critere_11.10"] = res11_10;
    resultats_globaux["critere_11.13"] = res11_13;
}