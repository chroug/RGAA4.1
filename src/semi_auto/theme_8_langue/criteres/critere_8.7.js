import { askGemma } from '../../utils/ai_helper.js';
import { promptMultilingue } from '../prompts.js';

export default async function testerCritere8_7(passagesHTML) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };

    for (let i = 0; i < passagesHTML.length; i++) {
        // Attention : il faut s'assurer que tu envoies bien le code HTML à l'IA, pas juste le texte brut
        const extraitHTML = passagesHTML[i].html || passagesHTML[i]; 
        
        process.stdout.write(`   🧠 [critere_8.7] Détection IA multilingue ${i + 1}/${passagesHTML.length}... `);

        const resIA = await askGemma(promptMultilingue(extraitHTML));

        const aUneErreur = resIA.statut === "NON_CONFORME";

        if (aUneErreur) {
            console.log(`❌ Non Conforme (${resIA.explication})`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({
                description: `Erreur de balisage de langue : ${resIA.explication}`,
                html: extraitHTML
            });
        } else {
            console.log(`✅ Conforme (${resIA.explication || "Vérifié par l'IA"})`);
        }
    }

    return resultat;
}