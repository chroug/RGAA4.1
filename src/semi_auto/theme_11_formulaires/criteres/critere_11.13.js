import { askGemma } from '../../utils/ai_helper.js';
import { promptAutocomplete } from '../prompts.js';

export default async function testerCritere11_13(champsPersos) {
    let resultat = { 
        statut: "➖ Non Applicable (NA)", 
        methode_detection: "Semi-Automatique (Gemini 3.1 Flash)",
        violations: [], 
        conformites: []
    };
    if (!champsPersos || champsPersos.length === 0) return resultat;

    resultat.statut = "✅ Conforme (C)";
    const items = champsPersos;

    // 📚 DICTIONNAIRE RÉDUIT (Sûr à 100%)
    const reglesAutomatiques = [
        { motsCles: ["e-mail", "email", "courriel"], attendu: "email" },
        { motsCles: ["téléphone", "telephone", "mobile", "portable", "tél", "tel"], attendu: "tel" },
        { motsCles: ["code postal", "cp"], attendu: "postal-code" },
        { motsCles: ["pays", "country"], attendu: "country" }
    ];

    for (let i = 0; i < items.length; i++) {
        
        // ⚠️ SAAS : On capture l'objet en entier pour ne pas perdre le CSS et XPath !
        const itemSaaS = items[i];
        
        // Si promptData n'existe pas (cas où dom_helpers n'a pas marché), on crée un fallback texte
        const promptDataText = itemSaaS.promptData || `Label visible: ""\nCode HTML: ${itemSaaS.html || ""}`;

        const donneesChamp = promptDataText.toLowerCase();
        
        let labelSeul = donneesChamp.split('\ncode html:')[0].replace('label visible:', ''); 
        const labelNettoye = labelSeul.replace(/[:*"]/g, '').trim();

        const matchAutocomplete = donneesChamp.match(/autocomplete=['"]([^'"]+)['"]/i);
        const valeurTrouvee = matchAutocomplete ? matchAutocomplete[1] : null;

        // ⚡ Moteur Algorithmique
        let resoluParAlgo = false;

        for (const regle of reglesAutomatiques) {
            const correspondanceExacte = regle.motsCles.some(mot => labelNettoye === mot);

            if (correspondanceExacte) {
                resoluParAlgo = true; 

                if (valeurTrouvee && valeurTrouvee.includes(regle.attendu)) {
                    console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ✅ Conforme (${regle.attendu})`);
                    resultat.conformites.push({
                        ...itemSaaS,
                        raison: `Le champ "${labelNettoye}" possède un autocomplete="${regle.attendu}" conforme, détecté par l'algorithme.`
                    });
                } else {
                    const raison = !valeurTrouvee ? "Attribut totalement absent" : `Mauvaise valeur (attendu ${regle.attendu}, trouvé ${valeurTrouvee})`;
                    console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ❌ Non Conforme (${raison})`);
                    resultat.statut = "❌ Non Conforme (NC)";
                    
                    // 🚀 SAAS : INJECTION DE L'OBJET COMPLET
                    resultat.violations.push({ 
                        ...itemSaaS, 
                        raison: `Le champ "${labelNettoye}" exige un autocomplete="${regle.attendu}". Erreur : ${raison}.`
                    });
                }
                break; 
            }
        }

        if (resoluParAlgo) continue;

        // 🧠 Fallback IA
        process.stdout.write(`   🧠 [critere_11.13] Analyse IA ${i + 1}/${items.length}... `);
        
        try {
            const resIABrute = await askGemma(promptAutocomplete(promptDataText));
            
            let resIA = resIABrute;
            if (typeof resIABrute === 'string') {
                const match = resIABrute.match(/\{[\s\S]*\}/);
                if (match) resIA = JSON.parse(match[0]);
            }

            const aUneErreur = resIA.statut === "NON_CONFORME";

            if (aUneErreur) {
                console.log(`❌ Non Conforme (${resIA.explication})`); 
                resultat.statut = "❌ Non Conforme (NC)";
                
                // 🚀 SAAS : INJECTION DE L'OBJET COMPLET
                resultat.violations.push({ 
                    ...itemSaaS,
                    raison: `Erreur d'autocomplétion : ${resIA.explication}`
                });
            } else if (resIA.statut === "NON_APPLICABLE") {
                console.log(`⚪ Non Applicable (${resIA.explication})`);
                resultat.conformites.push({
                    ...itemSaaS,
                    raison: `[11.13] Champ jugé non applicable pour l'autocomplétion par l'IA : ${resIA.explication}`
                });
            } else {
                console.log(`✅ Conforme (${resIA.explication})`);
                resultat.conformites.push({
                    ...itemSaaS,
                    raison: `[11.13] Autocomplétion jugée conforme par l'IA : ${resIA.explication}`
                });
            }
        } catch (error) {
            console.log(`⚠️ Erreur technique IA : ${error.message}`);
        }
    }
    return resultat;
}