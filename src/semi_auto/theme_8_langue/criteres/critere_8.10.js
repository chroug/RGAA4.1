import { COLORS } from '../../../utils/terminalColors.js';
import { promptSensLecture } from '../prompts.js';
import { askGemma } from '../../utils/ai_helper.js'; 

export default async function testerCritere8_10(erreursAlgo, suspicionsIA) {
    console.log(`\n ℹ️  [critere_8.10] Analyse du Sens de Lecture...`);
    console.log(`   ⚡ Algo Analyse...`);

    let violations = [];
    let conformites = [];

    // 1️⃣ Ajout direct des erreurs algorithmiques (100% fiables)
    if (erreursAlgo && erreursAlgo.length > 0) {
        erreursAlgo.forEach(err => {
            // 🛡️ Sécurité anti-undefined pour l'algorithme
            const raisonText = err.raison || "Structure HTML non conforme pour l'attribut dir.";
            
            violations.push({
                ...err,
                raison: `[Erreur Algo] ${raisonText}`
            });
            console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} : ${raisonText}`);
        });
    }

    // 2️⃣ Vérification IA des cas suspects (Les hacks visuels)
    if (suspicionsIA && suspicionsIA.length > 0) {
        console.log(`   🧠 IA : ${suspicionsIA.length} élément(s) suspect(s)...`);
        
        // 🚀 NOUVEAU LOADER BEAUCOUP PLUS GROS ET VISIBLE
        const spinnerFrames = ['[ ● ○ ○ ○ ]', '[ ○ ● ○ ○ ]', '[ ○ ○ ● ○ ]', '[ ○ ○ ○ ● ]', '[ ○ ○ ● ○ ]', '[ ○ ● ○ ○ ]'];
        let currentIndex = 1;

        for (const suspicion of suspicionsIA) {
            const prompt = promptSensLecture(suspicion.html, suspicion.texte);
            
            // --- DÉMARRAGE DU LOADER ---
            let i = 0;
            const loaderInterval = setInterval(() => {
                process.stdout.write(`\r       ${COLORS.BLUE}${spinnerFrames[i]}${COLORS.RESET} Analyse en cours (${currentIndex}/${suspicionsIA.length})... `);
                i = (i + 1) % spinnerFrames.length;
            }, 150); // Un peu plus lent pour bien voir le mouvement

            try {
                // 🛠️ VRAI APPEL À L'IA
                const reponseIA = await askGemma(prompt);
                
                // --- ARRÊT DU LOADER ---
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K'); // Nettoie la ligne
                
                // 🛡️ Nettoyage du JSON au cas où l'IA ajoute des balises ```json au début
                let textePropre = reponseIA;
                if (typeof reponseIA === 'string') {
                    textePropre = reponseIA.replace(/```json/gi, '').replace(/```/g, '').trim();
                }

                const resultat = typeof textePropre === 'string' ? JSON.parse(textePropre) : textePropre; 

                if (resultat && resultat.statut === "NON_CONFORME") {
                    
                    // 🛡️ SÉCURITÉ ANTI-UNDEFINED (Si l'IA oublie de donner une explication)
                    const explicationIA = resultat.explication || "L'IA a jugé ce bloc non pertinent (Hack visuel probable sans texte justifiant le rtl).";
                    
                    violations.push({
                        ...suspicion,
                        raison: `[Erreur IA] ${explicationIA}`
                    });
                    
                    console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} : ${explicationIA}`);
                } else if (resultat && resultat.statut === "CONFORME") {
                    // Optionnel : un petit message pour dire que l'IA a validé le bloc
                    conformites.push({
                        ...suspicion,
                        raison: "Bloc suspect justifié et validé par l'IA."
                    });
                    console.log(`       ${COLORS.GREEN}✅ Validation IA${COLORS.RESET} : Bloc suspect justifié (${currentIndex}/${suspicionsIA.length}).`);
                }
            } catch (e) {
                // --- ARRÊT DU LOADER EN CAS D'ERREUR ---
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K'); 
                console.log(`  ${COLORS.YELLOW}⚠️ Erreur de l'IA (ou du JSON)${COLORS.RESET} : Format de réponse invalide.`);
            }
            
            currentIndex++;
        }
    }

    // 3️⃣ Bilan final
    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations, conformites };
    } else {
        if (conformites.length === 0) {
            conformites.push({
                html: "N/A",
                selecteur_css: "N/A",
                xpath: "N/A",
                bounding_box: null,
                raison: "Aucune erreur d'attribut 'dir' ou de texte oriental non balisé n'a été détectée sur la page."
            });
        }
        console.log(`        ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Le sens de lecture est valide et pertinent.`);
        return { statut: "✅ CONFORME", violations: [], conformites };
    }
}