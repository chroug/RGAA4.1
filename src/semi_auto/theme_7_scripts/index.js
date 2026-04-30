import extraireScriptsDOM from './evaluate_dom.js';
import testerCritere7_5 from './criteres/critere_7.5.js';

export default async function runTheme7(page, resultats_globaux) {
    // On attend que la page soit complètement chargée pour éviter les faux positifs sur les messages de statut qui apparaissent pendant le chargement.
    await new Promise(r => setTimeout(r, 1500));
    // 1. Extraction DOM
    const data = await page.evaluate(extraireScriptsDOM);
    
    if (!data.messagesStatut || data.messagesStatut.length === 0) return;

    console.log(`   ⚙️ Analyse de ${data.messagesStatut.length} messages de statut/erreur...`);

    // 2. Évaluation du critère
    const res7_5 = await testerCritere7_5(data.messagesStatut);

    // 3. Rangement dans le rapport global
    resultats_globaux["critere_7.5"] = res7_5;
}