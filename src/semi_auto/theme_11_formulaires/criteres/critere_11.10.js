import { askGemma } from '../../utils/ai_helper.js';
import { promptObligatoire } from '../prompts.js';

export default async function testerCritere11_10(champs11_10) {
    let resultat = { statut: "✅ Conforme (C)", violations: [] };

    if (!champs11_10 || champs11_10.length === 0) {
        return { statut: "➖ Non Applicable (NA)", violations: [] };
    }

    for (let i = 0; i < champs11_10.length; i++) {
        const champ = champs11_10[i];

        // 1. Cas 100% sûrs : Cohérence parfaite entre la technique et le visuel
        if (champ.estRequisTechnique && champ.estRequisVisuel) {
            console.log(`   ⚡ Algo [critere_11.10] Analyse ${i + 1}/${champs11_10.length}... ✅ Conforme (Requis tech et visuel)`);
            continue;
        }
        if (!champ.estRequisTechnique && !champ.estRequisVisuel) {
            console.log(`   ⚡ Algo [critere_11.10] Analyse ${i + 1}/${champs11_10.length}... ✅ Conforme (Champ facultatif)`);
            continue;
        }

        // 2. Cas 100% sûr : Mensonge technique (Visuel obligatoire, mais HTML muet)
        if (!champ.estRequisTechnique && champ.estRequisVisuel) {
            console.log(`   ⚡ Algo [critere_11.10] Analyse ${i + 1}/${champs11_10.length}... ❌ Non Conforme (Manque attribut 'required')`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({
                description: "Le label indique visuellement que le champ est obligatoire (ex: *), mais il manque l'attribut HTML 'required' ou 'aria-required=\"true\"'.",
                html: champ.html
            });
            continue;
        }

        // 3. Fallback IA : Ambiguïté visuelle (Le HTML dit que c'est requis, mais l'algo ne voit pas l'astérisque)
        // L'indication est peut-être formulée autrement ("indispensable", "exigé", etc.)
        process.stdout.write(`   🧠 [critere_11.10] Analyse IA ${i + 1}/${champs11_10.length}... `);
        
        const resIA = await askGemma(promptObligatoire(champ.html));
        
        // On vérifie le statut renvoyé par l'IA
        const aUneErreur = resIA.statut === "NON_CONFORME" || resIA.contient_erreur === true;

        if (aUneErreur) {
            console.log(`❌ Non Conforme (${resIA.explication})`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({
                description: `Champ obligatoire techniquement (required) mais aucune indication visuelle détectée : ${resIA.explication}`,
                html: champ.html
            });
        } else {
            console.log(`✅ Conforme (${resIA.explication})`);
        }
    }

    return resultat;
}