import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere11_1(axeResults, locatorsMap) {
    const erreurs = extraireErreursAxe(axeResults, locatorsMap, ['label', 'label-title-only']);
    
    if (erreurs.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreurs, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}