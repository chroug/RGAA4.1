export default function testerCritere10_1(customErrors) {
    let erreursTotales = [];

    if (customErrors.balisesObsoletes && customErrors.balisesObsoletes.length > 0) {
        erreursTotales = customErrors.balisesObsoletes.map(e => ({
            ...e, // 👈 INJECTION DES DONNÉES SAAS (html, css, xpath, etc.)
            raison: "[Custom] Utilisation de balises obsolètes (font, center, marquee, blink, etc.).",
            axe_rule_id: "custom-obsolete"
        }));
    }

    if (erreursTotales.length > 0) {
        return { statut: "❌ NON CONFORME", violations: erreursTotales, conformites: [] };
    } else {
        return { statut: "✅ CONFORME", violations: [], conformites: [] };
    }
}