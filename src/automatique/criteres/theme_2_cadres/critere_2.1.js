import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere2_1(axeResults, locatorsMap) {
    let resultat = { statut: "✅ Conforme", violations: [] };
    
    // On extrait uniquement l'erreur "frame-title" d'Axe
    resultat.violations = extraireErreursAxe(axeResults, locatorsMap, ['frame-title']);

    if (resultat.violations.length > 0) resultat.statut = "❌ Non conforme (Axe-core)";
    
    return resultat;
}