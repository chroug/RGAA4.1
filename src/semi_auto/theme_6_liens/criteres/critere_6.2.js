// theme_6_liens/criteres/critere_6.2.js

export default async function testerCritere6_2(dataLiens) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };

    // Si aucun lien n'a été trouvé, le critère est Non Applicable
    if (!dataLiens || dataLiens.length === 0) {
        return { statut: "➖ Non Applicable (NA)", violations: [] };
    }

    let nbErreurs = 0;

    // ⚡ Filtre Algorithmique instantané
    for (let i = 0; i < dataLiens.length; i++) {
        const lien = dataLiens[i];

        if (!lien.aUnIntitule) {
            nbErreurs++;
            resultat.violations.push({
                description: "Le lien n'a aucun intitulé (il est vide, ou l'image qu'il contient n'a pas d'attribut alt pertinent).",
                html: lien.html
            });
        }
    }

    // Décision finale et logs Console
    if (nbErreurs > 0) {
        console.log(`   ⚡ Algo [critere_6.2] Analyse... ❌ Non Conforme (${nbErreurs} lien(s) sans intitulé)`);
        resultat.statut = "❌ Non Conforme (NC)";
    } else {
        console.log(`   ⚡ Algo [critere_6.2] Analyse... ✅ Conforme (Tous les liens ont un intitulé)`);
    }

    return resultat;
}