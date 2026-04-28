import extraireNavigationDOM from './evaluate_dom.js';
import testerCritere12_7 from './criteres/critere_12.7.js';

export default async function runTheme12(page, resultats_globaux) {
    // 1. Extraction avec les nouvelles données
    const dataDOM = await page.evaluate(extraireNavigationDOM);
    
    console.log(`   🧭 Analyse de la navigation...`);

    // 2. Évaluation (on passe tout l'objet, même s'il est vide)
    const res12_7 = await testerCritere12_7(dataDOM);

    // 3. Rangement dans le rapport global
    resultats_globaux["critere_12.7"] = res12_7;
}