import { askGemma } from '../../utils/ai_helper.js';
import { promptAutocomplete } from '../prompts.js';

export default async function testerCritere11_13(champsPersos) {
    let resultat = { statut: "➖ Non Applicable (NA)", violations: [] };
    if (!champsPersos || champsPersos.length === 0) return resultat;

    resultat.statut = "✅ Conforme (C)";
    const items = champsPersos;

    // 📚 DICTIONNAIRE RÉDUIT (Uniquement les cas 100% sans ambiguïté)
    const reglesAutomatiques = [
        { motsCles: ["e-mail", "email", "courriel"], attendu: "email" },
        { motsCles: ["téléphone", "telephone", "mobile", "portable", "tél", "tel"], attendu: "tel" },
        { motsCles: ["code postal", "cp"], attendu: "postal-code" },
        { motsCles: ["pays", "country"], attendu: "country" }
    ];

    for (let i = 0; i < items.length; i++) {
        const donneesChamp = items[i].toLowerCase();
        
        // CORRECTION : On isole et on nettoie le texte du Label (on enlève les : et les *)
        let labelSeul = donneesChamp.split('| html:')[0]; 
        const labelNettoye = labelSeul.replace(/[:*]/g, '').trim();

        // Extraction propre de la valeur de l'autocomplete via Regex
        const matchAutocomplete = donneesChamp.match(/autocomplete="([^"]+)"/);
        const valeurTrouvee = matchAutocomplete ? matchAutocomplete[1] : null;

        // 1. Coupe-circuit Algo : Attribut totalement absent (Sûr à 100%)
        if (!valeurTrouvee) {
            console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ❌ Non Conforme (Absent)`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({ 
                description: "L'attribut 'autocomplete' est totalement absent sur un champ personnel.", 
                html: items[i].replace(/\n/g, ' | ') 
            });
            continue; 
        }

        // 2. Moteur Algorithmique ULTRA-STRICT (Sûr à 100% uniquement)
        let resoluParAlgo = false;

        for (const regle of reglesAutomatiques) {
            // NOUVEAU : Correspondance EXACTE requise. 
            // Si le label est "votre email", ça ira à l'IA. Si c'est juste "email", l'algo le gère.
            const correspondanceExacte = regle.motsCles.some(mot => labelNettoye === mot);

            if (correspondanceExacte) {
                resoluParAlgo = true; // L'algo est sûr à 100%, il prend le relais

                if (valeurTrouvee.includes(regle.attendu)) {
                    console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ✅ Conforme (${regle.attendu})`);
                } else {
                    console.log(`   ⚡ Algo [critere_11.13] Analyse ${i + 1}/${items.length}... ❌ Non Conforme (Erreur : attendu ${regle.attendu}, trouvé ${valeurTrouvee})`);
                    resultat.statut = "❌ Non Conforme (NC)";
                    resultat.violations.push({ 
                        description: `Valeur autocomplete incorrecte. Attendu : "${regle.attendu}", Trouvé : "${valeurTrouvee}".`, 
                        html: items[i].replace(/\n/g, ' | ') 
                    });
                }
                break; 
            }
        }

        if (resoluParAlgo) continue; // Si l'algo a géré (car c'était un match parfait), on passe au champ suivant !

        // 3. Fallback IA (Pour la majorité des champs : phrases, contextes ambigus, etc.)
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