export default function testerCritere8_1(customErrors) {
    const violations = [];

    // On lit juste la variable du DOM Custom
    if (!customErrors.hasValidDoctype) {
        violations.push({ 
            html: "N/A",
            selecteur_css: "html",
            xpath: "/html",
            bounding_box: null,
            raison: "[Custom] Le DOCTYPE est absent ou invalide"
        });
    }

    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations: violations, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}