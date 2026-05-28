export default function testerCritere11_6(customErrors) {
    let erreursTotales = [];

    if (customErrors.fieldsetsInvalides && customErrors.fieldsetsInvalides.length > 0) {
        erreursTotales = customErrors.fieldsetsInvalides.map(e => ({
            ...e,
            raison: "[Custom] Balise <fieldset> sans <legend> associée.",
            axe_rule_id: "custom-fieldset"
        }));
    }

    if (erreursTotales.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreursTotales, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}