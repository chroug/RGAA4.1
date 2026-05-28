export default function testerCritere11_8(customErrors) {
    let erreursTotales = [];

    if (customErrors.selectsNonGroupes && customErrors.selectsNonGroupes.length > 0) {
        erreursTotales = customErrors.selectsNonGroupes.map(e => ({
            ...e,
            raison: "[Custom] Balise <select> longue (>= 4 options) sans utilisation de <optgroup>.",
            axe_rule_id: "custom-select"
        }));
    }

    if (erreursTotales.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreursTotales, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}