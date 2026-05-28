import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritereX_Y(axeResults, axeMap) {
    const erreurs = extraireErreursAxe(axeResults, axeMap, ['label', 'select-name']);

    if (erreurs.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreurs, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}
