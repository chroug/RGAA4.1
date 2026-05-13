import extraireLangueDOM from './evaluate_dom.js';
import testerCritere8_4 from './criteres/critere_8.4.js';
import testerCritere8_7 from './criteres/critere_8.7.js';
import testerCritere8_8 from './criteres/critere_8.8.js'; // 🔥 Nouvel import
import testerCritere8_10 from './criteres/critere_8.10.js';

export default async function runTheme8(page, resultats_globaux) {
    const data = await page.evaluate(extraireLangueDOM);
    
    if (!data) return;

    // 1. Évaluations
    // const res8_4 = await testerCritere8_4(data);
    const res8_7 = await testerCritere8_7(data.blocsTexte);
    const res8_8 = await testerCritere8_8(data.blocsTexte, data.erreursAlgo8_8);
    // const res8_10 = await testerCritere8_10(data.erreursAlgo8_10, data.suspicionsIA8_10); 

    // 2. Rangement global pour ton Dashboard
    // resultats_globaux["critere_8.4"] = res8_4;
    resultats_globaux["critere_8.7"] = res8_7;
    resultats_globaux["critere_8.8"] = res8_8;
    // resultats_globaux["critere_8.10"] = res8_10;
}