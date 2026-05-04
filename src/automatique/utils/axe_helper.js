export function extraireErreursAxe(axeResults, locatorsMap, axeRuleIds) {
    const violations = [];
    axeResults.violations.forEach(v => {
        // Si l'erreur Axe correspond à ce qu'on cherche
        if (axeRuleIds.includes(v.id)) {
            v.nodes.forEach(node => {
                violations.push({
                    regle: v.id,
                    description: v.help,
                    elements_fautifs: [{
                        code_html: node.html.replace(/\n/g, ''),
                        copier_coller_inspecteur: locatorsMap[node.target[0]]
                    }]
                });
            });
        }
    });
    return violations;
}