import { askGemma } from '../../utils/ai_helper.js';
import { promptPertinenceEtiquette } from '../prompts.js';

export default async function testerCritere11_2(champs11_2) {
    console.log(`\n ℹ️  [critere_11.2] Analyse de la pertinence des étiquettes (IA)...`);
    
    let resultat = { statut: "✅ CONFORME", violations: [], conformites: [] };

    if (!champs11_2 || champs11_2.length === 0) {
        console.log(`       ✅ CONFORME : Aucun champ avec étiquette à analyser.`);
        resultat.conformites.push({
            html: "N/A",
            selecteur_css: "N/A",
            xpath: "N/A",
            bounding_box: null,
            raison: "Aucun champ de formulaire nécessitant une étiquette n'a été détecté."
        });
        return resultat;
    }

    for (let i = 0; i < champs11_2.length; i++) {
        const champ = champs11_2[i];
        
        try {
            // Affichage de la progression sur une seule ligne (comme dans ton 11.13)
            process.stdout.write(`       🧠 [critere_11.2] Analyse IA ${i + 1}/${champs11_2.length}... `);

            // Appel de l'IA avec ton utilitaire Gemma
            const resIA = await askGemma(promptPertinenceEtiquette(champ.promptData));

            // Analyse de la réponse
            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`); 
                resultat.statut = "❌ NON CONFORME";
                resultat.violations.push({
                    ...champ,
                    raison: `[11.2] Erreur de pertinence : ${resIA.explication}`
                });
            } else {
                console.log(`✅ Conforme (${resIA.explication})`);
                resultat.conformites.push({
                    ...champ,
                    raison: `[11.2] Pertinence de l'étiquette validée par l'IA : ${resIA.explication}`
                });
            }

        } catch (error) {
            // En cas d'erreur de l'API (timeout, format JSON cassé...), on le signale proprement
            console.log(`⚠️ Erreur IA (${error.message})`);
        }
    }

    if (resultat.statut === "✅ CONFORME") {
        console.log(`       ✅ CONFORME (Toutes les étiquettes ont été jugées pertinentes par l'IA)`);
    }

    return resultat;
}