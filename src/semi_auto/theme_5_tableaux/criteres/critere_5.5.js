import { askGemma } from '../../utils/ai_helper.js'; // Ajuste le chemin selon ton arborescence
import { prompt55_PertinenceTitre } from '../prompts.js';

export default async function testerCritere5_5(tableaux) {
    let violations = [];
    let nbConformes = 0;
    let nbTitresAnalyses = 0;

    const greenOpen = "\x1b[32m";
    const greenClose = "\x1b[0m";

    const redOpen = "\x1b[31m";
    const redClose = "\x1b[0m";

    for (const [index, tab] of tableaux.entries()) {
        // Le critère 5.5 ne s'applique QU'AUX tableaux qui ONT déjà un titre technique !
        if (!tab.aUnTitreTechnique || !tab.texteTitre) {
            continue; // Si pas de titre technique, c'est l'affaire du 5.4, le 5.5 ne s'applique pas.
        }

        nbTitresAnalyses++;
        console.log(`  🧠 IA (Critère 5.5) : Analyse de la pertinence du titre "${tab.texteTitre.substring(0, 30)}..." sur le tableau ${index + 1}...`);
        
        const prompt = prompt55_PertinenceTitre(tab.htmlComplet, tab.texteTitre);
        
        try {
            const reponseIA = await askGemma(prompt);
            
            if (reponseIA.statut === "NON_CONFORME") {
                violations.push({
                    tableau_index: index,
                    titre_fautif: tab.texteTitre,
                    raison: reponseIA.explication
                });
                console.log(`  ${redOpen}❌ NON CONFORME 5.5${redClose} : ${reponseIA.explication}`);
            } else {
                console.log(`  ${greenOpen}✅ VALIDE 5.5${greenClose} (Tableau ${index + 1}) : Titre pertinent et concis.`);
                nbConformes++;
            }
        } catch (e) {
            console.log(`  ${redOpen}❌ NON CONFORME 5.5${redClose} : ${e.message}`);
            violations.push({ tableau_index: index, raison: "Erreur IA lors de la validation du titre." });
        }
    }

    if (violations.length > 0) return { statut: "❌ Non Conforme", violations };
    if (nbTitresAnalyses === 0) return { statut: "➖ Non Applicable (NA)", violations: [] }; // Aucun tableau avec titre
    if (nbConformes > 0) return { statut: "✅ Conforme", violations: [] };
    
    return { statut: "➖ Non Applicable (NA)", violations: [] };
}