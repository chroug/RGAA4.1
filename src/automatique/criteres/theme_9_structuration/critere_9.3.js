import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere9_3(axeResults, locatorsMap) {
    const erreurs = extraireErreursAxe(axeResults, locatorsMap, ['list', 'listitem', 'dlitem']);
    
    if (erreurs.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreurs, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}