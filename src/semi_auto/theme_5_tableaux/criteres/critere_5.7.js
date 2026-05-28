// theme_5_tableaux/criteres/critere_5.7.js

import { askGemma } from '../../utils/ai_helper.js';
import { prompt571_Presence, prompt572_Direction, prompt573_LogiqueID } from '../prompts.js';

export default async function testerCritere5_7(tableaux) {
    let resultat = { statut: "✅ Conforme (C)", violations: [], conformites: [] };

    if (!tableaux || tableaux.length === 0) {
        console.log(`   ➖ Algo [critere_5.7] Analyse... Non Applicable`);
        return { statut: "➖ Non Applicable (NA)", violations: [], conformites: [] };
    }

    for (let i = 0; i < tableaux.length; i++) {
        const table = tableaux[i];
        let tableauEstConforme = true;

        // ÉTAPE 1 ALGO (Vérification syntaxe basique - On garde ça, c'est rapide et gratuit)
        for (let th of table.headers) {
            if (th.aUnScope && !['row', 'col', 'rowgroup', 'colgroup'].includes(th.valeurScope)) {
                console.log(`   ⚡ Algo [critere_5.7] Analyse ${i + 1}/${tableaux.length}... ❌ Non Conforme (Syntaxe scope invalide)`);
                resultat.statut = "❌ Non Conforme (NC)";
                resultat.violations.push({
                    ...table,
                    raison: `L'attribut scope="${th.valeurScope}" n'est pas autorisé.`
                });
                tableauEstConforme = false;
                break; // On arrête l'algo pour ce tableau
            }
        }

        // Si l'algo a déjà trouvé une erreur, pas besoin de déranger l'IA
        if (!tableauEstConforme) continue;

        // ÉTAPE 2 : LA SÉQUENCE IA (Fail-Fast)
        const sequencePrompts = [
            { nom: "Présence (5.7.1)", fonction: prompt571_Presence },
            { nom: "Direction (5.7.2)", fonction: prompt572_Direction },
            { nom: "Logique ID (5.7.3/4)", fonction: prompt573_LogiqueID }
        ];

        for (let etape of sequencePrompts) {
            process.stdout.write(`   🧠 IA [5.7] Test ${etape.nom} ${i + 1}/${tableaux.length}... `);
            
            const prompt = etape.fonction(table.htmlComplet);
            const resIA = await askGemma(prompt);

            if (resIA.statut === "NON_CONFORME") {
                console.log(`❌ Non Conforme (${resIA.explication})`);
                resultat.statut = "❌ Non Conforme (NC)";
                resultat.violations.push({
                    description: `Échec à l'étape ${etape.nom} : ${resIA.explication}`,
                    html: table.htmlComplet 
                });
                tableauEstConforme = false;
                break; // 🛑 FAIL-FAST : On sort de la boucle des prompts, ce tableau est recalé !
            } else {
                console.log(`✅ Ok`);
            }
        }
    }

    return resultat;
}