import extraireTheme10DOM from './evaluate_dom.js';
import testerCritere10_2 from './criteres/critere_10.2.js';
import testerCritere10_3 from './criteres/critere_10.3.js';
import testerCritere10_5 from './criteres/critere_10.5.js'; // 👈 1. ON AJOUTE L'IMPORT DU 10.5

export default async function runTheme10(page, resultats_globaux) {
    // 1. On lance le scan unique qui récupère les données pour TOUT le thème 10
    const data = await page.evaluate(extraireTheme10DOM);
    
    if (!data) return;

    // 2. Lancement du 10.2 (Injections CSS & Images de fond)
    // const res10_2 = await testerCritere10_2(
    //     data.textesCSSAAnalyser, 
    //     data.imagesDeFondAVerifier
    // );
    // resultats_globaux["critere_10.2"] = res10_2;

    // // 3. Lancement du 10.3 (Ordre de lecture / Flexbox & Grid)
    // const res10_3 = await testerCritere10_3(
    //     data.suspicionsOrdre
    // );
    // resultats_globaux["critere_10.3"] = res10_3;

    // 4. Lancement du 10.5 (Couleurs et Fonds) 👈 2. ON AJOUTE L'EXÉCUTION DU 10.5
    const res10_5 = await testerCritere10_5(
        data.suspicionsCouleurs
    );
    resultats_globaux["critere_10.5"] = res10_5;
}