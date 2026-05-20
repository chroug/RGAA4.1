import extraireContenusConsultation from './evaluate_dom.js';
import testerCritere13_2 from './criteres/critere_13.2.js';
import testerCritere13_5 from './criteres/critere_13.5.js';

export default async function runTheme13(page, resultats_globaux) {
    console.log(`\n 👁️  [Thème 13] Analyse de la Consultation...`);

    // 1. Lancement du test des popups (Critère 13.2) - On passe directement l'objet 'page'
    const res13_2 = await testerCritere13_2(page);

    // 2. Extraction du DOM pour les critères sémantiques (13.5)
    const dataDOM = await page.evaluate(extraireContenusConsultation);
    console.log(`   📝 Extraction du DOM terminée (13.5/Contenus cryptiques : ${dataDOM.contents13_5?.length || 0} potentiels trouvés).`);

    // 3. Lancement du test des contenus cryptiques par l'IA (Critère 13.5)
    const res13_5 = await testerCritere13_5(dataDOM.contenus13_5);

    // 4. Enregistrement des résultats dans le rapport global d'audit
    resultats_globaux["critere_13.2"] = res13_2;
    resultats_globaux["critere_13.5"] = res13_5;
}