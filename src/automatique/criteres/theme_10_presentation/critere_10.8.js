import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere10_8(axeResults, locatorsMap) {
    const erreurs = extraireErreursAxe(axeResults, locatorsMap, ['aria-hidden-focus', 'aria-hidden-body']);
    
    if (erreurs.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreurs, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}