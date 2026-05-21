import { askGemma } from '../../utils/ai_helper.js';
import { promptPertinenceCryptique } from '../prompts.js';

export default async function testerCritere13_6(contenus13_5) {
    console.log(`\n ℹ️  [critere_13.6] Évaluation de la pertinence des alternatives (IA)...`);
    
    let resultat = { statut: "✅ CONFORME", violations: [], conformites: [] };

    if (!contenus13_5 || contenus13_5.length === 0) {
        console.log(`       ✅ CONFORME : Aucun contenu cryptique (ASCII/émoticône) à évaluer sur la page.`);
        return resultat;
    }

    for (let i = 0; i < contenus13_5.length; i++) {
        const item = contenus13_5[i];
        
        try {
            process.stdout.write(`       🧠 [critere_13.6] Analyse IA ${i + 1}/${contenus13_5.length}... `);

            // On utilise le prompt dédié au 13.6 (qui juge la PERTINENCE et non juste la présence)
            const resIA = await askGemma(promptPertinenceCryptique(item));

            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`); 
                resultat.statut = "❌ NON CONFORME";
                resultat.violations.push({
                    html: item.html,
                    raison: `[13.6] ${resIA.explication}`
                });
            } else if (resIA.statut === "CONFORME") {
                console.log(`✅ Conforme (${resIA.explication})`);
                resultat.conformites.push({
                    html: item.html,
                    raison: `[13.6] ${resIA.explication}`
                });
            } else {
                // Cas NON_APPLICABLE (Si l'IA juge que c'est un faux positif, ex: un simple morceau de code)
                console.log(`➖ Ignoré (Faux positif : ${resIA.explication})`);
            }

        } catch (error) {
            console.log(`⚠️ Erreur IA (${error.message})`);
        }
    }

    return resultat;
}