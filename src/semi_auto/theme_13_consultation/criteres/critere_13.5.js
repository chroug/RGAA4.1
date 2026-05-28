import { askGemma } from '../../utils/ai_helper.js';
import { promptContenuCryptique } from '../prompts.js';

export default async function testerCritere13_5(contenus13_5) {
    console.log(`\n ℹ️  [critere_13.5] Analyse des contenus cryptiques et émoticônes (IA)...`);
    
    let resultat = { statut: "✅ CONFORME", violations: [], conformites: [] };

    if (!contenus13_5 || contenus13_5.length === 0) {
        console.log(`       ✅ CONFORME : Aucun contenu cryptique (ASCII/émoticône) détecté sur la page.`);
        resultat.conformites.push({
            html: "N/A",
            selecteur_css: "N/A",
            xpath: "N/A",
            bounding_box: null,
            raison: "Aucun contenu cryptique (art ASCII, émoticône) nécessitant une alternative n'a été détecté."
        });
        return resultat;
    }

    for (let i = 0; i < contenus13_5.length; i++) {
        const item = contenus13_5[i];
        
        try {
            process.stdout.write(`       🧠 [critere_13.5] Analyse IA ${i + 1}/${contenus13_5.length}... `);

            const resIA = await askGemma(promptContenuCryptique(item));

            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`); 
                resultat.statut = "❌ NON CONFORME";
                resultat.violations.push({
                    ...item,
                    raison: `[13.5] ${resIA.explication}`
                });
            } else {
                console.log(`✅ Conforme (${resIA.explication})`);
                resultat.conformites.push({
                    ...item,
                    raison: `[13.5] ${resIA.explication}`
                });
            }

        } catch (error) {
            console.log(`⚠️ Erreur IA (${error.message})`);
        }
    }

    return resultat;
}