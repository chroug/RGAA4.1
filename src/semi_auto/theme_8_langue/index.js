import extraireLangueDOM from './evaluate_dom.js';
import testerCritere8_4 from './criteres/critere_8.4.js';
import testerCritere8_7 from './criteres/critere_8.7.js';

// 🔥 N'oublie pas d'ajouter "resultats_globaux" ici
export default async function runTheme8(page, resultats_globaux) {
    const data = await page.evaluate(extraireLangueDOM);
    
    if (!data) return;

    // 1. Évaluations
    const res8_4 = await testerCritere8_4(data);
    const res8_7 = await testerCritere8_7(data.blocsTexte);
    // ==========================================
    // 🔥 LA CORRECTION EST ICI : Le rangement global
    // ==========================================
    resultats_globaux["critere_8.4"] = res8_4;
    resultats_globaux["critere_8.7"] = res8_7;
}