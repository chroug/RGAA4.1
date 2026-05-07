import { askGemma } from '../../utils/ai_helper.js'; // Ajuste ce chemin si nécessaire
import { prompt54_TitreVisuel } from '../prompts.js';

export default async function testerCritere5_4(tableaux) {
    let violations = [];
    let nbConformes = 0;

    const greenOpen = "\x1b[32m";
    const greenClose = "\x1b[0m";

    const redOpen = "\x1b[31m";
    const redClose = "\x1b[0m";

    for (const [index, tab] of tableaux.entries()) {
        // 1. Si le tableau a un titre technique (caption, aria, title...), le critère est validé.
        if (tab.aUnTitreTechnique) {
            console.log(`  ${greenOpen}✅ VALIDE 5.4${greenClose} (Tableau ${index + 1}) : Titre technique valide trouvé.`);
            nbConformes++;
            continue;
        }

        // 2. S'il n'a PAS de titre technique, l'IA vérifie s'il y a un "faux" titre visuel juste au-dessus
        console.log(`  ${redOpen}❌ NON CONFORME 5.4${redClose} (Tableau ${index + 1}) : Pas de titre technique trouvé.`);
        const prompt = prompt54_TitreVisuel(tab.htmlComplet, tab.texteAvant);
        
        try {
            const reponseIA = await askGemma(prompt);
            
            if (reponseIA.statut === "NON_CONFORME") {
                violations.push({
                    tableau_index: index,
                    html: tab.htmlComplet.substring(0, 150) + "...",
                    raison: reponseIA.explication
                });
                console.log(`  ${redOpen}❌ NON CONFORME 5.4${redClose} : ${reponseIA.explication}`);
            } else {
                // Si l'IA confirme que ce n'est pas un titre visuel, c'est que le tableau n'a juste pas de titre (c'est Conforme)
                console.log(`  ${greenOpen}✅ VALIDE 5.4${greenClose} (Tableau ${index + 1}) : Pas de titre visuel détecté, tableau sans titre autorisé.`);                nbConformes++;
            }
        } catch (e) {
            console.log(`  ⚠️ Erreur IA 5.4 : ${e.message}`);
            violations.push({ tableau_index: index, raison: "Erreur IA lors de la détection du faux titre." });
        }
    }

    if (violations.length > 0) return { statut: "❌ Non Conforme", violations };
    if (nbConformes > 0) return { statut: "✅ Conforme", violations: [] };
    return { statut: "➖ Non Applicable (NA)", violations: [] };
}