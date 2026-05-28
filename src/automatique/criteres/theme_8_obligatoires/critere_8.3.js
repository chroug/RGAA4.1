import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere8_3(axeResults, locatorsMap) {
    const erreurs = extraireErreursAxe(axeResults, locatorsMap, ['html-has-lang', 'html-lang-valid']);
    
    if (erreurs.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreurs, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}