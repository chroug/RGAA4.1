import { askGemma } from '../../utils/ai_helper.js';
import { promptLienEvitement } from '../prompts.js';

export default async function testerCritere12_7(dataDOM) {
    let resultat = { statut: "❌ Non Conforme (NC)", violations: [] };

    // CORRECTION : S'il n'y a aucun lien, c'est une NON CONFORMITÉ (et pas NA)
    if (!dataDOM.liensTrouves || dataDOM.donneesLiens.length === 0) {
        console.log(`   ❌ [critere_12.7] Non Conforme : Aucun lien d'évitement trouvé.`);
        resultat.violations.push({
            description: "Absence totale de lien d'accès rapide ou d'évitement au début du document.",
            html: "N/A"
        });
        return resultat;
    }

    resultat.statut = "✅ Conforme (C)";

    for (let i = 0; i < dataDOM.donneesLiens.length; i++) {
        process.stdout.write(`   🧠 [critere_12.7] Analyse IA ${i + 1}/${dataDOM.donneesLiens.length}... `);

        const lienData = dataDOM.donneesLiens[i];
        
        // On envoie le HTML ET les indices techniques du DOM à l'IA
        const resIA = await askGemma(promptLienEvitement(lienData));

        const aUneErreur = resIA.contient_erreur === true || resIA.contient_erreur === "true";

        if (aUneErreur) {
            console.log(`❌ Non Conforme`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({
                description: `Lien d'évitement invalide. Explication : ${resIA.explication}`,
                html: lienData.html.replace(/\n/g, '')
            });
        } else {
            console.log(`✅ Conforme`);
        }
    }

    return resultat;
}