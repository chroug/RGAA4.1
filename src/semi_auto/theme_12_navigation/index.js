import extraireNavigationDOM from './evaluate_dom.js';
import testerCritere12_6 from './criteres/critere_12.6.js';
import testerCritere12_7 from './criteres/critere_12.7.js';

export default async function runTheme12(page, resultats_globaux) {
    // 1. Extraction globale (12.6 + 12.7)
    const dataDOM = await page.evaluate(extraireNavigationDOM);
    
    console.log(`   🧭 Analyse de la navigation et de la structure...`);

    // 2. Évaluation Algorithmique (12.6)
    const res12_6 = await testerCritere12_6(dataDOM.data12_6);

    // 3. Évaluation par l'IA (12.7)
    // On doit s'assurer de passer dataDOM.data12_7 à la fonction du 12.7 !
    const res12_7 = await testerCritere12_7(dataDOM.data12_7); 

    // 4. Rangement dans le rapport global
    resultats_globaux["critere_12.6"] = res12_6;
    resultats_globaux["critere_12.7"] = res12_7;
}