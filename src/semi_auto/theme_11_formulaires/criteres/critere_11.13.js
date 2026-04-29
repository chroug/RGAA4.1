import { askGemma } from '../../utils/ai_helper.js';
import { promptAutocomplete } from '../prompts.js';

export default async function testerCritere11_13(champsPersos) {
    let resultat = { statut: "➖ Non Applicable (NA)", violations: [] };
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
        const donneesChamp = items[i].toLowerCase();
        
        let labelSeul = donneesChamp.split('| html:')[0]; 
        const labelNettoye = labelSeul.replace(/[:*]/g, '').trim();

        // Extraction (tolère les simples et doubles guillemets)
        const matchAutocomplete = donneesChamp.match(/autocomplete=['"]([^'"]+)['"]/i);
        const valeurTrouvee = matchAutocomplete ? matchAutocomplete[1] : null;

        // ⚡ Moteur Algorithmique
        let resoluParAlgo = false;

        for (const regle of reglesAutomatiques) {
            const correspondanceExacte = regle.motsCles.some(mot => labelNettoye === mot);

            if (correspondanceExacte) {
                resoluParAlgo = true; 

                // L'algo SAIT que c'est une donnée personnelle. On vérifie maintenant l'autocomplete.
                if (valeurTrouvee && valeurTrouvee.includes(regle.attendu)) {
                    console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ✅ Conforme (${regle.attendu})`);
                } else {
                    const raison = !valeurTrouvee ? "Attribut totalement absent" : `Mauvaise valeur (attendu ${regle.attendu}, trouvé ${valeurTrouvee})`;
                    console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ❌ Non Conforme (${raison})`);
                    resultat.statut = "❌ Non Conforme (NC)";
                    resultat.violations.push({ 
                        description: `Le champ "${labelNettoye}" exige un autocomplete="${regle.attendu}". Erreur : ${raison}.`, 
                        html: items[i].replace(/\n/g, ' | ') 
                    });
                }
                break; 
            }
        }

        if (resoluParAlgo) continue;

        // 🧠 Fallback IA (Si l'algo ne connait pas le champ, l'IA décide s'il faut un autocomplete ou non)
        process.stdout.write(`   🧠 [critere_11.13] Analyse IA ${i + 1}/${items.length}... `);
        
        const resIA = await askGemma(promptAutocomplete(items[i]));

        const aUneErreur = resIA.statut === "NON_CONFORME";

        if (aUneErreur) {
            console.log(`❌ Non Conforme (${resIA.explication})`); 
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({ 
                description: `Erreur d'autocomplétion : ${resIA.explication}`, 
                html: items[i].replace(/\n/g, ' | ') 
            });
        } else {
            console.log(`✅ Conforme (${resIA.explication})`);
        }
    }
    return resultat;
}