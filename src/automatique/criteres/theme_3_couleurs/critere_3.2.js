import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere3_2(axeResults, locatorsMap) {
    const erreurs = extraireErreursAxe(axeResults, locatorsMap, ['color-contrast']);
    
    if (erreurs.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreurs, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}