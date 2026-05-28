export default function testerCritere9_4(customErrors) {
    let erreursTotales = [];

    if (customErrors.citationsInvalides && customErrors.citationsInvalides.length > 0) {
        erreursTotales = customErrors.citationsInvalides.map(e => ({
            ...e, // Injection des données SaaS
            raison: "[Custom] Attribut 'cite' présent mais vide.",
            axe_rule_id: "custom-citation"
        }));
    }

    if (erreursTotales.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreursTotales, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}