import { askGemma } from '../../utils/ai_helper.js'; // Ajuste si besoin
import { prompt53_Linearisation } from '../prompts.js';
import { COLORS } from '../../../utils/terminalColors.js';

export default async function testerCritere5_3(tableauxMiseEnForme) {
    let violations = [];
    let conformites = [];
    let nbConformes = 0;

    for (const [index, tab] of tableauxMiseEnForme.entries()) {
        let tableauEstValide = true;

        // 🏷️ SÉPARATEUR VISUEL POUR GROUPER PAR TABLEAU
        console.log(`\n  --- (Tableau ${index + 1}) ---`);

        // 1️⃣ Vérification Algorithmique
        console.log(`  ⚡ ANALYSE ALGO [Critère 5.3] (Tableau ${index + 1}) : Vérification de l'attribut role="presentation"...`);

        if (!tab.aRolePresentation) {
            violations.push({
                ...tab,
                raison: "Le tableau de mise en forme ne possède pas l'attribut obligatoire role=\"presentation\"."
            });
            console.log(`  ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} [Critère 5.3] (Tableau ${index + 1}) : Attribut role="presentation" manquant.`);
            tableauEstValide = false;
        } else {
            console.log(`  ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} [Critère 5.3] (Tableau ${index + 1}) : Attribut role="presentation" présent.`);
        }

        // 2️⃣ Vérification IA
        if (tab.texteLinearise && tab.texteLinearise.trim().length > 0) {
            console.log(`  🧠 ANALYSE IA [Critère 5.3] (Tableau ${index + 1}) : Test de la compréhension de la linéarisation...`);
            const prompt = prompt53_Linearisation(tab.texteLinearise, tab.htmlComplet);
            
            try {
                const reponseIA = await askGemma(prompt);
                
                if (reponseIA.statut === "NON_CONFORME") {
                    violations.push({
                        ...tab,
                        raison: reponseIA.explication
                    });
                    console.log(`  ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} [Critère 5.3] (Tableau ${index + 1}) : ${reponseIA.explication}`);
                    tableauEstValide = false;
                } else {
                    console.log(`  ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} [Critère 5.3] (Tableau ${index + 1}) : Linéarisation cohérente.`);
                }
            } catch (e) {
                console.log(`  ⚠️ ATTENTION [Critère 5.3] (Tableau ${index + 1}) : Erreur IA lors de la vérification (${e.message}).`);
                violations.push({ ...tab, raison: "Erreur IA lors de la vérification." });
                tableauEstValide = false;
            }
        } else {
            if (tableauEstValide) {
                console.log(`  ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} [Critère 5.3] (Tableau ${index + 1}) : Tableau sans texte, linéarisation validée d'office.`);
            }
        }

        if (tableauEstValide) {
            nbConformes++;
        }
    }

    // Saut de ligne final pour aérer l'affichage avant de passer à un autre critère
    console.log("");

    if (violations.length > 0) return { statut: "❌ Non Conforme", violations };
    if (nbConformes > 0) return { statut: "✅ Conforme", violations: [] };
    
    return { statut: "➖ Non Applicable (NA)", violations: [] };
}