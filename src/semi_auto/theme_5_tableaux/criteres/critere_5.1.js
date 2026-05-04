// theme_5_tableaux/criteres/critere_5.1.js

export default async function testerCritere5_1(tableaux) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };
    const tableauxComplexes = tableaux.filter(t => t.estComplexe);

    if (tableauxComplexes.length === 0) {
        return { statut: "➖ Non Applicable (NA)", violations: [] };
    }

    let nbErreurs = 0;

    for (let table of tableauxComplexes) {
        if (!table.aUnResume) {
            nbErreurs++;
            resultat.violations.push({
                description: "Ce tableau complexe n'a aucun résumé (ni <caption>, ni attribut 'summary', ni 'aria-describedby').",
                html: table.htmlComplet.substring(0, 300) + "..."
            });
        }
    }

    if (nbErreurs > 0) {
        console.log(`   ⚡ Algo [critere_5.1] Analyse... ❌ Non Conforme (${nbErreurs} tableau(x) complexe(s) sans résumé)`);
        resultat.statut = "❌ Non Conforme (NC)";
    } else {
        console.log(`   ⚡ Algo [critere_5.1] Analyse... ✅ Conforme`);
    }

    return resultat;
}