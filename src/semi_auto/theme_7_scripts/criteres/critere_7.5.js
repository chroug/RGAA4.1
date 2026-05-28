import { askGemma } from '../../utils/ai_helper.js';
import { promptMessageStatut } from '../prompts.js';

export default async function testerCritere7_5(messagesStatut) {
    let resultat = { statut: "➖ Non Applicable (NA)", violations: [], conformites: [] };

    if (!messagesStatut || messagesStatut.length === 0) return resultat;

    resultat.statut = "✅ Conforme (C)";
    
    // On limite à 5 éléments pour la rapidité
    const itemsATester = messagesStatut.slice(0, 5); 

    for (let i = 0; i < itemsATester.length; i++) {
        process.stdout.write(`   🧠 [critere_7.5] Analyse IA ${i + 1}/${itemsATester.length}... `);
        
        // ⚠️ CORRECTION : L'élément est maintenant un objet SaaS complet
        const itemSaaS = itemsATester[i]; 
        
        // On extrait juste le texte HTML pour l'envoyer au prompt de l'IA
        const htmlString = itemSaaS.html; 
        
        const prompt = promptMessageStatut(htmlString);
        const resIA = await askGemma(prompt);
        
        // Sécurité booléenne anti-plantage
        const aUneErreur = resIA.contient_erreur === true || resIA.contient_erreur === "true";
        
        if (aUneErreur) {
            console.log(`❌ Non Conforme (${resIA.attribut_aria_trouve || "Manquant"})`);
            resultat.statut = "❌ Non Conforme (NC)";
            
            // 🚀 SAAS : On injecte l'objet complet pour garder xpath, selecteur_css, etc.
            resultat.violations.push({ 
                ...itemSaaS, 
                raison: `Message de statut non vocalisé : ${resIA.explication}`, 
                html: htmlString.replace(/\n/g, '') 
            });
        } else {
            console.log(`✅ Conforme (${resIA.attribut_aria_trouve})`);
            resultat.conformites.push({
                ...itemSaaS,
                raison: `Message de statut conforme : ${resIA.explication}`,
                html: htmlString.replace(/\n/g, '')
            });
        }
    }

    return resultat;
}