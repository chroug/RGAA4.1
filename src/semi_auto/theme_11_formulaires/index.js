import extraireFormulairesDOM from './evaluate_dom.js';
import testerCritere11_2 from './criteres/critere_11.2.js';
import testerCritere11_5 from './criteres/critere_11.5.js';
import testerCritere11_7 from './criteres/critere_11.7.js';
import testerCritere11_10 from './criteres/critere_11.10.js';
import testerCritere11_13 from './criteres/critere_11.13.js';

export default async function runTheme11(page, resultats_globaux) {
    // 1. Extraction globale depuis le navigateur
    let data = await page.evaluate(extraireFormulairesDOM);
    
    // 🛡️ SÉCURITÉ : Si la page renvoie vide, on crée un objet vide pour éviter le crash
    if (!data) data = {};

    // 🛡️ SÉCURITÉ : On sécurise TOUS les tableaux. S'ils sont absents, on met un tableau vide []
    const champs11_2 = data.champs11_2 || [];
    const champs11_5 = data.champs11_5 || [];
    const champs11_7 = data.champs11_7 || [];
    const champs11_10 = data.champs11_10 || [];
    const champsPersos = data.champsPersos || [];

    // 👈 Ton compteur dans le log (qui utilise maintenant les variables sécurisées !)
    console.log(`   📝 Analyse des formulaires (11.2/Pertinence: ${champs11_2.length}, 11.5/Groupes: ${champs11_5.length}, 11.10/Requis: ${champs11_10.length}, 11.13/Autocomplete: ${champsPersos.length})...`);

    // 2. Évaluations ciblées avec les tableaux sécurisés
    const res11_2 = await testerCritere11_2(champs11_2);
    const res11_5 = await testerCritere11_5(champs11_5);
    const res11_7 = await testerCritere11_7(champs11_7);
    const res11_10 = await testerCritere11_10(champs11_10);
    const res11_13 = await testerCritere11_13(champsPersos);

    // 3. Rangement dans le rapport global
    resultats_globaux["critere_11.2"] = res11_2;
    resultats_globaux["critere_11.5"] = res11_5;
    resultats_globaux["critere_11.7"] = res11_7;
    resultats_globaux["critere_11.10"] = res11_10;
    resultats_globaux["critere_11.13"] = res11_13;
}