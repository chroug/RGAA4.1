import AxeBuilder from '@axe-core/playwright';
import extraireDonneesAutomatiques from './evaluate_dom.js';

// ==========================================
// IMPORTS DES CRITÈRES (Triés par Thèmes)
// ==========================================

// Thème 2, 3 et 5
import testerCritere2_1 from './criteres/theme_2_cadres/critere_2.1.js';
import testerCritere3_2 from './criteres/theme_3_couleurs/critere_3.2.js';
import testerCritere5_6 from './criteres/theme_5_tableaux/critere_5.6.js';

// Thème 8 : Éléments Obligatoires
import testerCritere8_1 from './criteres/theme_8_obligatoires/critere_8.1.js';
import testerCritere8_2 from './criteres/theme_8_obligatoires/critere_8.2.js';
import testerCritere8_3 from './criteres/theme_8_obligatoires/critere_8.3.js';
import testerCritere8_5 from './criteres/theme_8_obligatoires/critere_8.5.js';
import testerCritere8_9 from './criteres/theme_8_obligatoires/critere_8.9.js';

// Thème 9 : Structuration
import testerCritere9_3 from './criteres/theme_9_structuration/critere_9.3.js';
import testerCritere9_4 from './criteres/theme_9_structuration/critere_9.4.js';

// Thème 10 : Présentation
import testerCritere10_1 from './criteres/theme_10_presentation/critere_10.1.js';
import testerCritere10_8 from './criteres/theme_10_presentation/critere_10.8.js';

// Thème 11 : Formulaires
import testerCritere11_1 from './criteres/theme_11_formulaires/critere_11.1.js';
import testerCritere11_6 from './criteres/theme_11_formulaires/critere_11.6.js';
import testerCritere11_8 from './criteres/theme_11_formulaires/critere_11.8.js';
import testerCritere11_9 from './criteres/theme_11_formulaires/critere_11.9.js';

export async function runAutomatique(page) {
    console.log("⚙️ Lancement de l'audit Automatique (Axe-core + Custom)...");

    // 1. Analyse Axe-Core globale
    const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

    const axeTargets = [];
    axeResults.violations.forEach(v => v.nodes.forEach(n => axeTargets.push(n.target[0])));

    // 2. Extraction des données DOM
    const dataDOM = await page.evaluate(extraireDonneesAutomatiques, axeTargets);

    // 3. Distribution des données à chaque module
    const resultats_globaux = {
        'critere_2.1': testerCritere2_1(axeResults, dataDOM.axeMap),
        'critere_3.2': testerCritere3_2(axeResults, dataDOM.axeMap),
        'critere_5.6': testerCritere5_6(axeResults, dataDOM.axeMap, dataDOM.customErrors),
        
        'critere_8.1': testerCritere8_1(dataDOM.customErrors),
        // 'critere_8.2': await testerCritere8_2(page),
        'critere_8.3': testerCritere8_3(axeResults, dataDOM.axeMap),
        'critere_8.5': testerCritere8_5(axeResults, dataDOM.axeMap),
        'critere_8.9': testerCritere8_9(axeResults, dataDOM.axeMap, dataDOM.customErrors),
        
        'critere_9.3': testerCritere9_3(axeResults, dataDOM.axeMap),
        'critere_9.4': testerCritere9_4(dataDOM.customErrors),
        
        'critere_10.1': testerCritere10_1(dataDOM.customErrors),
        'critere_10.8': testerCritere10_8(axeResults, dataDOM.axeMap),
        
        'critere_11.1': testerCritere11_1(axeResults, dataDOM.axeMap),
        'critere_11.6': testerCritere11_6(dataDOM.customErrors),
        'critere_11.8': testerCritere11_8(dataDOM.customErrors),
        'critere_11.9': testerCritere11_9(axeResults, dataDOM.axeMap)
    };

    return resultats_globaux;
}