// theme_5_tableaux/criteres/critere_5.1.js

export default async function testerCritere5_1(tableaux) {
    let resultat = { statut: "✅ Conforme (C)", violations: [], conformites: [] };
    const tableauxComplexes = tableaux.filter(t => t.estComplexe);

    if (tableauxComplexes.length === 0) {
        return { statut: "➖ Non Applicable (NA)", violations: [], conformites: [] };
    }

    let nbErreurs = 0;

    for (let table of tableauxComplexes) {
        if (!table.aUnResume) {
            nbErreurs++;
            resultat.violations.push({
                ...table,
                raison: "Ce tableau complexe n'a aucun résumé (ni <caption>, ni attribut 'summary', ni 'aria-describedby')."
            });
        } else {
            resultat.conformites.push({
                ...table,
                raison: "Ce tableau complexe possède un résumé."
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