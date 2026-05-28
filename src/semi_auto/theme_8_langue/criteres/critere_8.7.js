import { COLORS } from '../../../utils/terminalColors.js';
import { askGemma } from '../../utils/ai_helper.js';
import { promptCritere8_7 } from '../prompts.js';

export default async function testerCritere8_7(passagesHTML) {
    console.log(`\n ℹ️  [critere_8.7] Indication des changements de langue (Présence)...`);
    let violations = [];
    let conformites = [];

    if (passagesHTML && passagesHTML.length > 0) {
        console.log(`    🧠 IA : Vérification de la présence de l'attribut pour ${passagesHTML.length} bloc(s) de texte...`);
        const spinnerFrames = ['[ ● ○ ○ ○ ]', '[ ○ ● ○ ○ ]', '[ ○ ○ ● ○ ]', '[ ○ ○ ○ ● ]', '[ ○ ○ ● ○ ]', '[ ○ ● ○ ○ ]'];
        let currentIndex = 1;

        for (const passage of passagesHTML) {
            const extraitHTML = passage.html || passage;
            const prompt = promptCritere8_7(extraitHTML);

// 1️⃣ On crée une variable dynamique pour le texte du Loader
            let texteLoader = `IA en pleine réflexion (${currentIndex}/${passagesHTML.length})...`;

            let i = 0;
            const loaderInterval = setInterval(() => {
                // 2️⃣ Le loader affiche la variable dynamique (qui peut changer à tout moment)
                process.stdout.write(`\r       ${COLORS.BLUE}${spinnerFrames[i]}${COLORS.RESET} ${texteLoader} \x1b[K`);
                i = (i + 1) % spinnerFrames.length;
            }, 150);

            try {
                // 3️⃣ On appelle l'IA en lui passant une fonction fléchée !
                // Si l'IA est surchargée, elle exécutera cette fonction et modifiera "texteLoader"
                const reponseIA = await askGemma(prompt, (nouveauMessage) => {
                    texteLoader = `${COLORS.YELLOW}${nouveauMessage}${COLORS.RESET}`;
                });
                
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K'); 
                
                let textePropre = typeof reponseIA === 'string' ? reponseIA.replace(/\x60\x60\x60json/gi, '').replace(/\x60\x60\x60/g, '').trim() : reponseIA;
                const resultat = typeof textePropre === 'string' ? JSON.parse(textePropre) : textePropre;

                if (resultat && resultat.statut === "NON_CONFORME") {
                    const explication = resultat.explication || "Changement de langue non balisé.";
                    violations.push({ 
                        ...passage, // 👈 INJECTION DES DONNÉES SAAS
                        raison: `[Erreur IA] ${explication}` 
                    });
                    console.log(`       ${COLORS.RED}❌ NON CONFORME${COLORS.RESET} (Bloc ${currentIndex}) : ${explication}`);
                }
                else {
                    // ✅ Correction ici : on utilise une phrase générique ou l'explication de l'IA si elle existe
                    const justification = resultat.explication || "Aucun changement de langue non déclaré détecté.";
                    conformites.push({
                        ...passage, // 👈 INJECTION DES DONNÉES SAAS
                        raison: justification
                    });
                    console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} (Bloc ${currentIndex}) : ${justification}`);
                }
            } catch (e) {
                clearInterval(loaderInterval);
                process.stdout.write('\r\x1b[K');
                console.log(`  ${COLORS.YELLOW}⚠️ Erreur de l'IA (Bloc ${currentIndex})${COLORS.RESET} : ${e.message}`);
            }
            currentIndex++;
        }
    }

// BILAN FINAL
    const nbBlocsTestes = passagesHTML ? passagesHTML.length : 0;

    if (violations.length > 0) {
        return { statut: "❌ NON CONFORME", violations, conformites };
    } 
    // 💡 NOUVEAU : S'il n'y a aucun texte sur la page
    else if (nbBlocsTestes === 0) {
        console.log(`       ➖ NON APPLICABLE : Aucun bloc de texte n'a été détecté pour cette analyse.`);
        return { statut: "➖ NON APPLICABLE", violations: [], conformites: [] };
    } 
    else {
        console.log(`       ${COLORS.GREEN}✅ CONFORME${COLORS.RESET} : Les changements de langue sont bien indiqués.`);
        return { statut: "✅ CONFORME", violations: [], conformites };
    }
}