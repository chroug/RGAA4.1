import { askGemma } from '../../utils/ai_helper.js';
import { promptPertinenceLegende } from '../prompts.js';

export default async function testerCritere11_7(champs11_7) {
    console.log(`\n ℹ️  [critere_11.7] Analyse de la pertinence des légendes de groupes (IA)...`);
    
    let resultat = { statut: "✅ CONFORME", violations: [] };

    if (!champs11_7 || champs11_7.length === 0) {
        console.log(`       ✅ CONFORME : Aucun groupe avec légende à analyser.`);
        return resultat;
    }

    for (let i = 0; i < champs11_7.length; i++) {
        const groupe = champs11_7[i];
        
        try {
            process.stdout.write(`       🧠 [critere_11.7] Analyse IA ${i + 1}/${champs11_7.length}... `);

            const resIA = await askGemma(promptPertinenceLegende(groupe.promptData));

            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`); 
                resultat.statut = "❌ NON CONFORME";
                resultat.violations.push({
                    html: groupe.html,
                    raison: `[11.7] Erreur de pertinence : ${resIA.explication}`
                });
            } else {
                console.log(`✅ Conforme (${resIA.explication})`);
            }

        } catch (error) {
            console.log(`⚠️ Erreur IA (${error.message})`);
        }
    }

    if (resultat.statut === "✅ CONFORME") {
        console.log(`       ✅ CONFORME (Toutes les légendes ont été jugées pertinentes par l'IA)`);
    }

    return resultat;
}