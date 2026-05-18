export default function testerCritere10_1(customErrors) {
    let resultat = { statut: "✅ Conforme", violations: [] };
    if (customErrors.balisesObsoletes && customErrors.balisesObsoletes.length > 0) {
        resultat.statut = "❌ Non conforme (Custom Playwright)";
        resultat.violations = customErrors.balisesObsoletes.map(e => ({
            regle: "custom-obsolete", description: "Utilisation de balises obsolètes (font, center, etc.).",
            elements_fautifs: [{ code_html: e.html, copier_coller_inspecteur: e.locators }]
        }));
    }
    return resultat;
}