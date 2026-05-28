import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere5_6(axeResults, locatorsMap, customErrors) {
    // 1. On récupère les erreurs Axe
    const axeErreurs = extraireErreursAxe(axeResults, locatorsMap, ['td-headers-attr', 'th-has-data-cells']);
    
    // 2. On récupère nos erreurs Custom
    const customErreurs = customErrors.thSansScope.map(e => ({
        ...e,
        raison: "[Custom] Balise <th> sans attribut 'scope' ou 'id'.",
        axe_rule_id: "custom-th-scope"
    }));

    // 3. On fusionne les deux
    const erreursTotales = [...axeErreurs, ...customErreurs];

    if (erreursTotales.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreursTotales, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}