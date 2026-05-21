import extraireContenusConsultation from './evaluate_dom.js';
import testerCritere13_2 from './criteres/critere_13.2.js';
import testerCritere13_5 from './criteres/critere_13.5.js';
import testerCritere13_6 from './criteres/critere_13.6.js';
import testerCritere13_7 from './criteres/critere_13.7.js';

export default async function runTheme13(page, resultats_globaux) {
    console.log(`\n 👁️  [Thème 13] Analyse de la Consultation...`);

    // 1. Test 13.2 (Popups automatiques)
    // const res13_2 = await testerCritere13_2(page);

    // 2. Extraction du DOM
    const dataDOM = await page.evaluate(extraireContenusConsultation);
    console.log(`   📝 Extraction terminée : ${dataDOM.contenus13_5.length} contenus cryptiques, ${dataDOM.contenus13_7.length} éléments animés.`);

    // 3. Test 13.5 (IA - Présence de l'alternative)
    // const res13_5 = await testerCritere13_5(dataDOM.contenus13_5);

    // 4. Test 13.6 (IA - Pertinence de l'alternative)
    const res13_6 = await testerCritere13_6(dataDOM.contenus13_5);

    // 5. Test 13.7 (Calcul géométrique des surfaces de flashs)
    // const res13_7 = await testerCritere13_7(dataDOM.contenus13_7);

    // 6. Rangement des bilans complets dans les rapports globaux
    // resultats_globaux["critere_13.2"] = res13_2;
    // resultats_globaux["critere_13.5"] = res13_5;
    resultats_globaux["critere_13.6"] = res13_6;
    // resultats_globaux["critere_13.7"] = res13_7;
}