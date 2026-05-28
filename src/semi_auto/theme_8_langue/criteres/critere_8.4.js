import { askGemma } from '../../utils/ai_helper.js';
import { promptLanguePrincipale } from '../prompts.js';

// ⚡ ALGORITHME : Vérification stricte de la norme ISO
function isCodeLangueValide(lang) {
    if (!lang) return false;
    const isoLangRegex = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)*$/;
    return isoLangRegex.test(lang);
}

export default async function testerCritere8_4(data) {
    let resultat = { statut: "➖ Non Applicable (NA)", violations: [], conformites: [] };

    if (!data.langueDefaut) {
        console.log(`   ⚡ Algo [critere_8.4] Analyse... ❌ Non Conforme (Balise absente)`);
        resultat.statut = "❌ Non Conforme (NC)";
        resultat.violations.push({ 
            html: "<html>", selecteur_css: "html", xpath: "/html", bounding_box: null,
            raison: "La balise <html> ne possède aucun attribut 'lang'." 
        });
    } 
    else if (!isCodeLangueValide(data.langueDefaut)) {
        console.log(`   ⚡ Algo [critere_8.4] Analyse... ❌ Non Conforme (Code Invalide)`);
        resultat.statut = "❌ Non Conforme (NC)";
        resultat.violations.push({ 
            html: `<html lang="${data.langueDefaut}">`, selecteur_css: "html", xpath: "/html", bounding_box: null,
            raison: `Le code "${data.langueDefaut}" n'est pas valide.` 
        });
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
                html: `<html lang="${data.langueDefaut}">`, selecteur_css: "html", xpath: "/html", bounding_box: null,
                raison: `Le code déclaré est '${data.langueDefaut}' mais l'IA a détecté que le texte est en '${codeTrouve}'. Détail : ${resIA.explication}` 
            });
        } else {
            console.log(`✅ Conforme (${codeTrouve})`);
            resultat.statut = "✅ Conforme (C)";
            resultat.conformites.push({
                html: `<html lang="${data.langueDefaut}">`, selecteur_css: "html", xpath: "/html", bounding_box: null,
                raison: `Langue principale détectée : ${codeTrouve} (Code déclaré : ${data.langueDefaut}).`
            });
        }
    }

    return resultat;
}