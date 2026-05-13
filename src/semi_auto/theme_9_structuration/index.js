import extraireStructureDOM from './evaluate_dom.js';
import testerCritere9_1 from './criteres/critere_9.1.js';
import testerCritere9_2 from './criteres/critere_9.2.js'; // 👈 Ajout de l'import pour le 9.2

export default async function runTheme9(page, resultats_globaux) {
    // 1. On injecte le script dans la page pour extraire TOUTES les données du Thème 9
    const data = await page.evaluate(extraireStructureDOM);
    
    if (!data) return;

    // // 2. On lance l'évaluation du Critère 9.1
    // const res9_1 = await testerCritere9_1(
    //     data.erreursAlgo9_1, 
    //     data.titresAAnalyser, 
    //     data.fauxTitresPotentiels
    // );
    // resultats_globaux["critere_9.1"] = res9_1;

    // 3. On lance l'évaluation du Critère 9.2 (NOUVEAU)
    const res9_2 = await testerCritere9_2(
        data.erreursAlgo9_2, 
        data.navsAAnalyser, 
        data.suspicions9_2
    );
    resultats_globaux["critere_9.2"] = res9_2;
}