import { askGemma } from '../../utils/ai_helper.js';
import { promptMessageStatut } from '../prompts.js';

export default async function testerCritere7_5(messagesStatut) {
    let resultat = { statut: "➖ Non Applicable (NA)", violations: [] };

    if (!messagesStatut || messagesStatut.length === 0) return resultat;

    resultat.statut = "✅ Conforme (C)";
    
    // On limite à 5 éléments pour la rapidité
    const itemsATester = messagesStatut.slice(0, 5); 

    for (let i = 0; i < itemsATester.length; i++) {
        process.stdout.write(`   🧠 [critere_7.5] Analyse IA ${i + 1}/${itemsATester.length}... `);
        
        const html = itemsATester[i];
        const prompt = promptMessageStatut(html);
        const resIA = await askGemma(prompt);
        
        // Sécurité booléenne anti-plantage
        const aUneErreur = resIA.contient_erreur === true || resIA.contient_erreur === "true";
        
        if (aUneErreur) {
            console.log(`❌ Non Conforme (${resIA.attribut_aria_trouve || "Manquant"})`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({ 
                description: `Message de statut non vocalisé : ${resIA.explication}`, 
                html: html.replace(/\n/g, '') 
            });
        } else {
            console.log(`✅ Conforme (${resIA.attribut_aria_trouve})`);
        }
    }

    return resultat;
}