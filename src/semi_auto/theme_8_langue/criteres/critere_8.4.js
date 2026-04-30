import { askGemma } from '../../utils/ai_helper.js';
import { promptLanguePrincipale } from '../prompts.js';

// ⚡ ALGORITHME : Vérification stricte de la norme ISO
function isCodeLangueValide(lang) {
    if (!lang) return false;
    const isoLangRegex = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/;
    return isoLangRegex.test(lang);
}

export default async function testerCritere8_4(data) {
    let resultat = { statut: "➖ Non Applicable (NA)", violations: [] };

    if (!data.langueDefaut) {
        console.log(`   ⚡ Algo [critere_8.4] Analyse... ❌ Non Conforme (Balise absente)`);
        resultat.statut = "❌ Non Conforme (NC)";
        resultat.violations.push({ description: "La balise <html> ne possède aucun attribut 'lang'.", html: "<html>" });
    } 
    else if (!isCodeLangueValide(data.langueDefaut)) {
        console.log(`   ⚡ Algo [critere_8.4] Analyse... ❌ Non Conforme (Code Invalide)`);
        resultat.statut = "❌ Non Conforme (NC)";
        resultat.violations.push({ description: `Le code "${data.langueDefaut}" n'est pas valide.`, html: `<html lang="${data.langueDefaut}">` });
    } 
    else if (data.textePrincipal.length > 50) {
        process.stdout.write(`   🧠 [critere_8.4] Détection de langue IA... `);
        
        // Appel au dictionnaire
        const resIA = await askGemma(promptLanguePrincipale(data.textePrincipal));
        
        const codeTrouve = resIA.code_iso_detecte ? resIA.code_iso_detecte.toLowerCase() : "";
        const codeAttendu = data.langueDefaut.toLowerCase().split('-')[0];
        
        if (codeTrouve !== codeAttendu) {
            console.log(`❌ Non Conforme (Trouvé: ${codeTrouve}, Attendu: ${codeAttendu})`);
            resultat.statut = "❌ Non Conforme (NC)";
            resultat.violations.push({ 
                description: `Le code déclaré est '${data.langueDefaut}' mais l'IA a détecté que le texte est en '${codeTrouve}'. Détail : ${resIA.explication}`, 
                html: `<html lang="${data.langueDefaut}">` 
            });
        } else {
            console.log(`✅ Conforme (${codeTrouve})`);
            resultat.statut = "✅ Conforme (C)";
        }
    }

    return resultat;
}