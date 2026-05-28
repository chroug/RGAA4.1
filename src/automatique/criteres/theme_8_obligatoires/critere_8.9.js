import { extraireErreursAxe } from '../../utils/axe_helper.js';

export default function testerCritere8_9(axeResults, locatorsMap, customErrors) {
    const axeErreurs = extraireErreursAxe(axeResults, locatorsMap, ['empty-heading', 'presentation-role-conflict']);
    
    const customErreurs = customErrors.balisesPresentation.map(e => ({
        ...e, // Injection des données SaaS (html, CSS, XPath, BoundingBox)
        raison: "[Custom] Utilisation de balises de présentation (b, i, u, s).",
        axe_rule_id: "custom-presentation"
    }));

    const erreursTotales = [...axeErreurs, ...customErreurs];
    
    if (erreursTotales.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreursTotales, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}