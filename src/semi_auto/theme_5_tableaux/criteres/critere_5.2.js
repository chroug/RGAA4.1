// theme_5_tableaux/criteres/critere_5.2.js

import { askGemma } from '../../utils/ai_helper.js';
import { promptPertinenceTableau } from '../prompts.js';

export default async function testerCritere5_2(tableaux) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };
    
    // On ne teste l'IA que sur les tableaux complexes qui ont effectivement un résumé (le 5.1 gère les absents)
    const tableauxATester = tableaux.filter(t => t.estComplexe && t.aUnResume);

    if (tableauxATester.length === 0) {
        return { statut: "➖ Non Applicable (NA)", violations: [] };
    }

    for (let i = 0; i < tableauxATester.length; i++) {
        const table = tableauxATester[i];
        process.stdout.write(`   🧠 [critere_5.2] Analyse IA du résumé ${i + 1}/${tableauxATester.length}... `);

        const prompt = promptPertinenceTableau(table.htmlComplet, table.texteResume);
        const resIA = await askGemma(prompt);

        if (resIA.statut === "NON_CONFORME") {
            console.log(`❌ Non Conforme (${resIA.explication})`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({
                description: `Résumé non pertinent : ${resIA.explication}`,
                html: `Résumé trouvé : "${table.texteResume}"`
            });
        } else {
            console.log(`✅ Conforme`);
        }
    }

    return resultat;
}