import { askGemma } from '../../utils/ai_helper.js';
import { promptRegroupement } from '../prompts.js';

export default async function testerCritere11_5(champs11_5) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };

    if (!champs11_5 || champs11_5.length === 0) {
        return { statut: "➖ Non Applicable (NA)", violations: [] };
    }

    for (let i = 0; i < champs11_5.length; i++) {
        const champ = champs11_5[i];

        // 1. Cas 100% sûr : Le champ est bien dans un fieldset/group
        if (champ.estBienGroupe) {
            console.log(`   ⚡ Algo [critere_11.5] Analyse ${i + 1}/${champs11_5.length}... ✅ Conforme (Groupement détecté)`);
            continue;
        }

        // 2. Fallback IA : Le champ n'est PAS groupé. Mais est-ce vraiment nécessaire ?
        // C'est ici que l'IA va vérifier si c'est une case CGU isolée ou une vraie erreur.
        process.stdout.write(`   🧠 [critere_11.5] Analyse IA ${i + 1}/${champs11_5.length}... `);

        const resIA = await askGemma(promptRegroupement(champ.html));

        // On vérifie le statut renvoyé par l'IA
        const aUneErreur = resIA.statut === "NON_CONFORME" || resIA.contient_erreur === true;

        if (aUneErreur) {
            console.log(`❌ Non Conforme (${resIA.explication})`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({
                description: `Groupement manquant sur un champ qui le nécessite : ${resIA.explication}`,
                html: champ.html
            });
        } else {
            console.log(`✅ Conforme (${resIA.explication})`);
        }
    }

    return resultat;
}