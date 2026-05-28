// src/automatique/utils/axe_helper.js

export function extraireErreursAxe(axeResults, locatorsMap, axeRuleIds) {
    const violations = [];
    axeResults.violations.forEach(v => {
        if (axeRuleIds.includes(v.id)) {
            v.nodes.forEach(node => {
                const axeTarget = node.target[0] || "N/A";
                
                // On récupère l'objet magique généré par dom_helpers !
                const saasData = (locatorsMap && locatorsMap[axeTarget]) ? locatorsMap[axeTarget] : {};

                violations.push({
                    ...saasData,
                    html: node.html.replace(/\n/g, ''), // On garde le HTML exact d'Axe-core
                    raison: `[Règle Axe : ${v.id}] ${v.help} - ${v.failureSummary || ''}`.replace(/\n/g, ' '),
                    axe_rule_id: v.id
                });
            });
        }
    });
    return violations;
}